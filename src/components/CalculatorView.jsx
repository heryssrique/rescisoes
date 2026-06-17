import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Calculator, RotateCcw, Check, AlertTriangle, Users, ClipboardList, DollarSign, Calendar as CalendarIcon, Download, FileText, ArrowLeft, Send, Edit2, Trash2, Plus, Save, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { calcularRescisao } from '../utils/calculators/rescisaoEngine';
import { exportarPDF } from '../utils/calculators/pdfExport';
import { gerarLog } from '../utils/calculators/gerarLog';
import { calcularINSS } from '../utils/calculators/inss';
import { calcularIRRF, calcularIRRF13 } from '../utils/calculators/irrf';

const INITIAL_STATE = {
  nomeEmpregado: '',
  cargo: '',
  matricula: '',
  tipoRescisao: '',
  dataAdmissao: '',
  dataDemissao: '',
  avisoPrevioTrabalhado: false,
  avisoDiasDesconto: 0,
  salarioBruto: '',
  mediasVariaveis: '',
  periodosVencidos: 0,
  diasFeriasGozados: 0,
  saldoFGTS: '',
  numeroDependentes: 0,
};

export function CalculatorView() {
  const { state, actions } = useApp();
  const [form, setForm] = useState(() => state.calculatorInitialData || INITIAL_STATE);
  const [result, setResult] = useState(null);
  const [errors, setErrors] = useState({});
  const [editingItem, setEditingItem] = useState(null);
  const [editDesc, setEditDesc] = useState('');
  const [editValue, setEditValue] = useState('');

  const showAviso = ['SEM_JUSTA_CAUSA', 'ACORDO_MUTUO'].includes(form.tipoRescisao);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleClear = () => {
    setForm(INITIAL_STATE);
    setResult(null);
    setErrors({});
  };

  const validate = () => {
    const newErrors = {};
    if (!form.nomeEmpregado.trim()) newErrors.nomeEmpregado = 'Nome é obrigatório.';
    if (!form.tipoRescisao) newErrors.tipoRescisao = 'Selecione o tipo de rescisão.';
    if (!form.dataAdmissao) newErrors.dataAdmissao = 'Data de admissão é obrigatória.';
    if (!form.dataDemissao) newErrors.dataDemissao = 'Data de demissão é obrigatória.';
    if (form.dataAdmissao && form.dataDemissao && form.dataAdmissao >= form.dataDemissao) {
      newErrors.dataDemissao = 'Deve ser posterior à admissão.';
    }
    if (!form.salarioBruto || Number(form.salarioBruto) <= 0) {
      newErrors.salarioBruto = 'Salário deve ser maior que zero.';
    }
    return newErrors;
  };

  const parseData = (dateStr) => {
    if (!dateStr) return null;
    return new Date(dateStr + 'T12:00:00');
  };

  const handleCalculate = (e) => {
    e.preventDefault();
    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      const parsedData = {
        ...form,
        salarioBruto: parseFloat(form.salarioBruto) || 0,
        mediasVariaveis: parseFloat(form.mediasVariaveis) || 0,
        dataAdmissao: parseData(form.dataAdmissao),
        dataDemissao: parseData(form.dataDemissao),
        periodosVencidos: parseInt(form.periodosVencidos, 10) || 0,
        diasFeriasGozados: parseInt(form.diasFeriasGozados, 10) || 0,
        saldoFGTS: form.saldoFGTS ? parseFloat(form.saldoFGTS) : null,
        avisoDiasDesconto: parseInt(form.avisoDiasDesconto, 10) || 0,
        numeroDependentes: parseInt(form.numeroDependentes, 10) || 0,
      };

      const calculo = calcularRescisao(parsedData);
      setResult(calculo);
    } catch (err) {
      console.error(err);
      alert('Ocorreu um erro ao calcular.');
    }
  };

  const formatBRL = (val) => val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const updateResultList = (type, newList) => {
    setResult(prev => {
      const updated = { ...prev };
      
      if (type === 'verbas') {
        updated.verbas = newList;
        
        // Recalcular impostos automaticamente ao mexer nas verbas
        let updatedDescontos = updated.descontos.filter(d => !d.descricao.startsWith('INSS') && !d.descricao.startsWith('IRRF'));

        const baseINSS = updated.verbas.filter(v => v.tributavelINSS).reduce((acc, v) => acc + (Number(v.valor) || 0), 0);
        const inss = calcularINSS(baseINSS);
        if (inss.desconto > 0) {
          updatedDescontos.unshift({ descricao: `INSS (alíq. efetiva ${(inss.aliquotaEfetiva * 100).toFixed(2)}% sobre R$ ${baseINSS.toFixed(2)})`, valor: inss.desconto });
        }

        const baseIRRFBruta = updated.verbas.filter(v => v.tributavelIRRF).reduce((acc, v) => acc + (Number(v.valor) || 0), 0);
        const baseIRRFLiquida = Math.max(0, baseIRRFBruta - inss.desconto);
        const irrf = calcularIRRF(baseIRRFLiquida, prev.metadados.numeroDependentes || 0);
        if (irrf.desconto > 0) {
          updatedDescontos.unshift({ descricao: `IRRF (${(irrf.aliquota * 100).toFixed(1)}% sobre base líquida de R$ ${baseIRRFLiquida.toFixed(2)})`, valor: irrf.desconto });
        }

        const base13Bruto = updated.verbas.filter(v => v.tributavelIRRF13).reduce((acc, v) => acc + (Number(v.valor) || 0), 0);
        if (base13Bruto > 0) {
          const inss13 = calcularINSS(base13Bruto);
          const base13Liquida = Math.max(0, base13Bruto - inss13.desconto);
          const irrf13 = calcularIRRF13(base13Liquida);
          if (irrf13.desconto > 0) {
            updatedDescontos.unshift({ descricao: `IRRF sobre 13° Proporcional (${(irrf13.aliquota * 100).toFixed(1)}%)`, valor: irrf13.desconto });
          }
        }
        
        updated.descontos = updatedDescontos;
      } else {
        updated.descontos = newList;
      }

      const totalProventos = updated.verbas.reduce((acc, v) => acc + (Number(v.valor) || 0), 0);
      const totalDescontos = updated.descontos.reduce((acc, d) => acc + (Number(d.valor) || 0), 0);
      updated.totais = {
        totalProventos,
        totalDescontos,
        liquido: totalProventos - totalDescontos
      };
      return updated;
    });
  };

  const handleRemoveItem = (type, index) => {
    const list = type === 'verbas' ? [...result.verbas] : [...result.descontos];
    list.splice(index, 1);
    updateResultList(type, list);
  };

  const handleEditItem = (type, index, item) => {
    setEditingItem({ type, index });
    setEditDesc(item.descricao);
    setEditValue(item.valor);
  };

  const handleSaveEdit = () => {
    if (!editingItem) return;
    const { type, index } = editingItem;
    const list = type === 'verbas' ? [...result.verbas] : [...result.descontos];
    list[index] = { ...list[index], descricao: editDesc, valor: Number(editValue) || 0 };
    updateResultList(type, list);
    setEditingItem(null);
  };

  const handleCancelEdit = () => {
    setEditingItem(null);
  };

  const handleAddItem = (type) => {
    const list = type === 'verbas' ? [...result.verbas] : [...result.descontos];
    list.push({ descricao: 'Novo Item', valor: 0 });
    updateResultList(type, list);
    handleEditItem(type, list.length - 1, list[list.length - 1]);
  };

  const handleCreateProcess = () => {
    const mapMotivo = {
      SEM_JUSTA_CAUSA: 'demissao',
      COM_JUSTA_CAUSA: 'justa',
      PEDIDO_DEMISSAO: 'pedido',
      ACORDO_MUTUO: 'acordo',
      DETERMINADO: 'termino_contrato'
    };

    const dataAdmissaoStr = result.metadados.dataAdmissao ? result.metadados.dataAdmissao.toISOString().split('T')[0] : '';
    const dataDemissaoStr = result.metadados.dataDemissao ? result.metadados.dataDemissao.toISOString().split('T')[0] : '';

    const initialData = {
      nome: result.metadados.nomeEmpregado || '',
      coligada: '',
      cargo: result.metadados.cargo || '',
      departamento: '',
      matricula: result.metadados.matricula || '',
      dataAdmissao: dataAdmissaoStr,
      dataComunicado: dataDemissaoStr, 
      dataDesligamento: dataDemissaoStr,
      dataPagamento: '',
      motivo: mapMotivo[result.metadados.tipoRescisao] || 'demissao',
      avisoPrevio: result.metadados.avisoPrevioTrabalhado ? 'trabalhado' : (result.metadados.avisoDiasDesconto > 0 ? 'descontado' : 'indenizado'),
      diasAvisoTrabalhado: result.metadados.avisoDiasDesconto ? String(result.metadados.avisoDiasDesconto) : '',
      status: 'comunicado',
      responsavel: '',
      observacoes: `[Gerado via Calculadora de Rescisão]\nSalário Base Informado: ${formatBRL(result.metadados.salarioBruto)}\nLíquido Estimado: ${formatBRL(result.totais.liquido)}`,
      prazoPagamento: '10',
    };
    
    actions.openNewModal(initialData);
  };

  if (result) {
    return (
      <div className="page-content">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0 }}>Demonstrativo de Rescisão</h1>
            <p style={{ color: 'var(--text-muted)' }}>Prévia estimada para {result.metadados.nomeEmpregado}</p>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <button className="btn btn-ghost" onClick={() => setResult(null)}>
              <ArrowLeft size={16} /> Voltar
            </button>
            <button className="btn btn-ghost" onClick={handleClear}>
              <RotateCcw size={16} /> Novo Cálculo
            </button>
            <button className="btn btn-primary" onClick={() => exportarPDF(result)}>
              <Download size={16} /> Exportar PDF
            </button>
            <button className="btn btn-primary" style={{ background: 'var(--accent-purple)', boxShadow: '0 4px 12px rgba(168, 85, 247, 0.3)' }} onClick={handleCreateProcess}>
              <Send size={16} /> Salvar Processo
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20, marginBottom: 24 }}>
          <div className="card" style={{ padding: 20, border: '1px solid var(--border)' }}>
            <h3 style={{ fontSize: 14, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 12 }}>Proventos</h3>
            <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--accent-teal)' }}>
              {formatBRL(result.totais.totalProventos)}
            </div>
          </div>
          <div className="card" style={{ padding: 20, border: '1px solid var(--border)' }}>
            <h3 style={{ fontSize: 14, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 12 }}>Descontos</h3>
            <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--accent-red)' }}>
              {formatBRL(result.totais.totalDescontos)}
            </div>
          </div>
          <div className="card" style={{ padding: 20, border: '1px solid var(--border)', background: 'linear-gradient(135deg, rgba(59,130,246,0.1), rgba(139,92,246,0.1))' }}>
            <h3 style={{ fontSize: 14, color: 'var(--accent-blue)', textTransform: 'uppercase', marginBottom: 12, fontWeight: 800 }}>Líquido a Receber</h3>
            <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--accent-blue)' }}>
              {formatBRL(result.totais.liquido)}
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          <div className="card" style={{ padding: 20, border: '1px solid var(--border)' }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Check size={18} color="var(--accent-teal)" /> Verbas Rescisórias (Proventos)
            </h3>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {result.verbas.map((v, i) => {
                const isEditing = editingItem?.type === 'verbas' && editingItem?.index === i;
                return (
                  <li key={i} style={{ display: 'flex', flexDirection: 'column', padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
                    {isEditing ? (
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', width: '100%' }}>
                        <input className="form-input" style={{ flex: 1, padding: '4px 8px', fontSize: 14 }} value={editDesc} onChange={e => setEditDesc(e.target.value)} />
                        <input className="form-input" type="number" step="0.01" style={{ width: 100, padding: '4px 8px', fontSize: 14 }} value={editValue} onChange={e => setEditValue(e.target.value)} />
                        <button className="btn btn-ghost" style={{ padding: 4 }} onClick={handleSaveEdit} title="Salvar"><Save size={16} color="var(--accent-teal)" /></button>
                        <button className="btn btn-ghost" style={{ padding: 4 }} onClick={handleCancelEdit} title="Cancelar"><X size={16} color="var(--accent-red)" /></button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                        <span style={{ fontSize: 14, color: 'var(--text-primary)' }}>{v.descricao}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <span style={{ fontWeight: 600, color: 'var(--accent-teal)' }}>{formatBRL(v.valor)}</span>
                          <div style={{ display: 'flex', gap: 4 }}>
                            <button className="btn btn-ghost" style={{ padding: 4 }} onClick={() => handleEditItem('verbas', i, v)} title="Editar"><Edit2 size={14} color="var(--text-muted)" /></button>
                            <button className="btn btn-ghost" style={{ padding: 4 }} onClick={() => handleRemoveItem('verbas', i)} title="Excluir"><Trash2 size={14} color="var(--accent-red)" /></button>
                          </div>
                        </div>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
            <button className="btn btn-ghost" style={{ marginTop: 12, padding: '6px 12px', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }} onClick={() => handleAddItem('verbas')}>
              <Plus size={14} /> Adicionar Verba
            </button>
          </div>

          <div className="card" style={{ padding: 20, border: '1px solid var(--border)' }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <AlertTriangle size={18} color="var(--accent-red)" /> Deduções Legais (Descontos)
            </h3>
            {result.descontos.length === 0 ? (
              <p style={{ color: 'var(--text-muted)' }}>Nenhum desconto aplicado.</p>
            ) : (
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {result.descontos.map((d, i) => {
                  const isEditing = editingItem?.type === 'descontos' && editingItem?.index === i;
                  return (
                    <li key={i} style={{ display: 'flex', flexDirection: 'column', padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
                      {isEditing ? (
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center', width: '100%' }}>
                          <input className="form-input" style={{ flex: 1, padding: '4px 8px', fontSize: 14 }} value={editDesc} onChange={e => setEditDesc(e.target.value)} />
                          <input className="form-input" type="number" step="0.01" style={{ width: 100, padding: '4px 8px', fontSize: 14 }} value={editValue} onChange={e => setEditValue(e.target.value)} />
                          <button className="btn btn-ghost" style={{ padding: 4 }} onClick={handleSaveEdit} title="Salvar"><Save size={16} color="var(--accent-teal)" /></button>
                          <button className="btn btn-ghost" style={{ padding: 4 }} onClick={handleCancelEdit} title="Cancelar"><X size={16} color="var(--accent-red)" /></button>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                          <span style={{ fontSize: 14, color: 'var(--text-primary)' }}>{d.descricao}</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <span style={{ fontWeight: 600, color: 'var(--accent-red)' }}>{formatBRL(d.valor)}</span>
                            <div style={{ display: 'flex', gap: 4 }}>
                              <button className="btn btn-ghost" style={{ padding: 4 }} onClick={() => handleEditItem('descontos', i, d)} title="Editar"><Edit2 size={14} color="var(--text-muted)" /></button>
                              <button className="btn btn-ghost" style={{ padding: 4 }} onClick={() => handleRemoveItem('descontos', i)} title="Excluir"><Trash2 size={14} color="var(--accent-red)" /></button>
                            </div>
                          </div>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
            <button className="btn btn-ghost" style={{ marginTop: 12, padding: '6px 12px', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }} onClick={() => handleAddItem('descontos')}>
              <Plus size={14} /> Adicionar Desconto
            </button>
          </div>
        </div>

        <div className="card" style={{ padding: 24, border: '1px solid var(--border)', marginTop: 24 }}>
          <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <FileText size={20} color="var(--accent-blue)" /> Memória de Cálculo Detalhada
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {gerarLog(result).map((etapa, idx) => (
              <div key={idx} style={{ background: 'var(--bg-secondary)', padding: 16, borderRadius: 8, border: '1px solid var(--border)' }}>
                <h4 style={{ fontSize: 15, fontWeight: 600, marginBottom: 8, color: 'var(--text-primary)' }}>{etapa.icon} {etapa.titulo}</h4>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>
                  {etapa.formula && <div><strong>Fórmula:</strong> {etapa.formula}</div>}
                  {etapa.baseLegal && <div><strong>Base Legal:</strong> {etapa.baseLegal}</div>}
                </div>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: 13, color: 'var(--text-secondary)' }}>
                  {etapa.passos.map((passo, pIdx) => (
                    <li key={pIdx} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 4 }}>
                      <span style={{ color: 'var(--accent-blue)' }}>•</span> {passo}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-content">

      <form onSubmit={handleCalculate} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {/* Dados do Funcionário */}
        <div className="card" style={{ padding: 24, border: '1px solid var(--border)' }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Users size={18} /> 1. Dados do Funcionário
          </h3>
          <div className="form-grid cols-3">
            <div className="form-group full-width">
              <label className="form-label">Nome Completo <span className="required">*</span></label>
              <input name="nomeEmpregado" value={form.nomeEmpregado} onChange={handleChange} className={`form-input ${errors.nomeEmpregado ? 'error' : ''}`} placeholder="Ex: João da Silva" />
              {errors.nomeEmpregado && <span style={{ color: 'var(--accent-red)', fontSize: 12 }}>{errors.nomeEmpregado}</span>}
            </div>
            <div className="form-group">
              <label className="form-label">Cargo / Função</label>
              <input name="cargo" value={form.cargo} onChange={handleChange} className="form-input" />
            </div>
            <div className="form-group">
              <label className="form-label">Matrícula</label>
              <input name="matricula" value={form.matricula} onChange={handleChange} className="form-input" />
            </div>
          </div>
        </div>

        {/* Contrato e Tipo de Rescisão */}
        <div className="card" style={{ padding: 24, border: '1px solid var(--border)' }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <ClipboardList size={18} /> 2. Contrato e Rescisão
          </h3>
          <div className="form-grid cols-3">
            <div className="form-group full-width">
              <label className="form-label">Tipo de Rescisão <span className="required">*</span></label>
              <select name="tipoRescisao" value={form.tipoRescisao} onChange={handleChange} className={`form-input ${errors.tipoRescisao ? 'error' : ''}`}>
                <option value="">Selecione...</option>
                <option value="SEM_JUSTA_CAUSA">Sem Justa Causa</option>
                <option value="COM_JUSTA_CAUSA">Com Justa Causa</option>
                <option value="PEDIDO_DEMISSAO">Pedido de Demissão</option>
                <option value="ACORDO_MUTUO">Acordo Mútuo — Art. 484-A CLT</option>
                <option value="DETERMINADO">Término de Contrato</option>
              </select>
              {errors.tipoRescisao && <span style={{ color: 'var(--accent-red)', fontSize: 12 }}>{errors.tipoRescisao}</span>}
            </div>
            <div className="form-group">
              <label className="form-label">Data de Admissão <span className="required">*</span></label>
              <input type="date" name="dataAdmissao" value={form.dataAdmissao} onChange={handleChange} className={`form-input ${errors.dataAdmissao ? 'error' : ''}`} />
              {errors.dataAdmissao && <span style={{ color: 'var(--accent-red)', fontSize: 12 }}>{errors.dataAdmissao}</span>}
            </div>
            <div className="form-group">
              <label className="form-label">Data de Demissão <span className="required">*</span></label>
              <input type="date" name="dataDemissao" value={form.dataDemissao} onChange={handleChange} className={`form-input ${errors.dataDemissao ? 'error' : ''}`} />
              {errors.dataDemissao && <span style={{ color: 'var(--accent-red)', fontSize: 12 }}>{errors.dataDemissao}</span>}
            </div>
            {showAviso && (
              <div className="form-group full-width" style={{ background: 'var(--bg-secondary)', padding: 16, borderRadius: 8, border: '1px solid var(--border)' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                  <input type="checkbox" name="avisoPrevioTrabalhado" checked={form.avisoPrevioTrabalhado} onChange={handleChange} style={{ width: 16, height: 16 }} />
                  <strong style={{ fontSize: 13 }}>Aviso prévio será trabalhado</strong>
                </label>
                {form.avisoPrevioTrabalhado && (
                  <div style={{ marginTop: 12, marginLeft: 24 }}>
                    <label className="form-label">Descontar dias trabalhados no Saldo:</label>
                    <select name="avisoDiasDesconto" value={form.avisoDiasDesconto} onChange={handleChange} className="form-input" style={{ maxWidth: 300, marginTop: 4 }}>
                      <option value="0">Não descontar</option>
                      <option value="23">Descontar 23 dias (7 dias de folga)</option>
                      <option value="30">Descontar 30 dias (redução de 2h/dia)</option>
                    </select>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Remuneração */}
        <div className="card" style={{ padding: 24, border: '1px solid var(--border)' }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <DollarSign size={18} /> 3. Remuneração
          </h3>
          <div className="form-grid cols-3">
            <div className="form-group">
              <label className="form-label">Salário Bruto <span className="required">*</span></label>
              <input type="number" step="0.01" name="salarioBruto" value={form.salarioBruto} onChange={handleChange} className={`form-input ${errors.salarioBruto ? 'error' : ''}`} placeholder="0.00" />
              {errors.salarioBruto && <span style={{ color: 'var(--accent-red)', fontSize: 12 }}>{errors.salarioBruto}</span>}
            </div>
            <div className="form-group">
              <label className="form-label">Médias Variáveis</label>
              <input type="number" step="0.01" name="mediasVariaveis" value={form.mediasVariaveis} onChange={handleChange} className="form-input" placeholder="0.00" />
            </div>
            <div className="form-group">
              <label className="form-label">Saldo FGTS (opcional)</label>
              <input type="number" step="0.01" name="saldoFGTS" value={form.saldoFGTS} onChange={handleChange} className="form-input" placeholder="Estimar automático" />
            </div>
            <div className="form-group">
              <label className="form-label">Férias Vencidas (períodos)</label>
              <input type="number" name="periodosVencidos" value={form.periodosVencidos} onChange={handleChange} className="form-input" placeholder="0" />
            </div>
            <div className="form-group">
              <label className="form-label">Dias de férias gozados</label>
              <input type="number" name="diasFeriasGozados" value={form.diasFeriasGozados} onChange={handleChange} className="form-input" placeholder="0" />
            </div>
            <div className="form-group">
              <label className="form-label">Dependentes (IR)</label>
              <input type="number" name="numeroDependentes" value={form.numeroDependentes} onChange={handleChange} className="form-input" placeholder="0" />
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 16, justifyContent: 'flex-end' }}>
          <button type="button" className="btn btn-ghost" onClick={handleClear}>
            <RotateCcw size={16} /> Limpar
          </button>
          <button type="submit" className="btn btn-primary">
            <Calculator size={16} /> Calcular Rescisão
          </button>
        </div>
      </form>
    </div>
  );
}
