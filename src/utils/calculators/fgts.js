/**
 * @module fgts
 * @description Calcula a estimativa de saldo FGTS e as multas rescisórias.
 *
 * Alíquota de depósito: 8% sobre a remuneração mensal bruta.
 * Multas:
 *  - Demissão sem justa causa (SJC): 40% sobre o saldo total
 *  - Rescisão por acordo mútuo (484-A): 20% sobre o saldo total
 *  - Com justa causa / Pedido de demissão: sem multa, FGTS bloqueado
 *  - Término de contrato determinado: sem multa, saldo liberado
 *
 * Referência: Lei 8.036/1990, CLT Art. 484-A.
 */

const ALIQUOTA_DEPOSITO = 0.08;
const DIAS_MES_MEDIO = 30.44;

/**
 * Arredonda valor monetário para 2 casas decimais.
 * @param {number} valor
 * @returns {number}
 */
function arredondar(valor) {
  return Math.round(valor * 100) / 100;
}

/**
 * Estima o saldo do FGTS com base no salário e período trabalhado.
 * Esta é uma estimativa (não considera rendimentos, saques anteriores, etc.).
 *
 * @param {number} salarioBruto - Salário mensal bruto médio
 * @param {Date} dataAdmissao
 * @param {Date} dataDemissao
 * @returns {number} Saldo estimado em R$
 */
export function estimarSaldoFGTS(salarioBruto, dataAdmissao, dataDemissao) {
  if (!salarioBruto || !dataAdmissao || !dataDemissao) return 0;

  const msTrabalhados = dataDemissao - dataAdmissao;
  const mesesTrabalhados = msTrabalhados / (1000 * 60 * 60 * 24 * DIAS_MES_MEDIO);

  return arredondar(salarioBruto * ALIQUOTA_DEPOSITO * mesesTrabalhados);
}

/**
 * Calcula a multa do FGTS conforme o tipo de rescisão.
 *
 * @param {number} saldoFGTS - Saldo total na conta vinculada (informado ou estimado)
 * @param {string} tipoRescisao - Código do tipo de rescisão
 * @returns {{ multa: number, percentual: number, liberaSaldo: boolean }}
 */
export function calcularMultaFGTS(saldoFGTS, tipoRescisao) {
  const resultado = { multa: 0, percentual: 0, liberaSaldo: false };

  if (!saldoFGTS || saldoFGTS <= 0) return resultado;

  switch (tipoRescisao) {
    case 'SEM_JUSTA_CAUSA':
      resultado.multa = arredondar(saldoFGTS * 0.40);
      resultado.percentual = 40;
      resultado.liberaSaldo = true;
      break;

    case 'ACORDO_MUTUO':
      resultado.multa = arredondar(saldoFGTS * 0.20);
      resultado.percentual = 20;
      resultado.liberaSaldo = true;
      break;

    case 'DETERMINADO':
      resultado.multa = 0;
      resultado.percentual = 0;
      resultado.liberaSaldo = true;
      break;

    case 'COM_JUSTA_CAUSA':
    case 'PEDIDO_DEMISSAO':
    default:
      resultado.multa = 0;
      resultado.percentual = 0;
      resultado.liberaSaldo = false;
      break;
  }

  return resultado;
}
