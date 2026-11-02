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
  const [cadEmail, setCadEmail] = useState('');
  const [cadSenha, setCadSenha] = useState('');
  const [cadSenhaConf, setCadSenhaConf] = useState('');
  const [cadAceite, setCadAceite] = useState(false);
  const [cadErro, setCadErro] = useState('');

  // Toast/success message não-bloqueante
  const [sucessoMsg, setSucessoMsg] = useState('');

  const validarEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const handleLogin = async () => {
    setLoginErro('');
    setSucessoMsg('');

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
    setSucessoMsg('');

    if (!cadNome.trim() || !cadEmail || !cadSenha) {
      setCadErro('Preencha todos os campos!');
      return;
    }

    if (!validarEmail(cadEmail)) {
      setCadErro('E-mail inválido.');
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

    if (!cadAceite) {
      setCadErro('É necessário aceitar os termos da LGPD para criar a conta.');
      return;
    }

    const resultado = await cadastrarPaciente({
      nome: cadNome,
      email: cadEmail,
      senha: cadSenha,
      aceiteLGPD: cadAceite,
    });

    if (resultado.status === 'duplicado') {
      setCadErro(resultado.erro || 'Já existe uma conta com este e-mail. Faça login.');
      return;
    }

    if (resultado.status === 'erro') {
      setCadErro(resultado.erro || 'Erro ao criar conta. Tente novamente.');
      return;
    }

    // Toast não-bloqueante em vez de alert()
    setSucessoMsg('Conta criada com sucesso! Faça login para continuar.');
    setTelaAtual('login');
    // Limpar formulário
    setCadNome('');
    setCadEmail('');
    setCadSenha('');
    setCadSenhaConf('');
    setCadAceite(false);
  };

  const limparSucessoMsg = () => setSucessoMsg('');

  return {
    telaAtual,
    setTelaAtual,
    loginEmail,
    setLoginEmail,
    loginSenha,
    setLoginSenha,
    loginErro,
    cadNome,
    setCadNome,
    cadEmail,
    setCadEmail,
    cadSenha,
    setCadSenha,
    cadSenhaConf,
    setCadSenhaConf,
    cadAceite,
    setCadAceite,
    cadErro,
    sucessoMsg,
    limparSucessoMsg,
    handleLogin,
    handleCadastro,
  };
}
