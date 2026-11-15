/**
 * Hook customizado para gerenciar estado do chat de triagem.
 * Integra com API real de RAG (POST /triage/search) e verifica status de login.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { searchTriage } from '../services/triageService.js';
import { getToken, getPacienteLogado } from '../services/crudPaciente.js';

export function useTriageChat() {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [pacienteLogado, setPacienteLogado] = useState(null);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);

  // Verifica status de login na inicialização
  useEffect(() => {
    const token = getToken();
    const paciente = getPacienteLogado();
    setIsLoggedIn(!!token && !!paciente);
    setPacienteLogado(paciente);
  }, []);

  // Auto-scroll
  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Inicia conversa com mensagem inicial do assistente
  useEffect(() => {
    if (messages.length === 0) {
      const initialMsg = {
        id: `msg_${Date.now()}`,
        role: 'assistant',
        content:
          'Olá! Sou o assistente de triagem da MentiS. Me conte o que você está buscando — por exemplo: ansiedade, depressão, problemas de relacionamento, trauma, ou se tem preferência por alguma abordagem (TCC, humanista, EMDR) ou modalidade (online/presencial). Vou verificar quais profissionais temos disponíveis para você.',
        timestamp: new Date().toISOString(),
      };
      setMessages([initialMsg]);
    }
  }, []);

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
        const token = getToken();
        const result = await searchTriage(content.trim(), 5, {}, token);

        // Simula delay de digitação para UX
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
        console.error('Erro no chat de triagem:', err);
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

  const handleLoginRedirect = useCallback(() => {
    window.location.href = '/paciente';
  }, []);

  const handleNewSearch = useCallback(() => {
    setMessages([]);
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
  };
}

export default useTriageChat;
