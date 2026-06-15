/**
 * @module decimoTerceiro
 * @description Calcula o 13º salário proporcional na rescisão.
 *
 * Regra: avos = meses trabalhados no ano da rescisão.
 * Fração de mês >= 15 dias conta como 1 avo.
 *
 * Referência: Lei 4.090/1962, art. 1°.
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
 * Calcula os avos de 13º trabalhados no ano civil da rescisão.
 * Contagem começa em janeiro (ou data de admissão, se no mesmo ano).
 * @param {Date} dataAdmissao
 * @param {Date} dataDemissao
 * @returns {number} Avos (0 a 12)
 */
function calcularAvos13(dataAdmissao, dataDemissao) {
  // Ponto de partida: 1° de janeiro do ano de demissão, ou data de admissão se posterior
  const inicioAno = new Date(dataDemissao.getFullYear(), 0, 1);
  const inicio = dataAdmissao > inicioAno ? dataAdmissao : inicioAno;

  let avos = 0;

  // Itera de mês em mês até o mês de demissão
  let mesAtual = new Date(inicio.getFullYear(), inicio.getMonth(), 1);

  while (mesAtual.getFullYear() < dataDemissao.getFullYear() ||
    (mesAtual.getFullYear() === dataDemissao.getFullYear() &&
      mesAtual.getMonth() <= dataDemissao.getMonth())) {

    const ehMesDaDemissao =
      mesAtual.getMonth() === dataDemissao.getMonth() &&
      mesAtual.getFullYear() === dataDemissao.getFullYear();

    const ehMesDeAdmissao =
      mesAtual.getMonth() === inicio.getMonth() &&
      mesAtual.getFullYear() === inicio.getFullYear();

    if (ehMesDaDemissao || ehMesDeAdmissao) {
      // Calcula dias efetivamente trabalhados no mês parcial
      const diaInicio = ehMesDeAdmissao && !ehMesDaDemissao ? inicio.getDate() : 1;
      const diaFim = ehMesDaDemissao ? dataDemissao.getDate() : new Date(
        mesAtual.getFullYear(), mesAtual.getMonth() + 1, 0
      ).getDate();

      const diasTrabalhados = diaFim - diaInicio + 1;
      if (diasTrabalhados >= 15) avos++;
    } else {
      // Mês completo
      avos++;
    }

    // Avança para o próximo mês
    mesAtual.setMonth(mesAtual.getMonth() + 1);
    if (avos >= 12) break;
  }

  return Math.min(avos, 12);
}

/**
 * Calcula o 13º salário proporcional ao número de avos trabalhados.
 *
 * @param {number} salarioBruto - Salário mensal bruto (incluindo médias)
 * @param {Date} dataAdmissao
 * @param {Date} dataDemissao
 * @returns {{ avos: number, valor: number }}
 */
export function calcularDecimoTerceiro(salarioBruto, dataAdmissao, dataDemissao) {
  if (!salarioBruto || salarioBruto <= 0 || !dataAdmissao || !dataDemissao) {
    return { avos: 0, valor: 0 };
  }

  const avos = calcularAvos13(dataAdmissao, dataDemissao);
  const valor = arredondar((salarioBruto / 12) * avos);

  return { avos, valor };
}
