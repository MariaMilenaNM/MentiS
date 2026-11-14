/**
 * Indicador visual de "digitando..." para o assistente.
 */

import './TypingIndicator.css';

function TypingIndicator() {
  return (
    <div
      className="typing-indicator"
      role="status"
      aria-live="polite"
      aria-label="Assistente digitando"
    >
      <div className="typing-bubble">
        <span className="typing-dot"></span>
        <span className="typing-dot"></span>
        <span className="typing-dot"></span>
      </div>
      <span className="typing-text">Assistente digitando...</span>
    </div>
  );
}

export default TypingIndicator;
