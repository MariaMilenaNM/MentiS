/**
 * Hook customizado para chat de triagem usando RAG real (API backend).
 * Substitui a implementação mock local por busca semântica no vector store.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { getPacienteLogado } from '../services/crudPaciente.js';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000';

/**
 * Chama a API de triagem/RAG no backend
 * @param {string} query - Mensagem do usuário
 * @param {boolean} isLoggedIn - Se o usuário está logado
 * @returns {Promise<Object>} Resultado da busca com matches
 */
async function searchTriageAPI(query, isLoggedIn) {
  const token = isLoggedIn ? localStorage.getItem('token') : null;

  const headers = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}/triage/search`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      query,
      k: 5,
      filters: { validado: true }, // Apenas profissionais validados
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.erro || `Erro na busca: ${response.status}`);
  }

  return response.json();
}

/**
 * Gera resposta textual do assistente baseada nos matches
 */
function generateAssistantResponse(matches, isLoggedIn) {
  if (!matches || matches.length === 0) {
    return {
      text: 'Não encontrei profissionais compatíveis com sua busca no momento. Poderia tentar descrever de outra forma? Por exemplo: "ansiedade e TCC online", "depressão presencial", "terapia de casal", "trauma EMDR".',
      matches: [],
      action: 'continue',
    };
  }

  const topMatches = matches.slice(0, 3);
  const count = matches.length;

  let text = `Encontrei ${count} profissional${count !== 1 ? 'is' : ''} compatível${count !== 1 ? 'eis' : ''} com sua busca`;

  if (isLoggedIn) {
    text += '. Aqui estão as melhores opções com contatos completos:';
    return { text, matches: topMatches, action: 'show_matches' };
  } else {
    text +=
      '. Para ver os detalhes e contatos desses profissionais, você precisa fazer login ou criar uma conta.';
    return { text, matches: topMatches, action: 'require_login' };
  }
}

export function useRagTriageChat() {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [pacienteLogado, setPacienteLogado] = useState(null);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);

  // Verifica status de login na inicialização
  useEffect(() => {
    const storage = getPacienteLogado();
    if (storage) {
      setIsLoggedIn(true);
      setPacienteLogado(storage);
    }
  }, []);

  // Mensagem inicial do assistente
  useEffect(() => {
    if (messages.length === 0) {
      const initialMsg = {
        id: `msg_${Date.now()}`,
        role: 'assistant',
        content:
          'Olá! Sou o assistente de triagem da MentiS. Me conte o que você está buscando — por exemplo: ansiedade, depressão, problemas de relacionamento, trauma, ou se tem preferência por alguma abordagem (TCC, humanista, EMDR) ou modalidade (online/presencial). Vou buscar os profissionais mais compatíveis para você.',
        timestamp: new Date().toISOString(),
      };
      setMessages([initialMsg]);
    }
  }, [messages.length]);

  // Auto-scroll
  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const sendMessage = useCallback(
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

      try {
        // Chama API RAG real
        const apiResponse = await searchTriageAPI(content, isLoggedIn);

        // Gera resposta do assistente
        const response = generateAssistantResponse(apiResponse.matches, isLoggedIn);

        // Simula delay de digitação para UX
        await new Promise((resolve) => setTimeout(resolve, 600 + Math.random() * 400));

        const assistantMessage = {
          id: `msg_${Date.now() + 1}`,
          role: 'assistant',
          content: response.text,
          timestamp: new Date().toISOString(),
          matches: response.matches,
          action: response.action,
        };
        setMessages((prev) => [...prev, assistantMessage]);
      } catch (err) {
        console.error('Erro no chat RAG:', err);
        setError(err.message);

        const errorMessage = {
          id: `msg_${Date.now() + 1}`,
          role: 'assistant',
          content:
            'Desculpe, ocorreu um erro ao buscar profissionais. Verifique sua conexão e tente novamente em um momento.',
          timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, errorMessage]);
      } finally {
        setIsLoading(false);
      }
    },
    [isLoggedIn, isLoading]
  );

  const handleLoginRedirect = useCallback(() => {
    window.location.href = '/paciente';
  }, []);

  const handleNewSearch = useCallback(() => {
    setMessages([]);
    // Mensagem inicial será adicionada pelo useEffect
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    messages,
    isLoading,
    isLoggedIn,
    pacienteLogado,
    error,
    messagesEndRef,
    messagesContainerRef,
    sendMessage,
    handleLoginRedirect,
    handleNewSearch,
    clearError,
  };
}

export default useRagTriageChat;
