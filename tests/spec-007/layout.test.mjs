// SPEC-007 — hàm bố cục thuần của hoạt cảnh mini-game.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { bubbleRect, dropIndex, timeSlots, hitBucket } from "../../src/game/minigames/layout.ts";
import { update } from "../../src/sim/controller.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");
const V = JSON.parse(readFileSync(join(root, "tests/spec-007/vectors.json"), "utf8"));

test("AC-007-01 toàn bộ conformance vectors đạt", () => {
  for (const v of V.bubbleRect) assert.deepEqual(bubbleRect(v.anchor, v.size, v.frame, v.margin), v.expect, JSON.stringify(v));
  for (const v of V.dropIndex) assert.equal(dropIndex(v.centersY, v.dragged, v.dropY), v.expect, JSON.stringify(v));
  for (const v of V.timeSlots) assert.deepEqual(timeSlots(v.minutes, v.budget), v.expect, JSON.stringify(v));
  for (const v of V.hitBucket) assert.equal(hitBucket(v.point, v.buckets), v.expect, JSON.stringify(v));
});

test("AC-007-02 bong bóng nằm trên điểm neo, căn giữa", () => {
  assert.deepEqual(bubbleRect({ x: 100, y: 80 }, { w: 60, h: 20 }, { w: 200, h: 150 }, 4), { x: 70, y: 56, w: 60, h: 20 });
});

test("AC-007-03 bong bóng bị kẹp trong khung", () => {
  assert.deepEqual(bubbleRect({ x: 5, y: 10 }, { w: 60, h: 20 }, { w: 200, h: 150 }, 4), { x: 4, y: 4, w: 60, h: 20 });
});

test("AC-007-04 dropIndex đếm thẻ khác có tâm phía trên điểm thả", () => {
  const c = [10, 30, 50, 70];
  assert.equal(dropIndex(c, 0, 55), 2);
  assert.equal(dropIndex(c, 3, 0), 0);
  assert.equal(dropIndex(c, 1, 100), 3);
});

test("AC-007-05 thả thẻ ở dropIndex tạo đúng action move", () => {
  const task = { type: "sequence", prompt: "-", steps: ["X", "Y", "Z"] };
  const d = update(task, { type: "sequence", order: ["X", "Z", "Y"] }, { kind: "move", from: 0, to: 2 });
  assert.deepEqual(d.order, ["Z", "Y", "X"]);
});

test("AC-007-06 timeSlots tô ô theo thứ tự activity", () => {
  assert.deepEqual(timeSlots([60, 30, 0], 120), [0, 0, 1, null]);
});

test("AC-007-07 timeSlots chưa phân bổ thì toàn ô trống", () => {
  assert.deepEqual(timeSlots([0, 0], 90), [null, null, null]);
});

test("AC-007-08 hitBucket: biên trái/trên tính vào khay, khe giữa không thuộc khay nào", () => {
  const b = [{ x: 0, y: 0, w: 50, h: 50 }, { x: 60, y: 0, w: 50, h: 50 }];
  assert.equal(hitBucket({ x: 70, y: 10 }, b), 1);
  assert.equal(hitBucket({ x: 55, y: 10 }, b), null);
  assert.equal(hitBucket({ x: 0, y: 0 }, b), 0);
});
