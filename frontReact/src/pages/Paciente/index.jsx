import { Link } from 'react-router-dom';
import { usePaciente } from '../../hooks/usePaciente';
import '../../styles/login.css';

export default function Paciente() {
  const {
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
  } = usePaciente();

  return (
    <>
      <div className="auth-container-page">
        <Link to="/" className="btn-sair">
          Sair
        </Link>

        <div id="telaAuth">
          <div className="auth-card">
            <div className="auth-logo" aria-hidden="true">
              MS
            </div>

            <h1 id="authTitulo">{telaAtual === 'login' ? 'Área do Paciente' : 'Criar conta'}</h1>
            <p id="authSubtitulo">
              {telaAtual === 'login'
                ? 'Acesse sua conta Mentis'
                : 'Preencha seus dados para se cadastrar'}
            </p>

            {telaAtual === 'login' && (
              <div id="formLogin">
                {sucessoMsg && (
                  <div
                    className="sucesso-mensagem"
                    role="status"
                    aria-live="polite"
                    onClick={limparSucessoMsg}
                    style={{ cursor: 'pointer' }}
                  >
                    {sucessoMsg}
                  </div>
                )}
                {loginErro && (
                  <div className="erro-mensagem" role="alert" aria-live="polite">
                    {loginErro}
                  </div>
                )}
                <div className="campo">
                  <label htmlFor="loginEmail">E-mail</label>
                  <input
                    type="email"
                    id="loginEmail"
                    placeholder="seu@email.com"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    autoComplete="email"
                    aria-describedby={loginErro ? 'loginErroMsg' : undefined}
                  />
                </div>
                <div className="campo">
                  <label htmlFor="loginSenha">Senha</label>
                  <input
                    type="password"
                    id="loginSenha"
                    placeholder="••••••••"
                    value={loginSenha}
                    onChange={(e) => setLoginSenha(e.target.value)}
                    autoComplete="current-password"
                  />
                </div>
                <button onClick={handleLogin} type="button">
                  Entrar
                </button>
                <p className="auth-link">
                  Primeira vez aqui?{' '}
                  <span
                    onClick={() => setTelaAtual('cadastro')}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && setTelaAtual('cadastro')}
                  >
                    Criar conta
                  </span>
                </p>
              </div>
            )}

            {telaAtual === 'cadastro' && (
              <div id="formCadastro">
                {cadErro && (
                  <div className="erro-mensagem" role="alert" aria-live="polite">
                    {cadErro}
                  </div>
                )}
                <div className="campo">
                  <label htmlFor="cadNome">Nome completo</label>
                  <input
                    type="text"
                    id="cadNome"
                    placeholder="Seu nome"
                    value={cadNome}
                    onChange={(e) => setCadNome(e.target.value)}
                    autoComplete="name"
                  />
                </div>
                <div className="campo">
                  <label htmlFor="cadEmail">E-mail</label>
                  <input
                    type="email"
                    id="cadEmail"
                    placeholder="seu@email.com"
                    value={cadEmail}
                    onChange={(e) => setCadEmail(e.target.value)}
                    autoComplete="email"
                  />
                </div>
                <div className="campo">
                  <label htmlFor="cadSenha">Senha</label>
                  <input
                    type="password"
                    id="cadSenha"
                    placeholder="Mínimo 6 caracteres"
                    value={cadSenha}
                    onChange={(e) => setCadSenha(e.target.value)}
                    autoComplete="new-password"
                  />
                </div>
                <div className="campo">
                  <label htmlFor="cadSenhaConf">Confirmar senha</label>
                  <input
                    type="password"
                    id="cadSenhaConf"
                    placeholder="Repita a senha"
                    value={cadSenhaConf}
                    onChange={(e) => setCadSenhaConf(e.target.value)}
                    autoComplete="new-password"
                  />
                </div>
                <div className="lgpd-aceite">
                  <p id="cadTermos">
                    Usamos seu nome, e-mail e senha (guardada de forma protegida) para criar sua
                    conta e permitir o agendamento com profissionais. O assistente de triagem é uma
                    inteligência artificial: o que você escrever na conversa é processado por ela,
                    mas seu nome e e-mail não são enviados.
                  </p>
                  <label htmlFor="cadAceite">
                    <input
                      type="checkbox"
                      id="cadAceite"
                      checked={cadAceite}
                      onChange={(e) => setCadAceite(e.target.checked)}
                      aria-describedby="cadTermos"
                      required
                    />
                    <span>
                      Li e aceito o tratamento dos meus dados, conforme a LGPD (Lei nº 13.709/2018).
                    </span>
                  </label>
                </div>
                <button onClick={handleCadastro} type="button">
                  Criar conta
                </button>
                <p className="auth-link">
                  Já tem conta?{' '}
                  <span
                    onClick={() => setTelaAtual('login')}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && setTelaAtual('login')}
                  >
                    Entrar
                  </span>
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
