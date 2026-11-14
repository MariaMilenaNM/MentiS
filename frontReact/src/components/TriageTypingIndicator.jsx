/**
 * Indicador visual de "digitando..." para o assistente.
 */

import './TriageTypingIndicator.css';

function TriageTypingIndicator() {
  return (
    <div
      className="triage-typing-indicator"
      role="status"
      aria-live="polite"
      aria-label="Assistente digitando"
    >
      <div className="typing-bubble">
        <span className="typing-dot"></span>
        <span className="typing-dot"></span>
        <span className="typing-dot"></span>
      </div>
      <span className="typing-text">Assistente analisando...</span>
    </div>
  );
}

export default TriageTypingIndicator;
