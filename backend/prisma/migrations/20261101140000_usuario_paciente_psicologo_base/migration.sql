-- Cria o que a migration 20261101150000_complete_schema assume já existir: sem isto,
-- ela falha em banco novo ("no such table: Usuario") e o histórico não pode ser aplicado.
-- Roda antes dela e preserva dados antigos de Paciente e Profissional.

PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;

CREATE TABLE "Usuario" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "email" TEXT NOT NULL,
    "senha" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'PACIENTE',
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" DATETIME NOT NULL
);
CREATE UNIQUE INDEX "Usuario_email_key" ON "Usuario"("email");
CREATE INDEX "Usuario_email_idx" ON "Usuario"("email");
CREATE INDEX "Usuario_role_idx" ON "Usuario"("role");

CREATE TABLE "Psicologo" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "usuarioId" INTEGER NOT NULL,
    "crp" TEXT NOT NULL,
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
CREATE UNIQUE INDEX "Psicologo_usuarioId_key" ON "Psicologo"("usuarioId");
CREATE UNIQUE INDEX "Psicologo_crp_key" ON "Psicologo"("crp");
CREATE INDEX "Psicologo_usuarioId_idx" ON "Psicologo"("usuarioId");
CREATE INDEX "Psicologo_crp_idx" ON "Psicologo"("crp");
CREATE INDEX "Psicologo_validado_idx" ON "Psicologo"("validado");
CREATE INDEX "Psicologo_modalidade_idx" ON "Psicologo"("modalidade");

-- Pacientes antigos viram Usuario + Paciente. O aceite fica false: eles nunca aceitaram os termos.
INSERT INTO "Usuario" ("email", "senha", "role", "ativo", "criadoEm", "atualizadoEm")
SELECT "email", "senha", 'PACIENTE', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP FROM "Paciente";

CREATE TABLE "new_Paciente" (
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
INSERT INTO "new_Paciente" ("id", "usuarioId", "nome", "dataNasc", "telefone", "cidade", "estado", "atualizadoEm")
SELECT
    p."id",
    u."id",
    p."nome",
    CASE WHEN p."data" GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'
         THEN p."data" || 'T00:00:00.000+00:00' END,
    p."telefone",
    p."cidade",
    p."estado",
    CURRENT_TIMESTAMP
FROM "Paciente" p
JOIN "Usuario" u ON u."email" = p."email";
DROP TABLE "Paciente";
ALTER TABLE "new_Paciente" RENAME TO "Paciente";
CREATE UNIQUE INDEX "Paciente_usuarioId_key" ON "Paciente"("usuarioId");
CREATE INDEX "Paciente_usuarioId_idx" ON "Paciente"("usuarioId");

-- A migration seguinte copia estas duas colunas de Profissional
ALTER TABLE "Profissional" ADD COLUMN "criadoEm" DATETIME;
ALTER TABLE "Profissional" ADD COLUMN "atualizadoEm" DATETIME;
UPDATE "Profissional" SET "criadoEm" = CURRENT_TIMESTAMP, "atualizadoEm" = CURRENT_TIMESTAMP;

PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
