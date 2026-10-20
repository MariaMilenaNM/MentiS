const URL_PAINEL = 'http://127.0.0.1:5000/pacientes';

function getToken() {
    return localStorage.getItem('token');
}

export async function buscarPacientePorId(id) {
    const res = await fetch(`${URL_PAINEL}/${id}`, {
        headers: { 'Authorization': `Bearer ${getToken()}` }
    });
    return res.ok ? await res.json() : null;
}

export async function atualizarPacienteBd(id, dados) {
    const res = await fetch(`${URL_PAINEL}/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${getToken()}`
        },
        body: JSON.stringify(dados)
    });
    return res.ok;
}