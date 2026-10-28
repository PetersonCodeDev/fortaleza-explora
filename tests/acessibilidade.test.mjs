import test from "node:test";
import assert from "node:assert/strict";
import { DADOS } from "../js/data.js";
import { ACESSIBILIDADE } from "../js/acessibilidade.js";
import { nivelAcesso, TEXTO_ACESSO } from "../js/condicoes.js";

test("tag wheelchair do OpenStreetMap vira nível legível", () => {
  assert.equal(nivelAcesso("yes"), "sim");
  assert.equal(nivelAcesso("designated"), "sim");
  assert.equal(nivelAcesso("limited"), "parcial");
  assert.equal(nivelAcesso("no"), "nao");
  for (const v of [undefined, null, "", "talvez"]) assert.equal(nivelAcesso(v), "desconhecido");
  for (const n of ["sim", "parcial", "nao", "desconhecido"]) assert.ok(TEXTO_ACESSO[n]);
});

test("dados de acessibilidade só existem para lugares da base e com valores conhecidos", () => {
  const ids = new Set(DADOS.map((p) => p.id));
  for (const [id, a] of Object.entries(ACESSIBILIDADE)) {
    assert.ok(ids.has(id), `${id} não está na base`);
    assert.notEqual(nivelAcesso(a.valor), "desconhecido", `${id}: valor ${a.valor}`);
  }
});
