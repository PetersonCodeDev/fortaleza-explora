// Procura, no OpenStreetMap (Nominatim), o dado de acessibilidade para cadeira de rodas (wheelchair) de cada lugar da base
// e grava js/acessibilidade.js. Só entra o que o OpenStreetMap realmente tem: quando não há dado, fica "sem informação".
// Uso: node ferramentas/acessibilidade-osm.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { DADOS } from "../js/data.js";
import { haversine, norm } from "../js/search.js";

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const UA = { "User-Agent": "FortalezaExplora/1.0 (projeto de faculdade; github.com/PetersonCodeDev/fortaleza-explora)" };
const espera = (ms) => new Promise((r) => setTimeout(r, ms));
const BOBAGEM = new Set(["de", "do", "da", "dos", "das", "e", "o", "a", "museu", "centro", "praia", "parque", "praca", "teatro", "theatro", "mercado", "fortaleza"]);
const tokens = (s) => norm(s).replace(/\(.*?\)/g, "").split(/[^a-z0-9]+/).filter((t) => t.length > 2 && !BOBAGEM.has(t));

const saida = {};
let comDado = 0, semAchar = 0;
for (const p of DADOS) {
  const d = 0.004;
  const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=6&extratags=1&bounded=1&viewbox=${p.lon - d},${p.lat + d},${p.lon + d},${p.lat - d}&q=${encodeURIComponent(p.nome.replace(/\(.*?\)/g, "").trim())}`;
  let achou = null;
  try {
    const r = await fetch(url, { headers: UA });
    const lista = r.ok ? await r.json() : [];
    const meus = new Set(tokens(p.nome));
    achou = lista.map((x) => ({ x, m: Math.round(haversine(p, { lat: +x.lat, lon: +x.lon }) * 1000), nome: x.name ?? "" }))
      .filter((c) => c.m < 300 && tokens(c.nome).some((t) => meus.has(t)))
      .sort((a, b) => a.m - b.m)[0] ?? null;
  } catch (e) { console.log(`${p.id}: erro ${e.message}`); }
  const w = achou?.x.extratags?.wheelchair;
  if (!achou) { semAchar++; console.log(`  --  ${p.id.padEnd(22)} não achei no OSM perto`); }
  else if (!w) console.log(`  ..  ${p.id.padEnd(22)} achei "${achou.nome}" (${achou.m} m) mas sem dado de acessibilidade`);
  else { comDado++; saida[p.id] = { valor: w, desc: achou.x.extratags["wheelchair:description"] ?? null, osm: `${achou.x.osm_type}/${achou.x.osm_id}` }; console.log(`  OK  ${p.id.padEnd(22)} wheelchair=${w} (${achou.m} m) "${achou.nome}"`); }
  await espera(1600);
}
const corpo = `// GERADO por ferramentas/acessibilidade-osm.mjs em ${new Date().toISOString().slice(0, 10)}.\n// Dado colaborativo do OpenStreetMap (tag wheelchair: yes, limited, no, designated). Lugar ausente = sem informação.\nexport const ACESSIBILIDADE = ${JSON.stringify(saida, null, 2)};\n`;
fs.writeFileSync(path.join(raiz, "js", "acessibilidade.js"), corpo);
console.log(`\n${comDado} de ${DADOS.length} lugares com dado de acessibilidade; ${semAchar} não encontrados no OSM.`);
