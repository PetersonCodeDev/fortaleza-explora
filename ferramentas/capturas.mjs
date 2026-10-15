// Tira capturas de tela do app em alta resolução (para slides e documentação), controlando o Edge invisível
// pelo protocolo DevTools (CDP). Não precisa instalar nada. Uso:
//   1) deixe o app rodando:   python -m http.server 5180     (na pasta do projeto)
//   2) node ferramentas/capturas.mjs [http://localhost:5180/]
// Saída: docs/apresentacao/img/*.jpg
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const base = process.argv[2] ?? "http://localhost:5180/";
const so = process.argv[3]?.split(",");
const quer = (nome) => !so || so.some((x) => nome.startsWith(x));
const saida = path.join(raiz, "docs", "apresentacao", "img");
fs.mkdirSync(saida, { recursive: true });
const EDGE = ["C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe", "C:/Program Files/Microsoft/Edge/Application/msedge.exe", "C:/Program Files/Google/Chrome/Application/chrome.exe"].find((p) => fs.existsSync(p));
if (!EDGE) throw new Error("Edge/Chrome não encontrado");
const espera = (ms) => new Promise((r) => setTimeout(r, ms));

const perfil = fs.mkdtempSync(path.join(os.tmpdir(), "fx-cap-"));
const proc = spawn(EDGE, ["--headless=new", "--remote-debugging-port=9333", `--user-data-dir=${perfil}`, "--no-first-run", "--hide-scrollbars", "--force-color-profile=srgb", "about:blank"], { stdio: "ignore" });
let alvo;
for (let i = 0; i < 40 && !alvo; i++) { await espera(500); try { alvo = (await (await fetch("http://127.0.0.1:9333/json")).json()).find((t) => t.type === "page"); } catch {} }
if (!alvo) { proc.kill(); throw new Error("não consegui conectar no navegador"); }

const ws = new WebSocket(alvo.webSocketDebuggerUrl);
await new Promise((r) => (ws.onopen = r));
let n = 0; const pend = new Map();
ws.onmessage = (m) => { const d = JSON.parse(m.data); if (d.id && pend.has(d.id)) { pend.get(d.id)(d); pend.delete(d.id); } };
const cdp = (method, params = {}) => new Promise((res, rej) => { const id = ++n; pend.set(id, (d) => (d.error ? rej(new Error(d.error.message)) : res(d.result))); ws.send(JSON.stringify({ id, method, params })); });
const js = async (expr) => { const r = await cdp("Runtime.evaluate", { expression: expr, awaitPromise: true, returnByValue: true }); if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description ?? "erro no script"); return r.result.value; };
await cdp("Page.enable");

// espera o app desenhar a lista e as fotos terminarem de carregar (até 25 s)
async function pronto() {
  for (let i = 0; i < 50; i++) {
    const ok = await js(`document.querySelectorAll('.item').length > 0 && [...document.querySelectorAll('img.foto')].slice(0,6).every(i => i.complete)`).catch(() => false);
    if (ok) return;
    await espera(500);
  }
}
const DIAS = (d) => Date.now() - d * 86400000;
const PASSAPORTE = { "ponte-ingleses": DIAS(9), "dragao-do-mar": DIAS(9), "pirata-bar": DIAS(9), catedral: DIAS(5), "mercado-central": DIAS(5), "theatro-ja": DIAS(4), "praia-meireles": DIAS(2), coco: DIAS(1), "mercado-peixes": DIAS(1), "forte-assuncao": DIAS(5), "museu-ceara": DIAS(4) };

async function captura(nome, opcoes) {
  if (!quer(nome)) return;
  return capturaReal(nome, opcoes);
}
async function capturaReal(nome, { w, h, dsf = 2, mobile = false, tema = "claro", roteiro = [], passaporte = true, depois = "" , espera: ms = 3500, qualidade = 86 }) {
  await cdp("Emulation.setDeviceMetricsOverride", { width: w, height: h, deviceScaleFactor: dsf, mobile });
  await cdp("Emulation.setTouchEmulationEnabled", { enabled: mobile });
  if (mobile) await cdp("Emulation.setUserAgentOverride", { userAgent: "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Mobile Safari/537.36" });
  await cdp("Page.navigate", { url: base });
  await espera(2500);
  await js(`localStorage.clear(); localStorage.setItem('fx_tema', ${JSON.stringify(JSON.stringify(tema))}); localStorage.setItem('fx_passaporte', ${JSON.stringify(JSON.stringify(passaporte ? PASSAPORTE : {}))}); localStorage.setItem('fx_roteiro', ${JSON.stringify(JSON.stringify(roteiro))}); 1`);
  await cdp("Page.navigate", { url: base });
  await pronto();
  await espera(ms);
  if (depois) { await js(`(async()=>{ ${depois} })()`); }
  await espera(1200);
  const r = await cdp("Page.captureScreenshot", { format: "jpeg", quality: qualidade });
  fs.writeFileSync(path.join(saida, `${nome}.jpg`), Buffer.from(r.data, "base64"));
  console.log("ok", nome);
}
const clica = (sel, ms = 600) => `document.querySelector(${JSON.stringify(sel)}).click(); await new Promise(r=>setTimeout(r,${ms}));`;
const dorme = (ms) => `await new Promise(r=>setTimeout(r,${ms}));`;
const PC = { w: 1440, h: 900, dsf: 2 };
const CEL = { w: 390, h: 844, dsf: 3, mobile: true };

try {
  await captura("01-home-claro", { ...PC });
  await captura("02-home-escuro", { ...PC, tema: "escuro" });
  await captura("03-detalhe-ponte", { ...PC, depois: clica('[data-id="ponte-ingleses"]', 4500) });
  await captura("04-praia-condicoes", { ...PC, depois: clica('[data-id="praia-meireles"]', 5000) + `document.querySelector('#folha').scrollTop = 330;` + dorme(400) });
  await captura("05-rotas-comparadas", { ...PC, espera: 3500, depois: clica('[data-id="ponte-ingleses"]', 1500) + clica('#folha [data-rota="car"]', 11000) });
  await captura("06-busca-churrascaria", { ...PC, passaporte: false, depois: `const q=document.querySelector('#q'); q.value='churrascaria'; q.dispatchEvent(new Event('input')); ` + `for (let i = 0; i < 90; i++) { await new Promise(r=>setTimeout(r,1000)); const t = document.querySelector('#toast')?.textContent ?? ''; if (!document.querySelector('#toast').hidden && /encontrados|Nada encontrado|indispon/.test(t)) break; }` + dorme(2500) });
  await captura("07-busca-erro", { ...PC, passaporte: false, depois: `const q=document.querySelector('#q'); q.value='mercdo'; q.dispatchEvent(new Event('input')); ` + dorme(1500) });
  await captura("08-roteiro", { ...PC, roteiro: ["forte-assuncao", "passeio-publico", "museu-ceara", "praca-ferreira", "cine-sao-luiz", "theatro-ja", "catedral", "mercado-central"], depois: clica('[data-aba="roteiro"]', 800) + clica('[data-desenhar]', 1500) });
  await captura("09-passaporte", { ...PC, depois: clica('[data-aba="passaporte"]', 1200) });
  await captura("10-cel-lista", { ...CEL });
  await captura("11-cel-detalhe", { ...CEL, depois: clica('[data-id="theatro-ja"]', 4500) });
  await captura("12-cel-passaporte", { ...CEL, depois: clica('[data-aba="passaporte"]', 800) + `document.querySelector('#alca').click(); ` + dorme(1500) });
  await captura("13-cel-escuro", { ...CEL, tema: "escuro" });
  // cartão para Stories (gerado pelo próprio app)
  if (quer("14")) {
  await cdp("Emulation.setDeviceMetricsOverride", { width: 1200, height: 800, deviceScaleFactor: 1, mobile: false });
  await cdp("Page.navigate", { url: base }); await pronto(); await espera(1500);
  const b64 = await js(`(async()=>{ const { gerarCartao } = await import('./js/cartao.js'); const { DADOS, ROTEIROS } = await import('./js/data.js'); const { montarRoteiro } = await import('./js/search.js'); const r = ROTEIROS[0]; const { ordem, totalKm } = montarRoteiro(null, r.ids.map(id=>DADOS.find(p=>p.id===id))); const blob = await gerarCartao({ paradas: ordem, totalKm, titulo: 'Meu dia em Fortaleza' }); const buf = new Uint8Array(await blob.arrayBuffer()); let s=''; for (let i=0;i<buf.length;i+=0x8000) s+=String.fromCharCode.apply(null, buf.subarray(i,i+0x8000)); return btoa(s); })()`);
  fs.writeFileSync(path.join(saida, "14-cartao-stories.png"), Buffer.from(b64, "base64"));
  console.log("ok 14-cartao-stories");
  }
} finally { ws.close(); proc.kill(); await espera(1500); try { fs.rmSync(perfil, { recursive: true, force: true }); } catch {} }
