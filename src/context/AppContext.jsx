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
import { fireExtravagantConfetti } from '../utils/confettiHelper';

const AppContext = createContext();

// ─── Reducer ──────────────────────────────────────────────────────────────
function reducer(state, action) {
  const s = {
    ...state,
    desligamentos: state.desligamentos || [],
    archivedDesligamentos: state.archivedDesligamentos || [],
    notifications: state.notifications || [],
    readNotificationIds: state.readNotificationIds || [],
  };
  switch (action.type) {
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
      return { ...s, desligamentos: updateList(s.desligamentos), archivedDesligamentos: updateList(s.archivedDesligamentos) };
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
      return { ...s, desligamentos: updateList(s.desligamentos), archivedDesligamentos: updateList(s.archivedDesligamentos) };
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
      localStorage.removeItem('token');
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
    case 'TOGGLE_PERFORMANCE_MODE': {
      const newValue = !s.performanceMode;
      localStorage.setItem('desligest_performance', newValue);
      return { ...s, performanceMode: newValue };
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
    case 'UPDATE_MULTIPLE': {
      const updatedIds = action.payload.map(d => d.id);
      return {
        ...s,
        desligamentos: s.desligamentos.map(d => {
          const up = action.payload.find(x => x.id === d.id);
          return up ? up : d;
        }),
        archivedDesligamentos: s.archivedDesligamentos.map(d => {
          const up = action.payload.find(x => x.id === d.id);
          return up ? up : d;
        }),
      };
    }
    case 'SET_CELEBRATION':
      return { ...s, activeCelebration: action.payload };
    case 'SET_LINKS':
      return { ...s, linksUteis: action.payload };
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
      performanceMode: localStorage.getItem('desligest_performance') === 'true',
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
    return {
      user: null, isAuthChecked: false, desligamentos: [], archivedDesligamentos: [],
      view: 'lista', selected: null, theme: 'dark', performanceMode: false, globalColigadaFilter: 'todas',
      loading: true, error: null, offline: false, notifications: [], readNotificationIds: [],
      coligadas: {}, motivos: [], statusFlow: [], checklistTemplate: [], linksUteis: [],
      triggerConfetti: false,
      activeCelebration: null,
    };
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, null, getInitialState);
  const loadingRef = useRef(false);
  const archivedLoadingRef = useRef(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', state.theme);
  }, [state.theme]);

  useEffect(() => {
    document.documentElement.setAttribute('data-performance', state.performanceMode);
  }, [state.performanceMode]);

  const fetchAll = useCallback(async () => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    dispatch({ type: 'SET_LOADING', value: true });
    try {
      const res = await api.getDesligamentos({ arquivado: false });
      const raw = res.data ?? res;
      dispatch({ type: 'SET_DESLIGAMENTOS', payload: Array.isArray(raw) ? raw : [] });
      dispatch({ type: 'SET_ERROR', message: null });
    } catch (err) {
      const saved = loadFromStorage();
      dispatch({ type: 'SET_DESLIGAMENTOS', payload: saved.filter(d => !d.arquivado) });
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
      dispatch({ type: 'SET_ARCHIVED', payload: Array.isArray(raw) ? raw : [] });
    } catch (err) {
      const saved = loadFromStorage();
      const filtered = saved.filter(d => d.arquivado);
      const results = searchQuery ? filtered.filter(d => d.nome?.toLowerCase().includes(searchQuery.toLowerCase())) : filtered;
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

  const fetchLinks = useCallback(async () => {
    try {
      const links = await api.getLinks();
      dispatch({ type: 'SET_LINKS', payload: Array.isArray(links) ? links : [] });
    } catch (err) {
      // fallback: manter os links do localStorage
    }
  }, []);

  useEffect(() => {
    if (state.user) {
      fetchAll();
      fetchArchived();
      fetchLinks();
    }
  }, [state.user, fetchAll, fetchArchived, fetchLinks]);

  useEffect(() => {
    if (state.desligamentos.length > 0 || state.archivedDesligamentos.length > 0) {
      saveToStorage([...state.desligamentos, ...state.archivedDesligamentos]);
    }
  }, [state.desligamentos, state.archivedDesligamentos]);

  const notifiedSessionIds = useRef(new Set());

  const generateNotifications = useCallback(() => {
    const { desligamentos, readNotificationIds, notifications = [] } = state;
    if (!desligamentos || !desligamentos.length) return;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const newNotifications = [];

    desligamentos.forEach(d => {
      // Is payment done? (Checklist p1: Depósito realizado)
      const isPaid = (d.checklist || []).some(c => c.id === 'p1' && (c.done || c.notApplicable));
      // Is signing done? (Checklist h3: TRCT assinado)
      const isSigned = (d.checklist || []).some(c => c.id === 'h3' && (c.done || c.notApplicable));

      if (['pago', 'cancelado', 'pendente_comprovante'].includes(d.status) || isPaid) return;

      const alertas = [];

      // 1. Alertas de Pagamento (Usando a dataPagamento)
      if (!isPaid && d.dataPagamento) {
        const rawDate = d.dataPagamento.split('T')[0];
        const parts = rawDate.split('-');
        if (parts.length === 3) {
          const [year, month, day] = parts.map(Number);
          const paymentDate = new Date(year, month - 1, day);
          const diffDays = Math.ceil((paymentDate - today) / (1000 * 60 * 60 * 24));

          if (diffDays < 0) { alertas.push({ type: 'vencido', message: `${d.nome}: Pagamento vencido (${day.toString().padStart(2, '0')}/${month.toString().padStart(2, '0')})`, severity: 'error' }); }
          else if (diffDays === 0) { alertas.push({ type: 'vence_hoje', message: `${d.nome}: Pagamento vence hoje!`, severity: 'warning' }); }
          else if (diffDays <= 3) { alertas.push({ type: 'proximo', message: `${d.nome}: Pag. vence em ${diffDays} dia(s)`, severity: 'info' }); }
        }
      }

      // 2. Alertas de Prazo de 7 Dias (Com base na data de Desligamento)
      // Agora vinculado ao checklist h3 (TRCT assinado)
      if (!isSigned && d.dataDesligamento) {
        const rawDesl = d.dataDesligamento.split('T')[0];
        const partsDesl = rawDesl.split('-');
        if (partsDesl.length === 3) {
          const [dy, dm, dd] = partsDesl.map(Number);
          const prazo7Dias = new Date(dy, dm - 1, dd);
          prazo7Dias.setDate(prazo7Dias.getDate() + 7);
          
          const diff7Dias = Math.ceil((prazo7Dias - today) / (1000 * 60 * 60 * 24));
          
          if (diff7Dias < 0 && diff7Dias >= -5) { alertas.push({ type: 'prazo7_vencido', message: `${d.nome}: Prazo de 7 dias VENCIDO (Docs)!`, severity: 'error' }); }
          else if (diff7Dias === 0) { alertas.push({ type: 'prazo7_hoje', message: `${d.nome}: Prazo de 7 dias vence HOJE!`, severity: 'warning' }); }
          else if (diff7Dias === 1) { alertas.push({ type: 'prazo7_amanha', message: `${d.nome}: Prazo de 7 dias vence AMANHÃ!`, severity: 'info' }); }
        }
      }

      // Processar e registrar todos os alertas gerados para este documento
      alertas.forEach(alerta => {
        const notifId = `${d.id}-${alerta.type}`;
        
        const existing = notifications.find(n => n.id === notifId);
        const notifDate = existing ? existing.date : new Date().toISOString();        
        const isRead = readNotificationIds.includes(notifId);
        
        newNotifications.push({ id: notifId, desligamentoId: d.id, type: alerta.type, message: alerta.message, severity: alerta.severity, date: notifDate, read: isRead });

        if (!notifiedSessionIds.current.has(notifId) && !isRead) {
          notifiedSessionIds.current.add(notifId);
          if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
            try { new Notification('DesliGest Alerta', { body: alerta.message, icon: '/favicon.ico' }); } catch (err) {}
          }
        }
      });
    });

    if (JSON.stringify(newNotifications) !== JSON.stringify(notifications)) {
      dispatch({ type: 'SET_NOTIFICATIONS', payload: newNotifications });
    }
  }, [state.desligamentos, state.readNotificationIds, state.notifications]);

  useEffect(() => { generateNotifications(); }, [generateNotifications]);

  const value = useMemo(() => ({
    state,
    dispatch: (action) => dispatch(action),
    actions: {
      fetchAll,
      fetchArchived,
      addDesligamento: async (data) => {
        const doc = await api.createDesligamento(data);
        dispatch({ type: 'ADD_DESLIGAMENTO', payload: doc });
        return doc;
      },
      updateDesligamento: async (data) => {
        const isCancelado = data.status === 'cancelado';
        const willArchive = isCancelado && !data.arquivado;
        
        let docData = { ...data };
        if (willArchive) {
          docData.arquivado = true;
          docData.historico = [...(docData.historico || []), {
            data: new Date().toISOString(),
            acao: 'Arquivado (Automático)',
            nota: 'Processo cancelado foi arquivado automaticamente'
          }];
        }

        const doc = await api.updateDesligamento(docData.id, docData);
        
        if (willArchive) {
          dispatch({ type: 'ARCHIVE_DESLIGAMENTO', payload: doc });
        } else {
          dispatch({ type: 'UPDATE_DESLIGAMENTO', payload: doc });
        }
        return doc;
      },
      archiveDesligamento: async (id) => {
        const d = state.desligamentos.find(x => x.id === id);
        const updated = { ...d, arquivado: true, historico: [...(d.historico || []), { data: new Date().toISOString(), acao: 'Arquivado' }] };
        const doc = await api.updateDesligamento(id, updated);
        dispatch({ type: 'ARCHIVE_DESLIGAMENTO', payload: doc });
      },
      unarchiveDesligamento: async (id) => {
        const d = state.archivedDesligamentos.find(x => x.id === id);
        const updated = { ...d, arquivado: false, historico: [...(d.historico || []), { data: new Date().toISOString(), acao: 'Reativado' }] };
        const doc = await api.updateDesligamento(id, updated);
        dispatch({ type: 'UNARCHIVE_DESLIGAMENTO', payload: doc });
      },
      deleteDesligamento: async (id) => {
        await api.deleteDesligamento(id);
        dispatch({ type: 'DELETE_DESLIGAMENTO', id });
      },
      toggleChecklist: async (desligamentoId, itemId) => {
        dispatch({ type: 'TOGGLE_CHECKLIST_OPTIMISTIC', desligamentoId, itemId });
        const doc = await api.toggleChecklistItem(desligamentoId, itemId);
        dispatch({ type: 'UPDATE_DESLIGAMENTO', payload: doc });
      },
      toggleNaoAplicavel: async (desligamentoId, itemId) => {
        dispatch({ type: 'TOGGLE_NAO_APLICAVEL_OPTIMISTIC', desligamentoId, itemId });
        const doc = await api.toggleChecklistNaoAplicavel(desligamentoId, itemId);
        dispatch({ type: 'UPDATE_DESLIGAMENTO', payload: doc });
      },
      addHistorico: async (desligamentoId, entry) => {
        const doc = await api.addHistorico(desligamentoId, entry);
        dispatch({ type: 'UPDATE_DESLIGAMENTO', payload: doc });
      },
      login: async (e, p) => {
        const res = await api.login(e, p);
        localStorage.setItem('token', res.token);
        dispatch({ type: 'SET_USER', payload: res.user });
      },
      register: async (name, email, password) => {
        const res = await api.register(name, email, password);
        localStorage.setItem('token', res.token);
        dispatch({ type: 'SET_USER', payload: res.user });
      },
      logout: () => {
        localStorage.removeItem('token');
        dispatch({ type: 'LOGOUT' });
      },
      toggleTheme: () => dispatch({ type: 'TOGGLE_THEME' }),
      togglePerformanceMode: () => dispatch({ type: 'TOGGLE_PERFORMANCE_MODE' }),
      updateConfig: (name, key, payload) => dispatch({ type: 'UPDATE_CONFIG', configName: name, key, payload }),
      changeStatus: async (d, newStatus) => {
        const isCancelado = newStatus === 'cancelado';
        const willArchive = isCancelado && !d.arquivado;

        const updated = {
          ...d,
          status: newStatus,
          arquivado: d.arquivado || willArchive,
          historico: [...(d.historico || []), {
            data: new Date().toISOString(),
            acao: `Status alterado para ${newStatus.toUpperCase()}`,
            nota: `Alteração via detalhe`
          }]
        };

        if (willArchive) {
          updated.historico.push({
            data: new Date().toISOString(),
            acao: 'Arquivado (Automático)',
            nota: 'Processo cancelado foi arquivado automaticamente'
          });
        }

        const doc = await api.updateDesligamento(d.id, updated);
        
        if (willArchive) {
          dispatch({ type: 'ARCHIVE_DESLIGAMENTO', payload: doc });
        } else {
          dispatch({ type: 'UPDATE_DESLIGAMENTO', payload: doc });
        }
        return doc;
      },
      bulkArchive: async (ids) => {
        await api.bulkArchive(ids);
        // Refresh full state to be safe after bulk
        fetchAll();
        fetchArchived();
      },
      bulkDelete: async (ids) => {
        await api.bulkDelete(ids);
        dispatch({ type: 'DELETE_MULTIPLE', ids });
      },
      bulkUpdateStatus: async (ids, status) => {
        const res = await api.bulkUpdateStatus(ids, status);
        // A API bulkUpdateStatus deve retornar a lista de docs atualizados ou fazemos fetch
        if (res && Array.isArray(res)) {
          dispatch({ type: 'UPDATE_MULTIPLE', payload: res });
        } else {
          fetchAll();
        }
      },
      triggerCelebration: (style) => {
        // Ativa o motor clássico (RH Pride, Fogos, etc)
        fireExtravagantConfetti(style);
        
        // Se for ouro, ativa também o motor 3D de luxo
        if (style && style.toLowerCase().includes('gold')) {
          dispatch({ type: 'SET_CELEBRATION', payload: style });
        }

        let duration = 9000;
        if (style === 'neon_corporate') duration = 8000;
        else if (style === 'midnight_fireworks') duration = 15000;
        else if (style === 'classic_rh') duration = 10000;

        setTimeout(() => dispatch({ type: 'SET_CELEBRATION', payload: null }), duration);
      },
      // ─── Links Úteis (CRUD via API) ───────────────────────────────────
      fetchLinks,
      addLink: async (data) => {
        const doc = await api.createLink(data);
        await fetchLinks();
        return doc;
      },
      updateLink: async (id, data) => {
        const doc = await api.updateLink(id, data);
        await fetchLinks();
        return doc;
      },
      deleteLink: async (id) => {
        await api.deleteLink(id);
        await fetchLinks();
      },
      seedLinks: async () => {
        const res = await api.seedLinks();
        await fetchLinks();
        return res;
      },
    }
  }), [state, fetchAll, fetchArchived, fetchLinks]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() { return useContext(AppContext); }

const LS_KEY = 'desligest_cache_v2';
function loadFromStorage() { try { return JSON.parse(localStorage.getItem(LS_KEY) || '[]'); } catch { return []; } }
function saveToStorage(data) { try { localStorage.setItem(LS_KEY, JSON.stringify(data)); } catch { } }
