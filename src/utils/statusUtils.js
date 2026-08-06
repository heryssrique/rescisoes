/**
 * Checks if a process is only missing its payment receipt (comprovante).
 * A process falls into this category if:
 * 1. It is not archived/cancelled (status is not 'concluido' or 'cancelado').
 * 2. Payment has been made (either checklist 'p1' is marked done/notApplicable, or status is 'pago' or 'pendente_comprovante').
 * 3. The receipt has NOT been processed (checklist 'p2' is not done and not applicable).
 */
export const isOnlyMissingComprovante = (d) => {
  if (!d || d.status === 'concluido' || d.status === 'cancelado') return false;
  const checklist = d.checklist || [];
  const p1 = checklist.find(c => c.id === 'p1');
  const p2 = checklist.find(c => c.id === 'p2');
  const paid = (p1 && (p1.done || p1.notApplicable)) || d.status === 'pago' || d.status === 'pendente_comprovante';
  const noReceipt = !p2 || (!p2.done && !p2.notApplicable);
  return paid && noReceipt;
};
