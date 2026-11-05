// SPEC-031 — hàm thuần src/game3d/layout.ts.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import {
  tileToWorld, worldToTile, rotateDir, snapQuarter, pickTile, stepPose, chooseQuality, chooseRenderer, isTap,
} from "../../src/game3d/layout.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");
const V = JSON.parse(readFileSync(join(root, "tests/spec-031/vectors.json"), "utf8"));
const P = (a) => (a === null ? null : { x: a[0], y: a[1] });
/** fps: danh sách [số lần, giá trị] nối liền. */
const expand = (runs) => runs.flatMap(([n, v]) => Array(n).fill(v));
const close = (a, b, msg) => {
  for (const k of Object.keys(b)) assert.ok(Math.abs(a[k] - b[k]) < 1e-9, `${msg} ${k}: ${a[k]} ≠ ${b[k]}`);
};

test("AC-031-01 toàn bộ conformance vectors đạt", () => {
  for (const v of V.tileToWorld) assert.deepEqual(tileToWorld(P(v.p)), v.expect, JSON.stringify(v));
  for (const v of V.worldToTile) assert.deepEqual(worldToTile(v.x, v.z, v.w, v.h), P(v.expect), JSON.stringify(v));
  for (const v of V.rotateDir) assert.equal(rotateDir(v.d, v.q), v.expect, JSON.stringify(v));
  for (const v of V.snapQuarter) assert.equal(snapQuarter(v.yaw), v.expect, JSON.stringify(v));
  for (const v of V.pickTile) {
    const got = pickTile(v.origin, v.dir, v.w, v.h);
    assert.deepEqual(got, P(v.expect), JSON.stringify(v));
  }
  for (const v of V.stepPose) close(stepPose(P(v.from), P(v.to), v.t), v.expect, JSON.stringify(v));
  for (const v of V.chooseQuality) assert.equal(chooseQuality(expand(v.fps), v.current), v.expect, JSON.stringify(v));
  for (const v of V.chooseRenderer) assert.equal(chooseRenderer(v.has3d, { webgl2: v.webgl2 }), v.expect, JSON.stringify(v));
  for (const v of V.isTap) assert.equal(isTap(v.dx, v.dy, v.ms), v.expect, JSON.stringify(v));
});

test("AC-031-02 worldToTile ở biên lưới", () => {
  assert.deepEqual(worldToTile(9.99, 0, 10, 10), { x: 9, y: 0 });
  assert.equal(worldToTile(10, 0, 10, 10), null);
  assert.equal(worldToTile(-0.01, 5, 10, 10), null);
});

test("AC-031-03 camera q=2 đảo phím up/right", () => {
  assert.equal(rotateDir("up", 2), "down");
  assert.equal(rotateDir("right", 2), "left");
});

test("AC-031-04 pickTile trả null khi tia không chạm đất hoặc chạm ngoài lưới", () => {
  assert.equal(pickTile({ x: 2, y: 5, z: 2 }, { x: 0, y: 0, z: -1 }, 10, 10), null);
  assert.equal(pickTile({ x: 2, y: 5, z: 2 }, { x: -1, y: -1, z: 0 }, 10, 10), null);
});

test("AC-031-05 chooseQuality theo trung vị 120 khung cuối", () => {
  assert.equal(chooseQuality(Array(119).fill(10), "high"), "high");
  assert.equal(chooseQuality(Array(120).fill(44), "high"), "low");
  assert.equal(chooseQuality(Array(120).fill(60), "low"), "low");
  assert.equal(chooseQuality([...Array(60).fill(30), ...Array(60).fill(60)], "high"), "high");
});

test("AC-031-06 chooseRenderer chỉ chọn three khi có file 3D và WebGL2", () => {
  assert.equal(chooseRenderer(true, { webgl2: true }), "three");
  assert.equal(chooseRenderer(true, { webgl2: false }), "phaser");
  assert.equal(chooseRenderer(false, { webgl2: true }), "phaser");
});

test("AC-031-07 isTap phân biệt chạm và kéo", () => {
  assert.equal(isTap(5, 5, 200), true);
  assert.equal(isTap(8, 0, 100), false);
  assert.equal(isTap(0, 0, 300), false);
});
