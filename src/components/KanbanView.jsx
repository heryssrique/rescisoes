import React from 'react';
import { useApp } from '../context/AppContext';
import { StatusBadge, MotivoBadge, DaysUntilPayment } from './Shared';
import { formatDate } from '../utils/formatters';
import { Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const COLUMNS = [
  { key: 'comunicado', label: 'Comunicado', color: 'var(--accent-blue)' },
  { key: 'documentacao', label: 'Documentação', color: 'var(--accent-yellow)' },
  { key: 'homologacao', label: 'Homologação', color: 'var(--accent-purple)' },
  { key: 'aguardando', label: 'Ag. Pagamento', color: 'var(--accent-orange)' },
  { key: 'pago', label: 'Pago', color: 'var(--accent-green)' },
];

export function KanbanView({ data: injectedData }) {
  const { state, dispatch } = useApp();
  const desligamentos = injectedData || state.desligamentos;

  function openDetail(id) {
    dispatch({ type: 'SET_SELECTED', id });
    dispatch({ type: 'SET_VIEW', view: 'detalhe' });
  }

  return (
    <div className="page-content" style={{ paddingBottom: 0 }}>
      <div className="kanban-board">
        {COLUMNS.map((col, idx) => {
          const items = desligamentos.filter(d => d.status === col.key);
          return (
            <motion.div 
              key={col.key} 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="kanban-col"
            >
              <div className="kanban-col-header">
                <span className="kanban-col-title" style={{ color: col.color }}>{col.label}</span>
                <span className="kanban-col-count">{items.length}</span>
              </div>
              <div className="kanban-items-container">
                <AnimatePresence mode="popLayout">
                  {items.map(d => (
                    <motion.div 
                      layout
                      key={d.id} 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      whileHover={{ y: -4, boxShadow: '0 10px 20px rgba(0,0,0,0.4)' }}
                      className="kanban-card" 
                      onClick={() => openDetail(d.id)}
                    >
                      <div className="kanban-card-name">{d.nome}</div>
                      <div className="kanban-card-role">{d.cargo}</div>
                      <div style={{ marginBottom: 8, display: 'flex', gap: 4 }}>
                        <MotivoBadge motivo={d.motivo} />
                      </div>
                      <div className="kanban-card-date">
                        <Calendar size={11} />
                        Pag: {formatDate(d.dataPagamento)}
                        &nbsp;·&nbsp;
                        <DaysUntilPayment dataPagamento={d.dataPagamento} />
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                {items.length === 0 && (
                  <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}>
                    Nenhum processo
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
