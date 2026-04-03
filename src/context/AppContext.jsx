import React, { createContext, useContext, useReducer, useEffect, useCallback, useMemo, useRef, useState } from 'react';
import * as api from '../services/api';
import { format } from 'date-fns';
import { 
  DEFAULT_COLIGADAS, 
  DEFAULT_MOTIVOS, 
  DEFAULT_STATUS_FLOW, 
  DEFAULT_CHECKLIST_TEMPLATE, 
  DEFAULT_LINKS_UTEIS 
} from '../data/initialData';

const AppContext = createContext();

// ─── Reducer ──────────────────────────────────────────────────────────────
// O reducer agora gerencia apenas estado local de UI e os dados já
// processados pela API. Mutações reais acontecem na API, e o resultado
// retornado da API é o que atualiza o estado local.

function reducer(state, action) {
  // Defensive guard: ensure arrays are ALWAYS defined before any .map()/.filter()
  const s = {
    ...state,
    desligamentos: state.desligamentos || [],
    archivedDesligamentos: state.archivedDesligamentos || [],
    notifications: state.notifications || [],
    readNotificationIds: state.readNotificationIds || [],
  };
  switch (action.type) {
    // Dados
    case 'SET_DESLIGAMENTOS':
      return { ...s, desligamentos: action.payload, loading: false };
    case 'SET_ARCHIVED':
      return { ...s, archivedDesligamentos: action.payload, loading: false };
    case 'ADD_DESLIGAMENTO':
      return { ...s, desligamentos: [...s.desligamentos, action.payload] };
    case 'UPDATE_DESLIGAMENTO': {
      const updated = action.payload;
      return {
        ...s,
        desligamentos: s.desligamentos.map(d => d.id === updated.id ? updated : d),
        archivedDesligamentos: s.archivedDesligamentos.map(d => d.id === updated.id ? updated : d),
      };
    }
    case 'TOGGLE_CHECKLIST_OPTIMISTIC': {
      const now = new Date().toISOString();
      const updateList = (list) => list.map(d => {
        if (d.id !== action.desligamentoId) return d;
        return {
          ...d,
          checklist: (d.checklist || []).map(c => {
            if (c.id !== action.itemId) return c;
            const newDone = !c.done;
            return { ...c, done: newDone, doneAt: newDone ? now : null, notApplicable: newDone ? false : c.notApplicable };
          }),
        };
      });
      return {
        ...s,
        desligamentos: updateList(s.desligamentos),
        archivedDesligamentos: updateList(s.archivedDesligamentos),
      };
    }
    case 'TOGGLE_NAO_APLICAVEL_OPTIMISTIC': {
      const updateList = (list) => list.map(d => {
        if (d.id !== action.desligamentoId) return d;
        return {
          ...d,
          checklist: (d.checklist || []).map(c => {
            if (c.id !== action.itemId) return c;
            const newNA = !c.notApplicable;
            return { ...c, notApplicable: newNA, done: newNA ? false : c.done, doneAt: newNA ? null : c.doneAt };
          }),
        };
      });
      return {
        ...s,
        desligamentos: updateList(s.desligamentos),
        archivedDesligamentos: updateList(s.archivedDesligamentos),
      };
    }
    case 'ARCHIVE_DESLIGAMENTO':
      return {
        ...s,
        desligamentos: s.desligamentos.filter(d => d.id !== action.payload.id),
        archivedDesligamentos: [action.payload, ...s.archivedDesligamentos],
      };
    case 'UNARCHIVE_DESLIGAMENTO':
      return {
        ...s,
        archivedDesligamentos: s.archivedDesligamentos.filter(d => d.id !== action.payload.id),
        desligamentos: [action.payload, ...s.desligamentos],
      };
    case 'DELETE_DESLIGAMENTO':
      return {
        ...s,
        desligamentos: s.desligamentos.filter(d => d.id !== action.id),
        archivedDesligamentos: s.archivedDesligamentos.filter(d => d.id !== action.id),
      };
    case 'ARCHIVE_MULTIPLE': {
      const archivedIds = (action.payload || []).map(d => d.id);
      return {
        ...s,
        desligamentos: s.desligamentos.filter(d => !archivedIds.includes(d.id)),
        archivedDesligamentos: [...(action.payload || []), ...s.archivedDesligamentos],
      };
    }
    case 'DELETE_MULTIPLE':
      return {
        ...s,
        desligamentos: s.desligamentos.filter(d => !action.ids.includes(d.id)),
        archivedDesligamentos: s.archivedDesligamentos.filter(d => !action.ids.includes(d.id)),
      };
    case 'SET_USER':
      return { ...s, user: action.payload };
    case 'LOGOUT':
      localStorage.removeItem('desligest_auth_user');
      localStorage.removeItem('desligest_view');
      localStorage.removeItem('desligest_selected');
      return { ...s, user: null, desligamentos: [], archivedDesligamentos: [], view: 'lista', selected: null };
    case 'SET_VIEW':
      localStorage.setItem('desligest_view', action.view);
      return { ...s, view: action.view };
    case 'SET_SELECTED':
      if (action.id) { localStorage.setItem('desligest_selected', action.id); }
      else { localStorage.removeItem('desligest_selected'); }
      return { ...s, selected: action.id };
    case 'SET_GLOBAL_COLIGADA_FILTER':
      return { ...s, globalColigadaFilter: action.payload };
    case 'SET_LOADING':
      return { ...s, loading: action.value };
    case 'SET_ERROR':
      return { ...s, error: action.message };
    case 'CLEAR_ERROR':
      return { ...s, error: null };
    case 'SET_AUTH_CHECKED':
      return { ...s, isAuthChecked: true };
    case 'TOGGLE_THEME': {
      const newTheme = s.theme === 'dark' ? 'light' : 'dark';
      localStorage.setItem('desligest_theme', newTheme);
      return { ...s, theme: newTheme };
    }
    case 'SET_NOTIFICATIONS':
      return { ...s, notifications: action.payload };
    case 'MARK_NOTIFICATION_READ':
      return {
        ...s,
        readNotificationIds: [...s.readNotificationIds, action.id],
        notifications: s.notifications.map(n => n.id === action.id ? { ...n, read: true } : n)
      };
    case 'UPDATE_CONFIG':
      localStorage.setItem(action.key, JSON.stringify(action.payload));
      return { ...s, [action.configName]: action.payload };
    case 'TRIGGER_CONFETTI':
      return { ...s, triggerConfetti: action.value };
    case 'SET_CELEBRATION':
      return { ...s, activeCelebration: action.payload };
    default:
      return s;
  }
}


function getInitialState() {
  try {
    const savedView = localStorage.getItem('desligest_view') || 'lista';
    const savedSelected = localStorage.getItem('desligest_selected') || null;
    const view = (savedView === 'detalhe' && !savedSelected) ? 'lista' : savedView;
    const readIds = (() => { try { return JSON.parse(localStorage.getItem('readNotificationIds') || '[]') || []; } catch { return []; } })();
    
    const getConfig = (key, fallback) => {
      try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : fallback;
      } catch { return fallback; }
    };

    return {
      user: null,
      isAuthChecked: false,
      desligamentos: [],
      archivedDesligamentos: [],
      view,
      selected: savedSelected,
      theme: localStorage.getItem('desligest_theme') || 'dark',
      globalColigadaFilter: 'todas',
      loading: true,
      error: null,
      offline: false,
      notifications: [],
      readNotificationIds: readIds,
      coligadas: getConfig('desligest_coligadas', DEFAULT_COLIGADAS),
      motivos: getConfig('desligest_motivos', DEFAULT_MOTIVOS),
      statusFlow: getConfig('desligest_status_flow', DEFAULT_STATUS_FLOW),
      checklistTemplate: getConfig('desligest_checklist', DEFAULT_CHECKLIST_TEMPLATE),
      linksUteis: getConfig('desligest_links', DEFAULT_LINKS_UTEIS),
      triggerConfetti: false,
      activeCelebration: null,
    };
  } catch (e) {
    console.error("Error initializing state", e);
    return {
      user: null, isAuthChecked: false, desligamentos: [], archivedDesligamentos: [],
      view: 'lista', selected: null, theme: 'dark', globalColigadaFilter: 'todas',
      loading: true, error: null, offline: false, notifications: [], readNotificationIds: [],
      coligadas: {}, motivos: [], statusFlow: [], checklistTemplate: [], linksUteis: [],
      triggerConfetti: false,
      activeCelebration: null,
    };
  }
}

// ─── Provider ─────────────────────────────────────────────────────────────
export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, null, getInitialState);
  const loadingRef = useRef(false);
  const archivedLoadingRef = useRef(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', state.theme);
  }, [state.theme]);

  // ── Carrega lista ao montar ──────────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    dispatch({ type: 'SET_LOADING', value: true });
    try {
      const res = await api.getDesligamentos({ arquivado: false });
      const raw = res.data ?? res;
      const data = Array.isArray(raw) ? raw : [];
      dispatch({ type: 'SET_DESLIGAMENTOS', payload: data });
      dispatch({ type: 'SET_ERROR', message: null });
    } catch (err) {
      if (err.message.includes('401')) {
        localStorage.removeItem('token');
        dispatch({ type: 'SET_USER', payload: null });
        return;
      }
      console.warn('[AppContext] API indisponível, usando localStorage como fallback.', err.message);
      const saved = loadFromStorage();
      dispatch({ type: 'SET_DESLIGAMENTOS', payload: saved.filter(d => !d.arquivado) });
      dispatch({
        type: 'SET_ERROR',
        message: '⚠️ API offline — dados carregados do cache local.',
      });
    } finally {
      loadingRef.current = false;
      dispatch({ type: 'SET_LOADING', value: false });
    }
  }, []);

  const fetchArchived = useCallback(async (searchQuery = '') => {
    if (archivedLoadingRef.current) return;
    archivedLoadingRef.current = true;
    dispatch({ type: 'SET_LOADING', value: true });
    try {
      const res = await api.getDesligamentos({ arquivado: true, q: searchQuery });
      const raw = res.data ?? res;
      const data = Array.isArray(raw) ? raw : [];
      dispatch({ type: 'SET_ARCHIVED', payload: data });
    } catch (err) {
      if (err.message.includes('401')) {
        localStorage.removeItem('token');
        dispatch({ type: 'SET_USER', payload: null });
        return;
      }
      console.warn('[AppContext] Falha ao buscar arquivados da API.', err.message);
      const saved = loadFromStorage();
      const filtered = saved.filter(d => d.arquivado);
      const searchTerm = searchQuery.toLowerCase();
      const results = searchQuery 
        ? filtered.filter(d => d.nome?.toLowerCase().includes(searchTerm)) 
        : filtered;
      dispatch({ type: 'SET_ARCHIVED', payload: results });
    } finally {
      archivedLoadingRef.current = false;
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
        dispatch({ type: 'SET_USER', payload: null });
      }
    }
    dispatch({ type: 'SET_AUTH_CHECKED' });
  }, []);

  useEffect(() => { checkAuthStatus(); }, [checkAuthStatus]);

  useEffect(() => {
    if (state.user) {
      fetchAll();
      fetchArchived(); // Carrega arquivados também para o Calendário e Histórico Global
    }
  }, [state.user, fetchAll, fetchArchived]);

  useEffect(() => {
    // Persiste no localStorage sempre que houver novos dados para garantir o modo offline
    if (state.desligamentos.length > 0 || state.archivedDesligamentos.length > 0) {
      saveToStorage([...state.desligamentos, ...state.archivedDesligamentos]);
    }
  }, [state.desligamentos, state.archivedDesligamentos]);

  // IDs já notificados nativamente nesta sessão para evitar spam
  const notifiedSessionIds = useRef(new Set());

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
      // Ignorar processos já pagos, cancelados ou com depósito realizado (p1)
      const isPaidChecklist = d.checklist?.some(c => c.id === 'p1' && c.done);
      if (d.status === 'pago' || d.status === 'cancelado' || isPaidChecklist || !d.dataPagamento) return;

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

    // Só atualiza se houver mudança real para evitar loops (comparação profunda simples)
    if (JSON.stringify(newNotifications) !== JSON.stringify(state.notifications)) {
      dispatch({ type: 'SET_NOTIFICATIONS', payload: newNotifications });
    }

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
      ids.forEach(id => dispatch({ type: 'DELETE_DESLIGAMENTO', id }));
    } catch (err) {
      dispatch({ type: 'SET_ERROR', message: `Erro na exclusão em lote: ${err.message}` });
    }
  }

  async function bulkUpdateStatus(ids, status) {
    try {
      await api.bulkUpdateStatus(ids, status);
      // Recarrega tudo para garantir sincronia correta do estado complexo (checklist/history)
      await fetchAll();
      await fetchArchived();
    } catch (err) {
      dispatch({ type: 'SET_ERROR', message: `Erro na atualização em lote: ${err.message}` });
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

  function updateConfig(configName, key, payload) {
    dispatch({ type: 'UPDATE_CONFIG', configName, key, payload });
  }

  // Mantém compatibilidade com o dispatch direto p/ navegação de UI
  const uiDispatch = (action) => {
    if (['SET_VIEW', 'SET_SELECTED', 'CLEAR_ERROR', 'SET_GLOBAL_COLIGADA_FILTER'].includes(action.type)) {
      dispatch(action);
    }
  };

  const value = useMemo(() => ({
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
      bulkUpdateStatus,
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
      toggleTheme: () => dispatch({ type: 'TOGGLE_THEME' }),
      updateConfig,
      triggerCelebration: (style) => {
        dispatch({ type: 'SET_CELEBRATION', payload: style });
        
        let duration = 12000;
        if (style === 'neon_corporate') duration = 5000;
        else if (style === 'midnight_fireworks') duration = 9000;
        
        setTimeout(() => dispatch({ type: 'SET_CELEBRATION', payload: null }), duration);
      },
    },
  }), [state, uiDispatch, fetchAll, fetchArchived, addDesligamento, updateDesligamento, archiveDesligamento, unarchiveDesligamento, deleteDesligamento, bulkArchive, bulkDelete, toggleChecklist, toggleNaoAplicavel, markNotificationRead, requestNotificationPermission, addHistorico, changeStatus, login, register, logout, updateConfig]);

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
