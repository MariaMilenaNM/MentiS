const URL_PROF = 'http://127.0.0.1:5000/profissionais';

export async function getProfissionais() {
    try {
        const res = await fetch(URL_PROF);
        if (!res.ok) return [];
        return await res.json();
    } catch (error) {
        console.error('Erro ao buscar profissionais:', error);
        return [];
    }
}

export async function criarProfissional(dados) {
    try {
        await fetch(URL_PROF, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dados)
        });
    } catch (error) {
        console.error('Erro ao criar profissional:', error);
    }
}

export async function buscarProfissionalPorId(id) {
    try {
        const res = await fetch(`${URL_PROF}/${id}`);
        return res.ok ? await res.json() : null;
    } catch (error) {
        console.error('Erro ao buscar profissional:', error);
        return null;
    }
}

export async function atualizarProfissionalBd(id, dadosAtualizados) {
    try {
        await fetch(`${URL_PROF}/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dadosAtualizados)
        });
    } catch (error) {
        console.error('Erro ao atualizar profissional:', error);
    }
}

export async function deletarProfissionalBd(id) {
    try {
        await fetch(`${URL_PROF}/${id}`, { method: 'DELETE' });
    } catch (error) {
        console.error('Erro ao deletar profissional:', error);
    }
}
