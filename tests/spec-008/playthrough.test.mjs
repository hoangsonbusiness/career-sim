// SPEC-008 R-9 — chơi hết ngày trong thế giới cho MỌI gói sâu (mọi file trong content/worlds/), không liệt kê tên nghề.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { findPath, standSpots, step } from "../../src/game/grid.ts";
import { canInteract } from "../../src/game/quest.ts";
import { createEngine } from "../../src/engine/index.ts";
import { initialDraft, update, canSubmit, toAnswer } from "../../src/sim/controller.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");
const read = (p) => JSON.parse(readFileSync(join(root, p), "utf8"));

function firstValid(seg) {
  const t = seg.task;
  let d = initialDraft(seg.id, t);
  if (t.type === "choice") d = update(t, d, { kind: "pick", option: 0 });
  if (t.type === "drag_sort") t.items.forEach((_, i) => { d = update(t, d, { kind: "place", item: i, bucket: t.buckets[0] }); });
  if (t.type === "dialogue") t.turns.forEach((_, k) => { d = update(t, d, { kind: "reply", turn: k, reply: 0 }); });
  return d;
}

/** Chơi hết ngày như AC-006-14; trả về phase cuối. */
function playDay(prof, world) {
  const maps = Object.fromEntries(world.maps.map((m) => [m.id, m]));
  const engine = createEngine(prof);
  engine.start();
  let mapId = null, pos = null;
  for (const seg of prof.day_simulation.segments) {
    const ws = world.segments[seg.id];
    assert.ok(ws, `${prof.id}: thiếu segment ${seg.id}`);
    const map = maps[ws.map];
    if (mapId !== ws.map) { mapId = ws.map; pos = { ...map.spawn }; }
    const npcs = world.npcs.filter((n) => n.map === mapId).map((n) => ({ x: n.x, y: n.y }));
    const spot = standSpots(map, ws.target, npcs).find((s) => findPath(map, pos, s.pos, npcs) !== null);
    assert.ok(spot, `${prof.id}/${seg.id}: không tới được`);
    for (const next of findPath(map, pos, spot.pos, npcs)) {
      const dir = next.x > pos.x ? "right" : next.x < pos.x ? "left" : next.y > pos.y ? "down" : "up";
      pos = step(map, pos, dir, npcs);
      assert.deepEqual(pos, next, `${prof.id}/${seg.id}: bước bị chặn`);
    }
    assert.ok(canInteract(pos, spot.face, ws.target), `${prof.id}/${seg.id}`);
    const d = firstValid(seg);
    assert.ok(canSubmit(seg.task, d), `${prof.id}/${seg.id}`);
    engine.submit(toAnswer(seg.task, d), { durationMs: 0 });
    engine.next();
  }
  engine.finish();
  return engine.state().phase;
}

test("AC-008-10 mọi gói sâu chơi hết ngày trong thế giới tới done", () => {
  const ids = readdirSync(join(root, "content/worlds")).filter((f) => f.endsWith(".json")).map((f) => f.slice(0, -5));
  assert.ok(ids.length > 0, "không có gói sâu nào");
  for (const id of ids) {
    assert.equal(playDay(read(`content/professions/${id}.json`), read(`content/worlds/${id}.json`)), "done", id);
  }
});
