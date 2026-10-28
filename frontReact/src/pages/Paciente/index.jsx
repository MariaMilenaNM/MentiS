import { Link } from 'react-router-dom';
import { usePaciente } from '../../hooks/usePaciente';
import '../../styles/login.css';

export default function Paciente() {
    const {
        telaAtual, setTelaAtual,
        loginEmail, setLoginEmail, loginSenha, setLoginSenha,
        loginErro,
        cadNome, setCadNome, cadData, setCadData, cadEmail, setCadEmail,
        cadTelefone, setCadTelefone, cadCidade, setCadCidade,
        cadEstado, setCadEstado, cadSenha, setCadSenha, cadSenhaConf, setCadSenhaConf,
        cadErro,
        sucessoMsg, limparSucessoMsg,
        handleLogin, handleCadastro
    } = usePaciente();

    return (
        <>
            <div className="auth-container-page">
                <Link to="/" className="btn-sair">Sair</Link>

                <div id="telaAuth">
                    <div className="auth-card">
                        <div className="auth-logo" aria-hidden="true">MS</div>

                        <h1 id="authTitulo">
                            {telaAtual === 'login' ? 'Área do Paciente' : 'Criar conta'}
                        </h1>
                        <p id="authSubtitulo">
                            {telaAtual === 'login' ? 'Acesse sua conta Mentis' : 'Preencha seus dados para se cadastrar'}
                        </p>

                        {telaAtual === 'login' && (
                            <div id="formLogin">
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
                                <button onClick={handleLogin} type="button">Entrar</button>
                                <p className="auth-link">
                                    Primeira vez aqui? <span onClick={() => setTelaAtual('cadastro')} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && setTelaAtual('cadastro')}>Criar conta</span>
                                </p>
                            </div>
                        )}

                        {telaAtual === 'cadastro' && (
                            <div id="formCadastro">
                                {sucessoMsg && (
                                    <div className="sucesso-mensagem" role="status" aria-live="polite" onClick={limparSucessoMsg} style={{ cursor: 'pointer' }}>
                                        {sucessoMsg}
                                    </div>
                                )}
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
                                    <label htmlFor="cadData">Data de nascimento</label>
                                    <input
                                        type="date"
                                        id="cadData"
                                        value={cadData}
                                        onChange={(e) => setCadData(e.target.value)}
                                        autoComplete="bday"
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
                                    <label htmlFor="cadTelefone">Telefone</label>
                                    <input
                                        type="tel"
                                        id="cadTelefone"
                                        placeholder="(81) 99999-9999"
                                        value={cadTelefone}
                                        onChange={(e) => setCadTelefone(e.target.value)}
                                        autoComplete="tel"
                                    />
                                </div>
                                <div className="campo">
                                    <label htmlFor="cadCidade">Cidade</label>
                                    <input
                                        type="text"
                                        id="cadCidade"
                                        placeholder="Ex: Caruaru"
                                        value={cadCidade}
                                        onChange={(e) => setCadCidade(e.target.value)}
                                        autoComplete="address-level2"
                                    />
                                </div>
                                <div className="campo">
                                    <label htmlFor="cadEstado">Estado</label>
                                    <select
                                        id="cadEstado"
                                        value={cadEstado}
                                        onChange={(e) => setCadEstado(e.target.value)}
                                        autoComplete="address-level1"
                                    >
                                        <option value="">Selecione...</option>
                                        <option value="AC">AC</option>
                                        <option value="AL">AL</option>
                                        <option value="AP">AP</option>
                                        <option value="AM">AM</option>
                                        <option value="BA">BA</option>
                                        <option value="CE">CE</option>
                                        <option value="DF">DF</option>
                                        <option value="ES">ES</option>
                                        <option value="GO">GO</option>
                                        <option value="MA">MA</option>
                                        <option value="MT">MT</option>
                                        <option value="MS">MS</option>
                                        <option value="MG">MG</option>
                                        <option value="PA">PA</option>
                                        <option value="PB">PB</option>
                                        <option value="PR">PR</option>
                                        <option value="PE">PE</option>
                                        <option value="PI">PI</option>
                                        <option value="RJ">RJ</option>
                                        <option value="RN">RN</option>
                                        <option value="RS">RS</option>
                                        <option value="RO">RO</option>
                                        <option value="RR">RR</option>
                                        <option value="SC">SC</option>
                                        <option value="SP">SP</option>
                                        <option value="SE">SE</option>
                                        <option value="TO">TO</option>
                                    </select>
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
                                <button onClick={handleCadastro} type="button">Criar conta</button>
                                <p className="auth-link">
                                    Já tem conta? <span onClick={() => setTelaAtual('login')} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && setTelaAtual('login')}>Entrar</span>
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}