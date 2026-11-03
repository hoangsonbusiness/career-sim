// SPEC-006 — logic lưới thuần (grid.ts) và tương tác (quest.ts).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { step, findPath, standSpots, facingTile } from "../../src/game/grid.ts";
import { canInteract } from "../../src/game/quest.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");
const V = JSON.parse(readFileSync(join(root, "tests/spec-006/vectors.json"), "utf8"));

/** Dựng Grid từ các dòng chuỗi ('#' = solid). */
function grid(rows) {
  return { width: rows[0].length, height: rows.length, solid: rows.flatMap((r) => [...r].map((c) => (c === "#" ? 1 : 0))) };
}
const P = ([x, y]) => ({ x, y });
const G = (name) => grid(V.grids[name]);
const blocked = (v) => (v.blocked ?? []).map(P);

test("AC-006-01 toàn bộ conformance vectors đạt", () => {
  for (const v of V.step) assert.deepEqual(step(G(v.grid), P(v.from), v.dir, blocked(v)), P(v.expect), JSON.stringify(v));
  for (const v of V.findPath) {
    const got = findPath(G(v.grid), P(v.from), P(v.to), blocked(v));
    assert.deepEqual(got, v.expect === null ? null : v.expect.map(P), JSON.stringify(v));
  }
  for (const v of V.standSpots) {
    const got = standSpots(G(v.grid), P(v.target), blocked(v));
    assert.deepEqual(got, v.expect.map(([p, face]) => ({ pos: P(p), face })), JSON.stringify(v));
  }
});

test("AC-006-02 step: tường, biên, ô bị chặn", () => {
  const g = G("wall-center");
  assert.deepEqual(step(g, P([0, 1]), "right", []), P([0, 1]));
  assert.deepEqual(step(g, P([0, 0]), "up", []), P([0, 0]));
  assert.deepEqual(step(g, P([0, 0]), "right", [P([1, 0])]), P([0, 0]));
});

test("AC-006-03 findPath: BFS ưu tiên up, right, down, left", () => {
  const g = G("wall-center");
  assert.deepEqual(findPath(g, P([0, 0]), P([2, 2]), []), [[1, 0], [2, 0], [2, 1], [2, 2]].map(P));
  assert.deepEqual(findPath(g, P([0, 0]), P([0, 0]), []), []);
  assert.equal(findPath(g, P([0, 0]), P([1, 1]), []), null);
});

test("AC-006-04 standSpots: thứ tự up, right, down, left và hướng quay mặt", () => {
  assert.deepEqual(standSpots(G("wall-center"), P([1, 1]), []), [
    { pos: P([1, 0]), face: "down" },
    { pos: P([2, 1]), face: "left" },
    { pos: P([1, 2]), face: "up" },
    { pos: P([0, 1]), face: "right" },
  ]);
});

test("AC-006-05 canInteract chỉ khi quay mặt đúng vào target", () => {
  assert.deepEqual(facingTile(P([1, 0]), "down"), P([1, 1]));
  assert.equal(canInteract(P([1, 0]), "down", P([1, 1])), true);
  assert.equal(canInteract(P([1, 0]), "left", P([1, 1])), false);
});
