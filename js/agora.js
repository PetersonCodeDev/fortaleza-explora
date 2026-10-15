// "Agora em Fortaleza": o que faz sentido fazer neste exato momento (hora, pôr do sol e chuva).
// Módulo puro (sem DOM) para poder ser testado em Node.
import { norm, relogioFortaleza } from "./search.js";

/** Nascer e pôr do sol (Date) numa data/local, pelo algoritmo simplificado da NOAA. Erro típico: ~2 min. */
export function horasDoSol(data, lat, lon) {
  const rad = Math.PI / 180;
  const inicio = Date.UTC(data.getFullYear(), 0, 0);
  const meiaNoite = Date.UTC(data.getFullYear(), data.getMonth(), data.getDate());
  const dia = Math.floor((meiaNoite - inicio) / 864e5);
  const g = ((2 * Math.PI) / 365) * (dia - 1);
  const eqt = 229.18 * (0.000075 + 0.001868 * Math.cos(g) - 0.032077 * Math.sin(g) - 0.014615 * Math.cos(2 * g) - 0.040849 * Math.sin(2 * g));
  const decl = 0.006918 - 0.399912 * Math.cos(g) + 0.070257 * Math.sin(g) - 0.006758 * Math.cos(2 * g) + 0.000907 * Math.sin(2 * g) - 0.002697 * Math.cos(3 * g) + 0.00148 * Math.sin(3 * g);
  const cosH = Math.cos(90.833 * rad) / (Math.cos(lat * rad) * Math.cos(decl)) - Math.tan(lat * rad) * Math.tan(decl);
  const ha = Math.acos(Math.max(-1, Math.min(1, cosH))) / rad;
  return {
    nascer: new Date(meiaNoite + (720 - 4 * (lon + ha) - eqt) * 60000),
    por: new Date(meiaNoite + (720 - 4 * (lon - ha) - eqt) * 60000),
  };
}
export const horaPorDoSol = (data, lat, lon) => horasDoSol(data, lat, lon).por;

/** Janelas de luz dourada (50 min depois do nascer e 50 min antes do pôr do sol), boas para foto. */
export function luzDourada(data, lat, lon) {
  const { nascer, por } = horasDoSol(data, lat, lon);
  const m = 50 * 60000;
  return { manha: [nascer, new Date(+nascer + m)], tarde: [new Date(+por - m), por] };
}

/** madrugada | manha | almoco | tarde | porDoSol | noite */
export function periodo(agora, porDoSol) {
  const min = (porDoSol - agora) / 60000;
  if (min > -20 && min <= 75) return "porDoSol";
  const h = relogioFortaleza(agora).hora;
  if (h < 5) return "madrugada";
  if (h < 11) return "manha";
  if (h < 15) return "almoco";
  return agora < porDoSol ? "tarde" : "noite";
}

/** Códigos WMO de chuva/garoa/pancada/trovoada (Open-Meteo). */
export const estaChovendo = (c) =>
  !!c && (c.precipitation > 0.1 || (c.weather_code >= 51 && c.weather_code <= 67) || (c.weather_code >= 80 && c.weather_code <= 99));

const temAlgum = (p, lista) => {
  const alvo = (p.tags ?? []).map(norm);
  return lista.some((t) => alvo.includes(t));
};
const coberto = (p) => temAlgum(p, ["chuva", "museu", "cinema", "teatro", "shopping", "aquario"]) || p.categoria === "cultura";

export const hhmm = (d) => d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: "America/Fortaleza" });

/** Sugestão principal para o momento. `pred` filtra os lugares. */
export function sugestaoAgora({ periodo: per, chovendo = false, porDoSol }) {
  if (chovendo) return { id: "chuva", rotulo: "Chovendo: programas cobertos", icone: "chuva", pred: coberto };
  switch (per) {
    case "porDoSol":
      return { id: "sol", rotulo: `Pôr do sol às ${hhmm(porDoSol)}`, icone: "sol", pred: (p) => temAlgum(p, ["por do sol", "mirante"]) };
    case "manha":
      return { id: "manha", rotulo: "Boa pra manhã", icone: "sol", pred: (p) => temAlgum(p, ["peixe", "pescadores", "nascer do sol", "caminhada", "trilha", "parque"]) || p.categoria === "natureza" };
    case "almoco":
      return { id: "almoco", rotulo: "Hora de almoçar", icone: "gastronomia", pred: (p) => p.categoria === "gastronomia" || temAlgum(p, ["comer", "peixe"]) };
    case "tarde":
      return { id: "tarde", rotulo: "Tarde de praia e passeio", icone: "praia", pred: (p) => p.categoria === "praia" || p.categoria === "lazer" };
    case "noite":
      return { id: "noite", rotulo: "Pra sair à noite", icone: "noite", pred: (p) => p.categoria === "noite" || p.categoria === "gastronomia" };
    default:
      return { id: "madrugada", rotulo: "Madrugada: o que fica 24h", icone: "lua", pred: (p) => p.horario === "24h" };
  }
}
