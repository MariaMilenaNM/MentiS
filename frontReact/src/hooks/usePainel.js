import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { buscarPacientePorId, atualizarPacienteBd } from '../services/crudPainel.js';
import { getProfissionais } from '../services/crudProfissional.js';
import { criarAgendamento, getHorariosDisponiveis } from '../services/crudAgendamento.js';
import { getToken, isTokenExpired, logout, getPacienteLogado } from '../services/crudPaciente.js';

export function usePainel() {
  const navigate = useNavigate();

  const [pacienteLogado, setPacienteLogado] = useState(null);
  const [todosProfissionais, setTodosProfissionais] = useState([]);

  // Estado para filtros
  const [filtros, setFiltros] = useState({
    especialidade: '',
    precoMax: '',
    modalidade: '',
  });

  const [sidebarAberta, setSidebarAberta] = useState(true);
  const [modoEdicao, setModoEdicao] = useState(false);

  const ITENS_POR_PAGINA = 6;
  const [paginaAtual, setPaginaAtual] = useState(1);

  const [editForm, setEditForm] = useState({ nome: '', telefone: '', cidade: '', estado: '' });
  const [editErro, setEditErro] = useState('');
  const [sucessoMsg, setSucessoMsg] = useState('');

  // Estado para agendamento
  const [agendandoProfissionalId, setAgendandoProfissionalId] = useState(null);
  const [horariosDisponiveis, setHorariosDisponiveis] = useState([]);
  const [agendamentoCarregando, setAgendamentoCarregando] = useState(false);
  const [agendamentoErro, setAgendamentoErro] = useState('');
  const [agendamentoSucesso, setAgendamentoSucesso] = useState('');

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

  const carregarProfissionais = useCallback(async () => {
    try {
      const profissionais = await getProfissionais(filtros);
      setTodosProfissionais(profissionais || []);
      setPaginaAtual(1); // Reset para primeira página ao filtrar
    } catch (error) {
      console.error('Erro ao carregar profissionais:', error);
    }
  }, [filtros]);

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

      await carregarProfissionais();
    } catch (error) {
      console.error('Erro ao carregar dados do painel:', error);
      logout();
      navigateRef.current('/paciente');
    }
  }, [carregarProfissionais]);

  // dependência com useCallback
  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  // Recarregar profissionais quando filtros mudarem
  useEffect(() => {
    if (pacienteLogado) {
      carregarProfissionais();
    }
  }, [carregarProfissionais, pacienteLogado]);

  // (YYYY-MM-DD ou DD/MM/YYYY)
  const formatarData = (data) => {
    if (!data) return '–';
    if (data.includes('/')) return data; // já formatada
    const partes = data.split('T')[0].split('-'); // aceita ISO vindo do Prisma
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
        estado: pacienteLogado.estado || '',
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

  // Agendamento - abrir modal para selecionar horário
  const abrirAgendamento = async (profissionalId) => {
    setAgendandoProfissionalId(profissionalId);
    setAgendamentoErro('');
    setAgendamentoSucesso('');
    setHorariosDisponiveis([]);
    setAgendamentoCarregando(true);

    try {
      const horarios = await getHorariosDisponiveis(profissionalId);
      setHorariosDisponiveis(horarios || []);
    } catch {
      setAgendamentoErro('Erro ao carregar horários disponíveis. Tente novamente.');
    } finally {
      setAgendamentoCarregando(false);
    }
  };

  const fecharAgendamento = () => {
    setAgendandoProfissionalId(null);
    setHorariosDisponiveis([]);
    setAgendamentoErro('');
    setAgendamentoSucesso('');
  };

  const confirmarAgendamento = async (dataHora, observacoes = '') => {
    if (!agendandoProfissionalId) return;

    setAgendamentoCarregando(true);
    setAgendamentoErro('');
    setAgendamentoSucesso('');

    try {
      await criarAgendamento({
        psicologoId: agendandoProfissionalId,
        dataHora: new Date(dataHora).toISOString(),
        duracaoMin: 50,
        observacoes,
      });
      setAgendamentoSucesso(
        'Agendamento realizado com sucesso! Aguarde a confirmação do profissional.'
      );
      // Fechar modal após 3 segundos
      setTimeout(() => {
        fecharAgendamento();
      }, 3000);
    } catch (error) {
      if (error.message.includes('Horário já agendado')) {
        setAgendamentoErro('Este horário já foi agendado. Escolha outro horário.');
      } else if (error.message.includes('Profissional não validado')) {
        setAgendamentoErro('Este profissional ainda não foi validado.');
      } else {
        setAgendamentoErro('Erro ao agendar. Tente novamente.');
      }
    } finally {
      setAgendamentoCarregando(false);
    }
  };

  const sair = () => {
    logout();
    navigate('/');
  };

  const indexInicio = (paginaAtual - 1) * ITENS_POR_PAGINA;
  const profissionaisPagina = todosProfissionais.slice(indexInicio, indexInicio + ITENS_POR_PAGINA);
  const totalPaginas = Math.ceil(todosProfissionais.length / ITENS_POR_PAGINA);

  const limparSucessoMsg = () => setSucessoMsg('');

  // Funções para manipular filtros
  const setFiltroEspecialidade = useCallback((especialidade) => {
    setFiltros(prev => ({ ...prev, especialidade }));
  }, []);

  const setFiltroPrecoMax = useCallback((precoMax) => {
    setFiltros(prev => ({ ...prev, precoMax }));
  }, []);

  const setFiltroModalidade = useCallback((modalidade) => {
    setFiltros(prev => ({ ...prev, modalidade }));
  }, []);

  const limparFiltros = useCallback(() => {
    setFiltros({ especialidade: '', precoMax: '', modalidade: '' });
  }, []);

  // Extrair especialidades únicas dos profissionais para o dropdown
  const especialidadesDisponiveis = useMemo(() => {
    const especialidades = new Set();
    todosProfissionais.forEach(p => {
      if (p.especialidades) {
        try {
          const espArray = JSON.parse(p.especialidades);
          if (Array.isArray(espArray)) {
            espArray.forEach(e => especialidades.add(e));
          }
        } catch (e) {
          // Se não for JSON válido, tratar como string simples
          especialidades.add(p.especialidades);
        }
      }
    });
    return Array.from(especialidades).sort();
  }, [todosProfissionais]);

  return {
    pacienteLogado,
    todosProfissionais,
    sidebarAberta,
    modoEdicao,
    paginaAtual,
    setPaginaAtual,
    editForm,
    setEditForm,
    editErro,
    sucessoMsg,
    limparSucessoMsg,
    formatarData,
    toggleSidebar,
    toggleEdicao,
    salvarEdicao,
    sair,
    profissionaisPagina,
    totalPaginas,
    // Filtros
    filtros,
    setFiltroEspecialidade,
    setFiltroPrecoMax,
    setFiltroModalidade,
    limparFiltros,
    especialidadesDisponiveis,
    // Agendamento
    agendandoProfissionalId,
    horariosDisponiveis,
    agendamentoCarregando,
    agendamentoErro,
    agendamentoSucesso,
    abrirAgendamento,
    fecharAgendamento,
    confirmarAgendamento,
  };
}
