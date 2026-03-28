import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import * as XLSX from 'xlsx';
import { X, Upload, Check, Loader, AlertTriangle } from 'lucide-react';
import { CHECKLIST_TEMPLATE } from '../data/initialData';
import { format } from 'date-fns';
import { getPaymentDate } from '../utils/dateUtils';

const COLUMN_MAP = {
  nome: ['nome', 'funcionario', 'colaborador', 'nome do funcionário', 'nome completo'],
  coligada: ['coligada', 'empresa', 'filial', 'cód coligada'],
  cargo: ['cargo', 'função'],
  departamento: ['departamento', 'setor', 'área', 'obra'],
  matricula: ['matrícula', 'id', 'registro', 'cod', 'chapa'],
  dataAdmissao: ['admissao', 'data de admissao', 'data admissao'],
  dataComunicado: ['comunicado', 'data do comunicado', 'data comunicado', 'ciencia'],
  dataDesligamento: ['desligamento', 'data de desligamento', 'data desligamento', 'saida', 'data saida', 'data demissao'],
  dataPagamento: ['pagamento', 'data de pagamento', 'data pagamento', 'vencimento'],
  prazoPagamento7: ['prazo pagto 7', '7 dias'],
  prazoPagamento10: ['prazo pagto 10', '10 dias'],
  motivo: ['motivo', 'tipo'],
  avisoPrevio: ['aviso previo', 'tipo de aviso', 'aviso previo'],
  diasAvisoTrabalhado: ['dias aviso', 'quantidade dias', 'dias trabalhados'],
  responsavel: ['responsavel', 'rh'],
  observacoes: ['observacoes', 'notas', 'obs'],
};

const FIELD_LABELS = {
  nome: 'Nome',
  coligada: 'Coligada / Empresa',
  cargo: 'Cargo',
  departamento: 'Departamento / Obra',
  matricula: 'Matrícula / Chapa',
  dataAdmissao: 'Data de Admissão',
  dataComunicado: 'Data do Comunicado / Ciência',
  dataDesligamento: 'Data de Demissão',
  dataPagamento: 'Data de Pagamento',
  prazoPagamento7: 'Prazo Pagto 7 Dias',
  prazoPagamento10: 'Prazo Pagto 10 Dias',
  motivo: 'Motivo',
  avisoPrevio: 'Aviso Prévio',
  diasAvisoTrabalhado: 'Dias (23 ou 30)',
  responsavel: 'Responsável',
  observacoes: 'Observações',
};

const MOTIVO_MAP = {
  'pedido': 'pedido',
  'pedido de demissao': 'pedido',
  'pedido na experiencia': 'pedido',
  'pedido de demissao experiencia': 'pedido',
  'pedido de demissao com desconto do aviso': 'pedido',
  'demissao': 'demissao',
  'demissao sem justa causa': 'demissao',
  'dispensa s/ justa causa aviso indenizado': 'demissao',
  'dispensa s/ justa causa aviso trabalhado': 'demissao',
  'demissao sem justa causa - trab': 'demissao',
  'dispensa': 'demissao',
  'acordo': 'acordo',
  'justa causa': 'justa',
  'aposentadoria': 'aposentadoria',
  'termino de contrato': 'termino_contrato',
  'termino contrato': 'termino_contrato',
  'termino antecipado exp': 'termino_empresa',
  'termino de contrato antec experiencia': 'termino_empresa',
  'termino de contrato antecipado': 'termino_empresa',
  'termino de contrato antecipado empresa': 'termino_empresa',
  'termino de contrato antecipado empregado': 'termino_empregado',
  'aux. administrativo': 'demissao',
  'auxiliar de logistica': 'demissao',
};

const AVISO_MAP = {
  'trabalhado': 'trabalhado',
  'indenizado': 'indenizado',
  'ok': 'indenizado',
  'nao aplicavel': 'nao_aplicavel',
  'n/a': 'nao_aplicavel',
};

// Normaliza qualquer string: minúsculas, sem acentos, sem espaços extras
function norm(key) {
  if (!key) return '';
  return String(key)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

function formatDate(val) {
  if (val === null || val === undefined || val === '') return '';
  if (typeof val === 'number') {
    // Número serial do Excel
    try {
      const date = new Date(Math.round((val - 25569) * 86400 * 1000));
      if (isNaN(date.getTime())) return '';
      return format(date, 'yyyy-MM-dd');
    } catch {
      return '';
    }
  }
  if (typeof val === 'string') {
    const s = val.trim();
    if (!s) return '';
    const parts = s.split(/[-/]/);
    if (parts.length === 3) {
      if (parts[2].length === 4) {
        // DD/MM/YYYY ou DD-MM-YYYY
        return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
      }
      if (parts[0].length === 4) {
        // YYYY-MM-DD
        return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
      }
    }
  }
  return String(val).trim();
}

export function ModalImportarPlanilha({ onClose }) {
  const { actions } = useApp();
  const [data, setData] = useState(null);
  const [headers, setHeaders] = useState([]);
  const [mapping, setMapping] = useState({});
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [preview, setPreview] = useState([]);
  const fileInputRef = useRef();

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setLoading(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const workbook = XLSX.read(event.target.result, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

        if (rows.length < 2) {
          alert('A planilha parece estar vazia ou não contém cabeçalhos.');
          setLoading(false);
          return;
        }

        const rawHeaders = rows[0].map(h => String(h));
        const rawData = rows.slice(1).filter(row => row.some(c => c !== '' && c !== null && c !== undefined));

        setHeaders(rawHeaders);
        setData(rawData);
        setPreview(rawData.slice(0, 5));

        // Auto mapping — usa a função norm() para comparação robusta
        const initialMapping = {};
        rawHeaders.forEach((h, index) => {
          const normH = norm(h);
          for (const [key, aliases] of Object.entries(COLUMN_MAP)) {
            if (aliases.some(alias => norm(alias) === normH)) {
              initialMapping[key] = index;
            }
          }
        });

        // Log para depuração dos cabeçalhos identificados
        console.log('[ImportModal] Cabeçalhos encontrados:', rawHeaders.map((h, i) => `${i}: "${h}" → norm: "${norm(h)}"`));
        console.log('[ImportModal] Mapeamento automático:', initialMapping);

        setMapping(initialMapping);
      } catch (err) {
        console.error(err);
        alert('Erro ao ler planilha: ' + err.message);
      } finally {
        setLoading(false);
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleImport = async () => {
    if (mapping.nome == null) {
      alert('Por favor, mapeie pelo menos a coluna de Nome.');
      return;
    }

    setImporting(true);
    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      const now = format(new Date(), "yyyy-MM-dd'T'HH:mm:ss");

      const formattedData = data
        .map(row => {
          const dDesl = formatDate(row[mapping.dataDesligamento]) || '';
          const dPag7 = formatDate(row[mapping.prazoPagamento7]);
          const dPag10 = formatDate(row[mapping.prazoPagamento10]);
          const prazo = dPag7 ? '7' : '10';
          let dPag = formatDate(row[mapping.dataPagamento]) || dPag7 || dPag10 || '';

          // Se não tiver data de pagamento mas tiver desligamento, calcula
          if (!dPag && dDesl) {
            dPag = getPaymentDate(dDesl, prazo);
          }

          return {
            nome: String(row[mapping.nome] || '').trim(),
            coligada: String(row[mapping.coligada] ?? '').trim(),
            cargo: String(row[mapping.cargo] ?? '').trim(),
            departamento: String(row[mapping.departamento] ?? '').trim(),
            matricula: String(row[mapping.matricula] ?? '').trim(),
            dataAdmissao: formatDate(row[mapping.dataAdmissao]),
            dataComunicado: formatDate(row[mapping.dataComunicado]) || today,
            dataDesligamento: dDesl,
            dataPagamento: dPag,
            prazoPagamento: prazo,
            motivo: MOTIVO_MAP[norm(row[mapping.motivo])] || 'demissao',
            avisoPrevio: AVISO_MAP[norm(row[mapping.avisoPrevio])] || 'indenizado',
            diasAvisoTrabalhado: String(row[mapping.diasAvisoTrabalhado] || '').trim(),
            responsavel: String(row[mapping.responsavel] ?? '').trim(),
            observacoes: String(row[mapping.observacoes] ?? '').trim(),
            status: 'comunicado',
            checklist: CHECKLIST_TEMPLATE.map(c => ({ ...c, done: false, doneAt: null })),
            historico: [{ data: now, acao: 'Importado via planilha', nota: '' }],
          };
        })
        .filter(item => item.nome); // Remove linhas sem nome

      if (formattedData.length === 0) {
        alert('Nenhum registro válido encontrado. Verifique se a coluna "Nome" está mapeada corretamente.');
        setImporting(false);
        return;
      }

      await actions.importDesligamentos(formattedData);
      alert(`✅ ${formattedData.length} registro(s) importado(s) com sucesso!`);
      onClose();
    } catch (err) {
      alert('Erro na importação: ' + err.message);
    } finally {
      setImporting(false);
    }
  };

  const missingRequired = mapping.nome == null;

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 820 }}>
        <div className="modal-header">
          <div>
            <div className="modal-title">Importar Planilha</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Excel (.xlsx, .xls) ou CSV</div>
          </div>
          <button className="btn btn-icon" onClick={onClose}><X size={16} /></button>
        </div>

        <div className="modal-body">
          {!data ? (
            <div className="import-dropzone" onClick={() => fileInputRef.current.click()}>
              {loading ? (
                <Loader size={32} className="spin" style={{ color: 'var(--accent-blue)' }} />
              ) : (
                <>
                  <Upload size={32} style={{ color: 'var(--text-muted)', marginBottom: 12 }} />
                  <div style={{ fontWeight: 500, marginBottom: 4 }}>Clique para selecionar a planilha</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Os cabeçalhos serão identificados automaticamente</div>
                </>
              )}
              <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                accept=".xlsx, .xls, .csv"
                onChange={handleFileUpload}
              />
            </div>
          ) : (
            <div className="import-config">
              <div className="alert alert-info" style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Check size={14} style={{ flexShrink: 0 }} />
                <span>Planilha carregada com <strong>{data.length}</strong> linhas. Verifique o mapeamento das colunas abaixo:</span>
              </div>

              {missingRequired && (
                <div className="alert alert-warning" style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <AlertTriangle size={14} style={{ flexShrink: 0 }} />
                  <span>A coluna <strong>Nome</strong> precisa ser mapeada para continuar.</span>
                </div>
              )}

              <div className="mapping-grid">
                {Object.keys(COLUMN_MAP).map(field => (
                  <div key={field} className="mapping-item">
                    <label className="form-label" style={{ fontSize: 11, marginBottom: 4, display: 'block' }}>
                      {FIELD_LABELS[field]}
                      {field === 'nome' && <span className="required"> *</span>}
                    </label>
                    <select
                      className="form-input"
                      style={{ padding: '4px 8px', fontSize: 12 }}
                      value={mapping[field] ?? ''}
                      onChange={e => setMapping({ ...mapping, [field]: e.target.value === '' ? null : parseInt(e.target.value) })}
                    >
                      <option value="">-- Não importar --</option>
                      {headers.map((h, i) => (
                        <option key={i} value={i}>{h}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: 20 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8 }}>
                  Prévia dos primeiros registros:
                </div>
                <div style={{ maxHeight: 200, overflow: 'auto', border: '1px solid var(--border-light)', borderRadius: 4 }}>
                  <table className="data-table" style={{ fontSize: 11 }}>
                    <thead>
                      <tr>
                        {headers.map((h, i) => (
                          <th key={i} style={{ background: 'var(--bg-secondary)', position: 'sticky', top: 0 }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {preview.map((row, i) => (
                        <tr key={i}>
                          {headers.map((_, j) => (
                            <td key={j}>{row[j]?.toString() || '-'}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose} disabled={importing}>Cancelar</button>
          {data && (
            <button
              className="btn btn-primary"
              onClick={handleImport}
              disabled={importing || missingRequired}
            >
              {importing
                ? <><Loader size={13} className="spin" /> Importando...</>
                : `Importar ${data.filter(r => r[mapping.nome]).length} Registros`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
