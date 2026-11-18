import { I, mark } from "./icons.js";
import { SOURCE, PROJECT, WEEKS, STAGES } from "./seed.js";
import {
  today,
  ZONE,
  effectiveDue,
  effectiveWeek,
  readyCount,
  trackState,
  safeLink,
} from "./model.js";
export const esc = (v) =>
  String(v ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
export const norm = (v) =>
  String(v)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
export const pad = (x) => String(x).padStart(2, "0");
const F = (opts) =>
  new Intl.DateTimeFormat("es-MX", { ...opts, timeZone: "UTC" });
const formats = {
  short: F({ day: "numeric", month: "short" }),
  full: F({ day: "numeric", month: "short", year: "numeric" }),
  month: F({ month: "short" }),
  monthLong: F({ month: "long" }),
  day: F({ day: "2-digit" }),
};
export const date = (d, mode = "short") =>
  d
    ? formats[mode]
        .format(new Date(d + "T12:00:00Z"))
        .replace(/\./g, "")
        .replace(/ de /g, " ")
    : "—";
export const range = (a, b) =>
  a.slice(0, 7) === b.slice(0, 7)
    ? `${Number(a.slice(8))}–${date(b)}`
    : `${date(a)} – ${date(b)}`;
export const currentWeek = () => WEEKS.find((w) => today() <= w.end)?.n || 13;
export const delta = (a, b = today()) =>
  Math.round(
    (Date.parse(a + "T12:00:00Z") - Date.parse(b + "T12:00:00Z")) / 86400000,
  );
export const countdown = (d) => {
  const x = delta(d);
  return x === 0
    ? "Hoy"
    : x === 1
      ? "Mañana"
      : x > 1
        ? `En ${x} días`
        : x === -1
          ? "Ayer"
          : `Hace ${-x} días`;
};
export const dateBlock = (d) =>
  `<span class="date-block"><b>${date(d, "day")}</b><small>${date(d, "month")}</small></span>`;
export const options = (xs, v) =>
  xs
    .map((item) => {
      const [val, txt] = Array.isArray(item) ? item : [item, item];
      return `<option value="${esc(val)}" ${String(val) === String(v) ? "selected" : ""}>${esc(txt)}</option>`;
    })
    .join("");
export const tag = (txt, color = "") =>
  `<span class="tag ${color}">${esc(txt)}</span>`;
export const activeNotes = (s) =>
  [...s.notes.values()].filter((n) => !n.deleted);
export const allHitos = (s) =>
  [...s.hitos.values()].sort(
    (a, b) => a.planned.localeCompare(b.planned) || a.id.localeCompare(b.id),
  );
export const tasksOf = (s, w) =>
  [...s.tasks.values()]
    .filter((t) => effectiveWeek(t, s) === w)
    .sort((a, b) =>
      (effectiveDue(a, s) || "9999").localeCompare(
        effectiveDue(b, s) || "9999",
      ),
    );
export const stateNames = {
  pending: "Pendiente",
  doing: "En curso",
  done: "Listo",
  na: "No aplica",
};
const NAV = [
  ["mesa", "home", "Vista general", "Mesa"],
  ["plan", "week", "Plan semanal", "Semana"],
  ["hitos", "flag", "Hitos", "Hitos"],
  ["disco", "disc", "Disco", "Disco"],
  ["bitacora", "journal", "Bitácora", "Bitácora"],
];
export const routeNames = {
  mesa: "Mesa de control",
  plan: "Plan semanal",
  hitos: "Hitos",
  disco: "Control del disco",
  bitacora: "Bitácora",
  ajustes: "Ajustes y respaldo",
};
const brand = `<a class="brand" href="#mesa" aria-label="BOMBATRONIK, ir a la mesa de control">${mark}<div><div class="brand-word">BOMBATRONIK</div><div class="brand-caption">ESTUDIO OPERATIVO</div></div></a>`;
export function shell(route, author, stored) {
  const nav = (id, ic, name, extra = "") =>
    `<a class="navitem ${route === id ? "active" : ""}" ${route === id ? 'aria-current="page"' : ""} href="#${id}">${I(ic, 18)}<span>${name}</span>${extra}</a>`;
  document.querySelector("#sidebar").innerHTML =
    `${brand}<p class="section-label">Navegación</p><nav class="sidenav" aria-label="Proyecto">${NAV.map(([id, ic, n]) => nav(id, ic, n, id === "disco" ? '<span class="ncount">14</span>' : "")).join("")}</nav><div class="side-ref"><a class="reference" href="${SOURCE}" target="_blank" rel="noopener noreferrer"><span class="reference-top">${I("file", 19)}${I("out", 14)}</span><span class="reference-title">Project Charter</span><span class="micro">Documento fuente · PDF</span></a></div>${nav("ajustes", "settings", "Ajustes y respaldo")}<div class="sidebar-foot"><span class="dot-label"><i class="status-dot ${stored ? "" : "warn"}"></i>${stored ? "LOCAL" : "TEMPORAL"}</span><span>BTK / V1.0</span></div>`;
  const now = new Date();
  const dat = new Intl.DateTimeFormat("es-MX", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: ZONE,
  })
    .format(now)
    .replace(/\./g, "")
    .replace(/ de /g, " ")
    .toUpperCase();
  document.querySelector("#topbar").innerHTML =
    `<div class="bread">${I("layers", 16)}<span>Estudio</span><span class="slash">/</span><strong>Relanzamiento</strong></div><div class="brand-mobile">${brand}</div><div class="top-right"><span class="top-date">${dat}</span><span class="mobile-only dot-label"><i class="status-dot"></i>PERSONAL</span><a href="#ajustes" class="avatar" style="display:grid;place-items:center" aria-label="Firma y respaldo: ${esc(author)}" title="Firma: ${esc(author)}">${esc(Array.from(author)[0].toUpperCase())}</a></div>`;
  document.querySelector("#mobile-nav").innerHTML = NAV.map(
    ([id, ic, n, short]) =>
      `<a class="mobitem ${id === route ? "active" : ""}" ${id === route ? 'aria-current="page"' : ""} href="#${id}"><span class="mi">${I(ic, 19)}</span>${short}</a>`,
  ).join("");
  document.querySelector("#storage-notice").innerHTML = stored
    ? ""
    : '<div class="notice">Esta vista no permite guardar al cerrar. Para conservar tus avances, usa la vista previa en vivo en su propia pestaña o descarga la app. Si ya capturaste datos, exporta un respaldo.</div>';
}
export const button = (action, label, icon, cls = "primary", id = "") =>
  `<button type="button" class="btn ${cls}" data-act="${action}" ${id ? `data-id="${esc(id)}"` : ""}>${icon ? I(icon, 16) : ""}${esc(label)}</button>`;
export const iconButton = (action, label, icon, id = "", cls = "") =>
  `<button type="button" class="icon-btn ${cls}" title="${esc(label)}" aria-label="${esc(label)}" data-act="${action}" data-id="${esc(id)}">${I(icon, 15)}</button>`;
export const head = (code, title, sub, action = "") =>
  `<div class="page-head"><div><div class="eyebrow"><i class="dash"></i>${code}</div><h1>${title}</h1><p class="subhead">${sub}</p></div>${action}</div>`;
export const cardHead = (ic, title, tail = "", color = "aqua") =>
  `<div class="card-head"><div class="card-title"><span class="section-icon ${color}">${I(ic, 17)}</span><h2>${title}</h2></div>${tail}</div>`;
export const jump = (route, label) =>
  `<a class="arrow-link" href="#${route}" aria-label="${esc(label)}" title="${esc(label)}">${I("out", 16)}</a>`;
export const jumpTxt = (route, label) =>
  `<a class="text-btn" href="#${route}">${label}${I("arrow", 14)}</a>`;
export const src = (page) =>
  page
    ? `<span class="source">Charter · <a href="${SOURCE}#page=${parseInt(page, 10)}" target="_blank" rel="noopener noreferrer">p. ${esc(page)} ${I("out", 10)}</a></span>`
    : '<span class="source">Creado en este dispositivo</span>';
export const stageTag = (st) =>
  tag(stateNames[st], st === "done" ? "teal" : st === "doing" ? "yellow" : "");
export const progress = (n, total) =>
  `<div class="line-progress" aria-hidden="true"><i style="width:${total ? Math.min(100, (100 * n) / total) : 0}%"></i></div>`;
export const empty = (ic, title, copy, action = "") =>
  `<div class="empty"><span class="tile-icon">${I(ic, 19)}</span><b>${esc(title)}</b><p>${esc(copy)}</p>${action}</div>`;
export function taskRow(t, s, compact = false) {
  const due = effectiveDue(t, s),
    ok = t.status === "done";
  return `<div class="task-row ${ok ? "done" : ""}"><button class="tick ${ok ? "on" : t.status === "doing" ? "doing" : ""}" data-act="task-toggle" data-id="${esc(t.id)}" role="checkbox" aria-checked="${ok}" aria-label="${ok ? "Reabrir" : "Completar"}: ${esc(t.title)}" title="${ok ? "Reabrir tarea" : "Marcar como hecha"}">${ok ? I("check", 13) : ""}</button><button class="row-main" data-act="task" data-id="${esc(t.id)}"><strong>${esc(t.title)}</strong><small>${esc(t.owner)}${!compact && t.h ? " · Vinculada a un hito" : ""}</small></button>${!compact ? `<span class="aux-tag">${stageTag(t.status)}</span>` : ""}<span class="date-chip ${due ? "" : "weekonly"}">${due ? date(due) : "Sin día fijo"}</span></div>`;
}
export function relation(s, scope, id) {
  if (scope === "project") return "Proyecto general";
  const m = { track: s.tracks, hito: s.hitos, task: s.tasks }[scope];
  return m?.get(id)?.title || "Elemento del plan";
}
export function feed(s) {
  const rows = activeNotes(s).map((n) => ({
    id: n.id,
    type: "note",
    clock: n.clock,
    at: n.created,
    date: n.date,
    actor: n.actor,
    scope: n.scope,
    related: n.related,
    body: n.body,
    next: n.next,
    link: n.link,
    edited: n.updated !== n.created ? { at: n.updated, by: n.updatedBy } : null,
  }));
  for (const e of s.events) {
    const d = e.data;
    let body = "",
      scope = e.kind.split(".")[0],
      id = e.entity;
    if (e.kind.startsWith("note.")) continue;
    if (e.kind === "task.add") body = "Nueva tarea en el plan semanal.";
    else if (e.kind === "task.set") {
      const xs = [];
      if ("title" in d) xs.push("Nombre de tarea actualizado.");
      if ("status" in d)
        xs.push(
          d.status === "done"
            ? `Tarea completada el ${date(d.actual, "full")}.`
            : `Estado de la tarea: ${stateNames[d.status].toLowerCase()}.`,
        );
      if ("owner" in d) xs.push(`Responsable: ${d.owner}.`);
      if ("due" in d || "week" in d) xs.push("Planificación actualizada.");
      body = xs.join(" ");
    } else if (e.kind === "hito.add")
      body = `Nuevo hito para el ${date(d.planned, "full")}.`;
    else if (e.kind === "hito.set") {
      const xs = [];
      if ("title" in d || "detail" in d || "category" in d)
        xs.push("Ficha del hito actualizada.");
      if ("planned" in d)
        xs.push(`Fecha planeada: ${date(d.planned, "full")}.`);
      if ("actual" in d)
        xs.push(
          d.actual
            ? `Hito cumplido el ${date(d.actual, "full")}.`
            : "Hito reabierto.",
        );
      body = xs.join(" ");
    } else if (e.kind === "track.set") {
      const xs = Object.entries(d.stages || {}).map(
        ([k, v]) =>
          `${STAGES.find(([i]) => i === k)[1]}: ${stateNames[v].toLowerCase()}`,
      );
      if ("next" in d)
        xs.push(
          d.next ? `Siguiente paso: ${d.next}` : "Siguiente paso retirado",
        );
      if ("link" in d)
        xs.push(d.link ? "Enlace actualizado" : "Enlace retirado");
      body = xs.join(" · ");
    }
    rows.push({
      id: e.id,
      type: "change",
      clock: e.clock,
      at: e.at,
      date: today(new Date(e.at)),
      actor: e.actor,
      scope,
      related: id,
      body,
    });
  }
  return rows.sort((a, b) => b.clock - a.clock || b.id.localeCompare(a.id));
}
export function logRow(row, s) {
  const note = row.type === "note",
    url = safeLink(row.link),
    rel = relation(s, row.scope, row.related);
  return `<article class="log-item"><span class="log-icon ${note ? "" : "auto"}">${I(note ? "pen" : "pulse", 15)}</span><div class="log-body"><div class="log-meta"><b>${esc(row.actor)}</b><span>·</span><time datetime="${row.date}">${date(row.date, "full")}</time><span>·</span><span>${note ? "Avance" : "Cambio"}</span></div><p class="log-text">${esc(row.body)}</p>${row.edited ? `<small class="helper">Editado por ${esc(row.edited.by)} · ${date(today(new Date(row.edited.at)), "full")}</small>` : ""}${row.next ? `<div class="log-next"><b>Siguiente paso:</b> ${esc(row.next)}</div>` : ""}<div class="list-meta">${row.scope !== "project" ? `<button class="text-btn" data-act="${row.scope}" data-id="${esc(row.related)}">${I(row.scope === "track" ? "disc" : row.scope === "hito" ? "flag" : "task", 12)}${esc(rel)}</button>` : `<span>${esc(rel)}</span>`}${url ? `<a class="text-btn" href="${esc(url)}" target="_blank" rel="noopener noreferrer">${I("link", 12)}Abrir enlace${I("out", 11)}</a>` : ""}</div></div>${note ? iconButton("note-edit", "Editar avance", "pen", row.id, "log-edit") : ""}</article>`;
}
export const weekOptions = (n) =>
  options(
    WEEKS.map((w) => [w.n, `S${pad(w.n)} · ${range(w.start, w.end)}`]),
    n,
  );
export const filterTabs = (key, values, v) =>
  `<div class="tabs" aria-label="Filtros">${values.map(([id, label]) => `<button class="chip ${v === id ? "active" : ""}" type="button" data-act="filter" data-key="${key}" data-val="${id}" aria-pressed="${v === id}">${label}</button>`).join("")}</div>`;
