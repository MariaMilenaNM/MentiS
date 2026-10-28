const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000';
const URL_PAINEL = `${API_URL}/pacientes`;

function getToken() {
    return localStorage.getItem('token');
}

async function authenticatedFetch(url, options = {}) {
    const token = getToken();
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };
    // Só adiciona Authorization header se token existir
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    const response = await fetch(url, {
        ...options,
        headers
    });
    return response;
}

export async function buscarPacientePorId(id) {
    try {
        const res = await authenticatedFetch(`${URL_PAINEL}/${id}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.erro || 'Erro ao buscar paciente');
        return data;
    } catch (error) {
        console.error('Erro ao buscar paciente:', error);
        return null;
    }
}

export async function atualizarPacienteBd(id, dados) {
    try {
        const res = await authenticatedFetch(`${URL_PAINEL}/${id}`, {
            method: 'PUT',
            body: JSON.stringify(dados)
        });
        const data = await res.json();
        if (!res.ok) {
            const msg = data.erro || `Erro ao atualizar (${res.status})`;
            throw new Error(msg);
        }
        return data;
    } catch (error) {
        console.error('Erro ao atualizar paciente:', error);
        throw error;
    }
}