// Foto de cada lugar vem do artigo da Wikipédia que EU escolhi (CANDIDATOS). O script confirma que o
// artigo existe e tem imagem, e grava js/fotos.js (com link do artigo para dar o crédito).
// Uso: node ferramentas/gerar-fotos.mjs        (ver o que foi resolvido antes de publicar)
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { DADOS } from "../js/data.js";

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const UA = { "User-Agent": "FortalezaExplora/1.0 (projeto de faculdade; github.com/PetersonCodeDev/fortaleza-explora)" };

// id do lugar -> título do artigo na Wikipédia em português
// Conferidos à mão em 15/10/2026 (folha de contatos). Retirados por trazerem logotipo/mapa em vez de foto:
// museu-ceara, praia-futuro, beach-park.
const CANDIDATOS = {
  "ponte-ingleses": "Ponte dos Ingleses",
  "estatua-iracema": "Estátua de Iracema Guardiã",
  "dragao-do-mar": "Centro Dragão do Mar de Arte e Cultura",
  "acquario": "Aquário do Ceará",
  "mercado-central": "Mercado Central de Fortaleza",
  "catedral": "Catedral Metropolitana de Fortaleza",
  "theatro-ja": "Theatro José de Alencar",
  "praca-ferreira": "Praça do Ferreira",
  "cine-sao-luiz": "Cine São Luiz (Fortaleza)",
  "forte-assuncao": "Forte de Nossa Senhora da Assunção",
  "passeio-publico": "Passeio Público (Fortaleza)",
  "mauc": "Museu de Arte da Universidade Federal do Ceará",
  "praia-meireles": "Praia de Meireles",
  "mercado-peixes": "Mercado dos Peixes",
  "farol-mucuripe": "Farol do Mucuripe",
  "estoril": "Estoril (Fortaleza)",
  "coco": "Parque do Cocó",
  "sabiaguaba": "Parque Natural Municipal das Dunas de Sabiaguaba",
  "iguatemi": "Iguatemi Fortaleza",
  "castelao": "Estádio Governador Plácido Castelo",
  "cumbuco": "Cumbuco",
  "caixa-cultural": "Caixa Cultural (Fortaleza)",
  "lagoa-messejana": "Lagoa de Messejana",
  "beira-mar-feirinha": "Feira de Artesanato da Beira-Mar",
};

const titulos = Object.values(CANDIDATOS);
const u = `https://pt.wikipedia.org/w/api.php?action=query&format=json&redirects=1&titles=${encodeURIComponent(titulos.join("|"))}&prop=pageimages|info|pageprops&piprop=thumbnail&pithumbsize=720&inprop=url&ppprop=disambiguation&origin=*`;
const dados = (await (await fetch(u, { headers: UA })).json()).query;
const mapaRedir = new Map([...(dados.normalized ?? []), ...(dados.redirects ?? [])].map((x) => [x.from, x.to]));
const resolve = (t) => { let c = t, n = 0; while (mapaRedir.has(c) && n++ < 5) c = mapaRedir.get(c); return c; };
const porTitulo = new Map(Object.values(dados.pages).map((p) => [p.title, p]));

const fotos = {};
for (const p of DADOS) {
  const pedido = CANDIDATOS[p.id];
  if (!pedido) { console.log(`  --  ${p.id.padEnd(20)} (sem artigo escolhido)`); continue; }
  const pag = porTitulo.get(resolve(pedido));
  if (!pag || pag.missing !== undefined) { console.log(`  XX  ${p.id.padEnd(20)} artigo "${pedido}" NÃO existe`); continue; }
  if (pag.pageprops?.disambiguation !== undefined) { console.log(`  XX  ${p.id.padEnd(20)} "${pag.title}" é página de desambiguação`); continue; }
  if (!pag.thumbnail) { console.log(`  --  ${p.id.padEnd(20)} "${pag.title}" existe, mas sem foto`); continue; }
  if (/liberty|chicago|new york/i.test(pag.title)) { console.log(`  XX  ${p.id.padEnd(20)} "${pag.title}" parece ser de outra cidade`); continue; }
  fotos[p.id] = { src: pag.thumbnail.source.replace(/\?.*$/, ""), pagina: pag.fullurl, titulo: pag.title };
  console.log(`  OK  ${p.id.padEnd(20)} → ${pag.title}`);
}
const corpo = `// GERADO por ferramentas/gerar-fotos.mjs: fotos de artigos da Wikipédia (Wikimedia Commons).\n// Cada foto tem a licença indicada na página do artigo (link abaixo, usado como crédito no app).\nexport const FOTOS = ${JSON.stringify(fotos, null, 2)};\n`;
fs.writeFileSync(path.join(raiz, "js", "fotos.js"), corpo);
console.log(`\n${Object.keys(fotos).length} fotos gravadas em js/fotos.js`);
