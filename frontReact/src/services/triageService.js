const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000';
const URL_TRIAGE = `${API_URL}/triage`;

async function handleResponse(response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.erro || `Erro ${response.status}`);
  }
  return data;
}

/**
 * Busca profissionais compatíveis via RAG (POST /triage/search)
 * @param {string} query - Texto da busca do usuário
 * @param {number} k - Número máximo de resultados (default: 10)
 * @param {object} filters - Filtros opcionais (ex: modalidade, abordagem)
 * @param {string} token - JWT token opcional (para usuários logados obterem contatos completos)
 * @returns {Promise<{matches: Array, total: number, query: string, isLoggedIn: boolean}>}
 */
export async function searchTriage(query, k = 10, filters = {}, token = null) {
  try {
    const headers = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`${URL_TRIAGE}/search`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ query, k, filters }),
    });
    return await handleResponse(res);
  } catch (error) {
    console.error('Erro na busca de triagem:', error);
    throw error;
  }
}

/**
 * Health check do serviço de triagem
 */
export async function healthCheckTriage() {
  try {
    const res = await fetch(`${URL_TRIAGE}/health`);
    return await handleResponse(res);
  } catch (error) {
    console.error('Erro no health check de triagem:', error);
    return { status: 'unhealthy', error: error.message };
  }
}

export default {
  searchTriage,
  healthCheckTriage,
};
