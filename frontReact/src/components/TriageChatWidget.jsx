/**
 * Mini-chat widget flutuante no canto inferior direito.
 * Usado na LandingPage (visitantes) e Painel (pacientes logados).
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { searchTriage } from '../services/triageService';
import { getToken, getPacienteLogado } from '../services/crudPaciente.js';
import './TriageChatWidget.css';

function TriageChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [error, setError] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [pacienteLogado, setPacienteLogado] = useState(null);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const widgetRef = useRef(null);

  // Verifica status de login na inicialização
  useEffect(() => {
    const token = getToken();
    const paciente = getPacienteLogado();
    setIsLoggedIn(!!token && !!paciente);
    setPacienteLogado(paciente);
  }, []);

  // Mensagem inicial do assistente
  useEffect(() => {
    if (messages.length === 0) {
      const initialMsg = {
        id: `msg_${Date.now()}`,
        role: 'assistant',
        content: isLoggedIn
          ? 'Olá! Sou o assistente de triagem da MentiS. Me conte o que você está buscando — por exemplo: ansiedade, depressão, problemas de relacionamento, trauma, ou se tem preferência por alguma abordagem (TCC, humanista, EMDR) ou modalidade (online/presencial). Vou verificar quais profissionais temos disponíveis para você.'
          : 'Olá! Sou o assistente de triagem da MentiS. Me conte o que você está buscando e vou verificar se temos profissionais compatíveis. Para ver os contatos completos, você precisará fazer login ou criar uma conta.',
        timestamp: new Date().toISOString(),
      };
      setMessages([initialMsg]);
    }
  }, [isLoggedIn, messages.length]);

  // Auto-scroll
  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Fecha widget ao clicar fora
  useEffect(() => {
    function handleClickOutside(event) {
      if (widgetRef.current && !widgetRef.current.contains(event.target) && isOpen) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const toggleWidget = useCallback(() => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      // Re-verifica login ao abrir
      const token = getToken();
      const paciente = getPacienteLogado();
      setIsLoggedIn(!!token && !!paciente);
      setPacienteLogado(paciente);
    }
  }, [isOpen]);

  const handleSendMessage = useCallback(
    async (content) => {
      if (!content.trim() || isLoading) return;

      setIsLoading(true);
      setError(null);

      // Adiciona mensagem do usuário
      const userMessage = {
        id: `msg_${Date.now()}`,
        role: 'user',
        content: content.trim(),
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, userMessage]);
      setInputValue('');

      try {
        const token = getToken();
        const result = await searchTriage(content.trim(), 5, {}, token);

        // Simula delay de digitação
        await new Promise((resolve) => setTimeout(resolve, 600 + Math.random() * 400));

        const { matches, total, isLoggedIn: backendLoggedIn } = result;

        if (matches.length === 0) {
          const noMatchMsg = {
            id: `msg_${Date.now() + 1}`,
            role: 'assistant',
            content:
              'Entendo que você está buscando ajuda. Infelizmente não encontrei profissionais com esse perfil específico no momento. Poderia me contar um pouco mais sobre o que você procura? Por exemplo: ansiedade, depressão, relacionamento, trauma, ou se tem preferência por alguma abordagem (TCC, humanista, EMDR) ou modalidade (online/presencial).',
            timestamp: new Date().toISOString(),
          };
          setMessages((prev) => [...prev, noMatchMsg]);
          return;
        }

        const topMatches = matches.slice(0, 3);

        let text = `Encontrei ${total} profissional${total !== 1 ? 'is' : ''} compatível${total !== 1 ? 'eis' : ''}. `;

        if (backendLoggedIn && pacienteLogado) {
          text += 'Aqui estão as melhores opções para você:';
        } else {
          text +=
            'Para ver os detalhes e contatos desses profissionais, você precisa fazer login ou criar uma conta.';
        }

        const assistantMessage = {
          id: `msg_${Date.now() + 1}`,
          role: 'assistant',
          content: text,
          timestamp: new Date().toISOString(),
          matches: topMatches,
          action: backendLoggedIn && pacienteLogado ? 'show_matches' : 'require_login',
        };
        setMessages((prev) => [...prev, assistantMessage]);
      } catch (err) {
        console.error('Erro no chat:', err);
        const errorMessage = {
          id: `msg_${Date.now() + 1}`,
          role: 'assistant',
          content:
            'Desculpe, ocorreu um erro ao buscar profissionais. Tente novamente em um momento.',
          timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, errorMessage]);
        setError('Erro na busca. Tente novamente.');
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading, pacienteLogado]
  );

  const handleSubmit = useCallback(
    (e) => {
      e.preventDefault();
      if (inputValue.trim() && !isLoading) {
        handleSendMessage(inputValue.trim());
      }
    },
    [inputValue, isLoading, handleSendMessage]
  );

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSubmit(e);
      }
    },
    [handleSubmit]
  );

  const handleLoginClick = useCallback(() => {
    window.location.href = '/paciente';
  }, []);

  const handleNewSearch = useCallback(() => {
    setMessages([]);
  }, []);

  if (!isOpen) {
    return (
      <div
        ref={widgetRef}
        className="triage-widget"
        role="region"
        aria-label="Assistente de triagem MentiS"
      >
        <button
          className="triage-widget-toggle"
          onClick={toggleWidget}
          aria-expanded={isOpen}
          aria-controls="triage-widget-panel"
          aria-label="Abrir assistente de triagem"
        >
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          <span className="widget-badge" aria-hidden="true">
            Triagem
          </span>
        </button>
      </div>
    );
  }

  return (
    <div
      ref={widgetRef}
      className="triage-widget open"
      role="region"
      aria-label="Assistente de triagem MentiS"
    >
      <div id="triage-widget-panel" className="triage-widget-panel">
        {/* Header */}
        <header className="widget-header">
          <div className="widget-header-info">
            <div className="widget-avatar" aria-hidden="true">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M8 14s1.5 2 4 2 4-2 4-2" />
                <line x1="9" y1="9" x2="9.01" y2="9" />
                <line x1="15" y1="9" x2="15.01" y2="9" />
              </svg>
            </div>
            <div className="widget-title-block">
              <h3 className="widget-title">Assistente de Triagem</h3>
              <span className="widget-status">{isLoggedIn ? 'Conectado' : 'Visitante'}</span>
            </div>
          </div>
          <button
            className="widget-close"
            onClick={toggleWidget}
            aria-label="Fechar assistente de triagem"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </header>

        {/* Messages Area */}
        <div
          ref={messagesContainerRef}
          className="widget-messages"
          role="log"
          aria-live="polite"
          aria-label="Conversa com assistente de triagem"
        >
          {messages.map((message, index) => (
            <WidgetMessage
              key={`${message.id}-${index}`}
              message={message}
              onLoginClick={handleLoginClick}
              onNewSearch={handleNewSearch}
              isLoggedIn={isLoggedIn}
            />
          ))}

          {isLoading && (
            <div
              className="widget-typing"
              role="status"
              aria-live="polite"
              aria-label="Assistente digitando"
            >
              <div className="typing-bubble">
                <span className="typing-dot"></span>
                <span className="typing-dot"></span>
                <span className="typing-dot"></span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Error Display */}
        {error && (
          <div className="widget-error" role="alert">
            {error}
            <button onClick={() => setError(null)} aria-label="Fechar erro">
              ×
            </button>
          </div>
        )}

        {/* Input Area */}
        <form className="widget-input-form" onSubmit={handleSubmit}>
          <textarea
            className="widget-textarea"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              isLoggedIn
                ? 'Descreva o que você busca...'
                : 'Descreva o que você busca... (login para ver contatos)'
            }
            disabled={isLoading}
            rows={1}
            maxLength={1000}
            aria-label="Mensagem para o assistente de triagem"
          />
          <button
            type="submit"
            className="widget-send-btn"
            disabled={!inputValue.trim() || isLoading}
            aria-label="Enviar mensagem"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M22 2L11 13" />
              <path d="M22 2l-7 20-4-9-9-4 20-7z" />
            </svg>
          </button>
        </form>

        {/* Footer CTA for non-logged users */}
        {!isLoggedIn && (
          <div className="widget-footer-cta">
            <p>
              Encontrou profissionais?{' '}
              <button onClick={handleLoginClick} className="widget-link-btn">
                Faça login
              </button>{' '}
              ou{' '}
              <button onClick={handleLoginClick} className="widget-link-btn">
                crie sua conta
              </button>{' '}
              para ver contatos.
            </p>
          </div>
        )}
      </div>

      {/* Toggle button (hidden when open) */}
      <button
        className="triage-widget-toggle hidden"
        onClick={toggleWidget}
        aria-expanded={isOpen}
        aria-controls="triage-widget-panel"
        aria-label="Fechar assistente de triagem"
      >
        <svg
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
        >
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  );
}

/**
 * Componente interno para renderizar mensagens no widget
 */
function WidgetMessage({ message, onLoginClick, onNewSearch, isLoggedIn }) {
  const { role, content, timestamp, matches, action } = message;
  const isUser = role === 'user';

  const timeStr = new Date(timestamp).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const formatModalidade = (modalidade) => {
    if (!modalidade) return 'Não informado';
    if (modalidade === 'HIBRIDO' || modalidade === 'Presencial e Remota') return 'Híbrido';
    return modalidade;
  };

  const getModalidadeClass = (modalidade) => {
    const m = formatModalidade(modalidade).toLowerCase();
    if (m === 'híbrido' || m === 'hibrido') return 'tag-ambas';
    return `tag-${m}`;
  };

  const getInicial = (nome) => (nome ? nome.charAt(0).toUpperCase() : '?');

  return (
    <div className={`widget-message ${isUser ? 'user' : 'assistant'}`}>
      <div className="widget-message-bubble">
        <div className="widget-message-content">{content}</div>

        {matches && matches.length > 0 && (
          <div className="widget-matches-section">
            <div className="widget-matches-header">
              <span className="widget-matches-label">
                {action === 'require_login'
                  ? `Profissionais encontrados (login para detalhes):`
                  : `Profissionais compatíveis:`}
              </span>
              <span className="widget-matches-count">
                {matches.length} resultado{matches.length !== 1 ? 's' : ''}
              </span>
            </div>

            <div className="widget-matches-list">
              {matches.map((prof) => (
                <article key={prof.profissionalId || prof.id} className="widget-match-card">
                  <div className="widget-match-avatar" aria-hidden="true">
                    {getInicial(prof.profissional?.nome || prof.nome)}
                  </div>
                  <div className="widget-match-info">
                    <div className="widget-match-header">
                      <h4 className="widget-match-nome">{prof.profissional?.nome || prof.nome}</h4>
                      {(prof.profissional?.validado === false || prof.validado === false) && (
                        <span className="widget-match-badge-nao-validado">Não validado</span>
                      )}
                    </div>
                    <span className="widget-match-crp">
                      CRP: {prof.profissional?.crp || prof.crp}
                    </span>
                    <div className="widget-match-meta">
                      <span
                        className={`widget-match-modalidade ${getModalidadeClass(prof.profissional?.modalidade || prof.modalidade)}`}
                      >
                        {formatModalidade(prof.profissional?.modalidade || prof.modalidade)}
                      </span>
                      {(prof.profissional?.abordagem || prof.abordagem) && (
                        <span className="widget-match-abordagem">
                          {(prof.profissional?.abordagem || prof.abordagem).replace('_', ' ')}
                        </span>
                      )}
                    </div>
                    <p className="widget-match-especialidades">
                      <strong>Esp.:</strong>{' '}
                      {prof.profissional?.especialidades?.join?.(', ') ||
                        prof.especialidades ||
                        'Não informadas'}
                    </p>
                    {action !== 'require_login' && isLoggedIn && (
                      <div className="widget-match-contato">
                        <p>
                          <strong>E-mail:</strong>{' '}
                          {prof.profissional?.contato || 'Disponível no painel'}
                        </p>
                        <p>
                          <strong>Telefone:</strong>{' '}
                          {prof.profissional?.numero || 'Disponível no painel'}
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="widget-match-score">
                    <span className="widget-score-value">{(prof.score * 100).toFixed(0)}%</span>
                  </div>
                </article>
              ))}
            </div>

            {action === 'require_login' && (
              <div className="widget-matches-action">
                <p className="widget-action-text">
                  Faça login ou crie uma conta para ver os contatos completos e agendar.
                </p>
                <button className="widget-btn-login" onClick={onLoginClick}>
                  Fazer Login / Criar Conta
                </button>
              </div>
            )}

            {action === 'show_matches' && (
              <div className="widget-matches-action">
                <p className="widget-action-text">
                  Entre em contato diretamente com o profissional de sua preferência.
                </p>
                <button className="widget-btn-new-search" onClick={onNewSearch}>
                  Nova Busca
                </button>
              </div>
            )}
          </div>
        )}

        <div className="widget-message-time">{timeStr}</div>
      </div>
    </div>
  );
}

export default TriageChatWidget;
