// Genera el catálogo privado del proyecto a partir de supabase/fuente.js.
//
// No forma parte del sitio: los archivos que produce quedan en supabase/privado/,
// que está fuera de git y del bundle. El catálogo se carga en Postgres y el
// cliente lo pide por REST sólo con una sesión válida.
//
//   node supabase/generar-catalogo.mjs
//
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  PROJECT,
  SEED_VERSION,
  START,
  END,
  TRACKS,
  MILESTONES,
  WEEKS,
  TASKS,
} from "./fuente.js";

const home = path.dirname(fileURLToPath(import.meta.url));
const out = path.join(home, "privado");
mkdirSync(out, { recursive: true });

const payload = {
  proyecto: PROJECT,
  version: SEED_VERSION,
  sprint: { inicio: START, cierre: END },
  semanas: WEEKS,
  canciones: TRACKS,
  hitos: MILESTONES,
  tareas: TASKS,
};
const json = JSON.stringify(payload, null, 2);
writeFileSync(path.join(out, "catalogo.json"), json + "\n");

const conteos = [
  `tareas=${TASKS.length}`,
  `hitos=${MILESTONES.length}`,
  `canciones=${TRACKS.length}`,
  `semanas=${WEEKS.length}`,
].join(" ");

const sql = `-- Generado por supabase/generar-catalogo.mjs · ${new Date().toISOString()}
-- Pégalo completo en el editor SQL de Supabase (Dashboard → SQL Editor → New query).
-- No lo publiques: contiene el calendario, los hitos y los títulos del disco.

begin;

insert into public.catalogo (proyecto, version, payload)
values (
  '${PROJECT}',
  '${SEED_VERSION}',
  $catalogo$${json}$catalogo$::jsonb
)
on conflict (proyecto) do update
  set version = excluded.version,
      payload = excluded.payload,
      actualizado = now();

-- Da acceso a las cuentas que ya existen en Authentication → Users.
-- Cambia los correos y añade un insert por persona antes de ejecutar.
insert into public.miembros (proyecto, user_id, rol)
select '${PROJECT}', u.id, 'owner'
from auth.users u
where lower(u.email) in (lower('TU-CORREO@ejemplo.com'))
on conflict (proyecto, user_id) do update set rol = excluded.rol;

commit;

-- Verificación rápida (debe devolver 52, 22 y 14):
-- select jsonb_array_length(payload->'tareas')   as tareas,
--        jsonb_array_length(payload->'hitos')    as hitos,
--        jsonb_array_length(payload->'canciones') as canciones
-- from public.catalogo where proyecto = '${PROJECT}';
--
-- Sin sesión, esto debe devolver 0 filas y no un error de permisos:
--   curl -s "$SUPABASE_URL/rest/v1/catalogo?select=proyecto" -H "apikey: $ANON_KEY"
--
-- Conteos de referencia: ${conteos}
`;
writeFileSync(path.join(out, "catalogo.sql"), sql);

console.log(
  `Catálogo listo en supabase/privado/ · ${TASKS.length} tareas · ${MILESTONES.length} hitos · ${TRACKS.length} canciones · ${Math.round(Buffer.byteLength(json) / 1024)} KB`,
);
