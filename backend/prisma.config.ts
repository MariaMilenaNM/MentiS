import { defineConfig } from "prisma/config";

export default defineConfig({
  earlyAccess: true,
  schema: "./prisma/schema.prisma",
  engine: "classic",
  datasource: {
    url: "file:./dev.db",
  },
});