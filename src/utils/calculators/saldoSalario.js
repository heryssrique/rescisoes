/**
 * @module saldoSalario
 * @description Calcula o saldo de salário proporcional aos dias trabalhados
 * no mês de rescisão.
 *
 * Referência: CLT Art. 477.
 */

/**
 * Arredonda valor monetário para 2 casas decimais.
 * @param {number} valor
 * @returns {number}
 */
function arredondar(valor) {
  return Math.round(valor * 100) / 100;
}

/**
 * Retorna o número de dias do mês de uma determinada data.
 * @param {Date} data
 * @returns {number}
 */
function obterDiasNoMes(data) {
  return new Date(data.getFullYear(), data.getMonth() + 1, 0).getDate();
}

/**
 * Calcula o saldo de salário proporcional aos dias trabalhados no mês de rescisão.
 *
 * @param {number} salarioBruto - Salário mensal bruto (incluindo médias, se houver)
 * @param {Date} dataDemissao - Data de desligamento (dia inclusive)
 * @returns {{ diasTrabalhados: number, diasNoMes: number, valor: number }}
 */
export function calcularSaldoSalario(salarioBruto, dataDemissao) {
  if (!salarioBruto || salarioBruto <= 0 || !(dataDemissao instanceof Date)) {
    return { diasTrabalhados: 0, diasNoMes: 30, valor: 0 };
  }

  const diasTrabalhados = dataDemissao.getDate();
  const totalDiasNoMes = obterDiasNoMes(dataDemissao);
  const valor = arredondar((salarioBruto / totalDiasNoMes) * diasTrabalhados);

  return { diasTrabalhados, diasNoMes: totalDiasNoMes, valor };
}
