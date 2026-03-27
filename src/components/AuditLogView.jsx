import React, { useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { History, User, FileText, CheckCircle2, Clock } from 'lucide-react';

export function AuditLogView({ data }) {
  const { dispatch } = useApp();

  const allLogs = useMemo(() => {
    let logs = [];
    (data || []).forEach(d => {
      if (d.historico && Array.isArray(d.historico)) {
        d.historico.forEach(h => {
          logs.push({
            ...h,
            id: d.id,
            nome: d.nome,
            coligada: d.coligada,
            timestamp: h.data ? new Date(h.data) : new Date(0)
          });
        });
      }
    });

    // Sort by most recent
    return logs.sort((a, b) => b.timestamp - a.timestamp);
  }, [data]);

  const openDetail = (id) => {
    dispatch({ type: 'SET_SELECTED', id });
    dispatch({ type: 'SET_VIEW', view: 'detalhe' });
  };

  const getLogIcon = (acao) => {
    const text = (acao || '').toLowerCase();
    if (text.includes('checklist')) return <CheckCircle2 size={16} color="var(--accent-green)" />;
    if (text.includes('arquivado')) return <Clock size={16} color="var(--accent-purple)" />;
    if (text.includes('pago')) return <FileText size={16} color="var(--accent-blue)" />;
    return <History size={16} color="var(--accent-blue)" />;
  };

  return (
    <div className="audit-log-container" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Search and Summary */}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 200, padding: 16, background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <History size={18} color="var(--accent-blue)" />
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Total de Atividades</h3>
          </div>
          <div style={{ fontSize: 32, fontWeight: 800 }}>{allLogs.length}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, fontWeight: 600, textTransform: 'uppercase' }}>Eventos registrados</div>
        </div>
      </div>

      {/* Logs Table */}
      <div style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: 600 }}>
            <thead>
              <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)' }}>
                <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', width: 140 }}>Data/Hora</th>
                <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Colaborador</th>
                <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Ação Realizada</th>
                <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Notas</th>
                <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', width: 80 }}>Link</th>
              </tr>
            </thead>
            <tbody>
              {allLogs.length > 0 ? (
                allLogs.map((log, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'} onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                    <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{format(log.timestamp, 'dd MMM yyyy', { locale: ptBR })}</div>
                      <div style={{ fontSize: 10, opacity: 0.7 }}>{format(log.timestamp, 'HH:mm:ss')}</div>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{log.nome}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>C{log.coligada}</div>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                        {getLogIcon(log.acao)}
                        <span style={{ fontWeight: 500 }}>{log.acao}</span>
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--text-muted)', maxWidth: 250, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {log.nota || '-'}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <button 
                        onClick={() => openDetail(log.id)}
                        className="btn-icon" 
                        style={{ background: 'rgba(59, 130, 246, 0.1)', border: 'none', padding: 6, borderRadius: 8, color: 'var(--accent-blue)', cursor: 'pointer' }}
                        title="Ver Processo"
                      >
                        <User size={14} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
                    <History size={32} style={{ opacity: 0.2, marginBottom: 12 }} />
                    <p>Nenhum histórico registrado ainda.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
