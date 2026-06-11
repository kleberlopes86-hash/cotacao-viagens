// Netlify Function: backend de busca com a API Anthropic + web search
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

export default async (req) => {
  const json = (obj, status = 200) =>
    new Response(JSON.stringify(obj), {
      status,
      headers: { "content-type": "application/json" },
    });

  try {
    const API_KEY = process.env.ANTHROPIC_API_KEY;
    if (!API_KEY) return json({ error: "ANTHROPIC_API_KEY não configurada no servidor" }, 500);

    const { system, prompt, useSearch } = await req.json();
    if (!prompt) return json({ error: "prompt ausente" }, 400);

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
    if (data.error) return json({ error: data.error.message || "Erro da API Anthropic" }, 502);
    if (!Array.isArray(data.content)) return json({ error: "Resposta da API sem conteúdo" }, 502);

    const text = data.content
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("\n")
      .trim();

    if (!text) return json({ error: "A IA não retornou texto" }, 502);

    return json({ data: extractJSON(text) });
  } catch (e) {
    return json({ error: e.message || "Erro interno" }, 500);
  }
};