/**
 * @module pdfExport
 * @description Geração de PDF do demonstrativo de rescisão via jsPDF + html2canvas.
 *
 * Requer que as bibliotecas estejam disponíveis no escopo global (via CDN no index.html):
 *  - window.jspdf.jsPDF
 *  - window.html2canvas
 */

import { gerarLog } from './gerarLog.js';
import { jsPDF } from 'jspdf';

/**
 * Formata um valor monetário em Real (R$).
 * @param {number} valor
 * @returns {string}
 */
function formatarMoeda(valor) {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

/**
 * Formata uma data para o padrão brasileiro (DD/MM/AAAA).
 * @param {Date} data
 * @returns {string}
 */
function formatarData(data) {
  if (!(data instanceof Date) || isNaN(data)) return '—';
  return data.toLocaleDateString('pt-BR');
}

/**
 * Retorna o rótulo legível para o tipo de rescisão.
 * @param {string} tipo
 * @returns {string}
 */
function labelTipoRescisao(tipo) {
  const mapa = {
    SEM_JUSTA_CAUSA: 'Sem Justa Causa',
    COM_JUSTA_CAUSA: 'Com Justa Causa',
    PEDIDO_DEMISSAO: 'Pedido de Demissão',
    ACORDO_MUTUO: 'Acordo Mútuo (Art. 484-A)',
    DETERMINADO: 'Término de Contrato Determinado',
  };
  return mapa[tipo] ?? tipo;
}

/**
 * Gera e faz o download do PDF do demonstrativo de rescisão.
 *
 * @param {Object} resultado - Retorno completo do calcularRescisao()
 * @returns {Promise<void>}
 */
export async function exportarPDF(resultado) {
  const { verbas, descontos, totais, metadados } = resultado;

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  const AZUL = [30, 64, 175];
  const PRETO = [15, 23, 42];
  const CINZA = [100, 116, 139];
  const VERDE = [16, 185, 129];
  const VERMELHO = [239, 68, 68];
  const FUNDO_CABECALHO = [15, 23, 42];
  const FUNDO_SECAO = [241, 245, 249];
  const BRANCO = [255, 255, 255];

  const MARGEM = 15;
  const LARGURA = 210 - MARGEM * 2;
  let y = 0;

  // ─── Cabeçalho ───────────────────────────────────────────────────────────────
  doc.setFillColor(...FUNDO_CABECALHO);
  doc.rect(0, 0, 210, 38, 'F');

  doc.setTextColor(...BRANCO);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('PrevRescis', MARGEM, 16);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Demonstrativo de Prévia de Rescisão Trabalhista', MARGEM, 23);

  doc.setFontSize(8);
  doc.setTextColor(...CINZA);
  doc.text(
    `Gerado em: ${formatarData(metadados.dataCalculo)} — Este documento é apenas uma prévia estimada.`,
    MARGEM,
    31
  );

  y = 46;

  // ─── Dados do Funcionário ────────────────────────────────────────────────────
  doc.setFillColor(...FUNDO_SECAO);
  doc.roundedRect(MARGEM, y, LARGURA, 36, 2, 2, 'F');

  doc.setTextColor(...AZUL);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('DADOS DO FUNCIONÁRIO', MARGEM + 4, y + 7);

  doc.setTextColor(...PRETO);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');

  const col1x = MARGEM + 4;
  const col2x = MARGEM + 90;
  const lineH = 6;
  let ly = y + 14;

  const campos = [
    ['Nome', metadados.nomeEmpregado || '—'],
    ['Matrícula', metadados.matricula || '—'],
    ['Cargo', metadados.cargo || '—'],
    ['Admissão', formatarData(metadados.dataAdmissao)],
    ['Demissão', formatarData(metadados.dataDemissao)],
    ['Tipo de Rescisão', labelTipoRescisao(metadados.tipoRescisao)],
  ];

  campos.slice(0, 3).forEach(([label, valor], i) => {
    doc.setFont('helvetica', 'bold');
    doc.text(`${label}:`, col1x, ly + i * lineH);
    doc.setFont('helvetica', 'normal');
    doc.text(valor, col1x + 22, ly + i * lineH);
  });

  campos.slice(3).forEach(([label, valor], i) => {
    doc.setFont('helvetica', 'bold');
    doc.text(`${label}:`, col2x, ly + i * lineH);
    doc.setFont('helvetica', 'normal');
    doc.text(valor, col2x + 30, ly + i * lineH);
  });

  y += 42;

  // ─── Tabela de Proventos ─────────────────────────────────────────────────────
  function desenharSecao(titulo, itens, cor) {
    doc.setFillColor(...cor);
    doc.rect(MARGEM, y, LARGURA, 7, 'F');
    doc.setTextColor(...BRANCO);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text(titulo, MARGEM + 4, y + 5);
    y += 9;

    itens.forEach((item, idx) => {
      if (idx % 2 === 0) {
        doc.setFillColor(248, 250, 252);
        doc.rect(MARGEM, y - 1, LARGURA, 6.5, 'F');
      }
      doc.setTextColor(...PRETO);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.text(item.descricao, MARGEM + 4, y + 4);
      doc.text(formatarMoeda(item.valor), 210 - MARGEM - 4, y + 4, { align: 'right' });
      y += 6.5;
    });

    y += 2;
  }

  desenharSecao('PROVENTOS', verbas, [16, 185, 129]);

  if (y > 240) { doc.addPage(); y = 20; }
  desenharSecao('DESCONTOS', descontos.length > 0 ? descontos : [{ descricao: 'Nenhum desconto aplicável', valor: 0 }], [239, 68, 68]);

  // ─── Totais ───────────────────────────────────────────────────────────────────
  y += 2;
  doc.setFillColor(...FUNDO_SECAO);
  doc.roundedRect(MARGEM, y, LARGURA, 26, 2, 2, 'F');

  const totaisLinha = [
    ['Total de Proventos:', formatarMoeda(totais.totalProventos), VERDE],
    ['Total de Descontos:', formatarMoeda(totais.totalDescontos), VERMELHO],
    ['Líquido a Receber:', formatarMoeda(totais.liquido), AZUL],
  ];

  let ty = y + 7;
  totaisLinha.forEach(([label, valor, cor]) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(...PRETO);
    doc.text(label, MARGEM + 4, ty);
    doc.setTextColor(...cor);
    doc.text(valor, 210 - MARGEM - 4, ty, { align: 'right' });
    ty += 8;
  });

  // ─── Rodapé ──────────────────────────────────────────────────────────────────
  y = 285;
  doc.setFontSize(7);
  doc.setTextColor(...CINZA);
  doc.setFont('helvetica', 'italic');
  doc.text(
    'ATENÇÃO: Este demonstrativo é apenas uma prévia estimada. Valores finais devem ser homologados pelo RH.',
    MARGEM,
    y
  );

  // ─── Memória de Cálculo ──────────────────────────────────────────────────────
  doc.addPage();
  y = 20;

  doc.setFillColor(...FUNDO_CABECALHO);
  doc.rect(0, 0, 210, 25, 'F');
  doc.setTextColor(...BRANCO);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Memória de Cálculo Detalhada', MARGEM, 16);

  const etapas = gerarLog(resultado);

  // Função para sanitizar caracteres não suportados pela fonte padrão do jsPDF (Helvetica)
  function sanitizarTexto(texto) {
    if (!texto) return '';
    return texto
      .replace(/→/g, '->')
      .replace(/−/g, '-')
      .replace(/×/g, 'x')
      .replace(/÷/g, '/')
      .replace(/✅/g, '(Sim)')
      .replace(/❌/g, '(Nao)');
  }

  doc.setTextColor(...PRETO);
  y = 35;

  etapas.forEach((etapa) => {
    // Check page break (um pouco mais de margem para o bloco do titulo)
    if (y > 250) {
      doc.addPage();
      y = 20;
    }

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    // Não imprime o ícone (etapa.icon) porque causa caracteres estranhos no jsPDF
    doc.text(sanitizarTexto(etapa.titulo), MARGEM, y);
    y += 5;

    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    if (etapa.formula) {
      doc.text(`Formula: ${sanitizarTexto(etapa.formula)}`, MARGEM + 4, y);
      y += 4;
    }
    if (etapa.baseLegal) {
      doc.text(`Base Legal: ${sanitizarTexto(etapa.baseLegal)}`, MARGEM + 4, y);
      y += 4;
    }
    y += 2;

    doc.setFont('helvetica', 'normal');
    etapa.passos.forEach((passo) => {
      if (y > 280) {
        doc.addPage();
        y = 20;
      }
      
      // Quebra de linha manual para passos muito longos
      const linhas = doc.splitTextToSize(`• ${sanitizarTexto(passo)}`, LARGURA - 4);
      doc.text(linhas, MARGEM + 4, y);
      y += (4 * linhas.length);
    });

    y += 4;
  });

  // ─── Download ────────────────────────────────────────────────────────────────
  const nomeArquivo = `prevrescis_${(metadados.nomeEmpregado || 'funcionario').replace(/\s+/g, '_').toLowerCase()}_${Date.now()}.pdf`;
  doc.save(nomeArquivo);
}
