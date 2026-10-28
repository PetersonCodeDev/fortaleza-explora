import { DADOS, CATEGORIAS, ROTEIROS } from "./data.js";
import { buscar, sugestoes, montarRoteiro, aberto, haversine, norm, formatarDistancia, formatarDuracao, horarioTexto, esc } from "./search.js";
import { horasDoSol, horaPorDoSol, periodo, estaChovendo, sugestaoAgora, luzDourada, hhmm } from "./agora.js";
import { gerarCartao } from "./cartao.js";
import { icone, pinSvg, iconePaths, jangadaSvg } from "./icons.js";
import { FOTOS } from "./fotos.js";
import { lerCondicoes, linhasCondicoes, conselhos, nivelAcesso, TEXTO_ACESSO } from "./condicoes.js";
import { ACESSIBILIDADE } from "./acessibilidade.js";
import { resumoPassaporte, selosNovos, anguloCarimbo, nomeCurto } from "./passaporte.js";
import { CONFIG } from "./config.js";

/* ---------- utilidades e estado ---------- */
const $ = (s) => document.querySelector(s);
const CENTRO = { lat: -3.7319, lon: -38.5267 };
const TIPOS_RELATO = {
  lotado: { nome: "Lotado", icone: "lotado" },
  fechado: { nome: "Fechado ou interditado", icone: "fechado" },
  evento: { nome: "Tem evento", icone: "evento" },
  dica: { nome: "Dica", icone: "dica" },
  perigo: { nome: "Atenção", icone: "perigo" },
};
const TTL_RELATO_MS = 6 * 60 * 60 * 1000; // relatos expiram em 6 h, como no Waze
const POR_PAGINA = 40;

const guardar = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
const ler = (k, padrao) => { try { return JSON.parse(localStorage.getItem(k)) ?? padrao; } catch { return padrao; } };
const minAtras = (ts) => Math.max(1, Math.round((Date.now() - ts) / 60000));

const estado = {
  q: "", categoria: "todas", ordenar: "relevancia", raioKm: 0, apenasAbertos: false, apenasGratis: false, apenasAcessivel: false,
  origem: null, extras: ler("fx_osm", []), selecionado: null, modoRelato: false, limite: POR_PAGINA,
  agora: { por: null, chovendo: false, temp: null, sugestao: null }, usarAgora: false,
  gaveta: "meio", gavetaAntes: "meio", buscandoOnline: false, buscasOnline: new Set(), guia: null,
  passaporte: ler("fx_passaporte", {}),
  favoritos: new Set(ler("fx_fav", [])),
  roteiro: ler("fx_roteiro", []),
  relatos: ler("fx_relatos", []).filter((r) => Date.now() - r.ts < TTL_RELATO_MS),
};
const todos = () => [...DADOS, ...estado.extras];
const porId = (id) => todos().find((p) => p.id === id);
const corDe = (p) => (CATEGORIAS[p.categoria] ?? CATEGORIAS.lazer).cor;
const catDe = (p) => (CATEGORIAS[p.categoria] ? p.categoria : "lazer");

/* ---------- mapa ---------- */
const mapa = L.map("map", { zoomControl: false }).setView([-3.74, -38.5], 12);
L.control.zoom({ position: "bottomright" }).addTo(mapa);
L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
}).addTo(mapa);
const camadaLugares = L.layerGroup().addTo(mapa);
const camadaRelatos = L.layerGroup().addTo(mapa);
const camadaRota = L.layerGroup().addTo(mapa);
let marcadorVoce = null;
const marcadores = new Map(); // id -> marker (só mexe no que mudou: mais fluido)

const iconePin = (p, sel) => L.divIcon({
  className: `pin ${p._osm ? "osm" : ""}`, iconSize: sel ? [40, 50] : [32, 40], iconAnchor: sel ? [20, 50] : [16, 40],
  html: pinSvg(catDe(p), corDe(p), sel),
});

function sincronizarMarcadores() {
  const ids = new Set(resultados.map((p) => p.id));
  for (const [id, m] of marcadores) if (!ids.has(id)) { camadaLugares.removeLayer(m); marcadores.delete(id); }
  for (const p of resultados) {
    const sel = p.id === estado.selecionado;
    let m = marcadores.get(p.id);
    if (!m) {
      m = L.marker([p.lat, p.lon], { icon: iconePin(p, sel), title: p.nome, keyboard: false }).on("click", () => abrirDetalhe(p.id)).addTo(camadaLugares);
      m._sel = sel; marcadores.set(p.id, m);
    } else if (m._sel !== sel) { m.setIcon(iconePin(p, sel)); m._sel = sel; }
    m.setZIndexOffset(sel ? 1000 : 0);
  }
}

/* avisos curtos: só para confirmar ou avisar erro (nada de pop-up no meio da tela) */
function toast(msg, ms = 2600) {
  const t = $("#toast");
  t.textContent = msg; t.hidden = false;
  clearTimeout(toast.id);
  toast.id = setTimeout(() => (t.hidden = true), ms);
}

/* ---------- renderização ---------- */
let resultados = [];
let ultimoOsm = "";
function salvarOsm() { // só os lugares do OSM que a pessoa guardou (favoritos/roteiro), para não perdê-los ao recarregar
  const usados = new Set([...estado.favoritos, ...estado.roteiro]);
  const json = JSON.stringify(estado.extras.filter((p) => usados.has(p.id)));
  if (json !== ultimoOsm) { ultimoOsm = json; try { localStorage.setItem("fx_osm", json); } catch {} }
}
let abaAtiva = "lista";
function atualizarContadores() {
  const feitos = DADOS.reduce((n, p) => n + (estado.passaporte[p.id] ? 1 : 0), 0);
  $("#n-passaporte").textContent = feitos ? `${feitos}` : "";
  const nr = estado.roteiro.filter(porId).length;
  $("#n-roteiro").textContent = nr || "";
}
function renderAba(nome) {
  if (nome === "lista") renderLista();
  else if (nome === "roteiro") renderRoteiro();
  else if (nome === "passaporte") renderPassaporte();
}
function render() {
  salvarOsm();
  const filtros = [];
  if (estado.usarAgora && estado.agora.sugestao?.pred) filtros.push(estado.agora.sugestao.pred);
  if (estado.apenasAcessivel) filtros.push((p) => ["sim", "parcial"].includes(acessoDe(p)));
  const filtro = filtros.length ? (p) => filtros.every((f) => f(p)) : null;
  resultados = buscar(todos(), { ...estado, filtro });
  sincronizarMarcadores();
  selVisual = estado.selecionado;
  atualizarContadores(); renderRelatos(); renderChips();
  $("#n-lista").textContent = resultados.length;
  renderAba(abaAtiva); // só a aba que está aberta; as outras são refeitas quando a pessoa troca de aba
}

/** Troca só o destaque do lugar (na lista e no mapa), sem refazer a lista toda. */
let selVisual = null;
function marcarSelecionado() {
  const novo = estado.selecionado;
  if (novo === selVisual) return;
  document.querySelector(".item.atual")?.classList.remove("atual");
  if (novo) [...document.querySelectorAll(".item")].find((e) => e.dataset.id === novo)?.classList.add("atual");
  for (const id of [selVisual, novo]) {
    if (!id) continue;
    const m = marcadores.get(id), p = porId(id);
    if (!m || !p) continue;
    const sel = id === novo;
    if (m._sel !== sel) { m.setIcon(iconePin(p, sel)); m._sel = sel; }
    m.setZIndexOffset(sel ? 1000 : 0);
  }
  selVisual = novo;
}

function renderChips() {
  const s = estado.agora.sugestao;
  const itens = [];
  if (s) itens.push(`<button class="chip agora" data-agora aria-pressed="${estado.usarAgora}">${icone(s.icone, 16)}${esc(s.rotulo)}</button>`);
  itens.push(`<button class="chip" data-cat="todas" aria-pressed="${estado.categoria === "todas"}">Tudo</button>`);
  for (const [id, c] of Object.entries(CATEGORIAS))
    itens.push(`<button class="chip" style="--c:${c.cor}" data-cat="${id}" aria-pressed="${estado.categoria === id}"><span class="ponto"></span>${c.nome}</button>`);
  itens.push(`<button class="chip sep" data-flag="apenasAbertos" aria-pressed="${estado.apenasAbertos}">Aberto agora</button>`);
  itens.push(`<button class="chip" data-flag="apenasGratis" aria-pressed="${estado.apenasGratis}">Grátis</button>`);
  itens.push(`<button class="chip" data-flag="apenasAcessivel" aria-pressed="${estado.apenasAcessivel}">${icone("acessivel", 16)}Acessível</button>`);
  $("#chips").innerHTML = itens.join("");
}

function statusAberto(p) {
  const a = aberto(p.horario);
  return a === null ? "" : a ? `<span class="aberto">Aberto</span>` : `<span class="fechado">Fechado</span>`;
}
const precoTxt = (n) => (n == null ? "" : n === 0 ? "Grátis" : "$".repeat(n));
const spanPreco = (p) => (precoTxt(p.preco) ? `<span>${precoTxt(p.preco)}</span>` : "");
const nota = (n) => n.toFixed(1).replace(".", ",");

/** Wikimedia só serve alguns tamanhos (250, 330, 500, 960...): a lista usa 250 px (~22 KB) em vez de 960 px (~200 KB). */
const miniFoto = (src, w) => src.replace(/\/\d+px-/, `/${w}px-`);
/** Acessibilidade: dado colaborativo do OpenStreetMap. Sem dado = "sem informação" (nunca inventamos). */
const acessoDe = (p) => nivelAcesso(p.acessivel ?? ACESSIBILIDADE[p.id]?.valor);
function acessoSelo(p) {
  const n = acessoDe(p);
  return n === "sim" || n === "parcial" ? `<span class="acesso ${n}">${icone("acessivel", 14)}${n === "sim" ? "Acessível" : "Acesso parcial"}</span>` : "";
}
function acessoHtml(p) {
  const n = acessoDe(p);
  const osm = `https://www.openstreetmap.org/?mlat=${p.lat}&mlon=${p.lon}#map=19/${p.lat}/${p.lon}`;
  const nota = n === "desconhecido" ? "Se você conhece o local, ajude a completar:" : "Dado colaborativo do OpenStreetMap, pode estar desatualizado. Para corrigir:";
  return `<div class="cond"><div class="cond-titulo">Acessibilidade</div>
    <p class="acesso ${n}">${icone("acessivel", 18)}<b>${esc(TEXTO_ACESSO[n])}</b></p>
    <p style="margin:0;color:var(--mut);font-size:13px;line-height:1.4">${nota} <a href="${osm}" target="_blank" rel="noopener">abrir no OpenStreetMap</a>.</p></div>`;
}
const vazioHtml = (texto, extra = "") => `<div class="vazio">${jangadaSvg}<p>${texto}</p>${extra}</div>`;

/** Foto do lugar (Wikipédia) ou, sem foto, a inicial do nome em serifa sobre fundo hachurado, como em guia impresso. */
function miniatura(p) {
  const f = FOTOS[p.id];
  if (f) return `<img class="foto" src="${esc(miniFoto(f.src, 250))}" alt="" loading="lazy" decoding="async" width="76" height="76">`;
  const ini = (p.nome.replace(/^(o|a|os|as|de|do|da|centro|museu|parque|praia|mercado|teatro)\s+/i, "").trim()[0] ?? p.nome[0] ?? "?").toUpperCase();
  return `<div class="inicial" style="--c:${corDe(p)}" aria-hidden="true">${esc(ini)}</div>`;
}

function cardHtml(p, extra = "") {
  const dist = p._dist ?? (estado.origem ? haversine(estado.origem, p) : null);
  const fav = estado.favoritos.has(p.id);
  const c = CATEGORIAS[catDe(p)];
  const carimbado = estado.passaporte[p.id] ? `<span class="carimbado">Carimbado</span>` : "";
  return `<li class="item ${p.id === estado.selecionado ? "atual" : ""}" data-id="${esc(p.id)}" tabindex="0">
    ${miniatura(p)}
    <div>
      <span class="cat" style="--c:${c.cor}">${esc(c.nome)}${p.bairro ? ` · ${esc(p.bairro)}` : ""}</span>
      <h3>${esc(p.nome)}</h3>
      <div class="meta">${p._osm ? "<span>OpenStreetMap</span>" : ""}${p.patrocinado ? `<span class="patroc">Patrocinado</span>` : ""}${statusAberto(p) ? `<span>${statusAberto(p)}</span>` : ""}${spanPreco(p)}${p.nota ? `<span>${nota(p.nota)} ★</span>` : ""}${acessoSelo(p)}${dist != null ? `<span>${formatarDistancia(dist)}</span>` : ""}${carimbado}${extra}</div>
    </div>
    <button class="fav" data-fav="${esc(p.id)}" aria-label="${fav ? "Remover dos favoritos" : "Favoritar"} ${esc(p.nome)}" aria-pressed="${fav}">${icone("coracao", 20, fav)}</button>
  </li>`;
}

function renderLista() {
  const mostrados = resultados.slice(0, estado.limite);
  $("#lista").innerHTML = resultados.length
    ? mostrados.map((p) => cardHtml(p)).join("") +
      (resultados.length > mostrados.length ? `<li><button class="mais" data-mais>Mostrar mais (${resultados.length - mostrados.length})</button></li>` : "")
    : estado.buscandoOnline
      ? `<li>${vazioHtml(`Não tem na nossa base. Procurando “${esc(estado.q)}” em toda Fortaleza…`)}</li>`
      : `<li>${vazioHtml("Nada por aqui ainda. Bora tentar outra palavra?", estado.q.trim().length >= 3 ? `<button class="btn" style="margin-top:12px" data-online>${icone("busca", 16)}Procurar “${esc(estado.q.trim())}” em toda Fortaleza</button>` : "")}</li>`;
  $("#anuncio").hidden = !CONFIG.anuncios.ativo;
}

function renderRoteiro() {
  const alvo = $("#aba-roteiro");
  const lugares = estado.roteiro.map(porId).filter(Boolean);
  $("#n-roteiro").textContent = lugares.length || "";
  const prontos = `<h4 class="sec">Roteiros prontos</h4>` + ROTEIROS.map((r) => `
    <div class="pronto"><b>${esc(r.nome)}</b><p>${esc(r.desc)} · ${r.ids.length} paradas · ${esc(r.tempo)}</p>
    <div class="linha"><button class="btn fino" data-usar-roteiro="${r.id}">${icone("mais", 16)}Usar este roteiro</button></div></div>`).join("");
  if (!lugares.length) {
    alvo.innerHTML = vazioHtml("Seu roteiro está vazio. Abra um lugar e toque em “Adicionar ao roteiro”, ou comece por um pronto:") + prontos;
    return;
  }
  const { ordem, totalKm } = montarRoteiro(estado.origem, lugares);
  alvo.innerHTML = `
    <p style="color:var(--mut);margin:12px 0">Melhor ordem de visita: <b style="color:var(--ink)">${formatarDistancia(totalKm)}</b> em linha reta${estado.origem ? ", saindo de você" : ""}.</p>
    <ul class="cards">${ordem.map((p, i) => cardHtml(p, `<span>Parada ${i + 1}</span>`)).join("")}</ul>
    <div class="linha" style="margin-top:14px">
      <button class="btn pri" data-desenhar>${icone("rota", 18)}Ver no mapa</button>
      <button class="btn" data-guia>${icone(estado.guia ? "parar" : "som", 18)}${estado.guia ? "Desligar guia" : "Guia ao vivo"}</button>
    </div>
    <div class="linha" style="margin-top:8px">
      <button class="btn" data-cartao>${icone("foto", 18)}Cartão pra Stories</button>
      <button class="btn" data-limpar-roteiro>Limpar</button>
    </div>${prontos}`;
  alvo._ordem = ordem; alvo._total = totalKm;
}

/* ---------- passaporte: carimbo por lugar visitado, selos por conquista ---------- */
function carimboSvg(p) {
  const ts = estado.passaporte[p.id];
  const data = ts ? new Date(ts).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit", timeZone: "America/Fortaleza" }) : "";
  return `<svg class="carimbo ${ts ? "on" : "off"}" style="--c:${corDe(p)};transform:rotate(${ts ? anguloCarimbo(p.id) : 0}deg)" viewBox="0 0 100 100" aria-hidden="true">
    <circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" stroke-width="3" ${ts ? "" : 'stroke-dasharray="5 4"'}/>
    <circle cx="50" cy="50" r="39" fill="none" stroke="currentColor" stroke-width="1" stroke-dasharray="1.5 3"/>
    <svg x="32" y="19" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${iconePaths(catDe(p))}</svg>
    <text x="50" y="68" text-anchor="middle" font-family="Young Serif, Georgia, serif" font-weight="400" font-size="7.2" fill="currentColor">${esc(nomeCurto(p.nome))}</text>
    ${data ? `<text x="50" y="79" text-anchor="middle" font-family="Atkinson Hyperlegible, sans-serif" font-weight="600" font-size="7" fill="currentColor">${data}</text>` : ""}
  </svg>`;
}

function renderPassaporte() {
  const r = resumoPassaporte(estado.passaporte, DADOS);
  $("#n-passaporte").textContent = r.feitos ? `${r.feitos}` : "";
  const pct = r.total ? Math.round((r.feitos / r.total) * 100) : 0;
  const cats = Object.entries(CATEGORIAS).filter(([id]) => r.porCategoria[id]).map(([id, c]) => {
    const x = r.porCategoria[id];
    return `<div style="--c:${c.cor}"><span>${esc(c.nome)}</span><div class="barra"><i style="width:${Math.round((x.feitos / x.total) * 100)}%"></i></div><span>${x.feitos}/${x.total}</span></div>`;
  }).join("");
  $("#aba-passaporte").innerHTML = `
    <div class="pass-topo">
      <div class="resumo">${r.feitos} <small>de ${r.total} lugares carimbados</small></div>
      <div class="barra"><i style="width:${pct}%"></i></div>
      <p style="margin:0;color:var(--mut);font-size:13px">Abra um lugar e toque em “Já fui aqui”. O passaporte fica só no seu aparelho.</p>
    </div>
    <div class="cat-progresso">${cats}</div>
    <h4 class="sec">Selos</h4>
    <div class="selos">${r.selos.map((x) => `<div class="selo ${x.conquistado ? "on" : ""}"><b>${esc(x.nome)}</b><small>${esc(x.desc)}</small></div>`).join("")}</div>
    <h4 class="sec">Carimbos</h4>
    <div class="carimbos">${DADOS.map((p) => `<button data-id="${esc(p.id)}" aria-label="${esc(p.nome)}, ${estado.passaporte[p.id] ? "carimbado" : "ainda não visitado"}">${carimboSvg(p)}</button>`).join("")}</div>`;
}

function renderRelatos() {
  estado.relatos = estado.relatos.filter((r) => Date.now() - r.ts < TTL_RELATO_MS);
  camadaRelatos.clearLayers();
  for (const r of estado.relatos) {
    L.marker([r.lat, r.lon], { icon: L.divIcon({ className: "", iconSize: [30, 30], html: `<div class="pin-relato">${icone(TIPOS_RELATO[r.tipo].icone, 16)}</div>` }), keyboard: false })
      .bindPopup(`<b>${TIPOS_RELATO[r.tipo].nome}</b><br>${esc(r.texto)}<br><small>há ${minAtras(r.ts)} min · ${r.votos} confirmações</small>`)
      .addTo(camadaRelatos);
  }
  $("#n-relatos").textContent = estado.relatos.length || "";
  $("#aba-relatos").innerHTML = estado.relatos.length
    ? estado.relatos.slice().sort((a, b) => b.ts - a.ts).map((r) => `<div class="aviso">
        <b>${TIPOS_RELATO[r.tipo].nome}</b>
        ${r.texto ? `<span>${esc(r.texto)}</span>` : ""}
        <small>há ${minAtras(r.ts)} min · ${r.votos} confirmações</small>
        <div class="linha"><button class="btn fino" data-voto="${r.id}">Ainda está assim</button><button class="btn fino" data-ver="${r.id}">Ver no mapa</button><button class="btn fino" data-del="${r.id}">Apagar</button></div>
      </div>`).join("")
    : vazioHtml("Nenhum aviso agora. Viu fila, interdição ou evento? Toque no botão laranja do mapa e avise. Os avisos somem em 6 horas.");
}

/* ---------- folha: detalhe, rota e relato (um painel só, sem pop-up) ---------- */
const folha = $("#folha");
function abrirFolha(html, hero = "") { folha.innerHTML = `${hero}<div class="corpo">${html}</div>`; folha.hidden = false; folha.scrollTop = 0; }
function fecharFolha() {
  folha.hidden = true; camadaRota.clearLayers(); fala?.cancel();
  if (estado._forcada) { estado._forcada = false; definirGaveta(estado.gavetaAntes); }
  if (estado.selecionado) { estado.selecionado = null; marcarSelecionado(); }
}
const topoFolha = (titulo, voltar) => `<div class="folha-topo">${voltar ? `<button class="x" data-voltar aria-label="Voltar">${icone("voltar", 18)}</button>` : ""}<h2>${esc(titulo)}</h2><button class="x" data-fechar aria-label="Fechar">${icone("fechar", 18)}</button></div>`;

/* ---------- voz: narração do lugar e guia ao vivo ---------- */
const fala = window.speechSynthesis;
const textoNarracao = (p) => `${p.nome}. ${p.descricao || ""} ${p.dica ? `Dica local: ${p.dica}` : ""}`;
/* o leitor do navegador lê mal siglas e símbolos: troco por como se fala */
const paraFala = (t) => t
  .replace(/R\$\s?(\d+)/g, "$1 reais").replace(/(\d)\s?km\b/gi, "$1 quilômetros").replace(/(\d)\s?m\b/g, "$1 metros")
  .replace(/\bAv\.\s/g, "Avenida ").replace(/\bR\.\s/g, "Rua ").replace(/\bPç\.\s/g, "Praça ").replace(/\bN\.\s?S\.\s/g, "Nossa Senhora ")
  .replace(/[★☆•·→]/g, ",").replace(/\s+/g, " ").trim();
/* melhor voz em português: prefere pt-BR e vozes naturais (Google, Microsoft Online) */
function escolherVoz() {
  const vozes = (fala?.getVoices() ?? []).filter((v) => /^pt[-_]/i.test(v.lang ?? ""));
  const pontos = (v) => (/^pt[-_]br/i.test(v.lang) ? 10 : 0) + (/natural|online|google|neural/i.test(v.name) ? 5 : 0) + (v.localService ? 0 : 1);
  return vozes.sort((a, b) => pontos(b) - pontos(a))[0];
}
fala?.getVoices(); // o Chrome só começa a carregar as vozes depois da primeira chamada
function falar(texto) {
  if (!fala) { toast("Este navegador não sabe falar."); return null; }
  fala.cancel();
  const voz = escolherVoz();
  // frases separadas: o Chrome corta falas longas no meio e a pausa entre frases soa mais natural
  const frases = paraFala(texto).match(/[^.!?]+[.!?]*/g)?.map((s) => s.trim()).filter(Boolean) ?? [];
  let u = null;
  for (const f of frases) {
    u = new SpeechSynthesisUtterance(f);
    u.lang = "pt-BR"; u.rate = 0.95; u.pitch = 1;
    if (voz) u.voice = voz;
    fala.speak(u);
  }
  return u;
}
const ouvirHtml = (falando) => `${icone(falando ? "parar" : "som", 14)}${falando ? "Parar" : "Ouvir"}`;

function marcarVoce() {
  marcadorVoce?.remove();
  marcadorVoce = L.marker([estado.origem.lat, estado.origem.lon], { icon: L.divIcon({ className: "", html: '<div class="voce"></div>', iconSize: [16, 16] }), interactive: false, keyboard: false }).addTo(mapa);
}
function alternarGuia() {
  if (estado.guia) {
    navigator.geolocation.clearWatch(estado.guia.watch); fala?.cancel(); estado.guia = null;
    toast("Guia desligado"); return renderRoteiro();
  }
  if (!navigator.geolocation) return toast("Este aparelho não tem localização.");
  const falados = new Set();
  estado.guia = {
    watch: navigator.geolocation.watchPosition(
      (pos) => {
        estado.origem = { lat: pos.coords.latitude, lon: pos.coords.longitude };
        marcarVoce();
        for (const id of estado.roteiro) {
          const p = porId(id);
          if (p && !falados.has(id) && haversine(estado.origem, p) < 0.08) { falados.add(id); toast(`Você chegou: ${p.nome}`, 4000); falar(textoNarracao(p)); }
        }
      },
      () => { toast("Sem permissão de localização.", 3500); estado.guia = null; renderRoteiro(); },
      { enableHighAccuracy: true, maximumAge: 5000 }
    ),
  };
  toast("Guia ligado: falo quando você chegar perto de cada parada", 4000);
  renderRoteiro();
}

/* luz boa para foto e pôr do sol, só para lugares fotogênicos */
function luzHtml(p) {
  const tags = (p.tags ?? []).map(norm);
  if (!tags.some((t) => ["foto", "por do sol", "mirante", "nascer do sol"].includes(t))) return "";
  const agora = new Date();
  const l = luzDourada(agora, p.lat, p.lon);
  const por = tags.includes("por do sol") ? `<br>Pôr do sol hoje às ${hhmm(horasDoSol(agora, p.lat, p.lon).por)}` : "";
  return `<div class="dica"><small>Luz boa pra foto hoje</small>${hhmm(l.manha[0])} às ${hhmm(l.manha[1])} e ${hhmm(l.tarde[0])} às ${hhmm(l.tarde[1])}${por}</div>`;
}

/* condições do dia no local (mar, UV, vento): Open-Meteo, em cache por 15 min */
const condCache = new Map();
async function carregarCondicoes(p) {
  const praia = p.categoria === "praia";
  if (!praia && p.categoria !== "natureza") return;
  const chave = `${p.lat.toFixed(2)},${p.lon.toFixed(2)}`;
  let d = condCache.get(chave);
  if (!d || Date.now() - d.t > 15 * 60000) {
    const pega = (u) => fetch(u).then((r) => (r.ok ? r.json() : null)).catch(() => null);
    const [clima, mar] = await Promise.all([
      pega(`https://api.open-meteo.com/v1/forecast?latitude=${p.lat}&longitude=${p.lon}&current=uv_index,wind_speed_10m&timezone=America%2FFortaleza`),
      praia ? pega(`https://marine-api.open-meteo.com/v1/marine?latitude=${p.lat}&longitude=${p.lon}&current=wave_height,wave_period,sea_surface_temperature&timezone=America%2FFortaleza`) : null,
    ]);
    d = { t: Date.now(), c: lerCondicoes(clima?.current, mar?.current) };
    condCache.set(chave, d);
  }
  const alvo = $("#condicoes");
  if (!alvo || folha.dataset.id !== p.id) return;
  const linhas = linhasCondicoes(d.c);
  if (!linhas.length) return;
  const dicas = conselhos(d.c, { praia, kite: (p.tags ?? []).map(norm).includes("kitesurf") });
  alvo.innerHTML = `<div class="cond"><div class="cond-titulo">Agora no local</div>
    <div class="cond-grade">${linhas.map((l) => `<div><b>${esc(l.valor)}</b><span>${esc(l.rotulo)}${l.nivel ? ` · ${esc(l.nivel)}` : ""}</span></div>`).join("")}</div>
    ${dicas.length ? `<div class="cond-dicas">${dicas.map(esc).join(" ")}</div>` : ""}</div>`;
}

/** Centraliza o lugar na parte do mapa que NÃO está coberta pela folha (embaixo no celular, à esquerda no PC). */
function centralizarForaDaFolha(p) {
  const zoom = Math.max(mapa.getZoom(), 14);
  mapa.setView([p.lat, p.lon], zoom, { animate: false });
  if (celular()) mapa.panBy([0, Math.min(folha.offsetHeight, innerHeight * 0.66) / 2], { animate: false });
  else mapa.panBy([-(folha.offsetWidth + 12) / 2, 0], { animate: false });
}

function abrirDetalhe(id, { mover = true, renderizar = false } = {}) {
  const p = porId(id);
  if (!p) return;
  if (celular() && estado.gaveta !== "min") { estado.gavetaAntes = estado.gaveta; estado._forcada = true; definirGaveta("min"); }
  camadaRota.clearLayers();
  estado.selecionado = id;
  const dist = estado.origem ? haversine(estado.origem, p) : null;
  const avisos = estado.relatos.filter((r) => haversine(r, p) < 0.25);
  const noRoteiro = estado.roteiro.includes(id);
  const fav = estado.favoritos.has(id);
  const foto = FOTOS[id];
  const c = CATEGORIAS[catDe(p)];
  const fechar = `<button class="x" data-fechar aria-label="Fechar">${icone("fechar", 18)}</button>`;
  const hero = foto
    ? `<div class="hero"><img src="${esc(foto.src)}" alt="Foto: ${esc(p.nome)}" decoding="async"><a class="credito" href="${esc(foto.pagina)}" target="_blank" rel="noopener">Foto: ${esc(foto.autor)} · ${esc(foto.licenca)}</a>${fechar}</div>`
    : "";
  const jaFui = !!estado.passaporte[id];
  abrirFolha(`
    <div class="titulo"><span class="cat" style="--c:${c.cor}">${esc(c.nome)}${p.bairro ? ` · ${esc(p.bairro)}` : ""}</span>
      <div class="folha-topo"><h2>${esc(p.nome)}</h2>${foto ? "" : fechar}</div></div>
    <div class="meta" style="margin-top:-6px">${statusAberto(p) ? `<span>${statusAberto(p)}</span>` : ""}${spanPreco(p)}${p.nota ? `<span>${nota(p.nota)} ★</span>` : ""}${dist != null ? `<span>${formatarDistancia(dist)} de você</span>` : ""}</div>
    <p>${esc(p.descricao || "Sem descrição ainda. Dado do OpenStreetMap.")}</p>
    ${p.horario ? `<p class="meta" style="margin-top:-6px">${esc(horarioTexto(p.horario))}. Horário estimado: confirme no local.</p>` : ""}
    ${p.dica ? `<div class="dica"><small>Dica local</small>${esc(p.dica)}</div>` : ""}
    <div id="condicoes"></div>
    ${acessoHtml(p)}
    ${luzHtml(p)}
    ${avisos.length ? `<div class="dica"><small>Avisos aqui perto</small>${avisos.map((r) => esc(r.texto || TIPOS_RELATO[r.tipo].nome)).join("<br>")}</div>` : ""}
    <div class="modos">
      <button data-rota="car">${icone("carro", 18)}Carro</button>
      <button data-rota="bike">${icone("bike", 18)}Bike</button>
      <button data-rota="foot">${icone("pe", 18)}A pé</button>
    </div>
    <div class="linha">
      <button class="btn pri" data-roteiro="${esc(id)}">${icone(noRoteiro ? "fechar" : "mais", 18)}${noRoteiro ? "Tirar do roteiro" : "Adicionar ao roteiro"}</button>
      <button class="btn" data-fav="${esc(id)}" aria-pressed="${fav}">${icone("coracao", 18, fav)}${fav ? "Salvo" : "Salvar"}</button>
    </div>
    <div class="linha">
      ${p._osm ? "" : `<button class="btn carimbar" data-carimbar aria-pressed="${jaFui}">${icone("carimbo", 18)}${jaFui ? "Carimbado" : "Já fui aqui"}</button>`}
      <button class="btn fino" data-ouvir>${ouvirHtml(false)}</button>
      <button class="btn fino" data-compartilhar>${icone("compartilhar", 14)}Compartilhar</button>
    </div>
    <div class="linha">
      <a class="btn fino" target="_blank" rel="noopener" href="https://waze.com/ul?ll=${p.lat},${p.lon}&navigate=yes">Waze ${icone("externo", 14)}</a>
      <a class="btn fino" target="_blank" rel="noopener" href="https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lon}">Google Maps ${icone("externo", 14)}</a>
    </div>`, hero);
  folha.dataset.id = id; folha.dataset.modo = "detalhe";
  if (mover) centralizarForaDaFolha(p);
  carregarCondicoes(p);
  if (renderizar) render(); else marcarSelecionado(); // render() completo só quando algo mudou (favorito, roteiro, carimbo)
}

folha.addEventListener("click", async (e) => {
  const t = e.target.closest("button"); if (!t) return;
  const id = folha.dataset.id;
  if (t.hasAttribute("data-fechar")) return fecharFolha();
  if (t.hasAttribute("data-voltar")) return abrirDetalhe(id, { mover: false });
  if (t.dataset.rota) return tracarRota(id, t.dataset.rota);
  if (t.dataset.fav) { alternarFavorito(id); return abrirDetalhe(id, { mover: false, renderizar: true }); }
  if (t.dataset.roteiro) {
    const i = estado.roteiro.indexOf(id);
    i >= 0 ? estado.roteiro.splice(i, 1) : estado.roteiro.push(id);
    guardar("fx_roteiro", estado.roteiro);
    toast(i >= 0 ? "Tirado do roteiro" : "Adicionado ao roteiro");
    return abrirDetalhe(id, { mover: false, renderizar: true });
  }
  if (t.hasAttribute("data-carimbar")) {
    const antes = resumoPassaporte(estado.passaporte, DADOS);
    if (estado.passaporte[id]) delete estado.passaporte[id]; else estado.passaporte[id] = Date.now();
    guardar("fx_passaporte", estado.passaporte);
    const novos = selosNovos(antes, resumoPassaporte(estado.passaporte, DADOS));
    toast(!estado.passaporte[id] ? "Carimbo removido" : novos.length ? `Carimbado! Novo selo: ${novos[0].nome}` : "Carimbado no seu passaporte", novos.length ? 4500 : 2600);
    return abrirDetalhe(id, { mover: false, renderizar: true });
  }
  if (t.hasAttribute("data-ouvir")) {
    if (fala?.speaking) { fala.cancel(); t.innerHTML = ouvirHtml(false); return; }
    const u = falar(textoNarracao(porId(id)));
    if (u) { t.innerHTML = ouvirHtml(true); u.onend = u.onerror = () => { t.innerHTML = ouvirHtml(false); }; }
    return;
  }
  if (t.hasAttribute("data-compartilhar")) {
    const p = porId(id);
    const url = `${location.origin}${location.pathname}#lugar=${encodeURIComponent(id)}`;
    if (navigator.share) { try { await navigator.share({ title: p.nome, url }); } catch {} }
    else { try { await navigator.clipboard.writeText(url); toast("Link copiado"); } catch { toast(url, 6000); } }
  }
});
addEventListener("keydown", (e) => { if (e.key === "Escape" && !folha.hidden) fecharFolha(); });

function alternarFavorito(id) {
  estado.favoritos.has(id) ? estado.favoritos.delete(id) : estado.favoritos.add(id);
  guardar("fx_fav", [...estado.favoritos]);
}

/* ---------- rotas (OSRM / FOSSGIS) ---------- */
const PERFIS = { car: "routed-car", foot: "routed-foot", bike: "routed-bike" };
const MODO_NOME = { car: "de carro", foot: "a pé", bike: "de bicicleta" };
const MANOBRA = { turn: "Vire", "new name": "Siga", depart: "Saia", arrive: "Você chegou", merge: "Entre", "on ramp": "Pegue o acesso", "off ramp": "Pegue a saída", fork: "Mantenha-se", "end of road": "No fim da via, vire", continue: "Continue", roundabout: "Na rotatória", rotary: "Na rotatória", "roundabout turn": "Na rotatória, vire" };
const LADO = { left: "à esquerda", right: "à direita", "slight left": "levemente à esquerda", "slight right": "levemente à direita", "sharp left": "fechado à esquerda", "sharp right": "fechado à direita", straight: "em frente", uturn: "retorno" };
const textoPasso = (s) => {
  const m = s.maneuver;
  const lado = m.type === "arrive" ? "" : m.modifier ? ` ${LADO[m.modifier] ?? ""}` : "";
  return `${MANOBRA[m.type] ?? "Siga"}${lado}${s.name ? ` na ${esc(s.name)}` : ""} (${formatarDistancia(s.distance / 1000)})`;
};
const modosComTempo = (modo, rotas) => `<div class="modos">${[["car", "carro", "Carro"], ["bike", "bike", "Bike"], ["foot", "pe", "A pé"]].map(([k, ic, n]) =>
  `<button data-rota="${k}" aria-pressed="${k === modo}">${icone(ic, 18)}${n}${rotas?.[k] ? `<small>${formatarDuracao(rotas[k].duration)}</small>` : ""}</button>`).join("")}</div>`;

async function buscarRota(modo, de, p) {
  const r = await fetch(`https://routing.openstreetmap.de/${PERFIS[modo]}/route/v1/driving/${de.lon},${de.lat};${p.lon},${p.lat}?overview=full&geometries=geojson&steps=true`);
  if (!r.ok) throw new Error(r.status);
  const rota = (await r.json()).routes?.[0];
  if (!rota) throw new Error("sem rota");
  return rota;
}

/** Para lugares de pôr do sol: a que horas sair para chegar a tempo (usa a duração da rota). */
function saiaAte(p, duracaoSeg) {
  if (!(p.tags ?? []).map(norm).includes("por do sol")) return "";
  const agora = Date.now();
  const { por } = horasDoSol(new Date(), p.lat, p.lon);
  if (+por <= agora) return "";
  const chegada = new Date(agora + duracaoSeg * 1000);
  const sair = new Date(+por - 15 * 60000 - duracaoSeg * 1000);
  const texto = chegada > por ? `Hoje o pôr do sol é às ${hhmm(por)}. Saindo agora você chega depois dele.`
    : sair.getTime() <= agora ? `Saindo agora você chega às ${hhmm(chegada)}, antes do pôr do sol (${hhmm(por)}).`
    : `Saia até ${hhmm(sair)} para chegar com 15 min de folga antes do pôr do sol (${hhmm(por)}).`;
  return `<div class="dica"><small>Pôr do sol</small>${texto}</div>`;
}

const rotaCache = new Map();
let seqRota = 0;
async function tracarRota(id, modo = "car") {
  const p = porId(id);
  const de = estado.origem ?? CENTRO;
  const eu = ++seqRota;
  camadaRota.clearLayers();
  const topo = topoFolha(p.nome, true);
  const chave = `${id}|${de.lat.toFixed(4)},${de.lon.toFixed(4)}`;
  // as três rotas (carro, bike, a pé) são pedidas juntas para comparar os tempos lado a lado
  if (!rotaCache.has(chave)) rotaCache.set(chave, Promise.allSettled(["car", "bike", "foot"].map((m) => buscarRota(m, de, p))).then((rs) => ({ car: rs[0].value, bike: rs[1].value, foot: rs[2].value })));
  folha.dataset.modo = "rota"; folha.dataset.id = id;
  abrirFolha(`${topo}${modosComTempo(modo, null)}${vazioHtml("Calculando as rotas…")}`);
  const rotas = await rotaCache.get(chave);
  if (eu !== seqRota || folha.dataset.id !== id || folha.dataset.modo !== "rota") return;
  if (!rotas.car && !rotas.bike && !rotas.foot) rotaCache.delete(chave); // falhou tudo: permite tentar de novo
  const semOrigem = estado.origem ? "" : `<p class="dica"><small>Sem localização</small>Rota saindo do Centro. Toque no botão de alvo no mapa para usar a sua posição.</p>`;
  const rota = rotas[modo];
  if (rota) {
    const linha = L.geoJSON(rota.geometry, { style: { color: "#0b6e72", weight: 6, opacity: 0.9 } }).addTo(camadaRota);
    mapa.fitBounds(linha.getBounds(), { padding: [60, 60] });
    abrirFolha(`${topo}${modosComTempo(modo, rotas)}${semOrigem}
      <div class="resumo">${formatarDuracao(rota.duration)} <small>· ${formatarDistancia(rota.distance / 1000)} ${MODO_NOME[modo]}</small></div>
      ${saiaAte(p, rotas.car?.duration ?? rota.duration)}
      <details><summary>Passo a passo</summary><ol>${rota.legs[0].steps.map((x) => `<li>${textoPasso(x)}</li>`).join("")}</ol></details>`);
  } else {
    const km = haversine(de, p);
    const vel = { car: 25, foot: 4.5, bike: 14 }[modo];
    L.polyline([[de.lat, de.lon], [p.lat, p.lon]], { color: "#0b6e72", dashArray: "6 8", weight: 4 }).addTo(camadaRota);
    mapa.fitBounds([[de.lat, de.lon], [p.lat, p.lon]], { padding: [60, 60] });
    abrirFolha(`${topo}${modosComTempo(modo, rotas)}${semOrigem}
      <div class="resumo">${formatarDistancia(km)} <small>em linha reta · ~${formatarDuracao((km / vel) * 3600)} ${MODO_NOME[modo]}</small></div>
      <p class="dica"><small>Sem internet?</small>O serviço de rotas não respondeu. Mostrei a linha reta.</p>`);
  }
  folha.dataset.modo = "rota"; folha.dataset.id = id;
}

/* ---------- localização ---------- */
function localizar({ silencioso = false } = {}) {
  if (!navigator.geolocation) return toast("Este aparelho não tem localização.");
  const btn = $("#btn-local");
  btn.classList.add("carregando");
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      btn.classList.remove("carregando");
      estado.origem = { lat: pos.coords.latitude, lon: pos.coords.longitude };
      marcarVoce();
      mapa.setView([estado.origem.lat, estado.origem.lon], 14);
      $("#lb-raio").hidden = false;
      render();
      if (!silencioso) toast("Mostrando o que está perto de você");
    },
    () => { btn.classList.remove("carregando"); estado.ordenar = "relevancia"; $("#ordenar").value = "relevancia"; toast("Sem permissão de localização. Ative no navegador.", 4000); },
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
  );
}

/* ---------- OpenStreetMap ao vivo (Overpass) ---------- */
function categoriaOSM(t) {
  if (t.tourism === "museum" || t.tourism === "gallery" || t.amenity === "theatre" || t.amenity === "cinema" || t.amenity === "arts_centre") return "cultura";
  if (t.historic) return "historia";
  if (t.amenity === "bar" || t.amenity === "pub" || t.amenity === "nightclub") return "noite";
  if (t.amenity === "restaurant" || t.amenity === "cafe" || t.amenity === "fast_food") return "gastronomia";
  if (t.natural === "beach") return "praia";
  if (t.leisure === "park" || t.leisure === "nature_reserve") return "natureza";
  if (t.shop || t.amenity === "marketplace") return "compras";
  return "lazer";
}
/** Consulta o Overpass tentando servidores reserva (os públicos oscilam e às vezes dão 504). */
const OVERPASS = ["https://overpass-api.de/api/interpreter", "https://overpass.kumi.systems/api/interpreter"];
async function overpass(consulta) {
  let ultimo;
  for (const url of OVERPASS) {
    const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), 12000);
    try {
      const r = await fetch(url, { method: "POST", body: "data=" + encodeURIComponent(consulta), signal: ctl.signal });
      if (r.ok) return (await r.json()).elements ?? [];
      ultimo = new Error(r.status);
    } catch (e) { ultimo = e; } finally { clearTimeout(t); }
  }
  throw ultimo;
}

/** Converte elementos do OSM em lugares do app (sem duplicar o que já existe). Retorna quantos entraram. */
const COZINHAS = { steak_house: "Churrascaria", barbecue: "Churrasco", pizza: "Pizzaria", burger: "Hamburgueria", brazilian: "Cozinha brasileira",
  regional: "Cozinha regional", seafood: "Frutos do mar", fish: "Peixes", japanese: "Japonesa", sushi: "Sushi", italian: "Italiana", chicken: "Frango",
  coffee_shop: "Cafeteria", ice_cream: "Sorveteria", sandwich: "Lanches", bakery: "Padaria", vegetarian: "Vegetariana", vegan: "Vegana" };
const cozinhaTxt = (c) => c.split(";").map((x) => COZINHAS[x.trim()] ?? x.trim().replace(/_/g, " ")).join(", ");

function incorporar(elementos, tagsExtra = [], bonus = 0) {
  const base = todos();
  let novos = 0;
  for (const el of elementos) {
    const lat = el.lat ?? el.center?.lat, lon = el.lon ?? el.center?.lon;
    const t = el.tags ?? {};
    if (lat == null || !t.name) continue;
    const id = `osm-${el.type}-${el.id}`;
    if (base.some((p) => p.id === id || (haversine(p, { lat, lon }) < 0.08 && norm(p.nome).includes(norm(t.name).slice(0, 6))))) continue;
    const lugar = {
      id, nome: t.name, categoria: categoriaOSM(t), bairro: t["addr:suburb"] ?? t["addr:street"] ?? "", lat, lon, _osm: true,
      descricao: [t.cuisine && `Tipo: ${cozinhaTxt(t.cuisine)}`, t.opening_hours && `Horário: ${t.opening_hours}`, t.website && `Site: ${t.website}`].filter(Boolean).join(" · "),
      tags: [t.tourism, t.amenity, t.historic, t.leisure, t.cuisine, ...tagsExtra].filter(Boolean), preco: null, horario: null, acessivel: t.wheelchair ?? null, _bonus: bonus,
    };
    estado.extras.push(lugar); base.push(lugar);
    novos++;
  }
  return novos;
}

/* Busca em toda Fortaleza quando a nossa base não tem o que a pessoa digitou. */
const FILTROS_OSM = { // igualdades simples: rápidas no Overpass (alternativas com | derrubam o servidor)
  churrascaria: ['["cuisine"="steak_house"]', '["cuisine"="barbecue"]'], churrasco: ['["cuisine"="steak_house"]', '["cuisine"="barbecue"]'],
  espetinho: ['["cuisine"="barbecue"]'], carne: ['["cuisine"="steak_house"]'],
  pizzaria: ['["cuisine"="pizza"]'], pizza: ['["cuisine"="pizza"]'],
  hamburgueria: ['["cuisine"="burger"]'], hamburguer: ['["cuisine"="burger"]'],
  sorveteria: ['["amenity"="ice_cream"]'], sorvete: ['["amenity"="ice_cream"]'],
  cafeteria: ['["amenity"="cafe"]'], cafe: ['["amenity"="cafe"]'],
  padaria: ['["shop"="bakery"]'], bar: ['["amenity"="bar"]', '["amenity"="pub"]'],
  sushi: ['["cuisine"="sushi"]', '["cuisine"="japanese"]'], japones: ['["cuisine"="sushi"]', '["cuisine"="japanese"]'],
  restaurante: ['["amenity"="restaurant"]'], hotel: ['["tourism"="hotel"]'], hostel: ['["tourism"="hostel"]'],
  museu: ['["tourism"="museum"]'], parque: ['["leisure"="park"]'], shopping: ['["shop"="mall"]'],
};
// Texto simples (sem classes de acento): o Overpass dá 504 em regex complexa. Quem digita com acento acha nomes com acento.
const regexNome = (t) => t.replace(/[.*+?^${}()|[\]\\"]/g, "");
// radical: "churrasco" e "churrascaria" viram "churrasc" (senão uma não acha a outra)
const radical = (t) => { const r = t.replace(/(es|os|as|s|o|a|e)$/, ""); return r.length >= 4 ? r : t; };
/** Segunda fonte: Nominatim (busca por texto do OpenStreetMap). Responde rápido e quase nunca cai. */
async function nominatim(termo) {
  const r = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=40&addressdetails=1&extratags=1&viewbox=-38.65,-3.68,-38.40,-3.90&bounded=1&q=${encodeURIComponent(termo)}`);
  if (!r.ok) throw new Error(r.status);
  return (await r.json()).map((x) => ({
    type: "nominatim", id: x.place_id, lat: +x.lat, lon: +x.lon,
    tags: { ...(x.extratags ?? {}), [x.category]: x.type, name: x.name || x.display_name.split(",")[0], "addr:suburb": x.address?.suburb ?? x.address?.neighbourhood ?? "" },
  })).filter((e) => e.tags.name);
}
const CACHE_ONLINE_MS = 24 * 60 * 60 * 1000;

async function buscarOnline(termo) {
  const q = norm(termo);
  if (q.length < 3 || estado.buscasOnline.has(q)) return;
  estado.buscasOnline.add(q); estado.buscandoOnline = true; renderLista();
  const guardado = ler(`fx_on_${q}`, null); // resultado recente da mesma busca: instantâneo, funciona até sem internet
  if (guardado && Date.now() - guardado.t < CACHE_ONLINE_MS) {
    for (const l of guardado.lugares) if (!estado.extras.some((x) => x.id === l.id)) estado.extras.push(l);
    estado.buscandoOnline = false; render(); enquadrarResultados(); return;
  }
  const antes = estado.extras.length;
  const bb = "-3.90,-38.65,-3.68,-38.40"; // Fortaleza
  const palavras = termo.toLowerCase().trim().split(/\s+/).filter((t) => t.length >= 3);
  const filtros = q.split(/\s+/).flatMap((t) => FILTROS_OSM[t] ?? []);
  const ehTipo = filtros.length > 0;
  // Termo que é um TIPO de lugar (churrascaria, pizzaria...): primeiro quem é daquele tipo no OpenStreetMap;
  // depois quem tem o nome parecido, mas só entre restaurantes (nada de "Duty Free do Churrasco").
  // Termo comum (um bairro, um nome): procura pelo nome em qualquer lugar.
  const pedidos = [
    ...filtros.map((f) => ({ c: `nwr["name"]${f}(${bb});`, bonus: 30 })),
    ...palavras.flatMap((t) => (ehTipo
      ? ["restaurant", "fast_food"].map((a) => ({ c: `nwr["amenity"="${a}"]["name"~"${regexNome(radical(t))}",i](${bb});`, bonus: 10 }))
      : [{ c: `nwr["name"~"${regexNome(radical(t))}",i](${bb});`, bonus: 0 }])),
  ];
  // um pedido por cláusula, em paralelo: se o servidor público falhar em um, aproveitamos os outros
  pedidos.push({ bonus: 5 }); // Nominatim, junto com as consultas ao Overpass
  // cada resposta aparece na lista assim que chega: o servidor lento não segura o que já veio rápido
  const palavrasQ = q.split(/\s+/);
  let novos = 0, falhas = 0;
  await Promise.allSettled(pedidos.map((x, i) => (i === pedidos.length - 1 ? nominatim(termo) : overpass(`[out:json][timeout:25];(${x.c});out center 80;`)).then(
    (v) => { const n = incorporar(v, palavrasQ, x.bonus); novos += n; if (n) { estado.buscandoOnline = false; render(); } },
    () => { falhas++; }
  )));
  if (falhas === pedidos.length) {
    estado.buscasOnline.delete(q);
    toast("Busca online indisponível agora. Tente de novo em instantes.", 3500);
  } else {
    toast(novos ? `${novos} lugares encontrados em Fortaleza` : "Nada encontrado no OpenStreetMap");
    if (novos) { guardar(`fx_on_${q}`, { t: Date.now(), lugares: estado.extras.slice(antes).slice(0, 120) }); enquadrarResultados(); }
  }
  estado.buscandoOnline = false; render();
}

async function buscarNaArea() {
  const btn = $("#btn-aqui");
  btn.textContent = "Buscando…"; btn.disabled = true;
  const b = mapa.getBounds();
  const bb = `${b.getSouth()},${b.getWest()},${b.getNorth()},${b.getEast()}`;
  const consulta = `[out:json][timeout:20];(
    nwr["tourism"~"attraction|museum|viewpoint|gallery|zoo|theme_park"]["name"](${bb});
    nwr["historic"]["name"](${bb});
    nwr["amenity"~"restaurant|bar|cafe|theatre|cinema|marketplace|arts_centre"]["name"](${bb});
    nwr["leisure"~"park|nature_reserve"]["name"](${bb});
    nwr["natural"="beach"]["name"](${bb});
  );out center 120;`;
  try {
    const novos = incorporar(await overpass(consulta));
    render(); toast(novos ? `${novos} lugares novos nesta área` : "Nada novo nesta área");
  } catch { toast("Não consegui buscar agora. Tente de novo em instantes.", 4000); }
  btn.textContent = "Buscar nesta área"; btn.disabled = false; btn.hidden = true;
}
// O botão só aparece quando faz sentido: mapa aproximado e movido pelo usuário.
mapa.on("moveend", () => { $("#btn-aqui").hidden = mapa.getZoom() < 14 || estado.modoRelato || !folha.hidden; });

/* ---------- avisos da comunidade (relatos) ---------- */
const salvarRelatos = () => guardar("fx_relatos", estado.relatos);
$("#aba-relatos").addEventListener("click", (e) => {
  const b = e.target.closest("button"); if (!b) return;
  const r = estado.relatos.find((x) => x.id === (b.dataset.voto ?? b.dataset.ver ?? b.dataset.del));
  if (!r) return;
  if (b.dataset.voto) { r.votos++; r.ts = Date.now(); } // confirmar renova a validade, como no Waze
  if (b.dataset.ver) mapa.setView([r.lat, r.lon], 17);
  if (b.dataset.del) estado.relatos = estado.relatos.filter((x) => x !== r);
  salvarRelatos(); renderRelatos();
});

function alternarModoRelato(ligar) {
  estado.modoRelato = ligar ?? !estado.modoRelato;
  $("#btn-relato").classList.toggle("ativo", estado.modoRelato);
  const faixa = $("#faixa");
  faixa.hidden = !estado.modoRelato;
  faixa.textContent = "Toque no mapa onde quer avisar";
  mapa.getContainer().style.cursor = estado.modoRelato ? "crosshair" : "";
}
mapa.on("click", (e) => {
  if (!estado.modoRelato) { if (!folha.hidden && folha.dataset.modo === "detalhe") fecharFolha(); return; }
  alternarModoRelato(false);
  abrirFolha(`${topoFolha("Novo aviso")}
    <form id="form-relato" style="display:grid;gap:12px">
      <div class="tipos">${Object.entries(TIPOS_RELATO).map(([k, v], i) => `<label><input type="radio" name="tipo" value="${k}" ${i === 0 ? "checked" : ""}>${icone(v.icone, 18)}${v.nome}</label>`).join("")}</div>
      <input type="text" name="texto" maxlength="140" placeholder="Detalhe (opcional). Ex.: fila de 30 min">
      <button class="btn pri" type="submit">Publicar aviso</button>
    </form>`);
  folha.dataset.modo = "relato"; folha.dataset.id = "";
  $("#form-relato").onsubmit = (ev) => {
    ev.preventDefault();
    const f = new FormData(ev.target);
    estado.relatos.push({ id: "r" + Date.now().toString(36), tipo: f.get("tipo"), texto: String(f.get("texto") ?? "").slice(0, 140), lat: e.latlng.lat, lon: e.latlng.lng, ts: Date.now(), votos: 1 });
    salvarRelatos(); renderRelatos(); fecharFolha(); toast("Aviso publicado. Valeu por ajudar!");
  };
});

/* ---------- "Agora": hora, pôr do sol e clima ---------- */
const URL_CLIMA = "https://api.open-meteo.com/v1/forecast?latitude=-3.73&longitude=-38.52&current=temperature_2m,precipitation,weather_code&timezone=America%2FFortaleza";
function atualizarAgora() {
  const a = estado.agora;
  const agora = new Date();
  a.por = horaPorDoSol(agora, CENTRO.lat, CENTRO.lon);
  a.sugestao = sugestaoAgora({ periodo: periodo(agora, a.por), chovendo: a.chovendo, porDoSol: a.por });
  const t = $("#temp");
  t.hidden = a.temp == null; t.textContent = a.temp == null ? "" : `${a.temp}°`;
  renderChips();
  if (estado.usarAgora) render();
}
async function carregarClima() {
  try {
    const r = await fetch(URL_CLIMA);
    const c = (await r.json()).current;
    estado.agora.temp = Math.round(c.temperature_2m);
    estado.agora.chovendo = estaChovendo(c);
    atualizarAgora();
  } catch { /* sem clima, o app segue só com a hora */ }
}

/* ---------- eventos da interface ---------- */
let idSug = 0, idOn = 0;
const caixa = $("#q");
caixa.addEventListener("input", (e) => {
  estado.q = e.target.value; estado.limite = POR_PAGINA;
  const ul = $("#sugestoes");
  const s = sugestoes(todos(), estado.q);
  ul.innerHTML = s.map((x) => `<li role="option" data-tipo="${x.tipo}" data-id="${esc(x.id ?? "")}" data-texto="${esc(x.texto)}">${icone(x.tipo === "lugar" ? "aqui" : "busca", 16)}${esc(x.texto)}</li>`).join("");
  ul.hidden = !s.length; caixa.setAttribute("aria-expanded", String(!!s.length));
  clearTimeout(idSug);
  idSug = setTimeout(() => {
    render();
    if (!resultados.length && estado.q.trim().length >= 4) { clearTimeout(idOn); idOn = setTimeout(() => !resultados.length && buscarOnline(estado.q), 700); }
  }, 120);
});
$("#sugestoes").addEventListener("click", (e) => {
  const li = e.target.closest("li"); if (!li) return;
  $("#sugestoes").hidden = true;
  caixa.value = li.dataset.texto; estado.q = li.dataset.texto; render();
  if (li.dataset.tipo === "lugar") abrirDetalhe(li.dataset.id);
});
document.addEventListener("click", (e) => { if (!e.target.closest(".busca")) $("#sugestoes").hidden = true; });
function enquadrarResultados() {
  const pts = resultados.slice(0, 80).map((p) => [p.lat, p.lon]);
  if (pts.length) mapa.fitBounds(pts, { padding: [50, 50], maxZoom: 15 });
}
caixa.addEventListener("keydown", (e) => {
  if (e.key === "Escape") $("#sugestoes").hidden = true;
  if (e.key === "Enter") { // no celular o teclado esconde os resultados: fecha ele e mostra o mapa enquadrado
    $("#sugestoes").hidden = true; caixa.blur();
    if (celular() && estado.gaveta === "min") definirGaveta("meio");
    clearTimeout(idSug); render(); enquadrarResultados();
  }
});

$("#chips").addEventListener("click", (e) => {
  const b = e.target.closest("button"); if (!b) return;
  estado.limite = POR_PAGINA;
  if (b.hasAttribute("data-agora")) estado.usarAgora = !estado.usarAgora;
  else if (b.dataset.flag) estado[b.dataset.flag] = !estado[b.dataset.flag];
  else if (b.dataset.cat) estado.categoria = estado.categoria === b.dataset.cat ? "todas" : b.dataset.cat;
  render();
});
$("#ordenar").onchange = (e) => { estado.ordenar = e.target.value; if (estado.ordenar === "distancia" && !estado.origem) localizar({ silencioso: true }); render(); };
$("#raio").onchange = (e) => { estado.raioKm = Number(e.target.value); render(); };

function aoClicarCards(e) {
  if (e.target.closest("[data-online]")) { estado.buscasOnline.delete(norm(estado.q)); return buscarOnline(estado.q); }
  const fav = e.target.closest("[data-fav]");
  if (fav) { e.stopPropagation(); alternarFavorito(fav.dataset.fav); return render(); }
  if (e.target.closest("[data-mais]")) { estado.limite += POR_PAGINA; return renderLista(); }
  const card = e.target.closest(".item"); if (card) abrirDetalhe(card.dataset.id);
}
$("#aba-lista").addEventListener("click", aoClicarCards);
$("#aba-passaporte").addEventListener("click", (e) => { const b = e.target.closest("button[data-id]"); if (b) abrirDetalhe(b.dataset.id); });
$("#aba-roteiro").addEventListener("click", async (e) => {
  const el = $("#aba-roteiro");
  const usar = e.target.closest("[data-usar-roteiro]");
  if (usar) {
    const r = ROTEIROS.find((x) => x.id === usar.dataset.usarRoteiro);
    estado.roteiro = [...new Set([...estado.roteiro, ...r.ids.filter(porId)])];
    guardar("fx_roteiro", estado.roteiro); render(); toast(`Roteiro “${r.nome}” adicionado`); return;
  }
  if (e.target.closest("[data-limpar-roteiro]")) { estado.roteiro = []; guardar("fx_roteiro", []); camadaRota.clearLayers(); return render(); }
  if (e.target.closest("[data-desenhar]")) {
    camadaRota.clearLayers();
    const pts = [...(estado.origem ? [estado.origem] : []), ...el._ordem].map((p) => [p.lat, p.lon]);
    L.polyline(pts, { color: "#e2702a", weight: 4, dashArray: "8 8" }).addTo(camadaRota);
    mapa.fitBounds(pts, { padding: [50, 50] });
    if (celular()) definirGaveta("min");
    return;
  }
  if (e.target.closest("[data-cartao]")) {
    toast("Gerando o cartão…", 4000);
    const blob = await gerarCartao({ paradas: el._ordem, totalKm: el._total });
    const arquivo = new File([blob], "meu-dia-em-fortaleza.png", { type: "image/png" });
    if (navigator.canShare?.({ files: [arquivo] })) { try { await navigator.share({ files: [arquivo], title: "Meu dia em Fortaleza" }); } catch {} }
    else { const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = arquivo.name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 5000); toast("Cartão salvo nos downloads"); }
    return;
  }
  if (e.target.closest("[data-guia]")) return alternarGuia();
  aoClicarCards(e);
});
$("#aba-lista").addEventListener("keydown", (e) => { if (e.key === "Enter" && e.target.classList.contains("item")) abrirDetalhe(e.target.dataset.id); });

document.querySelectorAll(".abas [data-aba]").forEach((b) => b.addEventListener("click", () => {
  document.querySelectorAll(".abas [data-aba]").forEach((x) => x.setAttribute("aria-selected", String(x === b)));
  for (const a of ["lista", "roteiro", "passaporte", "relatos"]) $(`#aba-${a}`).hidden = a !== b.dataset.aba;
  abaAtiva = b.dataset.aba;
  renderAba(abaAtiva);
  $(".conteudo").scrollTop = 0;
  if (celular() && estado.gaveta === "min") definirGaveta("meio");
}));

// gaveta no celular: toque na alça (ou deslize) para abrir/fechar
const painel = $("#painel");
const POSICOES = ["min", "meio", "alto"];
const celular = () => matchMedia("(max-width:820px)").matches;
// alturas dos 3 encaixes: só a barra de abas / meio / quase tela cheia. Medidas uma vez (medir a cada toque
// obrigava o navegador a recalcular o layout da página inteira).
const fabs = $(".fabs"), toastEl = $("#toast");
let medidas = null, hAtual = 0, altaVisivel = false;
const medir = () => (medidas = { min: $("#alca").offsetHeight + $(".abas").offsetHeight + 2, meio: Math.round(innerHeight * 0.38), alto: Math.round(innerHeight * 0.78) });
const alturas = () => medidas ?? medir();
function aplicarAltura(px) {
  hAtual = px;
  // o painel tem sempre a altura "alto"; subir e descer é só deslocar (transform), que é barato
  painel.style.transform = `translate3d(0, ${alturas().alto - px}px, 0)`;
  fabs.style.transform = toastEl.style.transform = `translate3d(0, ${-px}px, 0)`;
  const alta = px > innerHeight * 0.55; // botões flutuantes saem do caminho
  if (alta !== altaVisivel) { altaVisivel = alta; document.body.classList.toggle("gaveta-alta", alta); }
}
function definirGaveta(g) {
  estado.gaveta = g;
  if (celular()) {
    const a = medir();
    painel.style.height = `${a.alto}px`;
    aplicarAltura(a[g]);
    $(".conteudo").style.paddingBottom = `${a.alto - a[g] + 20}px`; // o fim da lista continua alcançável com a gaveta baixa
  } else {
    painel.style.height = painel.style.transform = fabs.style.transform = toastEl.style.transform = "";
    $(".conteudo").style.paddingBottom = "";
    document.body.classList.remove("gaveta-alta"); altaVisivel = false;
  }
}
const moverGaveta = (passo) => definirGaveta(POSICOES[Math.max(0, Math.min(2, POSICOES.indexOf(estado.gaveta) + passo))]);
const maisProximo = (h) => { const a = alturas(); return POSICOES.reduce((m, k) => (Math.abs(a[k] - h) < Math.abs(a[m] - h) ? k : m)); };

// arrastar com o dedo: a gaveta acompanha o toque (alça e abas) e encaixa ao soltar
let arrasto = null, houveArrasto = false;
for (const alvo of [$("#alca"), $(".abas")]) {
  alvo.addEventListener("pointerdown", (e) => {
    if (!celular() || (e.pointerType === "mouse" && e.button !== 0)) return;
    arrasto = { y0: e.clientY, h0: hAtual, y: e.clientY, t: performance.now(), v: 0, moveu: false };
  });
  alvo.addEventListener("click", (e) => { if (houveArrasto) { e.stopPropagation(); e.preventDefault(); } }, true);
}
addEventListener("pointermove", (e) => {
  if (!arrasto) return;
  const dy = e.clientY - arrasto.y0;
  if (!arrasto.moveu) { if (Math.abs(dy) < 6) return; arrasto.moveu = true; document.body.classList.add("arrastando"); }
  const a = alturas();
  aplicarAltura(Math.max(a.min, Math.min(a.alto, arrasto.h0 - dy)));
  const t = performance.now();
  arrasto.v = (e.clientY - arrasto.y) / (t - arrasto.t || 1); // px/ms, negativo = subindo
  arrasto.y = e.clientY; arrasto.t = t;
});
function soltar() {
  if (!arrasto) return;
  const { moveu, v } = arrasto; arrasto = null;
  document.body.classList.remove("arrastando");
  if (!moveu) return;
  houveArrasto = true; setTimeout(() => (houveArrasto = false), 60);
  const atual = POSICOES.indexOf(maisProximo(hAtual));
  // arremesso rápido vai para o próximo encaixe na direção do dedo; devagar, vai para o mais próximo
  definirGaveta(Math.abs(v) > 0.5 ? POSICOES[Math.max(0, Math.min(2, atual + (v < 0 ? 1 : -1)))] : POSICOES[atual]);
}
addEventListener("pointerup", soltar);
addEventListener("pointercancel", soltar);
addEventListener("resize", () => { medidas = null; definirGaveta(estado.gaveta); });
$("#alca").onclick = () => moverGaveta(estado.gaveta === "alto" ? -1 : 1);
// no computador: botão que esconde a lista e deixa o mapa inteiro livre
$("#btn-painel").onclick = () => {
  const oculto = $(".layout").classList.toggle("sem-painel");
  $("#btn-painel").setAttribute("aria-pressed", String(oculto));
  $("#btn-painel").title = oculto ? "Mostrar a lista" : "Esconder a lista";
  setTimeout(() => mapa.invalidateSize(), 50);
};

$("#btn-local").onclick = () => localizar();
$("#btn-aqui").onclick = buscarNaArea;
$("#btn-relato").onclick = () => alternarModoRelato();
$("#btn-surpresa").onclick = () => {
  const cand = buscar(DADOS, { categoria: estado.categoria, origem: estado.origem, raioKm: estado.raioKm || 8, apenasAbertos: true });
  const lista = cand.length ? cand : buscar(DADOS, {});
  abrirDetalhe(lista[Math.floor(Math.random() * lista.length)].id);
};

/* tema */
const aplicarTema = (t) => { document.documentElement.dataset.tema = t; guardar("fx_tema", t); $("#btn-tema").innerHTML = icone(t === "escuro" ? "sol" : "lua", 20); };
aplicarTema(document.documentElement.dataset.tema || "claro");
$("#btn-tema").onclick = () => aplicarTema(document.documentElement.dataset.tema === "escuro" ? "claro" : "escuro");

/* busca por voz (Chrome/Edge/Android; precisa de https ou localhost) */
const Reconhecimento = window.SpeechRecognition || window.webkitSpeechRecognition;
if (Reconhecimento) {
  const mic = $("#btn-mic");
  mic.hidden = false;
  mic.onclick = () => {
    const rec = new Reconhecimento();
    rec.lang = "pt-BR"; rec.interimResults = false; rec.maxAlternatives = 1;
    mic.classList.add("ouvindo");
    rec.onresult = (ev) => { caixa.value = ev.results[0][0].transcript.replace(/[.,!?]$/, ""); caixa.dispatchEvent(new Event("input")); };
    rec.onerror = (ev) => { if (ev.error === "not-allowed") toast("Libere o microfone no navegador para buscar por voz.", 4000); };
    rec.onend = () => mic.classList.remove("ouvindo");
    try { rec.start(); } catch { mic.classList.remove("ouvindo"); }
  };
}

/* ícones estáticos da interface */
$("#btn-mic").innerHTML = icone("mic", 20);
$("#btn-painel").innerHTML = icone("lista", 20);
$("#ic-busca").innerHTML = icone("busca", 18);
$("#btn-local").innerHTML = icone("local", 22);
$("#btn-relato").innerHTML = icone("relatar", 22);
$("#btn-surpresa").innerHTML = `${icone("dado", 16)}Sorteie um lugar`;

/* link compartilhado: #lugar=id */
function abrirDoHash() {
  const m = location.hash.match(/lugar=([^&]+)/);
  if (m && porId(decodeURIComponent(m[1]))) abrirDetalhe(decodeURIComponent(m[1]));
}
addEventListener("hashchange", abrirDoHash);

/* instalar como aplicativo (só aparece quando o navegador permite; nada de pop-up) */
let convite = null;
addEventListener("beforeinstallprompt", (e) => { e.preventDefault(); convite = e; $("#btn-instalar").hidden = false; });
$("#btn-instalar").onclick = async () => { if (!convite) return; convite.prompt(); await convite.userChoice; convite = null; $("#btn-instalar").hidden = true; };
addEventListener("appinstalled", () => { $("#btn-instalar").hidden = true; toast("App instalado"); });
const iOS = /iphone|ipad|ipod/i.test(navigator.userAgent) && !navigator.standalone;
$("#dica-ios").hidden = !iOS;

definirGaveta("meio");
if (celular()) mapa.attributionControl.setPosition("topleft"); // a gaveta cobre o canto de baixo
atualizarAgora();
render();
abrirDoHash();
carregarClima();
setInterval(atualizarAgora, 5 * 60 * 1000);
setInterval(renderRelatos, 60000);
if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(() => {});
console.log("%cFortaleza Explora%c por Pedro Peterson", "font:700 14px Georgia;color:#0b6e72", "color:#888");
