import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getHorariosPorProfissional,
  criarHorario,
  atualizarHorario,
  deletarHorario,
} from '../services/crudHorario.js';
import { getPerfilLogado } from '../services/crudPaciente.js';

const DIAS_SEMANA = [
  { valor: 0, label: 'Domingo', curto: 'Dom' },
  { valor: 1, label: 'Segunda-feira', curto: 'Seg' },
  { valor: 2, label: 'Terça-feira', curto: 'Ter' },
  { valor: 3, label: 'Quarta-feira', curto: 'Qua' },
  { valor: 4, label: 'Quinta-feira', curto: 'Qui' },
  { valor: 5, label: 'Sexta-feira', curto: 'Sex' },
  { valor: 6, label: 'Sábado', curto: 'Sáb' },
];

export function useHorarios() {
  const navigate = useNavigate();
  const [horarios, setHorarios] = useState([]);
  const [carregando, setCarregando] = useState(false);
  const [form, setForm] = useState({
    diaSemana: '',
    horaInicio: '',
    horaFim: '',
  });
  const [formErros, setFormErros] = useState({});
  const [editForm, setEditForm] = useState(null);
  const [editErros, setEditErros] = useState({});
  const [psicologoId, setPsicologoId] = useState(null);

  // Buscar ID do psicólogo logado
  const carregarPsicologoId = useCallback(async () => {
    const perfil = getPerfilLogado();
    if (perfil && perfil.id) {
      setPsicologoId(perfil.id);
      return perfil.id;
    }
    return null;
  }, []);

  // Carregar horários do profissional
  const carregarHorarios = useCallback(async () => {
    const id = await carregarPsicologoId();
    if (!id) return;

    setCarregando(true);
    try {
      const dados = await getHorariosPorProfissional(id);
      setHorarios(dados || []);
    } catch (error) {
      console.error('Erro ao carregar horários:', error);
    } finally {
      setCarregando(false);
    }
  }, [carregarPsicologoId]);

  useEffect(() => {
    carregarHorarios();
  }, [carregarHorarios]);

  // Validações
  const validarHora = (hora) => {
    const re = /^([01]\d|2[0-3]):([0-5]\d)$/;
    return re.test(hora);
  };

  const validarFormulario = (dados) => {
    const erros = {};

    if (dados.diaSemana === '' || dados.diaSemana === undefined) {
      erros.diaSemana = 'Selecione um dia da semana';
    }

    if (!dados.horaInicio || !validarHora(dados.horaInicio)) {
      erros.horaInicio = 'Hora de início inválida (formato HH:mm)';
    }

    if (!dados.horaFim || !validarHora(dados.horaFim)) {
      erros.horaFim = 'Hora de fim inválida (formato HH:mm)';
    }

    if (dados.horaInicio && dados.horaFim && dados.horaInicio >= dados.horaFim) {
      erros.horaFim = 'Hora de fim deve ser posterior à hora de início';
    }

    return erros;
  };

  // Criar horário
  const handleCreate = async () => {
    const erros = validarFormulario(form);
    if (Object.keys(erros).length > 0) {
      setFormErros(erros);
      return;
    }

    setFormErros({});
    setCarregando(true);

    try {
      await criarHorario({
        psicologoId,
        diaSemana: parseInt(form.diaSemana),
        horaInicio: form.horaInicio,
        horaFim: form.horaFim,
      });
      await carregarHorarios();
      setForm({ diaSemana: '', horaInicio: '', horaFim: '' });
    } catch (error) {
      if (error.message.includes('Horário já cadastrado')) {
        setFormErros({ submit: 'Já existe um horário cadastrado para este dia e horário' });
      } else {
        setFormErros({ submit: 'Erro ao criar horário. Tente novamente.' });
      }
    } finally {
      setCarregando(false);
    }
  };

  // Abrir edição
  const abrirEdicao = (horario) => {
    setEditForm({ ...horario });
    setEditErros({});
  };

  // Atualizar horário
  const handleUpdate = async () => {
    if (!editForm) return;

    const erros = validarFormulario(editForm);
    if (Object.keys(erros).length > 0) {
      setEditErros(erros);
      return;
    }

    setEditErros({});
    setCarregando(true);

    try {
      await atualizarHorario(editForm.id, {
        diaSemana: parseInt(editForm.diaSemana),
        horaInicio: editForm.horaInicio,
        horaFim: editForm.horaFim,
        ativo: editForm.ativo,
      });
      await carregarHorarios();
      setEditForm(null);
    } catch (error) {
      if (error.message.includes('Horário já cadastrado')) {
        setEditErros({ submit: 'Já existe um horário cadastrado para este dia e horário' });
      } else {
        setEditErros({ submit: 'Erro ao atualizar horário. Tente novamente.' });
      }
    } finally {
      setCarregando(false);
    }
  };

  // Deletar horário
  const handleDelete = async (id) => {
    if (!window.confirm('Tem certeza que deseja excluir este horário?')) {
      return;
    }

    setCarregando(true);
    try {
      await deletarHorario(id);
      await carregarHorarios();
    } catch (error) {
      console.error('Erro ao deletar horário:', error);
      alert('Erro ao excluir horário. Tente novamente.');
    } finally {
      setCarregando(false);
    }
  };

  // Helpers para UI
  const getDiaLabel = (valor) => {
    const dia = DIAS_SEMANA.find((d) => d.valor === valor);
    return dia ? dia.label : 'Desconhecido';
  };

  const getDiaCurto = (valor) => {
    const dia = DIAS_SEMANA.find((d) => d.valor === valor);
    return dia ? dia.curto : '?';
  };

  const formatarHora = (hora) => {
    if (!hora) return '';
    return hora.slice(0, 5);
  };

  return {
    horarios,
    carregando,
    form,
    setForm,
    formErros,
    setFormErros,
    editForm,
    setEditForm,
    editErros,
    setEditErros,
    handleCreate,
    abrirEdicao,
    handleUpdate,
    handleDelete,
    getDiaLabel,
    getDiaCurto,
    formatarHora,
    DIAS_SEMANA,
    recarregar: carregarHorarios,
  };
}
