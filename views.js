import { WEEKS, STAGES, CATEGORIES, SOURCE, START, END } from "./seed.js";
import { today, readyCount, trackState } from "./model.js";
import { I } from "./icons.js";
import {
  esc,
  norm,
  pad,
  date,
  range,
  countdown,
  dateBlock,
  options,
  tag,
  allHitos,
  tasksOf,
  button,
  head,
  cardHead,
  jump,
  jumpTxt,
  stageTag,
  progress,
  empty,
  taskRow,
  feed,
  logRow,
  weekOptions,
  filterTabs,
  src,
  currentWeek,
} from "./ui.js";
const noteButton = () => button("note-new", "Registrar avance", "plus");
const stat = (r, ic, name, number, detail) =>
  `<a class="stat" href="#${r}"><span class="stat-icon">${I(ic, 19)}</span><span><span class="stat-name">${name}</span><span class="stat-value">${number}</span><span class="stat-note">${detail}</span></span><span class="stat-out">${I("out", 13)}</span></a>`;
export function mesa(s, u) {
  const h = allHitos(s),
    open = h.filter((x) => !x.actual && x.planned >= today()).slice(0, 3),
    tracks = [...s.tracks.values()],
    wk = WEEKS[currentWeek() - 1],
    ts = tasksOf(s, wk.n),
    done = ts.filter((x) => x.status === "done").length,
    allT = [...s.tasks.values()],
    recent = feed(s).slice(0, 3);
  return (
    head(
      "01 / Panel de producción",
      "Mesa de control",
      "El relanzamiento de BOMBATRONIK, de un vistazo.",
      noteButton(),
    ) +
    `<section class="cover" aria-label="Campaña de relanzamiento"><img class="cover-art" src="./assets/vinilo.webp" alt="" fetchpriority="high"><div class="cover-copy"><div class="cover-kicker"><i></i> CAMPAÑA DE RELANZAMIENTO</div><h2>De la cabina<br><em>al mundo.</em></h2><div class="cover-meta"><span>BOGOTÁ ⇄ CDMX</span><span class="vr"></span><span>CICLO 2026—27</span></div></div><span class="cover-code">BTK—001 / LADO A</span></section><div class="stats">${stat("plan", "week", "Sprint inicial", "90 <small>días</small>", `${allT.filter((t) => t.status === "done").length} de ${allT.length} tareas hechas`)}${stat("hitos", "flag", "Hitos cumplidos", `${pad(h.filter((x) => x.actual).length)} <small>/ ${h.length}</small>`, "Ruta del relanzamiento")}${stat("disco", "disc", "Canciones del LP", "14 <small>pistas</small>", `${tracks.filter((t) => trackState(t) === "done").length} listas para entregar`)}</div><div class="dash-grid"><section class="card">${cardHead("week", "Plan semanal", jump("plan", "Abrir plan semanal"))}<div class="week-ribbon"><span class="ribbon-left"><span class="wk-code">S${pad(wk.n)}</span><span class="wk-phase">${esc(wk.phase)}</span></span><span class="ribbon-date">${range(wk.start, wk.end)}</span></div>${
      ts.length
        ? `<div class="taskrows">${ts
            .slice(0, 4)
            .map((t) => taskRow(t, s, true))
            .join("")}</div>`
        : empty(
            "sun",
            wk.phase === "Pausa" ? "Pausa protegida" : "Sin tareas asignadas",
            wk.phase === "Pausa"
              ? "Esta semana no hay entregas obligatorias."
              : "Puedes añadir tareas desde el plan semanal.",
          )
    }<div class="card-foot"><span class="micro">${done} / ${ts.length} hechas</span>${jumpTxt("plan", "Abrir semana")}</div></section><section class="card">${cardHead("flag", "Próximos hitos", jump("hitos", "Abrir todos los hitos"), "sand")}${open.length ? `<div class="h-preview">${open.map((m, i) => `<button class="mini-hito" data-act="hito" data-id="${esc(m.id)}">${dateBlock(m.planned)}<span class="mini-body"><span class="row-title">${esc(m.title)}</span><span class="mini-caption">${esc(m.category)}${!i ? ` · ${countdown(m.planned)}` : ""}</span></span>${I("right", 12)}</button>`).join("")}</div>` : empty("flag", "No hay próximos hitos", "En la ruta puedes consultar pendientes pasados o añadir otra fecha.")}<div class="card-foot"><span class="micro">Calendario maestro</span>${jumpTxt("hitos", "Ver ruta")}</div></section></div><section class="card last-log">${cardHead("journal", "Últimos avances", jump("bitacora", "Abrir bitácora"), "soft")}${recent.length ? `<div class="log-list">${recent.map((x) => logRow(x, s)).join("")}</div>` : `<div class="empty-inline"><span class="tile-icon">${I("wave", 20)}</span><div><strong>La primera sesión empieza aquí.</strong><p>Registra una toma, un acuerdo o un pendiente en la bitácora.</p><button class="text-btn" data-act="note-new">Escribir el primer avance ${I("arrow", 13)}</button></div></div>`}</section>`
  );
}
export function plan(s, u) {
  const w = WEEKS[u.week - 1],
    ts = tasksOf(s, u.week),
    done = ts.filter((x) => x.status === "done").length,
    filtered = ts.filter(
      (t) => u.taskFilter === "all" || t.status === u.taskFilter,
    );
  return (
    head(
      "02 / Sprint de 90 días",
      "Plan semanal",
      "Del 22 de noviembre de 2026 al 19 de febrero de 2027.",
      button("task-new", "Nueva tarea", "plus"),
    ) +
    `<div class="week-nav"><div class="week-arrows"><button class="icon-btn" aria-label="Semana anterior" data-act="week-prev" ${u.week === 1 ? "disabled" : ""}>${I("left", 14)}</button><select class="select" data-change="week" aria-label="Elegir semana">${weekOptions(w.n)}</select><button class="icon-btn" aria-label="Semana siguiente" data-act="week-next" ${u.week === 13 ? "disabled" : ""}>${I("right", 14)}</button></div><button class="text-btn" data-act="week-now">${I("week", 14)}${today() < START ? "Ir al arranque" : today() > END ? "Ir al cierre" : "Semana actual"}</button></div><section class="week-hero"><div><div class="micro">Semana ${pad(w.n)} / ${w.phase}</div><h2>${w.title}</h2><p>${range(w.start, w.end)} · ${w.end.slice(0, 4)}</p></div><div class="week-prog"><strong>${done}/${ts.length}</strong><small> hechas</small>${progress(done, ts.length)}</div></section><div class="toolbar">${filterTabs(
      "taskFilter",
      [
        ["all", "Todas"],
        ["pending", "Pendientes"],
        ["doing", "En curso"],
        ["done", "Hechas"],
      ],
      u.taskFilter,
    )}<span class="micro">${filtered.length} ${filtered.length === 1 ? "tarea" : "tareas"}</span></div><section class="card list-card">${filtered.length ? `<div class="taskrows">${filtered.map((t) => taskRow(t, s)).join("")}</div>` : empty(w.phase === "Pausa" ? "sun" : "task", !ts.length && w.phase === "Pausa" ? "Pausa de fiestas" : "No hay tareas en esta vista", !ts.length && w.phase === "Pausa" ? "El plan protege el descanso del 21 de diciembre al 10 de enero. No hay actividades obligatorias." : "Cambia el filtro o añade una nueva tarea a esta semana.")}<div class="source-block">${src(w.n < 5 ? "27" : w.n < 9 ? "28" : "29")}<p class="helper" style="margin-top:5px">Sin día fijo = actividad de la semana, sin fecha límite explícita. Los responsables se pueden ajustar.</p></div></section>`
  );
}
export function hitos(s, u) {
  const all = allHitos(s),
    filtered = all.filter(
      (m) =>
        (u.hitoFilter === "all" ||
          (u.hitoFilter === "done" ? !!m.actual : !m.actual)) &&
        (u.category === "all" || u.category === m.category),
    ),
    groups = Map.groupBy
      ? Map.groupBy(filtered, (m) => m.planned.slice(0, 7))
      : filtered.reduce((a, m) => {
          const k = m.planned.slice(0, 7);
          if (!a.has(k)) a.set(k, []);
          a.get(k).push(m);
          return a;
        }, new Map());
  return (
    head(
      "03 / Calendario maestro",
      "Hitos del proyecto",
      "De la junta de arranque a la lectura D90 del álbum.",
      button("hito-new", "Nuevo hito", "plus"),
    ) +
    `<div class="scope-strip"><b>${I("flag", 16)} ${all.filter((m) => m.actual).length} de ${all.length} hitos cumplidos</b><span>La fecha planeada y la fecha real se guardan por separado.</span></div><div class="toolbar">${filterTabs(
      "hitoFilter",
      [
        ["all", "Todos"],
        ["pending", "Pendientes"],
        ["done", "Cumplidos"],
      ],
      u.hitoFilter,
    )}<select class="select" aria-label="Filtrar por frente" data-change="category">${options([["all", "Todos los frentes"], ...CATEGORIES], u.category)}</select></div>${[...groups].map(([key, items]) => `<div class="h-month"><h2 class="month-name">${capitalize(date(key + "-01", "monthLong"))}</h2><span class="micro">${key.slice(0, 4)}</span></div><section class="card">${items.map((m) => `<div class="h-row ${m.actual ? "is-done" : ""}">${dateBlock(m.planned)}<button class="row-main" data-act="hito" data-id="${esc(m.id)}"><strong>${esc(m.title)}</strong><small>${m.actual ? `Cumplido · ${date(m.actual, "full")}` : m.original !== m.planned ? `Reprogramado · original ${date(m.original, "full")}` : m.qualifier || (!m.actual && m.planned < today() ? "Fecha planeada pasada" : "Planeado")} · ${esc(m.category)}</small></button><span class="aux-tag">${tag(m.actual ? "Cumplido" : m.qualifier || "Pendiente", m.actual ? "teal" : m.qualifier ? "yellow" : "")}</span><button class="tick ${m.actual ? "on" : ""}" data-act="hito-toggle" data-id="${esc(m.id)}" role="checkbox" aria-checked="${!!m.actual}" aria-label="${m.actual ? "Reabrir" : "Cumplir"}: ${esc(m.title)}">${m.actual ? I("check", 14) : ""}</button></div>`).join("")}</section>`).join("") || `<div class="card">${empty("flag", "Sin hitos para este filtro", "Prueba otro frente o consulta todos los hitos.")}</div>`}`
  );
}
function capitalize(s) {
  return s.slice(0, 1).toUpperCase() + s.slice(1);
}
export function disco(s, u) {
  const arr = [...s.tracks.values()],
    complete = arr.filter((t) => trackState(t) === "done").length;
  return (
    head(
      "04 / Álbum de regreso",
      "Control del disco",
      "Las 14 pistas, en el orden aprobado. Abre una para registrar su producción.",
      noteButton(),
    ) +
    `<div class="scope-strip"><b>${I("disc", 16)} ${complete} de 14 canciones listas</b><span>Letra, voz, arreglo, mezcla, máster, splits, registro y calidad.</span></div><div class="toolbar">${filterTabs(
      "trackFilter",
      [
        ["all", "Todas"],
        ["pending", "Pendientes"],
        ["doing", "En curso"],
        ["done", "Listas"],
      ],
      u.trackFilter,
    )}<label class="searchbox">${I("search", 15)}<input data-input="track-search" aria-label="Buscar canción" type="search" placeholder="Buscar canción…" value="${esc(u.trackSearch)}"></label></div><section class="card"><div class="track-head"><span>Nº</span><span>Canción</span><span>Control</span><span class="status-col">Estado</span><span></span></div>${arr
      .filter((t) => u.trackFilter === "all" || trackState(t) === u.trackFilter)
      .map(
        (t) =>
          `<button class="track-row" data-act="track" data-id="${t.id}" data-search-key="${esc(norm(t.title))}"><span class="track-num">${pad(t.number)}</span><span class="track-title">${esc(t.title)}</span><span class="track-progress">${progress(readyCount(t), STAGES.length)}<small>${readyCount(t)}/${STAGES.length}</small></span>${stageTag(trackState(t))}${I("right", 13)}</button>`,
      )
      .join(
        "",
      )}<div id="no-tracks" hidden>${empty("search", "Ninguna canción coincide", "Cambia el filtro o prueba con otra palabra.")}</div><div class="source-block">${src("32, 53–54")}</div></section>`
  );
}
export function bitacora(s, u) {
  const all = feed(s),
    rows = all.filter(
      (r) =>
        (u.logFilter === "all" || r.type === u.logFilter) &&
        (u.logScope === "all" || u.logScope === r.scope),
    );
  return (
    head(
      "05 / Diario de sesiones",
      "Bitácora",
      "Avances, enlaces y decisiones, con fecha y firma.",
      noteButton(),
    ) +
    `<div class="toolbar">${filterTabs(
      "logFilter",
      [
        ["all", "Todo"],
        ["note", "Avances escritos"],
        ["change", "Cambios del tablero"],
      ],
      u.logFilter,
    )}<select class="select" aria-label="Filtrar bitácora por vínculo" data-change="logScope">${options(
      [
        ["all", "Todos los vínculos"],
        ["project", "Proyecto general"],
        ["track", "Canciones"],
        ["hito", "Hitos"],
        ["task", "Tareas"],
      ],
      u.logScope,
    )}</select></div><section class="card">${
      rows.length
        ? `<div class="log-list">${rows
            .slice(0, u.logLimit)
            .map((r) => logRow(r, s))
            .join(
              "",
            )}</div><div class="card-foot"><span class="micro">${Math.min(rows.length, u.logLimit)} de ${rows.length} registros</span>${rows.length > u.logLimit ? button("log-more", "Ver anteriores", "down", "secondary small") : ""}</div>`
        : empty(
            "journal",
            all.length ? "Ningún registro coincide" : "Todavía no hay avances",
            all.length
              ? "Prueba otro filtro."
              : "Cuenta qué pasó en la sesión y qué sigue. También aparecerán aquí los cambios de tareas, canciones e hitos.",
            !all.length
              ? button(
                  "note-new",
                  "Escribir primer avance",
                  "pen",
                  "minty small",
                )
              : "",
          )
    }</section>`
  );
}
export function settings(s, u) {
  const cache =
    u.offline === "ready"
      ? "Lista sin conexión"
      : u.offline === "loading"
        ? "Preparando modo sin conexión"
        : "Abrir en una pestaña HTTPS para activar";
  return (
    head(
      "06 / Este dispositivo",
      "Ajustes y respaldo",
      "Firma tus avances, protege tu trabajo y lleva el estudio al celular.",
    ) +
    `<div class="settings-grid"><section class="card">${cardHead("user", "Firma local")}<div class="setting-body"><p class="standard-para">Esta firma identifica tus nuevos cambios. No es una cuenta y no modifica el historial anterior.</p><form id="form-author" class="fields"><label class="field"><span>Nombre o firma</span><input class="input" name="author" required maxlength="60" value="${esc(u.author)}" placeholder="Ej. Mick o Levi" autocomplete="off"></label><div><button class="btn primary small">Guardar firma</button></div></form></div></section><section class="card">${cardHead("save", "Respaldo de datos", "", "sand")}<div class="setting-body"><p class="standard-para">Tus avances se guardan en este navegador. Si cambias de dirección o de celular, lleva tu respaldo JSON. Borrar los datos del sitio borra la copia local.</p><div class="setting-actions">${button("export", "Exportar JSON", "download", "primary small")}${button("import", "Importar", "upload", "secondary small")}</div><p class="helper" style="margin-top:12px">El JSON contiene el historial y los enlaces sin cifrar: guarda la copia en un lugar privado. Al importar, no se duplican registros.</p></div></section><section class="card">${cardHead("device", "Instalación y conexión", "", "soft")}<div class="setting-body"><div class="context-badges">${tag(u.online ? "Con conexión" : "Sin conexión", u.online ? "teal" : "yellow")}${tag(cache, u.offline === "ready" ? "teal" : "")}</div><p class="standard-para">Abre el estudio al menos una vez con internet. Una vez preparado, podrás consultar el plan y guardar cambios sin señal. Los enlaces a Drive sí requieren conexión.</p>${button("install", u.installed ? "Información de instalación" : "Instalar en mi dispositivo", "device", "secondary small")}</div></section><section class="card">${cardHead("file", "Documento y alcance")}<div class="setting-body"><p class="standard-para">Versión personal del Project Charter. Incluye el sprint A1, la ruta de lanzamientos y las fichas A3/A20. No modifica el PDF ni comparte tus registros con otro navegador.</p><a class="text-btn" href="${SOURCE}" target="_blank" rel="noopener noreferrer">Abrir el charter original en Drive ${I("out", 13)}</a><p class="source" style="margin-top:10px">Plan 2026–27 · Horario de Ciudad de México</p></div></section></div>`
  );
}
