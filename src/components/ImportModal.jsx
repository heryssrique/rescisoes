import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import * as XLSX from 'xlsx';
import { X, FileSpreadsheet, Upload, AlertCircle, Check, Loader } from 'lucide-react';
import { CHECKLIST_TEMPLATE } from '../data/initialData';
import { format } from 'date-fns';

const COLUMN_MAP = {
  nome: ['nome', 'funcionario', 'colaborador', 'nome do funcionário', 'nome completo'],
  cargo: ['cargo', 'função'],
  departamento: ['departamento', 'setor', 'área', 'obra'],
  matricula: ['matrícula', 'id', 'registro', 'cód', 'chapa'],
  dataAdmissao: ['admissão', 'data de admissão', 'data admissão'],
  dataComunicado: ['comunicado', 'data do comunicado', 'data comunicado', 'ciência'],
  dataDesligamento: ['desligamento', 'data de desligamento', 'data desligamento', 'saída', 'data saída', 'data demissão'],
  dataPagamento: ['pagamento', 'data de pagamento', 'data pagamento', 'vencimento', 'prazo pagto 10', 'prazo pagto 7'],
  motivo: ['motivo', 'tipo'],
  avisoPrevio: ['aviso prévio', 'tipo de aviso', 'aviso'],
  responsavel: ['responsável', 'rh'],
  observacoes: ['observações', 'notas', 'obs'],
};

const MOTIVO_MAP = {
  'pedido': 'pedido',
  'pedido de demissão': 'pedido',
  'pedido na experiencia': 'pedido',
  'pedido de demissao experiencia': 'pedido',
  'pedido de demissao com desconto do aviso': 'pedido',
  'demissão': 'demissao',
  'demissão sem justa causa': 'demissao',
  'dispensa s/ justa causa aviso indenizado': 'demissao',
  'dispensa s/ justa causa aviso trabalhado': 'demissao',
  'demissão sem justa causa - trab': 'demissao',
  'dispensa': 'demissao',
  'acordo': 'acordo',
  'justa causa': 'justa',
  'aposentadoria': 'aposentadoria',
  'termino de contrato': 'acordo', // Geralmente tratado como acordo ou fim de prazo
  'termino contrato': 'acordo',
  'termino de contrato antec experiencia': 'demissao',
  'termino de contrato antecipado': 'demissao',
};

const AVISO_MAP = {
  'trabalhado': 'trabalhado',
  'indenizado': 'indenizado',
  'ok': 'indenizado', // Frequentemente usado em planilhas para indicar que o aviso está OK (indenizado)
  'não aplicável': 'nao_aplicavel',
  'nao aplicavel': 'nao_aplicavel',
  'n/a': 'nao_aplicavel',
};

function normalizeKey(key) {
  return key.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
}

function formatDate(val) {
  if (!val) return '';
  if (typeof val === 'number') {
    // Excel date serial
    const date = new Date(Math.round((val - 25569) * 86400 * 1000));
    return format(date, 'yyyy-MM-dd');
  }
  if (typeof val === 'string') {
    const parts = val.split(/[-/]/);
    if (parts.length === 3) {
      // Tenta DD/MM/YYYY
      if (parts[2].length === 4) {
        return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
      }
      // Tenta YYYY-MM-DD
      if (parts[0].length === 4) {
        return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
      }
    }
  }
  return val;
}

export function ModalImportarPlanilha({ onClose }) {
  const { actions } = useApp();
  const [data, setData] = useState(null);
  const [headers, setHeaders] = useState([]);
  const [mapping, setMapping] = useState({});
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
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
        const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

        if (rows.length < 2) {
          alert('A planilha parece estar vazia ou não contém cabeçalhos.');
          setLoading(false);
          return;
        }

        const rawHeaders = rows[0];
        const rawData = rows.slice(1);
        
        setHeaders(rawHeaders);
        setData(rawData);
        
        // Auto mapping
        const initialMapping = {};
        rawHeaders.forEach((h, index) => {
          const normH = normalizeKey(h.toString());
          for (const [key, aliases] of Object.entries(COLUMN_MAP)) {
            if (aliases.some(alias => normalizeKey(alias) === normH)) {
              initialMapping[key] = index;
            }
          }
        });
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
    if (!mapping.nome || !mapping.dataDesligamento || !mapping.dataPagamento) {
      alert('Por favor, mapeie pelo menos o Nome, Data de Desligamento e Data de Pagamento.');
      return;
    }

    setImporting(true);
    try {
      const formattedData = data.map(row => {
        const item = {
          nome: row[mapping.nome] || '',
          cargo: row[mapping.cargo] || '',
          departamento: row[mapping.departamento] || '',
          matricula: row[mapping.matricula]?.toString() || '',
          dataAdmissao: formatDate(row[mapping.dataAdmissao]),
          dataComunicado: formatDate(row[mapping.dataComunicado]) || format(new Date(), 'yyyy-MM-dd'),
          dataDesligamento: formatDate(row[mapping.dataDesligamento]),
          dataPagamento: formatDate(row[mapping.dataPagamento]),
          motivo: MOTIVO_MAP[normalizeKey(row[mapping.motivo]?.toString() || '')] || 'demissao',
          avisoPrevio: AVISO_MAP[normalizeKey(row[mapping.avisoPrevio]?.toString() || '')] || 'indenizado',
          responsavel: row[mapping.responsavel] || '',
          observacoes: row[mapping.observacoes] || '',
          status: 'comunicado',
          checklist: CHECKLIST_TEMPLATE.map(c => ({ ...c, done: false, doneAt: null })),
          historico: [
            {
              data: format(new Date(), "yyyy-MM-dd'T'HH:mm:ss"),
              acao: 'Importado via planilha',
              nota: '',
            },
          ],
        };
        return item;
      }).filter(item => item.nome); // Remove linhas vazias

      await actions.importDesligamentos(formattedData);
      onClose();
    } catch (err) {
      alert('Erro na importação: ' + err.message);
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 800 }}>
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
                <Loader size={32} className="spin" style={{ color: 'var(--primary)' }} />
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
              <div className="alert alert-info" style={{ marginBottom: 16 }}>
                <Check size={14} />
                <span>Planilha carregada com <strong>{data.length}</strong> linhas. Verifique o mapeamento das colunas:</span>
              </div>

              <div className="mapping-grid">
                {Object.keys(COLUMN_MAP).map(field => (
                  <div key={field} className="mapping-item">
                    <label className="form-label" style={{ fontSize: 11, marginBottom: 4, display: 'block' }}>
                      {field.charAt(0).toUpperCase() + field.slice(1).replace(/([A-Z])/g, ' $1')}
                      {['nome', 'dataDesligamento', 'dataPagamento'].includes(field) && <span className="required">*</span>}
                    </label>
                    <select 
                      className="form-input" 
                      style={{ padding: '4px 8px', fontSize: 13 }}
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
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8 }}>Prévia dos primeiros registros:</div>
                <div className="table-container" style={{ maxHeight: 200, overflow: 'auto', border: '1px solid var(--border-light)', borderRadius: 4 }}>
                  <table className="data-table" style={{ fontSize: 11 }}>
                    <thead>
                      <tr>
                        {headers.map((h, i) => (
                          <th key={i} style={{ background: 'var(--bg-light)', position: 'sticky', top: 0 }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {data.slice(0, 5).map((row, i) => (
                        <tr key={i}>
                          {row.map((cell, j) => (
                            <td key={j}>{cell?.toString() || '-'}</td>
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
            <button className="btn btn-primary" onClick={handleImport} disabled={importing}>
              {importing ? <><Loader size={13} className="spin" /> Importando...</> : `Importar ${data.length} Registros`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
