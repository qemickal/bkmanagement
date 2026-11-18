import {
  PROJECT,
  SEED_VERSION,
  TASKS,
  TRACKS,
  MILESTONES,
  WEEKS,
  STAGES,
  CATEGORIES,
} from "./seed.js";
export const ZONE = "America/Mexico_City";
export const today = (now = new Date()) => {
  const p = new Intl.DateTimeFormat("en-CA", {
    timeZone: ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  return ["year", "month", "day"]
    .map((k) => p.find((x) => x.type === k).value)
    .join("-");
};
export const isDate = (v) =>
  typeof v === "string" &&
  /^\d{4}-\d{2}-\d{2}$/.test(v) &&
  Number.isFinite(Date.parse(v + "T12:00:00Z")) &&
  new Date(v + "T12:00:00Z").toISOString().slice(0, 10) === v;
export const safeLink = (s) => {
  try {
    const u = new URL(s);
    return ["https:", "http:"].includes(u.protocol) &&
      !u.username &&
      !u.password
      ? u.href
      : "";
  } catch {
    return "";
  }
};
export const byEvent = (a, b) =>
  a.clock - b.clock || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
export const effectiveDue = (t, s) =>
  t.h ? s.hitos.get(t.h)?.planned || t.due : t.due;
export const effectiveWeek = (t, s) => {
  const d = effectiveDue(t, s);
  return (d && WEEKS.find((w) => w.start <= d && d <= w.end)?.n) || t.week;
};
export const readyCount = (t) =>
  Object.values(t.stages).filter((x) => x === "done" || x === "na").length;
export const trackState = (t) =>
  readyCount(t) === STAGES.length
    ? "done"
    : Object.values(t.stages).some((x) => x !== "pending")
      ? "doing"
      : "pending";
export const uid = () =>
  globalThis.crypto?.randomUUID?.() ||
  "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = globalThis.crypto.getRandomValues(new Uint8Array(1))[0] & 15;
    return (c === "x" ? r : (r & 3) | 8).toString(16);
  });
const idOK = (x) =>
  typeof x === "string" && /^[A-Za-z0-9][A-Za-z0-9_-]{0,89}$/.test(x);
const uuid = (x) =>
  typeof x === "string" &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    x,
  );
const str = (x, max, min = 0) =>
  typeof x === "string" && x.length <= max && x.trim().length >= min;
const obj = (x) => x !== null && typeof x === "object" && !Array.isArray(x);
const keys = (d, allowed) => Object.keys(d).every((k) => allowed.includes(k));
const has = (x, k) => Object.hasOwn(x, k);
const die = (msg) => {
  throw new Error(msg);
};
const statuses = ["pending", "doing", "done"];
export function validEvent(e) {
  if (
    !obj(e) ||
    !uuid(e.id) ||
    !idOK(e.entity) ||
    !Number.isSafeInteger(e.clock) ||
    e.clock < 1 ||
    e.clock > 1e12 ||
    !str(e.actor, 60, 1) ||
    !str(e.at, 30, 20) ||
    !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(e.at) ||
    !Number.isFinite(Date.parse(e.at)) ||
    !obj(e.data)
  )
    return false;
  const d = e.data,
    optional = (k, fn) => !has(d, k) || fn(d[k]),
    link = (x) => str(x, 1200) && (!x || !!safeLink(x)),
    week = (x) => Number.isInteger(x) && x >= 1 && x <= 13;
  if (e.kind === "task.add")
    return (
      uuid(e.entity) &&
      keys(d, ["title", "owner", "week", "due"]) &&
      str(d.title, 150, 1) &&
      str(d.owner, 60, 1) &&
      week(d.week) &&
      (d.due === null || isDate(d.due))
    );
  if (e.kind === "task.set")
    return (
      keys(d, ["title", "status", "actual", "owner", "week", "due"]) &&
      optional("title", (x) => str(x, 150, 1)) &&
      optional("status", (x) => statuses.includes(x)) &&
      (!has(d, "status") ||
        (d.status === "done" ? isDate(d.actual) : d.actual === null)) &&
      (!has(d, "actual") || has(d, "status")) &&
      optional("owner", (x) => str(x, 60, 1)) &&
      optional("week", week) &&
      optional("due", (x) => x === null || isDate(x))
    );
  if (e.kind === "hito.add")
    return (
      uuid(e.entity) &&
      keys(d, ["title", "planned", "category", "detail"]) &&
      str(d.title, 150, 1) &&
      isDate(d.planned) &&
      CATEGORIES.includes(d.category) &&
      str(d.detail, 1500)
    );
  if (e.kind === "hito.set")
    return (
      keys(d, ["title", "category", "detail", "planned", "actual"]) &&
      optional("title", (x) => str(x, 150, 1)) &&
      optional("category", (x) => CATEGORIES.includes(x)) &&
      optional("detail", (x) => str(x, 1500)) &&
      optional("planned", isDate) &&
      optional("actual", (x) => x === null || isDate(x))
    );
  if (e.kind === "track.set")
    return (
      keys(d, ["stages", "next", "link"]) &&
      optional(
        "stages",
        (v) =>
          obj(v) &&
          Object.entries(v).every(
            ([k, s]) =>
              STAGES.some(([id]) => id === k) &&
              (statuses.includes(s) ||
                (s === "na" && ["splits", "registro"].includes(k))),
          ),
      ) &&
      optional("next", (x) => str(x, 400)) &&
      optional("link", link)
    );
  if (["note.add", "note.set"].includes(e.kind))
    return (
      uuid(e.entity) &&
      keys(d, ["scope", "related", "date", "body", "next", "link"]) &&
      ["project", "track", "task", "hito"].includes(d.scope) &&
      idOK(d.related) &&
      isDate(d.date) &&
      str(d.body, 3000, 1) &&
      str(d.next, 400) &&
      link(d.link)
    );
  return e.kind === "note.delete" && uuid(e.entity) && !Object.keys(d).length;
}
const mapSeed = (arr) => new Map(arr.map((x) => [x.id, structuredClone(x)]));
export function derive(input) {
  const s = {
    tasks: mapSeed(TASKS),
    hitos: mapSeed(MILESTONES),
    tracks: mapSeed(TRACKS),
    notes: new Map(),
    events: [...input].sort(byEvent),
  };
  const get = (m, id) =>
    m.get(id) || die("Un registro hace referencia a un elemento inexistente.");
  const add = (m, id, v) => {
    if (m.has(id)) die("El respaldo contiene dos altas del mismo elemento.");
    m.set(id, { id, ...v });
  };
  for (const e of s.events) {
    const d = e.data,
      id = e.entity;
    switch (e.kind) {
      case "task.add":
        add(s.tasks, id, {
          ...d,
          original: d.due,
          h: null,
          status: "pending",
          actual: null,
          page: "",
        });
        break;
      case "task.set": {
        const t = get(s.tasks, id);
        Object.assign(t, d);
        if (t.h && has(d, "status")) get(s.hitos, t.h).actual = t.actual;
        break;
      }
      case "hito.add":
        add(s.hitos, id, {
          ...d,
          original: d.planned,
          actual: null,
          page: "",
          qualifier: "",
        });
        break;
      case "hito.set": {
        Object.assign(get(s.hitos, id), d);
        if (has(d, "actual"))
          for (const t of s.tasks.values())
            if (t.h === id) {
              t.status = d.actual ? "done" : "pending";
              t.actual = d.actual;
            }
        break;
      }
      case "track.set": {
        const t = get(s.tracks, id);
        if (d.stages) Object.assign(t.stages, d.stages);
        if (has(d, "next")) t.next = d.next;
        if (has(d, "link")) t.link = d.link;
        break;
      }
      case "note.add":
      case "note.set": {
        const m = { track: s.tracks, task: s.tasks, hito: s.hitos }[d.scope];
        if (d.scope === "project") {
          if (d.related !== PROJECT) die("Proyecto de avance no válido.");
        } else get(m, d.related);
        if (e.kind === "note.add")
          add(s.notes, id, {
            ...d,
            actor: e.actor,
            created: e.at,
            updated: e.at,
            updatedBy: e.actor,
            clock: e.clock,
            deleted: false,
          });
        else
          Object.assign(get(s.notes, id), d, {
            updated: e.at,
            updatedBy: e.actor,
          });
        break;
      }
      case "note.delete":
        get(s.notes, id).deleted = true;
        break;
      default:
        die("Tipo de cambio desconocido.");
    }
  }
  return s;
}
export function backup(events, author) {
  return {
    format: "btk-studio-backup",
    version: 1,
    projectId: PROJECT,
    seedVersion: SEED_VERSION,
    exportedAt: new Date().toISOString(),
    author,
    events: [...events].sort(byEvent),
  };
}
function canonical(x) {
  if (Array.isArray(x)) return x.map(canonical);
  if (obj(x))
    return Object.fromEntries(
      Object.keys(x)
        .sort()
        .map((k) => [k, canonical(x[k])]),
    );
  return x;
}
export function checkBackup(file, current) {
  if (
    !obj(file) ||
    file.format !== "btk-studio-backup" ||
    file.version !== 1 ||
    file.projectId !== PROJECT ||
    file.seedVersion !== SEED_VERSION
  )
    die("Este archivo no es un respaldo compatible de este proyecto.");
  if (
    !Array.isArray(file.events) ||
    file.events.length > 30000 ||
    !file.events.every(validEvent)
  )
    die("El respaldo contiene registros no válidos. No se modificó nada.");
  const all = new Map(current.map((e) => [e.id, e])),
    fresh = [];
  for (const e of file.events) {
    if (all.has(e.id)) {
      if (
        JSON.stringify(canonical(all.get(e.id))) !==
        JSON.stringify(canonical(e))
      )
        die("Hay un conflicto de identificadores. No se importó nada.");
    } else {
      all.set(e.id, e);
      fresh.push(e);
    }
  }
  derive([...all.values()]);
  return fresh;
}
