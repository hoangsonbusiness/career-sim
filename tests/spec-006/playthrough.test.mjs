// SPEC-006 AC-006-14 — chơi hết một ngày không giao diện: đi theo findPath tới chỗ đứng, quay mặt, tương tác, nộp.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { findPath, standSpots, step } from "../../src/game/grid.ts";
import { canInteract } from "../../src/game/quest.ts";
import { createEngine } from "../../src/engine/index.ts";
import { initialDraft, update, canSubmit, toAnswer } from "../../src/sim/controller.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");
const read = (p) => JSON.parse(readFileSync(join(root, p), "utf8"));

/** Draft hợp lệ đầu tiên: chọn phương án 0, xếp mọi item vào bucket đầu, trả lời 0 ở mọi lượt. */
function firstValid(seg) {
  const t = seg.task;
  let d = initialDraft(seg.id, t);
  if (t.type === "choice") d = update(t, d, { kind: "pick", option: 0 });
  if (t.type === "drag_sort") t.items.forEach((_, i) => { d = update(t, d, { kind: "place", item: i, bucket: t.buckets[0] }); });
  if (t.type === "dialogue") t.turns.forEach((_, k) => { d = update(t, d, { kind: "reply", turn: k, reply: 0 }); });
  return d;
}

test("AC-006-14 chơi hết ngày giáo viên trong thế giới, tới được mọi target", () => {
  const prof = read("content/professions/giao-vien-thpt.json");
  const world = read("content/worlds/giao-vien-thpt.json");
  const maps = Object.fromEntries(world.maps.map((m) => [m.id, m]));
  const engine = createEngine(prof);
  engine.start();

  let mapId = null;
  let pos = null;
  for (const seg of prof.day_simulation.segments) {
    const ws = world.segments[seg.id];
    assert.ok(ws, `thiếu segment ${seg.id}`);
    const map = maps[ws.map];
    if (mapId !== ws.map) { mapId = ws.map; pos = { ...map.spawn }; } // R-10: đổi bản đồ → về spawn
    const npcs = world.npcs.filter((n) => n.map === mapId).map((n) => ({ x: n.x, y: n.y }));
    const spot = standSpots(map, ws.target, npcs).find((s) => findPath(map, pos, s.pos, npcs) !== null);
    assert.ok(spot, `${seg.id}: không có chỗ đứng tới được`);
    // Đi từng bước theo đường BFS bằng step(), như người chơi bấm phím.
    for (const next of findPath(map, pos, spot.pos, npcs)) {
      const dir = next.x > pos.x ? "right" : next.x < pos.x ? "left" : next.y > pos.y ? "down" : "up";
      const moved = step(map, pos, dir, npcs);
      assert.deepEqual(moved, next, `${seg.id}: bước bị chặn`);
      pos = moved;
    }
    assert.equal(canInteract(pos, spot.face, ws.target), true, seg.id);
    const d = firstValid(seg);
    assert.equal(canSubmit(seg.task, d), true, seg.id);
    engine.submit(toAnswer(seg.task, d), { durationMs: 0 });
    engine.next();
  }
  engine.finish();
  assert.equal(engine.state().phase, "done");
});
