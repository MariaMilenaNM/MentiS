/**
 * Página do Chat de Triagem (Assistente de Triagem MentiS).
 * Rota: /triagem
 *
 * Comportamento:
 * - Não logado: Mostra profissionais compatíveis + direciona para login/cadastro
 * - Logado: Mostra profissionais compatíveis com detalhes de contato
 */

import { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import useTriageChat from '../hooks/useTriageChat.js';
import TriageChatMessage from '../components/TriageChatMessage.jsx';
import TriageChatInput from '../components/TriageChatInput.jsx';
import TriageTypingIndicator from '../components/TriageTypingIndicator.jsx';
import './TriageChat.css';

function TriageChat() {
  const navigate = useNavigate();
  const {
    messages,
    isLoading,
    isLoggedIn,
    loadingProfissionais,
    erroProfissionais,
    messagesEndRef,
    messagesContainerRef,
    sendMessage,
    handleLoginRedirect,
    handleNewSearch,
  } = useTriageChat();

  // Extrai perguntas sugeridas da última mensagem do assistente
  const lastAssistantMessage = [...messages].reverse().find((m) => m.role === 'assistant');
  const suggestedQuestions =
    lastAssistantMessage?.features?.palavrasChave?.length > 0
      ? [
          `Quero ${lastAssistantMessage.features.palavrasChave[0]} online`,
          `Preciso de ajuda com ${lastAssistantMessage.features.palavrasChave[0]}`,
          `Busco terapeuta para ${lastAssistantMessage.features.palavrasChave[0]}`,
        ].slice(0, 3)
      : [
          'Tenho ansiedade e quero TCC online',
          'Estou deprimido, primeira vez na terapia',
          'Problemas no relacionamento, terapia de casal',
          'Trauma na infância, quero EMDR',
        ];

  // Scroll container
  const scrollToBottom = useCallback(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const handleSendMessage = useCallback(
    (content) => {
      sendMessage(content);
    },
    [sendMessage]
  );

  const handleLoginClick = useCallback(() => {
    handleLoginRedirect();
    // O handleLoginRedirect já faz window.location.href = '/paciente'
  }, [handleLoginRedirect]);

  const handleBack = useCallback(() => {
    navigate('/');
  }, [navigate]);

  // Estado inicial de loading dos profissionais
  if (loadingProfissionais) {
    return (
      <div className="triage-chat-page loading-state">
        <header className="chat-header">
          <button className="back-button" onClick={handleBack} aria-label="Voltar">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="header-info">
            <h1>Assistente de Triagem</h1>
            <span className="status-badge">Carregando...</span>
          </div>
        </header>
        <div className="messages-container loading-full">
          <div className="loading-spinner-large" role="status" aria-live="polite">
            <div className="spinner"></div>
            <p>Carregando profissionais disponíveis...</p>
          </div>
        </div>
      </div>
    );
  }

  // Erro ao carregar profissionais
  if (erroProfissionais) {
    return (
      <div className="triage-chat-page error-state">
        <header className="chat-header">
          <button className="back-button" onClick={handleBack} aria-label="Voltar">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="header-info">
            <h1>Assistente de Triagem</h1>
            <span className="status-badge error">Erro</span>
          </div>
        </header>
        <div className="messages-container error-full">
          <div className="error-content" role="alert">
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <h2>Não foi possível carregar os profissionais</h2>
            <p>{erroProfissionais}</p>
            <button className="btn-primary" onClick={() => window.location.reload()}>
              Tentar Novamente
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="triage-chat-page">
      {/* Header */}
      <header className="chat-header">
        <button className="back-button" onClick={handleBack} aria-label="Voltar">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="header-info">
          <h1>Assistente de Triagem</h1>
          <span className="status-badge">{isLoggedIn ? 'Conectado' : 'Visitante'}</span>
        </div>
        <div className="header-actions">
          {!isLoggedIn && (
            <button className="btn-login-header" onClick={handleLoginClick}>
              Entrar / Cadastrar
            </button>
          )}
        </div>
      </header>

      {/* Área de mensagens */}
      <div
        ref={messagesContainerRef}
        className="messages-container"
        role="log"
        aria-live="polite"
        aria-label="Conversa com assistente de triagem"
      >
        {messages.map((message, index) => (
          <TriageChatMessage
            key={`${message.id}-${index}`}
            message={message}
            onLoginClick={handleLoginClick}
            onNewSearch={handleNewSearch}
          />
        ))}

        {/* Indicador de digitação */}
        {isLoading && <TriageTypingIndicator />}

        {/* Anchor para auto-scroll */}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <TriageChatInput
        onSend={handleSendMessage}
        disabled={isLoading}
        suggestedQuestions={suggestedQuestions}
        placeholder={
          isLoggedIn
            ? 'Descreva o que você busca...'
            : 'Descreva o que você busca... (login necessário para ver contatos)'
        }
      />

      {/* Footer info */}
      <div className="chat-footer">
        {!isLoggedIn && (
          <div className="footer-cta">
            <p>
              Encontrou profissionais compatíveis?{' '}
              <button onClick={handleLoginClick} className="link-button">
                Faça login
              </button>{' '}
              ou{' '}
              <button onClick={handleLoginClick} className="link-button">
                crie sua conta
              </button>{' '}
              para ver os contatos e agendar.
            </p>
          </div>
        )}
        <p className="footer-disclaimer">
          Este assistente sugere profissionais baseados em palavras-chave. Não substitui avaliação
          clínica profissional.
        </p>
      </div>
    </div>
  );
}

export default TriageChat;
