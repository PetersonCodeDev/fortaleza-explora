// Condições do dia (UV, vento, ondas, mar) em linguagem de gente. Módulo puro, testado em Node.
// Dados: Open-Meteo (forecast: uv_index, wind_speed_10m; marine: wave_height, wave_period, sea_surface_temperature).

const n1 = (x) => Number(x).toFixed(1).replace(".", ",");

export function nivelUV(uv) {
  if (uv == null) return null;
  if (uv < 3) return "baixo";
  if (uv < 6) return "moderado";
  if (uv < 8) return "alto";
  if (uv < 11) return "muito alto";
  return "extremo";
}
export function nivelVento(kmh) {
  if (kmh == null) return null;
  if (kmh < 12) return "fraco";
  if (kmh < 25) return "moderado";
  if (kmh < 38) return "forte";
  return "muito forte";
}
export function nivelOnda(m) {
  if (m == null) return null;
  if (m < 0.5) return "mar calmo";
  if (m < 1.0) return "ondas pequenas";
  if (m < 1.8) return "ondas médias";
  return "mar agitado";
}

/** Junta as respostas das duas APIs num objeto simples (qualquer parte pode faltar). */
export function lerCondicoes(clima, mar) {
  const c = clima ?? {}, m = mar ?? {};
  return {
    temp: c.temperature_2m ?? null,
    uv: c.uv_index ?? null,
    vento: c.wind_speed_10m ?? null,
    onda: m.wave_height ?? null,
    periodo: m.wave_period ?? null,
    agua: m.sea_surface_temperature ?? null,
  };
}

/** Linhas curtas para exibir: [{rotulo, valor, nivel}] só do que existe. */
export function linhasCondicoes(c) {
  const l = [];
  if (c.onda != null) l.push({ rotulo: "Mar", valor: `${n1(c.onda)} m${c.periodo != null ? ` · ${Math.round(c.periodo)} s` : ""}`, nivel: nivelOnda(c.onda) });
  if (c.agua != null) l.push({ rotulo: "Água", valor: `${Math.round(c.agua)}°`, nivel: null });
  if (c.uv != null) l.push({ rotulo: "UV", valor: n1(c.uv), nivel: nivelUV(c.uv) });
  if (c.vento != null) l.push({ rotulo: "Vento", valor: `${Math.round(c.vento)} km/h`, nivel: nivelVento(c.vento) });
  return l;
}

/** Conselhos práticos a partir das condições (nada de inventar: só regras claras). */
export function conselhos(c, { praia = false, kite = false } = {}) {
  const dicas = [];
  if (praia && c.onda != null) {
    if (c.onda >= 1.8) dicas.push("Mar agitado: cuidado com crianças e quem nada mal.");
    else if (c.onda < 1.0) dicas.push("Mar tranquilo para o banho.");
  }
  if (c.uv != null && c.uv >= 6) dicas.push("UV alto: passe protetor e evite o sol forte entre 10h e 15h.");
  if (c.vento != null && c.vento >= 25) dicas.push(kite ? "Vento forte: dia bom para kitesurf." : "Vento forte: o guarda-sol pode voar.");
  else if (kite && c.vento != null && c.vento < 15) dicas.push("Vento fraco para kitesurf hoje.");
  return dicas;
}
