import React from 'react';
import { STATUS_FLOW, MOTIVOS } from '../data/initialData';
import { differenceInDays, parseISO } from 'date-fns';

export function StatusBadge({ status }) {
  const labels = {
    comunicado: 'Comunicado',
    documentacao: 'Documentação',
    homologacao: 'Homologação',
    aguardando: 'Ag. Pagamento',
    pago: 'Pago',
    cancelado: 'Cancelado',
  };
  return (
    <span className={`status-badge status-${status}`}>
      <span className="dot" />
      {labels[status] || status}
    </span>
  );
}

export function MotivoBadge({ motivo }) {
  const m = MOTIVOS.find(x => x.value === motivo);
  if (!m) return null;
  return <span className={`motivo-tag ${m.class}`}>{m.label}</span>;
}

export function ProgressSteps({ status }) {
  const currentIdx = STATUS_FLOW.findIndex(s => s.key === status);
  return (
    <div className="progress-steps">
      {STATUS_FLOW.map((step, i) => {
        const isCompleted = i < currentIdx;
        const isActive = i === currentIdx;
        return (
          <div
            key={step.key}
            className={`step-item ${isCompleted ? 'completed' : ''} ${isActive ? 'active' : ''}`}
          >
            <div className="step-dot">
              {isCompleted ? '✓' : i + 1}
            </div>
            <div className="step-label">{step.short}</div>
          </div>
        );
      })}
    </div>
  );
}

export function DaysUntilPayment({ dataPagamento }) {
  if (!dataPagamento) return null;
  const days = differenceInDays(parseISO(dataPagamento), new Date());
  let txt = '';
  if (days < 0) {
    txt = `Vencido há ${Math.abs(days)}d`;
  } else if (days === 0) {
    txt = 'Hoje!';
  } else if (days <= 5) {
    txt = `${days}d restantes`;
  } else {
    txt = `${days}d`;
  }
  return <span style={{ color: days < 0 ? '#f87171' : days <= 5 ? '#fcd34d' : '#60a5fa' }}>{txt}</span>;
}

export function ChecklistProgress({ checklist }) {
  const total = checklist?.length || 0;
  const done = checklist?.filter(c => c.done).length || 0;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>
        <span>{done}/{total} itens concluídos</span>
        <span>{pct}%</span>
      </div>
      <div className="progress-bar-container">
        <div className="progress-bar-fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

