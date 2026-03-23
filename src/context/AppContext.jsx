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
    case 'SET_ARCHIVED':
      return { ...state, archivedDesligamentos: action.payload, loading: false };
    case 'ADD_DESLIGAMENTO':
      return { ...state, desligamentos: [...state.desligamentos, action.payload] };
    case 'UPDATE_DESLIGAMENTO': {
      const updated = action.payload;
      return {
        ...state,
        desligamentos: state.desligamentos.map(d => d.id === updated.id ? updated : d),
        archivedDesligamentos: state.archivedDesligamentos ? state.archivedDesligamentos.map(d => d.id === updated.id ? updated : d) : [],
      };
    }
    // Optimistic: inverte o item localmente SEM esperar o servidor
    case 'TOGGLE_CHECKLIST_OPTIMISTIC': {
      const now = new Date().toISOString();
      const updateList = (list) => list.map(d => {
        if (d.id !== action.desligamentoId) return d;
        return {
          ...d,
          checklist: d.checklist.map(c => {
            if (c.id !== action.itemId) return c;
            const newDone = !c.done;
            // Se estiver concluindo, desmarca N/A se houver
            return { 
              ...c, 
              done: newDone, 
              doneAt: newDone ? now : null,
              notApplicable: newDone ? false : c.notApplicable
            };
          }),
        };
      });
      return {
        ...state,
        desligamentos: updateList(state.desligamentos),
        archivedDesligamentos: state.archivedDesligamentos ? updateList(state.archivedDesligamentos) : [],
      };
    }
    case 'TOGGLE_NAO_APLICAVEL_OPTIMISTIC': {
      const updateList = (list) => list.map(d => {
        if (d.id !== action.desligamentoId) return d;
        return {
          ...d,
          checklist: d.checklist.map(c => {
            if (c.id !== action.itemId) return c;
            const newNA = !c.notApplicable;
            return { 
              ...c, 
              notApplicable: newNA,
              done: newNA ? false : c.done,
              doneAt: newNA ? null : c.doneAt
            };
          }),
        };
      });
      return {
        ...state,
        desligamentos: updateList(state.desligamentos),
        archivedDesligamentos: state.archivedDesligamentos ? updateList(state.archivedDesligamentos) : [],
      };
    }
    case 'ARCHIVE_DESLIGAMENTO':
      return {
        ...state,
        desligamentos: state.desligamentos.filter(d => d.id !== action.payload.id),
        archivedDesligamentos: [action.payload, ...(state.archivedDesligamentos || [])],
      };
    case 'UNARCHIVE_DESLIGAMENTO':
      return {
        ...state,
        archivedDesligamentos: (state.archivedDesligamentos || []).filter(d => d.id !== action.payload.id),
        desligamentos: [action.payload, ...state.desligamentos],
      };
    case 'DELETE_DESLIGAMENTO':
      return {
        ...state,
        desligamentos: state.desligamentos.filter(d => d.id !== action.id),
        archivedDesligamentos: (state.archivedDesligamentos || []).filter(d => d.id !== action.id),
      };
    case 'ARCHIVE_MULTIPLE': {
      const archivedIds = action.payload.map(d => d.id);
      return {
        ...state,
        desligamentos: state.desligamentos.filter(d => !archivedIds.includes(d.id)),
        archivedDesligamentos: [...action.payload, ...(state.archivedDesligamentos || [])],
      };
    }
    case 'DELETE_MULTIPLE':
      return {
        ...state,
        desligamentos: state.desligamentos.filter(d => !action.ids.includes(d.id)),
        archivedDesligamentos: (state.archivedDesligamentos || []).filter(d => !action.ids.includes(d.id)),
      };

    case 'SET_USER':
      return { ...state, user: action.payload };
    case 'LOGOUT':
      return { ...state, user: null, desligamentos: [], archivedDesligamentos: [] };
    // UI
    case 'SET_VIEW':
      return { ...state, view: action.view };
    case 'SET_SELECTED':
      return { ...state, selected: action.id };
    case 'SET_GLOBAL_COLIGADA_FILTER':
      return { ...state, globalColigadaFilter: action.payload };
    case 'SET_LOADING':
      return { ...state, loading: action.value };
    case 'SET_ERROR':
      return { ...state, error: action.message };
    case 'CLEAR_ERROR':
      return { ...state, error: null };

    // Auth
    case 'LOGIN':
      localStorage.setItem('desligest_auth_user', JSON.stringify(action.payload));
      return { ...state, user: action.payload };
    case 'LOGOUT':
      localStorage.removeItem('desligest_auth_user');
      return { ...state, user: null };

    // Notificações
    case 'SET_NOTIFICATIONS':
      return { ...state, notifications: action.payload };
    case 'MARK_NOTIFICATION_READ':
      return { 
        ...state, 
        readNotificationIds: [...state.readNotificationIds, action.id],
        notifications: state.notifications.map(n => n.id === action.id ? { ...n, read: true } : n)
      };

    default:
      return state;
  }
}

// ─── Provider ─────────────────────────────────────────────────────────────
export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, {
    user: null,
    isAuthChecked: false,
    desligamentos: [],
    archivedDesligamentos: [],
    view: 'lista',
    selected: null,
    globalColigadaFilter: 'todas',
    loading: true,
    error: null,
    // Modo offline: true = usa localStorage como fallback
    offline: false,
    notifications: [],
    readNotificationIds: JSON.parse(localStorage.getItem('readNotificationIds') || '[]'),
  });

  // ── Carrega lista ao montar ──────────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', value: true });
    try {
      const data = await api.getDesligamentos({ arquivado: false });
      dispatch({ type: 'SET_DESLIGAMENTOS', payload: data });

      // Se chegou dados do MongoDB, garante modo online
      dispatch({ type: 'SET_ERROR', message: null });
    } catch (err) {
      console.warn('[AppContext] API indisponível, usando localStorage como fallback.', err.message);
      // Fallback: carrega do localStorage se a API falhar
      const saved = loadFromStorage();
      dispatch({ type: 'SET_DESLIGAMENTOS', payload: saved.filter(d => !d.arquivado) });
      dispatch({
        type: 'SET_ERROR',
        message: '⚠️ API offline — dados carregados do cache local. Conecte o servidor para salvar alterações no banco.',
      });
    } finally {
      dispatch({ type: 'SET_LOADING', value: false });
    }
  }, []);

  const fetchArchived = useCallback(async (searchQuery = '') => {
    dispatch({ type: 'SET_LOADING', value: true });
    try {
      const data = await api.getDesligamentos({ arquivado: true, q: searchQuery });
      dispatch({ type: 'SET_ARCHIVED', payload: data });
    } catch (err) {
      console.warn('[AppContext] Falha ao buscar arquivados da API, tentando localStorage.', err.message);
      const saved = loadFromStorage();
      const filtered = saved.filter(d => d.arquivado);
      
      // Aplicar busca simples local se houver query
      const searchTerm = searchQuery.toLowerCase();
      const results = searchQuery 
        ? filtered.filter(d => 
            d.nome?.toLowerCase().includes(searchTerm) ||
            d.cargo?.toLowerCase().includes(searchTerm) ||
            d.matricula?.toLowerCase().includes(searchTerm) ||
            d.departamento?.toLowerCase().includes(searchTerm)
          ) 
        : filtered;

      dispatch({ type: 'SET_ARCHIVED', payload: results });
      dispatch({ type: 'SET_ERROR', message: '⚠️ Servidor offline — carregando arquivados do cache local.' });
    } finally {
      dispatch({ type: 'SET_LOADING', value: false });
    }
  }, []);

  const checkAuthStatus = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const user = await api.checkAuth();
        dispatch({ type: 'SET_USER', payload: user });
      } catch (err) {
        localStorage.removeItem('token');
      }
    }
  }, []);

  useEffect(() => { checkAuthStatus(); }, [checkAuthStatus]);

  useEffect(() => {
    if (state.user) {
      fetchAll();
    }
  }, [state.user, fetchAll]);

  useEffect(() => {
    // Persiste no localStorage sempre que houver novos dados para garantir o modo offline
    if (state.desligamentos.length > 0 || state.archivedDesligamentos.length > 0) {
      saveToStorage([...state.desligamentos, ...state.archivedDesligamentos]);
    }
  }, [state.desligamentos, state.archivedDesligamentos]);

  // IDs já notificados nativamente nesta sessão para evitar spam
  const notifiedSessionIds = React.useRef(new Set());

  // ── Notificações ────────────────────────────────────────────────────────
  useEffect(() => {
    localStorage.setItem('readNotificationIds', JSON.stringify(state.readNotificationIds));
  }, [state.readNotificationIds]);

  const generateNotifications = useCallback(() => {
    const { desligamentos, readNotificationIds } = state;
    if (!desligamentos || !desligamentos.length) return;

    const now = new Date();
    // Normalizar 'agora' para ser 00:00:00 para comparação de dias inteiros
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    const newNotifications = [];

    desligamentos.forEach(d => {
      // Ignorar processos já pagos ou cancelados
      if (d.status === 'pago' || d.status === 'cancelado' || !d.dataPagamento) return;

      const [year, month, day] = d.dataPagamento.split('-').map(Number);
      const paymentDate = new Date(year, month - 1, day);
      
      const diffTime = paymentDate - today;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      let type = '';
      let message = '';
      let severity = '';

      if (diffDays < 0) {
        type = 'vencido';
        message = `O prazo de pagamento de ${d.nome} venceu em ${day}/${month}.`;
        severity = 'error';
      } else if (diffDays === 0) {
        type = 'vence_hoje';
        message = `O prazo de pagamento de ${d.nome} vence hoje!`;
        severity = 'warning';
      } else if (diffDays <= 3) {
        type = 'proximo';
        message = `Faltam ${diffDays} dias para o pagamento de ${d.nome}.`;
        severity = 'info';
      }

      if (type) {
        const notifId = `${d.id}-${type}`;
        newNotifications.push({
          id: notifId,
          desligamentoId: d.id,
          type,
          message,
          severity,
          date: new Date().toISOString(),
          read: readNotificationIds.includes(notifId)
        });
      }
    });

    // Só atualiza se houver mudança real para evitar loops
    dispatch({ type: 'SET_NOTIFICATIONS', payload: newNotifications });

    // Tentar notificação nativa para itens não lidos e não notificados nesta sessão
    if (Notification.permission === 'granted') {
      newNotifications.forEach(n => {
        if (!n.read && !notifiedSessionIds.current.has(n.id)) {
          new Notification('Alerta de Prazo', {
            body: n.message,
            icon: '/vite.svg'
          });
          notifiedSessionIds.current.add(n.id);
        }
      });
    }
  }, [state.desligamentos, state.readNotificationIds]);

  useEffect(() => {
    generateNotifications();
  }, [state.desligamentos, state.readNotificationIds]);

  function markNotificationRead(id) {
    dispatch({ type: 'MARK_NOTIFICATION_READ', id });
  }

  function requestNotificationPermission() {
    if ('Notification' in window) {
      Notification.requestPermission();
    }
  }

  // ── Ações (chamam a API e atualizam estado local com a resposta) ─────────

  async function addDesligamento(formData) {
    try {
      const doc = await api.createDesligamento(formData);
      dispatch({ type: 'ADD_DESLIGAMENTO', payload: doc });
      return doc;
    } catch (err) {
      console.warn('[AppContext] API offline — criando registro localmente.', err.message);
      const localDoc = { 
        ...formData, 
        id: 'local-' + Date.now(),
        checklist: formData.checklist || [],
        historico: formData.historico || [],
        arquivado: false 
      };
      dispatch({ type: 'ADD_DESLIGAMENTO', payload: localDoc });
      dispatch({ type: 'SET_ERROR', message: '⚠️ Servidor offline — processo criado apenas localmente neste navegador.' });
      return localDoc;
    }
  }

  async function updateDesligamento(data) {
    try {
      const doc = await api.updateDesligamento(data.id, data);
      dispatch({ type: 'UPDATE_DESLIGAMENTO', payload: doc });
      return doc;
    } catch (err) {
      console.warn('[AppContext] API offline — atualizando registro localmente.', err.message);
      dispatch({ type: 'UPDATE_DESLIGAMENTO', payload: data });
      dispatch({ type: 'SET_ERROR', message: '⚠️ Servidor offline — alteração salva apenas localmente.' });
      return data;
    }
  }

  async function archiveDesligamento(id) {
    const desligamento = state.desligamentos.find(d => d.id === id);
    if (!desligamento) return;
    
    const historyEntry = {
      data: format(new Date(), "yyyy-MM-dd'T'HH:mm:ss"),
      acao: 'Processo arquivado',
      nota: '',
    };
    
    const updated = { 
      ...desligamento, 
      arquivado: true,
      historico: [...(desligamento.historico || []), historyEntry]
    };

    try {
      const doc = await api.updateDesligamento(id, updated);
      dispatch({ type: 'ARCHIVE_DESLIGAMENTO', payload: doc });
    } catch (err) {
      console.warn('[AppContext] API offline — arquivando localmente.', err.message);
      dispatch({ type: 'ARCHIVE_DESLIGAMENTO', payload: updated });
      dispatch({ type: 'SET_ERROR', message: '⚠️ Servidor offline — arquivado localmente.' });
    }
  }

  async function unarchiveDesligamento(id) {
    const desligamento = state.archivedDesligamentos.find(d => d.id === id);
    if (!desligamento) return;

    const historyEntry = {
      data: format(new Date(), "yyyy-MM-dd'T'HH:mm:ss"),
      acao: 'Processo reativado',
      nota: '',
    };

    const updated = { 
      ...desligamento, 
      arquivado: false,
      historico: [...(desligamento.historico || []), historyEntry]
    };

    try {
      const doc = await api.updateDesligamento(id, updated);
      dispatch({ type: 'UNARCHIVE_DESLIGAMENTO', payload: doc });
    } catch (err) {
      console.warn('[AppContext] API offline — reativando localmente.', err.message);
      dispatch({ type: 'UNARCHIVE_DESLIGAMENTO', payload: updated });
      dispatch({ type: 'SET_ERROR', message: '⚠️ Servidor offline — reativado localmente.' });
    }
  }

  async function deleteDesligamento(id) {
    try {
      await api.deleteDesligamento(id);
      dispatch({ type: 'DELETE_DESLIGAMENTO', id });
    } catch (err) {
      console.warn('[AppContext] API offline — excluindo registro localmente.', err.message);
      dispatch({ type: 'DELETE_DESLIGAMENTO', id });
      dispatch({ type: 'SET_ERROR', message: '⚠️ Servidor offline — item removido apenas localmente.' });
    }
  }

  async function bulkArchive(ids) {
    try {
      const res = await api.bulkArchive(ids);
      dispatch({ type: 'ARCHIVE_MULTIPLE', payload: res.docs });
    } catch (err) {
      console.warn('[AppContext] API offline — arquivando em lote localmente.', err.message);
      const now = format(new Date(), "yyyy-MM-dd'T'HH:mm:ss");
      const toArchive = state.desligamentos
        .filter(d => ids.includes(d.id) && (d.status === 'pago' || d.status === 'cancelado'))
        .map(d => ({
          ...d,
          arquivado: true,
          historico: [...(d.historico || []), { data: now, acao: 'Arquivado em lote (offline)', nota: '' }]
        }));
      
      dispatch({ type: 'ARCHIVE_MULTIPLE', payload: toArchive });
      dispatch({ type: 'SET_ERROR', message: `⚠️ Servidor offline — ${toArchive.length} itens arquivados localmente.` });
    }
  }

  async function bulkDelete(ids) {
    try {
      await api.bulkDelete(ids);
      dispatch({ type: 'DELETE_MULTIPLE', ids });
    } catch (err) {
      console.warn('[AppContext] API offline — excluindo em lote localmente.', err.message);
      dispatch({ type: 'DELETE_MULTIPLE', ids });
      dispatch({ type: 'SET_ERROR', message: '⚠️ Servidor offline — itens excluídos apenas localmente.' });
    }
  }

  async function toggleChecklist(desligamentoId, itemId) {
    // 1. Atualiza a UI imediatamente (optimistic update)
    dispatch({ type: 'TOGGLE_CHECKLIST_OPTIMISTIC', desligamentoId, itemId });

    try {
      // 2. Sincroniza com o servidor em segundo plano
      const doc = await api.toggleChecklistItem(desligamentoId, itemId);
      // 3. Confirma com os dados reais do servidor (ex: doneAt preciso)
      dispatch({ type: 'UPDATE_DESLIGAMENTO', payload: doc });
      return doc;
    } catch (err) {
      // 4. Reverte o estado se falhar
      dispatch({ type: 'TOGGLE_CHECKLIST_OPTIMISTIC', desligamentoId, itemId });
      dispatch({ type: 'SET_ERROR', message: `Erro no checklist: ${err.message}` });
      throw err;
    }
  }

  async function toggleNaoAplicavel(desligamentoId, itemId) {
    // Optimistic update
    dispatch({ type: 'TOGGLE_NAO_APLICAVEL_OPTIMISTIC', desligamentoId, itemId });

    try {
      const doc = await api.toggleChecklistNaoAplicavel(desligamentoId, itemId);
      dispatch({ type: 'UPDATE_DESLIGAMENTO', payload: doc });
      return doc;
    } catch (err) {
      dispatch({ type: 'TOGGLE_NAO_APLICAVEL_OPTIMISTIC', desligamentoId, itemId });
      dispatch({ type: 'SET_ERROR', message: `Erro ao marcar N/A: ${err.message}` });
      throw err;
    }
  }

  async function addHistorico(desligamentoId, entry) {
    try {
      const doc = await api.addHistorico(desligamentoId, entry);
      dispatch({ type: 'UPDATE_DESLIGAMENTO', payload: doc });
      return doc;
    } catch (err) {
      console.warn('[AppContext] API offline — adicionando histórico localmente.', err.message);
      const d = state.desligamentos.find(x => x.id === desligamentoId) || state.archivedDesligamentos?.find(x => x.id === desligamentoId);
      if (d) {
        const updated = { ...d, historico: [...(d.historico || []), entry] };
        dispatch({ type: 'UPDATE_DESLIGAMENTO', payload: updated });
        return updated;
      }
      dispatch({ type: 'SET_ERROR', message: `Erro ao registrar histórico: ${err.message}` });
      throw err;
    }
  }

  async function changeStatus(desligamento, newStatus) {
    const historyEntry = {
      data: format(new Date(), "yyyy-MM-dd'T'HH:mm:ss"),
      acao: `Status alterado para: ${newStatus}`,
      nota: '',
    };
    const updated = { 
      ...desligamento, 
      status: newStatus,
      historico: [...(desligamento.historico || []), historyEntry]
    };
    await updateDesligamento(updated);
  }

  // ── Auth Actions ────────────────────────────────────────────────────────
  async function login(email, password) {
    const res = await api.login(email, password);
    localStorage.setItem('token', res.token);
    dispatch({ type: 'SET_USER', payload: res.user });
  }

  async function register(name, email, password) {
    const res = await api.register(name, email, password);
    localStorage.setItem('token', res.token);
    dispatch({ type: 'SET_USER', payload: res.user });
  }

  function logout() {
    localStorage.removeItem('token');
    dispatch({ type: 'LOGOUT' });
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
      fetchArchived,
      addDesligamento,
      updateDesligamento,
      archiveDesligamento,
      unarchiveDesligamento,
      deleteDesligamento,
      bulkArchive,
      bulkDelete,
      toggleChecklist,
      toggleNaoAplicavel,
      markNotificationRead,
      requestNotificationPermission,
      addHistorico,
      changeStatus,
      login,
      register,
      logout,
      importDesligamentos: async (data) => {
        try {
          const res = await api.importDesligamentos(data);
          await fetchAll(); // Recarrega tudo para garantir sincronia
          return res;
        } catch (err) {
          dispatch({ type: 'SET_ERROR', message: `Erro na importação: ${err.message}` });
          throw err;
        }
      },
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

function saveToStorage(data) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(data));
  } catch (err) {
    console.warn('[AppContext] Erro ao salvar no localStorage', err);
  }
}
