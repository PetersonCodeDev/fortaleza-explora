// Conjunto próprio de ícones (traço 1.8, grade 24). Sem emoji: visual consistente em qualquer aparelho.
const P = {
  praia: '<circle cx="12" cy="7" r="3"/><path d="M2 15c2.5 0 2.5-2 5-2s2.5 2 5 2 2.5-2 5-2 2.5 2 5 2M2 20c2.5 0 2.5-2 5-2s2.5 2 5 2 2.5-2 5-2 2.5 2 5 2"/>',
  historia: '<path d="M3 21h18M5 21V10M9.5 21V10M14.5 21V10M19 21V10M3 10l9-6 9 6z"/>',
  cultura: '<rect x="3" y="4" width="18" height="16" rx="1.5"/><path d="M3 15l5-4 4 3 3-2 6 5"/><circle cx="16" cy="9" r="1.4"/>',
  gastronomia: '<path d="M7 3v6a2 2 0 0 0 2 2v10M5 3v6a2 2 0 0 0 2 2M9 3v6a2 2 0 0 1-2 2M17 3c-2 2-3 5-3 8h3v10"/>',
  natureza: '<path d="M20 4C10 4 5 9 5 15c0 2 1 4 1 4s6 1 10-3 4-12 4-12z"/><path d="M5 20c3-6 7-9 11-11"/>',
  lazer: '<circle cx="12" cy="11" r="7"/><circle cx="12" cy="11" r="1.4"/><path d="M12 4v14M5 11h14M7 6l10 10M17 6L7 16M8 21l4-10 4 10"/>',
  noite: '<path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5z"/>',
  compras: '<path d="M5 8h14l-1 12H6z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>',
  todas: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
  busca: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>',
  local: '<circle cx="12" cy="12" r="3"/><circle cx="12" cy="12" r="8"/><path d="M12 1.5v3M12 19.5v3M1.5 12h3M19.5 12h3"/>',
  relatar: '<path d="M12 3l10 18H2z"/><path d="M12 10v5M12 18v.4"/>',
  mais: '<path d="M12 5v14M5 12h14"/>',
  fechar: '<path d="M6 6l12 12M18 6L6 18"/>',
  voltar: '<path d="M15 5l-7 7 7 7"/>',
  coracao: '<path d="M12 20s-8-5-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 9c0 6-8 11-8 11z"/>',
  estrela: '<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>',
  carro: '<path d="M5 16V11l2-5h10l2 5v5M3 16h18v3H3zM7 16v3M17 16v3"/><circle cx="8" cy="13" r=".6"/><circle cx="16" cy="13" r=".6"/>',
  pe: '<circle cx="13" cy="4" r="1.7"/><path d="M10 21l2-7-3-3 1-5 3 2 3 1M12 14l3 3v4M9 11l-2 3"/>',
  bike: '<circle cx="6" cy="16" r="3.5"/><circle cx="18" cy="16" r="3.5"/><path d="M6 16l4-8h5l3 8M10 8l5 8M9 8h-2"/>',
  rota: '<circle cx="6" cy="19" r="2"/><circle cx="18" cy="5" r="2"/><path d="M8 19h7a3 3 0 0 0 0-6H9a3 3 0 0 1 0-6h7"/>',
  compartilhar: '<circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="6" r="2.5"/><circle cx="18" cy="18" r="2.5"/><path d="M8.2 10.8l7.6-3.6M8.2 13.2l7.6 3.6"/>',
  sol: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M5 5l1.8 1.8M17.2 17.2L19 19M5 19l1.8-1.8M17.2 6.8L19 5"/>',
  lua: '<path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5z"/>',
  chuva: '<path d="M7 15a4.5 4.5 0 0 1 .5-9A6 6 0 0 1 19 8a3.5 3.5 0 0 1-1 7zM8 18l-1 3M12 18l-1 3M16 18l-1 3"/>',
  dado: '<rect x="4" y="4" width="16" height="16" rx="3"/><circle cx="9" cy="9" r="1"/><circle cx="15" cy="15" r="1"/><circle cx="12" cy="12" r="1"/>',
  relogio: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  lotado: '<circle cx="9" cy="8" r="3"/><circle cx="17" cy="9" r="2.3"/><path d="M3 20c0-3.5 2.7-6 6-6s6 2.5 6 6M15 14.5c3 0 6 2 6 5.5"/>',
  fechado: '<circle cx="12" cy="12" r="9"/><path d="M5.6 5.6l12.8 12.8"/>',
  evento: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  dica: '<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-4 10.5c.7.7 1 1.5 1 2.5h6c0-1 .3-1.8 1-2.5A6 6 0 0 0 12 3z"/>',
  perigo: '<path d="M12 3l10 18H2z"/><path d="M12 10v5M12 18v.4"/>',
  externo: '<path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>',
  aqui: '<path d="M12 21s-7-6.2-7-12a7 7 0 0 1 14 0c0 5.8-7 12-7 12z"/><circle cx="12" cy="9" r="2.5"/>',
  lista: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
  mic: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>',
  som: '<path d="M4 9v6h4l5 4V5L8 9zM16.5 9a4 4 0 0 1 0 6M19 6.5a8 8 0 0 1 0 11"/>',
  parar: '<rect x="6" y="6" width="12" height="12" rx="2"/>',
  foto: '<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>',
  carimbo: '<path d="M9 3h6v6.5a3 3 0 0 1-1.5 2.6V14H18a2 2 0 0 1 2 2v2H4v-2a2 2 0 0 1 2-2h4.5v-1.9A3 3 0 0 1 9 9.5z"/><path d="M4 21h16"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  acessivel: '<circle cx="12" cy="4.2" r="1.7"/><path d="M12 7.5v6.5h4.6l2.4 5M12 10.6h4.2M8.1 12.4a5 5 0 1 0 6.6 7.4"/>',
  chevron: '<path d="M6 15l6-6 6 6"/>',
};

/** SVG inline de um ícone. `cheio` preenche (usado no coração e na estrela). */
export const icone = (nome, tam = 20, cheio = false) =>
  `<svg class="ic" width="${tam}" height="${tam}" viewBox="0 0 24 24" fill="${cheio ? "currentColor" : "none"}" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[nome] ?? ""}</svg>`;

/* ---------- Símbolos das categorias: desenhados para Fortaleza, em formas cheias (não são ícones de biblioteca) ---------- */
// Grade 24x24, cor = currentColor. Detalhes finos usam traço (stroke="currentColor") para não depender de cor fixa.
const GLIFOS = {
  // jangada: duas velas triangulares sobre os paus
  praia: '<path d="M13 3l7.4 12.2H13z"/><path d="M11 6.2L5.4 15.2H11z"/><path d="M3 17.3h18l-1.9 3H4.9z"/>',
  // muralha com ameias e portão em arco (a Fortaleza que deu nome à cidade)
  historia: '<path fill-rule="evenodd" d="M4 20.5V8h3.2v3.4h3.4V8h2.8v3.4h3.4V8H20v12.5zM10.2 20.5v-4.3a1.8 1.8 0 0 1 3.6 0v4.3z"/>',
  // máscara de teatro com olhos e sorriso vazados
  cultura: '<path fill-rule="evenodd" d="M4.6 4.5h14.8v8.3a7.4 7.4 0 0 1-14.8 0zM8.2 9.6a1.5 1.5 0 1 0 3 0 1.5 1.5 0 1 0-3 0zM12.8 9.6a1.5 1.5 0 1 0 3 0 1.5 1.5 0 1 0-3 0zM8.3 14.2q3.7 3.6 7.4 0q-3.7 1.2-7.4 0z"/>',
  // caju: o fruto e a castanha, símbolo do Ceará
  gastronomia: '<path d="M11.6 7.4c3.8-.2 7 2.7 7 6.6 0 3.8-3 6.6-6.9 6.6s-6.9-2.8-6.9-6.6c0-3.6 2.6-6.4 6.8-6.6z"/><path d="M13.2 6.6c.1-2.2 2.2-3.8 4.6-3.4.4 2.4-1 4.4-3.3 4.8-.9.1-1.3-.4-1.3-1.4z"/>',
  // carnaúba: tronco e leque de folhas
  natureza: '<path d="M11.3 21.5l.5-11h.9l.5 11z"/><path d="M12.2 10.6c1.5-3.7 5.1-5.3 8.1-4.7-1.3 3.1-4.6 5.1-8.1 4.7z"/><path d="M12.2 10.6C10.7 6.9 7 5.3 4 5.9c1.3 3.1 4.6 5.1 8.2 4.7z"/><path d="M12.2 9.8C10.4 7 10.5 4.1 12.2 2.3c1.7 1.8 1.8 4.7 0 7.5z"/>',
  // pipa de kitesurf, com a cauda
  lazer: '<path d="M12 2.4l6.2 6.3-6.2 6.5-6.2-6.5z"/><path d="M12 15.3c-1.6 1.5.9 2.5-.6 4.4M12 15.3c1.6 1.4-.8 2.6.7 4.6" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>',
  // lua crescente e uma estrela
  noite: '<path d="M16.8 15.6A7.3 7.3 0 1 1 8.7 4.9a5.9 5.9 0 0 0 8.1 10.7z"/><path d="M18.8 3.6l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z"/>',
  // sacola de compras com alça
  compras: '<path d="M5.4 9.2h13.2l-1.3 11.3H6.7z"/><path d="M9 9.2V7.6a3 3 0 0 1 6 0v1.6" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>',
};
/** Caminhos do símbolo da categoria (para desenhar dentro de outro SVG, como o carimbo do passaporte). */
export const glifoPaths = (cat) => GLIFOS[cat] ?? GLIFOS.lazer;

// borda do selo: 12 "dentes" de carimbo/selo postal, calculada uma vez
const BORDA_SELO = (() => {
  const n = 12, R = 14.2, rs = 4.3, c = 17;
  let d = "";
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * 2 * Math.PI;
    const x = (c + R * Math.cos(a)).toFixed(2), y = (c + R * Math.sin(a)).toFixed(2);
    d += i === 0 ? `M${x} ${y}` : `A${rs} ${rs} 0 0 1 ${x} ${y}`;
  }
  return d + "z";
})();

/**
 * Marcador do mapa: um selo recortado (como o carimbo do passaporte) na cor da categoria, com o símbolo dentro.
 * `sel` = lugar aberto (maior, com aro laranja). `visitado` = já carimbado (bolinha com check no canto).
 */
export const seloSvg = (cat, cor, sel = false, visitado = false) =>
  `<svg width="${sel ? 54 : 38}" height="${sel ? 54 : 38}" viewBox="-3 -3 40 40" aria-hidden="true">
    <path d="${BORDA_SELO}" fill="rgba(0,0,0,.30)" stroke="rgba(0,0,0,.30)" stroke-width="3.2" stroke-linejoin="round"/>
    ${sel ? '<circle cx="17" cy="17" r="18.4" fill="none" stroke="#D4601C" stroke-width="2.4"/>' : ""}
    <path d="${BORDA_SELO}" fill="${cor}" stroke="#FBF7EE" stroke-width="1.5" stroke-linejoin="round"/>
    <circle cx="17" cy="17" r="11" fill="none" stroke="#FBF7EE" stroke-width=".9" stroke-dasharray="1.3 1.7" opacity=".85"/>
    <g transform="translate(10.1 10.1) scale(.58)" fill="#FBF7EE" color="#FBF7EE">${glifoPaths(cat)}</g>
    ${visitado ? '<circle cx="29.5" cy="4.5" r="4.4" fill="#D4601C" stroke="#FBF7EE" stroke-width="1.4"/><path d="M27.5 4.6l1.5 1.5 2.7-2.9" fill="none" stroke="#FBF7EE" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>' : ""}
  </svg>`;

/** Jangada em estilo xilogravura (arte de cordel do Ceará): traço grosso e hachuras. Cores vêm do tema. */
export const jangadaSvg = `<svg class="jangada" viewBox="0 0 220 132" aria-hidden="true">
  <defs>
    <pattern id="jg-tinta" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(38)"><line x1="0" y1="0" x2="0" y2="5" stroke-width="2.2" style="stroke:var(--ink)"/></pattern>
    <pattern id="jg-sol" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(-38)"><line x1="0" y1="0" x2="0" y2="5" stroke-width="2.4" style="stroke:var(--sol)"/></pattern>
  </defs>
  <g style="stroke:var(--sol)" stroke-width="3" stroke-linecap="round"><circle cx="178" cy="34" r="9" fill="none"/><path d="M178 16v-5M193 21l3-3M198 36h5M163 21l-3-3M158 36h-5"/></g>
  <path d="M110 18v78" style="stroke:var(--ink)" stroke-width="3.4" stroke-linecap="round"/>
  <path d="M114 22l56 66h-56z" fill="url(#jg-tinta)" style="stroke:var(--ink)" stroke-width="3" stroke-linejoin="round"/>
  <path d="M106 36L72 88h34z" fill="url(#jg-sol)" style="stroke:var(--sol)" stroke-width="3" stroke-linejoin="round"/>
  <g style="stroke:var(--ink)" stroke-width="7" stroke-linecap="round"><path d="M42 97h140"/><path d="M52 108h120"/></g>
  <g style="stroke:var(--bg)" stroke-width="1.6" stroke-linecap="round"><path d="M66 97h6M96 97h6M130 97h6M158 97h6M78 108h6M114 108h6M146 108h6"/></g>
  <g fill="none" style="stroke:var(--ink)" stroke-width="3" stroke-linecap="round"><path d="M10 119q10-8 20 0t20 0 20 0 20 0 20 0 20 0 20 0 20 0 20 0"/><path d="M30 127q8-6 16 0t16 0 16 0 16 0 16 0 16 0 16 0" stroke-width="2" opacity=".6"/></g>
</svg>`;
