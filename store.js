// Repositorio personal. La interfaz no depende del motor de almacenamiento.
import { uid, validEvent, checkBackup, byEvent } from "./model.js";
let db = null,
  volatile = [],
  memClock = 0,
  memAuthor = "Personal",
  memCatalogo = null;
export let durable = false;
export const getDurable = () => durable;
let channel;
try {
  channel = new BroadcastChannel("btk-relanzamiento-v1");
} catch {}
const ping = () => {
  try {
    channel?.postMessage("refresh");
  } catch {}
};
export const listen = (fn) => {
  if (channel) channel.onmessage = fn;
};
const done = (tx) =>
  new Promise((ok, no) => {
    tx.oncomplete = () => ok();
    tx.onabort = tx.onerror = () =>
      no(
        tx.error ||
          new Error("No se pudo guardar. Revisa el espacio disponible."),
      );
  });
const request = (r) =>
  new Promise((ok, no) => {
    r.onsuccess = () => ok(r.result);
    r.onerror = () => no(r.error);
  });
export async function openStore() {
  try {
    await new Promise((ok, no) => {
      const r = indexedDB.open("btk-studio-personal", 1);
      r.onupgradeneeded = () => {
        r.result.createObjectStore("events", { keyPath: "id" });
        r.result.createObjectStore("meta");
      };
      r.onsuccess = () => {
        db = r.result;
        db.onversionchange = () => db.close();
        ok();
      };
      r.onerror = () => no(r.error);
      r.onblocked = () =>
        no(new Error("Cierra las otras pestañas del estudio."));
    });
    durable = true;
  } catch {
    durable = false;
  }
  return durable;
}
export async function readState() {
  if (!durable)
    return { events: [...volatile].sort(byEvent), author: memAuthor };
  const tx = db.transaction(["events", "meta"], "readonly");
  const [events, author] = await Promise.all([
    request(tx.objectStore("events").getAll()),
    request(tx.objectStore("meta").get("author")),
  ]);
  return { events: events.sort(byEvent), author: author || "Personal" };
}
// Catálogo del proyecto. Se guarda la última copia autorizada para poder abrir
// el estudio sin conexión: es lo mismo que ya se descargó con una sesión válida,
// no una fuente alternativa de datos.
export async function catalogoGuardar(payload) {
  memCatalogo = payload;
  if (!durable) return;
  const t = db.transaction("meta", "readwrite"),
    finished = done(t);
  t.objectStore("meta").put(payload, "catalogo");
  await finished;
}
export async function catalogoCache() {
  if (!durable) return memCatalogo;
  try {
    const tx = db.transaction("meta", "readonly");
    const guardado = await request(tx.objectStore("meta").get("catalogo"));
    return guardado || memCatalogo;
  } catch {
    return memCatalogo;
  }
}
export async function catalogoBorrar() {
  memCatalogo = null;
  if (!durable) return;
  const t = db.transaction("meta", "readwrite"),
    finished = done(t);
  t.objectStore("meta").delete("catalogo");
  await finished;
}
export async function authorSet(name) {
  const a = name.trim();
  if (!a || a.length > 60)
    throw new Error("Escribe una firma de 1 a 60 caracteres.");
  if (!durable) {
    memAuthor = a;
    return;
  }
  const t = db.transaction("meta", "readwrite"),
    finished = done(t);
  t.objectStore("meta").put(a, "author");
  await finished;
  ping();
}
export async function record(kind, entity, data, actor) {
  const make = (clock) => {
    const e = {
      id: uid(),
      clock,
      kind,
      entity,
      data,
      actor,
      at: new Date().toISOString(),
    };
    if (!validEvent(e)) throw new Error("Revisa los datos antes de guardar.");
    return e;
  };
  if (!durable) {
    const e = make(++memClock);
    volatile.push(e);
    return e;
  }
  let event, err;
  const t = db.transaction(["events", "meta"], "readwrite"),
    finished = done(t),
    meta = t.objectStore("meta"),
    r = meta.get("clock");
  r.onsuccess = () => {
    try {
      event = make((r.result || 0) + 1);
      t.objectStore("events").add(event);
      meta.put(event.clock, "clock");
    } catch (ex) {
      err = ex;
      t.abort();
    }
  };
  try {
    await finished;
  } catch (ex) {
    throw err || ex;
  }
  ping();
  return event;
}
export async function importBackup(file) {
  if (!durable) {
    const fresh = checkBackup(file, volatile);
    volatile.push(...fresh);
    memClock = volatile.reduce((a, b) => Math.max(a, b.clock), 0);
    return fresh.length;
  }
  // Validar y aplicar dentro de UNA transacción: si otra pestaña escribió, nunca se pisa ese cambio.
  let count = 0,
    err;
  const t = db.transaction(["events", "meta"], "readwrite"),
    finished = done(t),
    es = t.objectStore("events"),
    r = es.getAll();
  r.onsuccess = () => {
    try {
      const fresh = checkBackup(file, r.result);
      for (const e of fresh) es.add(e);
      count = fresh.length;
      const high = [...r.result, ...fresh].reduce(
        (a, b) => Math.max(a, b.clock),
        0,
      );
      t.objectStore("meta").put(high, "clock");
    } catch (ex) {
      err = ex;
      t.abort();
    }
  };
  try {
    await finished;
  } catch (ex) {
    throw err || ex;
  }
  ping();
  return count;
}
