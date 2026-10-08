// Gera uma página estática por lugar (para o Google encontrar) + sitemap.xml + robots.txt.
// Uso: SITE_URL=https://usuario.github.io/fortaleza-explora node ferramentas/gerar-paginas.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { DADOS, CATEGORIAS } from "../js/data.js";
import { horarioTexto } from "../js/search.js";

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const site = (process.env.SITE_URL ?? "").replace(/\/$/, "");
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const preco = (n) => (n === 0 ? "Entrada gratuita" : ["", "Preço baixo", "Preço médio", "Preço alto"][n] ?? "");

const lugarDir = path.join(raiz, "lugar");
fs.rmSync(lugarDir, { recursive: true, force: true });

for (const p of DADOS) {
  const cat = CATEGORIAS[p.categoria].nome;
  const titulo = `${p.nome} – ${cat} em Fortaleza | Fortaleza Explora`;
  const url = site ? `${site}/lugar/${p.id}/` : "";
  const ld = {
    "@context": "https://schema.org", "@type": "TouristAttraction", name: p.nome, description: p.descricao,
    geo: { "@type": "GeoCoordinates", latitude: p.lat, longitude: p.lon },
    address: { "@type": "PostalAddress", addressLocality: "Fortaleza", addressRegion: "CE", addressCountry: "BR", ...(p.bairro ? { streetAddress: p.bairro } : {}) },
    ...(url ? { url } : {}), isAccessibleForFree: p.preco === 0,
  };
  const outros = DADOS.filter((o) => o.categoria === p.categoria && o.id !== p.id).slice(0, 6);
  const html = `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(titulo)}</title>
<meta name="description" content="${esc(p.descricao)} ${esc(horarioTexto(p.horario))}.">
<meta name="author" content="Pedro Peterson">
${url ? `<link rel="canonical" href="${url}">` : ""}
<meta property="og:title" content="${esc(p.nome)} – Fortaleza Explora"><meta property="og:description" content="${esc(p.descricao)}"><meta property="og:type" content="article">
<link rel="icon" href="../../icons/icon.svg" type="image/svg+xml">
<link rel="stylesheet" href="../../css/fonts.css">
<style>body{margin:0;background:#f4efe4;color:#1c2a2d;font:16px/1.6 "Instrument Sans",system-ui,sans-serif}main{max-width:680px;margin:auto;padding:24px 18px 48px}h1{font:700 38px/1.1 Fraunces,Georgia,serif;margin:.2em 0}a{color:#0b6e72}.meta{color:#667679}.dica{border-left:3px solid #e2702a;padding-left:12px}.btn{display:inline-block;background:#0b6e72;color:#fff;padding:12px 18px;border-radius:12px;text-decoration:none;font-weight:600;margin:12px 8px 12px 0}footer{margin-top:40px;color:#667679;font-size:14px}@media(prefers-color-scheme:dark){body{background:#0f1a1c;color:#ece7da}.meta,footer{color:#92a3a5}a{color:#52c5b8}.btn{background:#52c5b8;color:#06201f}}</style>
<script type="application/ld+json">${JSON.stringify(ld)}</script></head>
<body><main>
<a href="../../">← Fortaleza Explora</a>
<h1>${esc(p.nome)}</h1>
<p class="meta">${esc(cat)}${p.bairro ? ` · ${esc(p.bairro)}` : ""} · ${esc(preco(p.preco))}${p.nota ? ` · nota ${String(p.nota).replace(".", ",")}` : ""}</p>
<p>${esc(p.descricao)}</p>
${p.dica ? `<p class="dica"><b>Dica local:</b> ${esc(p.dica)}</p>` : ""}
<p><b>Horário:</b> ${esc(horarioTexto(p.horario))}. <span class="meta">Confirme no local; horários podem mudar.</span></p>
<a class="btn" href="../../#lugar=${encodeURIComponent(p.id)}">Ver no mapa e traçar rota</a>
<a class="btn" style="background:transparent;color:inherit;border:1px solid #92a3a5" href="https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lon}">Google Maps</a>
${outros.length ? `<h2>Mais em ${esc(cat)}</h2><ul>${outros.map((o) => `<li><a href="../${o.id}/">${esc(o.nome)}</a></li>`).join("")}</ul>` : ""}
<footer>Fortaleza Explora · feito em Fortaleza por Pedro Peterson · Mapa © OpenStreetMap</footer>
</main></body></html>`;
  fs.mkdirSync(path.join(lugarDir, p.id), { recursive: true });
  fs.writeFileSync(path.join(lugarDir, p.id, "index.html"), html);
}

if (site) {
  const urls = [`${site}/`, ...DADOS.map((p) => `${site}/lugar/${p.id}/`)];
  fs.writeFileSync(path.join(raiz, "sitemap.xml"), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u) => `  <url><loc>${u}</loc></url>`).join("\n")}\n</urlset>\n`);
  fs.writeFileSync(path.join(raiz, "robots.txt"), `User-agent: *\nAllow: /\nSitemap: ${site}/sitemap.xml\n`);
}
console.log(`${DADOS.length} páginas geradas em lugar/${site ? " + sitemap.xml e robots.txt" : " (sem SITE_URL: sem sitemap)"}`);
