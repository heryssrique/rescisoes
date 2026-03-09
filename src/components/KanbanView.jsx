import React from 'react';
import { useApp } from '../context/AppContext';
import { StatusBadge, MotivoBadge, formatDate, DaysUntilPayment } from './Shared';
import { Calendar } from 'lucide-react';

const COLUMNS = [
  { key: 'comunicado', label: 'Comunicado', color: 'var(--accent-blue)' },
  { key: 'documentacao', label: 'Documentação', color: 'var(--accent-yellow)' },
  { key: 'homologacao', label: 'Homologação', color: 'var(--accent-purple)' },
  { key: 'aguardando', label: 'Ag. Pagamento', color: 'var(--accent-orange)' },
  { key: 'pago', label: 'Pago', color: 'var(--accent-green)' },
];

export function KanbanView() {
  const { state, dispatch } = useApp();
  const { desligamentos } = state;

  function openDetail(id) {
    dispatch({ type: 'SET_SELECTED', id });
    dispatch({ type: 'SET_VIEW', view: 'detalhe' });
  }

  return (
    <div className="page-content" style={{ paddingBottom: 0 }}>
      <div className="kanban-board">
        {COLUMNS.map(col => {
          const items = desligamentos.filter(d => d.status === col.key);
          return (
            <div key={col.key} className="kanban-col">
              <div className="kanban-col-header">
                <span className="kanban-col-title" style={{ color: col.color }}>{col.label}</span>
                <span className="kanban-col-count">{items.length}</span>
              </div>
              {items.length === 0 && (
                <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}>
                  Nenhum processo
                </div>
              )}
              {items.map(d => (
                <div key={d.id} className="kanban-card" onClick={() => openDetail(d.id)}>
                  <div className="kanban-card-name">{d.nome}</div>
                  <div className="kanban-card-role">{d.cargo}</div>
                  <div style={{ marginBottom: 8 }}>
                    <MotivoBadge motivo={d.motivo} />
                  </div>
                  <div className="kanban-card-date">
                    <Calendar size={11} />
                    Pag: {formatDate(d.dataPagamento)}
                    &nbsp;·&nbsp;
                    <DaysUntilPayment dataPagamento={d.dataPagamento} />
                  </div>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
