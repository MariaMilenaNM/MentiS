import React from 'react';
import {Link} from 'react-router-dom';

import logoBranca from '../../assets/LogoBranca.png';
import imgConversa from '../../assets/ConversaPsicologo.png';
import imgCard1 from '../../assets/Card1.png';
import imgCard2 from '../../assets/Card2.jpg';
import imgCard3 from '../../assets/Card3.jpg';

export default function LandingPage() {
    return(
        <>
            <header>
                <div id="marca">
                    <img src={logoBranca} alt="Logo MentiS" className="logo-imagem"/>
                    <div id="textos-marca">
                        <h1>MentiS</h1>
                    </div>
                </div>
                <nav>
                    <ul>
                        <li><a href="#">QUEM SOMOS?</a></li>
                        <li><Link to="/paciente" id="inscrevaButton">FAÇA LOGIN</Link></li>
                    </ul>
                </nav>
            </header>

            <section className="hero">
            <div className="hero-texto">
                <h2>Encontre o apoio ideal para</h2>
                <h2>sua mente com a <span className="light">MentiS</span></h2>
                <p>Encontrar o profissional certo não precisa ser um desafio. Nossa plataforma une você a psicólogos verificados de forma simples e segura. Navegue pelos perfis e cuide da sua saúde mental no seu ritmo.</p>
                <Link to="/profissional" className="btn-encontrar">REGISTRE-SE COMO PSICÓLOGO</Link>
            </div>
            <div className="imagem-direita">
                <img src={imgConversa} alt="Ilustração terapia"/>
            </div>
            </section>

            <section className="caracteristicas">
            <div className="grade">
                <div className="card">
                <div className="imgm">
                    <img src={imgCard1} alt="Profissional Certo"/>
                </div>
                <div className="corpo">
                    <h3>Profissional Certo</h3>
                    <p>Encontre o psicólogo ideal para o seu momento de vida, navegando por perfis focados no que você realmente busca.</p>
                </div>
                </div>

                <div className="card">
                <div className="imgm">
                    <img src={imgCard2} alt="Terapia do Seu Jeito"/>
                </div>
                <div className="corpo">
                    <h3>Terapia do Seu Jeito</h3>
                    <p>O conforto de casa ou o ambiente do consultório? Descubra profissionais com a modalidade que melhor se adapta a você.</p>
                </div>
                </div>

                <div className="card">
                <div className="imgm">
                    <img src={imgCard3} alt="Conexão Direta"/>
                </div>
                <div className="corpo">
                    <h3>Conexão Direta</h3>
                    <p>Nossa plataforma liga você diretamente ao contato do profissional escolhido, sem intermediários.</p>
                </div>
                </div>
            </div>

            </section>
                <section className="profissionais">
                    <h2>CONHEÇA OS PROFISSIONAIS</h2>
                    <div className="grade-profissionais">
                    <div className="card-profissional">
                        <div className="foto-placeholder"></div>
                        <h4>NOME</h4>
                        <p>ESPECIALIDADE(S)</p>
                        <div className="badges">
                        <span className="badge online">ONLINE</span>
                        <span className="badge presencial">PRESENCIAL</span>
                        </div>
                    </div>
                    </div>
                    <div className="btn-container">
                    <a href="#" className="btn-dark">PROCURE POR PROFISSIONAIS</a>
                    </div>
                </section>

                <section className="trust-section">
                    <div className="trust-bar">
                    <div className="trust-item">
                        <span className="material-icons">verified_user</span>
                        <span className="tlabel">Profissionais com CRP verificado</span>
                    </div>
                    <div className="trust-item">
                        <span className="material-icons">lock</span>
                        <span className="tlabel">Ambiente seguro</span>
                    </div>
                    <div className="trust-item">
                        <span className="material-icons">favorite_border</span>
                        <span className="tlabel">Respeito à sua história</span>
                    </div>
                    </div>
                </section>

                <section className="faq-section">
                    <div className="faq-container">
                    <div className="faq-left">
                        <span className="material-icons icon-large">help_outline</span>
                        <div className="faq-title-block">
                        <div className="t1">FAQ</div>
                        <div className="t2">Dúvidas Frequentes</div>
                        </div>
                    </div>
                    <div className="faq-right">
                        <details className="faq-item" name="faq">
                        <summary className="faq-q">
                            <span>Como escolho o psicólogo ideal?</span>
                            <span className="material-icons seta-icone">expand_more</span>
                        </summary>
                        <div className="faq-a-content">
                            <p className="faq-a">Use os filtros de especialidade, modalidade de atendimento e disponibilidade para encontrar o melhor profissional para você.</p>
                        </div>
                        </details>

                        <details className="faq-item" name="faq">
                        <summary className="faq-q">
                            <span>Como funciona o agendamento remoto?</span>
                            <span className="material-icons seta-icone">expand_more</span>
                        </summary>
                        <div className="faq-a-content">
                            <p className="faq-a">Após escolher o profissional, você é direcionado diretamente para o contato dele. O agendamento é feito sem intermediários, de forma simples e rápida.</p>
                        </div>
                        </details>

                        <details className="faq-item" name="faq">
                        <summary className="faq-q">
                            <span>Como posso buscar especialidades dos profissionais?</span>
                            <span className="material-icons seta-icone">expand_more</span>
                        </summary>
                        <div className="faq-a-content">
                            <p className="faq-a">Cada perfil exibe as especialidades do profissional. Você pode filtrar por área de atuação diretamente na busca para encontrar quem atende sua necessidade específica.</p>
                        </div>
                        </details>
                    </div>
                    </div>
                </section>

                <footer>
                    <a href="#" className="logo-footer">
                    <img src={logoBranca} alt="logo" className="logo-imagem-footer"/>
                    MentiS
                    </a>
                    <ul className="footer-links">
                    <li><a href="#">SOBRE NÓS</a></li>
                    <li><span className="sep">|</span></li>
                    <li><a href="#">TERMOS DE USO</a></li>
                    <li><span className="sep">|</span></li>
                    <li><a href="#">POLÍTICA DE PRIVACIDADE</a></li>
                    <li><span className="sep">|</span></li>
                    <li><a href="#">CONTATO</a></li>
                    </ul>
                </footer>
            </>    
    );
}
