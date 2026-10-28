import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { buscarPacientePorId, atualizarPacienteBd } from '../services/crudPainel.js';
import { getProfissionais } from '../services/crudProfissional.js';
import { getToken, isTokenExpired, logout, getPacienteLogado } from '../services/crudPaciente.js';

export function usePainel() {
    const navigate = useNavigate();

    const [pacienteLogado, setPacienteLogado] = useState(null);
    const [todosPsicologos, setTodosPsicologos] = useState([]);

    const [sidebarAberta, setSidebarAberta] = useState(true);
    const [modoEdicao, setModoEdicao] = useState(false);

    const ITENS_POR_PAGINA = 6;
    const [paginaAtual, setPaginaAtual] = useState(1);

    const [editForm, setEditForm] = useState({ nome: '', telefone: '', cidade: '', estado: '' });
    const [editErro, setEditErro] = useState('');
    const [sucessoMsg, setSucessoMsg] = useState('');

    // Verificar token no carregamento E quando a janela ganha foco/aba volta ativa
    useEffect(() => {
        const verificarToken = () => {
            const token = getToken();
            if (token && isTokenExpired(token)) {
                logout();
                navigate('/paciente');
            }
        };

        verificarToken();

        // Revalidar quando usuário volta para a aba/janela
        const handleVisibilityChange = () => {
            if (!document.hidden) {
                verificarToken();
            }
        };

        const handleFocus = () => {
            verificarToken();
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('focus', handleFocus);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('focus', handleFocus);
        };
    }, [navigate]);

    // useCallback para estabilizar a função e evitar re-renders infinitos
    // useRef para capturar navigate estável sem adicionar como dependência
    const navigateRef = useRef(navigate);
    // Atualiza ref via useEffect para não violar regras de render
    useEffect(() => {
        navigateRef.current = navigate;
    }, [navigate]);

    const carregarDados = useCallback(async () => {
        const storage = getPacienteLogado();
        if (!storage) {
            navigateRef.current('/paciente');
            return;
        }

        try {
            const pacienteAtt = await buscarPacientePorId(storage.id);
            if (pacienteAtt) {
                setPacienteLogado(pacienteAtt);
            } else {
                logout();
                navigateRef.current('/paciente');
                return;
            }

            const psicologos = await getProfissionais();
            setTodosPsicologos(psicologos || []);
        } catch (error) {
            console.error('Erro ao carregar dados do painel:', error);
            logout();
            navigateRef.current('/paciente');
        }
    }, []); // navigate removido das deps - usa ref estável

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

    const validarTelefone = (telefone) => {
        const re = /^\(?\d{2}\)?\s?\d{4,5}-?\d{4}$/;
        return re.test(telefone.replace(/\s/g, ''));
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
            setEditErro('');
            setSucessoMsg('');
        } else {
            setSucessoMsg('');
        }
        setModoEdicao(!modoEdicao);
    };

    const salvarEdicao = async () => {
        setEditErro('');

        if (!editForm.nome || !editForm.telefone || !editForm.cidade || !editForm.estado) {
            setEditErro('Preencha todos os campos para salvar.');
            return;
        }

        if (editForm.nome.length < 2) {
            setEditErro('Nome deve ter pelo menos 2 caracteres.');
            return;
        }

        if (!validarTelefone(editForm.telefone)) {
            setEditErro('Telefone inválido. Use formato (XX) XXXXX-XXXX.');
            return;
        }

        if (editForm.estado.length !== 2) {
            setEditErro('Estado deve ter 2 letras (ex: SP).');
            return;
        }

        try {
            const resultado = await atualizarPacienteBd(pacienteLogado.id, editForm);
            if (!resultado) {
                setEditErro('Erro ao salvar. Tente novamente.');
                return;
            }

            const pacienteAtualizado = await buscarPacientePorId(pacienteLogado.id);
            if (pacienteAtualizado) {
                setPacienteLogado(pacienteAtualizado);
            }
            setModoEdicao(false);
            setSucessoMsg('Perfil atualizado com sucesso!');
        } catch {
            setEditErro('Erro ao salvar. Tente novamente.');
        }
    };

    const sair = () => {
        logout();
        navigate('/');
    };

    const indexInicio = (paginaAtual - 1) * ITENS_POR_PAGINA;
    const psicologosPagina = todosPsicologos.slice(indexInicio, indexInicio + ITENS_POR_PAGINA);
    const totalPaginas = Math.ceil(todosPsicologos.length / ITENS_POR_PAGINA);

    const limparSucessoMsg = () => setSucessoMsg('');

    return {
        pacienteLogado,
        todosPsicologos,
        sidebarAberta,
        modoEdicao,
        paginaAtual, setPaginaAtual,
        editForm, setEditForm,
        editErro,
        sucessoMsg,
        limparSucessoMsg,
        formatarData,
        toggleSidebar,
        toggleEdicao,
        salvarEdicao,
        sair,
        psicologosPagina,
        totalPaginas
    };
}