import React from 'react';
import { Link } from 'react-router-dom';
import { usePaciente } from '../../hooks/usePaciente';
import '../../styles/login.css';

export default function Paciente() {
    const {
        telaAtual, setTelaAtual,
        loginEmail, setLoginEmail, loginSenha, setLoginSenha,
        cadNome, setCadNome, cadData, setCadData, cadEmail, setCadEmail,
        cadTelefone, setCadTelefone, cadCidade, setCadCidade,
        cadEstado, setCadEstado, cadSenha, setCadSenha, cadSenhaConf, setCadSenhaConf,
        handleLogin, handleCadastro
    } = usePaciente();

    return (
        <>
        <div className="auth-container-page">
            <Link to="/" className="btn-sair">Sair</Link>

            <div id="telaAuth">
                <div className="auth-card">
                    <div className="auth-logo">MS</div>
                    
                    <h1 id="authTitulo">
                        {telaAtual === 'login' ? 'Área do Paciente' : 'Criar conta'}
                    </h1>
                    <p id="authSubtitulo">
                        {telaAtual === 'login' ? 'Acesse sua conta Mentis' : 'Preencha seus dados para se cadastrar'}
                    </p>

                    {telaAtual === 'login' && (
                        <div id="formLogin">
                            <div className="campo">
                                <label>E-mail</label>
                                <input type="email" placeholder="seu@email.com" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} />
                            </div>
                            <div className="campo">
                                <label>Senha</label>
                                <input type="password" placeholder="••••••••" value={loginSenha} onChange={(e) => setLoginSenha(e.target.value)} />
                            </div>
                            <button onClick={handleLogin}>Entrar</button>
                            <p className="auth-link">
                                Primeira vez aqui? <span style={{cursor: 'pointer'}} onClick={() => setTelaAtual('cadastro')}>Criar conta</span>
                            </p>
                        </div>
                    )}

                    {telaAtual === 'cadastro' && (
                        <div id="formCadastro">
                            <div className="campo">
                                <label>Nome completo</label>
                                <input type="text" placeholder="Seu nome" value={cadNome} onChange={(e) => setCadNome(e.target.value)} />
                            </div>
                            <div className="campo">
                                <label>Data de nascimento</label>
                                <input type="date" value={cadData} onChange={(e) => setCadData(e.target.value)} />
                            </div>
                            <div className="campo">
                                <label>E-mail</label>
                                <input type="email" placeholder="seu@email.com" value={cadEmail} onChange={(e) => setCadEmail(e.target.value)} />
                            </div>
                            <div className="campo">
                                <label>Telefone</label>
                                <input type="tel" placeholder="(81) 99999-9999" value={cadTelefone} onChange={(e) => setCadTelefone(e.target.value)} />
                            </div>
                            <div className="campo">
                                <label>Cidade</label>
                                <input type="text" placeholder="Ex: Caruaru" value={cadCidade} onChange={(e) => setCadCidade(e.target.value)} />
                            </div>
                            <div className="campo">
                                <label>Estado</label>
                                <select value={cadEstado} onChange={(e) => setCadEstado(e.target.value)}>
                                    <option value="">Selecione...</option>
                                    <option>AC</option><option>AL</option><option>PE</option><option>SP</option>
                                </select>
                            </div>
                            <div className="campo">
                                <label>Senha</label>
                                <input type="password" placeholder="Mínimo 6 caracteres" value={cadSenha} onChange={(e) => setCadSenha(e.target.value)} />
                            </div>
                            <div className="campo">
                                <label>Confirmar senha</label>
                                <input type="password" placeholder="Repita a senha" value={cadSenhaConf} onChange={(e) => setCadSenhaConf(e.target.value)} />
                            </div>
                            <button onClick={handleCadastro}>Criar conta</button>
                            <p className="auth-link">
                                Já tem conta? <span style={{cursor: 'pointer'}} onClick={() => setTelaAtual('login')}>Entrar</span>
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>    
        </>
    );
}