import React from 'react';
import { useApp } from '../context/AppContext';
import { differenceInDays, parseISO, startOfDay, differenceInYears } from 'date-fns';

export function StatusBadge({ status }) {
  const { state } = useApp();
  const step = state.statusFlow?.find(s => s.key === status);
  const label = step ? step.label : (status === 'cancelado' ? 'Cancelado' : status);
  
  return (
    <span className={`status-badge status-${status}`} style={step ? { color: step.color, borderColor: `${step.color}40` } : {}}>
      <span className="dot" style={step ? { background: step.color, boxShadow: `0 0 6px ${step.color}` } : {}} />
      {label}
    </span>
  );
}

export function MotivoBadge({ motivo }) {
  const { state } = useApp();
  const m = state.motivos?.find(x => x.value === motivo);
  if (!m) return null;
  return <span className={`motivo-tag ${m.class}`}>{m.label}</span>;
}

export function AvisoBadge({ aviso, dias, dataAdmissao, dataComunicado }) {
  const labels = {
    trabalhado: 'Trabalhado',
    indenizado: 'Indenizado',
    descontado: 'Descontado',
    nao_aplicavel: 'N/A',
  };
  if (!aviso) return null;
  const label = labels[aviso] || aviso;

  let totalDias = 0;
  let indenizados = 0;

  if (dataAdmissao && dataComunicado) {
    try {
      const anosTrabalhados = differenceInYears(parseISO(dataComunicado), parseISO(dataAdmissao));
      const diasAdicionais = Math.min(Math.max(0, anosTrabalhados) * 3, 60);
      totalDias = 30 + diasAdicionais;
      if (aviso === 'indenizado') {
        indenizados = totalDias;
      } else if (aviso === 'trabalhado') {
        const diasTrabalhados = parseInt(dias) || 30;
        indenizados = Math.max(0, totalDias - diasTrabalhados);
      }
    } catch (e) {
      // ignore
    }
  }

  return (
    <span className={`aviso-tag aviso-${aviso}`}>
      {label}
      {aviso === 'trabalhado' && dias && ` (${dias}d)`}
      {aviso === 'trabalhado' && indenizados > 0 && ` + ${indenizados}d a pagar`}
      {aviso === 'indenizado' && indenizados > 0 && ` (${indenizados}d)`}
    </span>
  );
}

export function ColigadaBadge({ code }) {
  const { state } = useApp();
  const c = state.coligadas?.[code];
  if (!c) return <span className="coligada-tag" style={{ background: 'var(--bg-secondary)', color: 'var(--text-muted)' }}>{code}</span>;
  return (
    <span 
      className="coligada-tag" 
      style={{ 
        background: `${c.color}20`, 
        color: c.color,
        border: `1px solid ${c.color}40`,
        padding: '2px 8px',
        borderRadius: '12px',
        fontSize: '10px',
        fontWeight: '700',
        textTransform: 'uppercase'
      }}
    >
      {code} - {c.nome}
    </span>
  );
}

export function ProgressSteps({ status }) {
  const { state } = useApp();
  const statusFlow = state.statusFlow || [];
  const currentIdx = statusFlow.findIndex(s => s.key === status);
  return (
    <div className="progress-steps">
      {statusFlow.map((step, i) => {
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
  const days = differenceInDays(parseISO(dataPagamento), startOfDay(new Date()));
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
  const activeItems = checklist?.filter(c => !c.notApplicable) || [];
  const total = activeItems.length || 0;
  const done = activeItems.filter(c => c.done).length || 0;
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

