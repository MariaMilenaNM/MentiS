const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000';
const URL_HORARIOS = `${API_URL}/horarios`;

function getToken() {
  return localStorage.getItem('token');
}

async function authenticatedFetch(url, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  const response = await fetch(url, {
    ...options,
    headers,
  });
  return response;
}

export async function getHorariosPorProfissional(psicologoId) {
  try {
    const res = await authenticatedFetch(`${URL_HORARIOS}/psicologo/${psicologoId}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.erro || 'Erro ao buscar horários');
    return data;
  } catch (error) {
    console.error('Erro ao buscar horários:', error);
    throw error;
  }
}

export async function criarHorario(dados) {
  try {
    const res = await authenticatedFetch(URL_HORARIOS, {
      method: 'POST',
      body: JSON.stringify(dados),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.erro || 'Erro ao criar horário');
    return data;
  } catch (error) {
    console.error('Erro ao criar horário:', error);
    throw error;
  }
}

export async function atualizarHorario(id, dados) {
  try {
    const res = await authenticatedFetch(`${URL_HORARIOS}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(dados),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.erro || 'Erro ao atualizar horário');
    return data;
  } catch (error) {
    console.error('Erro ao atualizar horário:', error);
    throw error;
  }
}

export async function deletarHorario(id) {
  try {
    const res = await authenticatedFetch(`${URL_HORARIOS}/${id}`, {
      method: 'DELETE',
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.erro || 'Erro ao deletar horário');
    return data;
  } catch (error) {
    console.error('Erro ao deletar horário:', error);
    throw error;
  }
}
