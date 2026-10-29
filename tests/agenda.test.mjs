import test from "node:test";
import assert from "node:assert/strict";
import { hojeFortaleza, estadoEvento, organizarAgenda, proximoDestaque, rotuloQuando, faltam, diasEntre, gerarIcs } from "../js/agenda.js";
import { EVENTOS } from "../js/eventos.js";

const ev = (extra) => ({ id: "x", nome: "Teste", descricao: "d", confirmado: true, ...extra });

test("hojeFortaleza usa o fuso de Fortaleza (UTC-3), não o do aparelho", () => {
  assert.equal(hojeFortaleza(new Date("2026-11-08T02:30:00Z")), "2026-11-07"); // 23h30 do dia 7 em Fortaleza
  assert.equal(hojeFortaleza(new Date("2026-11-08T03:00:00Z")), "2026-11-08");
});

test("estadoEvento: antes, durante, depois e sem data", () => {
  const e = ev({ inicio: "2026-11-07", fim: "2026-11-13" });
  assert.equal(estadoEvento(e, "2026-11-06"), "futuro");
  assert.equal(estadoEvento(e, "2026-11-07"), "acontecendo");
  assert.equal(estadoEvento(e, "2026-11-13"), "acontecendo"); // o último dia ainda conta
  assert.equal(estadoEvento(e, "2026-11-14"), "encerrado");
  assert.equal(estadoEvento(ev({ inicio: "2026-12-31" }), "2026-12-31"), "acontecendo"); // sem fim = um dia só
  assert.equal(estadoEvento(ev({ quando: "fim do ano" }), "2026-01-01"), "sazonal");
});

test("diasEntre atravessa mês, ano e fevereiro bissexto", () => {
  assert.equal(diasEntre("2026-10-29", "2026-11-07"), 9);
  assert.equal(diasEntre("2026-12-31", "2027-01-01"), 1);
  assert.equal(diasEntre("2028-02-28", "2028-03-01"), 2);
  assert.equal(diasEntre("2026-11-10", "2026-11-07"), -3);
});

test("organizarAgenda separa os grupos, ordena por data e esconde o que já passou", () => {
  const lista = [ev({ id: "c", inicio: "2027-02-06" }), ev({ id: "velho", inicio: "2026-01-01" }), ev({ id: "a", inicio: "2026-11-07", fim: "2026-11-13" }), ev({ id: "s" }), ev({ id: "b", inicio: "2026-12-31" })];
  const g = organizarAgenda(lista, "2026-11-08");
  assert.deepEqual(g.acontecendo.map((e) => e.id), ["a"]);
  assert.deepEqual(g.proximos.map((e) => e.id), ["b", "c"]);
  assert.deepEqual(g.sazonais.map((e) => e.id), ["s"]);
});

test("proximoDestaque respeita a janela e ignora evento sem data confirmada", () => {
  const lista = [ev({ id: "a", inicio: "2026-11-07", fim: "2026-11-13" }), ev({ id: "n", inicio: "2026-11-01", confirmado: false })];
  assert.equal(proximoDestaque(lista, "2026-10-01"), null); // longe demais
  assert.deepEqual(proximoDestaque(lista, "2026-10-29"), { ev: lista[0], agora: false, dias: 9 });
  assert.equal(proximoDestaque(lista, "2026-11-10").agora, true);
  assert.equal(proximoDestaque(lista, "2026-11-14"), null);
});

test("rotuloQuando e faltam", () => {
  assert.equal(rotuloQuando(ev({ inicio: "2026-11-07", fim: "2026-11-13" })), "7 a 13 de novembro");
  assert.equal(rotuloQuando(ev({ inicio: "2026-12-31" })), "31 de dezembro");
  assert.equal(rotuloQuando(ev({ inicio: "2027-01-30", fim: "2027-02-02" })), "30 de janeiro a 2 de fevereiro");
  assert.equal(rotuloQuando(ev({ quando: "Fim do ano" })), "Fim do ano");
  assert.equal(faltam(0), "hoje"); assert.equal(faltam(1), "amanhã"); assert.equal(faltam(9), "em 9 dias");
});

test("gerarIcs: dia inteiro, fim exclusivo, caracteres escapados, quebras CRLF", () => {
  const ics = gerarIcs(ev({ id: "cine", nome: "Cine, Ceará; 2026", inicio: "2026-11-07", fim: "2026-11-13", descricao: "linha1\nlinha2" }), new Date("2026-10-29T12:00:00Z"));
  assert.match(ics, /^BEGIN:VCALENDAR\r\n/);
  assert.match(ics, /DTSTART;VALUE=DATE:20261107\r\n/);
  assert.match(ics, /DTEND;VALUE=DATE:20261114\r\n/); // um dia depois do último
  assert.match(ics, /SUMMARY:Cine\\, Ceará\\; 2026\r\n/);
  assert.match(ics, /DESCRIPTION:linha1\\nlinha2/);
  assert.match(ics, /DTSTAMP:20261029T120000Z/);
  assert.ok(ics.endsWith("END:VCALENDAR\r\n"));
  assert.equal(gerarIcs(ev({ quando: "sem data" })), null);
});

test("gerarIcs: virada de ano no DTEND e linhas longas dobradas em 75 bytes", () => {
  const ics = gerarIcs(ev({ inicio: "2026-12-31", descricao: "á".repeat(80) }));
  assert.match(ics, /DTEND;VALUE=DATE:20270101/);
  for (const linha of ics.split("\r\n")) assert.ok(new TextEncoder().encode(linha).length <= 75, linha);
});

test("gerarIcs: desdobrando as linhas dá o texto original, mesmo com vírgulas na fronteira", () => {
  for (let n = 60; n < 80; n++) { // varre posições para uma vírgula escapada cair exatamente na quebra
    const descricao = "a".repeat(n) + ", fim; e mais, texto ç".repeat(3);
    const ics = gerarIcs(ev({ inicio: "2026-11-07", descricao }));
    const inteiro = ics.replace(/\r\n /g, "");
    assert.ok(inteiro.includes("DESCRIPTION:" + descricao.replace(/;/g, "\\;").replace(/,/g, "\\,")), `n=${n}`);
  }
});

test("os eventos cadastrados são válidos e apontam para lugares que existem", async () => {
  const { DADOS } = await import("../js/data.js");
  const ids = new Set(DADOS.map((p) => p.id));
  const vistos = new Set();
  for (const e of EVENTOS) {
    assert.ok(!vistos.has(e.id), `id repetido: ${e.id}`); vistos.add(e.id);
    assert.match(e.link, /^https:\/\//);
    assert.ok(e.nome && e.descricao && e.local && e.preco && e.fonte, e.id);
    for (const id of e.lugarIds ?? []) assert.ok(ids.has(id), `${e.id}: lugar inexistente ${id}`);
    if (e.inicio) { assert.match(e.inicio, /^\d{4}-\d{2}-\d{2}$/); assert.ok((e.fim ?? e.inicio) >= e.inicio, `${e.id}: fim antes do início`); }
    else assert.ok(e.quando, `${e.id}: sem data precisa de "quando"`);
  }
});
