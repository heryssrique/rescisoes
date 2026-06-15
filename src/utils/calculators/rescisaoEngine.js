/**
 * @module rescisaoEngine
 * @description Motor central de cálculo de rescisão trabalhista.
 *
 * Orquestra todos os módulos de cálculo e retorna um resultado estruturado
 * com proventos, descontos e valor líquido a receber.
 *
 * Tipos de rescisão suportados:
 *  - SEM_JUSTA_CAUSA    → demissão pelo empregador
 *  - COM_JUSTA_CAUSA    → demissão disciplinar pelo empregador
 *  - PEDIDO_DEMISSAO    → iniciativa do empregado
 *  - ACORDO_MUTUO       → CLT Art. 484-A
 *  - DETERMINADO        → término de contrato por prazo determinado
 */

import { calcularSaldoSalario } from './saldoSalario.js';
import { calcularAvisoPrevio } from './avisoPrevio.js';
import { calcularFeriasVencidas, calcularFeriasProporcionais } from './ferias.js';
import { calcularDecimoTerceiro } from './decimoTerceiro.js';
import { calcularMultaFGTS, estimarSaldoFGTS } from './fgts.js';
import { calcularINSS } from './inss.js';
import { calcularIRRF, calcularIRRF13 } from './irrf.js';

/**
 * Arredonda valor monetário para 2 casas decimais.
 * @param {number} valor
 * @returns {number}
 */
function arredondar(valor) {
  return Math.round(valor * 100) / 100;
}

/**
 * Índices da matriz de verbas por tipo de rescisão.
 * Ordem: SEM_JUSTA_CAUSA, COM_JUSTA_CAUSA, PEDIDO_DEMISSAO, ACORDO_MUTUO, DETERMINADO
 */
const INDICE_TIPO = {
  SEM_JUSTA_CAUSA: 0,
  COM_JUSTA_CAUSA: 1,
  PEDIDO_DEMISSAO: 2,
  ACORDO_MUTUO: 3,
  DETERMINADO: 4,
};

/**
 * Matriz de elegibilidade de verbas por tipo de rescisão.
 * true = verba devida | false = verba não devida
 */
const MATRIZ_VERBAS = {
  //                          SJC    CJC    PEDIDO ACORDO DETERMIN.
  saldoSalario:             [true,  true,  true,  true,  true ],
  avisoPrevio:              [true,  false, false, true,  false],
  feriasVencidas:           [true,  true,  true,  true,  true ],
  feriasProporcionais:      [true,  false, true,  true,  true ],
  decimoTerceiro:           [true,  false, true,  true,  true ],
  multaFGTS:                [true,  false, false, true,  false],
};

/**
 * Verifica se uma verba é devida para o tipo de rescisão informado.
 * @param {string} verba - Chave da MATRIZ_VERBAS
 * @param {string} tipoRescisao
 * @returns {boolean}
 */
function verbaDevida(verba, tipoRescisao) {
  const idx = INDICE_TIPO[tipoRescisao];
  if (idx === undefined) return false;
  return MATRIZ_VERBAS[verba]?.[idx] ?? false;
}

/**
 * @typedef {Object} DadosRescisao
 * @property {string} tipoRescisao
 * @property {number} salarioBruto - Salário base mensal
 * @property {Date} dataAdmissao
 * @property {Date} dataDemissao
 * @property {number} [mediasVariaveis=0] - Médias de HE, comissões, adicionais
 * @property {number} [periodosVencidos=0] - Períodos aquisitivos de férias vencidos
 * @property {number} [diasFeriasGozados=0] - Dias de férias gozados no período mais antigo
 * @property {number|null} [saldoFGTS=null] - Saldo FGTS (null = estimar automaticamente)
 * @property {boolean} [avisoPrevioTrabalhado=false]
 * @property {number} [avisoDiasDesconto=0]
 * @property {number} [numeroDependentes=0]
 * @property {string} [nomeEmpregado='']
 * @property {string} [cargo='']
 * @property {string} [matricula='']
 */

/**
 * @typedef {Object} ItemVerba
 * @property {string} descricao
 * @property {number} valor
 * @property {boolean} tributavelINSS
 * @property {boolean} tributavelIRRF
 * @property {boolean} [tributavelIRRF13]
 */

/**
 * Executa o cálculo completo da rescisão trabalhista.
 *
 * @param {DadosRescisao} dados
 * @returns {{
 *   verbas: ItemVerba[],
 *   descontos: Array<{descricao: string, valor: number}>,
 *   totais: { totalProventos: number, totalDescontos: number, liquido: number },
 *   metadados: Object
 * }}
 */
export function calcularRescisao(dados) {
  const {
    tipoRescisao,
    salarioBruto,
    dataAdmissao,
    dataDemissao,
    mediasVariaveis = 0,
    periodosVencidos = 0,
    diasFeriasGozados = 0,
    saldoFGTS: saldoFGTSInformado = null,
    avisoPrevioTrabalhado = false,
    avisoDiasDesconto = 0,
    numeroDependentes = 0,
    nomeEmpregado = '',
    cargo = '',
    matricula = '',
  } = dados;

  // Remuneração total para cálculos (salário + médias)
  const remuneracaoTotal = salarioBruto + mediasVariaveis;

  /** @type {ItemVerba[]} */
  const verbas = [];
  const descontos = [];

  let avisoDias = 0;
  let avisoAnos = 0;
  let avisoDiasPagos = 0;

  // ─── PROVENTOS ──────────────────────────────────────────────────────────────

  // 1. Saldo de Salário
  const saldo = calcularSaldoSalario(remuneracaoTotal, dataDemissao);
  if (saldo.valor > 0) {
    verbas.push({
      descricao: `Saldo de Salário (${saldo.diasTrabalhados}/${saldo.diasNoMes} dias)`,
      valor: saldo.valor,
      tributavelINSS: true,
      tributavelIRRF: true,
      tributavelIRRF13: false,
    });
  }

  // 2. Aviso Prévio
  if (verbaDevida('avisoPrevio', tipoRescisao)) {
    const modalidade = avisoPrevioTrabalhado ? 'trabalhado' : 'indenizado';
    const aviso = calcularAvisoPrevio(remuneracaoTotal, dataAdmissao, dataDemissao, modalidade, avisoDiasDesconto);
    if (aviso.valor > 0) {
      avisoDias = aviso.diasAviso;
      avisoAnos = aviso.anosServico;
      avisoDiasPagos = aviso.diasPagos;
      verbas.push({
        descricao: `Aviso Prévio ${modalidade === 'indenizado' ? 'Indenizado' : 'Trabalhado'} (${aviso.diasAviso} dias — ${aviso.anosServico} ano${aviso.anosServico !== 1 ? 's' : ''} de serviço)`,
        valor: aviso.valor,
        // Indenizado: isento de INSS e IRRF. Trabalhado: tributável.
        tributavelINSS: modalidade === 'trabalhado',
        tributavelIRRF: modalidade === 'trabalhado',
        tributavelIRRF13: false,
      });
    }
  }

  // 3. Férias Vencidas + 1/3
  if (verbaDevida('feriasVencidas', tipoRescisao) && periodosVencidos > 0) {
    const fVenc = calcularFeriasVencidas(salarioBruto, periodosVencidos, diasFeriasGozados);
    if (fVenc.total > 0) {
      verbas.push({
        descricao: `Férias Vencidas + 1/3 (${periodosVencidos} período${periodosVencidos > 1 ? 's' : ''})`,
        valor: fVenc.total,
        tributavelINSS: false, // isentas na rescisão
        tributavelIRRF: false, // isentas (art. 6°, V, Lei 7.713/88)
        tributavelIRRF13: false,
      });
    }
  }

  // 4. Férias Proporcionais + 1/3
  if (verbaDevida('feriasProporcionais', tipoRescisao)) {
    const fProp = calcularFeriasProporcionais(salarioBruto, dataAdmissao, dataDemissao);
    if (fProp.total > 0) {
      verbas.push({
        descricao: `Férias Proporcionais + 1/3 (${fProp.avos}/12 avos)`,
        valor: fProp.total,
        tributavelINSS: false,
        tributavelIRRF: false,
        tributavelIRRF13: false,
      });
    }
  }

  // 5. 13º Salário Proporcional
  if (verbaDevida('decimoTerceiro', tipoRescisao)) {
    const decimo = calcularDecimoTerceiro(remuneracaoTotal, dataAdmissao, dataDemissao);
    if (decimo.valor > 0) {
      verbas.push({
        descricao: `13º Salário Proporcional (${decimo.avos}/12 avos)`,
        valor: decimo.valor,
        tributavelINSS: true,
        tributavelIRRF: false,
        tributavelIRRF13: true, // IRRF exclusivo para 13º
      });
    }
  }

  // 6. Multa FGTS
  const saldoFGTSFinal = saldoFGTSInformado != null
    ? saldoFGTSInformado
    : estimarSaldoFGTS(remuneracaoTotal, dataAdmissao, dataDemissao);

  const fgtsInfo = calcularMultaFGTS(saldoFGTSFinal, tipoRescisao);

  if (verbaDevida('multaFGTS', tipoRescisao) && fgtsInfo.multa > 0) {
    verbas.push({
      descricao: `Multa FGTS ${fgtsInfo.percentual}% (saldo de R$ ${saldoFGTSFinal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })})`,
      valor: fgtsInfo.multa,
      tributavelINSS: false,
      tributavelIRRF: false,
      tributavelIRRF13: false,
    });
  }

  // ─── DESCONTOS ───────────────────────────────────────────────────────────────

  // Base INSS: saldo de salário + 13º proporcional + aviso prévio trabalhado
  const baseINSS = verbas
    .filter((v) => v.tributavelINSS)
    .reduce((acc, v) => acc + v.valor, 0);

  const inss = calcularINSS(baseINSS);
  if (inss.desconto > 0) {
    descontos.push({
      descricao: `INSS (alíq. efetiva ${(inss.aliquotaEfetiva * 100).toFixed(2)}% sobre R$ ${baseINSS.toFixed(2)})`,
      valor: inss.desconto,
    });
  }

  // Base IRRF mensal: verbas tributáveis (exceto 13º) menos INSS
  const baseIRRFBruta = verbas
    .filter((v) => v.tributavelIRRF)
    .reduce((acc, v) => acc + v.valor, 0);
  const baseIRRFLiquida = Math.max(0, baseIRRFBruta - inss.desconto);

  const irrf = calcularIRRF(baseIRRFLiquida, numeroDependentes);
  if (irrf.desconto > 0) {
    descontos.push({
      descricao: `IRRF (${(irrf.aliquota * 100).toFixed(1)}% sobre base líquida de R$ ${baseIRRFLiquida.toFixed(2)})`,
      valor: irrf.desconto,
    });
  }

  // IRRF exclusivo sobre 13º
  const base13Bruto = verbas
    .filter((v) => v.tributavelIRRF13)
    .reduce((acc, v) => acc + v.valor, 0);

  if (base13Bruto > 0) {
    // INSS sobre o 13º separado do total
    const inss13 = calcularINSS(base13Bruto);
    const base13Liquida = Math.max(0, base13Bruto - inss13.desconto);
    const irrf13 = calcularIRRF13(base13Liquida);
    if (irrf13.desconto > 0) {
      descontos.push({
        descricao: `IRRF sobre 13° Proporcional (${(irrf13.aliquota * 100).toFixed(1)}%)`,
        valor: irrf13.desconto,
      });
    }
  }

  // ─── TOTAIS ──────────────────────────────────────────────────────────────────

  const totalProventos = arredondar(verbas.reduce((acc, v) => acc + v.valor, 0));
  const totalDescontos = arredondar(descontos.reduce((acc, d) => acc + d.valor, 0));
  const liquido = arredondar(totalProventos - totalDescontos);

  return {
    verbas,
    descontos,
    totais: { totalProventos, totalDescontos, liquido },
    metadados: {
      nomeEmpregado,
      cargo,
      matricula,
      tipoRescisao,
      salarioBruto,
      mediasVariaveis,
      remuneracaoTotal,
      dataAdmissao,
      dataDemissao,
      dataCalculo: new Date(),
      liberaSaldo: fgtsInfo.liberaSaldo,
      saldoFGTS: saldoFGTSFinal,
      fgtsEstimado: saldoFGTSInformado == null,
      numeroDependentes,
      avisoPrevioTrabalhado,
      avisoDiasDesconto,
      avisoDias,
      avisoAnos,
      avisoDiasPagos,
    },
  };
}
