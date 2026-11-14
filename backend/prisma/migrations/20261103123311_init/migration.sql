-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
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
INSERT INTO "new_Paciente" ("aceiteLGPD", "atualizadoEm", "cidade", "criadoEm", "dataNasc", "estado", "id", "nome", "telefone", "usuarioId") SELECT "aceiteLGPD", "atualizadoEm", "cidade", "criadoEm", "dataNasc", "estado", "id", "nome", "telefone", "usuarioId" FROM "Paciente";
DROP TABLE "Paciente";
ALTER TABLE "new_Paciente" RENAME TO "Paciente";
CREATE UNIQUE INDEX "Paciente_usuarioId_key" ON "Paciente"("usuarioId");
CREATE INDEX "Paciente_usuarioId_idx" ON "Paciente"("usuarioId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
