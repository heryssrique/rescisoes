/**
 * @module irrf
 * @description Cálculo do IRRF sobre verbas tributáveis na rescisão (tabela 2025).
 *
 * Verbas tributáveis: saldo de salário, aviso prévio trabalhado.
 * 13º proporcional: tributado separadamente via calcularIRRF13().
 * Verbas isentas: férias indenizadas, aviso prévio indenizado, multa FGTS.
 *
 * Base legal: Lei 14.663/2023 (atualizada para isenção 2026).
 */

/**
 * Tabela IRRF mensal.
 * Regra 2026: Isenção total para base até R$ 5.000,00.
 * Cálculo: (base × aliquota) - deducao
 */
const FAIXAS_IRRF = [
  { limite: 2259.20, aliquota: 0,     deducao: 0      },
  { limite: 2826.65, aliquota: 0.075, deducao: 169.44 },
  { limite: 3751.05, aliquota: 0.15,  deducao: 381.44 },
  { limite: 4664.68, aliquota: 0.225, deducao: 662.77 },
  { limite: Infinity, aliquota: 0.275, deducao: 896.00 },
];

/** Dedução por dependente. */
const DEDUCAO_POR_DEPENDENTE = 189.59;

/**
 * Arredonda valor monetário para 2 casas decimais.
 * @param {number} valor
 * @returns {number}
 */
function arredondar(valor) {
  return Math.round(valor * 100) / 100;
}

/**
 * Aplica a tabela progressiva do IRRF sobre uma base líquida.
 * @param {number} baseLiquida - Valor após dedução do INSS
 * @param {number} [numeroDependentes=0] - Número de dependentes do trabalhador
 * @returns {{ desconto: number, aliquota: number, deducao: number }}
 */
export function calcularIRRF(baseLiquida, numeroDependentes = 0) {
  if (!baseLiquida || baseLiquida <= 0) {
    return { desconto: 0, aliquota: 0, deducao: 0 };
  }

  const baseAposDeducaoDependentes =
    baseLiquida - numeroDependentes * DEDUCAO_POR_DEPENDENTE;

  if (baseAposDeducaoDependentes <= 0) {
    return { desconto: 0, aliquota: 0, deducao: 0 };
  }

  const faixa = FAIXAS_IRRF.find((f) => baseAposDeducaoDependentes <= f.limite);

  if (!faixa || faixa.aliquota === 0) {
    return { desconto: 0, aliquota: 0, deducao: 0 };
  }

  let impostoBruto = baseAposDeducaoDependentes * faixa.aliquota - faixa.deducao;
  impostoBruto = Math.max(0, impostoBruto);

  // Nova regra 2026: Redução progressiva do imposto
  // A 'renda mensal' utilizada na fórmula de redução é a própria baseLiquida (rendimento tributável).
  let reducao = 0;
  if (baseLiquida <= 5000) {
    // Até R$ 5.000, zera o imposto
    reducao = impostoBruto;
  } else if (baseLiquida <= 7350) {
    // De R$ 5.000,01 a R$ 7.350: R$ 978,62 – (0,133145 × renda mensal)
    reducao = 978.62 - (0.133145 * baseLiquida);
  }

  const descontoFinal = Math.max(0, impostoBruto - Math.max(0, reducao));

  return {
    desconto: arredondar(descontoFinal),
    aliquota: faixa.aliquota,
    deducao: faixa.deducao,
    reducaoAplicada: arredondar(Math.min(impostoBruto, Math.max(0, reducao)))
  };
}

/**
 * Calcula o IRRF exclusivo sobre o 13º salário.
 * O 13º é tributado separadamente, sem deduções de dependentes na base.
 * @param {number} base13Liquida - Valor do 13º após dedução do INSS
 * @returns {{ desconto: number, aliquota: number }}
 */
export function calcularIRRF13(base13Liquida) {
  return calcularIRRF(base13Liquida, 0);
}
