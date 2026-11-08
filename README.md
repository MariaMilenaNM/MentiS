
# MentiS
## Assistente de Triagem com RAG

### Introdução

O nosso objeto de estudo é a conexão entre pacientes e profissionais de saúde mental, onde o sistema tem como finalidade maior centralizar e organizar a oferta de serviços psicológicos, eliminando as barreiras de comunicação existentes entre quem busca atendimento e quem o oferece. Tendo em vista a fragmentação e a dificuldade de acesso a esses profissionais, o projeto MentiS vem com o objetivo de criar uma plataforma unificada para o gerenciamento e a descoberta de profissionais de psicologia.

### Escopo do MVP

O Produto Mínimo Viável (MVP) tem como foco entregar um fluxo principal ponta a ponta: o paciente interage com um Assistente de Triagem Conversacional (RF16), recebe até 3 recomendações de psicólogos através de uma Busca Semântica baseada em RAG (RF15), visualiza os horários disponíveis e realiza o agendamento diretamente pelo chat.

Qualquer funcionalidade que não alimente esse fluxo foi simplificada ou removida.

### O que Fica no MVP (Núcleo)

- RF16: Assistente Conversacional de Triagem (Novo).
- RF15: Busca Semântica de Profissionais via RAG (Novo).
- RF04: Cadastrar Profissional (Gera os dados para o RAG).
- RF11 e RF12: Disponibilizar Horários e Agendar Horário (Ferramentas utilizadas pelo agente).
- RF01 e RF02: Login e Logoff.

### O que foi Simplificado

- RF03 (Cadastrar Paciente): Apenas dados básicos (nome, e-mail, senha) e aceite da LGPD.
- RF05 (Validar CRP): Flag de validação manual; integração de API adiada para a v2.
- RF06 (Vitrine de Profissionais): Lista simples com filtros (fallback caso o LLM falhe).
- Segurança (RNF10) e LGPD (RNF06): JWT, bcrypt e garantia de que dados sensíveis não são enviados ao LLM.

### Tecnologias do Escopo

- **Frontend:** React + Vite
- **Backend:** Node.js
- **Banco de Dados:** SQLite3 acessado via Prisma ORM
- **IA:** Agente LangChain.js com Memory VectorStore

---

## Organização da Equipe e Responsabilidades

A equipe está organizada em três frentes de trabalho, com responsabilidades definidas para garantir o desenvolvimento, a qualidade e o acompanhamento das entregas semanais.

| Integrantes | Responsabilidades |
|---|---|
| **Nivaldo Neto e Ricardo Xavier** | Desenvolvimento da aplicação, implementação das funcionalidades e integração dos componentes do sistema. |
| **Maria Eduarda Neves** | QA e testes, elaboração e execução de cenários de teste, identificação de falhas e validação das funcionalidades. |
| **Maria Milena e Vitória Riccelle** | Organização e acompanhamento das atividades semanais, consolidação dos resultados, documentação e preparação das apresentações das entregas. |

## Tarefas e Sprints Semanais

O desenvolvimento está dividido em um Sprint 0 (Preparação), seguido por 5 Sprints de Desenvolvimento e Entrega.

### Nivaldo Neto
**Frente principal:** Desenvolvimento do agente LangChain, incluindo memória, ferramentas e system prompt.

- **Sprint 0:** Estrutura da pasta `/agent`.
- **Sprint 0:** Hello World LangChain.js no backend.
- **Sprint 1:** Esboço do system prompt de triagem.
- **Sprint 2:** Testes do agente com tool fake.
- **Sprint 3:** MB-17 – Agente com memória.
- **Sprint 4:** MB-20 – Endpoint `/api/chat` e correção de bugs do agente.
- **Sprint 5:** Correção e refinamento de bugs do agente.

### Ricardo Xavier
**Frente principal:** Desenvolvimento do backend, incluindo domínio, banco de dados, autenticação, horários e agendamento.

- **Sprint 0:** MB-04 – Schema e MB-05 – Autenticação.
- **Sprint 1:** MB-09 – Horários e MB-10 – Agendamento.
- **Sprint 2:** MB-13 – Gancho de reindexação.
- **Sprint 3:** MB-18 – Tools de horário e agendamento.
- **Sprint 4:** MB-21 – Testes de integração.
- **Sprint 5:** Correção de bugs do backend.

### Maria Eduarda Neves
**Frente principal:** QA (Quality Assurance) e testes da aplicação.

- **Sprint 0:** Apoio na validação da estrutura inicial do projeto.
- **Sprint 1:** Planejamento dos cenários de teste das funcionalidades.
- **Sprint 2:** Execução de testes e identificação de falhas.
- **Sprint 3:** Testes das funcionalidades implementadas e integradas.
- **Sprint 4:** MB-21 – Validação dos testes de integração.
- **Sprint 5:** Testes finais, regressão e validação do MVP.

### Maria Milena
**Frente principal:** Organização, acompanhamento e apresentação das entregas semanais.

- **Sprint 0:** Criação de Repositório e adição do projeto que já estava em andamento
- **Sprint 0:** Organização das atividades iniciais e acompanhamento da preparação do projeto.
- **Sprint 1:** Consolidação do progresso semanal e organização das entregas.
- **Sprint 2:** Acompanhamento das funcionalidades desenvolvidas e registro dos resultados.
- **Sprint 3:** Organização do andamento da integração entre os componentes.
- **Sprint 4:** Consolidação dos resultados, documentação do progresso e preparação da apresentação.
- **Sprint 5:** Organização da entrega final e apresentação da evolução do projeto.

### Vitória Riccelle
**Frente principal:** Organização, documentação e apresentação das entregas semanais.

- **Sprint 0:** MB-01 – Correção do documento e organização da documentação inicial.
- **Sprint 1:** Registro e organização das atividades desenvolvidas.
- **Sprint 2:** Consolidação das entregas e acompanhamento do cronograma.
- **Sprint 3:** Organização dos resultados e documentação da evolução do projeto.
- **Sprint 4:** Preparação dos materiais e estruturação das apresentações semanais.
- **Sprint 5:** MB-22 – Documento final e organização da demonstração (demo).

---

## Fluxo de Trabalho Semanal

A cada semana, a equipe seguirá um fluxo de trabalho colaborativo:

1. **Desenvolvimento:** Nivaldo e Ricardo implementam as funcionalidades previstas para a sprint.
2. **Qualidade:** Eduarda realiza os testes, identifica possíveis problemas e valida as funcionalidades.
3. **Organização:** Milena e Vitória acompanham as atividades, consolidam os resultados e organizam as entregas.
4. **Apresentação:** Milena e Vitória apresentam semanalmente o progresso, as funcionalidades concluídas e os resultados obtidos pela equipe.

O objetivo é garantir que cada entrega seja desenvolvida, testada, documentada e apresentada de maneira organizada.
