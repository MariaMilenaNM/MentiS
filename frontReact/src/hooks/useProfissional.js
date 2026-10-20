import { useState, useEffect } from 'react';
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
    const [editForm, setEditForm] = useState(null); 

    const carregarTabela = async () => {
        const dados = await getProfissionais();
        setProfissionais(dados || []);
    };

    useEffect(() => {
        carregarTabela();
    }, []);

    const handleCreate = async () => {
        let modalidade = "";
        if (form.modPresencial && form.modRemota) modalidade = "Presencial e Remota";
        else if (form.modPresencial) modalidade = "Presencial";
        else if (form.modRemota) modalidade = "Remota";

        if (!form.nome || !form.crp || !modalidade || !form.link || !form.numero || !form.contato) {
            alert("Por favor, preencha todos os campos.");
            return;
        }

        const dadosSubmit = { 
            nome: form.nome, crp: form.crp, modalidade, 
            link: form.link, numero: form.numero, contato: form.contato 
        };
        
        await criarProfissional(dadosSubmit);
        await carregarTabela();
        setForm({ nome: '', crp: '', modPresencial: false, modRemota: false, link: '', numero: '', contato: '' });
    };

    const abrirEdicao = async (id) => {
        const resultado = await buscarProfissionalPorId(id);
        if (resultado) setEditForm(resultado);
    };

    const handleUpdate = async () => {
        await atualizarProfissionalBd(editForm.id, editForm);
        await carregarTabela();
        setEditForm(null);
    };

    const handleDelete = async (id) => {
        await deletarProfissionalBd(id);
        await carregarTabela();
    };

    // Retorna tudo que a interface precisa acessar
    return {
        profissionais,
        form,
        setForm,
        editForm,
        setEditForm,
        handleCreate,
        abrirEdicao,
        handleUpdate,
        handleDelete
    };
}