-- CreateTable
CREATE TABLE "Usuario" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "email" TEXT NOT NULL,
    "senha" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'PACIENTE',
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Paciente" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "usuarioId" INTEGER NOT NULL,
    "nome" TEXT NOT NULL,
    "dataNasc" DATETIME,
    "telefone" TEXT,
    "cidade" TEXT,
    "estado" TEXT,
    "aceiteLGPD" BOOLEAN NOT NULL DEFAULT false,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" DATETIME NOT NULL,
    CONSTRAINT "Paciente_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Psicologo" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "usuarioId" INTEGER NOT NULL,
    "crp" TEXT NOT NULL,
    "nome" TEXT,
    "telefone" TEXT,
    "contato" TEXT,
    "link" TEXT,
    "bio" TEXT,
    "especialidades" TEXT NOT NULL,
    "abordagem" TEXT NOT NULL DEFAULT 'OUTRA',
    "preco" REAL NOT NULL,
    "modalidade" TEXT NOT NULL DEFAULT 'ONLINE',
    "validado" BOOLEAN NOT NULL DEFAULT false,
    "fotoUrl" TEXT,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" DATETIME NOT NULL,
    CONSTRAINT "Psicologo_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "HorarioDisponivel" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "psicologoId" INTEGER NOT NULL,
    "diaSemana" INTEGER NOT NULL,
    "horaInicio" TEXT NOT NULL,
    "horaFim" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "HorarioDisponivel_psicologoId_fkey" FOREIGN KEY ("psicologoId") REFERENCES "Psicologo" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Agendamento" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "pacienteId" INTEGER NOT NULL,
    "psicologoId" INTEGER NOT NULL,
    "horarioId" INTEGER,
    "dataHora" DATETIME NOT NULL,
    "duracaoMin" INTEGER NOT NULL DEFAULT 50,
    "status" TEXT NOT NULL DEFAULT 'AGENDADO',
    "observacoes" TEXT,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" DATETIME NOT NULL,
    CONSTRAINT "Agendamento_pacienteId_fkey" FOREIGN KEY ("pacienteId") REFERENCES "Paciente" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Agendamento_psicologoId_fkey" FOREIGN KEY ("psicologoId") REFERENCES "Psicologo" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Agendamento_horarioId_fkey" FOREIGN KEY ("horarioId") REFERENCES "HorarioDisponivel" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Conversa" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "pacienteId" INTEGER NOT NULL,
    "psicologoId" INTEGER NOT NULL,
    "ativa" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" DATETIME NOT NULL,
    CONSTRAINT "Conversa_pacienteId_fkey" FOREIGN KEY ("pacienteId") REFERENCES "Paciente" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Conversa_psicologoId_fkey" FOREIGN KEY ("psicologoId") REFERENCES "Psicologo" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Mensagem" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "conversaId" INTEGER NOT NULL,
    "remetenteId" INTEGER NOT NULL,
    "conteudo" TEXT NOT NULL,
    "lida" BOOLEAN NOT NULL DEFAULT false,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Mensagem_conversaId_fkey" FOREIGN KEY ("conversaId") REFERENCES "Conversa" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Mensagem_remetenteId_fkey" FOREIGN KEY ("remetenteId") REFERENCES "Usuario" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_email_key" ON "Usuario"("email");

-- CreateIndex
CREATE INDEX "Usuario_email_idx" ON "Usuario"("email");

-- CreateIndex
CREATE INDEX "Usuario_role_idx" ON "Usuario"("role");

-- CreateIndex
CREATE UNIQUE INDEX "Paciente_usuarioId_key" ON "Paciente"("usuarioId");

-- CreateIndex
CREATE INDEX "Paciente_usuarioId_idx" ON "Paciente"("usuarioId");

-- CreateIndex
CREATE UNIQUE INDEX "Psicologo_usuarioId_key" ON "Psicologo"("usuarioId");

-- CreateIndex
CREATE UNIQUE INDEX "Psicologo_crp_key" ON "Psicologo"("crp");

-- CreateIndex
CREATE INDEX "Psicologo_usuarioId_idx" ON "Psicologo"("usuarioId");

-- CreateIndex
CREATE INDEX "Psicologo_crp_idx" ON "Psicologo"("crp");

-- CreateIndex
CREATE INDEX "Psicologo_validado_idx" ON "Psicologo"("validado");

-- CreateIndex
CREATE INDEX "Psicologo_modalidade_idx" ON "Psicologo"("modalidade");

-- CreateIndex
CREATE INDEX "HorarioDisponivel_psicologoId_idx" ON "HorarioDisponivel"("psicologoId");

-- CreateIndex
CREATE INDEX "HorarioDisponivel_diaSemana_idx" ON "HorarioDisponivel"("diaSemana");

-- CreateIndex
CREATE UNIQUE INDEX "HorarioDisponivel_psicologoId_diaSemana_horaInicio_horaFim_key" ON "HorarioDisponivel"("psicologoId", "diaSemana", "horaInicio", "horaFim");

-- CreateIndex
CREATE INDEX "Agendamento_pacienteId_idx" ON "Agendamento"("pacienteId");

-- CreateIndex
CREATE INDEX "Agendamento_psicologoId_idx" ON "Agendamento"("psicologoId");

-- CreateIndex
CREATE INDEX "Agendamento_dataHora_idx" ON "Agendamento"("dataHora");

-- CreateIndex
CREATE INDEX "Agendamento_status_idx" ON "Agendamento"("status");

-- CreateIndex
CREATE INDEX "Conversa_pacienteId_idx" ON "Conversa"("pacienteId");

-- CreateIndex
CREATE INDEX "Conversa_psicologoId_idx" ON "Conversa"("psicologoId");

-- CreateIndex
CREATE INDEX "Conversa_ativa_idx" ON "Conversa"("ativa");

-- CreateIndex
CREATE UNIQUE INDEX "Conversa_pacienteId_psicologoId_key" ON "Conversa"("pacienteId", "psicologoId");

-- CreateIndex
CREATE INDEX "Mensagem_conversaId_idx" ON "Mensagem"("conversaId");

-- CreateIndex
CREATE INDEX "Mensagem_remetenteId_idx" ON "Mensagem"("remetenteId");

-- CreateIndex
CREATE INDEX "Mensagem_criadoEm_idx" ON "Mensagem"("criadoEm");
