import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { useToast } from './Toast';
import { StatusBadge, MotivoBadge, ColigadaBadge, ProgressSteps, DaysUntilPayment, ChecklistProgress, AvisoBadge } from './Shared';
import { formatDate, formatDateTime } from '../utils/formatters';
import { ModalEditarDesligamento } from './Modals';
import {
  ArrowLeft, Edit2, Trash2, Calendar, User, Briefcase,
  CheckSquare, Clock, AlertTriangle, MessageSquare, Plus, Loader,
  Archive, RotateCcw, CheckCircle2, Circle, MinusCircle, FileText, Paperclip, X
} from 'lucide-react';
import { CHECKLIST_TEMPLATE } from '../data/initialData';
import { format } from 'date-fns';
import { getPaymentDate } from '../utils/dateUtils';


const AVISO_LABEL = { trabalhado: 'Trabalhado', indenizado: 'Indenizado', nao_aplicavel: 'Não aplicável' };

export function DetailView({ id }) {
  const { state, dispatch, actions } = useApp();
  const { toast, confirm: showConfirm } = useToast();
  const d = state.desligamentos.find(x => x.id === id) || state.archivedDesligamentos?.find(x => x.id === id);
  const [showEdit, setShowEdit] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem('desligest_detail_tab') || 'checklist';
  });

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    localStorage.setItem('desligest_detail_tab', tabId);
  };
  const [nota, setNota] = useState('');
  const [acaoNote, setAcaoNote] = useState('');
  const [showNoteInput, setShowNoteInput] = useState(false);

  // Mover hooks para antes do early return para evitar Erro #300 do React
  const idsToRemove = useMemo(() => ['d4', 'd5', 'h6', 'h7'], []);
  const checklist = useMemo(() => (d?.checklist || []).filter(c => !idsToRemove.includes(c.id)), [d?.checklist, idsToRemove]);
  
  const checklistByEtapa = useMemo(() => ({
    comunicado: checklist.filter(c => c.etapa === 'comunicado'),
    documentacao: checklist.filter(c => c.etapa === 'documentacao'),
    homologacao: checklist.filter(c => c.etapa === 'homologacao'),
    aguardando: checklist.filter(c => c.etapa === 'aguardando'),
    pago: checklist.filter(c => c.etapa === 'pago'),
    concluido: checklist.filter(c => c.etapa === 'concluido'),
  }), [checklist]);

  const etapaLabels = useMemo(() => ({
    comunicado: 'Comunicado',
    documentacao: 'Documentação',
    homologacao: 'Homologação',
    aguardando: 'Pagamento',
    pago: 'Conclusão',
    concluido: 'Concluído',
  }), []);

  if (!d) return null;

  const isArchived = d.arquivado === true;

  async function handleDelete() {
    try {
      await actions.deleteDesligamento(d.id);
    } catch {
      // Erro silenciado para manter fluxo de navegação
    }
    dispatch({ type: 'SET_SELECTED', id: null });
    dispatch({ type: 'SET_VIEW', view: isArchived ? 'arquivados' : 'lista' });
  }

  async function handleArchive() {
    const ok = await showConfirm('Mover este processo para o arquivo?', { title: 'Arquivar Processo', confirmText: 'Arquivar' });
    if (ok) {
      await actions.archiveDesligamento(d.id);
      dispatch({ type: 'SET_VIEW', view: 'arquivados' });
    }
  }

  async function handleUnarchive() {
    const ok = await showConfirm('Reativar este processo? Ele voltará para a lista principal.', { title: 'Reativar Processo', confirmText: 'Reativar' });
    if (ok) {
      await actions.unarchiveDesligamento(d.id);
      dispatch({ type: 'SET_VIEW', view: 'lista' });
    }
  }

  async function handleToggle(itemId) {
    await actions.toggleChecklist(d.id, itemId);
  }

  async function handleToggleNaoAplicavel(itemId) {
    await actions.toggleNaoAplicavel(d.id, itemId);
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
    try {
      await actions.changeStatus(d, newStatus);
      if (newStatus === 'pago') {
        const style = localStorage.getItem('desligest_confetti_style') || 'royal_gold';
        actions.triggerCelebration(style);

        toast('🎉 Processo concluído e pago!', 'success');
      }
    } catch (err) {
      console.error('Erro ao alterar status:', err);
      toast('Erro ao alterar status: ' + err.message, 'error');
    }
  }

  function handleGenerateReport() {
    let report = `RELATÓRIO DE DESLIGAMENTO\n`;
    report += `=========================\n\n`;
    report += `Colaborador: ${d.nome}\n`;
    report += `Cargo: ${d.cargo}\n`;
    if (d.departamento) report += `Departamento: ${d.departamento}\n`;
    if (d.matricula) report += `Matrícula: ${d.matricula}\n`;
    report += `Data Admissão: ${formatDate(d.dataAdmissao)}\n`;
    report += `Data do Comunicado: ${formatDate(d.dataComunicado)}\n`;
    report += `Data Desligamento: ${formatDate(d.dataDesligamento)}\n`;
    const statusObj = (state.statusFlow || []).find(s => s.key === d.status);
    report += `Status: ${statusObj ? statusObj.short : d.status}\n\n`;

    report += `CHECKLIST\n`;
    report += `---------\n\n`;

    Object.entries(checklistByEtapa).forEach(([etapa, items]) => {
      report += `${etapaLabels[etapa].toUpperCase()}\n`;
      items.forEach(item => {
        let statusStr = '[ ]';
        if (item.notApplicable) {
          statusStr = '[N/A]';
        } else if (item.done) {
          statusStr = '[X]';
        }
        report += `${statusStr} ${item.label}`;
        if (item.doneAt && !item.notApplicable) {
          report += ` (Concluído em: ${formatDateTime(item.doneAt)})`;
        }
        report += `\n`;
      });
      report += `\n`;
    });

    const blob = new Blob([report], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Relatorio_Checklist_${d.nome.replace(/\\s+/g, '_')}_${format(new Date(), 'yyyyMMdd')}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    const newAnexos = files.map(f => ({
      id: Date.now() + Math.random(),
      nome: f.name,
      tamanho: (f.size / 1024).toFixed(1) + ' KB',
      data: new Date().toISOString()
    }));

    const updated = {
      ...d,
      anexos: [...(d.anexos || []), ...newAnexos]
    };
    
    actions.updateDesligamento(updated);
    actions.addHistorico(d.id, {
      data: format(new Date(), "yyyy-MM-dd'T'HH:mm:ss"),
      acao: 'Anexo adicionado: ' + files.map(f => f.name).join(', '),
      nota: ''
    });
  };

  const removeAnexo = async (anexoId) => {
    const ok = await showConfirm('Excluir este anexo?', { title: 'Excluir Anexo', confirmText: 'Excluir', type: 'danger' });
    if (!ok) return;
    const updated = {
      ...d,
      anexos: (d.anexos || []).filter(a => a.id !== anexoId)
    };
    actions.updateDesligamento(updated);
    actions.addHistorico(d.id, {
      data: format(new Date(), "yyyy-MM-dd'T'HH:mm:ss"),
      acao: 'Anexo removido',
      nota: ''
    });
  };

  return (
    <div className="page-content">
      {showEdit && <ModalEditarDesligamento desligamento={d} onClose={() => setShowEdit(false)} />}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 24 }}>
        <button
          className="btn btn-secondary btn-sm"
          onClick={() => { dispatch({ type: 'SET_SELECTED', id: null }); dispatch({ type: 'SET_VIEW', view: isArchived ? 'arquivados' : 'lista' }); }}
          id="btn-voltar"
        >
          <ArrowLeft size={14} /> Voltar
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: -0.5 }}>{d.nome}</h1>
            <div style={{ display: 'flex', gap: 8 }}>
              {d.coligada && <ColigadaBadge code={d.coligada} />}
              <StatusBadge status={d.status} />
              {isArchived && <span className="badge" style={{ background: 'var(--bg-secondary)', color: 'var(--text-muted)' }}>Arquivado</span>}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: 'var(--text-muted)', fontSize: 13 }}>
            <span>{d.cargo}</span>
            {d.departamento && <><span>·</span><span>{d.departamento}</span></>}
            {d.matricula && <><span>·</span><span>{d.matricula}</span></>}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {!isArchived ? (
            <>
              {(d.status === 'pago' || d.status === 'cancelado' || d.status === 'concluido') && (
                <button className="btn btn-secondary btn-sm" onClick={handleArchive}>
                  <Archive size={13} /> Arquivar
                </button>
              )}
              <button className="btn btn-secondary btn-sm" onClick={() => setShowEdit(true)} id="btn-editar">
                <Edit2 size={13} /> Editar
              </button>
              <button className="btn btn-primary btn-sm" onClick={handleGenerateReport} id="btn-relatorio">
                <FileText size={13} /> Relatório
              </button>
            </>
          ) : (
            <button className="btn btn-secondary btn-sm" onClick={handleUnarchive}>
              <RotateCcw size={13} /> Reativar
            </button>
          )}
          
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
              {(state.statusFlow || []).map(s => (
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
        <ChecklistProgress checklist={checklist} />
      </div>

      {/* Info grid */}
      <div className="info-grid" style={{ marginBottom: 20 }}>
        <div className="info-item">
          <div className="info-item-label">Data de Admissão</div>
          <div className="info-item-value">{formatDate(d.dataAdmissao)}</div>
        </div>
        <div className="info-item">
          <div className="info-item-label">Data do Comunicado</div>
          <div className="info-item-value">{formatDate(d.dataComunicado)}</div>
        </div>
        <div className="info-item">
          <div className="info-item-label">Data de Desligamento</div>
          <div className="info-item-value">{formatDate(d.dataDesligamento)}</div>
        </div>
        <div className="info-item">
          <div className="info-item-label">📅 Prazos de Pagamento (corridos)</div>
          <div className="info-item-value" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', width: 22 }}>7d:</span>
              <span>{formatDate(getPaymentDate(d.dataDesligamento, 7))}</span>
              <DaysUntilPayment dataPagamento={getPaymentDate(d.dataDesligamento, 7)} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', width: 22 }}>10d:</span>
              <span style={{ color: 'var(--accent-yellow)', fontWeight: 600 }}>{formatDate(getPaymentDate(d.dataDesligamento, 10))}</span>
              <DaysUntilPayment dataPagamento={getPaymentDate(d.dataDesligamento, 10)} />
            </div>
          </div>
        </div>
        <div className="info-item">
          <div className="info-item-label">Aviso Prévio</div>
          <div className="info-item-value">
            <AvisoBadge aviso={d.avisoPrevio} dias={d.diasAvisoTrabalhado} dataAdmissao={d.dataAdmissao} dataComunicado={d.dataComunicado} />
          </div>
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
        <button className={`tab ${activeTab === 'checklist' ? 'active' : ''}`} onClick={() => handleTabChange('checklist')}>
          <CheckSquare size={13} style={{ display: 'inline', marginRight: 5 }} />
          Checklist
        </button>
        <button className={`tab ${activeTab === 'historico' ? 'active' : ''}`} onClick={() => handleTabChange('historico')}>
          <Clock size={13} style={{ display: 'inline', marginRight: 5 }} />
          Histórico
        </button>
        <button className={`tab ${activeTab === 'anexos' ? 'active' : ''}`} onClick={() => handleTabChange('anexos')}>
          <Paperclip size={13} style={{ display: 'inline', marginRight: 5 }} />
          Anexos
        </button>
      </div>

      {activeTab === 'checklist' && (
        <div>
          {Object.entries(checklistByEtapa).map(([etapa, items]) => {
            const validItems = items.filter(i => !i.notApplicable);
            const doneCount = validItems.filter(i => i.done).length;
            const validTotal = validItems.length;

            return (
              <div key={etapa} style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                    {etapaLabels[etapa]}
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    {doneCount}/{validTotal}
                  </span>
                </div>

              {items.map(item => (
                <div key={item.id} className={`todo-item ${item.done ? 'done' : ''} ${item.notApplicable ? 'na' : ''}`}>
                  <button 
                    className="todo-toggle"
                    disabled={item.notApplicable}
                    onClick={() => handleToggle(item.id)}
                  >
                    {item.notApplicable ? (
                      <MinusCircle size={20} className="icon-na" />
                    ) : item.done ? (
                      <CheckCircle2 size={20} className="icon-done" />
                    ) : (
                      <Circle size={20} className="icon-pending" />
                    )}
                  </button>

                  <div className="todo-content" onClick={() => !item.notApplicable && handleToggle(item.id)}>
                    <div className="todo-label">
                      {item.label}
                      {item.notApplicable && <span className="todo-badge-na">Não Aplicável</span>}
                    </div>
                    {item.doneAt && !item.notApplicable && (
                      <div className="todo-meta">Concluído: {formatDateTime(item.doneAt)}</div>
                    )}
                  </div>

                  <div className="todo-actions">
                    <button 
                      className={`todo-btn-na ${item.notApplicable ? 'active' : ''}`}
                      onClick={(e) => { e.preventDefault(); handleToggleNaoAplicavel(item.id); }}
                      title={item.notApplicable ? "Remover N/A" : "Marcar como não aplicável"}
                    >
                      N/A
                    </button>
                  </div>
                </div>
              ))}
            </div>
            );
          })}
        </div>
      )}

      {activeTab === 'anexos' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <h4 style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)' }}>Documentos do Processo</h4>
            <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer' }}>
              <Plus size={14} /> Adicionar
              <input type="file" multiple style={{ display: 'none' }} onChange={handleFileUpload} />
            </label>
          </div>
          {(d.anexos || []).length > 0 ? (
            d.anexos.map(anexo => (
              <div key={anexo.id} style={{ 
                display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px',
                background: 'var(--bg-secondary)', borderRadius: 12, border: '1px solid var(--border)'
              }}>
                <div style={{ padding: 8, background: 'rgba(59, 130, 246, 0.1)', color: 'var(--accent-blue)', borderRadius: 8 }}>
                  <FileText size={16} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {anexo.nome}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{anexo.tamanho} • {format(parseISO(anexo.data), 'dd/MM HH:mm')}</div>
                </div>
                <button onClick={() => removeAnexo(anexo.id)} style={{ color: 'var(--accent-red)', opacity: 0.6, background: 'none', border: 'none', cursor: 'pointer' }}>
                  <X size={16} />
                </button>
              </div>
            ))
          ) : (
            <div style={{ textAlign: 'center', padding: '40px 0', border: '2px dashed var(--border)', borderRadius: 12 }}>
              <Paperclip size={24} style={{ opacity: 0.2, marginBottom: 8 }} />
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Arraste ou clique para anexar arquivos</div>
            </div>
          )}
        </div>
      )}

      {/* Histórico tab content ... */}
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
            {[...(d.historico || [])].reverse().map((h, i) => (
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
