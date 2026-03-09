import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import * as api from '../services/api';
import { format } from 'date-fns';

const AppContext = createContext();

// ─── Reducer ──────────────────────────────────────────────────────────────
// O reducer agora gerencia apenas estado local de UI e os dados já
// processados pela API. Mutações reais acontecem na API, e o resultado
// retornado da API é o que atualiza o estado local.

function reducer(state, action) {
  switch (action.type) {
    // Dados
    case 'SET_DESLIGAMENTOS':
      return { ...state, desligamentos: action.payload, loading: false };
    case 'ADD_DESLIGAMENTO':
      return { ...state, desligamentos: [...state.desligamentos, action.payload] };
    case 'UPDATE_DESLIGAMENTO':
      return {
        ...state,
        desligamentos: state.desligamentos.map(d =>
          d.id === action.payload.id ? action.payload : d
        ),
      };
    case 'DELETE_DESLIGAMENTO':
      return { ...state, desligamentos: state.desligamentos.filter(d => d.id !== action.id) };

    // UI
    case 'SET_VIEW':
      return { ...state, view: action.view };
    case 'SET_SELECTED':
      return { ...state, selected: action.id };
    case 'SET_LOADING':
      return { ...state, loading: action.value };
    case 'SET_ERROR':
      return { ...state, error: action.message };
    case 'CLEAR_ERROR':
      return { ...state, error: null };

    default:
      return state;
  }
}

// ─── Provider ─────────────────────────────────────────────────────────────
export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, {
    desligamentos: [],
    view: 'lista',
    selected: null,
    loading: true,
    error: null,
    // Modo offline: true = usa localStorage como fallback
    offline: false,
  });

  // ── Carrega lista ao montar ──────────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', value: true });
    try {
      const data = await api.getDesligamentos();
      dispatch({ type: 'SET_DESLIGAMENTOS', payload: data });

      // Se chegou dados do MongoDB, garante modo online
      dispatch({ type: 'SET_ERROR', message: null });
    } catch (err) {
      console.warn('[AppContext] API indisponível, usando localStorage como fallback.', err.message);
      // Fallback: carrega do localStorage se a API falhar
      const saved = loadFromStorage();
      dispatch({ type: 'SET_DESLIGAMENTOS', payload: saved });
      dispatch({
        type: 'SET_ERROR',
        message: '⚠️ API offline — dados carregados do cache local. Conecte o servidor para salvar alterações no banco.',
      });
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── Ações (chamam a API e atualizam estado local com a resposta) ─────────

  async function addDesligamento(formData) {
    try {
      const doc = await api.createDesligamento(formData);
      dispatch({ type: 'ADD_DESLIGAMENTO', payload: doc });
      return doc;
    } catch (err) {
      dispatch({ type: 'SET_ERROR', message: `Erro ao criar: ${err.message}` });
      throw err;
    }
  }

  async function updateDesligamento(data) {
    try {
      const doc = await api.updateDesligamento(data.id, data);
      dispatch({ type: 'UPDATE_DESLIGAMENTO', payload: doc });
      return doc;
    } catch (err) {
      dispatch({ type: 'SET_ERROR', message: `Erro ao atualizar: ${err.message}` });
      throw err;
    }
  }

  async function deleteDesligamento(id) {
    try {
      await api.deleteDesligamento(id);
      dispatch({ type: 'DELETE_DESLIGAMENTO', id });
    } catch (err) {
      dispatch({ type: 'SET_ERROR', message: `Erro ao excluir: ${err.message}` });
      throw err;
    }
  }

  async function toggleChecklist(desligamentoId, itemId) {
    try {
      const doc = await api.toggleChecklistItem(desligamentoId, itemId);
      dispatch({ type: 'UPDATE_DESLIGAMENTO', payload: doc });
      return doc;
    } catch (err) {
      dispatch({ type: 'SET_ERROR', message: `Erro no checklist: ${err.message}` });
      throw err;
    }
  }

  async function addHistorico(desligamentoId, entry) {
    try {
      const doc = await api.addHistorico(desligamentoId, entry);
      dispatch({ type: 'UPDATE_DESLIGAMENTO', payload: doc });
      return doc;
    } catch (err) {
      dispatch({ type: 'SET_ERROR', message: `Erro ao registrar histórico: ${err.message}` });
      throw err;
    }
  }

  async function changeStatus(desligamento, newStatus) {
    const updated = { ...desligamento, status: newStatus };
    const doc = await updateDesligamento(updated);
    await addHistorico(doc.id, {
      data: format(new Date(), "yyyy-MM-dd'T'HH:mm:ss"),
      acao: `Status alterado para: ${newStatus}`,
      nota: '',
    });
  }

  // Mantém compatibilidade com o dispatch direto p/ navegação de UI
  const uiDispatch = (action) => {
    if (['SET_VIEW', 'SET_SELECTED', 'CLEAR_ERROR'].includes(action.type)) {
      dispatch(action);
    }
  };

  const value = {
    state,
    dispatch: uiDispatch,
    actions: {
      fetchAll,
      addDesligamento,
      updateDesligamento,
      deleteDesligamento,
      toggleChecklist,
      addHistorico,
      changeStatus,
    },
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useApp() {
  return useContext(AppContext);
}

// ─── Helpers localStorage (fallback offline) ──────────────────────────────
const LS_KEY = 'desligest_cache_v2';

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}
