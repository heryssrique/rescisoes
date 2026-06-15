/**
 * @module inss
 * @description Cálculo do INSS com base na tabela progressiva de 2025.
 *
 * Incide sobre: saldo de salário, 13º proporcional, aviso prévio trabalhado.
 * NÃO incide sobre: férias indenizadas, aviso prévio indenizado, multa FGTS.
 *
 * Referência: Portaria Interministerial MPS/MF (tabela 2025).
 */

/** Faixas progressivas de contribuição ao INSS (2025). */
const FAIXAS_INSS = [
  { limite: 1518.00, aliquota: 0.075 },
  { limite: 2793.88, aliquota: 0.09 },
  { limite: 4190.83, aliquota: 0.12 },
  { limite: 8157.41, aliquota: 0.14 },
];

const TETO_INSS = 8157.41;

/**
 * Arredonda valor monetário para 2 casas decimais.
 * @param {number} valor
 * @returns {number}
 */
function arredondar(valor) {
  return Math.round(valor * 100) / 100;
}

/**
 * Calcula o desconto de INSS progressivo sobre uma base de cálculo mensal.
 * @param {number} base - Valor bruto base de cálculo (ex: salário)
 * @returns {{ desconto: number, aliquotaEfetiva: number, faixas: Array<{descricao: string, valor: number}> }}
 */
export function calcularINSS(base) {
  if (!base || base <= 0) {
    return { desconto: 0, aliquotaEfetiva: 0, faixas: [] };
  }

  const baseCalculo = Math.min(base, TETO_INSS);
  let desconto = 0;
  const faixas = [];
  let limiteAnterior = 0;

  for (const faixa of FAIXAS_INSS) {
    if (baseCalculo <= limiteAnterior) break;

    const baseNaFaixa = Math.min(baseCalculo, faixa.limite) - limiteAnterior;
    const valorFaixa = arredondar(baseNaFaixa * faixa.aliquota);

    if (baseNaFaixa > 0) {
      faixas.push({
        descricao: `Faixa ${(faixa.aliquota * 100).toFixed(1)}% sobre R$ ${baseNaFaixa.toFixed(2)}`,
        valor: valorFaixa,
      });
      desconto += valorFaixa;
    }

    limiteAnterior = faixa.limite;
  }

  const descontoFinal = arredondar(desconto);

  return {
    desconto: descontoFinal,
    aliquotaEfetiva: baseCalculo > 0 ? arredondar(descontoFinal / baseCalculo) : 0,
    faixas,
  };
}
