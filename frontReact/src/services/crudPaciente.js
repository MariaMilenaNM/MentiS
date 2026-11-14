const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000';
const URL_BASE = `${API_URL}/pacientes`;
const AUTH_URL = `${API_URL}/auth`;

export async function cadastrarPaciente({ nome, email, senha, aceiteLGPD }) {
  try {
    const response = await fetch(`${URL_BASE}/cadastrar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome, email, senha, aceiteLGPD }),
    });

    const responseData = await response.json();

    if (response.status === 409)
      return { status: 'duplicado', erro: responseData.erro || 'E-mail já cadastrado' };
    if (!response.ok) {
      return {
        status: 'erro',
        erro: responseData.detalhes?.[0]?.mensagem || responseData.erro || 'Erro ao cadastrar',
      };
    }
    return { status: 'ok', data: responseData };
  } catch (error) {
    console.error('Erro ao cadastrar paciente:', error);
    return { status: 'erro', erro: 'Erro de conexão com o servidor' };
  }
}

export async function buscarPaciente(email, senha) {
  try {
    const response = await fetch(`${AUTH_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, senha }),
    });

    const data = await response.json();

    if (!response.ok) {
      return { status: 'erro', erro: data.erro || 'Credenciais inválidas' };
    }

    const { token, usuario, perfil } = data;
    localStorage.setItem('token', token);
    localStorage.setItem('usuarioLogado', JSON.stringify(usuario));
    localStorage.setItem('perfilLogado', JSON.stringify(perfil));

    return { status: 'ok', usuario, perfil, token };
  } catch (error) {
    console.error('Erro ao fazer login:', error);
    return { status: 'erro', erro: 'Erro de conexão com o servidor' };
  }
}

export function getUsuarioLogado() {
  const usuario = localStorage.getItem('usuarioLogado');
  return usuario ? JSON.parse(usuario) : null;
}

export function getPerfilLogado() {
  const perfil = localStorage.getItem('perfilLogado');
  return perfil ? JSON.parse(perfil) : null;
}

export function getToken() {
  return localStorage.getItem('token');
}

export function getPacienteLogado() {
  // Novo formato: perfilLogado (compatível com uso anterior)
  const perfil = localStorage.getItem('perfilLogado');
  if (perfil) return JSON.parse(perfil);
  // Fallback para formato antigo
  const paciente = localStorage.getItem('pacienteLogado');
  return paciente ? JSON.parse(paciente) : null;
}

export function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('usuarioLogado');
  localStorage.removeItem('perfilLogado');
  // Limpar formato antigo também
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
