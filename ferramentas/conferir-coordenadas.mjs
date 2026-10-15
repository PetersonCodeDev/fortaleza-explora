// Compara a posição de cada lugar da base com a do OpenStreetMap (Nominatim) e mostra a diferença em metros.
// Serve para achar pin no lugar errado. Resultado em ferramentas/coords-osm.json (conferir à mão antes de corrigir).
// Uso: node ferramentas/conferir-coordenadas.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { DADOS } from "../js/data.js";
import { haversine } from "../js/search.js";

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const UA = { "User-Agent": "FortalezaExplora/1.0 (projeto de faculdade; github.com/PetersonCodeDev/fortaleza-explora)" };
const espera = (ms) => new Promise((r) => setTimeout(r, ms));
// termos que o OpenStreetMap entende melhor que o nome "de vitrine" do app
const TERMO = {
  "estatua-iracema": "Estátua de Iracema Guardiã", "pirata-bar": "Rua dos Tabajaras", "roda-gigante": "Roda Gigante Fortaleza",
  "dragao-do-mar": "Centro Dragão do Mar de Arte e Cultura", "mauc": "Museu de Arte da Universidade Federal do Ceará",
  "ufc-benfica": "Reitoria Universidade Federal do Ceará", "beira-mar-feirinha": "Feira de Artesanato da Beira-Mar",
  "mercado-peixes": "Mercado dos Peixes Mucuripe", "cais-pescadores": "Colônia de Pescadores Mucuripe", "coco": "Parque do Cocó",
  "sabiaguaba": "Dunas da Sabiaguaba", "iguatemi": "Shopping Iguatemi", "castelao": "Arena Castelão", "beach-park": "Beach Park",
  "cumbuco": "Praia do Cumbuco", "tapioca-iracema": "Tapiocaria Praia de Iracema", "parque-liberdade": "Parque da Liberdade Cidade da Criança",
  "caixa-cultural": "Caixa Cultural Fortaleza", "lagoa-messejana": "Lagoa de Messejana", "parangaba-feira": "Mercado da Parangaba",
  "passeio-publico": "Passeio Público Praça dos Mártires", "praia-meireles": "Praia do Meireles", "praia-futuro": "Praia do Futuro",
};
const arq = path.join(raiz, "ferramentas", "coords-osm.json");
const saida = {};
for (const p of DADOS) {
  const q = `${TERMO[p.id] ?? p.nome.replace(/\(.*?\)/g, "").trim()}, Fortaleza, Ceará`;
  try {
    const r = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=3&q=${encodeURIComponent(q)}`, { headers: UA });
    const lista = r.ok ? await r.json() : [];
    saida[p.id] = lista.map((x) => ({ nome: x.display_name.split(",").slice(0, 3).join(","), lat: +x.lat, lon: +x.lon, m: Math.round(haversine(p, { lat: +x.lat, lon: +x.lon }) * 1000) }));
    const melhor = saida[p.id][0];
    console.log(`${p.id.padEnd(20)} ${melhor ? String(melhor.m).padStart(6) + " m  " + melhor.nome.slice(0, 60) : "(não achou)"}`);
  } catch (e) { console.log(`${p.id.padEnd(20)} erro ${e.message}`); }
  fs.writeFileSync(arq, JSON.stringify(saida, null, 1));
  await espera(1600);
}
