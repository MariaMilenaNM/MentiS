/**
 * Componente de mensagem individual do chat.
 * Suporta mensagens do usuário, assistente, e metadados extras (matches, sugestões).
 */

import './ChatMessage.css';

function ChatMessage({ message, onProfessionalSelect }) {
  const { role, content, timestamp, partialMatches, finalMatches, nextQuestions } = message;

  const isUser = role === 'user';
  const timeStr = new Date(timestamp).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className={`chat-message ${isUser ? 'user' : 'assistant'}`}>
      <div className="message-bubble">
        <div className="message-content">{content}</div>

        {/* Matches parciais (sugestões durante conversa) */}
        {partialMatches && partialMatches.length > 0 && (
          <div className="partial-matches">
            <span className="matches-label">Profissionais encontrados:</span>
            <div className="matches-list">
              {partialMatches.map((match) => (
                <button
                  key={match.id}
                  className="match-card partial"
                  onClick={() => onProfessionalSelect?.(match)}
                  type="button"
                >
                  <div className="match-info">
                    <strong>{match.nome}</strong>
                    <span className="match-meta">
                      {match.abordagem} • {match.modalidade} • R$ {match.preco}/sessão
                    </span>
                    {match.matchReasons && match.matchReasons[0] && (
                      <span className="match-reason">{match.matchReasons[0]}</span>
                    )}
                  </div>
                  <span className="match-score">{(match.score * 100).toFixed(0)}%</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Matches finais (ranking completo) */}
        {finalMatches && finalMatches.length > 0 && (
          <div className="final-matches">
            <span className="matches-label">Ranking final:</span>
            <div className="matches-list final">
              {finalMatches.map((match) => (
                <button
                  key={match.profissional.id}
                  className="match-card final"
                  onClick={() => onProfessionalSelect?.(match.profissional)}
                  type="button"
                >
                  <span className="match-rank">#{match.rank}</span>
                  <div className="match-info">
                    <strong>{match.profissional.nome}</strong>
                    <span className="match-meta">
                      {match.profissional.abordagem} • {match.profissional.modalidade} • R${' '}
                      {match.profissional.preco}/sessão
                    </span>
                    <div className="match-reasons">
                      {match.matchReasons.map((reason, i) => (
                        <span key={i} className="match-reason">
                          • {reason}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="match-actions">
                    <span className="match-score">{(match.score * 100).toFixed(0)}%</span>
                    <span className="next-step">{match.nextStep}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Próximas perguntas sugeridas */}
        {nextQuestions && nextQuestions.length > 0 && (
          <div className="suggested-questions">
            <span className="questions-label">Perguntas para refinar:</span>
            <div className="questions-chips">
              {nextQuestions.map((q, i) => (
                <button
                  key={i}
                  className="question-chip"
                  type="button"
                  onClick={() =>
                    window.dispatchEvent(
                      new CustomEvent('triage-suggested-question', { detail: q })
                    )
                  }
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="message-time">{timeStr}</div>
      </div>
      <div className="message-anchor" />
    </div>
  );
}

export default ChatMessage;
