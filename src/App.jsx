import React, { useState, useMemo } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { ListView } from './components/ListView';
import { KanbanView } from './components/KanbanView';
import { ArchivedView } from './components/ArchivedView';
import { DetailView } from './components/DetailView';
import { ModalNovoDesligamento } from './components/Modals';
import { ModalImportarPlanilha } from './components/ImportModal';
import { NotificationCenter } from './components/NotificationCenter';
import { SettingsView } from './components/SettingsView';
import { Dashboard } from './components/Dashboard';
import { AuthView } from './components/AuthView';
import { HelpView } from './components/HelpView';
import { ReportsView } from './components/ReportsView';
import { CalendarView } from './components/CalendarView';
import { AuditLogView } from './components/AuditLogView';
import { differenceInDays, parseISO, startOfDay } from 'date-fns';

import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutList, Columns, Plus, Users, AlertTriangle, Loader, FileSpreadsheet, Archive, PieChart as PieChartIcon, PanelLeftClose, Settings, LogOut, HelpCircle, FileText, Sun, Moon, Calendar, History
} from 'lucide-react';

const LoadingScreen = ({ message }) => (
  <div className="loading-screen">
    <div className="animated-bg">
      <div className="bg-blob bg-blob-1"></div>
      <div className="bg-blob bg-blob-2"></div>
      <div className="bg-blob bg-blob-3"></div>
    </div>
    
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="loading-content"
    >
      <div style={{ position: 'relative' }}>
        <div className="loader-glow" />
        <Loader size={44} style={{ color: 'var(--accent-blue)', animation: 'spin 1.5s linear infinite' }} />
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
        <motion.span 
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 2, repeat: Infinity }}
          style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: -0.5 }}
        >
          {message}
        </motion.span>
        <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>
          Preparando seu ambiente seguro...
        </span>
      </div>
    </motion.div>
  </div>
);

const isOnlyMissingComprovante = (d) => {
  const checklist = d.checklist || [];
  const p1 = checklist.find(c => c.id === 'p1'); // Depósito
  const p2 = checklist.find(c => c.id === 'p2'); // Comprovante arquivado
  const paid = (p1 && p1.done) || d.status === 'pago';
  const noReceipt = p2 && !p2.done && !p2.notApplicable;
  return paid && noReceipt;
};

const applyColigadaFilter = (list, coligadaFilter) => {
  if (coligadaFilter === 'todas' || !coligadaFilter) return list;
  return (list || []).filter(d => d.coligada === coligadaFilter);
};

function AppContent() {
  const { state, dispatch, actions } = useApp();
  const { user, view, selected, desligamentos, archivedDesligamentos, loading, error, globalColigadaFilter } = state;

  const [showNew, setShowNew] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const filteredDesligamentos = useMemo(() => applyColigadaFilter(desligamentos || [], globalColigadaFilter), [desligamentos, globalColigadaFilter]);
  const filteredArchived = useMemo(() => applyColigadaFilter(archivedDesligamentos || [], globalColigadaFilter), [archivedDesligamentos, globalColigadaFilter]);
  
  const allDesligamentos = useMemo(() => [
    ...(desligamentos || []), 
    ...(archivedDesligamentos || [])
  ], [desligamentos, archivedDesligamentos]);

  const filteredAll = useMemo(() => applyColigadaFilter(allDesligamentos, globalColigadaFilter), [allDesligamentos, globalColigadaFilter]);

  const { pendentesComprovante, mainDesligamentos, mainArquivados, globalVencidos } = useMemo(() => {
    const pend = filteredAll.filter(d => isOnlyMissingComprovante(d));
    const main = filteredDesligamentos.filter(d => !isOnlyMissingComprovante(d));
    const arch = filteredArchived.filter(d => !isOnlyMissingComprovante(d));
    
    const overdue = main.filter(d => {
      if (d.status === 'pago' || d.status === 'cancelado' || !d.dataPagamento) return false;
      try {
        const days = differenceInDays(parseISO(d.dataPagamento), startOfDay(new Date()));
        return days < 0;
      } catch (e) { return false; }
    }).length;

    return { 
      pendentesComprovante: pend, 
      mainDesligamentos: main, 
      mainArquivados: arch,
      globalVencidos: overdue 
    };
  }, [filteredAll, filteredDesligamentos, filteredArchived]);

  if (!state.isAuthChecked) {
    return <LoadingScreen message="Autenticando..." />;
  }

  if (!user) {
    return <AuthView />;
  }

  const activeCount = mainDesligamentos.filter(d => d.status !== 'pago').length;
  const pendenteCount = pendentesComprovante.length;
  const archivedCount = mainArquivados.length + mainDesligamentos.filter(d => d.status === 'pago').length;



  if (!user) {
    return <AuthView />;
  }

  // We need to fetch COLIGADAS here to render the topbar filter
  let coligadosObj = {};
  try {
    const saved = localStorage.getItem('desligest_coligadas');
    if (saved) coligadosObj = JSON.parse(saved);
  } catch (e) { }
  if (Object.keys(coligadosObj).length === 0) {
    // Basic fallback if empty
    coligadosObj = { '1': { nome: 'Concreta' }, '4': { nome: 'JPL Gomes' }, '11': { nome: 'JC Gomes' } };
  }

  // Loading skeleton
  if (loading && !desligamentos.length && !archivedDesligamentos.length) {
    return <LoadingScreen message="Conectando ao banco de dados..." />;
  }

  const navItems = [
    { id: 'lista', label: 'Lista de Processos', icon: <LayoutList size={15} />, badge: activeCount, badgeColor: globalVencidos > 0 ? 'var(--accent-red)' : '' },
    { id: 'kanban', label: 'Quadro Kanban', icon: <Columns size={15} /> },
    { id: 'calendar', label: 'Calendário', icon: <Calendar size={15} />, badge: globalVencidos > 0 ? globalVencidos : null, badgeColor: 'var(--accent-red)' },
    { id: 'pendentes', label: 'Pend. Comprovante', icon: <AlertTriangle size={15} />, badge: pendenteCount },
    { id: 'arquivados', label: 'Arquivados', icon: <Archive size={15} />, badge: archivedCount },
    { id: 'relatorios', label: 'Relatórios', icon: <FileText size={15} /> },
    { id: 'audit', label: 'Histórico Global', icon: <History size={15} /> },
    { id: 'dashboard', label: 'Estatísticas', icon: <PieChartIcon size={15} /> },
    { id: 'configuracoes', label: 'Configurações', icon: <Settings size={15} /> },
    { id: 'ajuda', label: 'Central de Ajuda', icon: <HelpCircle size={15} /> },
  ];

  const viewTitles = {
    dashboard: 'Estatísticas do RH',
    lista: 'Processos de Desligamento',
    kanban: 'Quadro Kanban',
    calendar: 'Calendário de Prazos',
    pendentes: 'Aguardando Comprovante',
    arquivados: 'Processos Arquivados',
    relatorios: 'Central de Relatórios',
    audit: 'Log de Auditoria Global',
    configuracoes: 'Configurações do Sistema',
    ajuda: 'Central de Ajuda',
    detalhe: 'Detalhe do Processo',
  };

  const viewSubtitles = {
    dashboard: 'Visão geral por motivos e empresas',
    lista: 'Organizados por data de pagamento',
    kanban: 'Visão por etapa do processo',
    calendar: 'Visualização mensal de vencimentos',
    pendentes: 'Processos com pagamento pendente de arquivo',
    arquivados: 'Histórico de processos finalizados',
    relatorios: 'Exportar dados para auditoria e gerência',
    audit: 'Monitoramento de alterações em tempo real',
    configuracoes: 'Administração de dados e preferências',
    ajuda: 'Guia de uso e funcionalidades',
    detalhe: selected ? (allDesligamentos.find(d => d.id === selected)?.nome) : '',
  };

  return (
    <div className="app-layout">
      {/* Sidebar */}
      <nav className={`sidebar ${isSidebarCollapsed ? 'collapsed' : ''}`} aria-label="Navegação principal">
        <div className="sidebar-logo" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div className="logo-mark" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div className="logo-icon">
              <Users size={18} color="white" />
            </div>
            {!isSidebarCollapsed && (
              <div>
                <div className="logo-text">DesliGest</div>
                <div className="logo-sub" style={{ paddingLeft: 0 }}>Gestão RH</div>
              </div>
            )}
          </div>
          <button
            className="btn btn-icon"
            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4 }}
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            title={isSidebarCollapsed ? "Expandir Menu" : "Recolher Menu"}
          >
            <PanelLeftClose size={18} style={{ transform: isSidebarCollapsed ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s' }} />
          </button>
        </div>

        <div className="sidebar-nav">
          <div className="nav-section-label">Navegação</div>
          {navItems.map((item, i) => (
            <motion.button
              key={item.id}
              id={`nav-${item.id}`}
              className={`nav-item ${view === item.id ? 'active' : ''}`}
              style={{ justifyContent: isSidebarCollapsed ? 'center' : 'flex-start', padding: isSidebarCollapsed ? '12px' : '11px 16px' }}
              onClick={() => dispatch({ type: 'SET_VIEW', view: item.id })}
              title={isSidebarCollapsed ? item.label : undefined}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04, duration: 0.3, ease: 'easeOut' }}
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.97 }}
            >
              <div style={{ position: 'relative', display: 'flex' }}>
                {item.icon}
                {isSidebarCollapsed && item.badge > 0 && <span style={{ position: 'absolute', top: -6, right: -8, background: 'var(--accent-blue)', fontSize: 9, padding: '2px 4px', borderRadius: 8, color: 'white' }}>{item.badge}</span>}
              </div>
              {!isSidebarCollapsed && <span>{item.label}</span>}
              {!isSidebarCollapsed && item.badge > 0 && <span className="badge">{item.badge}</span>}
            </motion.button>
          ))}

          <div className="nav-section-label" style={{ marginTop: 16 }}>
            {isSidebarCollapsed ? '...' : 'Ações'}
          </div>
          <button
            id="nav-novo"
            className="nav-item"
            style={{ justifyContent: isSidebarCollapsed ? 'center' : 'flex-start', padding: isSidebarCollapsed ? '12px' : '11px 16px' }}
            onClick={() => setShowNew(true)}
            title="Novo Desligamento"
          >
            <Plus size={15} />
            {!isSidebarCollapsed && <span>Novo Desligamento</span>}
          </button>
          <button
            id="nav-import"
            className="nav-item"
            style={{ justifyContent: isSidebarCollapsed ? 'center' : 'flex-start', padding: isSidebarCollapsed ? '12px' : '11px 16px' }}
            onClick={() => setShowImport(true)}
            title="Importar Planilha"
          >
            <FileSpreadsheet size={15} />
            {!isSidebarCollapsed && <span>Importar Planilha</span>}
          </button>
        </div>

        <div className="sidebar-footer">
          <div style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center' }}>
            {isSidebarCollapsed ? `${activeCount + archivedCount + pendenteCount}` : `${activeCount + archivedCount + pendenteCount} processo${(activeCount + archivedCount + pendenteCount) !== 1 ? 's' : ''} registrado${(activeCount + archivedCount + pendenteCount) !== 1 ? 's' : ''}`}
          </div>
        </div>
      </nav>

      {/* Main */}
      <div className="main-content">
        {/* Topbar */}
        <header className="topbar">
          <div style={{ flex: 1 }}>
            <span className="topbar-title">{viewTitles[view]}</span>
            {viewSubtitles[view] && (
              <span className="topbar-subtitle"> · {viewSubtitles[view]}</span>
            )}
          </div>

          {view !== 'detalhe' && (
            <button
              id="btn-novo-topbar"
              className="btn btn-primary"
              onClick={() => setShowNew(true)}
            >
              <Plus size={14} />
              Novo Desligamento
            </button>
          )}


          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button 
              className="btn btn-icon" 
              onClick={actions.toggleTheme}
              title={state.theme === 'dark' ? 'Mudar para Modo Claro' : 'Mudar para Modo Escuro'}
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
            >
              {state.theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>

            <NotificationCenter />

            <div style={{ width: 1, height: 24, background: 'var(--border)', margin: '0 4px' }} />

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 8px', borderRadius: 8, background: 'var(--bg-card)' }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent-purple), var(--accent-indigo))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#fff', textTransform: 'uppercase' }}>
                {user?.name ? user.name.substring(0, 2) : 'HR'}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', marginRight: 8 }}>
                <span style={{ fontSize: 14, fontWeight: 600 }}>{user?.name || 'Admin'}</span>
                <span style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'capitalize' }}>{user?.role || 'RH Corporativo'}</span>
              </div>
              <button 
                className="btn btn-icon" 
                onClick={actions.logout}
                title="Sair do sistema"
                style={{ color: 'var(--accent-red)' }}
              >
                <LogOut size={16} />
              </button>
            </div>
          </div>
        </header>

        {/* Offline/Error banner */}
        {error && (
          <div className="alert alert-warning" style={{ margin: '12px 24px 0', borderRadius: 'var(--radius-md)' }}>
            <AlertTriangle size={15} style={{ flexShrink: 0, marginTop: 1 }} />
            <span>{error}</span>
            <button
              style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontSize: 16, lineHeight: 1 }}
              onClick={() => dispatch({ type: 'CLEAR_ERROR' })}
            >×</button>
          </div>
        )}

        {/* Content */}
        <div className="page-wrapper" style={{ flex: 1, position: 'relative', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={view + (selected || '')}
              initial={{ opacity: 0, y: 18, filter: 'blur(4px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -14, filter: 'blur(4px)' }}
              transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
              style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}
            >
              {view === 'dashboard' && <Dashboard data={filteredAll} />}
              {view === 'lista' && <ListView data={mainDesligamentos} />}
              {view === 'calendar' && <CalendarView data={allDesligamentos} />}
              {view === 'pendentes' && <ListView data={pendentesComprovante} />}
              {view === 'kanban' && <KanbanView data={mainDesligamentos} />}
              { view === 'arquivados' && <ArchivedView data={mainArquivados} /> }
              { view === 'relatorios' && <ReportsView ativos={mainDesligamentos} arquivados={mainArquivados} /> }
              { view === 'audit' && <AuditLogView data={allDesligamentos} /> }
              { view === 'configuracoes' && <SettingsView /> }
              { view === 'ajuda' && <HelpView /> }
              { view === 'detalhe' && selected && <DetailView id={selected} /> }
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Modal */}
      {showNew && <ModalNovoDesligamento onClose={() => setShowNew(false)} />}
      {showImport && <ModalImportarPlanilha onClose={() => setShowImport(false)} />}
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
