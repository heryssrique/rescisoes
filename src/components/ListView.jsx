import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { StatusBadge, MotivoBadge, ColigadaBadge, ProgressSteps, DaysUntilPayment, ChecklistProgress, AvisoBadge } from './Shared';
import { formatDate } from '../utils/formatters';
import { MOTIVOS } from '../data/initialData';
import { Search, ChevronRight, Calendar, User, AlertCircle, Archive, ChevronDown, ChevronUp, Clock, CheckSquare, Square, Trash2 } from 'lucide-react';
import { differenceInDays, parseISO } from 'date-fns';
import { getPaymentDate } from '../utils/dateUtils';

const ARCHIVED_STATUSES = ['pago', 'cancelado'];

function getUrgencyClass(dataPagamento, status) {
  if (ARCHIVED_STATUSES.includes(status) || !dataPagamento) return '';
  const days = differenceInDays(parseISO(dataPagamento), new Date());
  if (days < 0) return 'urgency-crit';
  if (days <= 3) return 'urgency-high';
  if (days <= 7) return 'urgency-med';
  return 'urgency-low';
}

function groupByPaymentDate(desligamentos) {
  const groups = {};
  desligamentos.forEach(d => {
    const key = d.dataPagamento || 'sem-data';
    if (!groups[key]) groups[key] = [];
    groups[key].push(d);
  });
  return Object.entries(groups).sort(([a], [b]) => {
    if (a === 'sem-data') return 1;
    if (b === 'sem-data') return -1;
    return a.localeCompare(b);
  });
}

function DateGroupTag({ dataPagamento }) {
  if (!dataPagamento) return null;
  const days = differenceInDays(parseISO(dataPagamento), new Date());
  if (days < 0) return <span className="date-group-tag vencido">Vencido há {Math.abs(days)}d</span>;
  if (days === 0) return <span className="date-group-tag vencendo">Hoje!</span>;
  if (days <= 5) return <span className="date-group-tag vencendo">Em {days}d</span>;
  return null;
}

function TermCard({ d, onOpen, onArchive, isSelected, onSelect }) {
  const isArchivable = d.status === 'pago' || d.status === 'cancelado';
  return (
    <article
      key={d.id}
      className={`term-card ${isSelected ? 'selected' : ''}`}
      onClick={() => onOpen(d.id)}
      id={`card-${d.id}`}
    >
      <div className={`urgency-bar ${getUrgencyClass(d.dataPagamento, d.status)}`} />
      
      {/* Botão de Seleção (Checkbox) */}
      <button 
        className="selection-checkbox"
        onClick={(e) => {
          e.stopPropagation();
          onSelect(d.id);
        }}
        title="Selecionar"
      >
        {isSelected ? <CheckSquare size={16} color="var(--primary)" /> : <Square size={16} color="var(--text-muted)" />}
      </button>

      <div className="term-card-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <div className="term-name">{d.nome}</div>
            {d.coligada && <ColigadaBadge code={d.coligada} />}
          </div>
          <div className="term-role">{d.cargo}{d.departamento ? ` · ${d.departamento}` : ''}{d.matricula ? ` · ${d.matricula}` : ''}</div>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
            <StatusBadge status={d.status} />
            {isArchivable && (
            <button
              className="btn-icon-sm"
              title="Mover para Arquivos"
              onClick={(e) => {
                e.stopPropagation();
                onArchive(d.id);
              }}
              style={{ padding: '2px 6px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 4, display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 600, color: 'var(--text-secondary)' }}
            >
              <Archive size={10} />
              Arquivar
            </button>
            )}
          </div>
          <ChevronRight size={16} style={{ color: 'var(--text-muted)', marginTop: 2 }} />
        </div>
      </div>

      <div className="term-meta">
        <div className="term-meta-item">
          <div className="term-meta-label">Comunicado</div>
          <div className="term-meta-value">{formatDate(d.dataComunicado)}</div>
        </div>
        <div className="term-meta-item">
          <div className="term-meta-label">Desligamento</div>
          <div className="term-meta-value">{formatDate(d.dataDesligamento)}</div>
        </div>
        <div className="term-meta-item">
          <div className="term-meta-label">Prazos de Pagamento (7d / 10d corridos)</div>
          <div className="term-meta-value highlight" style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', width: 22 }}>7d:</span>
              <span>{formatDate(getPaymentDate(d.dataDesligamento, 7))}</span>
              <DaysUntilPayment dataPagamento={getPaymentDate(d.dataDesligamento, 7)} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', width: 22 }}>10d:</span>
              <span style={{ color: 'var(--accent-yellow)', fontWeight: 600 }}>{formatDate(getPaymentDate(d.dataDesligamento, 10))}</span>
              <DaysUntilPayment dataPagamento={getPaymentDate(d.dataDesligamento, 10)} />
            </div>
          </div>
        </div>
        <div className="term-meta-item">
          <div className="term-meta-label">Motivo</div>
          <div className="term-meta-value"><MotivoBadge motivo={d.motivo} /></div>
        </div>
        <div className="term-meta-item">
          <div className="term-meta-label">Aviso Prévio</div>
          <div className="term-meta-value"><AvisoBadge aviso={d.avisoPrevio} dias={d.diasAvisoTrabalhado} /></div>
        </div>
        {d.responsavel && (
          <div className="term-meta-item">
            <div className="term-meta-label">Responsável</div>
            <div className="term-meta-value">{d.responsavel}</div>
          </div>
        )}
      </div>

      <div style={{ marginTop: 14 }}>
        <ChecklistProgress checklist={d.checklist} />
      </div>
      <ProgressSteps status={d.status} />
    </article>
  );
}

export function ListView() {
  const { state, dispatch, actions } = useApp();
  const { desligamentos } = state;

  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('ativos'); // padrão: apenas ativos
  const [filterMotivo, setFilterMotivo] = useState('todos');
  const [filterPrazo, setFilterPrazo] = useState('todos');
  const [sortBy, setSortBy] = useState('pagamento');
  const [selectedIds, setSelectedIds] = useState([]);

  const activeCount = desligamentos.length;

  const aVencer = desligamentos.filter(d => {
    if (!d.dataPagamento) return false;
    const days = differenceInDays(parseISO(d.dataPagamento), new Date());
    return days >= 0 && days <= 5;
  }).length;

  const vencidos = desligamentos.filter(d => {
    if (!d.dataPagamento) return false;
    const days = differenceInDays(parseISO(d.dataPagamento), new Date());
    return days < 0;
  }).length;

  const statusCounts = {
    comunicado: desligamentos.filter(d => d.status === 'comunicado').length,
    documentacao: desligamentos.filter(d => d.status === 'documentacao').length,
    homologacao: desligamentos.filter(d => d.status === 'homologacao').length,
    aguardando: desligamentos.filter(d => d.status === 'aguardando').length,
  };

  const applyFilter = (list) =>
    list.filter(d => {
      const matchSearch = !search ||
        d.nome?.toLowerCase().includes(search.toLowerCase()) ||
        d.cargo?.toLowerCase().includes(search.toLowerCase()) ||
        d.departamento?.toLowerCase().includes(search.toLowerCase()) ||
        d.matricula?.toLowerCase().includes(search.toLowerCase());

      const matchStatus = filterStatus === 'ativos' || filterStatus === 'todos' || d.status === filterStatus;
      const matchMotivo = filterMotivo === 'todos' || d.motivo === filterMotivo;
      const matchPrazo = filterPrazo === 'todos' || 
                         (filterPrazo === '7' && d.prazoPagamento === '7') ||
                         (filterPrazo === '10' && (d.prazoPagamento === '10' || !d.prazoPagamento));
      
      return matchSearch && matchStatus && matchMotivo && matchPrazo;
    });

  const activeFiltered = useMemo(() => applyFilter(desligamentos), [desligamentos, search, filterStatus, filterMotivo]);

  const makeGroups = (list) => {
    if (sortBy === 'pagamento') return groupByPaymentDate(list);
    const groups = {};
    list.forEach(d => {
      if (!groups[d.status]) groups[d.status] = [];
      groups[d.status].push(d);
    });
    return Object.entries(groups);
  };

  const activeGrouped = useMemo(() => makeGroups(activeFiltered), [activeFiltered, sortBy]);

  function openDetail(id) {
    dispatch({ type: 'SET_SELECTED', id });
    dispatch({ type: 'SET_VIEW', view: 'detalhe' });
  }

  async function handleArchive(id) {
    if (confirm('Mover este processo para o arquivo?')) {
      await actions.archiveDesligamento(id);
    }
  }

  function toggleSelection(id) {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  }

  function toggleSelectAll() {
    if (selectedIds.length === activeFiltered.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(activeFiltered.map(d => d.id));
    }
  }

  async function handleBulkArchive() {
    const archivableIds = activeFiltered
      .filter(d => selectedIds.includes(d.id) && (d.status === 'pago' || d.status === 'cancelado'))
      .map(d => d.id);
    
    if (archivableIds.length === 0) {
      alert('Atenção: Nesses status selecionados, nenhum pode ser arquivado no momento (apenas Status "Pago" ou "Cancelado").');
      return;
    }

    if (confirm(`Deseja arquivar os ${archivableIds.length} processos selecionados?`)) {
      await actions.bulkArchive(archivableIds);
      setSelectedIds([]);
    }
  }

  async function handleBulkDelete() {
    if (confirm(`⚠️ EXCLUSÃO PERMANENTE: Deseja apagar os ${selectedIds.length} processos selecionados?`)) {
      await actions.bulkDelete(selectedIds);
      setSelectedIds([]);
    }
  }

  return (
    <div className="page-content">
      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card blue">
          <div className="stat-label">Em Andamento</div>
          <div className="stat-value">{activeCount}</div>
          <div className="stat-icon"><User size={48} /></div>
        </div>
        <div className="stat-card yellow">
          <div className="stat-label">A Vencer (5d)</div>
          <div className="stat-value">{aVencer}</div>
          <div className="stat-icon"><Calendar size={48} /></div>
        </div>
        <div className="stat-card red">
          <div className="stat-label">Vencidos</div>
          <div className="stat-value">{vencidos}</div>
          <div className="stat-icon"><AlertCircle size={48} /></div>
        </div>
        <div className="stat-card purple">
          <div className="stat-label">Total Ativos</div>
          <div className="stat-value">{desligamentos.length}</div>
          <div className="stat-icon"><User size={48} /></div>
        </div>
      </div>

      {/* Filters */}
      <div className="toolbar">
        <div className="search-box">
          <Search size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
          <input
            id="search-input"
            placeholder="Buscar por nome, cargo, matrícula..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <select id="filter-status" className="filter-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="ativos">Processos Ativos</option>
          <option value="comunicado">Comunicado ({statusCounts.comunicado})</option>
          <option value="documentacao">Documentação ({statusCounts.documentacao})</option>
          <option value="homologacao">Homologação ({statusCounts.homologacao})</option>
          <option value="aguardando">Ag. Pagamento ({statusCounts.aguardando})</option>
        </select>

        <select id="filter-motivo" className="filter-select" value={filterMotivo} onChange={e => setFilterMotivo(e.target.value)}>
          <option value="todos">Todos os motivos</option>
          {MOTIVOS.map(m => (
            <option key={m.value} value={m.value}>{m.label}</option>
          ))}
        </select>

        <select id="filter-prazo" className="filter-select" value={filterPrazo} onChange={e => setFilterPrazo(e.target.value)}>
          <option value="todos">Prazos: Todos</option>
          <option value="7">Prazo 7 Dias</option>
          <option value="10">Prazo 10 Dias</option>
        </select>

        <select id="sort-select" className="filter-select" value={sortBy} onChange={e => setSortBy(e.target.value)}>
          <option value="pagamento">Agrupar por Pagamento</option>
          <option value="status">Agrupar por Status</option>
        </select>

        {/* Botão Selecionar Todos no final do toolbar */}
        <button 
          type="button"
          className={`btn btn-secondary btn-sm ${selectedIds.length > 0 ? 'active' : ''}`}
          onClick={toggleSelectAll}
          style={{ height: '38px', gap: 8, margin: 0 }}
          title="Selecionar Todos"
        >
          {selectedIds.length === activeFiltered.length && activeFiltered.length > 0 ? <CheckSquare size={16} /> : <Square size={16} />}
          <span style={{ fontSize: 13, fontWeight: 600 }}>{selectedIds.length > 0 ? `${selectedIds.length} selecionados` : 'Sel. Todos'}</span>
        </button>
      </div>

      {/* Floating Bulk Action Bar */}
      {selectedIds.length > 0 && (
        <div className="bulk-actions-bar">
          <div className="bulk-actions-content">
            <span className="bulk-selection-count">
              <CheckSquare size={16} />
              {selectedIds.length} {selectedIds.length === 1 ? 'item selecionado' : 'itens selecionados'}
            </span>
            <div className="bulk-buttons">
              <button 
                type="button"
                className="btn btn-secondary btn-sm" 
                onClick={handleBulkArchive} 
                title="Arquivar selecionados"
                style={{ cursor: 'pointer', padding: '8px 16px' }}
              >
                <Archive size={14} />
                Arquivar
              </button>
              <button 
                type="button"
                className="btn btn-danger btn-sm" 
                onClick={handleBulkDelete} 
                title="Excluir selecionados"
                style={{ cursor: 'pointer', padding: '8px 16px' }}
              >
                <Trash2 size={14} />
                Excluir
              </button>
              <button 
                type="button"
                className="btn-icon-sm" 
                onClick={() => setSelectedIds([])} 
                title="Limpar seleção"
                style={{ cursor: 'pointer', marginLeft: 8 }}
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {activeFiltered.length === 0 ? (
        <div className="empty-state">
          <User size={64} />
          <p>Nenhum processo ativo encontrado</p>
          <span>Tente ajustar os filtros ou crie um novo desligamento</span>
        </div>
      ) : (
        activeGrouped.map(([groupKey, items]) => (
          <div key={groupKey} className="date-group">
            <div className="date-group-header">
              <Calendar size={14} style={{ color: 'var(--text-muted)' }} />
              <span className="date-group-label">
                {groupKey === 'sem-data' ? 'Sem data de pagamento' : (
                  sortBy === 'pagamento'
                    ? `Pagamento: ${formatDate(groupKey)}`
                    : `Status: ${groupKey}`
                )}
              </span>
              <DateGroupTag dataPagamento={groupKey !== 'sem-data' ? groupKey : null} />
              <span className="section-count">{items.length}</span>
            </div>
            <div className="term-list">
              {items.map(d => <TermCard key={d.id} d={d} onOpen={openDetail} onArchive={handleArchive} />)}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
