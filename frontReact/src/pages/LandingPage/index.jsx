import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { getProfissionais } from '../../services/crudProfissional.js';

import logoBranca from '../../assets/LogoBranca.png';
import imgConversa from '../../assets/ConversaPsicologo.png';
import imgCard1 from '../../assets/Card1.png';
import imgCard2 from '../../assets/Card2.jpg';
import imgCard3 from '../../assets/Card3.jpg';

export default function LandingPage() {
  const navigate = useNavigate();
  const [profissionais, setProfissionais] = useState([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    const carregarProfissionais = async () => {
      try {
        const dados = await getProfissionais();
        // Filtrar apenas profissionais validados para a landing page
        const validados = (dados || []).filter((p) => p.validado === true);
        setProfissionais(validados);
      } catch (error) {
        console.error('Erro ao carregar profissionais:', error);
        setProfissionais([]);
      } finally {
        setCarregando(false);
      }
    };

    carregarProfissionais();
  }, []);

  const handleAgendarClick = () => {
    // Verificar se há token no localStorage
    const token = localStorage.getItem('token');
    if (token) {
      navigate('/painel');
    } else {
      navigate('/paciente');
    }
  };

  const formatarModalidade = (modalidade) => {
    if (!modalidade) return '';
    const m = modalidade.toLowerCase();
    if (m === 'online' || m === 'remota') return 'Online';
    if (m === 'presencial') return 'Presencial';
    if (m === 'hibrido' || m === 'presencial e remota') return 'Presencial e Online';
    return modalidade;
  };

  return (
    <>
      <header>
        <div id="marca">
          <img src={logoBranca} alt="Logo MentiS" className="logo-imagem" />
          <div id="textos-marca">
            <h1>MentiS</h1>
          </div>
        </div>
        <nav>
          <ul>
            <li>
              <a href="#">QUEM SOMOS?</a>
            </li>
            <li>
              <Link to="/paciente" id="inscrevaButton">
                FAÇA LOGIN
              </Link>
            </li>
          </ul>
        </nav>
      </header>

      <section className="hero">
        <div className="hero-texto">
          <h2>Encontre o apoio ideal para</h2>
          <h2>
            sua mente com a <span className="light">MentiS</span>
          </h2>
          <p>
            Encontrar o profissional certo não precisa ser um desafio. Nossa plataforma une você a
            profissionais verificados de forma simples e segura. Navegue pelos perfis e cuide da sua
            saúde mental no seu ritmo.
          </p>
          <Link to="/profissional" className="btn-encontrar">
            REGISTRE-SE COMO PROFISSIONAL
          </Link>
        </div>
        <div className="imagem-direita">
          <img src={imgConversa} alt="Ilustração terapia" />
        </div>
      </section>

      <section className="caracteristicas">
        <div className="grade">
          <div className="card">
            <div className="imgm">
              <img src={imgCard1} alt="Profissional Certo" />
            </div>
            <div className="corpo">
              <h3>Profissional Certo</h3>
              <p>
                Encontre o profissional ideal para o seu momento de vida, navegando por perfis
                focados no que você realmente busca.
              </p>
            </div>
          </div>

          <div className="card">
            <div className="imgm">
              <img src={imgCard2} alt="Terapia do Seu Jeito" />
            </div>
            <div className="corpo">
              <h3>Terapia do Seu Jeito</h3>
              <p>
                O conforto de casa ou o ambiente do consultório? Descubra profissionais com a
                modalidade que melhor se adapta a você.
              </p>
            </div>
          </div>

          <div className="card">
            <div className="imgm">
              <img src={imgCard3} alt="Conexão Direta" />
            </div>
            <div className="corpo">
              <h3>Conexão Direta</h3>
              <p>
                Nossa plataforma liga você diretamente ao contato do profissional escolhido, sem
                intermediários.
              </p>
            </div>
          </div>
        </div>
      </section>
      <section className="profissionais">
        <h2>CONHEÇA OS PROFISSIONAIS</h2>
        {carregando ? (
          <div className="grade-profissionais">
            <div className="card-profissional loading">
              <div className="foto-placeholder skeleton"></div>
              <div className="skeleton-text"></div>
              <div className="skeleton-text short"></div>
              <div className="skeleton-badges">
                <div className="skeleton-badge"></div>
                <div className="skeleton-badge"></div>
              </div>
            </div>
            <div className="card-profissional loading">
              <div className="foto-placeholder skeleton"></div>
              <div className="skeleton-text"></div>
              <div className="skeleton-text short"></div>
              <div className="skeleton-badges">
                <div className="skeleton-badge"></div>
                <div className="skeleton-badge"></div>
              </div>
            </div>
            <div className="card-profissional loading">
              <div className="foto-placeholder skeleton"></div>
              <div className="skeleton-text"></div>
              <div className="skeleton-text short"></div>
              <div className="skeleton-badges">
                <div className="skeleton-badge"></div>
                <div className="skeleton-badge"></div>
              </div>
            </div>
          </div>
        ) : profissionais.length > 0 ? (
          <>
            <div className="profissionais-wrapper">
              {/* Indicador de continuidade à esquerda */}
              {profissionais.length > 5 && (
                <div className="continuidade-lateral esquerda" aria-hidden="true">
                  <span className="material-icons">chevron_left</span>
                </div>
              )}

              <div className="grade-profissionais" role="list" aria-label="Profissionais validados">
                {/* Mostrar até 5 profissionais centralizados */}
                {profissionais.slice(0, 5).map((profissional) => {
                  const letra = profissional.nome ? profissional.nome.charAt(0).toUpperCase() : '?';
                  // Validar link do Instagram
                  const instagramUsername = profissional.link
                    ? profissional.link
                        .replace(/^https?:\/\/(www\.)?instagram\.com\//, '')
                        .replace('@', '')
                        .split('/')[0]
                        .split('?')[0] // Remover query parameters
                    : '';
                  const instagramValido =
                    instagramUsername && /^[a-zA-Z0-9_.]+$/.test(instagramUsername);

                  // Formatar especialidades para exibição
                  const formatarEspecialidades = (especialidadesStr) => {
                    if (!especialidadesStr) return [];
                    try {
                      const espArray = JSON.parse(especialidadesStr);
                      return Array.isArray(espArray) ? espArray : [especialidadesStr];
                    } catch {
                      return [especialidadesStr];
                    }
                  };

                  const especialidades = formatarEspecialidades(profissional.especialidades);

                  return (
                    <div className="card-profissional" key={profissional.id} role="listitem">
                      <div className="prof-avatar" aria-hidden="true">
                        {letra}
                      </div>
                      <h4>{profissional.nome || 'Profissional'}</h4>
                      <p className="prof-crp">CRP: {profissional.crp}</p>
                      <p className="prof-modalidade">{formatarModalidade(profissional.modalidade)}</p>

                      {especialidades.length > 0 && (
                        <div className="prof-especialidades" aria-label="Especialidades">
                          {especialidades.slice(0, 3).map((esp, idx) => (
                            <span key={idx} className="prof-especialidade-tag">
                              {esp}
                            </span>
                          ))}
                          {especialidades.length > 3 && (
                            <span className="prof-especialidade-tag mais">+{especialidades.length - 3}</span>
                          )}
                        </div>
                      )}

                      {profissional.preco && (
                        <div className="prof-preco" aria-label={`Preço da consulta: R$ ${profissional.preco.toFixed(2)}`}>
                          <strong>Consulta:</strong> R$ {profissional.preco.toFixed(2)}
                        </div>
                      )}

                      <div className="prof-contato">
                        <p>
                          <strong>E-mail:</strong> {profissional.contato || '–'}
                        </p>
                        <p>
                          <strong>Telefone:</strong> {profissional.numero || '–'}
                        </p>
                      </div>
                      {instagramValido && (
                        <a
                          href={`https://instagram.com/${instagramUsername}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="prof-btn-insta"
                          aria-label={`Ver Instagram de ${profissional.nome}`}
                        >
                          Ver Instagram
                        </a>
                      )}
                      <button
                        className="btn-agendar-landing"
                        onClick={handleAgendarClick}
                        aria-label={`Agendar com ${profissional.nome}`}
                      >
                        Agendar
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Indicador de continuidade à direita */}
              {profissionais.length > 5 && (
                <div className="continuidade-lateral direita" aria-hidden="true">
                  <span className="material-icons">chevron_right</span>
                </div>
              )}
            </div>
          </>
        ) : (
          <p className="sem-profissionais">Nenhum profissional validado disponível no momento.</p>
        )}
        <div className="btn-container">
          <button className="btn-dark" onClick={handleAgendarClick}>
            {profissionais.length > 0
              ? 'VER TODOS OS PROFISSIONAIS'
              : 'CADASTRAR-SE COMO PROFISSIONAL'}
          </button>
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
                <span>Como escolho o profissional ideal?</span>
                <span className="material-icons seta-icone">expand_more</span>
              </summary>
              <div className="faq-a-content">
                <p className="faq-a">
                  Use os filtros de especialidade, modalidade de atendimento e disponibilidade para
                  encontrar o melhor profissional para você.
                </p>
              </div>
            </details>

            <details className="faq-item" name="faq">
              <summary className="faq-q">
                <span>Como funciona o agendamento remoto?</span>
                <span className="material-icons seta-icone">expand_more</span>
              </summary>
              <div className="faq-a-content">
                <p className="faq-a">
                  Após escolher o profissional, você é direcionado diretamente para o contato dele.
                  O agendamento é feito sem intermediários, de forma simples e rápida.
                </p>
              </div>
            </details>

            <details className="faq-item" name="faq">
              <summary className="faq-q">
                <span>Como posso buscar especialidades dos profissionais?</span>
                <span className="material-icons seta-icone">expand_more</span>
              </summary>
              <div className="faq-a-content">
                <p className="faq-a">
                  Cada perfil exibe as especialidades do profissional. Você pode filtrar por área de
                  atuação diretamente na busca para encontrar quem atende sua necessidade
                  específica.
                </p>
              </div>
            </details>
          </div>
        </div>
      </section>

      <footer>
        <a href="#" className="logo-footer">
          <img src={logoBranca} alt="logo" className="logo-imagem-footer" />
          MentiS
        </a>
        <ul className="footer-links">
          <li>
            <a href="#">SOBRE NÓS</a>
          </li>
          <li>
            <span className="sep">|</span>
          </li>
          <li>
            <a href="#">TERMOS DE USO</a>
          </li>
          <li>
            <span className="sep">|</span>
          </li>
          <li>
            <a href="#">POLÍTICA DE PRIVACIDADE</a>
          </li>
          <li>
            <span className="sep">|</span>
          </li>
          <li>
            <a href="#">CONTATO</a>
          </li>
        </ul>
      </footer>
    </>
  );
}
