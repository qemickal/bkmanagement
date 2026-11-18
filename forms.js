import { PROJECT, OWNERS, WEEKS, CATEGORIES, STAGES } from "./seed.js";
import { today, readyCount, effectiveDue, safeLink } from "./model.js";
import { I } from "./icons.js";
import {
  esc,
  date,
  pad,
  options,
  tag,
  button,
  src,
  weekOptions,
  stateNames,
  feed,
  logRow,
  stageTag,
} from "./ui.js";
const f = (name, label, elem, hint = "") =>
  `<label class="field"><span>${label}</span>${elem}${hint ? `<small class="field-hint">${hint}</small>` : ""}</label>`;
const input = (name, value = "", type = "text", attrs = "") =>
  `<input class="input" name="${name}" type="${type}" value="${esc(value)}" ${attrs}>`;
const sel = (name, opts, attrs = "") =>
  `<select class="select" name="${name}" ${attrs}>${opts}</select>`;
const area = (name, value, rows = 3, attrs = "") =>
  `<textarea name="${name}" rows="${rows}" ${attrs}>${esc(value)}</textarea>`;
const actions = (ok, left = "") =>
  `<div class="form-error" role="alert"></div><div class="sheet-actions">${left}${button("close", "Cancelar", "", "secondary")}<button class="btn primary" type="submit">${I("check", 15)}${ok}</button></div>`;
const sig = (author) =>
  `<div class="list-meta">${I("user", 13)} Firma: <b>${esc(author)}</b></div>`;
const dateField = (key, title, d, attr = "") =>
  f(key, title, input(key, d, "date", attr));
export const scopeOpts = (s, scope, id) => {
  if (scope === "project")
    return options([[PROJECT, "Relanzamiento de BOMBATRONIK"]], PROJECT);
  const m = { track: s.tracks, task: s.tasks, hito: s.hitos }[scope];
  let a = [...m.values()];
  if (scope === "hito") a.sort((x, y) => x.planned.localeCompare(y.planned));
  return options(
    a.map((x) => [
      x.id,
      scope === "track" ? `${pad(x.number)} · ${x.title}` : x.title,
    ]),
    id,
  );
};
export function noteForm(s, author, n = null, scope = "project", id = PROJECT) {
  if (n) {
    scope = n.scope;
    id = n.related;
  }
  return {
    code: n ? "Bitácora / Edición" : "Bitácora / Nueva entrada",
    title: n ? "Editar avance" : "Registrar avance",
    body: `<form id="form-note" data-id="${esc(n?.id || "")}" class="fields">${f("body", "¿Qué avanzó?", area("body", n?.body || "", 3, 'required maxlength="3000" placeholder="Ej. Grabamos la voz principal y elegimos la toma 3."'))}<div class="twocol">${f(
      "scope",
      "Vincular a",
      sel(
        "scope",
        options(
          [
            ["project", "Proyecto general"],
            ["track", "Canción"],
            ["hito", "Hito"],
            ["task", "Tarea"],
          ],
          scope,
        ),
        'data-change="note-scope"',
      ),
    )}${dateField("date", "Fecha del avance", n?.date || today(), `required max="${today()}"`)}</div><div id="related-wrap" ${scope === "project" ? "hidden" : ""}>${f("related", "Elemento del plan", sel("related", scopeOpts(s, scope, id)))}</div>${f("next", "Siguiente paso <small>· opcional</small>", input("next", n?.next || "", "text", 'maxlength="400" placeholder="¿Qué toca en la próxima sesión?"'))}${f("link", "Enlace de referencia <small>· opcional</small>", input("link", n?.link || "", "url", 'maxlength="1200" placeholder="https://…" inputmode="url"'), "Solo se guarda el enlace; no se sube ningún archivo.")}${sig(author)}${actions(n ? "Guardar cambios" : "Guardar avance", n ? `<button class="text-btn danger-link left-action" data-act="note-delete" data-id="${esc(n.id)}" type="button">${I("trash", 14)}Eliminar</button>` : "")}</form>`,
  };
}
function associated(s, scope, id) {
  const rows = feed(s).filter(
    (r) => r.type === "note" && r.scope === scope && r.related === id,
  );
  return `<section class="sheet-section"><h3>Avances vinculados${rows.length ? " · " + rows.length : ""}</h3>${
    rows.length
      ? `<div class="log-list">${rows
          .slice(0, 5)
          .map((x) => logRow(x, s))
          .join("")}</div>`
      : '<p class="helper">Aún no hay avances escritos para este elemento.</p>'
  }<button type="button" class="text-btn" data-act="note-related" data-scope="${scope}" data-id="${esc(id)}">${I("plus", 14)}Registrar avance aquí</button></section>`;
}
export function taskForm(s, u, t = null) {
  const h = t?.h ? s.hitos.get(t.h) : null,
    week = t?.week || u.week;
  return {
    code: t ? "Sprint / Ficha de tarea" : "Sprint / Planificación",
    title: t ? t.title : "Nueva tarea",
    body: `${t ? `<div class="context-badges">${stageTag(t.status)}${src(t.page)}</div>` : ""}<form id="form-task" data-id="${esc(t?.id || "")}" class="fields">${t?.page ? "" : f("title", "Nombre de la tarea", input("title", t?.title || "", "text", 'required maxlength="150" placeholder="¿Qué se necesita hacer?"'))}${f("owner", "Responsable", sel("owner", options(OWNERS, t?.owner || "Por asignar")))}${h ? `<div class="inline-note">Vinculada a <b>${esc(h.title)}</b> · ${date(h.planned, "full")}. La tarea y el hito comparten el cumplimiento. <button class="text-btn" type="button" data-act="hito" data-id="${esc(h.id)}">Editar fecha del hito ${I("arrow", 12)}</button></div>` : `<div class="twocol">${f("week", "Semana del sprint", sel("week", weekOptions(week), 'data-change="task-week"'))}${dateField("due", "Día límite <small>· opcional</small>", t?.due || "", `min="${WEEKS[week - 1].start}" max="${WEEKS[week - 1].end}"`)}</div>`}${
      t
        ? `<div class="twocol">${f(
            "status",
            "Estado",
            sel(
              "status",
              options(
                [
                  ["pending", "Pendiente"],
                  ["doing", "En curso"],
                  ["done", "Hecha"],
                ],
                t.status,
              ),
              'data-change="task-status"',
            ),
          )}<div id="task-actual-wrap" ${t.status === "done" ? "" : "hidden"}>${dateField("actual", "Fecha real", t.actual || today(), `max="${today()}" ${t.status === "done" ? "required" : "disabled"}`)}</div></div>`
        : ""
    }${sig(u.author)}${actions(t ? "Guardar tarea" : "Crear tarea")}</form>${t ? associated(s, "task", t.id) : ""}`,
  };
}
export function hitoForm(s, u, m = null) {
  return {
    code: m ? "Ruta / Ficha de hito" : "Ruta / Calendario maestro",
    title: m ? m.title : "Nuevo hito",
    body: `${m ? `<div class="context-badges">${tag(m.category, "teal")}${m.qualifier ? tag(m.qualifier, "yellow") : ""}${src(m.page)}</div>${m.detail && m.page ? `<p class="detail-summary">${esc(m.detail)}</p>` : ""}` : ""}<form id="form-hito" data-id="${esc(m?.id || "")}" class="fields">${m?.page ? "" : `${f("title", "Nombre del hito", input("title", m?.title || "", "text", 'required maxlength="150" placeholder="Ej. Listening session del álbum"'))}${f("category", "Frente", sel("category", options(CATEGORIES, m?.category || "Dirección")))}`}${dateField("planned", "Fecha planeada", m?.planned || today(), "required")}${
      m
        ? `<div class="helper">Fecha original: <b>${date(m.original, "full")}</b>. Se conserva aunque reprogrames el hito.</div><div class="twocol">${f(
            "state",
            "Estado",
            sel(
              "state",
              options(
                [
                  ["open", "Pendiente"],
                  ["done", "Cumplido"],
                ],
                m.actual ? "done" : "open",
              ),
              'data-change="hito-state"',
            ),
          )}<div id="hito-actual-wrap" ${m.actual ? "" : "hidden"}>${dateField("actual", "Fecha real", m.actual || today(), `max="${today()}" ${m.actual ? "required" : "disabled"}`)}</div></div>`
        : f(
            "detail",
            "Detalle <small>· opcional</small>",
            area(
              "detail",
              "",
              2,
              'maxlength="1500" placeholder="¿Cómo sabrás que se cumplió?"',
            ),
          )
    }${m && !m.page ? f("detail", "Detalle <small>· opcional</small>", area("detail", m.detail, 2, 'maxlength="1500"')) : ""}${sig(u.author)}${actions(m ? "Guardar hito" : "Crear hito")}</form>${m ? associated(s, "hito", m.id) : ""}`,
  };
}
export function trackForm(s, u, t) {
  const url = safeLink(t.link);
  return {
    wide: true,
    code: `Disco / Pista ${pad(t.number)} de 14`,
    title: t.title,
    body: `<div class="context-badges">${tag(`${readyCount(t)} / ${STAGES.length} etapas resueltas`, "teal")}${src("32, 53–54")}</div><form id="form-track" data-id="${t.id}" class="fields"><div class="stage-fields">${STAGES.map(
      ([k, label]) =>
        `<label class="stage-cell"><span>${label}</span>${sel(
          k,
          options(
            (["splits", "registro"].includes(k)
              ? ["pending", "doing", "done", "na"]
              : ["pending", "doing", "done"]
            ).map((v) => [v, stateNames[v]]),
            t.stages[k],
          ),
          `aria-label="${esc(label)}"`,
        )}</label>`,
    ).join(
      "",
    )}</div>${f("next", "Siguiente paso", input("next", t.next, "text", 'maxlength="400" placeholder="Ej. Revisar la toma de voz antes de mezclar"'))}${f("link", "Enlace a la versión de trabajo", input("link", t.link, "url", 'maxlength="1200" placeholder="https://…" inputmode="url"'))}${url ? `<a href="${esc(url)}" target="_blank" rel="noopener noreferrer" class="form-link">${I("link", 13)} Abrir referencia guardada ${I("out", 12)}</a>` : ""}<p class="helper">Una pista queda lista al resolver todas sus etapas. Usa «No aplica» solo para splits o registro cuando corresponda.</p>${sig(u.author)}${actions("Guardar control")}</form>${associated(s, "track", t.id)}`,
  };
}
