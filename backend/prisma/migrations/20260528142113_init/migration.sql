-- CreateTable
CREATE TABLE "Profissional" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nome" TEXT NOT NULL,
    "crp" INTEGER NOT NULL,
    "modalidade" TEXT NOT NULL,
    "link" TEXT NOT NULL,
    "numero" INTEGER NOT NULL,
    "contato" TEXT NOT NULL
);
