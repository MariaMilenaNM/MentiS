const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000';
const URL_AGENDAMENTOS = `${API_URL}/agendamentos`;

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

export async function criarAgendamento(dados) {
  try {
    const res = await authenticatedFetch(URL_AGENDAMENTOS, {
      method: 'POST',
      body: JSON.stringify(dados),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.erro || 'Erro ao criar agendamento');
    return data;
  } catch (error) {
    console.error('Erro ao criar agendamento:', error);
    throw error;
  }
}

export async function getAgendamentosPaciente() {
  try {
    const res = await authenticatedFetch(URL_AGENDAMENTOS);
    const data = await res.json();
    if (!res.ok) throw new Error(data.erro || 'Erro ao buscar agendamentos');
    return data;
  } catch (error) {
    console.error('Erro ao buscar agendamentos:', error);
    throw error;
  }
}

export async function atualizarStatusAgendamento(id, status) {
  try {
    const res = await authenticatedFetch(`${URL_AGENDAMENTOS}/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.erro || 'Erro ao atualizar status');
    return data;
  } catch (error) {
    console.error('Erro ao atualizar status:', error);
    throw error;
  }
}

export async function cancelarAgendamento(id) {
  // Paciente cancela como CANCELADO_PACIENTE
  return atualizarStatusAgendamento(id, 'CANCELADO_PACIENTE');
}