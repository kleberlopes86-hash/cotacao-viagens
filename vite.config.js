import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: { outDir: "dist" },
  server: {
    proxy: {
      // Toda chamada que começa com /api é repassada para o backend (server.js) na porta 8787.
      // Isso faz a busca de voos/hotéis/carros funcionar no localhost:5173.
      "/api": {
        target: "http://localhost:8787",
        changeOrigin: true,
      },
    },
  },
});