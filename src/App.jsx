import React, { useState, useCallback } from "react";

/* ============================================================
   ROTAVIA — Planejamento de viagens
   ============================================================ */

// ---------- Helpers ----------
const uid = () => Math.random().toString(36).slice(2, 9);

const BRL = (n) =>
  (Number(n) || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

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
  return `${fmtDate(s)} · ${WD[dt.getDay()]}`;
};

const nightsBetween = (a, b) => {
  const da = parseDate(a);
  const db = parseDate(b);
  if (!da || !db) return 0;
  return Math.max(0, Math.round((db - da) / 86400000));
};

// ---------- Ícones (SVG traço fino) ----------
const Icon = ({ d, size = 18, stroke = "currentColor", style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke}
    strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={style}>
    {d}
  </svg>
);
const IcPlane = (p) => <Icon {...p} d={<path d="M17.8 19.2 16 11l3.5-3.5a2.1 2.1 0 0 0-3-3L13 8 4.8 6.2a.5.5 0 0 0-.5.8l3.9 4.4-2.1 2.1-1.8-.4a.4.4 0 0 0-.4.6l1.4 2 2 1.4a.4.4 0 0 0 .6-.4l-.4-1.8 2.1-2.1 4.4 3.9a.5.5 0 0 0 .8-.5Z" />} />;
const IcDepart = (p) => <Icon {...p} d={<><path d="M2 22h20" /><path d="M3.8 16.5 19 12.3a2 2 0 0 0-1-3.8l-3.4.9-4.4-5.2-2 .5 2.4 5.8-3.6 1-1.9-1.5-1.5.4Z" /></>} />;
const IcArrive = (p) => <Icon {...p} d={<><path d="M2 22h20" /><path d="M16.5 16.3 5.6 5.2a2 2 0 0 1 3.5-1.4l2.4 2.7 6.6-1.5 1.1 1.7-5.2 3.4 2 3.1-1.4 1.5Z" /></>} />;
const IcBuilding = (p) => <Icon {...p} d={<><rect x="5" y="3" width="14" height="18" rx="1" /><path d="M9 7h2M13 7h2M9 11h2M13 11h2M9 15h2M13 15h2" /></>} />;
const IcCar = (p) => <Icon {...p} d={<><path d="M5 13l1.5-4.5A2 2 0 0 1 8.4 7h7.2a2 2 0 0 1 1.9 1.5L19 13" /><path d="M5 13h14v4a1 1 0 0 1-1 1h-1a1 1 0 0 1-1-1v-1H8v1a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1Z" /><path d="M7.5 16h.01M16.5 16h.01" /></>} />;
const IcSparkle = (p) => <Icon {...p} d={<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6.3 6.3l2.4 2.4M15.3 15.3l2.4 2.4M17.7 6.3l-2.4 2.4M8.7 15.3l-2.4 2.4" />} />;
const IcPlus = (p) => <Icon {...p} d={<path d="M12 5v14M5 12h14" />} />;
const IcX = (p) => <Icon {...p} d={<path d="M18 6 6 18M6 6l12 12" />} />;
const IcFile = (p) => <Icon {...p} d={<><path d="M14 3v4a1 1 0 0 0 1 1h4" /><path d="M5 3h9l5 5v12a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1Z" /></>} />;
const IcDownload = (p) => <Icon {...p} d={<><path d="M12 4v11M8 11l4 4 4-4" /><path d="M4 19h16" /></>} />;
const IcCopy = (p) => <Icon {...p} d={<><rect x="9" y="9" width="11" height="11" rx="1.5" /><path d="M5 15V5a1 1 0 0 1 1-1h9" /></>} />;
const IcPin = (p) => <Icon {...p} d={<><path d="M12 21s7-5.2 7-11a7 7 0 1 0-14 0c0 5.8 7 11 7 11Z" /><circle cx="12" cy="10" r="2.5" /></>} />;
const IcTransfer = (p) => <Icon {...p} d={<><path d="M7 4v13M7 17l-3-3M7 17l3-3" /><path d="M17 20V7M17 7l-3 3M17 7l3 3" /></>} />;
const IcMap = (p) => <Icon {...p} d={<><path d="M9 4 4 6v14l5-2 6 2 5-2V4l-5 2-6-2Z" /><path d="M9 4v14M15 6v14" /></>} />;
const IcExternal = (p) => <Icon {...p} d={<><path d="M14 4h6v6" /><path d="M20 4 10 14" /><path d="M19 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5" /></>} />;
const IcSearchPrice = (p) => <Icon {...p} d={<><circle cx="11" cy="11" r="7" /><path d="m21 21-3.5-3.5" /><path d="M11 8v6M9 9.5h2.5a1.2 1.2 0 0 1 0 2.4H10a1.2 1.2 0 0 0 0 2.4h2.5" /></>} />;

// Spinner de carregamento (gira via CSS keyframes injetados abaixo)
const Spinner = ({ size = 14, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ animation: "rotaviaSpin 0.7s linear infinite" }}>
    <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2.4" strokeOpacity="0.25" />
    <path d="M21 12a9 9 0 0 0-9-9" stroke={color} strokeWidth="2.4" strokeLinecap="round" />
  </svg>
);

// Identidade das companhias: domínio (p/ logo) + cor da marca (p/ fallback)
const AIRLINES = [
  { match: ["latam", "tam"], domain: "latamairlines.com", color: "#1b0088", label: "LATAM" },
  { match: ["gol"], domain: "voegol.com.br", color: "#ff7900", label: "GOL" },
  { match: ["azul"], domain: "voeazul.com.br", color: "#0a3b8c", label: "Azul" },
  { match: ["american", "aa "], domain: "aa.com", color: "#0078d2", label: "American" },
  { match: ["united"], domain: "united.com", color: "#002244", label: "United" },
  { match: ["delta"], domain: "delta.com", color: "#c8102e", label: "Delta" },
  { match: ["copa"], domain: "copaair.com", color: "#003595", label: "Copa" },
  { match: ["air france", "airfrance"], domain: "airfrance.com", color: "#002157", label: "Air France" },
  { match: ["tap"], domain: "flytap.com", color: "#00a04a", label: "TAP" },
  { match: ["iberia"], domain: "iberia.com", color: "#d40f14", label: "Iberia" },
  { match: ["lufthansa"], domain: "lufthansa.com", color: "#05164d", label: "Lufthansa" },
  { match: ["emirates"], domain: "emirates.com", color: "#d71921", label: "Emirates" },
];
const airlineInfo = (name) => {
  const n = (name || "").toLowerCase();
  return AIRLINES.find((a) => a.match.some((m) => n.includes(m.trim()))) || null;
};

// Logo da companhia com fallback automático para selo colorido
function AirlineLogo({ name, size = 34 }) {
  const info = airlineInfo(name);
  const [failed, setFailed] = useState(false);
  const initial = (name || "?").trim().charAt(0).toUpperCase();
  const bg = info ? info.color : "#44403c";
  const box = { width: size, height: size, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, overflow: "hidden" };
  if (info && !failed) {
    return (
      <div style={{ ...box, background: "#fff", border: `1px solid ${LINE}` }}>
        <img src={`https://logo.clearbit.com/${info.domain}`} alt={info.label}
          width={size - 8} height={size - 8} style={{ objectFit: "contain" }}
          onError={() => setFailed(true)} />
      </div>
    );
  }
  return (
    <div style={{ ...box, background: bg, color: "#fff", fontSize: size * 0.42, fontWeight: 700 }}>{initial}</div>
  );
}

// ---------- Factories ----------
const newFlight = () => ({
  id: uid(), airline: "", fare: "", priceOutbound: "", priceReturn: "", taxes: "",
  baggagePrice: "", price: "", departTime: "", returnTime: "", stops: "", stopsCount: "", durationOutbound: "", durationReturn: "", stopDetails: "", baggage: "", link: "", flexible: false,
});
const newHotel = () => ({ id: uid(), name: "", checkin: "", checkout: "", daily: "", total: "", link: "" });
const newCar = () => ({
  id: uid(), company: "", model: "", pickup: "", dropoff: "", dailyRate: "",
  protectionName: "Completa", protectionRate: "", extraName: "Carbon Free", extraRate: "", feePct: "15",
});

const PALETTE = ["#3b5266", "#9a6a4f", "#4f6b54", "#6b5570", "#7a6248", "#566074"];

const newOption = (index = 0) => ({
  id: uid(), name: `Opção ${index + 1}`, color: PALETTE[index % PALETTE.length],
  origin: "", originCode: "", destination: "", destinationCode: "",
  departDate: "", returnDate: "", event: "", baggageType: "checked",
  flights: [], hotels: [], cars: [],
  hotelCountry: "", hotelCity: "", hotelArea: "", carCountry: "", carCity: "", carArea: "",
});

// ---------- Cálculos ----------
const carCosts = (car) => {
  const days = nightsBetween(car.pickup, car.dropoff) || 0;
  const daily = Number(car.dailyRate) || 0;
  const prot = Number(car.protectionRate) || 0;
  const extra = Number(car.extraRate) || 0;
  const feePct = Number(car.feePct) || 0;
  const dailySub = daily * days, protSub = prot * days, extraSub = extra * days;
  const subtotal = dailySub + protSub + extraSub;
  const fee = subtotal * (feePct / 100);
  return { days, dailySub, protSub, extraSub, subtotal, fee, total: subtotal + fee };
};

const flightTotal = (f) => {
  const soma = (Number(f.priceOutbound) || 0) + (Number(f.priceReturn) || 0) + (Number(f.taxes) || 0) + (Number(f.baggagePrice) || 0);
  return soma > 0 ? soma : Number(f.price) || 0;
};

// Gera links de busca pré-preenchidos (rota + datas) para os buscadores.
// Formatos validados: Kayak, Skyscanner e Momondo abrem direto na busca.
const flightSearchLinks = (o) => {
  const orig = (o.originCode || "").trim().toUpperCase();
  const dest = (o.destinationCode || "").trim().toUpperCase();
  const dep = o.departDate; // AAAA-MM-DD
  const ret = o.returnDate; // AAAA-MM-DD
  const short = (d) => (d ? d.slice(2).replace(/-/g, "") : ""); // AAMMDD p/ Skyscanner
  const ready = orig && dest && dep;

  const kayak = ready
    ? `https://www.kayak.com.br/flights/${orig}-${dest}/${dep}${ret ? "/" + ret : ""}?sort=price_a`
    : "https://www.kayak.com.br/flights";

  const skyscanner = ready
    ? `https://www.skyscanner.com.br/transport/flights/${orig.toLowerCase()}/${dest.toLowerCase()}/${short(dep)}${ret ? "/" + short(ret) : ""}/`
    : "https://www.skyscanner.com.br";

  const momondo = ready
    ? `https://www.momondo.com.br/flight-search/${orig}-${dest}/${dep}${ret ? "/" + ret : ""}?sort=price_a`
    : "https://www.momondo.com.br";

  return { kayak, skyscanner, momondo, ready };
};

const optionTotals = (opt) => {
  const flightsAll = opt.flights.reduce((s, f) => s + flightTotal(f), 0);
  const hotelsAll = opt.hotels.reduce((s, h) => s + (Number(h.total) || 0), 0);
  const carsAll = opt.cars.reduce((s, c) => s + carCosts(c).total, 0);
  const minPos = (arr) => {
    const p = arr.filter((v) => v > 0);
    return p.length ? Math.min(...p) : 0;
  };
  const flights = minPos(opt.flights.map(flightTotal));
  const hotels = minPos(opt.hotels.map((h) => Number(h.total) || 0));
  const cars = minPos(opt.cars.map((c) => carCosts(c).total));
  return { flights, hotels, cars, flightsAll, hotelsAll, carsAll, grand: flights + hotels + cars };
};

// ---------- Design tokens ----------
const INK = "#1c1917";
const INK2 = "#44403c";
const MUTED = "#78716c";
const FAINT = "#a8a29e";
const LINE = "#e7e5e4";
const SURF = "#ffffff";
const PAGE = "#f7f6f4";
const SOFT = "#faf9f7";
const ACCENT = "#3b5266";
const GOOD = "#3f6b52";
const GOODBG = "#eef4f0";

const S = {
  page: { minHeight: "100vh", background: PAGE, fontFamily: "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif", color: INK, letterSpacing: "-0.006em" },
  shell: { maxWidth: 1080, margin: "0 auto", padding: "0 20px" },
  label: { fontSize: 10.5, fontWeight: 600, color: FAINT, marginBottom: 6, display: "block", textTransform: "uppercase", letterSpacing: "0.07em" },
  input: { width: "100%", padding: "9px 11px", borderRadius: 9, border: `1px solid ${LINE}`, fontSize: 13.5, boxSizing: "border-box", background: SURF, color: INK, outline: "none", transition: "border-color .15s, box-shadow .15s", fontFamily: "inherit" },
  card: { background: SURF, borderRadius: 14, padding: 22, border: `1px solid ${LINE}`, marginBottom: 16 },
  num: { fontVariantNumeric: "tabular-nums" },
};
const grid = (c) => ({ display: "grid", gridTemplateColumns: `repeat(${c}, minmax(0,1fr))`, gap: 12 });
const sectionHead = { display: "flex", alignItems: "center", gap: 9, marginBottom: 16 };
const sectionTitle = { fontSize: 15, fontWeight: 600, letterSpacing: "-0.01em" };

const btn = (variant) => {
  const base = { display: "inline-flex", alignItems: "center", gap: 7, padding: "8px 13px", borderRadius: 9, border: "1px solid transparent", cursor: "pointer", fontSize: 12.5, fontWeight: 500, fontFamily: "inherit", transition: "background .15s, border-color .15s, opacity .15s", whiteSpace: "nowrap" };
  if (variant === "primary") return { ...base, background: INK, color: "#fff" };
  if (variant === "accent") return { ...base, background: ACCENT, color: "#fff" };
  if (variant === "ghostLight") return { ...base, background: "transparent", color: "#fff", border: "1px solid rgba(255,255,255,0.28)" };
  if (variant === "solidLight") return { ...base, background: "#fff", color: INK };
  if (variant === "soft") return { ...base, background: SOFT, color: INK2, border: `1px solid ${LINE}` };
  if (variant === "danger") return { ...base, background: "transparent", color: "#9a3a3a", border: `1px solid ${LINE}` };
  return base;
};

// ---------- API helper ----------
function extractJSON(text) {
  const clean = text.replace(/```json/gi, "").replace(/```/g, "");
  for (let i = 0; i < clean.length; i++) {
    const ch = clean[i];
    if (ch !== "[" && ch !== "{") continue;
    const open = ch, close = ch === "[" ? "]" : "}";
    let depth = 0, inStr = false, esc = false;
    for (let j = i; j < clean.length; j++) {
      const c = clean[j];
      if (inStr) { if (esc) esc = false; else if (c === "\\") esc = true; else if (c === '"') inStr = false; continue; }
      if (c === '"') inStr = true;
      else if (c === open) depth++;
      else if (c === close) { depth--; if (depth === 0) { try { return JSON.parse(clean.slice(i, j + 1)); } catch { break; } } }
    }
  }
  throw new Error("Não foi possível extrair JSON da resposta");
}

// Este app SEMPRE conversa com o backend (/api/search), tanto no localhost
// quanto na Netlify. O backend é quem guarda a chave da API e fala com a
// Anthropic. Nunca chamamos api.anthropic.com direto do navegador (isso
// exporia a chave e quebraria por CORS).
async function callClaude(systemPrompt, userPrompt, useSearch) {
  let res;
  try {
    res = await fetch("/api/search", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ system: systemPrompt, prompt: userPrompt, useSearch }),
    });
  } catch (e) {
    throw new Error("Servidor indisponível. Inicie o sistema com npm start (no localhost) ou verifique o deploy na Netlify.");
  }
  let out;
  try {
    out = await res.json();
  } catch (e) {
    throw new Error("O servidor não respondeu em formato válido. Confirme que o backend está no ar.");
  }
  if (!res.ok || out.error) throw new Error(out.error || "Erro do servidor");
  return out.data;
}

// ============================================================
export default function App() {
  const [projectName, setProjectName] = useState("");
  const [clientName, setClientName] = useState("");
  const [options, setOptions] = useState([]);
  const [active, setActive] = useState(0);
  const [toasts, setToasts] = useState([]);
  const [showPreview, setShowPreview] = useState(false);
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(null);
  const [focusKey, setFocusKey] = useState(null);

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
    setOptions((opts) => { const next = [...opts, newOption(opts.length)]; setActive(next.length - 1); return next; });
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

  const addItem = (kind, factory) => updateOption(opt.id, { [kind]: [...opt[kind], factory()] });
  const updItem = (kind, itemId, patch) => updateOption(opt.id, { [kind]: opt[kind].map((i) => (i.id === itemId ? { ...i, ...patch } : i)) });
  const delItem = (kind, itemId) => updateOption(opt.id, { [kind]: opt[kind].filter((i) => i.id !== itemId) });

  // ----- Buscas IA -----
  const searchFlights = async (o = opt) => {
    const bag = o.baggageType === "checked" ? "com bagagem despachada incluída" : "apenas com bagagem de mão";
    const sys = "Você é assistente de cotação de viagens. Responda APENAS com um array JSON puro, sem markdown, sem texto extra. Cada item DEVE ter os campos: {airline, fare, priceOutbound, priceReturn, taxes, baggagePrice, departTime, returnTime, durationOutbound, durationReturn, stopsCount, stopDetails, baggage, link}. priceOutbound = tarifa só da ida (BRL, número). priceReturn = tarifa só da volta (BRL, número). taxes = impostos e taxas de embarque (BRL, número). baggagePrice = custo da bagagem despachada (BRL, número; 0 se já incluída ou só mão). departTime/returnTime no formato HH:MM. durationOutbound = duração total do voo de ida (ex: '12h30'). durationReturn = duração total do voo de volta (ex: '11h45'). stopsCount = número de escalas no trajeto de ida (0 para voo direto, 1, 2...). stopDetails = onde são as escalas com tempo de conexão, texto curto (ex: 'Lima (2h) e Bogotá (1h30)' ou 'Direto' se sem escalas). link = site oficial da companhia (LATAM=https://www.latamairlines.com/br/pt, GOL=https://www.voegol.com.br, Azul=https://www.voeazul.com.br, American=https://www.aa.com, United=https://www.united.com, Delta=https://www.delta.com, Copa=https://www.copaair.com).";
    const usr = `Pesquise 3 voos de companhias DIFERENTES (LATAM, GOL, Azul, American, United, Delta ou Copa) de ${o.origin} (${o.originCode}) para ${o.destination} (${o.destinationCode}), ida ${fmtDate(o.departDate)} volta ${fmtDate(o.returnDate)}, ${bag}. Separe ida, volta, impostos e bagagem. Informe a duração de cada trecho, o número de escalas e onde são as escalas com o tempo de conexão. Preços em BRL.`;
    const arr = await callClaude(sys, usr, true);
    updateOption(o.id, {
      flights: arr.slice(0, 3).map((f) => ({
        ...newFlight(), airline: f.airline || "", fare: f.fare || "",
        priceOutbound: String(f.priceOutbound ?? ""), priceReturn: String(f.priceReturn ?? ""),
        taxes: String(f.taxes ?? ""), baggagePrice: String(f.baggagePrice ?? ""),
        departTime: f.departTime || "", returnTime: f.returnTime || "",
        durationOutbound: f.durationOutbound || "", durationReturn: f.durationReturn || "",
        stopsCount: String(f.stopsCount ?? ""), stopDetails: f.stopDetails || "",
        stops: f.stopDetails || (f.stopsCount === 0 || f.stopsCount === "0" ? "Direto" : ""),
        baggage: f.baggage || (o.baggageType === "checked" ? "Despachada" : "Mão"), link: f.link || "",
      })),
    });
  };

  const searchHotels = async (o = opt) => {
    const sys = "Você é assistente de cotação. Responda APENAS com array JSON puro, sem texto fora do array. Cada item DEVE ter: {name, daily, total, link}. O campo 'name' é OBRIGATÓRIO e deve conter o nome real e completo do hotel, nunca vazio nem genérico. Pesquise EXCLUSIVAMENTE no Hotels.com. O 'link' deve ser a URL direta do hotel no formato https://www.hotels.com/ho{numero}/{slug}/ . Se não tiver certeza, use https://www.hotels.com/. daily e total em número (BRL).";
    const usr = `Pesquise 3 hotéis reais no Hotels.com em ${[o.hotelArea, o.hotelCity, o.hotelCountry].filter(Boolean).join(", ") || o.destination}, check-in ${fmtDate(o.departDate)}, check-out ${fmtDate(o.returnDate)}. Informe o nome real, a diária e o total em BRL.`;
    const arr = await callClaude(sys, usr, true);
    const nights = nightsBetween(o.departDate, o.returnDate) || 1;
    updateOption(o.id, {
      hotels: arr.slice(0, 3).map((h) => {
        const link = /hotels\.com\/ho/i.test(h.link || "") ? h.link : "https://www.hotels.com/";
        const daily = Number(h.daily) || 0;
        return { ...newHotel(), name: h.name || h.hotel || h.nome || "Hotel sugerido", checkin: o.departDate, checkout: o.returnDate, daily: String(daily || ""), total: String(h.total ?? daily * nights), link };
      }),
    });
  };

  const searchCars = async (o = opt) => {
    const sys = "Você é assistente de cotação de aluguel de carros. IMPORTANTE: responda SOMENTE com um array JSON puro e válido, começando com [ e terminando com ]. NÃO escreva nenhuma palavra antes ou depois do array. NÃO use markdown, NÃO use blocos de código, NÃO comente os resultados. Se não encontrar dados exatos, ESTIME valores plausíveis em vez de responder em texto — você nunca deve responder fora do formato JSON. Cada item do array deve ter exatamente estes campos: {company, model, dailyRate, link}. company = nome da locadora. model = categoria/modelo do carro (ex: 'Econômico - VW Gol ou similar'). dailyRate = valor da diária, somente número, em BRL (sem 'R$', sem texto). link = site oficial da locadora. REGRA DE SELEÇÃO DAS LOCADORAS: se o destino for no BRASIL, pesquise as 3 maiores: Localiza (https://www.localiza.com), Movida (https://www.movida.com.br) e Unidas (https://www.unidas.com.br). Se o destino for em OUTRO PAÍS, pesquise as 3 maiores locadoras daquele país específico (ex: nos EUA use Enterprise, Hertz e Avis; na Europa use Europcar, Sixt e Hertz; e assim por diante conforme o país), com os respectivos sites oficiais.";
    const usr = `Pesquise aluguel de carro em ${[o.carArea, o.carCity, o.carCountry].filter(Boolean).join(", ") || o.destination}, retirada ${fmtDate(o.departDate)}, devolução ${fmtDate(o.returnDate)}. Traga 3 opções de locadoras DIFERENTES seguindo a regra: se for no Brasil, use Localiza, Movida e Unidas; se for no exterior, use as 3 maiores locadoras do país de destino. Diária em BRL (somente número). Lembre-se: responda APENAS com o array JSON, sem nenhum texto fora dele.`;
    const arr = await callClaude(sys, usr, true);
    updateOption(o.id, {
      cars: arr.slice(0, 3).map((c) => ({ ...newCar(), company: c.company || "", model: c.model || "", pickup: o.departDate, dropoff: o.returnDate, dailyRate: String(c.dailyRate ?? "") })),
    });
  };

  const runOne = async (kind, fn, label) => {
    if (!opt) return;
    if (!opt.destination) { toast("Informe o destino antes de pesquisar", "error"); return; }
    setLoading(kind);
    try { await fn(); toast(`${label} atualizados`); }
    catch (e) { toast(`Não foi possível buscar ${label.toLowerCase()}: ${e.message}`, "error"); }
    finally { setLoading(null); }
  };

  const searchAll = async () => {
    if (!opt) return;
    if (!opt.destination) { toast("Informe o destino antes de pesquisar", "error"); return; }
    const o = opt;
    try {
      setProgress("flights"); await searchFlights(o);
      setProgress("hotels"); await searchHotels(o);
      setProgress("cars"); await searchCars(o);
      setProgress(null); toast("Pesquisa concluída");
    } catch (e) { setProgress(null); toast(`A pesquisa falhou: ${e.message}`, "error"); }
  };

  // ----- Foco visual nos inputs -----
  const fp = (key) => ({
    onFocus: () => setFocusKey(key),
    onBlur: () => setFocusKey(null),
    style: { ...S.input, ...(focusKey === key ? { borderColor: ACCENT, boxShadow: `0 0 0 3px ${ACCENT}1f` } : {}) },
  });

  // ----- Exportação -----
  const buildHTML = () => {
    const gen = new Date().toLocaleString("pt-BR");
    const blocks = options.map((o) => {
      const t = optionTotals(o);
      const bag = o.baggageType === "checked" ? "Com bagagem despachada" : "Somente bagagem de mão";
      const flightRows = o.flights.map((f) => `<tr>
        <td>${f.airline || "—"}</td><td>${f.fare || "—"}</td>
        <td>${fmtDate(o.departDate)}<br><span style="color:#78716c">${f.departTime || ""}${f.durationOutbound ? " · " + f.durationOutbound : ""}</span><br><b>${BRL(f.priceOutbound)}</b></td>
        <td>${fmtDate(o.returnDate)}<br><span style="color:#78716c">${f.returnTime || ""}${f.durationReturn ? " · " + f.durationReturn : ""}</span><br><b>${BRL(f.priceReturn)}</b></td>
        <td>${(f.stopsCount === "0" || Number(f.stopsCount) === 0) ? "Direto" : (f.stopsCount ? f.stopsCount + " escala(s)" : "—")}${f.stopDetails && Number(f.stopsCount) !== 0 ? `<br><span style="color:#9a6a4f;font-size:11px">${f.stopDetails}</span>` : ""}</td>
        <td>${BRL(f.taxes)}</td><td>${BRL(f.baggagePrice)}</td>
        <td><b>${BRL(flightTotal(f))}</b></td>
        <td>${f.link ? `<a href="${f.link}" target="_blank" rel="noopener">Abrir</a>` : "—"}</td></tr>`).join("");
      const hotelRows = o.hotels.map((h) => `<tr>
        <td>${h.name || "—"}</td><td>${fmtDate(h.checkin)}</td><td>${fmtDate(h.checkout)}</td>
        <td>${BRL(h.daily)}</td><td><b>${BRL(h.total)}</b></td>
        <td>${h.link ? `<a href="${h.link}" target="_blank" rel="noopener">Abrir</a>` : "—"}</td></tr>`).join("");
      const carCards = o.cars.map((c) => {
        const cc = carCosts(c);
        return `<div style="border:1px solid #e7e5e4;border-radius:10px;padding:14px;margin-bottom:10px">
          <div style="font-weight:600">${c.company || "—"}${c.model ? " · " + c.model : ""}</div>
          <div style="font-size:12.5px;color:#78716c;margin-bottom:8px">${fmtDate(c.pickup)} → ${fmtDate(c.dropoff)} · ${cc.days} diária(s)</div>
          <table style="width:100%;border-collapse:collapse;font-size:12.5px">
            <tr><td>Diária</td><td>${BRL(c.dailyRate)} × ${cc.days}</td><td style="text-align:right">${BRL(cc.dailySub)}</td></tr>
            <tr><td>${c.protectionName}</td><td>${BRL(c.protectionRate)} × ${cc.days}</td><td style="text-align:right">${BRL(cc.protSub)}</td></tr>
            <tr><td>${c.extraName}</td><td>${BRL(c.extraRate)} × ${cc.days}</td><td style="text-align:right">${BRL(cc.extraSub)}</td></tr>
            <tr><td>Taxa de locação</td><td>${c.feePct}%</td><td style="text-align:right">${BRL(cc.fee)}</td></tr>
            <tr style="font-weight:600;border-top:1px solid #e7e5e4"><td>Total</td><td></td><td style="text-align:right;color:#3f6b52">${BRL(cc.total)}</td></tr>
          </table></div>`;
      }).join("");
      return `<section style="margin-bottom:30px;border:1px solid #e7e5e4;border-radius:14px;overflow:hidden">
        <div style="background:${o.color};color:#fff;padding:16px 20px">
          <div style="font-size:11px;letter-spacing:.08em;text-transform:uppercase;opacity:.7">${o.name}</div>
          <div style="font-size:17px;font-weight:600;margin-top:2px">${o.origin || "?"} (${o.originCode}) → ${o.destination || "?"} (${o.destinationCode})</div>
          <div style="opacity:.85;font-size:12.5px;margin-top:3px">${fmtDateFull(o.departDate)} → ${fmtDateFull(o.returnDate)} · ${bag}</div>
        </div>
        <div style="padding:18px 20px">
          <h3 style="margin:0 0 10px;font-size:13px;text-transform:uppercase;letter-spacing:.06em;color:#78716c">Voos</h3>
          ${o.flights.length ? `<table style="width:100%;border-collapse:collapse;font-size:12.5px"><thead><tr style="text-align:left;color:#78716c;border-bottom:1px solid #e7e5e4"><th style="padding:6px 4px">Cia</th><th>Tarifa</th><th>Ida</th><th>Volta</th><th>Escalas</th><th>Impostos</th><th>Bagagem</th><th>Total</th><th>Link</th></tr></thead><tbody>${flightRows}</tbody></table>` : "<div style='color:#a8a29e;font-size:12.5px'>Nenhum voo.</div>"}
          <h3 style="margin:18px 0 10px;font-size:13px;text-transform:uppercase;letter-spacing:.06em;color:#78716c">Hospedagem</h3>
          ${o.hotels.length ? `<table style="width:100%;border-collapse:collapse;font-size:12.5px"><thead><tr style="text-align:left;color:#78716c;border-bottom:1px solid #e7e5e4"><th style="padding:6px 4px">Hotel</th><th>Check-in</th><th>Check-out</th><th>Diária</th><th>Total</th><th>Link</th></tr></thead><tbody>${hotelRows}</tbody></table>` : "<div style='color:#a8a29e;font-size:12.5px'>Nenhum hotel.</div>"}
          <h3 style="margin:18px 0 10px;font-size:13px;text-transform:uppercase;letter-spacing:.06em;color:#78716c">Aluguel de carro</h3>
          ${o.cars.length ? carCards : "<div style='color:#a8a29e;font-size:12.5px'>Nenhum carro.</div>"}
          <div style="background:#1c1917;color:#fff;border-radius:12px;padding:18px 20px;margin-top:18px">
            <div style="font-size:11px;letter-spacing:.08em;text-transform:uppercase;opacity:.6;margin-bottom:10px">Resumo · menor preço de cada</div>
            <div style="display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px solid rgba(255,255,255,.12)"><span style="opacity:.8">Voos</span><b>${BRL(t.flights)}</b></div>
            <div style="display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px solid rgba(255,255,255,.12)"><span style="opacity:.8">Hospedagem</span><b>${BRL(t.hotels)}</b></div>
            <div style="display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px solid rgba(255,255,255,.12)"><span style="opacity:.8">Aluguel de carro</span><b>${BRL(t.cars)}</b></div>
            <div style="display:flex;justify-content:space-between;align-items:center;margin-top:10px"><span style="text-transform:uppercase;letter-spacing:.06em;font-size:12px">Total geral</span><span style="font-size:24px;font-weight:600;color:#7ec99f">${BRL(t.grand)}</span></div>
          </div>
        </div>
      </section>`;
    }).join("");
    return `<div style="font-family:ui-sans-serif,system-ui,sans-serif;max-width:900px;margin:0 auto;color:#1c1917">
      <div style="border-bottom:2px solid #1c1917;padding-bottom:14px;margin-bottom:22px">
        <div style="font-size:24px;font-weight:700;letter-spacing:-0.02em">Rotavia</div>
        <div style="font-size:12px;color:#78716c;text-transform:uppercase;letter-spacing:.1em">Planejamento de viagens</div>
      </div>
      <div style="color:#44403c;margin-bottom:4px;font-size:13.5px"><b>Projeto:</b> ${projectName || "—"} &nbsp;·&nbsp; <b>Cliente:</b> ${clientName || "—"}</div>
      <div style="color:#a8a29e;font-size:11.5px;margin-bottom:24px">Gerado em ${gen}</div>
      ${blocks || "<div style='color:#a8a29e'>Nenhuma opção cadastrada.</div>"}
    </div>`;
  };

  const downloadPDF = () => {
    const payload = { clientName, projectName, options };
    if (typeof sendPrompt === "function") { sendPrompt("__PDF__" + JSON.stringify(payload)); toast("Enviado ao chat para gerar o PDF"); }
    else { toast("Geração de PDF indisponível neste ambiente", "error"); }
  };
  const copyHTML = async () => {
    try { await navigator.clipboard.writeText(buildHTML()); toast("HTML copiado"); }
    catch { toast("Não foi possível copiar", "error"); }
  };

  // ============================================================
  const dateSummary = opt ? `${fmtDateFull(opt.departDate)}  →  ${fmtDateFull(opt.returnDate)}` : "";

  return (
    <div style={S.page}>
      <style>{`@keyframes rotaviaSpin { to { transform: rotate(360deg); } }`}</style>
      {/* Toasts */}
      <div style={{ position: "fixed", top: 18, right: 18, zIndex: 9999, display: "flex", flexDirection: "column", gap: 8 }}>
        {toasts.map((t) => (
          <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 9, padding: "11px 15px", borderRadius: 10, fontSize: 13, fontWeight: 500, color: "#fff", background: t.type === "error" ? "#9a3a3a" : INK, boxShadow: "0 6px 24px rgba(0,0,0,.16)", maxWidth: 360 }}>
            {t.type === "error" ? <IcX size={15} /> : <IcSparkle size={15} />}{t.msg}
          </div>
        ))}
      </div>

      {/* Header */}
      <div style={{ background: INK, color: "#fff" }}>
        <div style={{ ...S.shell, paddingTop: 20, paddingBottom: 18 }}>
          <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 14, alignItems: "flex-start" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 38, height: 38, borderRadius: 11, border: "1px solid rgba(255,255,255,.25)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <IcPlane size={20} />
              </div>
              <div>
                <div style={{ fontSize: 19, fontWeight: 600, letterSpacing: "-0.02em" }}>Rotavia</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,.55)", textTransform: "uppercase", letterSpacing: "0.12em", marginTop: 1 }}>Planejamento de viagens</div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button style={btn("ghostLight")} onClick={() => setShowPreview(true)}><IcFile size={15} />Ver cotação</button>
              <button style={btn("solidLight")} onClick={downloadPDF}><IcDownload size={15} />Baixar PDF</button>
            </div>
          </div>
          <div style={{ ...grid(2), marginTop: 18, maxWidth: 580 }}>
            <div>
              <label style={{ ...S.label, color: "rgba(255,255,255,.5)" }}>Projeto</label>
              <input {...fp("proj")} placeholder="Ex.: Champs Trade Show 2026"
                style={{ ...fp("proj").style, background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.18)", color: "#fff" }}
                value={projectName} onChange={(e) => setProjectName(e.target.value)} />
            </div>
            <div>
              <label style={{ ...S.label, color: "rgba(255,255,255,.5)" }}>Cliente</label>
              <input {...fp("cli")} placeholder="Ex.: Bruna Andrade"
                style={{ ...fp("cli").style, background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.18)", color: "#fff" }}
                value={clientName} onChange={(e) => setClientName(e.target.value)} />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ background: SURF, borderBottom: `1px solid ${LINE}` }}>
        <div style={{ ...S.shell, display: "flex", alignItems: "center", gap: 7, paddingTop: 12, paddingBottom: 12, flexWrap: "wrap" }}>
          {options.map((o, i) => {
            const on = i === active;
            return (
              <div key={o.id} onClick={() => setActive(i)} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 13px", borderRadius: 9, cursor: "pointer", fontWeight: 500, fontSize: 12.5, background: on ? INK : SOFT, color: on ? "#fff" : INK2, border: `1px solid ${on ? INK : LINE}`, transition: "all .15s" }}>
                <span style={{ width: 7, height: 7, borderRadius: 999, background: o.color }} />
                {o.name}{o.destination ? ` · ${o.destination}` : ""}
                <span onClick={(e) => { e.stopPropagation(); removeOption(o.id); }} style={{ display: "flex", marginLeft: 2, opacity: 0.6 }}><IcX size={13} /></span>
              </div>
            );
          })}
          <button style={{ ...btn("soft"), padding: "8px 11px" }} onClick={addOption}><IcPlus size={15} /></button>
        </div>
      </div>

      {/* Empty state */}
      {options.length === 0 && (
        <div style={{ ...S.shell, textAlign: "center", padding: "92px 20px" }}>
          <div style={{ width: 60, height: 60, borderRadius: 16, border: `1px solid ${LINE}`, background: SURF, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 18px", color: ACCENT }}>
            <IcMap size={28} />
          </div>
          <div style={{ fontSize: 19, fontWeight: 600, letterSpacing: "-0.01em" }}>Comece uma nova cotação</div>
          <div style={{ color: MUTED, fontSize: 14, marginTop: 6, marginBottom: 22 }}>Adicione uma opção de viagem para montar voos, hospedagem e carro.</div>
          <button style={{ ...btn("primary"), fontSize: 14, padding: "11px 18px" }} onClick={addOption}><IcPlus size={16} />Nova opção de viagem</button>
        </div>
      )}

      {/* Conteúdo */}
      {opt && (
        <div style={{ ...S.shell, paddingTop: 18, paddingBottom: 40 }}>

          {/* Pesquisar tudo */}
          <div style={{ background: INK, color: "#fff", borderRadius: 14, padding: "18px 20px", marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 38, height: 38, borderRadius: 11, background: "rgba(255,255,255,.08)", display: "flex", alignItems: "center", justifyContent: "center" }}><IcSparkle size={19} /></div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14.5 }}>Pesquisa automática</div>
                  <div style={{ fontSize: 12.5, color: "rgba(255,255,255,.6)" }}>Voos, hospedagem e carro em sequência</div>
                </div>
              </div>
              <button style={{ ...btn("solidLight"), opacity: progress ? 0.7 : 1 }} onClick={searchAll} disabled={!!progress}>
                {progress ? <Spinner size={14} color={INK} /> : null}{progress ? "Pesquisando…" : "Iniciar pesquisa"}
              </button>
            </div>
            {progress && (
              <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
                {[["flights", "Voos"], ["hotels", "Hospedagem"], ["cars", "Carro"]].map(([k, lbl]) => (
                  <div key={k} style={{ flex: 1, padding: "8px 0", borderRadius: 8, textAlign: "center", fontSize: 12, fontWeight: 500, background: progress === k ? "#fff" : "rgba(255,255,255,.1)", color: progress === k ? INK : "rgba(255,255,255,.7)" }}>{lbl}</div>
                ))}
              </div>
            )}
          </div>

          {/* Dados da viagem */}
          <div style={S.card}>
            <div style={sectionHead}><span style={sectionTitle}>Dados da viagem</span></div>
            <div style={{ ...grid(2), marginBottom: 12 }}>
              <div><label style={S.label}>Nome da opção</label><input {...fp("optname")} value={opt.name} onChange={(e) => updateOption(opt.id, { name: e.target.value })} /></div>
              <div><label style={S.label}>Cor de identificação</label><input type="color" style={{ ...S.input, height: 40, padding: 4, cursor: "pointer" }} value={opt.color} onChange={(e) => updateOption(opt.id, { color: e.target.value })} /></div>
            </div>
            <div style={{ ...grid(4), marginBottom: 12 }}>
              <div><label style={S.label}>Origem</label><input {...fp("orig")} placeholder="São Paulo" value={opt.origin} onChange={(e) => updateOption(opt.id, { origin: e.target.value })} /></div>
              <div><label style={S.label}>Código</label><input {...fp("origc")} placeholder="GRU" value={opt.originCode} onChange={(e) => updateOption(opt.id, { originCode: e.target.value })} /></div>
              <div><label style={S.label}>Destino</label><input {...fp("dest")} placeholder="Las Vegas" value={opt.destination} onChange={(e) => updateOption(opt.id, { destination: e.target.value })} /></div>
              <div><label style={S.label}>Código</label><input {...fp("destc")} placeholder="LAS" value={opt.destinationCode} onChange={(e) => updateOption(opt.id, { destinationCode: e.target.value })} /></div>
            </div>
            <div style={{ ...grid(3), marginBottom: 12 }}>
              <div><label style={S.label}>Ida</label><input type="date" {...fp("dep")} value={opt.departDate} onChange={(e) => updateOption(opt.id, { departDate: e.target.value })} /></div>
              <div><label style={S.label}>Volta</label><input type="date" {...fp("ret")} value={opt.returnDate} onChange={(e) => updateOption(opt.id, { returnDate: e.target.value })} /></div>
              <div><label style={S.label}>Evento</label><input {...fp("ev")} value={opt.event} onChange={(e) => updateOption(opt.id, { event: e.target.value })} /></div>
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={S.label}>Bagagem</label>
              <div style={{ display: "flex", gap: 8 }}>
                {[["checked", "Despachada"], ["carryon", "Somente de mão"]].map(([k, lbl]) => {
                  const on = opt.baggageType === k;
                  return <button key={k} onClick={() => updateOption(opt.id, { baggageType: k })} style={{ flex: 1, padding: "9px 0", borderRadius: 9, fontSize: 13, fontWeight: 500, cursor: "pointer", border: `1px solid ${on ? INK : LINE}`, background: on ? INK : SOFT, color: on ? "#fff" : INK2, transition: "all .15s", fontFamily: "inherit" }}>{lbl}</button>;
                })}
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 14, background: SOFT, borderRadius: 10, padding: "11px 14px", fontSize: 12.5, color: INK2, flexWrap: "wrap" }}>
              <span style={S.num}>{dateSummary}</span>
              <span style={{ color: FAINT }}>·</span>
              <span style={S.num}>{nightsBetween(opt.departDate, opt.returnDate)} noites</span>
              <span style={{ color: FAINT }}>·</span>
              <span>{opt.baggageType === "checked" ? "Bagagem despachada" : "Somente bagagem de mão"}</span>
            </div>
          </div>

          {/* VOOS */}
          <div style={S.card}>
            <div style={{ ...sectionHead, justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 9 }}><IcDepart size={18} stroke={ACCENT} /><span style={sectionTitle}>Voos</span></div>
              <div style={{ display: "flex", gap: 8 }}>
                <button style={{ ...btn("accent"), opacity: loading === "flights" ? 0.7 : 1 }} disabled={loading === "flights"} onClick={() => runOne("flights", () => searchFlights(), "Voos")}>{loading === "flights" ? <Spinner size={14} /> : <IcSparkle size={14} />}{loading === "flights" ? "Pesquisando…" : "Pesquisar"}</button>
                <button style={btn("soft")} onClick={() => addItem("flights", newFlight)}><IcPlus size={14} />Voo</button>
              </div>
            </div>
            {(() => {
              const L = flightSearchLinks(opt);
              const searchBtn = (label, url, brand) => (
                <a href={url} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "9px 14px", borderRadius: 9, background: brand, color: "#fff", fontSize: 12.5, fontWeight: 500, textDecoration: "none" }}>
                  {label}<IcExternal size={13} />
                </a>
              );
              return (
                <div style={{ border: `1px solid ${LINE}`, borderRadius: 12, padding: 14, marginBottom: 14, background: SOFT }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                    <IcSearchPrice size={16} stroke={ACCENT} />
                    <span style={{ fontSize: 12.5, fontWeight: 600, color: INK }}>Comparar preços reais</span>
                    {L.ready
                      ? <span style={{ fontSize: 11.5, color: MUTED }}>· {opt.originCode} → {opt.destinationCode}, rota e datas preenchidas</span>
                      : <span style={{ fontSize: 11.5, color: "#9a6a4f" }}>· preencha origem, destino e data de ida</span>}
                  </div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {searchBtn("Kayak", L.kayak, "#ff690f")}
                    {searchBtn("Skyscanner", L.skyscanner, "#0770e3")}
                    {searchBtn("Momondo", L.momondo, "#e91e63")}
                  </div>
                </div>
              );
            })()}
            {opt.flights.map((f) => {
              const stopsLabel = (sc) => { const n = Number(sc); if (sc === "" || isNaN(n)) return null; return n === 0 ? "Voo direto" : `${n} escala${n > 1 ? "s" : ""}`; };
              const scOut = stopsLabel(f.stopsCount);
              return (
              <div key={f.id} style={{ border: `1px solid ${LINE}`, borderRadius: 12, marginBottom: 12, overflow: "hidden" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", background: SOFT, borderBottom: `1px solid ${LINE}` }}>
                  <AirlineLogo name={f.airline} size={36} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: INK }}>{f.airline || "Companhia"}</div>
                    <div style={{ fontSize: 11.5, color: MUTED }}>{f.fare || "Tarifa"}</div>
                  </div>
                  <div style={{ flex: 1 }} />
                  {scOut && (
                    <span style={{ fontSize: 11.5, fontWeight: 600, color: Number(f.stopsCount) === 0 ? GOOD : "#9a6a4f", background: Number(f.stopsCount) === 0 ? GOODBG : "#f5ede6", padding: "4px 10px", borderRadius: 999 }}>{scOut}</span>
                  )}
                </div>
                <div style={{ display: "flex", gap: 18, padding: "10px 16px", fontSize: 12, color: MUTED, flexWrap: "wrap", alignItems: "center" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 6 }}><IcDepart size={14} stroke={ACCENT} />Ida {fmtDate(opt.departDate)} <span style={S.num}>{f.departTime}</span>{f.durationOutbound ? <span style={{ color: FAINT }}>· {f.durationOutbound}</span> : null}</span>
                  <span style={{ display: "flex", alignItems: "center", gap: 6 }}><IcArrive size={14} stroke={ACCENT} />Volta {fmtDate(opt.returnDate)} <span style={S.num}>{f.returnTime}</span>{f.durationReturn ? <span style={{ color: FAINT }}>· {f.durationReturn}</span> : null}</span>
                </div>
                {f.stopDetails && Number(f.stopsCount) !== 0 && (
                  <div style={{ display: "flex", alignItems: "center", gap: 7, padding: "0 16px 10px", fontSize: 12, color: "#9a6a4f" }}><IcTransfer size={14} stroke="#9a6a4f" />Conexões: {f.stopDetails}</div>
                )}
                <div style={{ padding: 16, borderTop: `1px solid ${LINE}` }}>
                  <div style={{ ...grid(3), marginBottom: 12 }}>
                    <div><label style={S.label}>Companhia</label><input {...fp(`fa${f.id}`)} value={f.airline} onChange={(e) => updItem("flights", f.id, { airline: e.target.value })} /></div>
                    <div><label style={S.label}>Tarifa</label><input {...fp(`ff${f.id}`)} value={f.fare} onChange={(e) => updItem("flights", f.id, { fare: e.target.value })} /></div>
                    <div><label style={S.label}>Tarifa ida (R$)</label><input type="number" {...fp(`fpo${f.id}`)} value={f.priceOutbound} onChange={(e) => updItem("flights", f.id, { priceOutbound: e.target.value })} /></div>
                  </div>
                  <div style={{ ...grid(3), marginBottom: 12 }}>
                    <div><label style={S.label}>Tarifa volta (R$)</label><input type="number" {...fp(`fpr${f.id}`)} value={f.priceReturn} onChange={(e) => updItem("flights", f.id, { priceReturn: e.target.value })} /></div>
                    <div><label style={S.label}>Impostos (R$)</label><input type="number" {...fp(`ft${f.id}`)} value={f.taxes} onChange={(e) => updItem("flights", f.id, { taxes: e.target.value })} /></div>
                    <div><label style={S.label}>Bagagem (R$)</label><input type="number" {...fp(`fb${f.id}`)} value={f.baggagePrice} onChange={(e) => updItem("flights", f.id, { baggagePrice: e.target.value })} /></div>
                  </div>
                  <div style={{ ...grid(3), marginBottom: 12 }}>
                    <div><label style={S.label}>Horário ida</label><input type="time" {...fp(`fdt${f.id}`)} value={f.departTime} onChange={(e) => updItem("flights", f.id, { departTime: e.target.value })} /></div>
                    <div><label style={S.label}>Horário volta</label><input type="time" {...fp(`frt${f.id}`)} value={f.returnTime} onChange={(e) => updItem("flights", f.id, { returnTime: e.target.value })} /></div>
                    <div><label style={S.label}>Nº de escalas</label><input type="number" {...fp(`fsc${f.id}`)} placeholder="0" value={f.stopsCount} onChange={(e) => updItem("flights", f.id, { stopsCount: e.target.value })} /></div>
                  </div>
                  <div style={{ ...grid(3), marginBottom: 12 }}>
                    <div><label style={S.label}>Tempo voo ida</label><input {...fp(`fdo${f.id}`)} placeholder="12h30" value={f.durationOutbound} onChange={(e) => updItem("flights", f.id, { durationOutbound: e.target.value })} /></div>
                    <div><label style={S.label}>Tempo voo volta</label><input {...fp(`fdr${f.id}`)} placeholder="11h45" value={f.durationReturn} onChange={(e) => updItem("flights", f.id, { durationReturn: e.target.value })} /></div>
                    <div><label style={S.label}>Onde são as escalas</label><input {...fp(`fsd${f.id}`)} placeholder="Lima (2h), Bogotá (1h30)" value={f.stopDetails} onChange={(e) => updItem("flights", f.id, { stopDetails: e.target.value })} /></div>
                  </div>
                  <div style={{ ...grid(2), marginBottom: 12 }}>
                    <div><label style={S.label}>Bagagem (descrição)</label><input {...fp(`fbd${f.id}`)} value={f.baggage} onChange={(e) => updItem("flights", f.id, { baggage: e.target.value })} /></div>
                    <div><label style={S.label}>Link da oferta</label><input {...fp(`fl${f.id}`)} value={f.link} onChange={(e) => updItem("flights", f.id, { link: e.target.value })} /></div>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: GOODBG, borderRadius: 9, padding: "10px 14px", marginBottom: 12 }}>
                    <span style={{ fontSize: 12, color: GOOD, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em" }}>Total do voo</span>
                    <span style={{ fontSize: 16, fontWeight: 600, color: GOOD, ...S.num }}>{BRL(flightTotal(f))}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <label style={{ fontSize: 12.5, display: "flex", gap: 7, alignItems: "center", color: INK2, cursor: "pointer" }}>
                      <input type="checkbox" checked={f.flexible} onChange={(e) => updItem("flights", f.id, { flexible: e.target.checked })} style={{ accentColor: ACCENT }} /> Alteração flexível
                    </label>
                    <button style={btn("danger")} onClick={() => delItem("flights", f.id)}><IcX size={13} />Remover</button>
                  </div>
                </div>
              </div>
              );
            })}
            {opt.flights.length === 0 && <div style={{ color: FAINT, fontSize: 13, padding: "4px 0" }}>Nenhum voo adicionado. Use Pesquisar ou adicione manualmente.</div>}
          </div>

          {/* HOSPEDAGEM */}
          <div style={S.card}>
            <div style={{ ...sectionHead, justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 9 }}><IcBuilding size={18} stroke={ACCENT} /><span style={sectionTitle}>Hospedagem</span></div>
              <div style={{ display: "flex", gap: 8 }}>
                <button style={{ ...btn("accent"), opacity: loading === "hotels" ? 0.7 : 1 }} disabled={loading === "hotels"} onClick={() => runOne("hotels", () => searchHotels(), "Hospedagem")}>{loading === "hotels" ? <Spinner size={14} /> : <IcSparkle size={14} />}{loading === "hotels" ? "Pesquisando…" : "Pesquisar"}</button>
                <button style={btn("soft")} onClick={() => addItem("hotels", newHotel)}><IcPlus size={14} />Hotel</button>
              </div>
            </div>
            <div style={{ background: SOFT, borderRadius: 10, padding: 14, marginBottom: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}><IcPin size={14} stroke={MUTED} /><span style={{ fontSize: 11, fontWeight: 600, color: MUTED, textTransform: "uppercase", letterSpacing: "0.06em" }}>Localização</span></div>
              <div style={grid(3)}>
                <input {...fp("hc")} placeholder="País" value={opt.hotelCountry} onChange={(e) => updateOption(opt.id, { hotelCountry: e.target.value })} />
                <input {...fp("hci")} placeholder="Cidade" value={opt.hotelCity} onChange={(e) => updateOption(opt.id, { hotelCity: e.target.value })} />
                <input {...fp("ha")} placeholder="Bairro / região" value={opt.hotelArea} onChange={(e) => updateOption(opt.id, { hotelArea: e.target.value })} />
              </div>
            </div>
            {opt.hotels.map((h) => (
              <div key={h.id} style={{ border: `1px solid ${LINE}`, borderRadius: 12, padding: 16, marginBottom: 12 }}>
                <div style={{ ...grid(3), marginBottom: 12 }}>
                  <div><label style={S.label}>Hotel</label><input {...fp(`hn${h.id}`)} value={h.name} onChange={(e) => updItem("hotels", h.id, { name: e.target.value })} /></div>
                  <div><label style={S.label}>Check-in</label><input type="date" {...fp(`hci${h.id}`)} value={h.checkin} onChange={(e) => updItem("hotels", h.id, { checkin: e.target.value })} /></div>
                  <div><label style={S.label}>Check-out</label><input type="date" {...fp(`hco${h.id}`)} value={h.checkout} onChange={(e) => updItem("hotels", h.id, { checkout: e.target.value })} /></div>
                </div>
                <div style={{ ...grid(3), marginBottom: 12 }}>
                  <div><label style={S.label}>Diária (R$)</label><input type="number" {...fp(`hd${h.id}`)} value={h.daily} onChange={(e) => updItem("hotels", h.id, { daily: e.target.value })} /></div>
                  <div><label style={S.label}>Total (R$)</label><input type="number" {...fp(`ht${h.id}`)} value={h.total} onChange={(e) => updItem("hotels", h.id, { total: e.target.value })} /></div>
                  <div><label style={S.label}>Link</label><input {...fp(`hl${h.id}`)} value={h.link} onChange={(e) => updItem("hotels", h.id, { link: e.target.value })} /></div>
                </div>
                <div style={{ textAlign: "right" }}><button style={btn("danger")} onClick={() => delItem("hotels", h.id)}><IcX size={13} />Remover</button></div>
              </div>
            ))}
            {opt.hotels.length === 0 && <div style={{ color: FAINT, fontSize: 13, padding: "4px 0" }}>Nenhum hotel adicionado.</div>}
          </div>

          {/* CARROS */}
          <div style={S.card}>
            <div style={{ ...sectionHead, justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 9 }}><IcCar size={18} stroke={ACCENT} /><span style={sectionTitle}>Aluguel de carro</span></div>
              <div style={{ display: "flex", gap: 8 }}>
                <button style={{ ...btn("accent"), opacity: loading === "cars" ? 0.7 : 1 }} disabled={loading === "cars"} onClick={() => runOne("cars", () => searchCars(), "Carros")}>{loading === "cars" ? <Spinner size={14} /> : <IcSparkle size={14} />}{loading === "cars" ? "Pesquisando…" : "Pesquisar"}</button>
                <button style={btn("soft")} onClick={() => addItem("cars", newCar)}><IcPlus size={14} />Carro</button>
              </div>
            </div>
            <div style={{ background: SOFT, borderRadius: 10, padding: 14, marginBottom: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}><IcPin size={14} stroke={MUTED} /><span style={{ fontSize: 11, fontWeight: 600, color: MUTED, textTransform: "uppercase", letterSpacing: "0.06em" }}>Local de retirada</span></div>
              <div style={grid(3)}>
                <input {...fp("cc")} placeholder="País" value={opt.carCountry} onChange={(e) => updateOption(opt.id, { carCountry: e.target.value })} />
                <input {...fp("cci")} placeholder="Cidade" value={opt.carCity} onChange={(e) => updateOption(opt.id, { carCity: e.target.value })} />
                <input {...fp("ca")} placeholder="Bairro / região" value={opt.carArea} onChange={(e) => updateOption(opt.id, { carArea: e.target.value })} />
              </div>
            </div>
            {opt.cars.map((c) => {
              const cc = carCosts(c);
              const costRow = (label, val) => (
                <div style={{ textAlign: "right", fontSize: 12.5, color: MUTED }}>{label} <b style={{ color: INK, ...S.num }}>{val}</b></div>
              );
              return (
                <div key={c.id} style={{ border: `1px solid ${LINE}`, borderRadius: 12, padding: 16, marginBottom: 12 }}>
                  <div style={{ ...grid(4), marginBottom: 12 }}>
                    <div><label style={S.label}>Locadora</label><input {...fp(`cco${c.id}`)} value={c.company} onChange={(e) => updItem("cars", c.id, { company: e.target.value })} /></div>
                    <div><label style={S.label}>Modelo</label><input {...fp(`cm${c.id}`)} value={c.model} onChange={(e) => updItem("cars", c.id, { model: e.target.value })} /></div>
                    <div><label style={S.label}>Retirada</label><input type="date" {...fp(`cp${c.id}`)} value={c.pickup} onChange={(e) => updItem("cars", c.id, { pickup: e.target.value })} /></div>
                    <div><label style={S.label}>Devolução</label><input type="date" {...fp(`cd${c.id}`)} value={c.dropoff} onChange={(e) => updItem("cars", c.id, { dropoff: e.target.value })} /></div>
                  </div>
                  <div style={{ background: SOFT, borderRadius: 10, padding: 14 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: MUTED, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12 }}>Custos · {cc.days} diária(s)</div>
                    <div style={{ ...grid(3), marginBottom: 10, alignItems: "end" }}>
                      <div><label style={S.label}>Diária (R$/dia)</label><input type="number" {...fp(`cdr${c.id}`)} value={c.dailyRate} onChange={(e) => updItem("cars", c.id, { dailyRate: e.target.value })} /></div>
                      <div style={{ gridColumn: "span 2" }}>{costRow("Subtotal", BRL(cc.dailySub))}</div>
                    </div>
                    <div style={{ ...grid(3), marginBottom: 10, alignItems: "end" }}>
                      <div><label style={S.label}>Proteção</label><input {...fp(`cpn${c.id}`)} value={c.protectionName} onChange={(e) => updItem("cars", c.id, { protectionName: e.target.value })} /></div>
                      <div><label style={S.label}>R$/dia</label><input type="number" {...fp(`cpr${c.id}`)} value={c.protectionRate} onChange={(e) => updItem("cars", c.id, { protectionRate: e.target.value })} /></div>
                      <div>{costRow("Subtotal", BRL(cc.protSub))}</div>
                    </div>
                    <div style={{ ...grid(3), marginBottom: 10, alignItems: "end" }}>
                      <div><label style={S.label}>Adicional</label><input {...fp(`cen${c.id}`)} value={c.extraName} onChange={(e) => updItem("cars", c.id, { extraName: e.target.value })} /></div>
                      <div><label style={S.label}>R$/dia</label><input type="number" {...fp(`cer${c.id}`)} value={c.extraRate} onChange={(e) => updItem("cars", c.id, { extraRate: e.target.value })} /></div>
                      <div>{costRow("Subtotal", BRL(cc.extraSub))}</div>
                    </div>
                    <div style={{ ...grid(3), marginBottom: 12, alignItems: "end" }}>
                      <div><label style={S.label}>Taxa de locação (%)</label><input type="number" {...fp(`cf${c.id}`)} value={c.feePct} onChange={(e) => updItem("cars", c.id, { feePct: e.target.value })} /></div>
                      <div style={{ gridColumn: "span 2" }}>{costRow("Taxa", BRL(cc.fee))}</div>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: GOODBG, borderRadius: 9, padding: "10px 14px" }}>
                      <span style={{ fontSize: 12, color: GOOD, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em" }}>Total</span>
                      <span style={{ fontSize: 16, fontWeight: 600, color: GOOD, ...S.num }}>{BRL(cc.total)}</span>
                    </div>
                  </div>
                  <div style={{ textAlign: "right", marginTop: 12 }}><button style={btn("danger")} onClick={() => delItem("cars", c.id)}><IcX size={13} />Remover</button></div>
                </div>
              );
            })}
            {opt.cars.length === 0 && <div style={{ color: FAINT, fontSize: 13, padding: "4px 0" }}>Nenhum carro adicionado.</div>}
            {opt.cars.length > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: INK, color: "#fff", borderRadius: 10, padding: "12px 16px", marginTop: 4 }}>
                <span style={{ fontSize: 12.5, color: "rgba(255,255,255,.7)" }}>Total de todos os carros</span>
                <span style={{ fontSize: 16, fontWeight: 600, ...S.num }}>{BRL(optionTotals(opt).carsAll)}</span>
              </div>
            )}
          </div>

          {/* RESUMO */}
          {(() => {
            const t = optionTotals(opt);
            const row = (label, val) => (
              <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,.1)" }}>
                <span style={{ fontSize: 13, color: "rgba(255,255,255,.7)" }}>{label}</span>
                <span style={{ fontSize: 13.5, ...S.num }}>{BRL(val)}</span>
              </div>
            );
            return (
              <div style={{ background: INK, color: "#fff", borderRadius: 14, padding: "22px 24px" }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,.5)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 14 }}>Resumo financeiro · menor preço de cada</div>
                {row("Voos", t.flights)}
                {row("Hospedagem", t.hotels)}
                {row("Aluguel de carro", t.cars)}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 16 }}>
                  <span style={{ fontSize: 13, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.06em" }}>Total geral</span>
                  <span style={{ fontSize: 28, fontWeight: 600, color: "#7ec99f", ...S.num }}>{BRL(t.grand)}</span>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* Preview */}
      {showPreview && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(28,25,23,.55)", zIndex: 9998, display: "flex", flexDirection: "column" }}>
          <div style={{ background: INK, color: "#fff", padding: "12px 18px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 13, fontWeight: 500, color: "rgba(255,255,255,.7)" }}>Pré-visualização da cotação</span>
            <div style={{ display: "flex", gap: 8 }}>
              <button style={btn("solidLight")} onClick={downloadPDF}><IcDownload size={15} />Baixar PDF</button>
              <button style={btn("ghostLight")} onClick={copyHTML}><IcCopy size={15} />Copiar HTML</button>
              <button style={btn("ghostLight")} onClick={() => setShowPreview(false)}><IcX size={15} />Fechar</button>
            </div>
          </div>
          <div style={{ flex: 1, overflow: "auto", background: PAGE, padding: 28 }} dangerouslySetInnerHTML={{ __html: buildHTML() }} />
        </div>
      )}
    </div>
  );
}