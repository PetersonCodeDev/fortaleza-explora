// Passaporte: carimbos dos lugares visitados e selos de conquista. Módulo puro (sem DOM), testado em Node.
// `visitados` é um objeto { idDoLugar: instante em ms }. Só lugares da base curada contam.

export const SELOS = [
  { id: "primeiro", nome: "Primeiro passo", desc: "Carimbe o seu primeiro lugar", ok: (r) => r.feitos >= 1 },
  { id: "praieiro", nome: "Praieiro", desc: "Visite 3 praias", ok: (r) => (r.porCategoria.praia?.feitos ?? 0) >= 3 },
  { id: "historia", nome: "Guardião da história", desc: "Visite 4 lugares de história", ok: (r) => (r.porCategoria.historia?.feitos ?? 0) >= 4 },
  { id: "cultura", nome: "Rato de museu", desc: "Visite 3 lugares de cultura", ok: (r) => (r.porCategoria.cultura?.feitos ?? 0) >= 3 },
  { id: "garfo", nome: "Boa de garfo", desc: "Visite um lugar para comer", ok: (r) => (r.porCategoria.gastronomia?.feitos ?? 0) >= 1 },
  { id: "natureza", nome: "Pé na trilha", desc: "Visite 2 lugares de natureza", ok: (r) => (r.porCategoria.natureza?.feitos ?? 0) >= 2 },
  { id: "coruja", nome: "Coruja", desc: "Visite um lugar da noite", ok: (r) => (r.porCategoria.noite?.feitos ?? 0) >= 1 },
  { id: "explorador", nome: "Explorador", desc: "Visite 10 lugares", ok: (r) => r.feitos >= 10 },
  { id: "cearense", nome: "Cearense de coração", desc: "Visite 20 lugares", ok: (r) => r.feitos >= 20 },
  { id: "tudo", nome: "Conhece tudo", desc: "Visite todos os lugares", ok: (r) => r.total > 0 && r.feitos >= r.total },
];

/** Totais gerais e por categoria + selos (conquistados ou não). */
export function resumoPassaporte(visitados, lugares) {
  const porCategoria = {};
  let feitos = 0;
  for (const p of lugares) {
    const c = (porCategoria[p.categoria] ??= { total: 0, feitos: 0 });
    c.total++;
    if (visitados[p.id]) { c.feitos++; feitos++; }
  }
  const base = { total: lugares.length, feitos, porCategoria };
  const selos = SELOS.map((s) => ({ id: s.id, nome: s.nome, desc: s.desc, conquistado: s.ok(base) }));
  return { ...base, selos };
}

/** Selos que passaram a ser conquistados entre dois resumos (para avisar "novo selo!"). */
export const selosNovos = (antes, depois) =>
  depois.selos.filter((s) => s.conquistado && !antes.selos.find((a) => a.id === s.id)?.conquistado);

/** Ângulo fixo (-7 a 7 graus) por lugar: o carimbo parece batido à mão, mas não muda a cada abertura. */
export function anguloCarimbo(id) {
  let h = 0;
  for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) | 0;
  return (Math.abs(h) % 15) - 7;
}

/** Nome curto e em maiúsculas para caber no carimbo. */
export function nomeCurto(nome, max = 15) {
  const limpo = nome.replace(/\(.*?\)/g, "").replace(/^(centro|museu|parque|praia|mercado|teatro|theatro)\s+(d[aeo]s?\s+)?/i, (m) => m).trim();
  const palavras = limpo.split(/\s+/).filter((w) => !/^(d[aeo]s?|e|of)$/i.test(w));
  let s = "";
  for (const w of palavras) { if ((s + " " + w).trim().length > max) break; s = (s + " " + w).trim(); }
  return (s || limpo.slice(0, max)).toUpperCase();
}
