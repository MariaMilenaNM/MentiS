const URL_BASE = 'http://127.0.0.1:5000/pacientes';

export async function cadastrarPaciente(nome, data, email, telefone, cidade, estado, senha) {
    const response = await fetch(`${URL_BASE}/cadastrar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome, data, email, telefone, cidade, estado, senha })
    });

    if (response.status === 409) return 'duplicado';
    return response.ok ? 'ok' : 'erro';
}

export async function buscarPaciente(email, senha) {
    const response = await fetch(`${URL_BASE}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, senha })
    });

    if (!response.ok) return null;

    const { token } = await response.json();
    localStorage.setItem('token', token);

    // ler id no token
    const payload = JSON.parse(atob(token.split('.')[1]));

    // busca dados
    const dadosResp = await fetch(`${URL_BASE}/${payload.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });

    return dadosResp.ok ? await dadosResp.json() : null;
}