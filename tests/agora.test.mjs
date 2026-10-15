import test from "node:test";
import assert from "node:assert/strict";
import { DADOS, ROTEIROS, CATEGORIAS } from "../js/data.js";
import { horaPorDoSol, periodo, estaChovendo, sugestaoAgora } from "../js/agora.js";

const FOR = { lat: -3.7319, lon: -38.5267 };

test("pôr do sol em Fortaleza fica entre 17:00 e 18:20 (UTC-3) o ano todo", () => {
  for (let m = 0; m < 12; m++) {
    const d = horaPorDoSol(new Date(2026, m, 15, 12), FOR.lat, FOR.lon);
    const h = d.getUTCHours() + d.getUTCMinutes() / 60 - 3;
    assert.ok(h > 17 && h < 18.35, `mês ${m + 1}: ${h.toFixed(2)}`);
  }
});

test("período do dia", () => {
  const por = new Date("2026-10-07T17:30:00-03:00");
  assert.equal(periodo(new Date("2026-10-07T03:00:00-03:00"), por), "madrugada");
  assert.equal(periodo(new Date("2026-10-07T08:00:00-03:00"), por), "manha");
  assert.equal(periodo(new Date("2026-10-07T12:30:00-03:00"), por), "almoco");
  assert.equal(periodo(new Date("2026-10-07T15:30:00-03:00"), por), "tarde");
  assert.equal(periodo(new Date("2026-10-07T16:45:00-03:00"), por), "porDoSol");
  assert.equal(periodo(new Date("2026-10-07T20:00:00-03:00"), por), "noite");
});

test("chuva", () => {
  assert.equal(estaChovendo({ precipitation: 0.5, weather_code: 0 }), true);
  assert.equal(estaChovendo({ precipitation: 0, weather_code: 61 }), true);
  assert.equal(estaChovendo({ precipitation: 0, weather_code: 1 }), false);
  assert.equal(estaChovendo(null), false);
});

test("sugestão: chuva leva a lugares cobertos; pôr do sol a mirantes; cada período dá resultado", () => {
  const por = new Date("2026-10-07T17:30:00-03:00");
  const chuva = sugestaoAgora({ periodo: "tarde", chovendo: true, porDoSol: por });
  assert.ok(DADOS.filter(chuva.pred).some((p) => p.id === "mauc"));
  assert.ok(!DADOS.filter(chuva.pred).some((p) => p.id === "praia-futuro"));
  for (const per of ["madrugada", "manha", "almoco", "tarde", "porDoSol", "noite"]) {
    const s = sugestaoAgora({ periodo: per, porDoSol: por });
    assert.ok(DADOS.filter(s.pred).length > 0, `${per} sem resultados`);
  }
  assert.ok(DADOS.filter(sugestaoAgora({ periodo: "porDoSol", porDoSol: por }).pred).some((p) => p.id === "ponte-ingleses"));
});

test("roteiros prontos só usam lugares e categorias que existem", () => {
  const ids = new Set(DADOS.map((p) => p.id));
  for (const r of ROTEIROS) for (const id of r.ids) assert.ok(ids.has(id), `${r.id}: ${id}`);
  for (const p of DADOS) assert.ok(CATEGORIAS[p.categoria], p.id);
});
