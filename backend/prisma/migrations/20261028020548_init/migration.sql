/*
  Warnings:

  - You are about to alter the column `crp` on the `Profissional` table. The data in that column could be lost. The data in that column will be cast from `String` to `Int`.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Profissional" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nome" TEXT NOT NULL,
    "crp" INTEGER NOT NULL,
    "modalidade" TEXT NOT NULL,
    "link" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "contato" TEXT NOT NULL
);
INSERT INTO "new_Profissional" ("contato", "crp", "id", "link", "modalidade", "nome", "numero") SELECT "contato", "crp", "id", "link", "modalidade", "nome", "numero" FROM "Profissional";
DROP TABLE "Profissional";
ALTER TABLE "new_Profissional" RENAME TO "Profissional";
CREATE UNIQUE INDEX "Profissional_crp_key" ON "Profissional"("crp");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
