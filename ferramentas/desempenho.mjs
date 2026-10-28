// Mede a fluidez do app num "celular lento": CPU 4x mais devagar, tela de 390x844, e três gestos:
// arrastar a gaveta, arrastar o mapa e rolar a lista. Compara a versão atual com variantes que desligam um suspeito de cada vez.
// Resultado: tempo médio por quadro, pior 5% e quadros acima de 33 ms (abaixo de 30 quadros por segundo = trava).
// Uso: (app rodando em http://localhost:5180/)  node ferramentas/desempenho.mjs [url] [lentidao]
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";

const base = process.argv[2] ?? "http://localhost:5180/";
const LENTIDAO = Number(process.argv[3] ?? 4);
const EDGE = ["C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe", "C:/Program Files/Microsoft/Edge/Application/msedge.exe", "C:/Program Files/Google/Chrome/Application/chrome.exe"].find((p) => fs.existsSync(p));
const espera = (ms) => new Promise((r) => setTimeout(r, ms));

const VARIANTES = {
  "atual (sem mudar nada)": "",
  "sem filtro de cor no mapa": ".leaflet-tile-pane{filter:none!important}",
  "sem sombra por filtro nos pins": ".leaflet-marker-icon.pin{filter:none!important;transition:none!important}",
  "sem textura de papel": ":root{--papel:none!important}",
  "sem animação de altura da gaveta": ".painel{transition:none!important}",
  "os quatro desligados": ".leaflet-tile-pane{filter:none!important}.leaflet-marker-icon.pin{filter:none!important;transition:none!important}:root{--papel:none!important}.painel{transition:none!important}",
};

const perfil = fs.mkdtempSync(path.join(os.tmpdir(), "fx-perf-"));
const proc = spawn(EDGE, ["--headless=new", "--remote-debugging-port=9334", `--user-data-dir=${perfil}`, "--no-first-run", "--hide-scrollbars", "about:blank"], { stdio: "ignore" });
let alvo;
for (let i = 0; i < 40 && !alvo; i++) { await espera(500); try { alvo = (await (await fetch("http://127.0.0.1:9334/json")).json()).find((t) => t.type === "page"); } catch {} }
if (!alvo) { proc.kill(); throw new Error("não conectou no navegador"); }
const ws = new WebSocket(alvo.webSocketDebuggerUrl);
await new Promise((r) => (ws.onopen = r));
let n = 0; const pend = new Map();
ws.onmessage = (m) => { const d = JSON.parse(m.data); if (d.id && pend.has(d.id)) { pend.get(d.id)(d); pend.delete(d.id); } };
const cdp = (method, params = {}) => new Promise((res, rej) => { const id = ++n; pend.set(id, (d) => (d.error ? rej(new Error(d.error.message)) : res(d.result))); ws.send(JSON.stringify({ id, method, params })); });
const js = async (expr) => { const r = await cdp("Runtime.evaluate", { expression: expr, awaitPromise: true, returnByValue: true }); if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description ?? "erro"); return r.result.value; };

await cdp("Page.enable");
await cdp("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
await cdp("Emulation.setTouchEmulationEnabled", { enabled: true });
await cdp("Emulation.setUserAgentOverride", { userAgent: "Mozilla/5.0 (Linux; Android 13; Moto G) AppleWebKit/537.36 Chrome/124 Mobile Safari/537.36" });

const REG = `window.__q = []; window.__on = false; (function loop(t){ if(window.__on){ const u = window.__ult ?? t; window.__q.push(t - u); } window.__ult = t; requestAnimationFrame(loop); })(performance.now());`;
const resumo = (q) => {
  const a = q.filter((x) => x > 0 && x < 1000).sort((x, y) => x - y);
  if (!a.length) return { n: 0, med: 0, p95: 0, lentos: 0 };
  return { n: a.length, med: a.reduce((s, x) => s + x, 0) / a.length, p95: a[Math.floor(a.length * 0.95)], lentos: a.filter((x) => x > 33).length };
};

async function rodar(css, tema) {
  await cdp("Emulation.setCPUThrottlingRate", { rate: 1 });
  await cdp("Page.navigate", { url: base });
  await espera(3000);
  await js(`localStorage.clear(); localStorage.setItem('fx_tema', ${JSON.stringify(JSON.stringify(tema))}); 1`);
  await cdp("Page.navigate", { url: base });
  for (let i = 0; i < 50; i++) { if (await js(`document.querySelectorAll('.item').length > 0`)) break; await espera(400); }
  await espera(3500);
  if (css) await js(`(()=>{ const s=document.createElement('style'); s.textContent=${JSON.stringify(css)}; document.head.appendChild(s); return 1 })()`);
  await js(REG);
  await cdp("Emulation.setCPUThrottlingRate", { rate: LENTIDAO });
  await espera(800);
  const res = {};

  // 1) arrastar a gaveta com o dedo (sobe e desce duas vezes)
  await js(`window.__q.length = 0; window.__on = true; (async()=>{ const a=document.querySelector('#alca'); const e=(el,t,y)=>el.dispatchEvent(new PointerEvent(t,{pointerId:1,pointerType:'touch',clientY:y,clientX:195,bubbles:true,button:0})); const q=()=>new Promise(r=>requestAnimationFrame(r)); for (let v=0; v<2; v++){ e(a,'pointerdown',600); for(let i=1;i<=30;i++){ e(window,'pointermove',600-i*8); await q(); } for(let i=30;i>=0;i--){ e(window,'pointermove',600-i*8); await q(); } e(window,'pointerup',600); await new Promise(r=>setTimeout(r,300)); } window.__on=false; })()`);
  await espera(4000);
  res.gaveta = resumo(await js(`window.__q`));

  // 2) arrastar o mapa
  await js(`window.__q.length = 0; window.__on = true; 1`);
  for (let i = 0; i < 3; i++) {
    await cdp("Input.synthesizeScrollGesture", { x: 195, y: 250, xDistance: i % 2 ? 350 : -350, yDistance: 120, speed: 700, gestureSourceType: "touch" });
    await espera(200);
  }
  await js(`window.__on = false; 1`);
  res.mapa = resumo(await js(`window.__q`));

  // 3) rolar a lista (com a gaveta aberta)
  await js(`document.querySelector('#alca').click(); 1`); await espera(600); await js(`document.querySelector('#alca').click(); 1`); await espera(900);
  await js(`window.__q.length = 0; window.__on = true; 1`);
  for (let i = 0; i < 3; i++) { await cdp("Input.synthesizeScrollGesture", { x: 195, y: 500, yDistance: -900, speed: 1500, gestureSourceType: "touch" }); await espera(150); }
  await js(`window.__on = false; 1`);
  res.lista = resumo(await js(`window.__q`));
  return res;
}

const f = (x) => x.toFixed(0).padStart(3);
try {
  for (const tema of ["claro", "escuro"]) {
    console.log(`\n===== tema ${tema} · CPU ${LENTIDAO}x mais lenta · média / pior 5% / quadros lentos =====`);
    for (const [nome, css] of Object.entries(VARIANTES)) {
      if (tema === "escuro" && !["atual (sem mudar nada)", "os quatro desligados", "sem filtro de cor no mapa"].includes(nome)) continue;
      const r = await rodar(css, tema);
      const lin = (x) => `${f(x.med)}ms / ${f(x.p95)}ms / ${String(x.lentos).padStart(3)} de ${String(x.n).padStart(3)}`;
      console.log(`${nome.padEnd(34)} gaveta ${lin(r.gaveta)} | mapa ${lin(r.mapa)} | lista ${lin(r.lista)}`);
    }
  }
} finally { ws.close(); proc.kill(); await espera(1500); try { fs.rmSync(perfil, { recursive: true, force: true }); } catch {} }
