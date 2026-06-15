/**
 * @module ferias
 * @description Calcula férias vencidas e proporcionais com 1/3 constitucional.
 *
 * - Férias Vencidas: períodos aquisitivos completos (12 meses) não usufruídos.
 * - Férias Proporcionais: avos do período aquisitivo em curso.
 * - 1/3 constitucional incide sobre ambas.
 * - Isentas de INSS e IRRF quando pagas na rescisão (art. 28, §9°, d, Lei 8.212/91
 *   e art. 6°, V, Lei 7.713/88).
 *
 * Referência: CLT Arts. 129-145, CF Art. 7°, XVII.
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
 * Calcula a diferença em meses completos entre duas datas.
 * @param {Date} inicio
 * @param {Date} fim
 * @returns {number}
 */
function mesesCompletos(inicio, fim) {
  const anos = fim.getFullYear() - inicio.getFullYear();
  const meses = fim.getMonth() - inicio.getMonth();
  const totalMeses = anos * 12 + meses;

  // Só conta o mês se o dia fim >= dia início
  return fim.getDate() >= inicio.getDate() ? totalMeses : totalMeses - 1;
}

/**
 * Calcula os avos de férias do período aquisitivo a partir do início do período.
 * Regra: >= 15 dias no mês conta como 1 avo.
 * @param {Date} inicioPeriodo - Primeiro dia do período aquisitivo atual
 * @param {Date} dataDemissao
 * @returns {number} Avos de férias (0 a 12)
 */
function calcularAvosFerias(inicioPeriodo, dataDemissao) {
  const mesesComp = mesesCompletos(inicioPeriodo, dataDemissao);

  // Dias restantes após os meses completos
  const dataAposMeses = new Date(inicioPeriodo);
  dataAposMeses.setMonth(dataAposMeses.getMonth() + mesesComp);

  // Calcula dias restantes com precisão (sem ser afetado por horário de verão)
  const msRestantes = dataDemissao.getTime() - dataAposMeses.getTime();
  const diasRestantes = Math.round(msRestantes / (1000 * 60 * 60 * 24));
  const bonus = diasRestantes >= 15 ? 1 : 0;

  return Math.min(mesesComp + bonus, 12);
}

/**
 * Calcula o valor de férias (base + 1/3) a partir do número de avos.
 * @param {number} salarioBruto
 * @param {number} avos - 1 a 12
 * @returns {{ diasFerias: number, valorBase: number, umTerco: number, total: number }}
 */
function calcularValorFerias(salarioBruto, avos) {
  const diasFerias = Math.round((avos / 12) * 30);
  const valorBase = arredondar((salarioBruto / 30) * diasFerias);
  const umTerco = arredondar(valorBase / 3);
  const total = arredondar(valorBase + umTerco);
  return { diasFerias, valorBase, umTerco, total };
}

/**
 * Calcula as férias vencidas (períodos aquisitivos completos não gozados).
 *
 * @param {number} salarioBruto
 * @param {number} [periodosVencidos=0] - Quantidade de períodos aquisitivos não gozados
 * @param {number} [diasJaGozados=0] - Dias de férias já gozados no período mais antigo
 * @returns {{ total: number, detalhes: Object|null }}
 */
export function calcularFeriasVencidas(salarioBruto, periodosVencidos = 0, diasJaGozados = 0) {
  if (!salarioBruto || salarioBruto <= 0 || periodosVencidos <= 0) {
    return { total: 0, detalhes: null };
  }

  // Dias restantes no período mais antigo (pode ter gozado parcialmente)
  const diasRestantesUltimoPeriodo = 30 - Math.max(0, diasJaGozados);
  const diasTotais = (periodosVencidos - 1) * 30 + diasRestantesUltimoPeriodo;

  const valorBase = arredondar((salarioBruto / 30) * diasTotais);
  const umTerco = arredondar(valorBase / 3);
  const total = arredondar(valorBase + umTerco);

  return {
    total,
    detalhes: { periodos: periodosVencidos, diasTotais, valorBase, umTerco },
  };
}

/**
 * Calcula as férias proporcionais do período aquisitivo em andamento.
 *
 * @param {number} salarioBruto
 * @param {Date} dataAdmissao
 * @param {Date} dataDemissao
 * @returns {{ avos: number, total: number, detalhes: Object|null }}
 */
export function calcularFeriasProporcionais(salarioBruto, dataAdmissao, dataDemissao) {
  if (!salarioBruto || salarioBruto <= 0 || !dataAdmissao || !dataDemissao) {
    return { avos: 0, total: 0, detalhes: null };
  }

  // Determina o início do período aquisitivo atual
  const mesesTotais = mesesCompletos(dataAdmissao, dataDemissao);
  const periodosCompletos = Math.floor(mesesTotais / 12);

  const inicioPeriodoAtual = new Date(dataAdmissao);
  inicioPeriodoAtual.setFullYear(inicioPeriodoAtual.getFullYear() + periodosCompletos);

  const avos = calcularAvosFerias(inicioPeriodoAtual, dataDemissao);

  if (avos <= 0) return { avos: 0, total: 0, detalhes: null };

  const { diasFerias, valorBase, umTerco, total } = calcularValorFerias(salarioBruto, avos);

  return {
    avos,
    total,
    detalhes: { diasFerias, valorBase, umTerco, inicioPeriodo: inicioPeriodoAtual },
  };
}
