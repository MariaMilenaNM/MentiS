import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getProfissionais } from '../../services/crudProfissional.js';
import { getPacienteLogado } from '../../services/crudPaciente.js';

import logoBranca from '../../assets/LogoBranca.png';
import imgConversa from '../../assets/ConversaPsicologo.png';
import imgCard1 from '../../assets/Card1.png';
import imgCard2 from '../../assets/Card2.jpg';
import imgCard3 from '../../assets/Card3.jpg';

export default function LandingPage() {
  const [profissionais, setProfissionais] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);
  const [pacienteLogado, setPacienteLogado] = useState(null);

  const carregarProfissionais = useCallback(async () => {
    try {
      setLoading(true);
      const dados = await getProfissionais();
      // Filtra apenas validados para mostrar ao publico
      const validados = (dados || []).filter((p) => p.validado !== false);
      setProfissionais(validados.slice(0, 12)); // Limita a 12 para o catalogo
    } catch (error) {
      console.error('Erro ao carregar profissionais:', error);
      setErro('Nao foi possivel carregar os profissionais');
    } finally {
      setLoading(false);
    }
  }, []);

  const formatarModalidade = (modalidade) => {
    if (!modalidade) return 'Nao informado';
    if (modalidade === 'Presencial e Remota') return 'Hibrido';
    return modalidade;
  };

  const getInicial = (nome) => {
    return nome ? nome.charAt(0).toUpperCase() : '?';
  };

  useEffect(() => {
    // Verifica se paciente esta logado
    const storage = getPacienteLogado();
    if (storage) {
      setPacienteLogado(storage);
    }

    // Carrega profissionais da API
    carregarProfissionais();
  }, [carregarProfissionais]);

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
              {pacienteLogado ? (
                <Link to="/painel" id="inscrevaButton">
                  MEU PAINEL
                </Link>
              ) : (
                <Link to="/paciente" id="inscrevaButton">
                  FACA LOGIN
                </Link>
              )}
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
            Encontrar o profissional certo nao precisa ser um desafio. Nossa plataforma une voce a
            profissionais verificados de forma simples e segura. Navegue pelos perfis e cuide da sua
            saude mental no seu ritmo.
          </p>
          <Link to="/profissional" className="btn-encontrar">
            REGISTRE-SE COMO PROFISSIONAL
          </Link>
        </div>
        <div className="imagem-direita">
          <img src={imgConversa} alt="Ilustracao terapia" />
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
                focados no que voce realmente busca.
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
                O conforto de casa ou o ambiente do consultorio? Descubra profissionais com a
                modalidade que melhor se adapta a voce.
              </p>
            </div>
          </div>

          <div className="card">
            <div className="imgm">
              <img src={imgCard3} alt="Conexao Direta" />
            </div>
            <div className="corpo">
              <h3>Conexao Direta</h3>
              <p>
                Nossa plataforma liga voce diretamente ao contato do profissional escolhido, sem
                intermediarios.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Catalogo dinamico de profissionais */}
      <section className="profissionais-catalogo">
        <div className="catalogo-header">
          <h2>PROFISSIONAIS DISPONIVEIS</h2>
          <p className="catalogo-subtitle">
            {profissionais.length} profissional{profissionais.length !== 1 ? 'is' : ''} verificado
            {profissionais.length !== 1 ? 's' : ''} pronto{profissionais.length !== 1 ? 's' : ''}{' '}
            para atender
          </p>
        </div>

        {loading ? (
          <div className="catalogo-loading" role="status" aria-live="polite">
            <div className="spinner"></div>
            <p>Carregando profissionais...</p>
          </div>
        ) : erro ? (
          <div className="catalogo-erro" role="alert">
            <p>{erro}</p>
            <button onClick={carregarProfissionais} className="btn-retry">
              Tentar novamente
            </button>
          </div>
        ) : profissionais.length === 0 ? (
          <div className="catalogo-vazio">
            <p>Nenhum profissional cadastrado no momento.</p>
            {pacienteLogado ? (
              <Link to="/painel" className="btn-primary">
                Ver painel
              </Link>
            ) : (
              <Link to="/paciente" className="btn-primary">
                Faca login para ser notificado
              </Link>
            )}
          </div>
        ) : (
          <>
            <div className="catalogo-carousel" role="list" aria-label="Catalogo de profissionais">
              {profissionais.map((profissional) => {
                const instagramUsername = profissional.link
                  ? profissional.link
                      .replace(/^https?:\/\/(www\.)?instagram\.com\//, '')
                      .replace('@', '')
                      .split('/')[0]
                  : '';
                const instagramValido =
                  instagramUsername && /^[a-zA-Z0-9_.]+$/.test(instagramUsername);
                const modalidadeFormatada = formatarModalidade(profissional.modalidade);
                const classeTag =
                  modalidadeFormatada === 'Hibrido' ? 'ambas' : modalidadeFormatada.toLowerCase();

                return (
                  <article key={profissional.id} className="catalogo-card" role="listitem">
                    <div className="catalogo-avatar" aria-hidden="true">
                      {getInicial(profissional.nome)}
                    </div>
                    <div className="catalogo-info">
                      <div className="catalogo-header-card">
                        <h3 className="catalogo-nome">{profissional.nome}</h3>
                        {profissional.validado === false && (
                          <span
                            className="catalogo-badge-nao-validado"
                            aria-label="Profissional nao validado"
                          >
                            Nao validado
                          </span>
                        )}
                      </div>
                      <span className="catalogo-crp">CRP: {profissional.crp}</span>
                      <span className={`catalogo-modalidade tag-${classeTag}`}>
                        {modalidadeFormatada}
                      </span>
                      <p className="catalogo-especialidades">
                        <strong>Especialidades:</strong>{' '}
                        {profissional.especialidades || 'Nao informadas'}
                      </p>
                      <p className="catalogo-contato">
                        <strong>E-mail:</strong> {profissional.contato}
                      </p>
                      <p className="catalogo-contato">
                        <strong>Telefone:</strong> {profissional.numero}
                      </p>
                    </div>
                    {instagramValido && (
                      <a
                        href={`https://instagram.com/${instagramUsername}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="catalogo-btn-insta"
                        aria-label={`Ver Instagram de ${profissional.nome}`}
                      >
                        Ver Instagram
                      </a>
                    )}
                  </article>
                );
              })}
            </div>

            <div className="catalogo-cta">
              {pacienteLogado ? (
                <Link to="/painel" className="btn-primary">
                  Ver todos os profissionais no painel
                </Link>
              ) : (
                <Link to="/paciente" className="btn-primary">
                  Faca login para ver detalhes e agendar
                </Link>
              )}
            </div>
          </>
        )}
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
            <span className="tlabel">Respeito a sua historia</span>
          </div>
        </div>
      </section>

      <section className="faq-section">
        <div className="faq-container">
          <div className="faq-left">
            <span className="material-icons icon-large">help_outline</span>
            <div className="faq-title-block">
              <div className="t1">FAQ</div>
              <div className="t2">Duvidas Frequentes</div>
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
                  encontrar o melhor profissional para voce.
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
                  Apos escolher o profissional, voce e direcionado diretamente para o contato dele.
                  O agendamento e feito sem intermediarios, de forma simples e rapida.
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
                  Cada perfil exibe as especialidades do profissional. Voce pode filtrar por area de
                  atuacao diretamente na busca para encontrar quem atende sua necessidade
                  especifica.
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
            <a href="#">SOBRE NOS</a>
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
            <a href="#">POLITICA DE PRIVACIDADE</a>
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
