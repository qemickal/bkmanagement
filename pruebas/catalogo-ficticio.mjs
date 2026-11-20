// Catálogo ficticio para las pruebas de dominio.
//
// El contenido real del charter ya no vive en el repositorio: se carga en
// Postgres y el cliente lo pide con sesión. Las pruebas necesitan la misma
// forma de datos, así que usan este fixture inventado con los identificadores
// que ejercitan las reglas (hito entregado ≠ hito estrenado, etc.).
const dia = 24 * 60 * 60 * 1000;
const inicio = Date.parse("2026-11-22T12:00:00Z");
const iso = (ms) => new Date(ms).toISOString().slice(0, 10);

export const semanas = Array.from({ length: 13 }, (_, i) => ({
  n: i + 1,
  start: iso(inicio + i * 7 * dia),
  end: iso(inicio + (i * 7 + 6) * dia),
  phase: i < 4 ? "Arranque" : i < 12 ? "Producción" : "Cierre",
  title: `Bloque ${i + 1}`,
}));

export const canciones = ["Pista Uno", "Pista Dos"].map((title, i) => ({
  id: `tr-0${i + 1}`,
  number: i + 1,
  title,
  stages: {
    letra: "pending",
    voz: "pending",
    arreglo: "pending",
    mezcla: "pending",
    master: "pending",
    splits: "pending",
    registro: "pending",
    qc: "pending",
  },
  next: "",
  link: "",
}));

export const hitos = [
  ["h-entrega1", "Entrega del disco", "2027-02-12", "Disco"],
  ["h-estreno1", "Estreno del single", "2027-02-19", "Lanzamiento"],
  ["h-sprint90", "Corte del sprint", "2027-02-19", "Seguimiento"],
  ["h-lp90", "D90 del LP", "2027-09-02", "Seguimiento"],
].map(([id, title, planned, category]) => ({
  id,
  title,
  planned,
  original: planned,
  actual: null,
  page: "",
  qualifier: "",
  category,
  detail: "",
}));

export const tareas = [
  {
    id: "ta-01",
    title: "Cerrar máster de la primera entrega",
    owner: "Mick",
    week: 12,
    due: null,
    original: null,
    h: "h-entrega1",
    status: "pending",
    actual: null,
    page: "",
  },
  {
    id: "ta-02",
    title: "Revisar referencias visuales",
    owner: "Levi",
    week: 1,
    due: null,
    original: null,
    h: null,
    status: "pending",
    actual: null,
    page: "",
  },
];

export const catalogo = {
  proyecto: "bombatronik-relanzamiento-2026",
  version: "pruebas.1",
  semanas,
  canciones,
  hitos,
  tareas,
};
