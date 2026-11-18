import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import {
  START,
  END,
  PROJECT,
  TASKS,
  WEEKS,
  TRACKS,
  MILESTONES,
  STAGES,
} from "../seed.js";
import {
  derive,
  backup,
  checkBackup,
  validEvent,
  readyCount,
  trackState,
  effectiveDue,
  effectiveWeek,
  today,
} from "../model.js";
const ev = (clock, kind, entity, data) => ({
  id: randomUUID(),
  clock,
  at: "2026-11-18T13:00:00.000Z",
  actor: "Personal",
  kind,
  entity,
  data,
});
test("90 días, pausa protegida, fechas explícitas y vínculos válidos", () => {
  const s = derive([]);
  assert.equal((Date.parse(END) - Date.parse(START)) / 86400000 + 1, 90);
  assert.equal(WEEKS.length, 13);
  assert.equal(TASKS.length, 52);
  assert.equal(MILESTONES.length, 22);
  assert.equal(TRACKS.length, 14);
  assert.equal(TRACKS[0].title, "Contradicción");
  assert.equal(TRACKS[13].title, "Lo Mejor");
  for (const t of s.tasks.values()) {
    assert.ok(![6, 7].includes(t.week));
    if (t.h) assert.ok(s.hitos.has(t.h));
    assert.equal(effectiveWeek(t, s), t.week);
  }
  assert.equal(s.hitos.get("h-lp90").original, "2027-09-02");
  assert.equal(s.hitos.get("h-sprint90").original, END);
});
test("entrega, estreno y calendario original son independientes", () => {
  const e = ev(1, "hito.set", "h-entrega1", {
    actual: "2026-11-18",
    planned: "2027-02-14",
  });
  assert.ok(validEvent(e));
  const s = derive([e]);
  const m = s.hitos.get("h-entrega1"),
    t = [...s.tasks.values()].find((x) => x.h === m.id);
  assert.equal(m.original, "2027-02-12");
  assert.equal(m.planned, "2027-02-14");
  assert.equal(t.status, "done");
  assert.equal(effectiveDue(t, s), m.planned);
  assert.equal(effectiveWeek(t, s), 13);
  assert.equal(s.hitos.get("h-estreno1").actual, null);
  const s2 = derive([
    e,
    ev(2, "task.set", t.id, { status: "pending", actual: null }),
  ]);
  assert.equal(s2.hitos.get(m.id).actual, null);
});
test("el disco necesita todas las etapas, no sólo el máster", () => {
  const s = derive([
    ev(1, "track.set", "tr-01", { stages: { master: "done" } }),
  ]);
  assert.equal(readyCount(s.tracks.get("tr-01")), 1);
  assert.equal(trackState(s.tracks.get("tr-01")), "doing");
  const a = Object.fromEntries(STAGES.map(([k]) => [k, "done"]));
  a.splits = "na";
  const b = ev(2, "track.set", "tr-01", { stages: a });
  assert.ok(validEvent(b));
  assert.equal(trackState(derive([b]).tracks.get("tr-01")), "done");
  assert.equal(
    validEvent(ev(1, "track.set", "tr-01", { stages: { voz: "na" } })),
    false,
  );
});
test("la mezcla de respaldos es repetible y no borra los cambios existentes", () => {
  const a = ev(1, "track.set", "tr-01", { stages: { voz: "done" } }),
    b = ev(1, "track.set", "tr-01", { stages: { letra: "done" } });
  const f = backup([b], "Mick");
  assert.deepEqual(checkBackup(f, [a]), [b]);
  assert.equal(checkBackup(f, [a, b]).length, 0);
  assert.deepEqual(derive([b, a]).tracks, derive([a, b]).tracks);
  assert.equal(readyCount(derive([a, b]).tracks.get("tr-01")), 2);
  assert.throws(
    () => checkBackup(backup([{ ...a, actor: "otra firma" }], "Personal"), [a]),
    /conflicto/,
  );
});
test("se rechazan enlaces inseguros, huérfanos y respaldos de otro proyecto", () => {
  const id = randomUUID(),
    d = {
      scope: "project",
      related: PROJECT,
      date: "2026-11-17",
      body: "Selección de toma",
      next: "Mezcla",
      link: "",
    };
  const note = ev(1, "note.add", id, d);
  assert.ok(validEvent(note));
  assert.throws(() =>
    checkBackup(
      backup([{ ...note, data: { ...d, link: "javascript:bad()" } }], ""),
      [],
    ),
  );
  assert.throws(() =>
    checkBackup(
      backup([ev(1, "track.set", "no-existe", { next: "x" })], ""),
      [],
    ),
  );
  assert.throws(() =>
    checkBackup({ ...backup([], ""), projectId: "ajeno" }, []),
  );
  assert.throws(() =>
    checkBackup(
      backup([{ ...note, data: { ...d, date: "2026-02-30" } }], ""),
      [],
    ),
  );
});
test("edición y baja lógica mantienen la autoría original y el orden causal", () => {
  const id = randomUUID(),
    d = {
      scope: "project",
      related: PROJECT,
      date: "2026-11-18",
      body: "Una toma",
      next: "",
      link: "",
    },
    n = ev(1, "note.add", id, d),
    m = {
      ...ev(2, "note.set", id, { ...d, body: "Dos tomas" }),
      actor: "Levi",
    };
  const s = derive([m, n]);
  assert.equal(s.notes.get(id).body, "Dos tomas");
  assert.equal(s.notes.get(id).actor, "Personal");
  assert.equal(s.notes.get(id).updatedBy, "Levi");
  assert.ok(derive([ev(3, "note.delete", id, {}), m, n]).notes.get(id).deleted);
});
test("la fecha local usa Ciudad de México, incluso cerca de medianoche UTC", () => {
  assert.equal(today(new Date("2026-11-22T03:00:00Z")), "2026-11-21");
});
