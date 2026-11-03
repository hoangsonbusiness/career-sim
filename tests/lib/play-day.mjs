// Dùng chung cho test các gói nghề (SPEC-009..013): chơi hết ngày trong thế giới như AC-006-14 / SPEC-008 R-9.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { findPath, standSpots, step } from "../../src/game/grid.ts";
import { canInteract } from "../../src/game/quest.ts";
import { createEngine } from "../../src/engine/index.ts";
import { initialDraft, update, canSubmit, toAnswer } from "../../src/sim/controller.ts";

export const root = join(dirname(fileURLToPath(import.meta.url)), "../..");
export const readJson = (p) => JSON.parse(readFileSync(join(root, p), "utf8"));

function firstValid(seg) {
  const t = seg.task;
  let d = initialDraft(seg.id, t);
  if (t.type === "choice") d = update(t, d, { kind: "pick", option: 0 });
  if (t.type === "drag_sort") t.items.forEach((_, i) => { d = update(t, d, { kind: "place", item: i, bucket: t.buckets[0] }); });
  if (t.type === "dialogue") t.turns.forEach((_, k) => { d = update(t, d, { kind: "reply", turn: k, reply: 0 }); });
  return d;
}

/** Chơi hết ngày của nghề `id`; trả về phase cuối của engine. */
export function playDay(id) {
  const prof = readJson(`content/professions/${id}.json`);
  const world = readJson(`content/worlds/${id}.json`);
  const maps = Object.fromEntries(world.maps.map((m) => [m.id, m]));
  const engine = createEngine(prof);
  engine.start();
  let mapId = null, pos = null;
  for (const seg of prof.day_simulation.segments) {
    const ws = world.segments[seg.id];
    assert.ok(ws, `${id}: thiếu segment ${seg.id} trong bản đồ`);
    const map = maps[ws.map];
    if (mapId !== ws.map) { mapId = ws.map; pos = { ...map.spawn }; }
    const npcs = world.npcs.filter((n) => n.map === mapId).map((n) => ({ x: n.x, y: n.y }));
    const spot = standSpots(map, ws.target, npcs).find((s) => findPath(map, pos, s.pos, npcs) !== null);
    assert.ok(spot, `${id}/${seg.id}: không tới được target`);
    for (const next of findPath(map, pos, spot.pos, npcs)) {
      const dir = next.x > pos.x ? "right" : next.x < pos.x ? "left" : next.y > pos.y ? "down" : "up";
      pos = step(map, pos, dir, npcs);
    }
    assert.ok(canInteract(pos, spot.face, ws.target), `${id}/${seg.id}`);
    const d = firstValid(seg);
    assert.ok(canSubmit(seg.task, d), `${id}/${seg.id}`);
    engine.submit(toAnswer(seg.task, d), { durationMs: 0 });
    engine.next();
  }
  engine.finish();
  return engine.state().phase;
}
