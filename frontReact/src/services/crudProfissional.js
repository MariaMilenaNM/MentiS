const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000';
const URL_PROF = `${API_URL}/profissionais`;

// Converter modalidade do formato legado para enum do backend
const modalidadeLegacyToEnum = {
  'Remota': 'ONLINE',
  'Presencial': 'PRESENCIAL',
  'Presencial e Remota': 'HIBRIDO',
  'Online': 'ONLINE',
  'Híbrido': 'HIBRIDO',
  'Presencial e Online': 'HIBRIDO',
};

async function handleResponse(response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.erro || `Erro ${response.status}`);
  }
  return data;
}

export async function getProfissionais(filters = {}) {
  try {
    const params = new URLSearchParams();

    if (filters.validado !== undefined) params.append('validado', filters.validado);
    if (filters.modalidade) {
      const modalidadeEnum = modalidadeLegacyToEnum[filters.modalidade] || filters.modalidade;
      params.append('modalidade', modalidadeEnum);
    }
    if (filters.abordagem) params.append('abordagem', filters.abordagem);
    if (filters.precoMax) params.append('precoMax', filters.precoMax);
    if (filters.especialidade) params.append('especialidade', filters.especialidade);

    const url = params.toString() ? `${URL_PROF}?${params.toString()}` : URL_PROF;
    const res = await fetch(url);
    return await handleResponse(res);
  } catch (error) {
    console.error('Erro ao buscar profissionais:', error);
    return [];
  }
}

export async function criarProfissional(dados) {
  try {
    const res = await fetch(URL_PROF, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dados),
    });
    return await handleResponse(res);
  } catch (error) {
    console.error('Erro ao criar profissional:', error);
    throw error;
  }
}

export async function buscarProfissionalPorId(id) {
  try {
    const res = await fetch(`${URL_PROF}/${id}`);
    return await handleResponse(res);
  } catch (error) {
    console.error('Erro ao buscar profissional:', error);
    return null;
  }
}

export async function atualizarProfissionalBd(id, dadosAtualizados) {
  try {
    const res = await fetch(`${URL_PROF}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dadosAtualizados),
    });
    return await handleResponse(res);
  } catch (error) {
    console.error('Erro ao atualizar profissional:', error);
    throw error;
  }
}

export async function deletarProfissionalBd(id) {
  try {
    const res = await fetch(`${URL_PROF}/${id}`, { method: 'DELETE' });
    return await handleResponse(res);
  } catch (error) {
    console.error('Erro ao deletar profissional:', error);
    throw error;
  }
}
