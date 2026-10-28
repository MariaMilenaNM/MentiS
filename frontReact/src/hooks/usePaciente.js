import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { cadastrarPaciente, buscarPaciente } from '../services/crudPaciente.js';

export function usePaciente() {
    const navigate = useNavigate();

    const [telaAtual, setTelaAtual] = useState('login');

    const [loginEmail, setLoginEmail] = useState('');
    const [loginSenha, setLoginSenha] = useState('');
    const [loginErro, setLoginErro] = useState('');

    const [cadNome, setCadNome] = useState('');
    const [cadData, setCadData] = useState('');
    const [cadEmail, setCadEmail] = useState('');
    const [cadTelefone, setCadTelefone] = useState('');
    const [cadCidade, setCadCidade] = useState('');
    const [cadEstado, setCadEstado] = useState('');
    const [cadSenha, setCadSenha] = useState('');
    const [cadSenhaConf, setCadSenhaConf] = useState('');
    const [cadErro, setCadErro] = useState('');

    const validarEmail = (email) => {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    };

    const validarTelefone = (telefone) => {
        const re = /^\(?\d{2}\)?\s?\d{4,5}-?\d{4}$/;
        return re.test(telefone.replace(/\s/g, ''));
    };

    const handleLogin = async () => {
        setLoginErro('');

        if (!loginEmail || !loginSenha) {
            setLoginErro('Preencha e-mail e senha.');
            return;
        }

        if (!validarEmail(loginEmail)) {
            setLoginErro('E-mail inválido.');
            return;
        }

        const resultado = await buscarPaciente(loginEmail, loginSenha);

        if (resultado.status === 'erro') {
            setLoginErro(resultado.erro || 'E-mail ou senha incorretos.');
            return;
        }

        navigate('/painel');
    };

    const handleCadastro = async () => {
        setCadErro('');

        if (!cadNome || !cadData || !cadEmail || !cadTelefone || !cadCidade || !cadEstado || !cadSenha) {
            setCadErro('Preencha todos os campos!');
            return;
        }

        if (!validarEmail(cadEmail)) {
            setCadErro('E-mail inválido.');
            return;
        }

        if (!validarTelefone(cadTelefone)) {
            setCadErro('Telefone inválido. Use formato (XX) XXXXX-XXXX.');
            return;
        }

        if (cadSenha.length < 6) {
            setCadErro('A senha precisa ter pelo menos 6 caracteres.');
            return;
        }

        if (cadSenha !== cadSenhaConf) {
            setCadErro('As senhas não coincidem!');
            return;
        }

        const resultado = await cadastrarPaciente(cadNome, cadData, cadEmail, cadTelefone, cadCidade, cadEstado, cadSenha);

        if (resultado.status === 'duplicado') {
            setCadErro(resultado.erro || 'Já existe uma conta com este e-mail. Faça login.');
            setTelaAtual('login');
            return;
        }

        if (resultado.status === 'erro') {
            setCadErro(resultado.erro || 'Erro ao criar conta. Tente novamente.');
            return;
        }

        alert('Conta criada com sucesso! Faça login.');
        setTelaAtual('login');
        // Limpar formulário
        setCadNome('');
        setCadData('');
        setCadEmail('');
        setCadTelefone('');
        setCadCidade('');
        setCadEstado('');
        setCadSenha('');
        setCadSenhaConf('');
    };

    return {
        telaAtual, setTelaAtual,
        loginEmail, setLoginEmail,
        loginSenha, setLoginSenha,
        loginErro,
        cadNome, setCadNome,
        cadData, setCadData,
        cadEmail, setCadEmail,
        cadTelefone, setCadTelefone,
        cadCidade, setCadCidade,
        cadEstado, setCadEstado,
        cadSenha, setCadSenha,
        cadSenhaConf, setCadSenhaConf,
        cadErro,
        handleLogin, handleCadastro
    };
}