// Cartão do roteiro (1080x1920, formato Stories) desenhado em canvas. Divulga o app sem custo.
import { formatarDistancia } from "./search.js";

const AREIA = "#f4efe4", MAR = "#0b6e72", SOL = "#e2702a", SOL_CLARO = "#f29a52", TINTA = "#1c2a2d", MUTED = "#667679";

function rr(x, c, y, w, h, r) { // retângulo arredondado (compatível com navegadores sem roundRect)
  x.beginPath(); x.moveTo(c + r, y); x.arcTo(c + w, y, c + w, y + h, r); x.arcTo(c + w, y + h, c, y + h, r);
  x.arcTo(c, y + h, c, y, r); x.arcTo(c, y, c + w, y, r); x.closePath();
}
function reduzir(x, texto, largura) {
  if (x.measureText(texto).width <= largura) return texto;
  while (texto.length > 1 && x.measureText(texto + "…").width > largura) texto = texto.slice(0, -1);
  return texto + "…";
}

/** paradas: [{nome, bairro, lat, lon}] já na ordem de visita. Retorna um Blob PNG. */
export async function gerarCartao({ paradas, totalKm, titulo = "Meu dia em Fortaleza" }) {
  try { await Promise.all([document.fonts.load("400 80px Young Serif"), document.fonts.load("400 36px 'Atkinson Hyperlegible'"), document.fonts.load("700 36px 'Atkinson Hyperlegible'")]); } catch {}
  const W = 1080, H = 1920;
  const c = document.createElement("canvas"); c.width = W; c.height = H;
  const x = c.getContext("2d");
  const titulos = "Young Serif, Georgia, serif", corpo = "'Atkinson Hyperlegible', system-ui, sans-serif";

  x.fillStyle = AREIA; x.fillRect(0, 0, W, H);

  // faixa do topo: sol sobre as ondas
  x.fillStyle = MAR; x.fillRect(0, 0, W, 560);
  x.fillStyle = SOL_CLARO; x.beginPath(); x.arc(W - 250, 330, 120, 0, Math.PI * 2); x.fill();
  x.fillStyle = AREIA;
  for (let k = 0; k < 2; k++) {
    x.beginPath(); x.moveTo(0, 560);
    const base = 430 + k * 70;
    for (let px = 0; px <= W; px += 10) x.lineTo(px, base + Math.sin(px / 55 + k) * 14);
    x.lineTo(W, 560); x.closePath();
    x.globalAlpha = k ? 1 : 0.35; x.fill(); x.globalAlpha = 1;
  }
  x.fillStyle = "#fff"; x.textBaseline = "alphabetic";
  x.font = `600 34px ${corpo}`; x.fillText("FORTALEZA EXPLORA", 80, 150);
  x.font = `400 92px ${titulos}`;
  const linhas = titulo.length > 16 ? [titulo.slice(0, titulo.lastIndexOf(" ", 16)), titulo.slice(titulo.lastIndexOf(" ", 16) + 1)] : [titulo];
  linhas.forEach((l, i) => x.fillText(l, 80, 260 + i * 100));

  // mini-mapa estilizado com o caminho
  const mx = 80, my = 600, mw = W - 160, mh = 460;
  x.fillStyle = "#fffcf5"; rr(x, mx, my, mw, mh, 36); x.fill();
  x.strokeStyle = "#e2d9c6"; x.lineWidth = 3; x.stroke();
  const lats = paradas.map((p) => p.lat), lons = paradas.map((p) => p.lon);
  const fx = Math.cos((((Math.min(...lats) + Math.max(...lats)) / 2) * Math.PI) / 180);
  const dx = Math.max((Math.max(...lons) - Math.min(...lons)) * fx, 1e-4), dy = Math.max(Math.max(...lats) - Math.min(...lats), 1e-4);
  const esc = Math.min((mw - 140) / dx, (mh - 140) / dy);
  const ox = mx + (mw - dx * esc) / 2, oy = my + (mh - dy * esc) / 2;
  const pos = paradas.map((p) => [ox + (p.lon - Math.min(...lons)) * fx * esc, oy + (Math.max(...lats) - p.lat) * esc]);
  x.strokeStyle = SOL; x.lineWidth = 6; x.setLineDash([18, 14]); x.lineCap = "round";
  x.beginPath(); pos.forEach(([px, py], i) => (i ? x.lineTo(px, py) : x.moveTo(px, py))); x.stroke(); x.setLineDash([]);
  pos.forEach(([px, py], i) => {
    x.fillStyle = MAR; x.beginPath(); x.arc(px, py, 26, 0, Math.PI * 2); x.fill();
    x.strokeStyle = "#fff"; x.lineWidth = 4; x.stroke();
    x.fillStyle = "#fff"; x.font = `700 28px ${corpo}`; x.textAlign = "center"; x.textBaseline = "middle";
    x.fillText(String(i + 1), px, py + 1);
  });
  x.textAlign = "left"; x.textBaseline = "alphabetic";

  // lista de paradas
  const max = 6, mostradas = paradas.slice(0, max);
  let y = 1145;
  mostradas.forEach((p, i) => {
    x.fillStyle = MAR; x.beginPath(); x.arc(112, y - 14, 30, 0, Math.PI * 2); x.fill();
    x.fillStyle = "#fff"; x.font = `700 30px ${corpo}`; x.textAlign = "center"; x.fillText(String(i + 1), 112, y - 3); x.textAlign = "left";
    x.fillStyle = TINTA; x.font = `700 38px ${corpo}`; x.fillText(reduzir(x, p.nome, 840), 170, y - 4);
    if (p.bairro) { x.fillStyle = MUTED; x.font = `400 30px ${corpo}`; x.fillText(p.bairro, 170, y + 34); }
    y += 88;
  });
  if (paradas.length > max) { x.fillStyle = MUTED; x.font = `500 32px ${corpo}`; x.fillText(`+ ${paradas.length - max} paradas`, 170, y); }

  // rodapé
  x.fillStyle = TINTA; x.font = `400 40px ${titulos}`;
  x.fillText(`${paradas.length} paradas · ${formatarDistancia(totalKm)}`, 80, 1760);
  x.fillStyle = MUTED; x.font = `500 30px ${corpo}`;
  x.fillText("Fortaleza Explora · por Pedro Peterson", 80, 1825);

  return new Promise((ok) => c.toBlob(ok, "image/png"));
}
