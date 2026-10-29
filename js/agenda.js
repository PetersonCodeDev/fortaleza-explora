// Agenda de eventos: só funções puras (sem tela), para poder testar com node:test.
// Datas são sempre "AAAA-MM-DD" no horário de Fortaleza (o servidor/aparelho pode estar em outro fuso).

const MESES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];

/** Data de hoje em Fortaleza, como "AAAA-MM-DD". */
export function hojeFortaleza(agora = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Fortaleza", year: "numeric", month: "2-digit", day: "2-digit" }).format(agora);
}

const partes = (iso) => iso.split("-").map(Number);
const diaNumero = (iso) => { const [a, m, d] = partes(iso); return Date.UTC(a, m - 1, d) / 86400000; };

/** Quantos dias faltam de `de` até `ate` (negativo se já passou). */
export const diasEntre = (de, ate) => diaNumero(ate) - diaNumero(de);

/** "acontecendo" | "futuro" | "encerrado" | "sazonal" (sem data fechada ainda). */
export function estadoEvento(ev, hoje) {
  if (!ev.inicio) return "sazonal";
  const fim = ev.fim ?? ev.inicio;
  if (hoje < ev.inicio) return "futuro";
  if (hoje > fim) return "encerrado";
  return "acontecendo";
}

/** Separa o que está rolando, o que vem aí (em ordem de data) e o que ainda não tem data fechada. */
export function organizarAgenda(eventos, hoje) {
  const grupos = { acontecendo: [], proximos: [], sazonais: [] };
  for (const ev of eventos) {
    const e = estadoEvento(ev, hoje);
    if (e === "acontecendo") grupos.acontecendo.push(ev);
    else if (e === "futuro") grupos.proximos.push(ev);
    else if (e === "sazonal") grupos.sazonais.push(ev);
  }
  const porInicio = (a, b) => a.inicio.localeCompare(b.inicio);
  grupos.acontecendo.sort(porInicio);
  grupos.proximos.sort(porInicio);
  return grupos;
}

/** O evento mais perto, se começa (ou já está rolando) dentro da janela de dias. Serve para o aviso no topo. */
export function proximoDestaque(eventos, hoje, janela = 21) {
  const { acontecendo, proximos } = organizarAgenda(eventos.filter((e) => e.confirmado), hoje);
  if (acontecendo.length) return { ev: acontecendo[0], agora: true, dias: 0 };
  const prox = proximos[0];
  if (!prox) return null;
  const dias = diasEntre(hoje, prox.inicio);
  return dias <= janela ? { ev: prox, agora: false, dias } : null;
}

/** "7 a 13 de novembro", "31 de dezembro", "30 de outubro a 2 de novembro". */
export function rotuloQuando(ev) {
  if (!ev.inicio) return ev.quando ?? "Datas a confirmar";
  const [, m1, d1] = partes(ev.inicio);
  if (!ev.fim || ev.fim === ev.inicio) return `${d1} de ${MESES[m1 - 1]}`;
  const [, m2, d2] = partes(ev.fim);
  return m1 === m2 ? `${d1} a ${d2} de ${MESES[m2 - 1]}` : `${d1} de ${MESES[m1 - 1]} a ${d2} de ${MESES[m2 - 1]}`;
}

/** "hoje", "amanhã", "em 12 dias" */
export function faltam(dias) {
  if (dias <= 0) return "hoje";
  if (dias === 1) return "amanhã";
  return `em ${dias} dias`;
}

/* ---------- arquivo de calendário (.ics) ---------- */
const escIcs = (t) => String(t ?? "").replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
const compacto = (iso) => iso.replaceAll("-", "");
const maisUmDia = (iso) => { const d = new Date((diaNumero(iso) + 1) * 86400000); return d.toISOString().slice(0, 10); };

// linhas do .ics não passam de 75 bytes; o que sobra vai na linha de baixo, começando com um espaço
function dobrar(linha) {
  const bytes = new TextEncoder();
  if (bytes.encode(linha).length <= 75) return linha;
  const saida = []; let atual = "";
  for (const ch of linha.match(/\\.|[^]/gu)) { // "\," e "\n" contam como uma peça só: nunca quebrar no meio
    const limite = saida.length ? 74 : 75;
    if (bytes.encode(atual + ch).length > limite) { saida.push(atual); atual = ch; } else atual += ch;
  }
  saida.push(atual);
  return saida.join("\r\n ");
}

/** Texto de um arquivo .ics para o evento (dia inteiro, sem hora). Só faz sentido se o evento tem data. */
export function gerarIcs(ev, agora = new Date()) {
  if (!ev.inicio) return null;
  const carimbo = agora.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const linhas = [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Fortaleza Explora//PT-BR", "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${ev.id}@fortaleza-explora`,
    `DTSTAMP:${carimbo}`,
    `DTSTART;VALUE=DATE:${compacto(ev.inicio)}`,
    `DTEND;VALUE=DATE:${compacto(maisUmDia(ev.fim ?? ev.inicio))}`, // o fim do .ics não inclui o último dia
    `SUMMARY:${escIcs(ev.nome)}`,
    `DESCRIPTION:${escIcs(ev.descricao + (ev.confirmado ? "" : " (Datas a confirmar: veja a fonte oficial.)") + (ev.link ? `\n${ev.link}` : ""))}`,
    `LOCATION:${escIcs(ev.local ?? "Fortaleza, CE")}`,
    "END:VEVENT", "END:VCALENDAR",
  ];
  return linhas.map(dobrar).join("\r\n") + "\r\n";
}
