import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { StatusBadge, MotivoBadge, ProgressSteps, DaysUntilPayment, ChecklistProgress } from './Shared';
import { formatDate } from '../utils/formatters';
import { Search, Filter, ChevronRight, Calendar, User, AlertCircle } from 'lucide-react';
import { differenceInDays, parseISO } from 'date-fns';

function getUrgencyClass(dataPagamento, status) {
  if (status === 'pago' || status === 'cancelado') return '';
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

export function ListView() {
  const { state, dispatch } = useApp();
  const { desligamentos } = state;

  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('todos');
  const [filterMotivo, setFilterMotivo] = useState('todos');
  const [sortBy, setSortBy] = useState('pagamento');

  const activeCount = desligamentos.filter(d => d.status !== 'pago' && d.status !== 'cancelado').length;

  const filtered = useMemo(() => {
    return desligamentos.filter(d => {
      const matchSearch = !search ||
        d.nome.toLowerCase().includes(search.toLowerCase()) ||
        d.cargo.toLowerCase().includes(search.toLowerCase()) ||
        d.departamento?.toLowerCase().includes(search.toLowerCase()) ||
        d.matricula?.toLowerCase().includes(search.toLowerCase());
      const matchStatus = filterStatus === 'todos' || d.status === filterStatus;
      const matchMotivo = filterMotivo === 'todos' || d.motivo === filterMotivo;
      return matchSearch && matchStatus && matchMotivo;
    });
  }, [desligamentos, search, filterStatus, filterMotivo]);

  const grouped = useMemo(() => {
    if (sortBy === 'pagamento') return groupByPaymentDate(filtered);
    // Sort by status
    const groups = {};
    filtered.forEach(d => {
      if (!groups[d.status]) groups[d.status] = [];
      groups[d.status].push(d);
    });
    return Object.entries(groups);
  }, [filtered, sortBy]);

  function openDetail(id) {
    dispatch({ type: 'SET_SELECTED', id });
    dispatch({ type: 'SET_VIEW', view: 'detalhe' });
  }

  const aVencer = desligamentos.filter(d => {
    if (d.status === 'pago' || d.status === 'cancelado') return false;
    const days = differenceInDays(parseISO(d.dataPagamento), new Date());
    return days >= 0 && days <= 5;
  }).length;

  const vencidos = desligamentos.filter(d => {
    if (d.status === 'pago' || d.status === 'cancelado') return false;
    const days = differenceInDays(parseISO(d.dataPagamento), new Date());
    return days < 0;
  }).length;

  const statusCounts = {
    comunicado: desligamentos.filter(d => d.status === 'comunicado').length,
    documentacao: desligamentos.filter(d => d.status === 'documentacao').length,
    homologacao: desligamentos.filter(d => d.status === 'homologacao').length,
    aguardando: desligamentos.filter(d => d.status === 'aguardando').length,
    pago: desligamentos.filter(d => d.status === 'pago').length,
  };

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
          <div className="stat-label">Pagos</div>
          <div className="stat-value">{statusCounts.pago}</div>
          <div className="stat-icon"><User size={48} /></div>
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
          <option value="todos">Todos os status</option>
          <option value="comunicado">Comunicado ({statusCounts.comunicado})</option>
          <option value="documentacao">Documentação ({statusCounts.documentacao})</option>
          <option value="homologacao">Homologação ({statusCounts.homologacao})</option>
          <option value="aguardando">Ag. Pagamento ({statusCounts.aguardando})</option>
          <option value="pago">Pago ({statusCounts.pago})</option>
          <option value="cancelado">Cancelado</option>
        </select>

        <select id="filter-motivo" className="filter-select" value={filterMotivo} onChange={e => setFilterMotivo(e.target.value)}>
          <option value="todos">Todos os motivos</option>
          <option value="pedido">Pedido de Demissão</option>
          <option value="demissao">Sem Justa Causa</option>
          <option value="acordo">Acordo Mútuo</option>
          <option value="justa">Justa Causa</option>
          <option value="aposentadoria">Aposentadoria</option>
        </select>

        <select id="sort-select" className="filter-select" value={sortBy} onChange={e => setSortBy(e.target.value)}>
          <option value="pagamento">Agrupar por Pagamento</option>
          <option value="status">Agrupar por Status</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <User size={64} />
          <p>Nenhum desligamento encontrado</p>
          <span>Tente ajustar os filtros ou crie um novo desligamento</span>
        </div>
      ) : (
        grouped.map(([groupKey, items]) => (
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
              {items.map(d => (
                <article
                  key={d.id}
                  className="term-card"
                  onClick={() => openDetail(d.id)}
                  id={`card-${d.id}`}
                >
                  <div className={`urgency-bar ${getUrgencyClass(d.dataPagamento, d.status)}`} />
                  <div className="term-card-header">
                    <div>
                      <div className="term-name">{d.nome}</div>
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
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
