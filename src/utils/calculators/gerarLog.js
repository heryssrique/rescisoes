/**
 * @module gerarLog
 * @description Gera o log detalhado passo a passo do cálculo de rescisão.
 * Recebendo o objeto resultado do rescisaoEngine, reconstrói cada etapa
 * com fórmulas, valores intermediários e bases legais.
 */

/**
 * Formata valor monetário.
 * @param {number} v
 * @returns {string}
 */
function formatBRL(v) {
  if (typeof v !== 'number' || isNaN(v)) return 'R$ 0,00';
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

/**
 * Formata data no padrão DD/MM/AAAA.
 * @param {Date} d
 * @returns {string}
 */
function formatData(d) {
  if (!(d instanceof Date) || isNaN(d)) return '—';
  return d.toLocaleDateString('pt-BR');
}

/**
 * Retorna o nome do mês e ano de uma data.
 * @param {Date} d
 * @returns {string}
 */
function nomeMesAno(d) {
  return d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
}

/**
 * Retorna o número de dias de um determinado mês.
 * @param {Date} d
 * @returns {number}
 */
function diasNoMes(d) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
}

/** Labels dos tipos de rescisão. */
const LABEL_TIPO = {
  SEM_JUSTA_CAUSA: 'Sem Justa Causa (pelo empregador)',
  COM_JUSTA_CAUSA: 'Com Justa Causa (pelo empregador)',
  PEDIDO_DEMISSAO: 'Pedido de Demissão (pelo empregado)',
  ACORDO_MUTUO:    'Acordo Mútuo — Art. 484-A CLT',
  DETERMINADO:     'Término de Contrato por Prazo Determinado',
};

/**
 * @typedef {Object} EtapaLog
 * @property {string} titulo
 * @property {string} icon
 * @property {'info'|'provento'|'desconto'|'total'} tipo
 * @property {string} [formula]
 * @property {string} [baseLegal]
 * @property {string[]} passos
 * @property {number|null} resultado
 */

/**
 * Gera a lista de etapas detalhadas do log de cálculo.
 * @param {Object} resultado - Retorno completo do calcularRescisao()
 * @returns {EtapaLog[]}
 */
export function gerarLog(resultado) {
  const { verbas, descontos, totais, metadados } = resultado;

  const {
    salarioBruto,
    mediasVariaveis = 0,
    remuneracaoTotal,
    dataAdmissao,
    dataDemissao,
    tipoRescisao,
    saldoFGTS,
    fgtsEstimado,
    numeroDependentes = 0,
    avisoPrevioTrabalhado = false,
  } = metadados;

  /** @type {EtapaLog[]} */
  const etapas = [];

  // ─── ETAPA 0: Dados Base ──────────────────────────────────────────────────

  const passosDadosBase = [
    `Tipo de rescisão: ${LABEL_TIPO[tipoRescisao] || tipoRescisao}`,
    `Admissão: ${formatData(dataAdmissao)}`,
    `Demissão: ${formatData(dataDemissao)}`,
    `Salário base bruto: ${formatBRL(salarioBruto)}`,
  ];

  if (mediasVariaveis > 0) {
    passosDadosBase.push(`Médias variáveis (HE, comissões, adicionais): ${formatBRL(mediasVariaveis)}`);
    passosDadosBase.push(`Remuneração total (base dos cálculos): ${formatBRL(remuneracaoTotal)}`);
  }

  if (numeroDependentes > 0) {
    passosDadosBase.push(`Dependentes para dedução de IRRF: ${numeroDependentes}`);
  }

  passosDadosBase.push(`Saldo FGTS: ${formatBRL(saldoFGTS)} ${fgtsEstimado ? '(estimado — 8% × salário × meses trabalhados)' : '(informado pelo usuário)'}`);

  etapas.push({
    titulo: 'Dados Base do Cálculo',
    icon: '📊',
    tipo: 'info',
    passos: passosDadosBase,
    resultado: null,
  });

  // ─── ETAPA 1–N: Proventos ────────────────────────────────────────────────

  for (const verba of verbas) {
    const desc = verba.descricao;

    // Saldo de Salário
    if (desc.includes('Saldo de Salário')) {
      const match = desc.match(/(\d+)\/(\d+)/);
      const diasTrab = match ? +match[1] : dataDemissao.getDate();
      const totalDias = match ? +match[2] : diasNoMes(dataDemissao);
      const valorDiario = remuneracaoTotal / totalDias;

      etapas.push({
        titulo: 'Saldo de Salário',
        icon: '💵',
        tipo: 'provento',
        formula: 'Remuneração ÷ Dias do mês × Dias trabalhados',
        baseLegal: 'CLT Art. 477',
        passos: [
          `Mês de demissão: ${nomeMesAno(dataDemissao)} → ${totalDias} dias`,
          `Dias trabalhados até a data de demissão: ${diasTrab} dias`,
          `Valor diário: ${formatBRL(remuneracaoTotal)} ÷ ${totalDias} = ${formatBRL(valorDiario)}/dia`,
          `Cálculo: ${formatBRL(valorDiario)} × ${diasTrab} dias = ${formatBRL(verba.valor)}`,
          'Tributação: INSS ✅  |  IRRF ✅',
        ],
        resultado: verba.valor,
      });
      continue;
    }

    // Aviso Prévio
    if (desc.includes('Aviso Prévio')) {
      const matchDias = desc.match(/(\d+) dias/);
      const matchAnos = desc.match(/(\d+) ano/);
      const dias  = matchDias ? +matchDias[1] : '?';
      const anos  = matchAnos ? +matchAnos[1] : 0;
      const modal = avisoPrevioTrabalhado ? 'Trabalhado' : 'Indenizado';
      const diasBase = 30 + anos * 3;

      etapas.push({
        titulo: `Aviso Prévio ${modal}`,
        icon: '📅',
        tipo: 'provento',
        formula: '30 dias base + 3 dias × anos completos de serviço (máximo: 90 dias)',
        baseLabel: 'Base Legal',
        baseText: 'CLT Art. 487 + Lei 12.506/2011',
        baseLegal: 'CLT Art. 487 + Lei 12.506/2011',
        passos: [
          `Admissão: ${formatData(dataAdmissao)} → Demissão: ${formatData(dataDemissao)}`,
          `Anos completos de serviço: ${anos} ano${anos !== 1 ? 's' : ''}`,
          `Dias de aviso (total devido): 30 + (${anos} × 3) = ${diasBase} dias${diasBase > 90 ? ' → limitado a 90' : ''}`,
          (metadados.avisoDiasDesconto > 0 && modal === 'Trabalhado') ? `Dias trabalhados descontados do pagamento (-${metadados.avisoDiasDesconto} dias já pagos no saldo de salário)` : null,
          `Dias efetivamente pagos: ${metadados.avisoDiasPagos ?? dias} dias`,
          `Valor diário: ${formatBRL(remuneracaoTotal)} ÷ 30 = ${formatBRL(remuneracaoTotal / 30)}/dia`,
          `Cálculo: ${formatBRL(remuneracaoTotal / 30)} × ${metadados.avisoDiasPagos ?? dias} dias = ${formatBRL(verba.valor)}`,
          modal === 'Indenizado'
            ? 'Tributação: INSS ❌ (indenizatório)  |  IRRF ❌ (indenizatório)'
            : 'Tributação: INSS ✅ (salarial)  |  IRRF ✅ (salarial)',
        ].filter(Boolean),
        resultado: verba.valor,
      });
      continue;
    }

    // Férias Vencidas
    if (desc.includes('Férias Vencidas')) {
      const matchPer = desc.match(/(\d+) período/);
      const periodos = matchPer ? +matchPer[1] : 1;
      const diasFerias = periodos * 30;
      const valorBase  = (salarioBruto / 30) * diasFerias;
      const umTerco    = valorBase / 3;

      etapas.push({
        titulo: 'Férias Vencidas + 1/3 Constitucional',
        icon: '🏖️',
        tipo: 'provento',
        formula: '(Salário ÷ 30 × Dias de férias) + 1/3',
        baseLegal: 'CLT Arts. 129-145 + CF Art. 7°, XVII',
        passos: [
          `Períodos aquisitivos completos (12 meses) não gozados: ${periodos}`,
          `Total de dias de férias devidos: ${periodos} × 30 = ${diasFerias} dias`,
          `Valor base: ${formatBRL(salarioBruto)} ÷ 30 × ${diasFerias} = ${formatBRL(valorBase)}`,
          `1/3 constitucional: ${formatBRL(valorBase)} ÷ 3 = ${formatBRL(umTerco)}`,
          `Total: ${formatBRL(valorBase)} + ${formatBRL(umTerco)} = ${formatBRL(verba.valor)}`,
          'Tributação: INSS ❌ (indenizatório)  |  IRRF ❌ (art. 6°, V, Lei 7.713/88)',
        ],
        resultado: verba.valor,
      });
      continue;
    }

    // Férias Proporcionais
    if (desc.includes('Férias Proporcionais')) {
      const matchAvos = desc.match(/(\d+)\/12 avos/);
      const avos      = matchAvos ? +matchAvos[1] : '?';
      const diasFerias = Math.round((+avos / 12) * 30);
      const valorBase  = (salarioBruto / 30) * diasFerias;
      const umTerco    = valorBase / 3;

      etapas.push({
        titulo: 'Férias Proporcionais + 1/3 Constitucional',
        icon: '⛱️',
        tipo: 'provento',
        formula: 'arred(Avos ÷ 12 × 30) dias × Salário ÷ 30 + 1/3',
        baseLabel: 'Base Legal',
        baseText: 'CLT Arts. 129-145 + CF Art. 7°, XVII',
        baseLegal: 'CLT Arts. 129-145 + CF Art. 7°, XVII',
        passos: [
          `Avos do período aquisitivo em curso: ${avos}/12`,
          `Regra de contagem: mês com ≥ 15 dias trabalhados = 1 avo`,
          `Dias de férias: arred(${avos} ÷ 12 × 30) = ${diasFerias} dias`,
          `Valor base: ${formatBRL(salarioBruto)} ÷ 30 × ${diasFerias} = ${formatBRL(valorBase)}`,
          `1/3 constitucional: ${formatBRL(valorBase)} ÷ 3 = ${formatBRL(umTerco)}`,
          `Total: ${formatBRL(valorBase)} + ${formatBRL(umTerco)} = ${formatBRL(verba.valor)}`,
          'Tributação: INSS ❌ (indenizatório)  |  IRRF ❌ (art. 6°, V, Lei 7.713/88)',
        ],
        resultado: verba.valor,
      });
      continue;
    }

    // 13º Salário Proporcional
    if (desc.includes('13º')) {
      const matchAvos = desc.match(/(\d+)\/12 avos/);
      const avos      = matchAvos ? +matchAvos[1] : '?';

      etapas.push({
        titulo: '13º Salário Proporcional',
        icon: '🎁',
        tipo: 'provento',
        formula: 'Remuneração ÷ 12 × Avos trabalhados no ano',
        baseLabel: 'Base Legal',
        baseText: 'Lei 4.090/1962',
        baseLegal: 'Lei 4.090/1962',
        passos: [
          `Avos trabalhados no ano civil (jan até demissão): ${avos}/12`,
          `Regra: mês com ≥ 15 dias trabalhados = 1 avo`,
          `Cálculo: ${formatBRL(remuneracaoTotal)} ÷ 12 × ${avos} = ${formatBRL(verba.valor)}`,
          'Tributação: INSS ✅ (salarial)  |  IRRF ✅ exclusivo 13° (tabela separada)',
        ],
        resultado: verba.valor,
      });
      continue;
    }

    // Multa FGTS
    if (desc.includes('Multa FGTS')) {
      const matchPct = desc.match(/(\d+)%/);
      const pct      = matchPct ? +matchPct[1] : '?';
      const label    = pct === 40 ? 'Demissão sem justa causa' : 'Acordo Mútuo (Art. 484-A CLT)';

      etapas.push({
        titulo: `Multa FGTS — ${pct}%`,
        icon: '🏦',
        tipo: 'provento',
        formula: `Saldo FGTS × ${pct}%`,
        baseLabel: 'Base Legal',
        baseText: 'Lei 8.036/1990' + (pct === 20 ? ' + CLT Art. 484-A' : ''),
        baseLegal: 'Lei 8.036/1990' + (pct === 20 ? ' + CLT Art. 484-A' : ''),
        passos: [
          `Modalidade: ${label}`,
          `Saldo FGTS: ${formatBRL(saldoFGTS)} ${fgtsEstimado ? '(estimado)' : '(informado)'}`,
          fgtsEstimado ? `Estimativa: 8% × ${formatBRL(salarioBruto)} × meses trabalhados` : null,
          `Percentual da multa: ${pct}%`,
          `Cálculo: ${formatBRL(saldoFGTS)} × ${pct / 100} = ${formatBRL(verba.valor)}`,
          'Tributação: INSS ❌ (indenizatório)  |  IRRF ❌ (indenizatório)',
        ].filter(Boolean),
        resultado: verba.valor,
      });
      continue;
    }
  }

  // ─── ETAPA N+1–M: Descontos ───────────────────────────────────────────────

  const baseINSS = verbas.filter(v => v.tributavelINSS).reduce((a, v) => a + v.valor, 0);
  const inssDesconto = descontos.find(d => d.descricao.includes('INSS'))?.valor || 0;

  for (const desc of descontos) {
    // INSS
    if (desc.descricao.includes('INSS')) {
      const verbasINSSStr = verbas
        .filter(v => v.tributavelINSS)
        .map(v => `  • ${v.descricao.split('(')[0].trim()}: ${formatBRL(v.valor)}`);

      etapas.push({
        titulo: 'Desconto de INSS',
        icon: '🏥',
        tipo: 'desconto',
        formula: 'Alíquotas progressivas sobre base tributável (tabela 2025)',
        baseLabel: 'Base Legal',
        baseText: 'Lei 8.212/1991 + Portaria Interministerial 2025',
        baseText: 'Lei 8.212/1991',
        baseLegal: 'Lei 8.212/1991',
        passos: [
          'Verbas sujeitas a INSS:',
          ...verbasINSSStr,
          `Base de cálculo total: ${formatBRL(baseINSS)}`,
          '─── Tabela INSS 2025 (progressiva) ───',
          '  Faixa 1: até R$ 1.518,00 → 7,5%',
          '  Faixa 2: R$ 1.518,01 a R$ 2.793,88 → 9,0%',
          '  Faixa 3: R$ 2.793,89 a R$ 4.190,83 → 12,0%',
          '  Faixa 4: R$ 4.190,84 a R$ 8.157,41 → 14,0%',
          'Desconto calculado faixa a faixa (não alíquota única)',
          `Resultado: ${formatBRL(desc.valor)}`,
          'Verbas ISENTAS de INSS: férias indenizadas, aviso prévio indenizado, multa FGTS',
        ],
        resultado: desc.valor,
      });
      continue;
    }

    // IRRF mensal
    if (desc.descricao.includes('IRRF') && !desc.descricao.includes('13°')) {
      const baseIRRFBruta = verbas.filter(v => v.tributavelIRRF).reduce((a, v) => a + v.valor, 0);
      const baseLiquida   = Math.max(0, baseIRRFBruta - inssDesconto);
      const deducDep      = numeroDependentes * 189.59;
      const baseAposDeducoes = Math.max(0, baseLiquida - deducDep);

      let statusIRRF = '';
      if (baseAposDeducoes <= 5000) {
        statusIRRF = `► ISENTO: A base de cálculo (${formatBRL(baseAposDeducoes)}) é menor ou igual ao limite de isenção (R$ 5.000,00). Nenhum imposto será descontado.`;
      } else if (baseAposDeducoes <= 7350) {
        statusIRRF = `► TRIBUTADO COM REDUÇÃO: Base (${formatBRL(baseAposDeducoes)}) se enquadra na regra de transição. Aplica-se a fórmula de redução simplificada.`;
      } else {
        statusIRRF = `► TRIBUTADO: Base (${formatBRL(baseAposDeducoes)}) acima de R$ 7.350,00. Aplica-se a tabela progressiva integral.`;
      }

      const verbasIRRFStr = verbas
        .filter(v => v.tributavelIRRF)
        .map(v => `  • ${v.descricao.split('(')[0].trim()}: ${formatBRL(v.valor)}`);

      etapas.push({
        titulo: 'Desconto de IRRF',
        icon: '📋',
        tipo: 'desconto',
        formula: '(Base tributável − INSS − Dependentes) × Alíquota − Parcela a deduzir',
        baseLegal: 'Lei 7.713/88 + Lei 14.663/2023',
        passos: [
          'Verbas sujeitas a IRRF:',
          ...(verbasIRRFStr.length > 0 ? verbasIRRFStr : ['  (nenhuma verba tributável)']),
          `Base bruta IRRF: ${formatBRL(baseIRRFBruta)}`,
          `(−) Desconto INSS: − ${formatBRL(inssDesconto)}`,
          numeroDependentes > 0 ? `(−) Dedução dependentes (${numeroDependentes} × R$ 189,59): − ${formatBRL(deducDep)}` : null,
          `Base líquida (após deduções): ${formatBRL(baseAposDeducoes)}`,
          statusIRRF,
          '─── Tabela IRRF Mensal 2026 (Com Redução) ───',
          '  Tabela progressiva base (alíquotas de 7,5% a 27,5%)',
          '  Renda até R$ 5.000,00 → Imposto zerado (Redução total)',
          '  Renda R$ 5.000,01 a R$ 7.350,00 → Redução: R$ 978,62 - (0,133145 × renda)',
          '  Renda acima de R$ 7.350,01 → Sem redução adicional',
          `Resultado Final após reduções: ${formatBRL(desc.valor)}`,
          'Verbas ISENTAS de IRRF: férias indenizadas, aviso prévio indenizado, multa FGTS',
        ].filter(Boolean),
        resultado: desc.valor,
      });
      continue;
    }

    // IRRF 13º
    if (desc.descricao.includes('13°') || desc.descricao.includes('13º')) {
      const base13Bruta = verbas.filter(v => v.tributavelIRRF13).reduce((a, v) => a + v.valor, 0);
      const inss13Desc = descontos.find(d => d.descricao.includes('INSS sobre 13º'))?.valor || 0;
      const base13 = Math.max(0, base13Bruta - inss13Desc);

      let statusIRRF13 = '';
      if (base13 <= 5000) {
        statusIRRF13 = `► ISENTO: A base do 13º (${formatBRL(base13)}) é menor ou igual ao limite de isenção (R$ 5.000,00).`;
      } else if (base13 <= 7350) {
        statusIRRF13 = `► TRIBUTADO COM REDUÇÃO: Base (${formatBRL(base13)}) na regra de transição.`;
      } else {
        statusIRRF13 = `► TRIBUTADO: Base (${formatBRL(base13)}) acima de R$ 7.350,00.`;
      }

      etapas.push({
        titulo: 'IRRF sobre 13º Salário',
        icon: '📋',
        tipo: 'desconto',
        formula: '13º líquido de INSS × Alíquota − Parcela a deduzir',
        baseLegal: 'Decreto 9.580/2018 (RIR)',
        passos: [
          'O 13º salário é tributado SEPARADAMENTE do salário mensal',
          'Não é somado às demais verbas nem tem dedução de dependentes',
          `Base bruta do 13º: ${formatBRL(base13Bruta)}`,
          `(−) Desconto INSS s/ 13º: − ${formatBRL(inss13Desc)}`,
          `Base líquida do 13º: ${formatBRL(base13)}`,
          statusIRRF13,
          `Resultado: ${formatBRL(desc.valor)}`,
        ],
        resultado: desc.valor,
      });
      continue;
    }
  }

  // ─── ETAPA FINAL: Resumo ──────────────────────────────────────────────────

  etapas.push({
    titulo: 'Resultado Final — Líquido a Receber',
    icon: '🏆',
    tipo: 'total',
    formula: 'Total de Proventos − Total de Descontos',
    passos: [
      `(+) Total de Proventos: ${formatBRL(totais.totalProventos)}`,
      `(−) Total de Descontos: − ${formatBRL(totais.totalDescontos)}`,
    ],
    resultado: totais.liquido,
  });

  return etapas;
}
