/**
 * Input do chat de triagem.
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import './TriageChatInput.css';

function TriageChatInput({
  onSend,
  disabled,
  placeholder = 'Descreva o que você busca...',
  suggestedQuestions = [],
}) {
  const [value, setValue] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const textareaRef = useRef(null);
  const suggestionsRef = useRef(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [value]);

  // Fecha sugestões ao clicar fora
  useEffect(() => {
    function handleClickOutside(event) {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = useCallback(
    (e) => {
      e.preventDefault();
      if (value.trim() && !disabled && onSend) {
        onSend(value.trim());
        setValue('');
        setShowSuggestions(false);
      }
    },
    [value, disabled, onSend]
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

  const handleSuggestionClick = useCallback((question) => {
    setValue(question);
    setShowSuggestions(false);
    setTimeout(() => textareaRef.current?.focus(), 0);
  }, []);

  // Mostra sugestões quando foca no input
  const handleFocus = useCallback(() => {
    if (suggestedQuestions.length > 0) {
      setShowSuggestions(true);
    }
  }, [suggestedQuestions.length]);

  return (
    <div className="triage-chat-input-container">
      {/* Sugestões rápidas */}
      {(suggestedQuestions.length > 0 || showSuggestions) && (
        <div className="suggestions-bar" ref={suggestionsRef}>
          <div className="suggestions-content">
            {suggestedQuestions.map((q, i) => (
              <button
                key={i}
                className="suggestion-chip"
                type="button"
                onClick={() => handleSuggestionClick(q)}
              >
                {q}
              </button>
            ))}
            {suggestedQuestions.length === 0 && showSuggestions && (
              <span className="suggestions-empty">Digite sua mensagem ou escolha acima</span>
            )}
          </div>
        </div>
      )}

      <form className="input-form" onSubmit={handleSubmit}>
        <textarea
          ref={textareaRef}
          className="chat-textarea"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          placeholder={placeholder}
          disabled={disabled}
          rows={1}
          maxLength={2000}
          aria-label="Mensagem para o assistente de triagem"
        />
        <div className="input-actions">
          <span className="char-count">{value.length}/2000</span>
          <button
            type="submit"
            className="send-button"
            disabled={!value.trim() || disabled}
            aria-label="Enviar mensagem"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M22 2L11 13" />
              <path d="M22 2l-7 20-4-9-9-4 20-7z" />
            </svg>
          </button>
        </div>
      </form>
    </div>
  );
}

export default TriageChatInput;
