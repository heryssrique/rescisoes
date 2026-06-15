/**
 * @module avisoPrevio
 * @description Calcula o aviso prévio conforme Lei 12.506/2011.
 *
 * Regra: 30 dias base + 3 dias por ano completo de serviço.
 * Limite máximo: 90 dias.
 *
 * Referência: CLT Art. 487 + Lei 12.506/2011.
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
 * Calcula o número de anos completos de serviço entre duas datas.
 * @param {Date} dataAdmissao
 * @param {Date} dataReferencia
 * @returns {number}
 */
function calcularAnosCompletos(dataAdmissao, dataReferencia) {
  let anos = dataReferencia.getFullYear() - dataAdmissao.getFullYear();

  const naoCompletouAniversario =
    dataReferencia.getMonth() < dataAdmissao.getMonth() ||
    (dataReferencia.getMonth() === dataAdmissao.getMonth() &&
      dataReferencia.getDate() < dataAdmissao.getDate());

  if (naoCompletouAniversario) anos--;

  return Math.max(0, anos);
}

/**
 * Calcula o aviso prévio proporcional (Lei 12.506/2011).
 *
 * @param {number} salarioBruto - Salário mensal bruto
 * @param {Date} dataAdmissao
 * @param {Date} dataDemissao
 * @param {'indenizado'|'trabalhado'} [modalidade='indenizado']
 * @param {number} [diasDesconto=0] - Quantos dias já foram pagos (0, 23, 30)
 * @returns {{ diasAviso: number, anosServico: number, valor: number, modalidade: string, diasPagos: number }}
 */
export function calcularAvisoPrevio(
  salarioBruto,
  dataAdmissao,
  dataDemissao,
  modalidade = 'indenizado',
  diasDesconto = 0
) {
  if (!salarioBruto || salarioBruto <= 0) {
    return { diasAviso: 0, anosServico: 0, valor: 0, modalidade };
  }

  const anosServico = calcularAnosCompletos(dataAdmissao, dataDemissao);
  const diasAviso = Math.min(30 + anosServico * 3, 90);

  let diasPagos = diasAviso;
  if (modalidade === 'trabalhado' && diasDesconto > 0) {
    diasPagos = Math.max(0, diasAviso - diasDesconto);
  }

  const valor = arredondar((salarioBruto / 30) * diasPagos);

  return { diasAviso, anosServico, valor, modalidade, diasPagos };
}
