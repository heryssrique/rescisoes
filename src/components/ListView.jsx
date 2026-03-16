import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { StatusBadge, MotivoBadge, ColigadaBadge, ProgressSteps, DaysUntilPayment, ChecklistProgress } from './Shared';
import { formatDate } from '../utils/formatters';
import { MOTIVOS } from '../data/initialData';
import { Search, ChevronRight, Calendar, User, AlertCircle, Archive, ChevronDown, ChevronUp } from 'lucide-react';
import { differenceInDays, parseISO } from 'date-fns';

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

function TermCard({ d, onOpen }) {
  return (
    <article
      key={d.id}
      className="term-card"
      onClick={() => onOpen(d.id)}
      id={`card-${d.id}`}
    >
      <div className={`urgency-bar ${getUrgencyClass(d.dataPagamento, d.status)}`} />
      <div className="term-card-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <div className="term-name">{d.nome}</div>
            {d.coligada && <ColigadaBadge code={d.coligada} />}
          </div>
          <div className="term-role">{d.cargo}{d.departamento ? ` · ${d.departamento}` : ''}{d.matricula ? ` · ${d.matricula}` : ''}</div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
          <StatusBadge status={d.status} />
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
          <div className="term-meta-label">Pagamento</div>
          <div className="term-meta-value highlight">
            {formatDate(d.dataPagamento)} <DaysUntilPayment dataPagamento={d.dataPagamento} />
          </div>
        </div>
        <div className="term-meta-item">
          <div className="term-meta-label">Motivo</div>
          <div className="term-meta-value"><MotivoBadge motivo={d.motivo} /></div>
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
  const { state, dispatch } = useApp();
  const { desligamentos } = state;

  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('ativos'); // padrão: apenas ativos
  const [filterMotivo, setFilterMotivo] = useState('todos');
  const [filterPrazo, setFilterPrazo] = useState('todos');
  const [sortBy, setSortBy] = useState('pagamento');
  const [showArchived, setShowArchived] = useState(false);

  const activeCount = desligamentos.filter(d => !ARCHIVED_STATUSES.includes(d.status)).length;
  const archivedCount = desligamentos.filter(d => ARCHIVED_STATUSES.includes(d.status)).length;
  const prazo7Count = desligamentos.filter(d => !ARCHIVED_STATUSES.includes(d.status) && d.prazoPagamento === '7').length;
  const prazo10Count = desligamentos.filter(d => !ARCHIVED_STATUSES.includes(d.status) && (d.prazoPagamento === '10' || !d.prazoPagamento)).length;

  const aVencer = desligamentos.filter(d => {
    if (ARCHIVED_STATUSES.includes(d.status) || !d.dataPagamento) return false;
    const days = differenceInDays(parseISO(d.dataPagamento), new Date());
    return days >= 0 && days <= 5;
  }).length;

  const vencidos = desligamentos.filter(d => {
    if (ARCHIVED_STATUSES.includes(d.status) || !d.dataPagamento) return false;
    const days = differenceInDays(parseISO(d.dataPagamento), new Date());
    return days < 0;
  }).length;

  const statusCounts = {
    comunicado: desligamentos.filter(d => d.status === 'comunicado').length,
    documentacao: desligamentos.filter(d => d.status === 'documentacao').length,
    homologacao: desligamentos.filter(d => d.status === 'homologacao').length,
    aguardando: desligamentos.filter(d => d.status === 'aguardando').length,
  };

  const applyFilter = (list, includeArchived) =>
    list.filter(d => {
      const isArchived = ARCHIVED_STATUSES.includes(d.status);
      if (!includeArchived && isArchived) return false;
      if (includeArchived && !isArchived) return false;

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

  const activeFiltered = useMemo(() => applyFilter(desligamentos, false), [desligamentos, search, filterStatus, filterMotivo]);
  const archivedFiltered = useMemo(() => applyFilter(desligamentos, true), [desligamentos, search, filterMotivo]);

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
  const archivedGrouped = useMemo(() => makeGroups(archivedFiltered), [archivedFiltered, sortBy]);

  function openDetail(id) {
    dispatch({ type: 'SET_SELECTED', id });
    dispatch({ type: 'SET_VIEW', view: 'detalhe' });
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
        <div className="stat-card green">
          <div className="stat-label">Arquivados</div>
          <div className="stat-value">{archivedCount}</div>
          <div className="stat-icon"><Archive size={48} /></div>
        </div>
        <div className="stat-card indigo">
          <div className="stat-label">Prazo 7 Dias</div>
          <div className="stat-value">{prazo7Count}</div>
          <div className="stat-icon"><Clock size={48} /></div>
        </div>
        <div className="stat-card cyan">
          <div className="stat-label">Prazo 10 Dias</div>
          <div className="stat-value">{prazo10Count}</div>
          <div className="stat-icon"><Calendar size={48} /></div>
        </div>
        <div className="stat-card purple">
          <div className="stat-label">Total Geral</div>
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
      </div>

      {/* Lista ativa */}
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
              {items.map(d => <TermCard key={d.id} d={d} onOpen={openDetail} />)}
            </div>
          </div>
        ))
      )}

      {/* Seção de Arquivados */}
      {archivedCount > 0 && (
        <div style={{ marginTop: 32 }}>
          <button
            id="btn-toggle-arquivados"
            onClick={() => setShowArchived(v => !v)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              width: '100%',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              padding: '12px 16px',
              cursor: 'pointer',
              color: 'var(--text-muted)',
              fontSize: 13,
              fontWeight: 600,
              transition: 'all 0.2s',
            }}
          >
            <Archive size={15} />
            Arquivados — Pago / Cancelado
            <span
              style={{
                marginLeft: 6,
                background: 'var(--bg-card-hover)',
                border: '1px solid var(--border-light)',
                borderRadius: 20,
                padding: '1px 8px',
                fontSize: 11,
              }}
            >
              {archivedCount}
            </span>
            <span style={{ marginLeft: 'auto' }}>
              {showArchived ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
            </span>
          </button>

          {showArchived && (
            <div style={{ marginTop: 16 }}>
              {archivedFiltered.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 24, fontSize: 13 }}>
                  Nenhum processo arquivado corresponde à busca.
                </div>
              ) : (
                archivedGrouped.map(([groupKey, items]) => (
                  <div key={groupKey} className="date-group">
                    <div className="date-group-header" style={{ opacity: 0.75 }}>
                      <Archive size={14} style={{ color: 'var(--text-muted)' }} />
                      <span className="date-group-label">
                        {groupKey === 'sem-data' ? 'Sem data' : (
                          sortBy === 'pagamento' ? `Pagamento: ${formatDate(groupKey)}` : `Status: ${groupKey}`
                        )}
                      </span>
                      <span className="section-count">{items.length}</span>
                    </div>
                    <div className="term-list" style={{ opacity: 0.7 }}>
                      {items.map(d => <TermCard key={d.id} d={d} onOpen={openDetail} />)}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
