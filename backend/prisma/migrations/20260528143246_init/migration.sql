-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Profissional" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nome" TEXT NOT NULL,
    "crp" TEXT NOT NULL,
    "modalidade" TEXT NOT NULL,
    "link" TEXT NOT NULL,
    "numero" INTEGER NOT NULL,
    "contato" TEXT NOT NULL
);
INSERT INTO "new_Profissional" ("contato", "crp", "id", "link", "modalidade", "nome", "numero") SELECT "contato", "crp", "id", "link", "modalidade", "nome", "numero" FROM "Profissional";
DROP TABLE "Profissional";
ALTER TABLE "new_Profissional" RENAME TO "Profissional";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
