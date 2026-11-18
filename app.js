import { PROJECT, WEEKS, STAGES } from "./seed.js";
import {
  today,
  checkBackup,
  backup,
  derive,
  safeLink,
  uid,
  isDate,
} from "./model.js";
import * as store from "./store.js";
import { I } from "./icons.js";
import {
  shell,
  routeNames,
  currentWeek,
  esc,
  norm,
  date,
  button,
} from "./ui.js";
import * as views from "./views.js";
import { taskForm, hitoForm, trackForm, noteForm, scopeOpts } from "./forms.js";
const $ = (s) => document.querySelector(s),
  sheet = $("#sheet");
let s = derive([]),
  refreshNo = 0,
  toastT = 0,
  installEvent = null,
  dirty = false,
  discardThen = null,
  lastFocus = null,
  modalBase = null,
  stagedBackup = null,
  submitting = false,
  initDone = false;
const u = {
  route: getRoute(),
  author: "Personal",
  week: currentWeek(),
  taskFilter: "all",
  hitoFilter: "all",
  category: "all",
  trackFilter: "all",
  trackSearch: "",
  logFilter: "all",
  logScope: "all",
  logLimit: 60,
  online: navigator.onLine,
  offline: "loading",
  installed:
    matchMedia("(display-mode: standalone)").matches || !!navigator.standalone,
};
function getRoute() {
  const r = location.hash.slice(1);
  return Object.hasOwn(routeNames, r) ? r : "mesa";
}
function toast(msg, error = false) {
  const el = $("#toast");
  el.textContent = msg;
  el.className = "toast show" + (error ? " error" : "");
  clearTimeout(toastT);
  toastT = setTimeout(() => (el.className = "toast"), 3400);
}
function fail(e) {
  console.warn("BTK:", e?.message || e);
  const msg = e?.message || "No se pudo guardar. Vuelve a intentarlo.";
  if (sheet.open) {
    let el = sheet.querySelector(".form-error");
    if (!el) {
      el = document.createElement("div");
      el.className = "form-error";
      el.setAttribute("role", "alert");
      sheet.querySelector(".sheet-body")?.prepend(el);
    }
    el.textContent = msg;
    el.scrollIntoView({ block: "nearest" });
  } else toast(msg, true);
}
function render() {
  shell(u.route, u.author, store.getDurable());
  const f = {
    mesa: views.mesa,
    plan: views.plan,
    hitos: views.hitos,
    disco: views.disco,
    bitacora: views.bitacora,
    ajustes: views.settings,
  }[u.route];
  $("#screen").innerHTML = f(s, u);
  document.title = `${routeNames[u.route]} · BOMBATRONIK`;
  if (u.route === "disco") searchTracks();
}
async function refresh() {
  const seq = ++refreshNo;
  const data = await store.readState();
  if (seq !== refreshNo) return;
  s = derive(data.events);
  u.author = data.author;
  render();
}
function searchTracks() {
  const q = norm(u.trackSearch).trim();
  let n = 0;
  for (const el of document.querySelectorAll(".track-row")) {
    el.hidden = !el.dataset.searchKey.includes(q);
    if (!el.hidden) n++;
  }
  const em = $("#no-tracks");
  if (em) em.hidden = n !== 0;
}
function closeSheet() {
  dirty = false;
  discardThen = null;
  modalBase = null;
  stagedBackup = null;
  if (sheet.open) sheet.close();
  if (lastFocus?.isConnected) lastFocus.focus({ preventScroll: true });
  lastFocus = null;
}
function show(cfg, base = null) {
  if (!sheet.open) lastFocus = document.activeElement;
  dirty = false;
  discardThen = null;
  modalBase = base ? structuredClone(base) : null;
  sheet.className = cfg.wide ? "wide" : "";
  sheet.innerHTML = `<div class="sheet-head"><div><span class="eyebrow"><i class="dash"></i>${esc(cfg.code)}</span><h2 id="sheet-title" tabindex="-1">${esc(cfg.title)}</h2></div><button class="icon-btn" type="button" data-act="close" aria-label="Cerrar ventana">${I("close", 16)}</button></div><div class="sheet-body">${cfg.body}</div>`;
  if (!sheet.open) sheet.showModal();
  sheet.scrollTop = 0;
  $("#sheet-title").focus({ preventScroll: true });
}
function guard(fn) {
  if (!dirty || !sheet.open) {
    fn();
    return;
  }
  discardThen = fn;
  let g = $("#discard-guard");
  if (!g) {
    g = document.createElement("div");
    g.id = "discard-guard";
    g.className = "notice";
    g.setAttribute("role", "alert");
    g.innerHTML =
      '<b>Hay cambios sin guardar.</b><p>¿Quieres descartarlos o seguir editando?</p><div class="setting-actions">' +
      button("keep-edit", "Seguir editando", "", "secondary small") +
      button("discard", "Descartar cambios", "", "primary small") +
      "</div>";
    sheet.querySelector(".sheet-body").prepend(g);
  }
  sheet.scrollTop = 0;
  g.querySelector("button").focus();
}
function detail(kind, id) {
  if (kind === "task") {
    const t = s.tasks.get(id);
    if (t) show(taskForm(s, u, t), t);
  } else if (kind === "hito") {
    const m = s.hitos.get(id);
    if (m) show(hitoForm(s, u, m), m);
  } else if (kind === "track") {
    const t = s.tracks.get(id);
    if (t) show(trackForm(s, u, t), t);
  }
}
function setDateVisibility(wrap, done) {
  const el = $(wrap);
  if (!el) return;
  el.hidden = !done;
  const input = el.querySelector("input");
  input.disabled = !done;
  input.required = done;
  if (done && !input.value) input.value = today();
}
function cleanLink(value) {
  const x = (value || "").trim();
  if (x && !safeLink(x))
    throw new Error("Usa un enlace http o https válido y sin credenciales.");
  return x;
}
async function write(
  kind,
  id,
  data,
  finish = true,
  msg = "Cambio guardado en este dispositivo.",
) {
  await store.record(kind, id, data, u.author);
  await refresh();
  if (finish) closeSheet();
  toast(
    store.getDurable()
      ? msg
      : "Cambio registrado en memoria. Exporta un respaldo antes de salir.",
  );
}
function changes(base, values) {
  return Object.fromEntries(
    Object.entries(values).filter(([k, v]) => base[k] !== v),
  );
}
const noChanges = () => {
  closeSheet();
  toast("No había cambios por guardar.");
};
function validDay(d, actual = false) {
  if (!isDate(d)) throw new Error("Selecciona una fecha válida.");
  if (actual && d > today())
    throw new Error("La fecha real no puede ser posterior a hoy.");
  return d;
}
async function handleSubmit(form) {
  if (submitting) return;
  submitting = true;
  const submit = form.querySelector("[type=submit],button:not([type])");
  if (submit) submit.disabled = true;
  try {
    const f = Object.fromEntries(new FormData(form));
    for (const k in f) if (typeof f[k] === "string") f[k] = f[k].trim();
    const id = form.dataset.id || "",
      base = modalBase;
    if (form.id === "form-author") {
      await store.authorSet(f.author);
      await refresh();
      toast("Firma actualizada para los próximos registros.");
      return;
    }
    if (form.id === "form-note") {
      if (!f.body) throw new Error("Escribe qué avanzó en la sesión.");
      const d = {
        scope: f.scope,
        related: f.scope === "project" ? PROJECT : f.related,
        date: validDay(f.date, true),
        body: f.body,
        next: f.next,
        link: cleanLink(f.link),
      };
      if (id) {
        const live = s.notes.get(id);
        if (!live || live.deleted || live.updated !== base.updated)
          throw new Error(
            "Esta entrada cambió en otra pestaña. Ciérrala y vuelve a abrirla.",
          );
        if (!Object.keys(changes(base, d)).length) return noChanges();
      }
      await write(
        id ? "note.set" : "note.add",
        id || uid(),
        d,
        true,
        "Avance guardado en la bitácora.",
      );
      return;
    }
    if (form.id === "form-hito") {
      validDay(f.planned);
      if (!id) {
        if (!f.title) throw new Error("Escribe un nombre para el hito.");
        await write(
          "hito.add",
          uid(),
          {
            title: f.title,
            planned: f.planned,
            category: f.category,
            detail: f.detail,
          },
          true,
          "Hito añadido a la ruta.",
        );
        return;
      }
      const actual = f.state === "done" ? validDay(f.actual, true) : null,
        d = changes(base, {
          planned: f.planned,
          actual,
          ...(!base.page
            ? { title: f.title, category: f.category, detail: f.detail }
            : {}),
        });
      if (!Object.keys(d).length) return noChanges();
      await write(
        "hito.set",
        id,
        d,
        true,
        "Hito actualizado. La fecha original se conserva.",
      );
      return;
    }
    if (form.id === "form-task") {
      const week = Number(f.week || base?.week || u.week),
        w = WEEKS[week - 1],
        due = f.due || null;
      if (!w) throw new Error("Selecciona una semana del sprint.");
      if (due && (!isDate(due) || due < w.start || due > w.end))
        throw new Error(
          "El día límite debe pertenecer a la semana seleccionada.",
        );
      if (!id) {
        if (!f.title) throw new Error("Escribe un nombre para la tarea.");
        await write(
          "task.add",
          uid(),
          { title: f.title, owner: f.owner, week, due },
          true,
          "Tarea añadida al plan.",
        );
        return;
      }
      const actual = f.status === "done" ? validDay(f.actual, true) : null,
        d = changes(base, {
          owner: f.owner,
          ...(!base.page ? { title: f.title } : {}),
          ...(!base.h ? { week, due } : {}),
        });
      if (base.status !== f.status || base.actual !== actual) {
        d.status = f.status;
        d.actual = actual;
      }
      if (!Object.keys(d).length) return noChanges();
      await write("task.set", id, d, true, "Tarea actualizada.");
      return;
    }
    if (form.id === "form-track") {
      const stages = {};
      for (const [key] of STAGES)
        if (f[key] !== base.stages[key]) stages[key] = f[key];
      const d = changes(base, { next: f.next, link: cleanLink(f.link) });
      if (Object.keys(stages).length) d.stages = stages;
      if (!Object.keys(d).length) return noChanges();
      await write("track.set", id, d, true, "Control de canción actualizado.");
      return;
    }
  } finally {
    submitting = false;
    if (submit?.isConnected) submit.disabled = false;
  }
}
async function act(a, id, el) {
  if (a === "close") {
    guard(closeSheet);
    return;
  }
  if (a === "keep-edit") {
    discardThen = null;
    $("#discard-guard")?.remove();
    return;
  }
  if (a === "discard") {
    dirty = false;
    const f = discardThen;
    discardThen = null;
    $("#discard-guard")?.remove();
    f?.();
    return;
  }
  if (["task", "track", "hito"].includes(a)) {
    guard(() => detail(a, id));
    return;
  }
  if (a === "note-new" || a === "note-related") {
    guard(() =>
      show(
        noteForm(
          s,
          u.author,
          null,
          el.dataset.scope || "project",
          id || PROJECT,
        ),
      ),
    );
    return;
  }
  if (a === "note-edit") {
    const n = s.notes.get(id);
    if (n && !n.deleted) guard(() => show(noteForm(s, u.author, n), n));
    return;
  }
  if (a === "note-delete") {
    guard(() =>
      show({
        code: "Bitácora / Confirmación",
        title: "¿Eliminar este avance?",
        body: `<p class="standard-para">La entrada dejará de mostrarse en la bitácora. Esto no cambia el estado de ninguna canción, tarea o hito.</p><div class="sheet-actions">${button("note-edit", "Volver al avance", "", "secondary", id)}${button("delete-confirm", "Eliminar avance", "trash", "danger", id)}</div>`,
      }),
    );
    return;
  }
  if (a === "delete-confirm") {
    el.disabled = true;
    await write("note.delete", id, {}, true, "Avance eliminado de la vista.");
    return;
  }
  if (a === "task-new") {
    show(taskForm(s, u));
    return;
  }
  if (a === "hito-new") {
    show(hitoForm(s, u));
    return;
  }
  if (a === "task-toggle") {
    el.disabled = true;
    const t = s.tasks.get(id),
      ok = t.status !== "done";
    await write(
      "task.set",
      id,
      { status: ok ? "done" : "pending", actual: ok ? today() : null },
      false,
      ok
        ? t.h
          ? "Tarea e hito vinculados, completados."
          : "Tarea completada."
        : "Tarea reabierta.",
    );
    return;
  }
  if (a === "hito-toggle") {
    el.disabled = true;
    const m = s.hitos.get(id);
    await write(
      "hito.set",
      id,
      { actual: m.actual ? null : today() },
      false,
      m.actual
        ? "Hito reabierto."
        : "Hito cumplido. Se registró la fecha de hoy.",
    );
    return;
  }
  if (a === "filter") {
    u[el.dataset.key] = el.dataset.val;
    u.logLimit = 60;
    render();
    return;
  }
  if (a === "log-more") {
    u.logLimit += 60;
    render();
    return;
  }
  if (["week-prev", "week-next", "week-now"].includes(a)) {
    u.week =
      a === "week-now"
        ? currentWeek()
        : Math.max(1, Math.min(13, u.week + (a === "week-prev" ? -1 : 1)));
    u.taskFilter = "all";
    render();
    return;
  }
  if (a === "export") {
    const data = await store.readState(),
      b = backup(data.events, data.author),
      blob = new Blob([JSON.stringify(b, null, 2)], {
        type: "application/json",
      }),
      url = URL.createObjectURL(blob),
      x = document.createElement("a");
    x.href = url;
    x.download = `BOMBATRONIK-respaldo-${today()}.json`;
    document.body.append(x);
    x.click();
    x.remove();
    setTimeout(() => URL.revokeObjectURL(url), 60000);
    toast("Respaldo preparado para descargar.");
    return;
  }
  if (a === "import") {
    $("#import-file").value = "";
    $("#import-file").click();
    return;
  }
  if (a === "import-confirm") {
    if (!stagedBackup) return;
    el.disabled = true;
    const n = await store.importBackup(stagedBackup);
    await refresh();
    closeSheet();
    toast(
      `${n} ${n === 1 ? "registro importado" : "registros importados"}. Se conservaron los datos existentes.`,
    );
    return;
  }
  if (a === "install") {
    if (installEvent && !u.installed) {
      await installEvent.prompt();
      const choice = await installEvent.userChoice;
      installEvent = null;
      if (choice.outcome === "accepted") toast("Instalación solicitada.");
      return;
    }
    show({
      code: "App / Instalación",
      title: u.installed ? "Estudio instalado" : "Instalar el estudio",
      body: `${u.installed ? '<p class="standard-para">Ya estás usando la versión instalada en este dispositivo.</p>' : `<p class="detail-summary">Abre la vista previa en su <b>propia pestaña</b> del navegador. La instalación requiere una dirección HTTPS (o localhost en tu computadora).</p><div class="section-stack"><p><b>iPhone o iPad</b><br>En Safari, toca Compartir → Añadir a pantalla de inicio.</p><p><b>Android o computadora</b><br>En un navegador compatible, abre el menú y elige «Instalar aplicación» o «Añadir a pantalla de inicio».</p></div>`}<div class="inline-note">Para conservar el trabajo al cambiar de dirección, exporta primero tu respaldo. La vista previa es un entorno de prueba.</div><div class="sheet-actions">${button("close", "Entendido", "", "primary")}</div>`,
    });
    return;
  }
}
async function chooseBackup(file) {
  if (!file) return;
  if (file.size > 12 * 1024 * 1024)
    throw new Error("El respaldo excede el límite de 12 MB.");
  let parsed;
  try {
    parsed = JSON.parse(await file.text());
  } catch {
    throw new Error("No se pudo leer el JSON. No se cambió ningún dato.");
  }
  const { events } = await store.readState(),
    fresh = checkBackup(parsed, events);
  if (!fresh.length) {
    toast("Este respaldo no tiene registros nuevos. Nada que importar.");
    return;
  }
  stagedBackup = parsed;
  show({
    code: "Respaldo / Vista previa",
    title: "Importar respaldo",
    body: `<p class="detail-summary"><b>${esc(file.name)}</b></p><p>Se añadirán <b>${fresh.length} registros nuevos</b> de este proyecto. Los registros existentes se conservan; los cambios se aplican según su historial.</p><div class="inline-note">No se reemplaza tu firma local. Esta importación manual no activa la sincronización entre usuarios.</div><div class="sheet-actions">${button("close", "Cancelar", "", "secondary")}${button("import-confirm", "Confirmar importación", "upload")}</div>`,
  });
}
document.addEventListener("click", (e) => {
  const anchor = e.target.closest('a[href^="#"]');
  if (anchor && !e.ctrlKey && !e.metaKey && !e.shiftKey && !e.altKey) {
    const key = anchor.getAttribute("href").slice(1);
    if (key === "main") {
      e.preventDefault();
      $("#main").focus();
      return;
    }
    if (
      Object.hasOwn(routeNames, key) &&
      !["https:", "http:", "file:"].includes(location.protocol)
    ) {
      e.preventDefault();
      guard(() => {
        closeSheet();
        u.route = key;
        render();
        window.scrollTo(0, 0);
        $("#main").focus({ preventScroll: true });
      });
      return;
    }
  }
  const el = e.target.closest("[data-act]");
  if (el && !el.disabled) {
    e.preventDefault();
    act(el.dataset.act, el.dataset.id || "", el).catch((err) => {
      el.disabled = false;
      fail(err);
    });
  }
});
document.addEventListener("submit", (e) => {
  if (!e.target.matches("form")) return;
  e.preventDefault();
  handleSubmit(e.target).catch(fail);
});
document.addEventListener("change", (e) => {
  const x = e.target;
  if (x.id === "import-file") {
    chooseBackup(x.files?.[0]).catch(fail);
    return;
  }
  if (sheet.open && sheet.contains(x) && x.closest("form")) dirty = true;
  switch (x.dataset.change) {
    case "week":
      u.week = Number(x.value);
      u.taskFilter = "all";
      render();
      break;
    case "category":
      u.category = x.value;
      render();
      break;
    case "logScope":
      u.logScope = x.value;
      u.logLimit = 60;
      render();
      break;
    case "note-scope": {
      const wrap = $("#related-wrap");
      wrap.hidden = x.value === "project";
      wrap.querySelector("select").innerHTML = scopeOpts(s, x.value, null);
      break;
    }
    case "task-status":
      setDateVisibility("#task-actual-wrap", x.value === "done");
      break;
    case "hito-state":
      setDateVisibility("#hito-actual-wrap", x.value === "done");
      break;
    case "task-week": {
      const w = WEEKS[Number(x.value) - 1],
        d = x.form.due;
      d.min = w.start;
      d.max = w.end;
      if (d.value && (d.value < w.start || d.value > w.end)) d.value = "";
      break;
    }
  }
});
document.addEventListener("input", (e) => {
  if (sheet.open && sheet.contains(e.target) && e.target.closest("form"))
    dirty = true;
  if (e.target.dataset.input === "track-search") {
    u.trackSearch = e.target.value;
    searchTracks();
  }
});
sheet.addEventListener("cancel", (e) => {
  e.preventDefault();
  guard(closeSheet);
});
sheet.addEventListener("click", (e) => {
  if (e.target !== sheet) return;
  const r = sheet.getBoundingClientRect();
  if (
    e.clientX < r.left ||
    e.clientX > r.right ||
    e.clientY < r.top ||
    e.clientY > r.bottom
  )
    guard(closeSheet);
});
window.addEventListener("hashchange", () => {
  if (location.hash === "#main") {
    $("#main").focus();
    return;
  }
  const go = () => {
    closeSheet();
    u.route = getRoute();
    render();
    window.scrollTo({ top: 0, behavior: "instant" });
    $("#main").focus({ preventScroll: true });
  };
  if (sheet.open && dirty) {
    const requested = location.hash;
    history.replaceState(null, "", "#" + u.route);
    guard(() => {
      history.replaceState(null, "", requested);
      go();
    });
  } else go();
});
window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  installEvent = e;
});
window.addEventListener("appinstalled", () => {
  installEvent = null;
  u.installed = true;
  toast("Estudio instalado.");
});
for (const k of ["online", "offline"])
  window.addEventListener(k, () => {
    u.online = navigator.onLine;
    if (initDone && u.route === "ajustes" && !sheet.open) render();
    toast(
      u.online
        ? "Conexión disponible. Los datos siguen siendo locales."
        : "Sin conexión. Puedes seguir trabajando aquí.",
    );
  });
async function setupPWA() {
  let timer;
  try {
    if (
      !["https:", "http:"].includes(location.protocol) ||
      !window.isSecureContext ||
      !("serviceWorker" in navigator)
    )
      throw new Error("context");
    const r = await navigator.serviceWorker.register("./sw.js");
    await Promise.race([
      navigator.serviceWorker.ready,
      new Promise((_, no) => {
        timer = setTimeout(
          () => no(new Error("Tiempo de preparación agotado.")),
          45000,
        );
        const w = r.installing;
        if (w)
          w.addEventListener("statechange", () => {
            if (w.state === "redundant")
              no(new Error("No se pudo preparar el modo sin conexión."));
          });
      }),
    ]);
    u.offline = "ready";
  } catch {
    u.offline = "unavailable";
  } finally {
    clearTimeout(timer);
  }
  if (
    u.route === "ajustes" &&
    !sheet.open &&
    !document.querySelector("#form-author input:focus")
  )
    render();
}
async function main() {
  await store.openStore();
  await refresh();
  initDone = true;
  store.listen(() => refresh().catch(fail));
  window.addEventListener("pageshow", (e) => {
    if (e.persisted) refresh().catch(fail);
  });
  document.addEventListener("visibilitychange", () => {
    if (
      !document.hidden &&
      initDone &&
      !sheet.open &&
      !document.querySelector("#form-author input:focus")
    )
      refresh().catch(fail);
  });
  setupPWA();
}
main().catch((err) => {
  $("#screen").innerHTML =
    '<div class="notice">No se pudo abrir el estudio. Intenta abrir esta dirección en una pestaña nueva o recargarla. No borres tus datos locales sin un respaldo.</div>';
  fail(err);
});
