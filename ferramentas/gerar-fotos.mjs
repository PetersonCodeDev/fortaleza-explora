// Gera js/fotos.js: uma foto livre por lugar, COM autor e licença (necessários para o crédito correto).
// Fontes: arquivos do Wikimedia Commons escolhidos e conferidos à mão (DE_COMMONS) ou a imagem principal
// do artigo da Wikipédia de cada lugar (DE_ARTIGO). Só entram licenças livres; o resto é recusado.
// Como achar candidatas: node ferramentas/candidatas-commons.mjs   |   Uso: node ferramentas/gerar-fotos.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { DADOS } from "../js/data.js";

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const UA = { "User-Agent": "FortalezaExplora/1.0 (projeto de faculdade; github.com/PetersonCodeDev/fortaleza-explora)" };
const espera = (ms) => new Promise((r) => setTimeout(r, ms));
const limpa = (h) => String(h ?? "").replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();
const LIVRE = /^(CC BY(-SA)?\b|CC0|Public domain|PD\b|Attribution)/i;

// Conferidas visualmente em 15/10/2026 (folha de contatos). Lugares ausentes: sem foto livre adequada.
const DE_ARTIGO = { // título do artigo na Wikipédia em português
  "ponte-ingleses": "Ponte dos Ingleses", "dragao-do-mar": "Centro Dragão do Mar de Arte e Cultura", "mercado-central": "Mercado Central de Fortaleza",
  "catedral": "Catedral Metropolitana de Fortaleza", "theatro-ja": "Theatro José de Alencar", "praca-ferreira": "Praça do Ferreira",
  "cine-sao-luiz": "Cineteatro São Luiz", "passeio-publico": "Praça dos Mártires", "mauc": "Museu de Arte da Universidade Federal do Ceará",
  "beira-mar-feirinha": "Feira de Artesanato da Beira-Mar", "praia-meireles": "Praia de Meireles", "farol-mucuripe": "Farol do Mucuripe",
  "estoril": "Estoril (Fortaleza)", "coco": "Parque Estadual do Cocó", "sabiaguaba": "Parque Natural Municipal das Dunas de Sabiaguaba",
  "castelao": "Estádio Governador Plácido Castelo", "cumbuco": "Cumbuco", "lagoa-messejana": "Lagoa de Messejana",
  "palacio-luz": "Palácio da Luz", "palacio-abolicao": "Palácio da Abolição", "prainha-aquiraz": "Prainha (Aquiraz)",
  "parque-botanico": "Parque Estadual Botânico do Ceará",
  "mis": "Museu da Imagem e do Som do Ceará", "casa-alencar": "Casa de José de Alencar", "juvenal-galeno": "Casa de Juvenal Galeno",
  "sobrado-lourenco": "Sobrado Dr. José Lourenço", "estacao-artes": "Estação das Artes Belchior", "museu-humor": "Museu do Humor Cearense", "museu-industria": "Museu da Indústria",
  "museu-fotografia": "Museu da Fotografia Fortaleza", "teatro-sao-jose": "Teatro São José", "teatro-carlos-camara": "Teatro Carlos Câmara", "teatro-chico-anysio": "Teatro Chico Anysio",
  "biblioteca-estadual": "Biblioteca Pública Estadual do Ceará", "santa-casa": "Santa Casa de Misericórdia de Fortaleza",
  "liceu-ceara": "Liceu do Ceará", "cemiterio-sao-joao": "Cemitério São João Batista (Fortaleza)", "escola-artes-oficios": "Escola de Artes e Ofícios Thomaz Pompeu Sobrinho", "pinacoteca": "Pinacoteca do Ceará", "praia-mucuripe": "Praia do Mucuripe",
};
const DE_COMMONS = { // arquivo do Commons
  "estatua-iracema": "File:Estátua de Iracema Guardiã 02.jpg",
  "pirata-bar": "File:Rua dos Tabajaras 16.jpg",
  "museu-ceara": "File:Museu do Ceará. Ph Ivan Stesso.jpg",
  "praia-futuro": "File:JADEQUEIROZ PRAIA DO FUTURO FORTALEZA CE (40209532045).jpg",
  "beach-park": "File:Prai park 24 10 06 059.jpg",
  "parque-liberdade": "File:Cidade da Criança 01.jpg",
  "cais-pescadores": "File:Enseada do Mucuripe (3272133815).jpg",
  "caixa-cultural": "File:Antiga Alfândega de Fortaleza 01.jpg",
  "forte-assuncao": "File:Fortaleza de Nossa Senhora da Assunção.JPG",
};

async function chama(base, params) {
  for (let t = 0; t < 6; t++) {
    const r = await fetch(`${base}?${new URLSearchParams({ format: "json", origin: "*", ...params })}`, { headers: UA });
    if (r.status === 429) { await espera(15000 * (t + 1)); continue; }
    return r.json();
  }
  throw new Error("limite de pedidos");
}

// 1) imagem principal de cada artigo
const arquivos = { ...DE_COMMONS };
const q = (await chama("https://pt.wikipedia.org/w/api.php", { action: "query", redirects: "1", prop: "pageimages", piprop: "name", titles: Object.values(DE_ARTIGO).join("|") })).query;
const redir = new Map([...(q.normalized ?? []), ...(q.redirects ?? [])].map((x) => [x.from, x.to]));
const resolve = (t) => { let c = t, n = 0; while (redir.has(c) && n++ < 5) c = redir.get(c); return c; };
const porTitulo = new Map(Object.values(q.pages).map((p) => [p.title, p]));
for (const [id, titulo] of Object.entries(DE_ARTIGO)) {
  const pag = porTitulo.get(resolve(titulo));
  if (pag?.pageimage) arquivos[id] = `File:${pag.pageimage.replace(/_/g, " ")}`;
  else console.log(`  --  ${id}: artigo sem imagem principal`);
}
await espera(1500);

// 2) licença, autor e miniatura de cada arquivo (Commons)
const lista = Object.values(arquivos);
const info = new Map();
for (let i = 0; i < lista.length; i += 15) {
  const d = await chama("https://commons.wikimedia.org/w/api.php", { action: "query", titles: lista.slice(i, i + 15).join("|"), prop: "imageinfo", iiprop: "url|mime|extmetadata", iiurlwidth: "720" });
  const redirC = new Map([...(d.query.normalized ?? []), ...(d.query.redirects ?? [])].map((x) => [x.from, x.to]));
  for (const pg of Object.values(d.query.pages)) info.set(pg.title, pg);
  for (const [de, para] of redirC) if (info.has(para)) info.set(de, info.get(para));
  await espera(2000);
}

const fotos = {};
for (const p of DADOS) {
  const arq = arquivos[p.id];
  if (!arq) { console.log(`  --  ${p.id.padEnd(20)} sem foto`); continue; }
  const ii = info.get(arq)?.imageinfo?.[0];
  if (!ii) { console.log(`  XX  ${p.id.padEnd(20)} arquivo não encontrado: ${arq}`); continue; }
  const m = ii.extmetadata ?? {};
  const licenca = limpa(m.LicenseShortName?.value);
  if (!/^image\/(jpeg|png)$/.test(ii.mime) || !LIVRE.test(licenca)) { console.log(`  XX  ${p.id.padEnd(20)} recusada (${ii.mime}, "${licenca}")`); continue; }
  fotos[p.id] = { src: ii.thumburl, pagina: ii.descriptionurl, autor: limpa(m.Artist?.value).slice(0, 42) || "Wikimedia Commons", licenca };
  console.log(`  OK  ${p.id.padEnd(20)} ${arq.slice(5, 52).padEnd(48)} ${licenca} | ${fotos[p.id].autor}`);
}
const corpo = `// GERADO por ferramentas/gerar-fotos.mjs. Fotos do Wikimedia Commons (licenças livres).\n// Cada foto traz autor, licença e o link da página do arquivo, usados como crédito no app.\nexport const FOTOS = ${JSON.stringify(fotos, null, 2)};\n`;
fs.writeFileSync(path.join(raiz, "js", "fotos.js"), corpo);
console.log(`\n${Object.keys(fotos).length} fotos gravadas em js/fotos.js`);
