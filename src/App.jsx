import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { ListView } from './components/ListView';
import { KanbanView } from './components/KanbanView';
import { DetailView } from './components/DetailView';
import { ModalNovoDesligamento } from './components/Modals';
import { ModalImportarPlanilha } from './components/ImportModal';
import { seedDatabase } from './services/api';
import {
  LayoutList, Columns, Plus, Users, Database, AlertTriangle, Loader, FileSpreadsheet
} from 'lucide-react';

function AppContent() {
  const { state, dispatch, actions } = useApp();
  const { view, selected, desligamentos, loading, error } = state;
  const [showNew, setShowNew] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [seeding, setSeeding] = useState(false);

  const activeCount = desligamentos.filter(d => d.status !== 'pago' && d.status !== 'cancelado').length;

  async function handleSeed() {
    if (!window.confirm('Isso irá apagar todos os dados e inserir os dados de exemplo. Confirma?')) return;
    setSeeding(true);
    try {
      await seedDatabase();
      await actions.fetchAll();
    } catch (e) {
      alert('Erro no seed: ' + e.message);
    } finally {
      setSeeding(false);
    }
  }

  // Loading skeleton
  if (loading) {
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
  ];

  const viewTitles = {
    lista: 'Processos de Desligamento',
    kanban: 'Quadro Kanban',
    detalhe: 'Detalhe do Processo',
  };

  const viewSubtitles = {
    lista: 'Organizados por data de pagamento',
    kanban: 'Visão por etapa do processo',
    detalhe: selected ? desligamentos.find(d => d.id === selected)?.nome : '',
  };

  return (
    <div className="app-layout">
      {/* Sidebar */}
      <nav className="sidebar" aria-label="Navegação principal">
        <div className="sidebar-logo">
          <div className="logo-mark">
            <div className="logo-icon">
              <Users size={18} color="white" />
            </div>
            <span className="logo-text">DesliGest</span>
          </div>
          <div className="logo-sub">Gestão de Desligamentos</div>
        </div>

        <div className="sidebar-nav">
          <div className="nav-section-label">Navegação</div>
          {navItems.map(item => (
            <button
              key={item.id}
              id={`nav-${item.id}`}
              className={`nav-item ${view === item.id ? 'active' : ''}`}
              onClick={() => dispatch({ type: 'SET_VIEW', view: item.id })}
            >
              {item.icon}
              {item.label}
              {item.badge > 0 && <span className="badge">{item.badge}</span>}
            </button>
          ))}

          <div className="nav-section-label" style={{ marginTop: 16 }}>Ações</div>
          <button
            id="nav-novo"
            className="nav-item"
            onClick={() => setShowNew(true)}
          >
            <Plus size={15} />
            Novo Desligamento
          </button>
          <button
            id="nav-import"
            className="nav-item"
            onClick={() => setShowImport(true)}
          >
            <FileSpreadsheet size={15} />
            Importar Planilha
          </button>
          <button
            id="nav-seed"
            className="nav-item"
            onClick={handleSeed}
            disabled={seeding}
            title="Popular banco com dados de exemplo"
          >
            {seeding ? <Loader size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <Database size={15} />}
            {seeding ? 'Populando...' : 'Dados de Exemplo'}
          </button>
        </div>

        <div className="sidebar-footer">
          <div style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center' }}>
            {desligamentos.length} processo{desligamentos.length !== 1 ? 's' : ''} registrado{desligamentos.length !== 1 ? 's' : ''}
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
        {view === 'lista' && <ListView />}
        {view === 'kanban' && <KanbanView />}
        {view === 'detalhe' && selected && <DetailView id={selected} />}
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
