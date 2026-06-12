import React, { useState, useCallback } from "react";

// ---------- Helpers ----------
const uid = () => Math.random().toString(36).slice(2, 9);

const BRL = (n) =>
  (Number(n) || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

const WD = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];

const parseDate = (s) => {
  if (!s) return null;
  const [y, m, d] = s.split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
};

const fmtDate = (s) => {
  const dt = parseDate(s);
  if (!dt) return "—";
  const dd = String(dt.getDate()).padStart(2, "0");
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}/${dt.getFullYear()}`;
};

const fmtDateFull = (s) => {
  const dt = parseDate(s);
  if (!dt) return "—";
  return `${fmtDate(s)} (${WD[dt.getDay()]})`;
};

const nightsBetween = (a, b) => {
  const da = parseDate(a);
  const db = parseDate(b);
  if (!da || !db) return 0;
  return Math.max(0, Math.round((db - da) / 86400000));
};

// ---------- Factories ----------
const newFlight = () => ({
  id: uid(),
  airline: "",
  fare: "",
  price: "",
  departTime: "",
  returnTime: "",
  stops: "",
  baggage: "",
  link: "",
  flexible: false,
});

const newHotel = () => ({
  id: uid(),
  name: "",
  checkin: "",
  checkout: "",
  daily: "",
  total: "",
  link: "",
});

const newCar = () => ({
  id: uid(),
  company: "",
  model: "",
  pickup: "",
  dropoff: "",
  dailyRate: "",
  protectionName: "Completa",
  protectionRate: "",
  extraName: "Carbon Free",
  extraRate: "",
  feePct: "15",
});

const PALETTE = ["#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899"];

const newOption = (index = 0) => ({
  id: uid(),
  name: `Opção ${index + 1}`,
  color: PALETTE[index % PALETTE.length],
  origin: "",
  originCode: "",
  destination: "",
  destinationCode: "",
  departDate: "",
  returnDate: "",
  event: "",
  baggageType: "checked", // checked | carryon
  flights: [],
  hotels: [],
  cars: [],
  hotelCountry: "",
  hotelCity: "",
  hotelArea: "",
  carCountry: "",
  carCity: "",
  carArea: "",
});

// ---------- Car cost math ----------
const carCosts = (car) => {
  const days = nightsBetween(car.pickup, car.dropoff) || 0;
  const daily = Number(car.dailyRate) || 0;
  const prot = Number(car.protectionRate) || 0;
  const extra = Number(car.extraRate) || 0;
  const feePct = Number(car.feePct) || 0;
  const dailySub = daily * days;
  const protSub = prot * days;
  const extraSub = extra * days;
  const subtotal = dailySub + protSub + extraSub;
  const fee = subtotal * (feePct / 100);
  const total = subtotal + fee;
  return { days, dailySub, protSub, extraSub, subtotal, fee, total };
};

const optionTotals = (opt) => {
  // soma de todos (mantida para exibir o subtotal de cada categoria, se quiser)
  const flightsAll = opt.flights.reduce((s, f) => s + (Number(f.price) || 0), 0);
  const hotelsAll = opt.hotels.reduce((s, h) => s + (Number(h.total) || 0), 0);
  const carsAll = opt.cars.reduce((s, c) => s + carCosts(c).total, 0);

  // menor preço de cada categoria (considera apenas valores > 0)
  const minPos = (arr) => {
    const positivos = arr.filter((v) => v > 0);
    return positivos.length ? Math.min(...positivos) : 0;
  };
  const flights = minPos(opt.flights.map((f) => Number(f.price) || 0));
  const hotels = minPos(opt.hotels.map((h) => Number(h.total) || 0));
  const cars = minPos(opt.cars.map((c) => carCosts(c).total));

  return {
    flights,
    hotels,
    cars,
    flightsAll,
    hotelsAll,
    carsAll,
    grand: flights + hotels + cars,
  };
};
// ---------- Styles ----------
const S = {
  page: { minHeight: "100vh", background: "#f1f5f9", fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif", color: "#0f172a" },
  header: { background: "#0f172a", color: "#fff", padding: "20px 24px" },
  card: { background: "#fff", borderRadius: 12, padding: 18, boxShadow: "0 1px 3px rgba(0,0,0,.08)", marginBottom: 16 },
  label: { fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 4, display: "block" },
  input: { width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 14, boxSizing: "border-box", background: "#fff", color: "#0f172a" },
  btn: { padding: "8px 14px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 14, fontWeight: 600 },
  pill: { padding: "4px 10px", borderRadius: 999, fontSize: 12, fontWeight: 600, textDecoration: "none", display: "inline-block", margin: "2px 4px 2px 0" },
  sectionTitle: { fontSize: 16, fontWeight: 700, margin: "4px 0 12px" },
};

const grid = (cols) => ({ display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 10 });

// ---------- API helper ----------
// Extrai o primeiro array/objeto JSON balanceado de um texto
function extractJSON(text) {
  const clean = text.replace(/```json/gi, "").replace(/```/g, "");
  for (let i = 0; i < clean.length; i++) {
    const ch = clean[i];
    if (ch !== "[" && ch !== "{") continue;
    const open = ch;
    const close = ch === "[" ? "]" : "}";
    let depth = 0;
    let inStr = false;
    let esc = false;
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
          const candidate = clean.slice(i, j + 1);
          try {
            return JSON.parse(candidate);
          } catch {
            break; // tenta a partir do próximo abre-colchete
          }
        }
      }
    }
  }
  throw new Error("Não foi possível extrair JSON da resposta");
}

// Detecta se está rodando dentro do Claude.ai (onde a chamada direta à API
// é autorizada). Fora dele, usa o backend local em /api/search.
const IN_CLAUDE = typeof window !== "undefined" && /claude\.ai|claudeusercontent/.test(window.location.host);

async function callClaude(systemPrompt, userPrompt, useSearch) {
  // ---- Caminho 1: fora do Claude.ai → backend próprio ----
  if (!IN_CLAUDE) {
    let res;
    try {
      res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ system: systemPrompt, prompt: userPrompt, useSearch }),
      });
    } catch (e) {
      throw new Error("Backend indisponível. Rode 'npm run server' (porta 8787).");
    }
    const out = await res.json();
    if (!res.ok || out.error) throw new Error(out.error || "Erro do backend");
    return out.data;
  }

  // ---- Caminho 2: dentro do Claude.ai → chamada direta ----
  const body = {
    model: "claude-sonnet-4-20250514",
    max_tokens: 4000,
    system: systemPrompt,
    messages: [{ role: "user", content: userPrompt }],
  };
  if (useSearch)
    body.tools = [{ type: "web_search_20250305", name: "web_search", max_uses: 5 }];

  let res;
  try {
    res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch (e) {
    throw new Error("Falha de rede ao chamar a API");
  }

  const data = await res.json();

  if (data.error) {
    throw new Error(data.error.message || "Erro retornado pela API");
  }
  if (!Array.isArray(data.content)) {
    throw new Error("Resposta da API sem conteúdo");
  }

  const text = data.content
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("\n")
    .trim();

  if (!text) {
    throw new Error("A IA não retornou texto (verifique web search/limites)");
  }

  return extractJSON(text);
}

// ============================================================
export default function App() {
  const [projectName, setProjectName] = useState("");
  const [clientName, setClientName] = useState("");
  const [options, setOptions] = useState([]);
  const [active, setActive] = useState(0);
  const [toasts, setToasts] = useState([]);
  const [showPreview, setShowPreview] = useState(false);
  const [progress, setProgress] = useState(null); // {step}
  const [loading, setLoading] = useState(null); // "flights" | "hotels" | "cars" | null

  const toast = useCallback((msg, type = "success") => {
    const id = uid();
    setToasts((t) => [...t, { id, msg, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), type === "error" ? 9000 : 3500);
  }, []);

  const opt = options[active];

  const updateOption = useCallback((id, patch) => {
    setOptions((opts) => opts.map((o) => (o.id === id ? { ...o, ...patch } : o)));
  }, []);

  const addOption = () => {
    setOptions((opts) => {
      const next = [...opts, newOption(opts.length)];
      setActive(next.length - 1);
      return next;
    });
  };

  const removeOption = (id) => {
    setOptions((opts) => {
      const idx = opts.findIndex((o) => o.id === id);
      const next = opts.filter((o) => o.id !== id);
      setActive((a) => Math.max(0, Math.min(a, next.length - 1)) || 0);
      if (idx <= active) setActive((a) => Math.max(0, a - 1));
      return next;
    });
  };

  // ----- list item helpers -----
  const addItem = (kind, factory) => updateOption(opt.id, { [kind]: [...opt[kind], factory()] });
  const updItem = (kind, itemId, patch) =>
    updateOption(opt.id, { [kind]: opt[kind].map((i) => (i.id === itemId ? { ...i, ...patch } : i)) });
  const delItem = (kind, itemId) => updateOption(opt.id, { [kind]: opt[kind].filter((i) => i.id !== itemId) });

  // ----- AI searches -----
  const searchFlights = async (o = opt) => {
    const bag =
      o.baggageType === "checked"
        ? "com bagagem despachada incluída"
        : "apenas com bagagem de mão";
    const sys =
      "Você é assistente de cotação de viagens. Responda APENAS com um array JSON puro, sem markdown, sem texto extra. Cada item: {airline, fare, price, departTime, returnTime, stops, baggage, link}. price em número (BRL). departTime/returnTime no formato HH:MM. link deve ser o site oficial da companhia (LATAM=https://www.latamairlines.com/br/pt, GOL=https://www.voegol.com.br, Azul=https://www.voeazul.com.br, American=https://www.aa.com, United=https://www.united.com, Delta=https://www.delta.com, Copa=https://www.copaair.com).";
    const usr = `Pesquise 3 voos de companhias DIFERENTES (LATAM, GOL, Azul, American, United, Delta ou Copa) de ${o.origin} (${o.originCode}) para ${o.destination} (${o.destinationCode}), ida ${fmtDate(o.departDate)} volta ${fmtDate(o.returnDate)}, ${bag}. Inclua horários aproximados, escalas e preços em BRL.`;
    const arr = await callClaude(sys, usr, true);
    const flights = arr.slice(0, 3).map((f) => ({
      ...newFlight(),
      airline: f.airline || "",
      fare: f.fare || "",
      price: String(f.price ?? ""),
      departTime: f.departTime || "",
      returnTime: f.returnTime || "",
      stops: f.stops || "",
      baggage: f.baggage || (o.baggageType === "checked" ? "Despachada" : "Mão"),
      link: f.link || "",
    }));
    updateOption(o.id, { flights });
  };

  const searchHotels = async (o = opt) => {
    const sys =
      "Você é assistente de cotação. Responda APENAS com array JSON puro, sem texto fora do array. Cada item DEVE ter os campos: {name, daily, total, link}. O campo 'name' é OBRIGATÓRIO e deve conter o nome real e completo do hotel (ex: 'Hilton Grand Vacations Club'), nunca vazio, nunca genérico como 'Hotel 1'. Pesquise EXCLUSIVAMENTE no Hotels.com. O 'link' deve ser a URL direta do hotel no formato https://www.hotels.com/ho{numero}/{slug}/ . Se não tiver certeza da URL, use https://www.hotels.com/. daily e total em número (BRL).";
    const usr = `Pesquise 3 hotéis reais no Hotels.com em ${[o.hotelArea, o.hotelCity, o.hotelCountry].filter(Boolean).join(", ") || o.destination}, check-in ${fmtDate(o.departDate)}, check-out ${fmtDate(o.returnDate)}. Para cada hotel informe o NOME REAL do estabelecimento, a diária e o total em BRL. Não invente nomes genéricos.`;
    const arr = await callClaude(sys, usr, true);
    const nights = nightsBetween(o.departDate, o.returnDate) || 1;
    const hotels = arr.slice(0, 3).map((h) => {
      const link = /hotels\.com\/ho/i.test(h.link || "") ? h.link : "https://www.hotels.com/";
      const daily = Number(h.daily) || 0;
      return {
        ...newHotel(),
        name: h.name || h.hotel || h.nome || "Hotel sugerido",
        checkin: o.departDate,
        checkout: o.returnDate,
        daily: String(daily || ""),
        total: String(h.total ?? daily * nights),
        link,
      };
    });
    updateOption(o.id, { hotels });
  };

  const searchCars = async (o = opt) => {
    const sys =
      "Você é assistente de cotação. Responda APENAS com array JSON puro. Cada item: {company, model, dailyRate, link}. Pesquise 1 opção de cada locadora: Movida, Localiza e KINTO. dailyRate número BRL. link: Movida=https://www.movida.com.br, Localiza=https://www.localiza.com, KINTO=https://www.kintobrasil.com.br";
    const usr = `Pesquise aluguel de carro (1 Movida, 1 Localiza, 1 KINTO) em ${[o.carArea, o.carCity, o.carCountry].filter(Boolean).join(", ") || o.destination}, retirada ${fmtDate(o.departDate)}, devolução ${fmtDate(o.returnDate)}. Diária em BRL.`;
    const arr = await callClaude(sys, usr, true);
    const cars = arr.slice(0, 3).map((c) => ({
      ...newCar(),
      company: c.company || "",
      model: c.model || "",
      pickup: o.departDate,
      dropoff: o.returnDate,
      dailyRate: String(c.dailyRate ?? ""),
    }));
    updateOption(o.id, { cars });
  };

  const runOne = async (kind, fn, label) => {
    if (!opt) return;
    if (!opt.destination) {
      toast("Preencha o destino antes de pesquisar", "error");
      return;
    }
    setLoading(kind);
    try {
      await fn();
      toast(`${label} pesquisados com sucesso`);
    } catch (e) {
      toast(`Erro ao pesquisar ${label.toLowerCase()}: ${e.message}`, "error");
    } finally {
      setLoading(null);
    }
  };

  const searchAll = async () => {
    if (!opt) return;
    const o = opt;
    try {
      setProgress("flights");
      await searchFlights(o);
      setProgress("hotels");
      await searchHotels(o);
      setProgress("cars");
      await searchCars(o);
      setProgress(null);
      toast("Pesquisa completa concluída");
    } catch (e) {
      setProgress(null);
      toast(`Erro durante a pesquisa completa: ${e.message}`, "error");
    }
  };

  // ----- Export HTML -----
  const buildHTML = () => {
    const gen = new Date().toLocaleString("pt-BR");
    const blocks = options
      .map((o) => {
        const t = optionTotals(o);
        const bag = o.baggageType === "checked" ? "🧳 Com bagagem despachada" : "🎒 Só bagagem de mão";
        const flightRows = o.flights
          .map(
            (f) => `<tr>
              <td>${f.airline || "—"}</td><td>${f.fare || "—"}</td>
              <td>${fmtDateFull(o.departDate)}<br>${f.departTime || ""}</td>
              <td>${fmtDateFull(o.returnDate)}<br>${f.returnTime || ""}</td>
              <td>${f.stops || "—"}</td><td>${f.baggage || "—"}</td>
              <td><b>${BRL(f.price)}</b></td>
              <td>${f.link ? `<a href="${f.link}" target="_blank" rel="noopener">Ver ↗</a>` : "—"}</td>
            </tr>`
          )
          .join("");
        const hotelRows = o.hotels
          .map(
            (h) => `<tr>
              <td>${h.name || "—"}</td><td>${fmtDate(h.checkin)}</td><td>${fmtDate(h.checkout)}</td>
              <td>${BRL(h.daily)}</td><td><b>${BRL(h.total)}</b></td>
              <td>${h.link ? `<a href="${h.link}" target="_blank" rel="noopener">Ver ↗</a>` : "—"}</td>
            </tr>`
          )
          .join("");
        const carCards = o.cars
          .map((c) => {
            const cc = carCosts(c);
            return `<div style="border:1px solid #e2e8f0;border-radius:8px;padding:12px;margin-bottom:10px">
              <b>${c.company || "—"}${c.model ? " · " + c.model : ""}</b>
              <div style="font-size:13px;color:#64748b">${fmtDate(c.pickup)} → ${fmtDate(c.dropoff)} · ${cc.days} dia(s)</div>
              <table style="width:100%;border-collapse:collapse;font-size:13px;margin-top:8px">
                <tr><td>Diária</td><td>${BRL(c.dailyRate)} × ${cc.days}</td><td style="text-align:right">${BRL(cc.dailySub)}</td></tr>
                <tr><td>${c.protectionName}</td><td>${BRL(c.protectionRate)} × ${cc.days}</td><td style="text-align:right">${BRL(cc.protSub)}</td></tr>
                <tr><td>${c.extraName}</td><td>${BRL(c.extraRate)} × ${cc.days}</td><td style="text-align:right">${BRL(cc.extraSub)}</td></tr>
                <tr><td>Taxa de locação</td><td>${c.feePct}%</td><td style="text-align:right">${BRL(cc.fee)}</td></tr>
                <tr style="font-weight:700;border-top:1px solid #e2e8f0"><td>Total</td><td></td><td style="text-align:right;color:#059669">${BRL(cc.total)}</td></tr>
              </table></div>`;
          })
          .join("");

        return `<section style="margin-bottom:28px;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden">
          <div style="background:${o.color};color:#fff;padding:14px 18px">
            <h2 style="margin:0;font-size:18px">${o.name} — ${o.origin || "?"} (${o.originCode}) → ${o.destination || "?"} (${o.destinationCode})</h2>
            <div style="opacity:.9;font-size:13px">${fmtDateFull(o.departDate)} → ${fmtDateFull(o.returnDate)} · ${bag}</div>
          </div>
          <div style="padding:16px">
            <h3 style="margin:0 0 8px">✈️ Voos</h3>
            ${o.flights.length ? `<table style="width:100%;border-collapse:collapse;font-size:13px"><thead><tr style="background:#f1f5f9"><th>Cia</th><th>Tarifa</th><th>🛫 Ida</th><th>🛬 Volta</th><th>Escalas</th><th>Bagagem</th><th>Preço</th><th>Link</th></tr></thead><tbody>${flightRows}</tbody></table>` : "<i>Sem voos</i>"}
            <h3 style="margin:16px 0 8px">🏨 Hospedagem</h3>
            ${o.hotels.length ? `<table style="width:100%;border-collapse:collapse;font-size:13px"><thead><tr style="background:#f1f5f9"><th>Hotel</th><th>Check-in</th><th>Check-out</th><th>Diária</th><th>Total</th><th>Link</th></tr></thead><tbody>${hotelRows}</tbody></table>` : "<i>Sem hotéis</i>"}
            <h3 style="margin:16px 0 8px">🚗 Aluguel de Carro</h3>
            ${o.cars.length ? carCards : "<i>Sem carros</i>"}
            <div style="background:linear-gradient(135deg,#0f172a,#1e293b);color:#fff;border-radius:10px;padding:16px;margin-top:16px">
              <div>✈️ Voos: <b>${BRL(t.flights)}</b></div>
              <div>🏨 Hospedagem: <b>${BRL(t.hotels)}</b></div>
              <div>🚗 Aluguel de Carro: <b>${BRL(t.cars)}</b></div>
              <div style="margin-top:8px;font-size:22px;font-weight:800;color:#4ade80">TOTAL GERAL: ${BRL(t.grand)}</div>
            </div>
          </div>
        </section>`;
      })
      .join("");

    return `<div style="font-family:system-ui,sans-serif;max-width:900px;margin:0 auto;color:#0f172a">
      <h1 style="margin:0 0 4px">✈️ Cotação de Viagem</h1>
      <div style="color:#475569;margin-bottom:4px"><b>Projeto:</b> ${projectName || "—"} · <b>Cliente:</b> ${clientName || "—"}</div>
      <div style="color:#94a3b8;font-size:12px;margin-bottom:20px">Gerado em ${gen}</div>
      ${blocks || "<i>Nenhuma opção cadastrada</i>"}
    </div>`;
  };

  const downloadPDF = () => {
    const payload = { clientName, projectName, options };
    if (typeof sendPrompt === "function") {
      sendPrompt("__PDF__" + JSON.stringify(payload));
      toast("Enviado ao chat para gerar PDF");
    } else {
      toast("sendPrompt indisponível neste ambiente", "error");
    }
  };

  const copyHTML = async () => {
    try {
      await navigator.clipboard.writeText(buildHTML());
      toast("HTML copiado");
    } catch {
      toast("Não foi possível copiar", "error");
    }
  };

  // ============================================================
  return (
    <div style={S.page}>
      {/* Toasts */}
      <div style={{ position: "fixed", top: 16, right: 16, zIndex: 9999, display: "flex", flexDirection: "column", gap: 8 }}>
        {toasts.map((t) => (
          <div key={t.id} style={{ ...S.btn, cursor: "default", color: "#fff", background: t.type === "error" ? "#dc2626" : "#16a34a", boxShadow: "0 4px 12px rgba(0,0,0,.2)" }}>
            {t.type === "error" ? "⚠ " : "✓ "}
            {t.msg}
          </div>
        ))}
      </div>

      {/* Header */}
      <div style={S.header}>
        <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 12, alignItems: "flex-start" }}>
          <div>
            <div style={{ fontSize: 24, fontWeight: 800 }}>✈️ Sistema de Cotação</div>
            <div style={{ color: "#94a3b8", fontSize: 13 }}>Preenchimento automático com IA</div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button style={{ ...S.btn, background: "#334155", color: "#fff" }} onClick={() => setShowPreview(true)}>📄 Ver Cotação</button>
            <button style={{ ...S.btn, background: "#22c55e", color: "#fff" }} onClick={downloadPDF}>⬇ Baixar PDF</button>
          </div>
        </div>
        <div style={{ ...grid(2), marginTop: 14, maxWidth: 560 }}>
          <div>
            <label style={{ ...S.label, color: "#94a3b8" }}>Projeto</label>
            <input style={S.input} placeholder="Champs Trade Show 2026" value={projectName} onChange={(e) => setProjectName(e.target.value)} />
          </div>
          <div>
            <label style={{ ...S.label, color: "#94a3b8" }}>Cliente</label>
            <input style={S.input} placeholder="Bruna Andrade" value={clientName} onChange={(e) => setClientName(e.target.value)} />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "12px 16px", flexWrap: "wrap", background: "#fff", borderBottom: "1px solid #e2e8f0" }}>
        {options.map((o, i) => (
          <div key={o.id} onClick={() => setActive(i)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 12px", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: 13, background: i === active ? o.color : "#f1f5f9", color: i === active ? "#fff" : "#334155", border: `1px solid ${i === active ? o.color : "#e2e8f0"}` }}>
            <span style={{ width: 8, height: 8, borderRadius: 999, background: i === active ? "#fff" : o.color }} />
            {o.name}: {o.destination || "—"}
            <span onClick={(e) => { e.stopPropagation(); removeOption(o.id); }} style={{ marginLeft: 4, opacity: 0.8, fontWeight: 800 }}>✕</span>
          </div>
        ))}
        <button style={{ ...S.btn, background: "#0f172a", color: "#fff", padding: "8px 12px" }} onClick={addOption}>+</button>
      </div>

      {/* Empty state */}
      {options.length === 0 && (
        <div style={{ textAlign: "center", padding: "80px 20px", color: "#64748b" }}>
          <div style={{ fontSize: 48 }}>🗺️</div>
          <h2 style={{ margin: "12px 0" }}>Nenhuma opção de viagem ainda</h2>
          <p>Comece criando sua primeira cotação.</p>
          <button style={{ ...S.btn, background: "#0f172a", color: "#fff", fontSize: 16, padding: "12px 20px", marginTop: 8 }} onClick={addOption}>+ Nova Opção de Viagem</button>
        </div>
      )}

      {/* Active option content */}
      {opt && (
        <div style={{ padding: 16, maxWidth: 1100, margin: "0 auto" }}>
          {/* Pesquisar tudo */}
          <div style={{ background: "linear-gradient(135deg,#7c3aed,#a855f7)", color: "#fff", borderRadius: 12, padding: 16, marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
              <div>
                <div style={{ fontWeight: 800, fontSize: 16 }}>🤖 Pesquisar Tudo</div>
                <div style={{ opacity: 0.9, fontSize: 13 }}>Voos, hotéis e carros em sequência</div>
              </div>
              <button style={{ ...S.btn, background: "#fff", color: "#7c3aed" }} onClick={searchAll} disabled={!!progress}>
                {progress ? "Pesquisando…" : "Iniciar"}
              </button>
            </div>
            {progress && (
              <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                {[["flights", "✈️ Voos"], ["hotels", "🏨 Hotéis"], ["cars", "🚗 Carros"]].map(([k, lbl]) => (
                  <div key={k} style={{ flex: 1, padding: 8, borderRadius: 8, textAlign: "center", fontSize: 12, fontWeight: 600, background: progress === k ? "#fff" : "rgba(255,255,255,.2)", color: progress === k ? "#7c3aed" : "#fff" }}>{lbl}</div>
                ))}
              </div>
            )}
          </div>

          {/* Dados da viagem */}
          <div style={S.card}>
            <div style={S.sectionTitle}>Dados da Viagem</div>
            <div style={{ ...grid(2), marginBottom: 10 }}>
              <div>
                <label style={S.label}>Nome da opção</label>
                <input style={S.input} value={opt.name} onChange={(e) => updateOption(opt.id, { name: e.target.value })} />
              </div>
              <div>
                <label style={S.label}>Cor</label>
                <input type="color" style={{ ...S.input, height: 38, padding: 4 }} value={opt.color} onChange={(e) => updateOption(opt.id, { color: e.target.value })} />
              </div>
            </div>
            <div style={{ ...grid(4), marginBottom: 10 }}>
              <div><label style={S.label}>Origem</label><input style={S.input} placeholder="São Paulo" value={opt.origin} onChange={(e) => updateOption(opt.id, { origin: e.target.value })} /></div>
              <div><label style={S.label}>Código</label><input style={S.input} placeholder="GRU" value={opt.originCode} onChange={(e) => updateOption(opt.id, { originCode: e.target.value })} /></div>
              <div><label style={S.label}>Destino</label><input style={S.input} placeholder="Las Vegas" value={opt.destination} onChange={(e) => updateOption(opt.id, { destination: e.target.value })} /></div>
              <div><label style={S.label}>Código</label><input style={S.input} placeholder="LAS" value={opt.destinationCode} onChange={(e) => updateOption(opt.id, { destinationCode: e.target.value })} /></div>
            </div>
            <div style={{ ...grid(3), marginBottom: 10 }}>
              <div><label style={S.label}>Data ida</label><input type="date" style={S.input} value={opt.departDate} onChange={(e) => updateOption(opt.id, { departDate: e.target.value })} /></div>
              <div><label style={S.label}>Data volta</label><input type="date" style={S.input} value={opt.returnDate} onChange={(e) => updateOption(opt.id, { returnDate: e.target.value })} /></div>
              <div><label style={S.label}>Evento</label><input style={S.input} value={opt.event} onChange={(e) => updateOption(opt.id, { event: e.target.value })} /></div>
            </div>
            <div style={{ marginBottom: 10 }}>
              <label style={S.label}>Tipo de bagagem</label>
              <div style={{ display: "flex", gap: 8 }}>
                {[["checked", "🧳 Com bagagem despachada"], ["carryon", "🎒 Só bagagem de mão"]].map(([k, lbl]) => (
                  <button key={k} onClick={() => updateOption(opt.id, { baggageType: k })} style={{ ...S.btn, flex: 1, background: opt.baggageType === k ? opt.color : "#f1f5f9", color: opt.baggageType === k ? "#fff" : "#334155", border: "1px solid #e2e8f0" }}>{lbl}</button>
                ))}
              </div>
            </div>
            <div style={{ background: "#f8fafc", borderRadius: 8, padding: 10, fontSize: 13, color: "#475569" }}>
              {fmtDateFull(opt.departDate)} → {fmtDateFull(opt.returnDate)} · {nightsBetween(opt.departDate, opt.returnDate)} noites · {opt.baggageType === "checked" ? "🧳 Com despacho" : "🎒 Só mão"}
            </div>

            {/* Links rápidos */}
            <div style={{ marginTop: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 4 }}>Buscar voos</div>
              {[["Kayak", "https://www.kayak.com.br/flights"], ["Google Flights", "https://www.google.com/travel/flights"], ["Skyscanner", "https://www.skyscanner.com.br"], ["Decolar", "https://www.decolar.com"]].map(([n, u]) => (
                <a key={n} href={u} target="_blank" rel="noopener noreferrer" style={{ ...S.pill, background: "#dbeafe", color: "#1e40af" }}>{n}</a>
              ))}
              <div style={{ fontSize: 12, fontWeight: 700, color: "#475569", margin: "6px 0 4px" }}>Buscar hotéis</div>
              <a href="https://www.hotels.com" target="_blank" rel="noopener noreferrer" style={{ ...S.pill, background: "#fce7f3", color: "#9d174d" }}>Hotels.com</a>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#475569", margin: "6px 0 4px" }}>Buscar carros</div>
              {[["Movida", "https://www.movida.com.br"], ["Localiza", "https://www.localiza.com"], ["KINTO", "https://www.kintobrasil.com.br"]].map(([n, u]) => (
                <a key={n} href={u} target="_blank" rel="noopener noreferrer" style={{ ...S.pill, background: "#dcfce7", color: "#166534" }}>{n}</a>
              ))}
            </div>
          </div>

          {/* VOOS */}
          <div style={S.card}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div style={S.sectionTitle}>✈️ Voos</div>
              <div style={{ display: "flex", gap: 8 }}>
                <button style={{ ...S.btn, background: "#7c3aed", color: "#fff", opacity: loading === "flights" ? 0.6 : 1 }} disabled={loading === "flights"} onClick={() => runOne("flights", () => searchFlights(), "Voos")}>{loading === "flights" ? "⏳ Pesquisando…" : "🤖 Pesquisar Voos"}</button>
                <button style={{ ...S.btn, background: "#e2e8f0", color: "#334155" }} onClick={() => addItem("flights", newFlight)}>+ Voo</button>
              </div>
            </div>
            {opt.flights.map((f) => (
              <div key={f.id} style={{ border: "1px solid #e2e8f0", borderRadius: 10, padding: 12, marginBottom: 10 }}>
                <div style={{ display: "flex", gap: 8, fontSize: 12, background: "#f1f5f9", borderRadius: 8, padding: 8, marginBottom: 10, flexWrap: "wrap" }}>
                  <span>🛫 Ida: {fmtDateFull(opt.departDate)} {f.departTime}</span>
                  <span>| 🛬 Volta: {fmtDateFull(opt.returnDate)} {f.returnTime}</span>
                  <span>| 🔄 {f.stops || "Escalas?"}</span>
                </div>
                <div style={{ ...grid(3), marginBottom: 8 }}>
                  <div><label style={S.label}>Cia Aérea</label><input style={S.input} value={f.airline} onChange={(e) => updItem("flights", f.id, { airline: e.target.value })} /></div>
                  <div><label style={S.label}>Tarifa</label><input style={S.input} value={f.fare} onChange={(e) => updItem("flights", f.id, { fare: e.target.value })} /></div>
                  <div><label style={S.label}>Preço (R$)</label><input type="number" style={S.input} value={f.price} onChange={(e) => updItem("flights", f.id, { price: e.target.value })} /></div>
                </div>
                <div style={{ ...grid(3), marginBottom: 8 }}>
                  <div><label style={S.label}>Horário Ida</label><input type="time" style={S.input} value={f.departTime} onChange={(e) => updItem("flights", f.id, { departTime: e.target.value })} /></div>
                  <div><label style={S.label}>Horário Volta</label><input type="time" style={S.input} value={f.returnTime} onChange={(e) => updItem("flights", f.id, { returnTime: e.target.value })} /></div>
                  <div><label style={S.label}>Escalas</label><input style={S.input} value={f.stops} onChange={(e) => updItem("flights", f.id, { stops: e.target.value })} /></div>
                </div>
                <div style={{ ...grid(2), marginBottom: 8 }}>
                  <div><label style={S.label}>Bagagem</label><input style={S.input} value={f.baggage} onChange={(e) => updItem("flights", f.id, { baggage: e.target.value })} /></div>
                  <div><label style={S.label}>Link da oferta</label><input style={S.input} value={f.link} onChange={(e) => updItem("flights", f.id, { link: e.target.value })} /></div>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <label style={{ fontSize: 13, display: "flex", gap: 6, alignItems: "center" }}>
                    <input type="checkbox" checked={f.flexible} onChange={(e) => updItem("flights", f.id, { flexible: e.target.checked })} /> Alteração flexível
                  </label>
                  <button style={{ ...S.btn, background: "#fee2e2", color: "#b91c1c" }} onClick={() => delItem("flights", f.id)}>✕ Remover</button>
                </div>
              </div>
            ))}
            {opt.flights.length === 0 && <div style={{ color: "#94a3b8", fontSize: 13 }}>Nenhum voo adicionado.</div>}
          </div>

          {/* HOSPEDAGEM */}
          <div style={S.card}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div style={S.sectionTitle}>🏨 Hospedagem</div>
              <div style={{ display: "flex", gap: 8 }}>
                <button style={{ ...S.btn, background: "#7c3aed", color: "#fff", opacity: loading === "hotels" ? 0.6 : 1 }} disabled={loading === "hotels"} onClick={() => runOne("hotels", () => searchHotels(), "Hotéis")}>{loading === "hotels" ? "⏳ Pesquisando…" : "🤖 Pesquisar Hotéis"}</button>
                <button style={{ ...S.btn, background: "#e2e8f0", color: "#334155" }} onClick={() => addItem("hotels", newHotel)}>+ Hotel</button>
              </div>
            </div>
            <div style={{ background: "#f8fafc", borderRadius: 8, padding: 10, marginBottom: 10 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 6 }}>📍 Filtro de localização</div>
              <div style={grid(3)}>
                <input style={S.input} placeholder="País" value={opt.hotelCountry} onChange={(e) => updateOption(opt.id, { hotelCountry: e.target.value })} />
                <input style={S.input} placeholder="Cidade" value={opt.hotelCity} onChange={(e) => updateOption(opt.id, { hotelCity: e.target.value })} />
                <input style={S.input} placeholder="Bairro/Região" value={opt.hotelArea} onChange={(e) => updateOption(opt.id, { hotelArea: e.target.value })} />
              </div>
            </div>
            {opt.hotels.map((h) => (
              <div key={h.id} style={{ border: "1px solid #e2e8f0", borderRadius: 10, padding: 12, marginBottom: 10 }}>
                <div style={{ ...grid(3), marginBottom: 8 }}>
                  <div><label style={S.label}>Nome do Hotel</label><input style={S.input} value={h.name} onChange={(e) => updItem("hotels", h.id, { name: e.target.value })} /></div>
                  <div><label style={S.label}>Check-in</label><input type="date" style={S.input} value={h.checkin} onChange={(e) => updItem("hotels", h.id, { checkin: e.target.value })} /></div>
                  <div><label style={S.label}>Check-out</label><input type="date" style={S.input} value={h.checkout} onChange={(e) => updItem("hotels", h.id, { checkout: e.target.value })} /></div>
                </div>
                <div style={{ ...grid(3), marginBottom: 8 }}>
                  <div><label style={S.label}>Diária (R$)</label><input type="number" style={S.input} value={h.daily} onChange={(e) => updItem("hotels", h.id, { daily: e.target.value })} /></div>
                  <div><label style={S.label}>Total (R$)</label><input type="number" style={S.input} value={h.total} onChange={(e) => updItem("hotels", h.id, { total: e.target.value })} /></div>
                  <div><label style={S.label}>Link</label><input style={S.input} value={h.link} onChange={(e) => updItem("hotels", h.id, { link: e.target.value })} /></div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <button style={{ ...S.btn, background: "#fee2e2", color: "#b91c1c" }} onClick={() => delItem("hotels", h.id)}>✕ Remover</button>
                </div>
              </div>
            ))}
            {opt.hotels.length === 0 && <div style={{ color: "#94a3b8", fontSize: 13 }}>Nenhum hotel adicionado.</div>}
          </div>

          {/* CARROS */}
          <div style={S.card}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div style={S.sectionTitle}>🚗 Aluguel de Carro</div>
              <div style={{ display: "flex", gap: 8 }}>
                <button style={{ ...S.btn, background: "#7c3aed", color: "#fff", opacity: loading === "cars" ? 0.6 : 1 }} disabled={loading === "cars"} onClick={() => runOne("cars", () => searchCars(), "Carros")}>{loading === "cars" ? "⏳ Pesquisando…" : "🤖 Pesquisar Carros"}</button>
                <button style={{ ...S.btn, background: "#e2e8f0", color: "#334155" }} onClick={() => addItem("cars", newCar)}>+ Carro</button>
              </div>
            </div>
            <div style={{ background: "#f8fafc", borderRadius: 8, padding: 10, marginBottom: 10 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 6 }}>📍 Local de retirada</div>
              <div style={grid(3)}>
                <input style={S.input} placeholder="País" value={opt.carCountry} onChange={(e) => updateOption(opt.id, { carCountry: e.target.value })} />
                <input style={S.input} placeholder="Cidade" value={opt.carCity} onChange={(e) => updateOption(opt.id, { carCity: e.target.value })} />
                <input style={S.input} placeholder="Bairro/Região" value={opt.carArea} onChange={(e) => updateOption(opt.id, { carArea: e.target.value })} />
              </div>
            </div>
            {opt.cars.map((c) => {
              const cc = carCosts(c);
              return (
                <div key={c.id} style={{ border: "1px solid #e2e8f0", borderRadius: 10, padding: 12, marginBottom: 10 }}>
                  <div style={{ ...grid(4), marginBottom: 8 }}>
                    <div><label style={S.label}>Locadora</label><input style={S.input} value={c.company} onChange={(e) => updItem("cars", c.id, { company: e.target.value })} /></div>
                    <div><label style={S.label}>Modelo</label><input style={S.input} value={c.model} onChange={(e) => updItem("cars", c.id, { model: e.target.value })} /></div>
                    <div><label style={S.label}>Retirada</label><input type="date" style={S.input} value={c.pickup} onChange={(e) => updItem("cars", c.id, { pickup: e.target.value })} /></div>
                    <div><label style={S.label}>Devolução</label><input type="date" style={S.input} value={c.dropoff} onChange={(e) => updItem("cars", c.id, { dropoff: e.target.value })} /></div>
                  </div>
                  <div style={{ background: "#f8fafc", borderRadius: 8, padding: 10 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 8 }}>💰 Detalhamento de custos · {cc.days} dia(s)</div>
                    <div style={{ ...grid(3), marginBottom: 6, alignItems: "end" }}>
                      <div><label style={S.label}>Diária (R$/dia)</label><input type="number" style={S.input} value={c.dailyRate} onChange={(e) => updItem("cars", c.id, { dailyRate: e.target.value })} /></div>
                      <div style={{ gridColumn: "span 2", textAlign: "right", fontSize: 13, color: "#475569" }}>Subtotal: <b>{BRL(cc.dailySub)}</b></div>
                    </div>
                    <div style={{ ...grid(3), marginBottom: 6, alignItems: "end" }}>
                      <div><label style={S.label}>Proteção (nome)</label><input style={S.input} value={c.protectionName} onChange={(e) => updItem("cars", c.id, { protectionName: e.target.value })} /></div>
                      <div><label style={S.label}>R$/dia</label><input type="number" style={S.input} value={c.protectionRate} onChange={(e) => updItem("cars", c.id, { protectionRate: e.target.value })} /></div>
                      <div style={{ textAlign: "right", fontSize: 13, color: "#475569" }}>Subtotal: <b>{BRL(cc.protSub)}</b></div>
                    </div>
                    <div style={{ ...grid(3), marginBottom: 6, alignItems: "end" }}>
                      <div><label style={S.label}>Adicional (nome)</label><input style={S.input} value={c.extraName} onChange={(e) => updItem("cars", c.id, { extraName: e.target.value })} /></div>
                      <div><label style={S.label}>R$/dia</label><input type="number" style={S.input} value={c.extraRate} onChange={(e) => updItem("cars", c.id, { extraRate: e.target.value })} /></div>
                      <div style={{ textAlign: "right", fontSize: 13, color: "#475569" }}>Subtotal: <b>{BRL(cc.extraSub)}</b></div>
                    </div>
                    <div style={{ ...grid(3), marginBottom: 6, alignItems: "end" }}>
                      <div><label style={S.label}>Taxa fixa (%)</label><input type="number" style={S.input} value={c.feePct} onChange={(e) => updItem("cars", c.id, { feePct: e.target.value })} /></div>
                      <div style={{ gridColumn: "span 2", textAlign: "right", fontSize: 13, color: "#475569" }}>Taxa: <b>{BRL(cc.fee)}</b></div>
                    </div>
                    <div style={{ background: "#dcfce7", color: "#166534", borderRadius: 8, padding: 10, fontWeight: 800, textAlign: "right" }}>Total: {BRL(cc.total)}</div>
                  </div>
                  <div style={{ textAlign: "right", marginTop: 8 }}>
                    <button style={{ ...S.btn, background: "#fee2e2", color: "#b91c1c" }} onClick={() => delItem("cars", c.id)}>✕ Remover</button>
                  </div>
                </div>
              );
            })}
            {opt.cars.length === 0 && <div style={{ color: "#94a3b8", fontSize: 13 }}>Nenhum carro adicionado.</div>}
            {opt.cars.length > 0 && (
              <div style={{ background: "#16a34a", color: "#fff", borderRadius: 8, padding: 12, fontWeight: 800, textAlign: "right", marginTop: 4 }}>
                🚗 Total Aluguel de Carros: {BRL(optionTotals(opt).cars)}
              </div>
            )}
          </div>

          {/* RESUMO FINANCEIRO */}
          {(() => {
            const t = optionTotals(opt);
            return (
              <div style={{ background: "linear-gradient(135deg,#0f172a,#1e293b)", color: "#fff", borderRadius: 12, padding: 20 }}>
                <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>📊 Resumo Financeiro</div>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #334155" }}><span>✈️ Voos</span><b>{BRL(t.flights)}</b></div>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #334155" }}><span>🏨 Hospedagem</span><b>{BRL(t.hotels)}</b></div>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #334155" }}><span>🚗 Aluguel de Carro</span><b>{BRL(t.cars)}</b></div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12 }}>
                  <span style={{ fontWeight: 700 }}>TOTAL GERAL</span>
                  <span style={{ fontSize: 28, fontWeight: 800, color: "#4ade80" }}>{BRL(t.grand)}</span>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* Preview Modal */}
      {showPreview && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", zIndex: 9998, display: "flex", flexDirection: "column" }}>
          <div style={{ background: "#0f172a", color: "#fff", padding: 12, display: "flex", justifyContent: "flex-end", gap: 8 }}>
            <button style={{ ...S.btn, background: "#22c55e", color: "#fff" }} onClick={downloadPDF}>⬇ Baixar PDF</button>
            <button style={{ ...S.btn, background: "#334155", color: "#fff" }} onClick={copyHTML}>📋 Copiar HTML</button>
            <button style={{ ...S.btn, background: "#475569", color: "#fff" }} onClick={() => setShowPreview(false)}>✕ Fechar</button>
          </div>
          <div style={{ flex: 1, overflow: "auto", background: "#fff", padding: 24 }} dangerouslySetInnerHTML={{ __html: buildHTML() }} />
        </div>
      )}
    </div>
  );
}
