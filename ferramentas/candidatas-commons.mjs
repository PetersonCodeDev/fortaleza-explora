// Procura no Wikimedia Commons fotos livres para os lugares que ainda não têm foto.
// Só guarda arquivos com licença livre (CC BY, CC BY-SA, CC0, domínio público) e mostra autor e licença.
// Saída: ferramentas/candidatas.json (para você conferir as imagens à mão antes de aprovar).
// Uso: node ferramentas/candidatas-commons.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const UA = { "User-Agent": "FortalezaExplora/1.0 (projeto de faculdade; github.com/PetersonCodeDev/fortaleza-explora)" };
const API = "https://commons.wikimedia.org/w/api.php";

// id do lugar -> termos de busca (tentados em ordem até juntar candidatos suficientes)
const BUSCAS = {
  "forte-assuncao": ["Fortaleza de Nossa Senhora da Assunção", "Forte Schoonenborch Fortaleza"],
  "estatua-iracema": ["Estátua de Iracema Guardiã", "Iracema Guardiã Fortaleza"],
  "pirata-bar": ["Rua dos Tabajaras Fortaleza", "Praia de Iracema noite Fortaleza"],
  "roda-gigante": ["Roda gigante Fortaleza", "Fortaleza ferris wheel"],
  "acquario": ["Acquario Ceará", "Acquário Ceará Fortaleza"],
  "ufc-benfica": ["Reitoria Universidade Federal do Ceará", "UFC Benfica Fortaleza"],
  "museu-ceara": ["Museu do Ceará Fortaleza"],
  "mercado-peixes": ["Mercado dos Peixes Mucuripe", "Mucuripe Fortaleza pescadores"],
  "praia-futuro": ["Praia do Futuro Fortaleza", "Praia do Futuro barracas"],
  "iguatemi": ["Shopping Iguatemi Fortaleza"],
  "beach-park": ["Beach Park Aquiraz", "Beach Park Ceará"],
  "tapioca-iracema": ["Tapioca Brasil recheada", "Tapioca com queijo coalho"],
  "parque-liberdade": ["Cidade da Criança Fortaleza", "Parque da Liberdade Fortaleza"],
  "cais-pescadores": ["Jangadas Fortaleza Mucuripe", "Jangada Ceará praia"],
  "caixa-cultural": ["Caixa Cultural Fortaleza"],
  "parangaba-feira": ["Mercado da Parangaba", "Parangaba Fortaleza"],
};
const LIVRE = /^(CC BY(-SA)? [\d.]+|CC BY(-SA)?( [\d.]+)?( \w+)?|CC0.*|Public domain.*|PD.*|CC-BY.*|Attribution.*|GFDL.*CC.*)/i;
const espera = (ms) => new Promise((r) => setTimeout(r, ms));
const limpa = (h) => String(h ?? "").replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();

async function chama(params) {
  for (let t = 0; t < 6; t++) {
    const r = await fetch(`${API}?${new URLSearchParams({ format: "json", origin: "*", ...params })}`, { headers: UA });
    if (r.status === 429) { await espera(15000 * (t + 1)); continue; }
    return r.json();
  }
  throw new Error("limite de pedidos");
}

const arq = path.join(raiz, "ferramentas", "candidatas.json");
const saida = fs.existsSync(arq) ? JSON.parse(fs.readFileSync(arq, "utf8")) : {}; // retoma de onde parou
for (const [id, termos] of Object.entries(BUSCAS)) {
  if (saida[id]?.length) { console.log(`${id.padEnd(18)} (já tinha)`); continue; }
  const vistos = new Map();
  for (const termo of termos) {
    const b = await chama({ action: "query", list: "search", srnamespace: "6", srsearch: termo, srlimit: "10" });
    const titulos = (b.query?.search ?? []).map((x) => x.title);
    if (!titulos.length) { await espera(2500); continue; }
    const d = await chama({ action: "query", titles: titulos.join("|"), prop: "imageinfo", iiprop: "url|size|mime|extmetadata", iiurlwidth: "720" });
    for (const pg of Object.values(d.query?.pages ?? {})) {
      const ii = pg.imageinfo?.[0];
      if (!ii || !/^image\/(jpeg|png)$/.test(ii.mime) || ii.width < 900 || ii.height < 500) continue;
      const m = ii.extmetadata ?? {};
      const licenca = limpa(m.LicenseShortName?.value);
      if (!LIVRE.test(licenca)) continue;
      if (/(logo|mapa|map |flag|bandeira|escudo|brasão)/i.test(pg.title)) continue;
      vistos.set(pg.title, { arquivo: pg.title, miniatura: ii.thumburl, pagina: ii.descriptionurl, largura: ii.width, altura: ii.height, licenca, autor: limpa(m.Artist?.value).slice(0, 80), descricao: limpa(m.ImageDescription?.value).slice(0, 110) });
    }
    await espera(2500);
  }
  saida[id] = [...vistos.values()].slice(0, 6);
  console.log(`${id.padEnd(18)} ${saida[id].length} candidata(s)`);
  fs.writeFileSync(arq, JSON.stringify(saida, null, 1));
}
fs.writeFileSync(path.join(raiz, "ferramentas", "candidatas.json"), JSON.stringify(saida, null, 1));
console.log("\nGravado em ferramentas/candidatas.json");
