const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000';
const URL_BASE = `${API_URL}/pacientes`;

export async function cadastrarPaciente(nome, data, email, telefone, cidade, estado, senha) {
    try {
        const response = await fetch(`${URL_BASE}/cadastrar`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nome, data, email, telefone, cidade, estado, senha })
        });

        const responseData = await response.json();

        if (response.status === 409) return { status: 'duplicado', erro: responseData.erro || 'E-mail já cadastrado' };
        if (!response.ok) return { status: 'erro', erro: responseData.erro || 'Erro ao cadastrar' };
        return { status: 'ok', data: responseData };
    } catch (error) {
        console.error('Erro ao cadastrar paciente:', error);
        return { status: 'erro', erro: 'Erro de conexão com o servidor' };
    }
}

export async function buscarPaciente(email, senha) {
    try {
        const response = await fetch(`${URL_BASE}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, senha })
        });

        const data = await response.json();

        if (!response.ok) {
            return { status: 'erro', erro: data.erro || 'Credenciais inválidas' };
        }

        const { token, paciente } = data;
        localStorage.setItem('token', token);
        localStorage.setItem('pacienteLogado', JSON.stringify(paciente));

        return { status: 'ok', paciente, token };
    } catch (error) {
        console.error('Erro ao fazer login:', error);
        return { status: 'erro', erro: 'Erro de conexão com o servidor' };
    }
}

export function getToken() {
    return localStorage.getItem('token');
}

export function getPacienteLogado() {
    const paciente = localStorage.getItem('pacienteLogado');
    return paciente ? JSON.parse(paciente) : null;
}

export function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('pacienteLogado');
}

export function isTokenExpired(token) {
    if (!token) return true;
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const now = Math.floor(Date.now() / 1000);
        return payload.exp < now;
    } catch {
        return true;
    }
}