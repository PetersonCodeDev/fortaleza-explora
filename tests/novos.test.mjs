import test from "node:test";
import assert from "node:assert/strict";
import { DADOS } from "../js/data.js";
import { nivelUV, nivelVento, nivelOnda, lerCondicoes, linhasCondicoes, conselhos } from "../js/condicoes.js";
import { resumoPassaporte, selosNovos, anguloCarimbo, nomeCurto } from "../js/passaporte.js";

// resposta real da Open-Meteo em 15/10/2026
const CLIMA = { temperature_2m: 30.2, uv_index: 6.8, wind_speed_10m: 16.1, precipitation: 0, weather_code: 2 };
const MAR = { wave_height: 1.2, wave_period: 5.95, sea_surface_temperature: 28.1 };

test("níveis de UV, vento e onda", () => {
  assert.equal(nivelUV(2.9), "baixo"); assert.equal(nivelUV(6.8), "alto"); assert.equal(nivelUV(12), "extremo"); assert.equal(nivelUV(null), null);
  assert.equal(nivelVento(5), "fraco"); assert.equal(nivelVento(30), "forte");
  assert.equal(nivelOnda(0.3), "mar calmo"); assert.equal(nivelOnda(1.2), "ondas médias"); assert.equal(nivelOnda(2.4), "mar agitado");
});

test("condições: junta as duas APIs e aceita partes ausentes", () => {
  const c = lerCondicoes(CLIMA, MAR);
  assert.equal(c.uv, 6.8); assert.equal(c.onda, 1.2); assert.equal(c.agua, 28.1);
  const so = lerCondicoes(CLIMA, null);
  assert.equal(so.onda, null);
  const linhas = linhasCondicoes(c).map((l) => l.rotulo);
  assert.deepEqual(linhas, ["Mar", "Água", "UV", "Vento"]);
  assert.deepEqual(linhasCondicoes(so).map((l) => l.rotulo), ["UV", "Vento"]);
  assert.equal(linhasCondicoes(c)[0].valor, "1,2 m · 6 s");
});

test("conselhos: só regras claras", () => {
  const c = lerCondicoes(CLIMA, MAR);
  const d = conselhos(c, { praia: true });
  assert.ok(d.some((x) => /UV alto/.test(x)));
  assert.ok(!d.some((x) => /agitado/.test(x)));
  assert.ok(conselhos(lerCondicoes(CLIMA, { wave_height: 2.2 }), { praia: true }).some((x) => /agitado/.test(x)));
  assert.ok(conselhos(lerCondicoes({ wind_speed_10m: 30 }, null), { kite: true }).some((x) => /kitesurf/.test(x)));
  assert.deepEqual(conselhos(lerCondicoes({}, null)), []);
});

test("passaporte: totais, categorias e selos", () => {
  const r0 = resumoPassaporte({}, DADOS);
  assert.equal(r0.total, DADOS.length); assert.equal(r0.feitos, 0);
  assert.ok(r0.selos.every((s) => !s.conquistado));
  const praias = DADOS.filter((p) => p.categoria === "praia").slice(0, 3);
  const v = Object.fromEntries(praias.map((p) => [p.id, 1]));
  const r1 = resumoPassaporte(v, DADOS);
  assert.equal(r1.feitos, 3);
  const novos = selosNovos(r0, r1).map((s) => s.id);
  assert.ok(novos.includes("primeiro") && novos.includes("praieiro"));
  assert.ok(!novos.includes("explorador"));
  const tudo = resumoPassaporte(Object.fromEntries(DADOS.map((p) => [p.id, 1])), DADOS);
  assert.ok(tudo.selos.every((s) => s.conquistado), "visitando tudo, todos os selos");
});

test("passaporte: ângulo estável e nome curto", () => {
  assert.equal(anguloCarimbo("catedral"), anguloCarimbo("catedral"));
  for (const p of DADOS) { const a = anguloCarimbo(p.id); assert.ok(a >= -7 && a <= 7); }
  for (const p of DADOS) assert.ok(nomeCurto(p.nome).length <= 15, p.nome);
  assert.equal(nomeCurto("Ponte dos Ingleses"), "PONTE INGLESES");
});
