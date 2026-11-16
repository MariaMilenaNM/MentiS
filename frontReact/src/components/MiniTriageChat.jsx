/**
 * Mini Chat de Triagem - Widget flutuante para LandingPage e Painel.
 * Versão compacta do chat de triagem com RAG real.
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRagTriageChat } from '../hooks/useRagTriageChat';
import TriageChatMessage from './TriageChatMessage';
import TriageChatInput from './TriageChatInput';
import TriageTypingIndicator from './TriageTypingIndicator';
import './MiniTriageChat.css';

function MiniTriageChat() {
  const {
    messages,
    isLoading,
    isLoggedIn,
    messagesEndRef,
    sendMessage,
    handleLoginRedirect,
    handleNewSearch,
    error,
  } = useRagTriageChat();

  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const containerRef = useRef(null);

  // Fecha ao clicar fora (quando minimizado)
  useEffect(() => {
    function handleClickOutside(event) {
      if (isMinimized && containerRef.current && !containerRef.current.contains(event.target)) {
        // Não fecha automaticamente - mantém o botão flutuante visível
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMinimized]);

  // Scroll automático para nova mensagem
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, messagesEndRef]);

  const toggleChat = useCallback(() => {
    setIsOpen((prev) => !prev);
    if (isMinimized) setIsMinimized(false);
  }, [isMinimized]);

  const minimizeChat = useCallback(() => {
    setIsMinimized(true);
    setIsOpen(false);
  }, []);

  const closeChat = useCallback(() => {
    setIsOpen(false);
    setIsMinimized(false);
  }, []);

  const handleSend = useCallback(
    (content) => {
      sendMessage(content);
    },
    [sendMessage]
  );

  // Contagem de mensagens não lidas (simplificada)
  const unreadCount = isMinimized && messages.length > 1 ? messages.length - 1 : 0;

  return (
    <div
      ref={containerRef}
      className={`mini-triage-chat ${isOpen ? 'open' : ''} ${isMinimized ? 'minimized' : ''}`}
      role="region"
      aria-label="Assistente de triagem MentiS"
    >
      {/* Botão flutuante (estado minimizado/fechado) */}
      {(isMinimized || !isOpen) && (
        <button
          className="chat-fab"
          onClick={toggleChat}
          aria-expanded={isOpen}
          aria-controls="chat-window"
          aria-label={
            isMinimized ? 'Expandir assistente de triagem' : 'Abrir assistente de triagem'
          }
        >
          <svg
            className="fab-icon"
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
          {unreadCount > 0 && (
            <span className="fab-badge" aria-label={`${unreadCount} mensagens não lidas`}>
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      )}

      {/* Janela do chat */}
      {isOpen && (
        <div
          id="chat-window"
          className="chat-window"
          role="dialog"
          aria-label="Chat de triagem"
          aria-modal="false"
        >
          {/* Header */}
          <header className="chat-header">
            <div className="header-info">
              <div className="avatar" aria-hidden="true">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 16v-4" />
                  <path d="M12 8h.01" />
                </svg>
              </div>
              <div className="header-text">
                <h3>Assistente de Triagem</h3>
                <span className="status">{isLoading ? 'Analisando...' : 'Online'}</span>
              </div>
            </div>
            <div className="header-actions">
              <button
                className="icon-btn minimize-btn"
                onClick={minimizeChat}
                aria-label="Minimizar chat"
                title="Minimizar"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              </button>
              <button
                className="icon-btn close-btn"
                onClick={closeChat}
                aria-label="Fechar chat"
                title="Fechar"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          </header>

          {/* Área de mensagens */}
          <div
            className="chat-messages"
            role="log"
            aria-live="polite"
            aria-label="Mensagens do chat"
          >
            {messages.map((message) => (
              <TriageChatMessage
                key={message.id}
                message={message}
                onLoginClick={handleLoginRedirect}
                onNewSearch={handleNewSearch}
              />
            ))}

            {isLoading && <TriageTypingIndicator />}

            <div ref={messagesEndRef} />
          </div>

          {/* Error display */}
          {error && (
            <div className="chat-error" role="alert">
              <span>{error}</span>
              <button
                onClick={() => sendMessage(messages[messages.length - 1]?.content || '')}
                className="retry-btn"
              >
                Tentar novamente
              </button>
            </div>
          )}

          {/* Input */}
          <TriageChatInput
            onSend={handleSend}
            disabled={isLoading}
            placeholder={
              isLoggedIn
                ? 'Descreva o que você busca...'
                : 'Faça login para ver contatos completos...'
            }
            suggestedQuestions={
              messages.length <= 1
                ? [
                    'Ansiedade e TCC online',
                    'Depressão abordagem humanista',
                    'Trauma e EMDR',
                    'Terapia de casal',
                    'Primeira vez na terapia',
                  ]
                : []
            }
          />
        </div>
      )}
    </div>
  );
}

export default MiniTriageChat;
