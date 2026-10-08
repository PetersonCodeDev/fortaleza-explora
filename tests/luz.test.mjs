import test from "node:test";
import assert from "node:assert/strict";
import { horasDoSol, luzDourada } from "../js/agora.js";

const FOR = { lat: -3.7319, lon: -38.5267 };

test("nascer do sol em Fortaleza fica entre 5:00 e 6:20 (UTC-3) o ano todo", () => {
  for (let m = 0; m < 12; m++) {
    const { nascer, por } = horasDoSol(new Date(2026, m, 15, 12), FOR.lat, FOR.lon);
    const h = nascer.getUTCHours() + nascer.getUTCMinutes() / 60 - 3;
    assert.ok(h > 5 && h < 6.35, `mês ${m + 1}: nascer ${h.toFixed(2)}`);
    assert.ok(por > nascer, "pôr do sol depois do nascer");
    const dia = (por - nascer) / 36e5;
    assert.ok(dia > 11.5 && dia < 12.6, `duração do dia ${dia.toFixed(2)} h`); // perto do equador o dia varia pouco
  }
});

test("luz dourada: 50 min depois do nascer e 50 min antes do pôr do sol", () => {
  const d = new Date(2026, 9, 7, 12);
  const { nascer, por } = horasDoSol(d, FOR.lat, FOR.lon);
  const l = luzDourada(d, FOR.lat, FOR.lon);
  assert.equal(+l.manha[0], +nascer);
  assert.equal(l.manha[1] - l.manha[0], 50 * 60000);
  assert.equal(+l.tarde[1], +por);
  assert.equal(l.tarde[1] - l.tarde[0], 50 * 60000);
});
