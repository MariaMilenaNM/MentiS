# MentiS
## Assistente de Triagem com RAG
### Introdução
O nosso objeto de estudo é a conexão entre pacientes e profissionais de saúde mental, onde o sistema tem como finalidade maior centralizar e organizar a oferta de serviços psicológicos, eliminando as barreiras de comunicação existentes entre quem busca atendimento e quem o oferece. Tendo em vista a fragmentação e a dificuldade de acesso a esses profissionais, o projeto MentiS. vem com o objetivo de criar uma plataforma unificada para o gerenciamento e a descoberta de profissionais de psicologia.

### Escopo do MVP
O Produto Mínimo Viável (MVP) tem como foco entregar um fluxo principal ponta a ponta: o paciente interage com um Assistente de Triagem Conversacional (RF16), recebe até 3 recomendações de psicólogos através de uma Busca Semântica baseada em RAG (RF15), visualiza os horários disponíveis e realiza o agendamento diretamente pelo chat.
Qualquer funcionalidade que não alimente esse fluxo foi simplificada ou removida.

### O que Fica no MVP (Núcleo)
RF16: Assistente Conversacional de Triagem (Novo).
RF15: Busca Semântica de Profissionais via RAG (Novo).
RF04: Cadastrar Profissional (Gera os dados para o RAG).
RF11 e RF12: Disponibilizar Horários e Agendar Horário (Ferramentas utilizadas pelo agente).
RF01 e RF02: Login e Logoff.

### O que foi Simplificado
RF03 (Cadastrar Paciente): Apenas dados básicos (nome, e-mail, senha) e aceite da LGPD.
RF05 (Validar CRP): Flag de validação manual; integração de API adiada para a v2.
RF06 (Vitrine de Profissionais): Lista simples com filtros (fallback caso o LLM falhe).
Segurança (RNF10) & LGPD (RNF06): JWT, bcrypt e garantia de que dados sensíveis não são enviados ao LLM.

### Tecnologias do Escopo
Frontend: React + Vite
Backend: Node.js
Banco de Dados: SQLite3 acessado via Prisma ORM
IA: Agente LangChain.js com Memory VectorStore

### Tarefas e Sprints Semanais por Pessoa
O desenvolvimento está dividido em um Sprint 0 (Preparação) seguido por 5 Sprints de Desenvolvimento e Entrega.

### Nivaldo Neto
Frente Principal: Agente LangChain (memória, tools, system prompt)
Sprint 0: Estrutura da pasta /agent
Sprint 0: Hello world langchain.js no backend
Sprint 1: Esboço do system prompt de triagem
Sprint 2: Testes do agente com tool fake
Sprint 3: MB-17 agente com memória
Sprint 4: MB-20 endpoint /api/chat / Correção de bugs do agente
Sprint 5: Correção de bugs do agente

### Maria Eduarda Neves
Frente Principal: Pipeline RAG (ingestão, embeddings, retriever, avaliação)
Sprint 0: MB-03 spike LLM/embeddings
Sprint 0: MB-08 seed dos psicólogos
Sprint 1: MB-12 ingestão + embeddings
Sprint 2: MB-14 retriever + filtros
Sprint 3: MB-18 tool buscarPsicologos
Sprint 4: Ajuste fino do retriever pela avaliação
Sprint 5: Slides da arquitetura RAG

### Ricardo Xavier
Frente Principal: Backend de domínio (schema Prisma, auth, horários, agendamento)
Sprint 0: MB-02 setup do repo
Sprint 0: MB-04 schema + MB-05 auth
Sprint 1: MB-09 horários + MB-10 agendamento
Sprint 2: MB-13 gancho de reindexação
Sprint 3: MB-18 tools de horário e agendamento
Sprint 4: MB-21 testes de integração
Sprint 5: Correção de bugs do backend

### Maria Milena
Frente Principal: Frontend (chat, cards de psicólogo, vitrine)
Sprint 0: Layout base React e rotas
Sprint 0: Telas de login
Sprint 1: MB-11 vitrine
Sprint 2: MB-16 tela de chat (mock)
Sprint 3: Cards de psicólogo e horários no chat
Sprint 4: MB-20 integração do chat
Sprint 5: Responsividade e acessibilidade

### Vitória Riccelle
Frente Principal: Frontend de cadastros, QA e Documentação
Sprint 0: MB-01 correção do documento
Sprint 0: MB-06/07 telas de cadastro
Sprint 1: Tela de agenda do psicólogo
Sprint 2: MB-15 perguntas de avaliação
Sprint 3: MB-19  testes
Sprint 4: MB-21 roteiro de testes do chat
Sprint 5: MB-22 documento final + demo
