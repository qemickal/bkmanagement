// Estructura del proyecto y catálogo en memoria.
//
// El contenido del charter (semanas, canciones, hitos y tareas) ya NO viaja en
// este paquete: se pide a Supabase con una sesión válida y se guarda en caché
// local para poder trabajar sin conexión. Aquí sólo quedan las constantes de
// forma, que no revelan el plan.
export const PROJECT = "bombatronik-relanzamiento-2026";
export const SOURCE =
  "https://drive.google.com/file/d/1e1yDD8sCn8s4pFNLY2rd5JjXNfPCxMDr/view?usp=drivesdk";
export const START = "2026-11-22",
  END = "2027-02-19";
export const STAGES = [
  ["letra", "Letra"],
  ["voz", "Voz"],
  ["arreglo", "Arreglo"],
  ["mezcla", "Mezcla"],
  ["master", "Máster"],
  ["splits", "Splits"],
  ["registro", "Registro"],
  ["qc", "Control de calidad"],
];
export const CATEGORIES = [
  "Dirección",
  "Disco",
  "Imagen",
  "Lanzamiento",
  "En vivo",
  "Seguimiento",
];
export const OWNERS = [
  "Mick + Levi",
  "Mick",
  "Levi",
  "Mick + ingeniería",
  "Levi + foto",
  "Equipo visual",
  "Por asignar",
];

// Catálogo remoto. Se rellena con aplicarCatalogo() antes de pintar la interfaz;
// las importaciones son enlaces vivos, así que los módulos ya cargados ven los
// valores definitivos sin reiniciar el estado del tablero.
export let SEED_VERSION = "";
export let WEEKS = [];
export let TRACKS = [];
export let MILESTONES = [];
export let TASKS = [];

const die = (msg) => {
  throw new Error(msg);
};
const lista = (x, name) => (Array.isArray(x) ? x : die(`Catálogo inválido: ${name}.`));
const texto = (x, name) =>
  typeof x === "string" && x.trim() ? x.trim() : die(`Catálogo inválido: ${name}.`);

export function catalogoListo() {
  return WEEKS.length > 0 && TASKS.length > 0 && TRACKS.length > 0;
}

// Valida la forma mínima del catálogo antes de aceptarlo. Los registros
// individuales se validan igual que antes al derivar el estado.
export function aplicarCatalogo(payload) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload))
    die("El catálogo llegó vacío o con un formato desconocido.");
  if (payload.proyecto !== PROJECT)
    die("El catálogo recibido pertenece a otro proyecto.");
  const version = texto(payload.version, "version");
  const semanas = lista(payload.semanas, "semanas");
  const canciones = lista(payload.canciones, "canciones");
  const hitos = lista(payload.hitos, "hitos");
  const tareas = lista(payload.tareas, "tareas");
  if (!semanas.length || !tareas.length || !canciones.length || !hitos.length)
    die("El catálogo está incompleto. Vuelve a cargarlo desde el servidor.");
  for (const w of semanas)
    if (!Number.isInteger(w?.n) || typeof w.start !== "string" || typeof w.end !== "string")
      die("El catálogo trae una semana mal formada.");
  for (const t of tareas) if (typeof t?.id !== "string" || typeof t.title !== "string")
    die("El catálogo trae una tarea mal formada.");
  for (const t of canciones) if (typeof t?.id !== "string" || typeof t.title !== "string")
    die("El catálogo trae una canción mal formada.");
  for (const m of hitos) if (typeof m?.id !== "string" || typeof m.title !== "string")
    die("El catálogo trae un hito mal formado.");
  SEED_VERSION = version;
  WEEKS = structuredClone(semanas);
  TRACKS = structuredClone(canciones);
  MILESTONES = structuredClone(hitos);
  TASKS = structuredClone(tareas);
  return payload;
}
