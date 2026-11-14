import { useState, useEffect, useCallback } from 'react';
import {
  getProfissionais,
  criarProfissional,
  buscarProfissionalPorId,
  atualizarProfissionalBd,
  deletarProfissionalBd,
} from '../services/crudProfissional.js';

export function useProfissional() {
  const [profissionais, setProfissionais] = useState([]);
  const [form, setForm] = useState({
    nome: '',
    crp: '',
    modPresencial: false,
    modRemota: false,
    link: '',
    numero: '',
    contato: '',
    preco: '',
    especialidades: [],
  });
  const [formErros, setFormErros] = useState({});
  const [editForm, setEditForm] = useState(null);
  const [editErros, setEditErros] = useState({});
  const [carregando, setCarregando] = useState(false);

  const validarEmail = (email) => {
    // Validação mais robusta (similar ao Zod .email())
    const re =
      /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
    return re.test(email);
  };

  const validarTelefone = (telefone) => {
    // Aceita formatos: (XX) XXXXX-XXXX, (XX) XXXX-XXXX, XX XXXXX-XXXX, XXXXXXXXXX
    // Remove tudo que não é dígito e verifica se tem 10 ou 11 dígitos
    const digits = telefone.replace(/\D/g, '');
    return digits.length === 10 || digits.length === 11;
  };

  const validarCrp = (crp) => {
    // CRP pode ser: "06/123456", "06123456", "123456", etc.
    // Deve ter pelo menos 4 caracteres e conter apenas dígitos e opcionalmente uma barra
    if (!crp || typeof crp !== 'string') return false;
    const clean = crp.trim();
    if (clean.length < 4) return false;
    // Permite dígitos e no máximo uma barra
    const apenasDigitosEBarras = /^[\d/]+$/.test(clean);
    const noMaximoUmaBarra = (clean.match(/\//g) || []).length <= 1;
    return apenasDigitosEBarras && noMaximoUmaBarra;
  };

  const validarUrl = (url) => {
    if (!url) return true; // opcional
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const validarFormulario = (dados) => {
    const erros = {};

    if (!dados.nome || dados.nome.length < 2) {
      erros.nome = 'Nome deve ter pelo menos 2 caracteres';
    }

    if (!validarCrp(dados.crp)) {
      erros.crp = 'CRP inválido. Use formato: 06/123456 ou 06123456';
    }

    const modalidade = getModalidade(dados);
    if (!modalidade) {
      erros.modalidade = 'Selecione pelo menos uma modalidade';
    }

    if (dados.link && !validarUrl(dados.link)) {
      erros.link = 'Link deve ser uma URL válida (ex: https://instagram.com/usuario)';
    }

    if (!dados.numero || !validarTelefone(dados.numero)) {
      erros.numero = 'Telefone inválido. Use formato (XX) XXXXX-XXXX';
    }

    if (!dados.contato || !validarEmail(dados.contato)) {
      erros.contato = 'E-mail de contato inválido';
    }

    // Validar preço
    if (!dados.preco || isNaN(Number(dados.preco)) || Number(dados.preco) <= 0) {
      erros.preco = 'Preço da consulta deve ser um número positivo';
    }

    // Validar especialidades
    if (!dados.especialidades || dados.especialidades.length === 0) {
      erros.especialidades = 'Selecione pelo menos uma especialidade';
    }

    return erros;
  };

  const getModalidade = (dados) => {
    if (dados.modPresencial && dados.modRemota) return 'Presencial e Remota';
    if (dados.modPresencial) return 'Presencial';
    if (dados.modRemota) return 'Remota';
    return '';
  };

  const carregarTabela = useCallback(async () => {
    setCarregando(true);
    try {
      const dados = await getProfissionais();
      setProfissionais(dados || []);
    } catch {
      // erro silencioso
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregarTabela();
  }, [carregarTabela]);

  const handleCreate = async () => {
    const modalidade = getModalidade(form);
    const dadosSubmit = {
      nome: form.nome,
      crp: form.crp.trim(), // Enviar como string, não converter para Number
      modalidade,
      link: form.link || '',
      numero: form.numero,
      contato: form.contato,
      preco: Number(form.preco),
      especialidades: form.especialidades,
    };

    // Validar usando o form original (que tem modPresencial/modRemota)
    const erros = validarFormulario(form);
    if (Object.keys(erros).length > 0) {
      setFormErros(erros);
      return;
    }

    setFormErros({});
    setCarregando(true);

    try {
      await criarProfissional(dadosSubmit);
      await carregarTabela();
      setForm({
        nome: '',
        crp: '',
        modPresencial: false,
        modRemota: false,
        link: '',
        numero: '',
        contato: '',
        preco: '',
        especialidades: [],
      });
    } catch (error) {
      if (error.message.includes('CRP já cadastrado') || error.message.includes('P2002')) {
        setFormErros({ crp: 'CRP já cadastrado' });
      } else {
        setFormErros({ submit: 'Erro ao criar profissional. Tente novamente.' });
      }
    } finally {
      setCarregando(false);
    }
  };

  const abrirEdicao = async (id) => {
    try {
      const resultado = await buscarProfissionalPorId(id);
      if (resultado) {
        // Normalizar modalidade (string da API) para checkboxes (booleanos do form)
        // CRP vem como number do backend, converter para string
        const modalidade = resultado.modalidade || '';
        // Parse especialidades from JSON string
        let especialidades = [];
        if (resultado.especialidades) {
          try {
            especialidades = JSON.parse(resultado.especialidades);
          } catch {
            especialidades = [resultado.especialidades];
          }
        }
        const editFormNormalizado = {
          ...resultado,
          crp: String(resultado.crp), // Converter CRP para string
          modPresencial: modalidade.includes('Presencial'),
          modRemota: modalidade.includes('Remota'),
          preco: resultado.preco ? String(resultado.preco) : '',
          especialidades: especialidades,
        };
        setEditForm(editFormNormalizado);
        setEditErros({});
      }
    } catch (error) {
      console.error('Erro ao buscar profissional para edição:', error);
    }
  };

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
      const dadosAtualizacao = {
        ...editForm,
        preco: Number(editForm.preco),
        especialidades: editForm.especialidades,
      };
      await atualizarProfissionalBd(editForm.id, dadosAtualizacao);
      await carregarTabela();
      setEditForm(null);
    } catch (error) {
      if (error.message.includes('CRP já cadastrado') || error.message.includes('P2002')) {
        setEditErros({ crp: 'CRP já cadastrado' });
      } else {
        setEditErros({ submit: 'Erro ao atualizar profissional. Tente novamente.' });
      }
    } finally {
      setCarregando(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Tem certeza que deseja excluir este profissional?')) {
      return;
    }

    setCarregando(true);
    try {
      await deletarProfissionalBd(id);
      await carregarTabela();
    } catch (error) {
      console.error('Erro ao deletar profissional:', error);
      alert('Erro ao excluir profissional. Tente novamente.');
    } finally {
      setCarregando(false);
    }
  };

  // Retorna tudo que a interface precisa acessar
  return {
    profissionais,
    form,
    setForm,
    formErros,
    setFormErros,
    editForm,
    setEditForm,
    editErros,
    setEditErros,
    carregando,
    handleCreate,
    abrirEdicao,
    handleUpdate,
    handleDelete,
  };
}
