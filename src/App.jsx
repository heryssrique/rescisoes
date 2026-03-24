import React, { useState } from 'react';
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

import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutList, Columns, Plus, Users, AlertTriangle, Loader, FileSpreadsheet, Archive, PieChart as PieChartIcon, PanelLeftClose, Settings, LogOut, HelpCircle, FileText
} from 'lucide-react';

function AppContent() {
  const { state, dispatch, actions } = useApp();
  const { user, view, selected, desligamentos, archivedDesligamentos, loading, error, globalColigadaFilter } = state;

  const [showNew, setShowNew] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  if (!user) {
    return <AuthView />;
  }

  const isOnlyMissingComprovante = (d) => {
    const checklist = d.checklist || [];
    const p1 = checklist.find(c => c.id === 'p1'); // Depósito
    const p2 = checklist.find(c => c.id === 'p2'); // Comprovante arquivado

    // Check se já pagou (status pago ou p1 feito) mas sem comprovante (p2 vazio)
    const paid = (p1 && p1.done) || d.status === 'pago';
    const noReceipt = p2 && !p2.done && !p2.notApplicable;

    return paid && noReceipt;
  };

  const applyColigadaFilter = (list) => {
    if (state.globalColigadaFilter === 'todas' || !state.globalColigadaFilter) return list;
    return list.filter(d => d.coligada === state.globalColigadaFilter);
  };

  const allDesligamentos = [...desligamentos, ...(archivedDesligamentos || [])];

  const filteredDesligamentos = applyColigadaFilter(desligamentos);
  const filteredArchived = applyColigadaFilter(archivedDesligamentos || []);
  const filteredAll = applyColigadaFilter(allDesligamentos);

  const pendentesComprovante = filteredAll.filter(d => isOnlyMissingComprovante(d));
  const mainDesligamentos = filteredDesligamentos.filter(d => !isOnlyMissingComprovante(d));
  const mainArquivados = filteredArchived.filter(d => !isOnlyMissingComprovante(d));

  const activeCount = mainDesligamentos.length;
  const pendenteCount = pendentesComprovante.length;
  const archivedCount = mainArquivados.length;

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
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: 12, color: 'var(--text-muted)' }}>
        <Loader size={24} style={{ animation: 'spin 1s linear infinite' }} />
        <span style={{ fontSize: 15 }}>Conectando ao banco de dados...</span>
      </div>
    );
  }

  const navItems = [
    { id: 'lista', label: 'Lista de Processos', icon: <LayoutList size={15} />, badge: activeCount },
    { id: 'kanban', label: 'Quadro Kanban', icon: <Columns size={15} /> },
    { id: 'pendentes', label: 'Pend. Comprovante', icon: <AlertTriangle size={15} />, badge: pendenteCount },
    { id: 'arquivados', label: 'Arquivados', icon: <Archive size={15} />, badge: archivedCount },
    { id: 'relatorios', label: 'Relatórios', icon: <FileText size={15} /> },
    { id: 'dashboard', label: 'Estatísticas', icon: <PieChartIcon size={15} /> },
    { id: 'configuracoes', label: 'Configurações', icon: <Settings size={15} /> },
    { id: 'ajuda', label: 'Central de Ajuda', icon: <HelpCircle size={15} /> },
  ];

  const viewTitles = {
    dashboard: 'Estatísticas do RH',
    lista: 'Processos de Desligamento',
    kanban: 'Quadro Kanban',
    pendentes: 'Aguardando Comprovante',
    arquivados: 'Processos Arquivados',
    relatorios: 'Central de Relatórios',
    configuracoes: 'Configurações do Sistema',
    ajuda: 'Central de Ajuda',
    detalhe: 'Detalhe do Processo',
  };

  const viewSubtitles = {
    dashboard: 'Visão geral por motivos e empresas',
    lista: 'Organizados por data de pagamento',
    kanban: 'Visão por etapa do processo',
    pendentes: 'Processos com pagamento pendente de arquivo',
    arquivados: 'Histórico de processos finalizados',
    relatorios: 'Exportar dados para auditoria e gerência',
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
          {navItems.map(item => (
            <button
              key={item.id}
              id={`nav-${item.id}`}
              className={`nav-item ${view === item.id ? 'active' : ''}`}
              style={{ justifyContent: isSidebarCollapsed ? 'center' : 'flex-start', padding: isSidebarCollapsed ? '12px' : '11px 16px' }}
              onClick={() => dispatch({ type: 'SET_VIEW', view: item.id })}
              title={isSidebarCollapsed ? item.label : undefined}
            >
              <div style={{ position: 'relative', display: 'flex' }}>
                {item.icon}
                {isSidebarCollapsed && item.badge > 0 && <span style={{ position: 'absolute', top: -6, right: -8, background: 'var(--accent-blue)', fontSize: 9, padding: '2px 4px', borderRadius: 8, color: 'white' }}>{item.badge}</span>}
              </div>
              {!isSidebarCollapsed && <span>{item.label}</span>}
              {!isSidebarCollapsed && item.badge > 0 && <span className="badge">{item.badge}</span>}
            </button>
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
              initial={{ opacity: 0, scale: 0.98, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 1.02, y: -10 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}
            >
              {view === 'dashboard' && <Dashboard data={mainDesligamentos} />}
              {view === 'lista' && <ListView data={mainDesligamentos} />}
              {view === 'pendentes' && <ListView data={pendentesComprovante} />}
              {view === 'kanban' && <KanbanView data={mainDesligamentos} />}
              { view === 'arquivados' && <ArchivedView data={mainArquivados} /> }
              { view === 'relatorios' && <ReportsView ativos={mainDesligamentos} arquivados={mainArquivados} /> }
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
