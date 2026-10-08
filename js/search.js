// Motor de busca e utilitários geográficos. Sem dependência de DOM: roda no navegador e no Node (testes).

/** Remove acentos, caixa e espaços extras: "Praça do Ferreira" -> "praca do ferreira". */
export const norm = (s) =>
  (s ?? "").toString().normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

/** Distância em km entre dois pontos {lat, lon} (fórmula de Haversine). */
export function haversine(a, b) {
  const R = 6371;
  const rad = (d) => (d * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLon = rad(b.lon - a.lon);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Distância de edição (Levenshtein) com programação dinâmica, usada para tolerar erros de digitação. */
export function levenshtein(a, b) {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    for (let j = 1; j <= b.length; j++) {
      const custo = a[i - 1] === b[j - 1] ? 0 : 1;
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + custo);
    }
    prev = cur;
  }
  return prev[b.length];
}

/** Intenções comuns -> termos que existem nos dados. Permite buscar "comer" e achar gastronomia. */
export const SINONIMOS = {
  comer: ["gastronomia", "restaurante", "comida", "tapioca", "peixe"],
  fome: ["gastronomia", "restaurante", "comida"],
  barato: ["gratis", "gratuito"],
  gratis: ["gratis", "gratuito"],
  passear: ["lazer", "parque", "praia", "natureza"],
  historia: ["historia", "museu", "forte", "igreja"],
  museu: ["museu", "cultura", "historia"],
  noite: ["noite", "bar", "musica", "show"],
  bar: ["noite", "bar", "musica"],
  crianca: ["familia", "criancas", "lazer"],
  familia: ["familia", "criancas"],
  foto: ["mirante", "por do sol", "paisagem"],
  sol: ["praia", "por do sol"],
  mar: ["praia", "mar"],
  arte: ["cultura", "arte", "museu", "galeria"],
  compras: ["compras", "artesanato", "shopping", "feira"],
  artesanato: ["artesanato", "compras", "feira"],
};

/** Texto pesquisável de um lugar (nome pesa mais que descrição, ver score()). */
function campos(p) {
  return {
    nome: norm(p.nome),
    bairro: norm(p.bairro),
    categoria: norm(p.categoria),
    tags: (p.tags ?? []).map(norm),
    desc: norm(p.descricao),
  };
}

/** Pontuação de relevância (0 = não casa). Combina correspondência exata, prefixo, sinônimos e erro de digitação. */
export function score(place, consulta) {
  const q = norm(consulta);
  if (!q) return 1;
  const f = campos(place);
  const tokens = q.split(/\s+/).filter(Boolean);
  let total = 0;
  for (const t of tokens) {
    const alvos = [t, ...(SINONIMOS[t] ?? []).map(norm)];
    let melhor = 0;
    alvos.forEach((alvo, i) => {
      const peso = i === 0 ? 1 : 0.6; // sinônimo vale menos que o termo digitado
      if (f.nome.includes(alvo)) melhor = Math.max(melhor, (f.nome.startsWith(alvo) ? 10 : 8) * peso);
      if (f.categoria === alvo) melhor = Math.max(melhor, 6 * peso);
      if (f.tags.some((x) => x === alvo)) melhor = Math.max(melhor, 6 * peso);
      if (f.tags.some((x) => x.includes(alvo))) melhor = Math.max(melhor, 4 * peso);
      if (f.bairro.includes(alvo)) melhor = Math.max(melhor, 5 * peso);
      if (f.desc.includes(alvo)) melhor = Math.max(melhor, 2 * peso);
    });
    // Tolerância a erros: "mercdo" ~ "mercado" (distância <= 1 para palavras curtas, <= 2 para longas)
    if (melhor === 0 && t.length >= 4) {
      const palavras = [...f.nome.split(/\s+/), ...f.tags, ...f.bairro.split(/\s+/)];
      const lim = t.length >= 7 ? 2 : 1;
      if (palavras.some((w) => Math.abs(w.length - t.length) <= lim && levenshtein(w, t) <= lim)) melhor = 3;
    }
    if (melhor === 0) return 0; // todos os termos precisam casar (AND)
    total += melhor;
  }
  return total;
}

const minutos = (hhmm) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};

/** Relógio de Fortaleza (UTC-3) para qualquer instante: turista com celular em outro fuso vê a hora certa. */
const FMT_FORTALEZA = new Intl.DateTimeFormat("en-US", { timeZone: "America/Fortaleza", weekday: "short", hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
export function relogioFortaleza(data = new Date()) {
  const p = Object.fromEntries(FMT_FORTALEZA.formatToParts(data).map((x) => [x.type, x.value]));
  return { dia: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(p.weekday), hora: Number(p.hour), min: Number(p.minute) };
}

const DIAS_CURTOS = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];
/** "Seg, ter, qua, das 09:00 às 18:00" a partir do horário do lugar. */
export function horarioTexto(h) {
  if (!h) return "Horário não informado";
  if (h === "24h") return "Aberto 24 horas";
  const dias = h.dias ?? [0, 1, 2, 3, 4, 5, 6];
  return `${dias.length === 7 ? "Todos os dias" : dias.map((d) => DIAS_CURTOS[d]).join(", ")}, das ${h.abre} às ${h.fecha}`;
}

/** true/false se o horário cobre `data`; null se o horário é desconhecido. Suporta virada de meia-noite. */
export function aberto(horario, data = new Date()) {
  if (!horario) return null;
  if (horario === "24h") return true;
  const rel = relogioFortaleza(data);
  const dia = rel.dia;
  const agora = rel.hora * 60 + rel.min;
  const ini = minutos(horario.abre);
  const fim = minutos(horario.fecha);
  const dias = horario.dias ?? [0, 1, 2, 3, 4, 5, 6];
  if (fim > ini) return dias.includes(dia) && agora >= ini && agora < fim;
  // vira a meia-noite: aberto de `ini` até 24h no dia, e de 0h até `fim` no dia seguinte
  const ontem = (dia + 6) % 7;
  return (dias.includes(dia) && agora >= ini) || (dias.includes(ontem) && agora < fim);
}

/**
 * Busca + filtros + ordenação.
 * opcoes: { q, categoria, origem, raioKm, apenasAbertos, apenasGratis, filtro(fn opcional), ordenar: 'relevancia'|'distancia'|'nota', data }
 */
export function buscar(lugares, opcoes = {}) {
  const { q = "", categoria = "todas", origem = null, raioKm = 0, apenasAbertos = false, apenasGratis = false, ordenar = "relevancia", data = new Date(), filtro = null } = opcoes;
  const out = [];
  for (const p of lugares) {
    if (categoria !== "todas" && p.categoria !== categoria) continue;
    if (apenasGratis && p.preco !== 0) continue;
    if (filtro && !filtro(p)) continue;
    if (apenasAbertos && aberto(p.horario, data) === false) continue;
    const dist = origem ? haversine(origem, p) : null;
    if (raioKm > 0 && dist !== null && dist > raioKm) continue;
    const s = score(p, q);
    if (s === 0) continue;
    out.push({ ...p, _score: s + (p._bonus ?? 0), _dist: dist });
  }
  const porNota = (a, b) => (b.nota ?? 0) - (a.nota ?? 0);
  out.sort((a, b) => {
    if (ordenar === "distancia" && origem) return a._dist - b._dist;
    if (ordenar === "nota") return porNota(a, b) || b._score - a._score;
    // relevância: score, depois nota, depois proximidade
    return b._score - a._score || porNota(a, b) || (a._dist ?? 0) - (b._dist ?? 0);
  });
  return out;
}

/** Sugestões de autocompletar: nomes e tags que começam/contêm o texto digitado. */
export function sugestoes(lugares, texto, limite = 6) {
  const q = norm(texto);
  if (q.length < 2) return [];
  const vistos = new Set();
  const lista = [];
  for (const p of lugares) {
    const n = norm(p.nome);
    if (n.includes(q) && !vistos.has(n)) {
      vistos.add(n);
      lista.push({ tipo: "lugar", texto: p.nome, id: p.id, ordem: n.startsWith(q) ? 0 : 1 });
    }
    for (const t of p.tags ?? []) {
      const nt = norm(t);
      if (nt.startsWith(q) && !vistos.has("#" + nt)) {
        vistos.add("#" + nt);
        lista.push({ tipo: "tag", texto: t, ordem: 2 });
      }
    }
  }
  return lista.sort((a, b) => a.ordem - b.ordem).slice(0, limite);
}

/**
 * Monta um roteiro visitando todos os lugares: heurística do vizinho mais próximo (guloso),
 * seguida de uma passada de 2-opt para remover cruzamentos. Retorna {ordem, totalKm}.
 */
export function montarRoteiro(origem, lugares) {
  if (!lugares.length) return { ordem: [], totalKm: 0 };
  const restantes = [...lugares];
  const ordem = [];
  let atual = origem ?? restantes[0];
  if (!origem) ordem.push(restantes.shift());
  while (restantes.length) {
    let idx = 0;
    let menor = Infinity;
    restantes.forEach((p, i) => {
      const d = haversine(atual, p);
      if (d < menor) { menor = d; idx = i; }
    });
    atual = restantes.splice(idx, 1)[0];
    ordem.push(atual);
  }
  const custo = (rota) => {
    let t = origem ? haversine(origem, rota[0]) : 0;
    for (let i = 1; i < rota.length; i++) t += haversine(rota[i - 1], rota[i]);
    return t;
  };
  let melhorou = true;
  let guarda = 0;
  while (melhorou && guarda++ < 50) {
    melhorou = false;
    for (let i = 0; i < ordem.length - 1; i++) {
      for (let j = i + 1; j < ordem.length; j++) {
        const nova = [...ordem.slice(0, i), ...ordem.slice(i, j + 1).reverse(), ...ordem.slice(j + 1)];
        if (custo(nova) + 1e-9 < custo(ordem)) { ordem.splice(0, ordem.length, ...nova); melhorou = true; }
      }
    }
  }
  return { ordem, totalKm: custo(ordem) };
}

export const formatarDistancia = (km) =>
  km == null ? "" : km < 1 ? `${Math.round(km * 100) * 10} m` : `${km.toFixed(km < 10 ? 1 : 0).replace(".", ",")} km`;

export const formatarDuracao = (seg) => {
  const min = Math.round(seg / 60);
  return min < 60 ? `${min} min` : `${Math.floor(min / 60)} h ${String(min % 60).padStart(2, "0")} min`;
};

/** Escapa HTML (nomes vindos do OpenStreetMap e relatos de usuários nunca entram crus no DOM). */
export const esc = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
