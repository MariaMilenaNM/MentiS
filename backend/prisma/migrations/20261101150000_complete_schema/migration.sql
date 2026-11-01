-- Migration: Complete schema for MentiS MVP
-- Adds HorarioDisponivel, Agendamento, Conversa, Mensagem tables
-- Migrates Profissional data to Psicologo (via Usuario)

PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;

-- 1. Create HorarioDisponivel table
CREATE TABLE "HorarioDisponivel" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "psicologoId" INTEGER NOT NULL,
    "diaSemana" INTEGER NOT NULL CHECK ("diaSemana" BETWEEN 0 AND 6),
    "horaInicio" TEXT NOT NULL,
    "horaFim" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT 1,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("psicologoId") REFERENCES "Psicologo"("id") ON DELETE CASCADE
);

CREATE UNIQUE INDEX "HorarioDisponivel_psicologoId_diaSemana_horaInicio_horaFim_key"
    ON "HorarioDisponivel"("psicologoId", "diaSemana", "horaInicio", "horaFim");
CREATE INDEX "HorarioDisponivel_psicologoId_idx" ON "HorarioDisponivel"("psicologoId");
CREATE INDEX "HorarioDisponivel_diaSemana_idx" ON "HorarioDisponivel"("diaSemana");

-- 2. Create Agendamento table
CREATE TABLE "Agendamento" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "pacienteId" INTEGER NOT NULL,
    "psicologoId" INTEGER NOT NULL,
    "horarioId" INTEGER,
    "dataHora" DATETIME NOT NULL,
    "duracaoMin" INTEGER NOT NULL DEFAULT 50,
    "status" TEXT NOT NULL DEFAULT 'AGENDADO' CHECK ("status" IN ('AGENDADO', 'CONFIRMADO', 'CANCELADO_PACIENTE', 'CANCELADO_PSICOLOGO', 'REALIZADO', 'FALTOU')),
    "observacoes" TEXT,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("pacienteId") REFERENCES "Paciente"("id") ON DELETE CASCADE,
    FOREIGN KEY ("psicologoId") REFERENCES "Psicologo"("id") ON DELETE CASCADE,
    FOREIGN KEY ("horarioId") REFERENCES "HorarioDisponivel"("id") ON DELETE SET NULL
);

CREATE INDEX "Agendamento_pacienteId_idx" ON "Agendamento"("pacienteId");
CREATE INDEX "Agendamento_psicologoId_idx" ON "Agendamento"("psicologoId");
CREATE INDEX "Agendamento_dataHora_idx" ON "Agendamento"("dataHora");
CREATE INDEX "Agendamento_status_idx" ON "Agendamento"("status");

-- 3. Create Conversa table
CREATE TABLE "Conversa" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "pacienteId" INTEGER NOT NULL,
    "psicologoId" INTEGER NOT NULL,
    "ativa" BOOLEAN NOT NULL DEFAULT 1,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("pacienteId") REFERENCES "Paciente"("id") ON DELETE CASCADE,
    FOREIGN KEY ("psicologoId") REFERENCES "Psicologo"("id") ON DELETE CASCADE
);

CREATE UNIQUE INDEX "Conversa_pacienteId_psicologoId_key" ON "Conversa"("pacienteId", "psicologoId");
CREATE INDEX "Conversa_pacienteId_idx" ON "Conversa"("pacienteId");
CREATE INDEX "Conversa_psicologoId_idx" ON "Conversa"("psicologoId");
CREATE INDEX "Conversa_ativa_idx" ON "Conversa"("ativa");

-- 4. Create Mensagem table
CREATE TABLE "Mensagem" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "conversaId" INTEGER NOT NULL,
    "remetenteId" INTEGER NOT NULL,
    "conteudo" TEXT NOT NULL,
    "lida" BOOLEAN NOT NULL DEFAULT 0,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("conversaId") REFERENCES "Conversa"("id") ON DELETE CASCADE,
    FOREIGN KEY ("remetenteId") REFERENCES "Usuario"("id") ON DELETE CASCADE
);

CREATE INDEX "Mensagem_conversaId_idx" ON "Mensagem"("conversaId");
CREATE INDEX "Mensagem_remetenteId_idx" ON "Mensagem"("remetenteId");
CREATE INDEX "Mensagem_criadoEm_idx" ON "Mensagem"("criadoEm");

-- 5. Migrate Profissional data to Usuario + Psicologo
-- Insert Usuarios for profissionais (if not already exist)
INSERT OR IGNORE INTO "Usuario" ("email", "senha", "role", "ativo", "criadoEm", "atualizadoEm")
SELECT
    "contato" as email,
    '$2b$10$defaultpasswordhash' as senha,
    'PSICOLOGO' as role,
    1 as ativo,
    "criadoEm",
    "atualizadoEm"
FROM "Profissional";

-- Insert into Psicologo using the Usuario IDs (matched by email/contato)
INSERT OR IGNORE INTO "Psicologo" ("usuarioId", "crp", "bio", "especialidades", "abordagem", "preco", "modalidade", "validado", "fotoUrl", "criadoEm", "atualizadoEm")
SELECT
    u."id" as usuarioId,
    CAST(p."crp" AS TEXT) as crp,
    NULL as bio,
    '["Geral"]' as especialidades,
    'OUTRA' as abordagem,
    150.0 as preco,
    CASE
        WHEN p."modalidade" = 'Presencial' THEN 'PRESENCIAL'
        WHEN p."modalidade" = 'Remota' THEN 'ONLINE'
        WHEN p."modalidade" = 'Presencial e Remota' THEN 'HIBRIDO'
        ELSE 'ONLINE'
    END as modalidade,
    0 as validado,
    NULL as fotoUrl,
    p."criadoEm",
    p."atualizadoEm"
FROM "Profissional" p
JOIN "Usuario" u ON u."email" = p."contato";

-- 6. Drop old Profissional table
DROP TABLE "Profissional";

PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;