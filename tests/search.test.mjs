import test from "node:test";
import assert from "node:assert/strict";
import { DADOS } from "../js/data.js";
import { norm, haversine, levenshtein, score, buscar, aberto, montarRoteiro, sugestoes, formatarDistancia } from "../js/search.js";

test("norm remove acentos e caixa", () => assert.equal(norm("  Praça do FERREIRA "), "praca do ferreira"));

test("haversine: Ponte dos Ingleses -> Mercado Central ~ 2,5 a 3,5 km", () => {
  const a = DADOS.find((p) => p.id === "ponte-ingleses"), b = DADOS.find((p) => p.id === "mercado-central");
  const d = haversine(a, b);
  assert.ok(d > 2.3 && d < 3.8, `distância ${d}`);
});

test("levenshtein", () => { assert.equal(levenshtein("mercado", "mercdo"), 1); assert.equal(levenshtein("a", "a"), 0); });

test("busca ignora acento e acha o lugar", () => assert.equal(buscar(DADOS, { q: "praca ferreira" })[0].id, "praca-ferreira"));
test("busca tolera erro de digitação", () => assert.equal(buscar(DADOS, { q: "mercdo central" })[0].id, "mercado-central"));
test("sinônimo: 'comer' encontra gastronomia", () => assert.ok(buscar(DADOS, { q: "comer" }).some((p) => p.categoria === "gastronomia")));
test("termos são AND", () => assert.equal(buscar(DADOS, { q: "museu xyzabc" }).length, 0));
test("filtro de categoria", () => assert.ok(buscar(DADOS, { categoria: "praia" }).every((p) => p.categoria === "praia")));
test("filtro grátis", () => assert.ok(buscar(DADOS, { apenasGratis: true }).every((p) => p.preco === 0)));

test("raio e ordenação por distância", () => {
  const origem = { lat: -3.7219, lon: -38.5105 }; // Iracema
  const r = buscar(DADOS, { origem, raioKm: 2, ordenar: "distancia" });
  assert.ok(r.length > 3);
  assert.ok(r.every((p) => p._dist <= 2));
  for (let i = 1; i < r.length; i++) assert.ok(r[i - 1]._dist <= r[i]._dist);
});

test("horário: 24h, comum e virada de meia-noite", () => {
  const seg10h = new Date("2026-10-05T10:00:00-03:00"); // segunda, 10h em Fortaleza
  assert.equal(aberto("24h", seg10h), true);
  assert.equal(aberto({ abre: "09:00", fecha: "18:00", dias: [1] }, seg10h), true);
  assert.equal(aberto({ abre: "09:00", fecha: "18:00", dias: [2] }, seg10h), false);
  const sab1h = new Date("2026-10-10T01:00:00-03:00"); // sábado 01h, bar que abriu sexta
  assert.equal(aberto({ abre: "18:00", fecha: "03:00", dias: [5] }, sab1h), true);
  assert.equal(aberto(null), null);
});

test("roteiro percorre todos os pontos e não é pior que a ordem original", () => {
  const origem = { lat: -3.7219, lon: -38.5105 };
  const pts = ["cocó", "mercado-central", "ponte-ingleses", "farol-mucuripe", "catedral"].map((id) => DADOS.find((p) => p.id === id) ?? DADOS.find((p) => p.id === "coco"));
  const { ordem, totalKm } = montarRoteiro(origem, pts);
  assert.equal(ordem.length, pts.length);
  let ingenuo = haversine(origem, pts[0]);
  for (let i = 1; i < pts.length; i++) ingenuo += haversine(pts[i - 1], pts[i]);
  assert.ok(totalKm <= ingenuo + 1e-9);
});

test("sugestões", () => assert.ok(sugestoes(DADOS, "merc").some((s) => s.texto.includes("Mercado"))));
test("dados: ids únicos e coordenadas dentro da Grande Fortaleza", () => {
  assert.equal(new Set(DADOS.map((p) => p.id)).size, DADOS.length);
  for (const p of DADOS) assert.ok(p.lat < -3.5 && p.lat > -4.0 && p.lon < -38.3 && p.lon > -38.8, p.id);
});
test("formatarDistancia", () => { assert.equal(formatarDistancia(0.45), "450 m"); assert.equal(formatarDistancia(2.34), "2,3 km"); });
