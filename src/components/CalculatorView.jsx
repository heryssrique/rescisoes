import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Calculator, RotateCcw, Check, AlertTriangle, Users, ClipboardList, DollarSign, Calendar as CalendarIcon, Download, FileText, ArrowLeft } from 'lucide-react';
import { calcularRescisao } from '../utils/calculators/rescisaoEngine';
import { exportarPDF } from '../utils/calculators/pdfExport';
import { gerarLog } from '../utils/calculators/gerarLog';

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
  const [form, setForm] = useState(INITIAL_STATE);
  const [result, setResult] = useState(null);
  const [errors, setErrors] = useState({});

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
              {result.verbas.map((v, i) => (
                <li key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ fontSize: 14, color: 'var(--text-primary)' }}>{v.descricao}</span>
                  <span style={{ fontWeight: 600, color: 'var(--accent-teal)' }}>{formatBRL(v.valor)}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="card" style={{ padding: 20, border: '1px solid var(--border)' }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <AlertTriangle size={18} color="var(--accent-red)" /> Deduções Legais (Descontos)
            </h3>
            {result.descontos.length === 0 ? (
              <p style={{ color: 'var(--text-muted)' }}>Nenhum desconto aplicado.</p>
            ) : (
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {result.descontos.map((d, i) => (
                  <li key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
                    <span style={{ fontSize: 14, color: 'var(--text-primary)' }}>{d.descricao}</span>
                    <span style={{ fontWeight: 600, color: 'var(--accent-red)' }}>{formatBRL(d.valor)}</span>
                  </li>
                ))}
              </ul>
            )}
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
