import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { StatusBadge, MotivoBadge, ProgressSteps, DaysUntilPayment, ChecklistProgress, formatDate, formatDateTime } from './Shared';
import { ModalEditarDesligamento } from './Modals';
import {
  ArrowLeft, Edit2, Trash2, Calendar, User, Briefcase,
  CheckSquare, Clock, AlertTriangle, MessageSquare, Plus, Loader
} from 'lucide-react';
import { CHECKLIST_TEMPLATE, STATUS_FLOW } from '../data/initialData';
import { format } from 'date-fns';

const AVISO_LABEL = { trabalhado: 'Trabalhado', indenizado: 'Indenizado', nao_aplicavel: 'Não aplicável' };

export function DetailView({ id }) {
  const { state, dispatch, actions } = useApp();
  const d = state.desligamentos.find(x => x.id === id);
  const [showEdit, setShowEdit] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [activeTab, setActiveTab] = useState('checklist');
  const [nota, setNota] = useState('');
  const [acaoNote, setAcaoNote] = useState('');
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [savingStatus, setSavingStatus] = useState(false);

  if (!d) return null;

  async function handleDelete() {
    try {
      await actions.deleteDesligamento(d.id);
    } catch {}
    dispatch({ type: 'SET_SELECTED', id: null });
    dispatch({ type: 'SET_VIEW', view: 'lista' });
  }

  async function handleToggle(itemId) {
    await actions.toggleChecklist(d.id, itemId);
  }

  async function handleAddNota() {
    if (!nota.trim() && !acaoNote.trim()) return;
    await actions.addHistorico(d.id, {
      data: format(new Date(), "yyyy-MM-dd'T'HH:mm:ss"),
      acao: acaoNote || 'Nota adicionada',
      nota,
    });
    setNota('');
    setAcaoNote('');
    setShowNoteInput(false);
  }

  async function handleStatusChange(newStatus) {
    setSavingStatus(true);
    try {
      await actions.changeStatus(d, newStatus);
    } catch {}
    setSavingStatus(false);
  }

  // Group checklist by etapa
  const checklistByEtapa = {
    comunicado: d.checklist.filter(c => c.etapa === 'comunicado'),
    documentacao: d.checklist.filter(c => c.etapa === 'documentacao'),
    homologacao: d.checklist.filter(c => c.etapa === 'homologacao'),
    aguardando: d.checklist.filter(c => c.etapa === 'aguardando'),
    pago: d.checklist.filter(c => c.etapa === 'pago'),
  };

  const etapaLabels = {
    comunicado: 'Comunicado',
    documentacao: 'Documentação',
    homologacao: 'Homologação',
    aguardando: 'Pagamento',
    pago: 'Conclusão',
  };

  return (
    <div className="page-content">
      {showEdit && <ModalEditarDesligamento desligamento={d} onClose={() => setShowEdit(false)} />}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 24 }}>
        <button
          className="btn btn-secondary btn-sm"
          onClick={() => { dispatch({ type: 'SET_SELECTED', id: null }); dispatch({ type: 'SET_VIEW', view: 'lista' }); }}
          id="btn-voltar"
        >
          <ArrowLeft size={14} /> Voltar
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: -0.5 }}>{d.nome}</h1>
            <StatusBadge status={d.status} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: 'var(--text-muted)', fontSize: 13 }}>
            <span>{d.cargo}</span>
            {d.departamento && <><span>·</span><span>{d.departamento}</span></>}
            {d.matricula && <><span>·</span><span>{d.matricula}</span></>}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary btn-sm" onClick={() => setShowEdit(true)} id="btn-editar">
            <Edit2 size={13} /> Editar
          </button>
          {!confirmDelete
            ? <button className="btn btn-danger btn-sm" onClick={() => setConfirmDelete(true)} id="btn-excluir">
                <Trash2 size={13} /> Excluir
              </button>
            : <div style={{ display: 'flex', gap: 6 }}>
                <button className="btn btn-danger btn-sm" onClick={handleDelete}>Confirmar</button>
                <button className="btn btn-secondary btn-sm" onClick={() => setConfirmDelete(false)}>Cancelar</button>
              </div>
          }
        </div>
      </div>

      {/* Progress */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
              Etapa Atual
            </span>
            <div style={{ display: 'flex', gap: 6 }}>
              {STATUS_FLOW.map(s => (
                <button
                  key={s.key}
                  className={`chip btn-sm ${d.status === s.key ? 'active' : ''}`}
                  style={{ fontSize: 11 }}
                  onClick={() => handleStatusChange(s.key)}
                >
                  {s.short}
                </button>
              ))}
              <button
                className={`chip btn-sm ${d.status === 'cancelado' ? 'active' : ''}`}
                style={{ fontSize: 11, borderColor: 'rgba(239,68,68,0.3)', color: '#f87171' }}
                onClick={() => handleStatusChange('cancelado')}
              >
                Cancelar
              </button>
            </div>
          </div>
          <ProgressSteps status={d.status} />
        </div>
        <div className="divider" />
        <ChecklistProgress checklist={d.checklist} />
      </div>

      {/* Info grid */}
      <div className="info-grid" style={{ marginBottom: 20 }}>
        <div className="info-item">
          <div className="info-item-label">Data do Comunicado</div>
          <div className="info-item-value">{formatDate(d.dataComunicado)}</div>
        </div>
        <div className="info-item">
          <div className="info-item-label">Data de Desligamento</div>
          <div className="info-item-value">{formatDate(d.dataDesligamento)}</div>
        </div>
        <div className="info-item">
          <div className="info-item-label">📅 Data de Pagamento</div>
          <div className="info-item-value" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {formatDate(d.dataPagamento)}
            <DaysUntilPayment dataPagamento={d.dataPagamento} />
          </div>
        </div>
        <div className="info-item">
          <div className="info-item-label">Aviso Prévio</div>
          <div className="info-item-value">{AVISO_LABEL[d.avisoPrevio] || d.avisoPrevio}</div>
        </div>
        <div className="info-item" style={{ gridColumn: '1/-1' }}>
          <div className="info-item-label">Motivo</div>
          <div className="info-item-value"><MotivoBadge motivo={d.motivo} /></div>
        </div>
        {d.responsavel && (
          <div className="info-item" style={{ gridColumn: '1/-1' }}>
            <div className="info-item-label">Responsável RH</div>
            <div className="info-item-value">{d.responsavel}</div>
          </div>
        )}
        {d.observacoes && (
          <div className="info-item" style={{ gridColumn: '1/-1' }}>
            <div className="info-item-label">Observações</div>
            <div className="info-item-value" style={{ fontWeight: 400, fontSize: 13, color: 'var(--text-secondary)' }}>{d.observacoes}</div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button className={`tab ${activeTab === 'checklist' ? 'active' : ''}`} onClick={() => setActiveTab('checklist')}>
          <CheckSquare size={13} style={{ display: 'inline', marginRight: 5 }} />
          Checklist
        </button>
        <button className={`tab ${activeTab === 'historico' ? 'active' : ''}`} onClick={() => setActiveTab('historico')}>
          <Clock size={13} style={{ display: 'inline', marginRight: 5 }} />
          Histórico
        </button>
      </div>

      {activeTab === 'checklist' && (
        <div>
          {Object.entries(checklistByEtapa).map(([etapa, items]) => (
            <div key={etapa} style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                  {etapaLabels[etapa]}
                </span>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  {items.filter(i => i.done).length}/{items.length}
                </span>
              </div>
              {items.map(item => (
                <label key={item.id} className={`checklist-item ${item.done ? 'done' : ''}`}>
                  <input
                    type="checkbox"
                    checked={item.done}
                    onChange={() => handleToggle(item.id)}
                  />
                  <span className="checklist-label">{item.label}</span>
                  {item.doneAt && <span className="checklist-meta">{formatDateTime(item.doneAt)}</span>}
                </label>
              ))}
            </div>
          ))}
        </div>
      )}

      {activeTab === 'historico' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
            <button className="btn btn-secondary btn-sm" onClick={() => setShowNoteInput(v => !v)} id="btn-add-nota">
              <Plus size={13} /> Adicionar Nota
            </button>
          </div>

          {showNoteInput && (
            <div className="card" style={{ marginBottom: 16 }}>
              <div className="form-group" style={{ marginBottom: 10 }}>
                <label className="form-label">Ação/Título</label>
                <input
                  className="form-input"
                  placeholder="Ex: Documentação entregue"
                  value={acaoNote}
                  onChange={e => setAcaoNote(e.target.value)}
                />
              </div>
              <div className="form-group" style={{ marginBottom: 10 }}>
                <label className="form-label">Nota / Observação</label>
                <textarea
                  className="form-input"
                  placeholder="Detalhes adicionais..."
                  value={nota}
                  onChange={e => setNota(e.target.value)}
                  rows={3}
                />
              </div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button className="btn btn-secondary btn-sm" onClick={() => setShowNoteInput(false)}>Cancelar</button>
                <button className="btn btn-primary btn-sm" onClick={handleAddNota}>Salvar Nota</button>
              </div>
            </div>
          )}

          <div className="timeline">
            {[...d.historico].reverse().map((h, i) => (
              <div key={i} className="timeline-item">
                <div className={`timeline-dot ${i === 0 ? 'active' : ''}`}>
                  <Clock size={12} />
                </div>
                <div className="timeline-content">
                  <div className="timeline-title">{h.acao}</div>
                  <div className="timeline-date">{formatDateTime(h.data)}</div>
                  {h.nota && <div className="timeline-note">{h.nota}</div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
