import React, { useState, useMemo, Suspense, lazy } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { ModalNovoDesligamento } from './components/Modals';
import { ModalImportarPlanilha } from './components/ImportModal';
import { NotificationCenter } from './components/NotificationCenter';
import { AuthView } from './components/AuthView';
import { differenceInDays, parseISO, startOfDay } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutList, Columns, Plus, Users, AlertTriangle, Loader, FileSpreadsheet, Archive, PieChart as PieChartIcon, PanelLeftClose, Settings, LogOut, HelpCircle, FileText, Sun, Moon, Calendar, History
} from 'lucide-react';

// Lazy Load Views for better performance and to avoid initialization race conditions
const Dashboard = lazy(() => import('./components/Dashboard').then(m => ({ default: m.Dashboard })));
const ListView = lazy(() => import('./components/ListView').then(m => ({ default: m.ListView })));
const KanbanView = lazy(() => import('./components/KanbanView').then(m => ({ default: m.KanbanView })));
const ArchivedView = lazy(() => import('./components/ArchivedView').then(m => ({ default: m.ArchivedView })));
const DetailView = lazy(() => import('./components/DetailView').then(m => ({ default: m.DetailView })));
const CalendarView = lazy(() => import('./components/CalendarView').then(m => ({ default: m.CalendarView })));
const AuditLogView = lazy(() => import('./components/AuditLogView').then(m => ({ default: m.AuditLogView })));
const SettingsView = lazy(() => import('./components/SettingsView').then(m => ({ default: m.SettingsView })));
const HelpView = lazy(() => import('./components/HelpView').then(m => ({ default: m.HelpView })));
const ReportsView = lazy(() => import('./components/ReportsView').then(m => ({ default: m.ReportsView })));

const LoadingScreen = ({ message }) => (
  <div className="loading-screen">
    <div className="animated-bg">
      <div className="bg-blob bg-blob-1"></div>
      <div className="bg-blob bg-blob-2"></div>
      <div className="bg-blob bg-blob-3"></div>
    </div>
    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="loading-content">
      <div style={{ position: 'relative' }}><div className="loader-glow" /><Loader size={44} style={{ color: 'var(--accent-blue)', animation: 'spin 1.5s linear infinite' }} /></div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
        <motion.span animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 2, repeat: Infinity }} style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: -0.5 }}>{message}</motion.span>
        <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>Preparando seu ambiente seguro...</span>
      </div>
    </motion.div>
  </div>
);

const ViewLoader = () => (
  <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-main)', height: '100%' }}>
    <div className="shimmer" style={{ width: '80%', height: '80%', borderRadius: 'var(--radius-lg)' }} />
  </div>
);

const isOnlyMissingComprovante = (d) => {
  const checklist = d.checklist || [];
  const p1 = checklist.find(c => c.id === 'p1');
  const p2 = checklist.find(c => c.id === 'p2');
  const paid = (p1 && p1.done) || d.status === 'pago';
  const noReceipt = p2 && !p2.done && !p2.notApplicable;
  return paid && noReceipt;
};

const applyColigadaFilter = (list, coligadaFilter) => {
  if (coligadaFilter === 'todas' || !coligadaFilter) return list;
  return (list || []).filter(d => String(d.coligada) === String(coligadaFilter));
};

function AppContent() {
  const { state, dispatch, actions } = useApp();
  const { user, view, selected, desligamentos, archivedDesligamentos, loading, error, globalColigadaFilter } = state;
  const [showNew, setShowNew] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const processedData = useMemo(() => {
    const activeRaw = applyColigadaFilter(desligamentos || [], globalColigadaFilter);
    const archivedRaw = applyColigadaFilter(archivedDesligamentos || [], globalColigadaFilter);
    const allRaw = [...activeRaw, ...archivedRaw];
    const pendentesComprovante = allRaw.filter(d => isOnlyMissingComprovante(d));
    const mainDesligamentos = activeRaw.filter(d => !isOnlyMissingComprovante(d));
    const mainArquivados = archivedRaw.filter(d => !isOnlyMissingComprovante(d));
    const globalVencidos = mainDesligamentos.filter(d => {
      if (d.status === 'pago' || d.status === 'cancelado' || !d.dataPagamento) return false;
      try { return differenceInDays(parseISO(d.dataPagamento), startOfDay(new Date())) < 0; } catch (e) { return false; }
    }).length;
    return {
      all: allRaw, mainDesligamentos, mainArquivados, pendentesComprovante, globalVencidos,
      counts: {
        active: mainDesligamentos.filter(d => d.status !== 'pago').length,
        pending: pendentesComprovante.length,
        archived: mainArquivados.length + mainDesligamentos.filter(d => d.status === 'pago').length
      }
    };
  }, [desligamentos, archivedDesligamentos, globalColigadaFilter]);

  if (!state.isAuthChecked) return <LoadingScreen message="Autenticando..." />;
  if (!user) return <AuthView />;
  if (loading && !desligamentos.length && !archivedDesligamentos.length) return <LoadingScreen message="Conectando ao banco de dados..." />;

  const navItems = [
    { id: 'lista', label: 'Lista de Processos', icon: <LayoutList size={15} />, badge: processedData.counts.active, badgeColor: processedData.globalVencidos > 0 ? 'var(--accent-red)' : '' },
    { id: 'kanban', label: 'Quadro Kanban', icon: <Columns size={15} /> },
    { id: 'calendar', label: 'Calendário', icon: <Calendar size={15} />, badge: processedData.globalVencidos > 0 ? processedData.globalVencidos : null, badgeColor: 'var(--accent-red)' },
    { id: 'pendentes', label: 'Pend. Comprovante', icon: <AlertTriangle size={15} />, badge: processedData.counts.pending },
    { id: 'arquivados', label: 'Arquivados', icon: <Archive size={15} />, badge: processedData.counts.archived },
    { id: 'relatorios', label: 'Relatórios', icon: <FileText size={15} /> },
    { id: 'audit', label: 'Histórico Global', icon: <History size={15} /> },
    { id: 'dashboard', label: 'Estatísticas', icon: <PieChartIcon size={15} /> },
    { id: 'configuracoes', label: 'Configurações', icon: <Settings size={15} /> },
    { id: 'ajuda', label: 'Central de Ajuda', icon: <HelpCircle size={15} /> },
  ];

  const viewTitles = {
    dashboard: 'Estatísticas do RH', lista: 'Processos de Desligamento', kanban: 'Quadro Kanban', calendar: 'Calendário de Prazos',
    pendentes: 'Aguardando Comprovante', arquivados: 'Processos Arquivados', relatorios: 'Central de Relatórios',
    audit: 'Log de Auditoria Global', configuracoes: 'Configurações do Sistema', ajuda: 'Central de Ajuda', detalhe: 'Detalhe do Processo',
  };

  const selectedName = selected ? (processedData.all.find(d => d.id === selected)?.nome) : '';
  const viewSubtitle = {
    dashboard: 'Visão geral por motivos e empresas', lista: 'Organizados por data de pagamento', kanban: 'Visão por etapa do processo',
    calendar: 'Visualização mensal de vencimentos', pendentes: 'Processos com pagamento pendente de arquivo', arquivados: 'Histórico de processos finalizados',
    relatorios: 'Exportar dados para auditoria e gerência', audit: 'Monitoramento de alterações em tempo real', configuracoes: 'Administração de dados e preferências',
    ajuda: 'Guia de uso e funcionalidades', detalhe: selectedName,
  };

  return (
    <div className="app-layout">
      <nav className={`sidebar ${isSidebarCollapsed ? 'collapsed' : ''}`} aria-label="Navegação principal">
        <div className="sidebar-logo" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div className="logo-mark" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div className="logo-icon"><Users size={18} color="white" /></div>
            {!isSidebarCollapsed && <div><div className="logo-text">DesliGest</div><div className="logo-sub" style={{ paddingLeft: 0 }}>Gestão RH</div></div>}
          </div>
          <button className="btn btn-icon" style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4 }} onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}>
            <PanelLeftClose size={18} style={{ transform: isSidebarCollapsed ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s' }} />
          </button>
        </div>
        <div className="sidebar-nav">
          <div className="nav-section-label">Navegação</div>
          {navItems.map((item, i) => (
            <motion.button key={item.id} id={`nav-${item.id}`} className={`nav-item ${view === item.id ? 'active' : ''}`} style={{ justifyContent: isSidebarCollapsed ? 'center' : 'flex-start', padding: isSidebarCollapsed ? '12px' : '11px 16px' }} onClick={() => dispatch({ type: 'SET_VIEW', view: item.id })} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}>
              <div style={{ position: 'relative', display: 'flex' }}>
                {item.icon}
                {isSidebarCollapsed && item.badge > 0 && <span style={{ position: 'absolute', top: -6, right: -8, background: item.badgeColor || 'var(--accent-blue)', fontSize: 9, padding: '2px 4px', borderRadius: 8, color: 'white' }}>{item.badge}</span>}
              </div>
              {!isSidebarCollapsed && <span>{item.label}</span>}
              {!isSidebarCollapsed && item.badge > 0 && <span className="badge" style={item.badgeColor ? { background: item.badgeColor } : {}}>{item.badge}</span>}
            </motion.button>
          ))}
          <div className="nav-section-label" style={{ marginTop: 16 }}>{isSidebarCollapsed ? '...' : 'Ações'}</div>
          <button className="nav-item" style={{ justifyContent: isSidebarCollapsed ? 'center' : 'flex-start', padding: isSidebarCollapsed ? '12px' : '11px 16px' }} onClick={() => setShowNew(true)}><Plus size={15} />{!isSidebarCollapsed && <span>Novo Desligamento</span>}</button>
          <button className="nav-item" style={{ justifyContent: isSidebarCollapsed ? 'center' : 'flex-start', padding: isSidebarCollapsed ? '12px' : '11px 16px' }} onClick={() => setShowImport(true)}><FileSpreadsheet size={15} />{!isSidebarCollapsed && <span>Importar Planilha</span>}</button>
        </div>
      </nav>

      <div className="main-content">
        <header className="topbar"><div style={{ flex: 1 }}><span className="topbar-title">{viewTitles[view]}</span>{viewSubtitle[view] && <span className="topbar-subtitle"> · {viewSubtitle[view]}</span>}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button className="btn btn-icon" onClick={actions.toggleTheme} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>{state.theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}</button>
            <NotificationCenter />
            <div style={{ width: 1, height: 24, background: 'var(--border)', margin: '0 4px' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 8px', borderRadius: 8, background: 'var(--bg-card)' }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent-purple), var(--accent-indigo))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#fff' }}>{user?.name ? user.name.substring(0, 2) : 'HR'}</div>
              <div style={{ display: 'flex', flexDirection: 'column', marginRight: 8 }}><span style={{ fontSize: 14, fontWeight: 600 }}>{user?.name || 'Admin'}</span><span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{user?.role || 'RH Corporativo'}</span></div>
              <button className="btn btn-icon" onClick={actions.logout} style={{ color: 'var(--accent-red)' }}><LogOut size={16} /></button>
            </div>
          </div>
        </header>
        {error && <div className="alert alert-warning" style={{ margin: '12px 24px 0', borderRadius: 'var(--radius-md)' }}><AlertTriangle size={15} style={{ flexShrink: 0 }} /><span>{error}</span><button style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }} onClick={() => dispatch({ type: 'CLEAR_ERROR' })}>×</button></div>}
        <div className="page-wrapper" style={{ flex: 1, position: 'relative', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <AnimatePresence mode="wait">
            <motion.div key={view + (selected || '')} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -14 }} transition={{ duration: 0.3 }} style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
              <Suspense fallback={<ViewLoader />}>
                {view === 'dashboard' && <Dashboard data={processedData.all} />}
                {view === 'lista' && <ListView data={processedData.mainDesligamentos} />}
                {view === 'calendar' && <CalendarView data={processedData.all} />}
                {view === 'pendentes' && <ListView data={processedData.pendentesComprovante} />}
                {view === 'kanban' && <KanbanView data={[...processedData.mainDesligamentos, ...processedData.pendentesComprovante]} />}
                {view === 'arquivados' && <ArchivedView data={processedData.mainArquivados} />}
                {view === 'relatorios' && <ReportsView ativos={processedData.mainDesligamentos} arquivados={processedData.mainArquivados} />}
                {view === 'audit' && <AuditLogView data={processedData.all} />}
                {view === 'configuracoes' && <SettingsView />}
                {view === 'ajuda' && <HelpView />}
                {view === 'detalhe' && selected && <DetailView id={selected} />}
              </Suspense>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
      {showNew && <ModalNovoDesligamento onClose={() => setShowNew(false)} />}
      {showImport && <ModalImportarPlanilha onClose={() => setShowImport(false)} />}
    </div>
  );
}

export default function App() {
  return (<AppProvider><AppContent /></AppProvider>);
}
