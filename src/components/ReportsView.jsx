import React from 'react';
import { useApp } from '../context/AppContext';
import { FileText, FileDown } from 'lucide-react';
import * as XLSX from 'xlsx';
import { formatDate } from '../utils/formatters';
import { MOTIVOS } from '../data/initialData';

export function ReportsView({ ativos, arquivados }) {
  function exportAtivos() {
    exportToExcel(ativos, "Desligamentos_Ativos", "Relatorio_Ativos.xlsx");
  }

  function exportArquivados() {
    exportToExcel(arquivados, "Desligamentos_Arquivados", "Relatorio_Arquivados.xlsx");
  }

  function exportToExcel(data, sheetName, fileName) {
    const dataToExport = data.map(d => ({
      Nome: d.nome || '',
      Cargo: d.cargo || '',
      Departamento: d.departamento || '',
      Matrícula: d.matricula || '',
      Coligada: d.coligada || '',
      Status: d.status || '',
      Motivo: MOTIVOS.find(m => m.value === d.motivo)?.label || d.motivo || '',
      'Aviso Prévio': d.avisoPrevio || '',
      'Admissão': formatDate(d.dataAdmissao) || '',
      'Comunicado': formatDate(d.dataComunicado) || '',
      'Desligamento': formatDate(d.dataDesligamento) || '',
      'Pagamento': formatDate(d.dataPagamento) || '',
    }));
    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    XLSX.writeFile(wb, fileName);
  }

  return (
    <div className="page-content">
      <div className="card" style={{ marginBottom: 20 }}>
        <h2>Central de Relatórios</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: 20 }}>
          Gere e exporte planilhas Excel contendo os dados dos processos de desligamento.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
          <div className="card" style={{ border: '1px solid var(--border)', background: 'var(--bg-secondary)', display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}><FileText size={18} style={{ color: 'var(--primary)' }}/> Processos Ativos</h3>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 8, marginBottom: 16, flex: 1 }}>
              Planilha detalhada com todos os dados dos processos que estão atualmente em trâmite no sistema.
            </p>
            <button className="btn btn-primary" onClick={exportAtivos} style={{ justifyContent: 'center' }}>
              <FileDown size={14} /> Exportar Relatório de Ativos
            </button>
          </div>

          <div className="card" style={{ border: '1px solid var(--border)', background: 'var(--bg-secondary)', display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}><FileText size={18} style={{ color: 'var(--accent-purple)' }}/> Processos Arquivados</h3>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 8, marginBottom: 16, flex: 1 }}>
              Planilha contendo o registro histórico dos processos finalizados ou cancelados.
            </p>
            <button className="btn btn-primary" onClick={exportArquivados} style={{ justifyContent: 'center', background: 'var(--accent-purple)', borderColor: 'var(--accent-purple)' }}>
              <FileDown size={14} /> Exportar Relatório de Arquivados
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
