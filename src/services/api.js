/**
 * API Service — camada de comunicação com o backend Express/MongoDB.
 * Em desenvolvimento o Vite redireciona /api → http://localhost:3001/api via proxy.
 * Em produção, defina VITE_API_URL=https://seu-servidor.com/api
 */

const BASE_URL = import.meta.env.VITE_API_URL || '/api';


async function request(method, endpoint, body) {
  const options = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (body !== undefined) {
    options.body = JSON.stringify(body);
  }

  const res = await fetch(`${BASE_URL}${endpoint}`, options);

  if (!res.ok) {
    let message = `HTTP ${res.status}`;
    try {
      const err = await res.json();
      message = err.error || err.detail || message;
    } catch {}
    throw new Error(message);
  }

  return res.json();
}

// ─── Desligamentos ─────────────────────────────────────────────────────────

/** Lista todos os desligamentos (com filtros opcionais). */
export function getDesligamentos(params = {}) {
  const qs = new URLSearchParams(
    Object.fromEntries(Object.entries(params).filter(([, v]) => v && v !== 'todos'))
  ).toString();
  return request('GET', `/desligamentos${qs ? `?${qs}` : ''}`);
}

/** Busca um único desligamento pelo id do MongoDB. */
export function getDesligamento(id) {
  return request('GET', `/desligamentos/${id}`);
}

/** Cria um novo desligamento. Retorna o documento criado com `id`. */
export function createDesligamento(data) {
  return request('POST', '/desligamentos', data);
}

/** Substitui todos os campos de um desligamento (update completo). */
export function updateDesligamento(id, data) {
  return request('PUT', `/desligamentos/${id}`, data);
}

/**
 * Faz toggle de um item do checklist sem enviar o documento inteiro.
 * Retorna o documento atualizado.
 */
export function toggleChecklistItem(desligamentoId, itemId) {
  return request('PATCH', `/desligamentos/${desligamentoId}/checklist/${itemId}`);
}

/**
 * Adiciona uma entrada ao histórico sem substituir o array.
 * @param {string} desligamentoId
 * @param {{ data: string, acao: string, nota?: string }} entry
 */
export function addHistorico(desligamentoId, entry) {
  return request('PATCH', `/desligamentos/${desligamentoId}/historico`, entry);
}

/** Exclui permanentemente um desligamento. */
export function deleteDesligamento(id) {
  return request('DELETE', `/desligamentos/${id}`);
}

/** Verifica se a API está acessível. */
export function healthCheck() {
  return request('GET', '/health');
}

/** Popula o banco com dados de exemplo (apenas dev). */
export function seedDatabase() {
  return request('POST', '/desligamentos/seed');
}
