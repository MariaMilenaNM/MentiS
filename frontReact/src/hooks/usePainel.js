import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { buscarPacientePorId, atualizarPacienteBd } from '../services/crudPainel.js';
import { getProfissionais } from '../services/crudProfissional.js';

export function usePainel() {
    const navigate = useNavigate();

    const [pacienteLogado, setPacienteLogado] = useState(null);
    const [todosPsicologos, setTodosPsicologos] = useState([]);
    
    const [sidebarAberta, setSidebarAberta] = useState(true);
    const [modoEdicao, setModoEdicao] = useState(false);
    
    const ITENS_POR_PAGINA = 6;
    const [paginaAtual, setPaginaAtual] = useState(1);

    const [editForm, setEditForm] = useState({ nome: '', telefone: '', cidade: '', estado: '' });

    // useCallback para estabilizar a função e evitar re-renders infinitos
    const carregarDados = useCallback(async () => {
        const storage = JSON.parse(localStorage.getItem('pacienteLogado'));
        if (!storage) {
            navigate('/paciente');
            return;
        }
        const pacienteAtt = await buscarPacientePorId(storage.id);
        setPacienteLogado(pacienteAtt);

        const psicologos = await getProfissionais();
        setTodosPsicologos(psicologos || []);
    }, [navigate]);

    // dependência com useCallback
    useEffect(() => {
        carregarDados();
    }, [carregarDados]);

    // (YYYY-MM-DD ou DD/MM/YYYY)
    const formatarData = (data) => {
        if (!data) return '–';
        if (data.includes('/')) return data; // já formatada
        const partes = data.split('-');
        if (partes.length !== 3) return data;
        return `${partes[2]}/${partes[1]}/${partes[0]}`;
    };

    const toggleSidebar = () => setSidebarAberta(!sidebarAberta);

    const toggleEdicao = () => {
        if (!modoEdicao && pacienteLogado) {
            setEditForm({
                nome: pacienteLogado.nome || '',
                telefone: pacienteLogado.telefone || '',
                cidade: pacienteLogado.cidade || '',
                estado: pacienteLogado.estado || ''
            });
        }
        setModoEdicao(!modoEdicao);
    };

    const salvarEdicao = async () => {
        if (!editForm.nome || !editForm.telefone || !editForm.cidade || !editForm.estado) {
            alert('Preencha todos os campos para salvar.');
            return;
        }

        const ok = await atualizarPacienteBd(pacienteLogado.id, editForm);
        if (!ok) {
            alert('Erro ao salvar. Tente novamente.');
            return;
        }

        const pacienteAtualizado = await buscarPacientePorId(pacienteLogado.id);
        setPacienteLogado(pacienteAtualizado);
        setModoEdicao(false);
        alert('Perfil atualizado!');
    };

    const sair = () => {
        localStorage.removeItem('pacienteLogado');
        navigate('/');
    };

    const indexInicio = (paginaAtual - 1) * ITENS_POR_PAGINA;
    const psicologosPagina = todosPsicologos.slice(indexInicio, indexInicio + ITENS_POR_PAGINA);
    const totalPaginas = Math.ceil(todosPsicologos.length / ITENS_POR_PAGINA);

    return {
        pacienteLogado,
        todosPsicologos,
        sidebarAberta,
        modoEdicao,
        paginaAtual, setPaginaAtual,
        editForm, setEditForm,
        formatarData,
        toggleSidebar,
        toggleEdicao,
        salvarEdicao,
        sair,
        psicologosPagina,
        totalPaginas
    };
}
