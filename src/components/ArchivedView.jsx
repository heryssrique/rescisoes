import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { StatusBadge, MotivoBadge, ColigadaBadge, ProgressSteps, DaysUntilPayment, ChecklistProgress } from './Shared';
import { formatDate } from '../utils/formatters';
import { MOTIVOS } from '../data/initialData';
import { Search, ChevronRight, Calendar, User, Archive, ChevronDown, ChevronUp, Clock, RotateCcw } from 'lucide-react';
import { getPaymentDate } from '../utils/dateUtils';

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

function TermCard({ d, onOpen, onUnarchive }) {
  return (
    <article
      key={d.id}
      className="term-card archived"
      onClick={() => onOpen(d.id)}
      id={`card-archived-${d.id}`}
      style={{ opacity: 0.85 }}
    >
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
            <button
              className="btn-icon-sm"
              title="Desarquivar"
              onClick={(e) => {
                e.stopPropagation();
                onUnarchive(d.id);
              }}
              style={{ padding: '2px 6px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 4, display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 600, color: 'var(--text-secondary)' }}
            >
              <RotateCcw size={10} />
              Reativar
            </button>
          </div>
          <ChevronRight size={16} style={{ color: 'var(--text-muted)', marginTop: 2 }} />
        </div>
      </div>

      <div className="term-meta">
        <div className="term-meta-item">
          <div className="term-meta-label">Admissão</div>
          <div className="term-meta-value">{formatDate(d.dataAdmissao)}</div>
        </div>
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
          <div className="term-meta-value">{formatDate(d.dataPagamento)}</div>
        </div>
        <div className="term-meta-item">
          <div className="term-meta-label">Motivo</div>
          <div className="term-meta-value"><MotivoBadge motivo={d.motivo} /></div>
        </div>
      </div>

      <div style={{ marginTop: 14 }}>
        <ChecklistProgress checklist={d.checklist} />
      </div>
    </article>
  );
}

export function ArchivedView({ data: injectedData }) {
  const { state, dispatch, actions } = useApp();
  const archivedDesligamentos = injectedData || state.archivedDesligamentos;
  const { loading } = state;
  const [search, setSearch] = useState('');
  const [filterMotivo, setFilterMotivo] = useState('todos');

  let coligadosObj = {};
  try {
    const saved = localStorage.getItem('desligest_coligadas');
    if (saved) coligadosObj = JSON.parse(saved);
  } catch (e) { }
  if (Object.keys(coligadosObj).length === 0) {
    coligadosObj = { '1': { nome: 'Concreta' }, '4': { nome: 'JPL Gomes' }, '11': { nome: 'JC Gomes' } };
  }

  useEffect(() => {
    actions.fetchArchived();
  }, []);

  const handleSearch = (e) => {
    const value = e.target.value;
    setSearch(value);
    actions.fetchArchived(value);
  };

  const filtered = useMemo(() => {
    if (!archivedDesligamentos) return [];
    return archivedDesligamentos.filter(d => {
      const matchMotivo = filterMotivo === 'todos' || d.motivo === filterMotivo;
      return matchMotivo;
    });
  }, [archivedDesligamentos, filterMotivo]);

  const grouped = useMemo(() => groupByPaymentDate(filtered), [filtered]);

  function openDetail(id) {
    dispatch({ type: 'SET_SELECTED', id });
    dispatch({ type: 'SET_VIEW', view: 'detalhe' });
  }

  async function handleUnarchive(id) {
    if (confirm('Deseja reativar este processo? Ele voltará para a lista principal.')) {
      await actions.unarchiveDesligamento(id);
    }
  }

  return (
    <div className="page-content">
      <div className="toolbar">
        <div className="search-box">
          <Search size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
          <input
            id="search-archived"
            placeholder="Pesquisar em processos arquivados..."
            value={search}
            onChange={handleSearch}
          />
        </div>

        <select id="filter-coligada-archived" className="filter-select" value={state.globalColigadaFilter || 'todas'} onChange={e => dispatch({ type: 'SET_GLOBAL_COLIGADA_FILTER', payload: e.target.value })}>
          <option value="todas">Todas as Empresas</option>
          {Object.entries(coligadosObj).map(([id, col]) => (
            <option key={id} value={id}>{id} - {col.nome}</option>
          ))}
        </select>

        <select id="filter-motivo-archived" className="filter-select" value={filterMotivo} onChange={e => setFilterMotivo(e.target.value)}>
          <option value="todos">Todos os motivos</option>
          {MOTIVOS.map(m => (
            <option key={m.value} value={m.value}>{m.label}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
          <Clock size={32} style={{ animation: 'spin 2s linear infinite', marginBottom: 16 }} />
          <p>Buscando arquivos...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <Archive size={64} style={{ color: 'var(--border)' }} />
          <p>Nenhum processo arquivado encontrado</p>
          <span>{search ? 'Tente outros termos de busca' : 'Processos terminados ou cancelados podem ser arquivados'}</span>
        </div>
      ) : (
        grouped.map(([groupKey, items]) => (
          <div key={groupKey} className="date-group">
            <div className="date-group-header">
              <Calendar size={14} style={{ color: 'var(--text-muted)' }} />
              <span className="date-group-label">
                {groupKey === 'sem-data' ? 'Sem data de pagamento' : `Pagamento: ${formatDate(groupKey)}`}
              </span>
              <span className="section-count">{items.length}</span>
            </div>
            <div className="term-list">
              {items.map(d => (
                <TermCard
                  key={d.id}
                  d={d}
                  onOpen={openDetail}
                  onUnarchive={handleUnarchive}
                />
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
