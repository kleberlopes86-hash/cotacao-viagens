import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";

// sendPrompt não existe fora do Claude.ai; cria um stub para não quebrar.
if (typeof window !== "undefined" && typeof window.sendPrompt !== "function") {
  window.sendPrompt = (text) => {
    console.log("[sendPrompt stub]", text.slice(0, 120) + "…");
    alert("Fora do Claude.ai o 'Baixar PDF' apenas registra os dados no console. Use 'Copiar HTML' para exportar.");
  };
}

createRoot(document.getElementById("root")).render(<App />);
