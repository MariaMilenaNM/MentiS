import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { buscarPaciente, cadastrarPaciente } from '../services/crudPaciente.js';

export function usePaciente() {
    const navigate = useNavigate();

    const [telaAtual, setTelaAtual] = useState('login');

    const [loginEmail, setLoginEmail] = useState('');
    const [loginSenha, setLoginSenha] = useState('');

    const [cadNome, setCadNome] = useState('');
    const [cadData, setCadData] = useState('');
    const [cadEmail, setCadEmail] = useState('');
    const [cadTelefone, setCadTelefone] = useState('');
    const [cadCidade, setCadCidade] = useState('');
    const [cadEstado, setCadEstado] = useState('');
    const [cadSenha, setCadSenha] = useState('');
    const [cadSenhaConf, setCadSenhaConf] = useState('');

    const handleLogin = async () => {
        if (!loginEmail || !loginSenha) {
            alert('Preencha e-mail e senha.');
            return;
        }

        const encontrado = await buscarPaciente(loginEmail, loginSenha);
        if (!encontrado) {
            alert('E-mail ou senha incorretos.'); 
            return;
        }

        localStorage.setItem('pacienteLogado', JSON.stringify(encontrado));
        navigate('/painel'); 
    };

    const handleCadastro = async () => {
        if (!cadNome || !cadData || !cadEmail || !cadTelefone || !cadCidade || !cadEstado || !cadSenha) {
            alert('Preencha todos os campos!');
            return;
        }
        if (cadSenha.length < 6) {
            alert('A senha precisa ter pelo menos 6 caracteres.');
            return;
        }
        if (cadSenha !== cadSenhaConf) {
            alert('As senhas não coincidem!');
            return;
        }

        const resultado = await cadastrarPaciente(cadNome, cadData, cadEmail, cadTelefone, cadCidade, cadEstado, cadSenha);

        if (resultado === 'duplicado') {
            alert('Já existe uma conta com este e-mail. Faça login.');
            setTelaAtual('login');
            return;
        }

        alert('Conta criada com sucesso! Faça login.');
        setTelaAtual('login');
    };

    return {
        telaAtual, setTelaAtual,
        loginEmail, setLoginEmail,
        loginSenha, setLoginSenha,
        cadNome, setCadNome,
        cadData, setCadData,
        cadEmail, setCadEmail,
        cadTelefone, setCadTelefone,
        cadCidade, setCadCidade,
        cadEstado, setCadEstado,
        cadSenha, setCadSenha,
        cadSenhaConf, setCadSenhaConf,
        handleLogin, handleCadastro
    };
}