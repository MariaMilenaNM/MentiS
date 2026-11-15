/**
 * Componente de mensagem do chat de triagem.
 * Suporta mensagens do usuário, assistente, matches de profissionais e ações.
 * Compatível com formato do backend RAG (matches.profissional) e formato legado.
 */

import './TriageChatMessage.css';

function TriageChatMessage({ message, onLoginClick, onNewSearch }) {
  const { role, content, timestamp, matches, action, features } = message;

  const isUser = role === 'user';
  const timeStr = new Date(timestamp).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const formatModalidade = (modalidade) => {
    if (!modalidade) return 'Não informado';
    if (modalidade === 'Presencial e Remota' || modalidade === 'HIBRIDO') return 'Híbrido';
    return modalidade;
  };

  const getModalidadeClass = (modalidade) => {
    const m = formatModalidade(modalidade).toLowerCase();
    if (m === 'híbrido' || m === 'hibrido') return 'tag-ambas';
    return `tag-${m}`;
  };

  const getInicial = (nome) => (nome ? nome.charAt(0).toUpperCase() : '?');

  // Normaliza match para acessar campos tanto do formato backend (profissional) quanto legado
  const getProfField = (prof, field) => {
    // Backend RAG retorna { profissional: { nome, crp, ... }, score, matchReasons }
    // Formato legado retorna { nome, crp, matchScore, ... }
    if (prof.profissional && prof.profissional[field] !== undefined) {
      return prof.profissional[field];
    }
    return prof[field];
  };

  const getEspecialidades = (prof) => {
    const esp = getProfField(prof, 'especialidades');
    if (Array.isArray(esp)) return esp.join(', ');
    return esp || 'Não informadas';
  };

  return (
    <div className={`triage-message ${isUser ? 'user' : 'assistant'}`}>
      <div className="message-bubble">
        <div className="message-content">{content}</div>

        {/* Matches de profissionais */}
        {matches && matches.length > 0 && (
          <div className="matches-section">
            <div className="matches-header">
              <span className="matches-label">
                {action === 'require_login'
                  ? `Profissionais encontrados (faça login para ver detalhes):`
                  : `Profissionais compatíveis:`}
              </span>
              <span className="matches-count">
                {matches.length} resultado{matches.length !== 1 ? 's' : ''}
              </span>
            </div>

            <div className="matches-list">
              {matches.map((prof) => (
                <article
                  key={prof.profissionalId || prof.id || prof.profissional?.id}
                  className="match-card"
                >
                  <div className="match-avatar" aria-hidden="true">
                    {getInicial(getProfField(prof, 'nome'))}
                  </div>
                  <div className="match-info">
                    <div className="match-header">
                      <h4 className="match-nome">{getProfField(prof, 'nome')}</h4>
                      {getProfField(prof, 'validado') === false && (
                        <span className="match-badge-nao-validado">Não validado</span>
                      )}
                    </div>
                    <span className="match-crp">CRP: {getProfField(prof, 'crp')}</span>
                    <div className="match-meta">
                      <span
                        className={`match-modalidade ${getModalidadeClass(getProfField(prof, 'modalidade'))}`}
                      >
                        {formatModalidade(getProfField(prof, 'modalidade'))}
                      </span>
                      {getProfField(prof, 'abordagem') && (
                        <span className="match-abordagem">
                          {getProfField(prof, 'abordagem').replace('_', ' ')}
                        </span>
                      )}
                    </div>
                    <p className="match-especialidades">
                      <strong>Especialidades:</strong> {getEspecialidades(prof)}
                    </p>
                    {/* Mostra contatos apenas se logado (action !== 'require_login') */}
                    {action !== 'require_login' && (
                      <div className="match-contato">
                        <p>
                          <strong>E-mail:</strong>{' '}
                          {getProfField(prof, 'contato') ||
                            getProfField(prof, 'email') ||
                            'Disponível no painel'}
                        </p>
                        <p>
                          <strong>Telefone:</strong>{' '}
                          {getProfField(prof, 'numero') ||
                            getProfField(prof, 'telefone') ||
                            'Disponível no painel'}
                        </p>
                        {getProfField(prof, 'link') && (
                          <a
                            href={getProfField(prof, 'link')}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="match-instagram"
                          >
                            Ver Instagram
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="match-score">
                    <span className="score-value">
                      {prof.score !== undefined
                        ? `${(prof.score * 100).toFixed(0)}%`
                        : `${prof.matchScore || 0} pts`}
                    </span>
                  </div>
                </article>
              ))}
            </div>

            {/* Ação baseada no estado de login */}
            {action === 'require_login' && (
              <div className="matches-action">
                <p className="action-text">
                  Faça login ou crie uma conta para ver os contatos completos e agendar.
                </p>
                <button className="btn-login-action" onClick={onLoginClick}>
                  Fazer Login / Criar Conta
                </button>
              </div>
            )}

            {action === 'show_matches' && (
              <div className="matches-action">
                <p className="action-text">
                  Entre em contato diretamente com o profissional de sua preferência.
                </p>
                <button className="btn-new-search" onClick={onNewSearch}>
                  Nova Busca
                </button>
              </div>
            )}
          </div>
        )}

        {/* Features detectadas (para debug/transparência) - apenas formato legado */}
        {features && features.palavrasChave && features.palavrasChave.length > 0 && (
          <div className="detected-features">
            <span className="features-label">Detectado:</span>
            <div className="features-chips">
              {features.palavrasChave.map((kw, i) => (
                <span key={i} className="feature-chip">
                  {kw}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="message-time">{timeStr}</div>
      </div>
    </div>
  );
}

export default TriageChatMessage;
