import { useState, useEffect, useCallback } from 'react';
import {
    getProfissionais,
    criarProfissional,
    buscarProfissionalPorId,
    atualizarProfissionalBd,
    deletarProfissionalBd
} from '../services/crudProfissional.js';

export function useProfissional() {
    const [profissionais, setProfissionais] = useState([]);
    const [form, setForm] = useState({
        nome: '', crp: '', modPresencial: false, modRemota: false, link: '', numero: '', contato: ''
    });
    const [formErros, setFormErros] = useState({});
    const [editForm, setEditForm] = useState(null);
    const [editErros, setEditErros] = useState({});
    const [carregando, setCarregando] = useState(false);

    const validarEmail = (email) => {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    };

    const validarTelefone = (telefone) => {
        const re = /^\(?\d{2}\)?\s?\d{4,5}-?\d{4}$/;
        return re.test(telefone.replace(/\s/g, ''));
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

        if (!dados.crp || isNaN(dados.crp) || Number(dados.crp) <= 0) {
            erros.crp = 'CRP deve ser um número positivo';
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

        return erros;
    };

    const getModalidade = (dados) => {
        if (dados.modPresencial && dados.modRemota) return "Presencial e Remota";
        if (dados.modPresencial) return "Presencial";
        if (dados.modRemota) return "Remota";
        return "";
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
            crp: Number(form.crp),
            modalidade,
            link: form.link || '',
            numero: form.numero,
            contato: form.contato
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
            setForm({ nome: '', crp: '', modPresencial: false, modRemota: false, link: '', numero: '', contato: '' });
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
                const modalidade = resultado.modalidade || "";
                const editFormNormalizado = {
                    ...resultado,
                    modPresencial: modalidade.includes("Presencial"),
                    modRemota: modalidade.includes("Remota")
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
            await atualizarProfissionalBd(editForm.id, editForm);
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
        handleDelete
    };
}