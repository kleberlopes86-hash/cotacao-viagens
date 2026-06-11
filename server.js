// ============================================================
// Backend do Sistema de Cotação de Viagens
// Mantém a chave da API segura e faz a chamada com web search.
// ============================================================
import express from "express";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));

const PORT = process.env.PORT || 8787;
const API_KEY = process.env.ANTHROPIC_API_KEY;

if (!API_KEY) {
  console.error("\n⚠  Defina a variável ANTHROPIC_API_KEY antes de iniciar.\n");
}

// Extrai o primeiro bloco JSON balanceado de um texto, respeitando aspas.
function extractJSON(text) {
  const clean = text.replace(/```json/gi, "").replace(/```/g, "");
  for (let i = 0; i < clean.length; i++) {
    const ch = clean[i];
    if (ch !== "[" && ch !== "{") continue;
    const open = ch;
    const close = ch === "[" ? "]" : "}";
    let depth = 0, inStr = false, esc = false;
    for (let j = i; j < clean.length; j++) {
      const c = clean[j];
      if (inStr) {
        if (esc) esc = false;
        else if (c === "\\") esc = true;
        else if (c === '"') inStr = false;
        continue;
      }
      if (c === '"') inStr = true;
      else if (c === open) depth++;
      else if (c === close) {
        depth--;
        if (depth === 0) {
          try { return JSON.parse(clean.slice(i, j + 1)); }
          catch { break; }
        }
      }
    }
  }
  throw new Error("Não foi possível extrair JSON da resposta da IA");
}

app.get("/health", (_req, res) => res.json({ ok: true }));

// O front-end envia { system, prompt, useSearch }
app.post("/api/search", async (req, res) => {
  try {
    if (!API_KEY) {
      return res.status(500).json({ error: "ANTHROPIC_API_KEY não configurada no servidor" });
    }
    const { system, prompt, useSearch } = req.body || {};
    if (!prompt) return res.status(400).json({ error: "prompt ausente" });

    const body = {
      model: "claude-sonnet-4-6",
      max_tokens: 4000,
      system,
      messages: [{ role: "user", content: prompt }],
    };
    if (useSearch) {
      body.tools = [{ type: "web_search_20250305", name: "web_search", max_uses: 5 }];
    }

    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(body),
    });

    const data = await r.json();
    if (data.error) {
      return res.status(502).json({ error: data.error.message || "Erro da API Anthropic" });
    }
    if (!Array.isArray(data.content)) {
      return res.status(502).json({ error: "Resposta da API sem conteúdo" });
    }

    const text = data.content
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("\n")
      .trim();

    if (!text) return res.status(502).json({ error: "A IA não retornou texto" });

    const json = extractJSON(text);
    return res.json({ data: json });
  } catch (e) {
    return res.status(500).json({ error: e.message || "Erro interno" });
  }
});

app.listen(PORT, () => {
  console.log(`\n✅ Backend de cotação rodando em http://localhost:${PORT}`);
  console.log(`   Endpoint: POST http://localhost:${PORT}/api/search\n`);
});
