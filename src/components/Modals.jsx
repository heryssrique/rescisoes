import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { MOTIVOS, CHECKLIST_TEMPLATE } from '../data/initialData';
import { format } from 'date-fns';
import { X, User, Calendar, FileText, Info, Loader } from 'lucide-react';

const INITIAL_FORM = {
  nome: '',
  cargo: '',
  departamento: '',
  matricula: '',
  dataAdmissao: '',
  dataComunicado: format(new Date(), 'yyyy-MM-dd'),
  dataDesligamento: '',
  dataPagamento: '',
  motivo: 'demissao',
  avisoPrevio: 'indenizado',
  status: 'comunicado',
  responsavel: '',
  observacoes: '',
};

export function ModalNovoDesligamento({ onClose }) {
  const { actions } = useApp();
  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  function validate() {
    const e = {};
    if (!form.nome.trim()) e.nome = true;
    if (!form.cargo.trim()) e.cargo = true;
    if (!form.dataComunicado) e.dataComunicado = true;
    if (!form.dataDesligamento) e.dataDesligamento = true;
    if (!form.dataPagamento) e.dataPagamento = true;
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;
    setSaving(true);
    try {
      await actions.addDesligamento({
        ...form,
        checklist: CHECKLIST_TEMPLATE.map(c => ({ ...c, done: false, doneAt: null })),
        historico: [
          {
            data: format(new Date(), "yyyy-MM-dd'T'HH:mm:ss"),
            acao: 'Comunicado emitido',
            nota: 'Processo de desligamento iniciado.',
          },
        ],
      });
      onClose();
    } catch {
      /* error already set in context */
    } finally {
      setSaving(false);
    }
  }

  function set(field, value) {
    setForm(f => ({ ...f, [field]: value }));
    setErrors(e => ({ ...e, [field]: false }));
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <div>
            <div className="modal-title">Novo Desligamento</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Preencha os dados do funcionário</div>
          </div>
          <button className="btn btn-icon" onClick={onClose}><X size={16} /></button>
        </div>

        <div className="modal-body">
          <div className="form-grid">
            <div className="form-section-title"><User size={13} /> Dados do Funcionário</div>

            <div className="form-group">
              <label className="form-label">Nome <span className="required">*</span></label>
              <input
                id="input-nome"
                className="form-input"
                placeholder="Nome completo"
                value={form.nome}
                onChange={e => set('nome', e.target.value)}
                style={errors.nome ? { borderColor: 'var(--accent-red)' } : {}}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Matrícula</label>
              <input
                id="input-matricula"
                className="form-input"
                placeholder="Ex: TI-2023-001"
                value={form.matricula}
                onChange={e => set('matricula', e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Cargo <span className="required">*</span></label>
              <input
                id="input-cargo"
                className="form-input"
                placeholder="Cargo / função"
                value={form.cargo}
                onChange={e => set('cargo', e.target.value)}
                style={errors.cargo ? { borderColor: 'var(--accent-red)' } : {}}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Departamento</label>
              <input
                id="input-departamento"
                className="form-input"
                placeholder="Departamento / setor"
                value={form.departamento}
                onChange={e => set('departamento', e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Data de Admissão</label>
              <input
                id="input-admissao"
                type="date"
                className="form-input"
                value={form.dataAdmissao}
                onChange={e => set('dataAdmissao', e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Responsável (RH)</label>
              <input
                id="input-responsavel"
                className="form-input"
                placeholder="Nome do responsável"
                value={form.responsavel}
                onChange={e => set('responsavel', e.target.value)}
              />
            </div>

            <div className="form-section-title"><Calendar size={13} /> Datas do Processo</div>

            <div className="form-group">
              <label className="form-label">Data do Comunicado <span className="required">*</span></label>
              <input
                id="input-comunicado"
                type="date"
                className="form-input"
                value={form.dataComunicado}
                onChange={e => set('dataComunicado', e.target.value)}
                style={errors.dataComunicado ? { borderColor: 'var(--accent-red)' } : {}}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Data de Desligamento <span className="required">*</span></label>
              <input
                id="input-desligamento"
                type="date"
                className="form-input"
                value={form.dataDesligamento}
                onChange={e => set('dataDesligamento', e.target.value)}
                style={errors.dataDesligamento ? { borderColor: 'var(--accent-red)' } : {}}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Data de Pagamento <span className="required">*</span></label>
              <input
                id="input-pagamento"
                type="date"
                className="form-input"
                value={form.dataPagamento}
                onChange={e => set('dataPagamento', e.target.value)}
                style={errors.dataPagamento ? { borderColor: 'var(--accent-red)' } : {}}
              />
            </div>

            <div className="form-section-title"><FileText size={13} /> Tipo e Aviso Prévio</div>

            <div className="form-group">
              <label className="form-label">Motivo do Desligamento</label>
              <select
                id="input-motivo"
                className="form-input"
                value={form.motivo}
                onChange={e => set('motivo', e.target.value)}
              >
                {MOTIVOS.map(m => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Aviso Prévio</label>
              <select
                id="input-aviso"
                className="form-input"
                value={form.avisoPrevio}
                onChange={e => set('avisoPrevio', e.target.value)}
              >
                <option value="trabalhado">Trabalhado</option>
                <option value="indenizado">Indenizado</option>
                <option value="nao_aplicavel">Não Aplicável</option>
              </select>
            </div>

            <div className="form-group full-width">
              <label className="form-label"><Info size={11} style={{ display: 'inline', marginRight: 4 }} />Observações</label>
              <textarea
                id="input-obs"
                className="form-input"
                placeholder="Informações adicionais, contexto, acordos especiais..."
                value={form.observacoes}
                onChange={e => set('observacoes', e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose} disabled={saving}>Cancelar</button>
          <button id="btn-salvar-desligamento" className="btn btn-primary" onClick={handleSubmit} disabled={saving}>
            {saving ? <><Loader size={13} style={{ animation: 'spin 1s linear infinite' }} /> Salvando...</> : 'Criar Desligamento'}
          </button>
        </div>
      </div>
    </div>
  );
}

export function ModalEditarDesligamento({ desligamento, onClose }) {
  const { actions } = useApp();
  const [form, setForm] = useState({ ...desligamento });
  const [saving, setSaving] = useState(false);

  async function handleSubmit() {
    setSaving(true);
    try {
      await actions.updateDesligamento(form);
      await actions.addHistorico(desligamento.id, {
        data: format(new Date(), "yyyy-MM-dd'T'HH:mm:ss"),
        acao: 'Dados atualizados',
        nota: '',
      });
      onClose();
    } catch {
      /* error already set in context */
    } finally {
      setSaving(false);
    }
  }

  function set(field, value) {
    setForm(f => ({ ...f, [field]: value }));
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <div>
            <div className="modal-title">Editar Desligamento</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{form.nome}</div>
          </div>
          <button className="btn btn-icon" onClick={onClose}><X size={16} /></button>
        </div>

        <div className="modal-body">
          <div className="form-grid">
            <div className="form-section-title"><User size={13} /> Dados do Funcionário</div>
            <div className="form-group">
              <label className="form-label">Nome</label>
              <input className="form-input" value={form.nome} onChange={e => set('nome', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Matrícula</label>
              <input className="form-input" value={form.matricula} onChange={e => set('matricula', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Cargo</label>
              <input className="form-input" value={form.cargo} onChange={e => set('cargo', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Departamento</label>
              <input className="form-input" value={form.departamento} onChange={e => set('departamento', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Data de Admissão</label>
              <input type="date" className="form-input" value={form.dataAdmissao} onChange={e => set('dataAdmissao', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Responsável (RH)</label>
              <input className="form-input" value={form.responsavel} onChange={e => set('responsavel', e.target.value)} />
            </div>

            <div className="form-section-title"><Calendar size={13} /> Datas</div>
            <div className="form-group">
              <label className="form-label">Data do Comunicado</label>
              <input type="date" className="form-input" value={form.dataComunicado} onChange={e => set('dataComunicado', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Data de Desligamento</label>
              <input type="date" className="form-input" value={form.dataDesligamento} onChange={e => set('dataDesligamento', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Data de Pagamento</label>
              <input type="date" className="form-input" value={form.dataPagamento} onChange={e => set('dataPagamento', e.target.value)} />
            </div>

            <div className="form-section-title"><FileText size={13} /> Status e Tipo</div>
            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="form-input" value={form.status} onChange={e => set('status', e.target.value)}>
                <option value="comunicado">Comunicado</option>
                <option value="documentacao">Documentação</option>
                <option value="homologacao">Homologação</option>
                <option value="aguardando">Ag. Pagamento</option>
                <option value="pago">Pago</option>
                <option value="cancelado">Cancelado</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Motivo</label>
              <select className="form-input" value={form.motivo} onChange={e => set('motivo', e.target.value)}>
                {MOTIVOS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Aviso Prévio</label>
              <select className="form-input" value={form.avisoPrevio} onChange={e => set('avisoPrevio', e.target.value)}>
                <option value="trabalhado">Trabalhado</option>
                <option value="indenizado">Indenizado</option>
                <option value="nao_aplicavel">Não Aplicável</option>
              </select>
            </div>
            <div className="form-group full-width">
              <label className="form-label">Observações</label>
              <textarea className="form-input" value={form.observacoes} onChange={e => set('observacoes', e.target.value)} />
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose} disabled={saving}>Cancelar</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={saving}>
            {saving ? <><Loader size={13} style={{ animation: 'spin 1s linear infinite' }} /> Salvando...</> : 'Salvar Alterações'}
          </button>
        </div>
      </div>
    </div>
  );
}
