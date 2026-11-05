// SPEC-031 v3 — cảnh nền scenery ngoài lưới (R-3b). Fixture giống world3d.test.mjs.
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");
const SCRIPT = join(root, "scripts/validate-world3d.mjs");

/** GLB tối giản: header + chunk JSON chứa tên hoạt cảnh; đệm số 0 cho đủ `size` byte. */
function glb(animations, size = 0) {
  const json = Buffer.from(JSON.stringify({ asset: { version: "2.0" }, animations: animations.map((name) => ({ name, channels: [], samplers: [] })) }));
  const jsonPad = Buffer.concat([json, Buffer.alloc((4 - (json.length % 4)) % 4, 0x20)]);
  const h = Buffer.alloc(12); h.write("glTF", 0); h.writeUInt32LE(2, 4);
  const jh = Buffer.alloc(8); jh.writeUInt32LE(jsonPad.length, 0); jh.write("JSON", 4);
  let buf = Buffer.concat([h, jh, jsonPad]);
  if (size > buf.length) buf = Buffer.concat([buf, Buffer.alloc(size - buf.length)]);
  buf.writeUInt32LE(buf.length, 8);
  return buf;
}

/** Thế giới 2D 7×3: hàng trên cùng x=3..6 là tường; NPC "n" ở (6,2); 2 segment. */
function world2d() {
  const W = 7, H = 3, N = W * H;
  const solid = Array(N).fill(0);
  for (const x of [3, 4, 5, 6]) solid[x] = 1;
  return {
    profession_id: "mini", tile_size: 16,
    tilesets: [{ key: "t", image: "game/t.png", columns: 2, spacing: 1 }],
    maps: [{ id: "m", width: W, height: H, layers: [{ name: "floor", data: Array(N).fill("t:0") }], solid, spawn: { x: 0, y: 0 } }],
    npcs: [{ id: "n", map: "m", x: 6, y: 2, name: "NPC", sprite: ["t:1"] }],
    player_sprite: ["t:2"],
    segments: { a: { map: "m", target: { x: 1, y: 1 }, quest: "Việc A" }, b: { map: "m", target: { x: 6, y: 2 }, npc: "n", quest: "Việc B" } },
  };
}

function world3d() {
  return {
    profession_id: "mini",
    models: {
      hero: { file: "/game3d/kit/hero.glb", scale: 1, license: "/game3d/kit/License.txt" },
      npc: { file: "/game3d/kit/npc.glb", scale: 1, license: "/game3d/kit/License.txt" },
      desk: { file: "/game3d/kit/desk.glb", scale: 1, license: "/game3d/kit/License.txt" },
    },
    player_model: "hero",
    npc_models: { n: "npc" },
    maps: {
      m: {
        lighting: "indoor",
        floor: { default: "wood", regions: [{ x: 0, y: 0, w: 2, h: 2, material: "tile" }] },
        wall: { material: "plaster", height: 2.4 },
        props: [{ model: "desk", x: 4, y: 0, rot: 90, blocks: true }, { model: "desk", x: 0, y: 2, rot: 0, blocks: false }],
      },
    },
  };
}

/** Dựng thư mục tạm: worlds/mini.json, worlds3d/mini.json, public/game3d/kit/*. */
function setup(w3, files) {
  const dir = mkdtempSync(join(tmpdir(), "spec031-"));
  for (const d of ["worlds", "worlds3d", "public/game3d/kit"]) mkdirSync(join(dir, d), { recursive: true });
  writeFileSync(join(dir, "worlds/mini.json"), JSON.stringify(world2d()));
  writeFileSync(join(dir, "worlds3d/mini.json"), JSON.stringify(w3));
  const f = {
    "public/game3d/kit/hero.glb": glb(["Idle", "Walk"]),
    "public/game3d/kit/npc.glb": glb(["Idle"]),
    "public/game3d/kit/desk.glb": glb([]),
    "public/game3d/kit/License.txt": "CC0",
    ...files,
  };
  for (const [p, data] of Object.entries(f)) if (data !== null) writeFileSync(join(dir, p), data);
  return dir;
}

function run(w3, files = {}) {
  const dir = setup(w3, files);
  const r = spawnSync(process.execPath, [SCRIPT, join(dir, "worlds3d/mini.json"), "--worlds", join(dir, "worlds"), "--public", join(dir, "public")], { encoding: "utf8" });
  return { code: r.status, out: r.stdout + r.stderr };
}

test("AC-031-20 scenery hợp lệ ở viền; trong lưới, quá viền, model lạ → exit 1", () => {
  // Lưới fixture 7×3; viền hợp lệ là [-12, 19) × [-12, 15).
  const withScenery = (items) => { const w = world3d(); w.maps.m.scenery = items; return w; };
  let r = run(withScenery([{ model: "desk", x: -1, y: 0, rot: 0 }, { model: "desk", x: 18, y: 14, rot: 90 }]));
  assert.equal(r.code, 0, r.out);
  const bad = {
    "trong lưới": [{ model: "desk", x: 0, y: 0, rot: 0 }],
    "quá viền": [{ model: "desk", x: -13, y: 0, rot: 0 }],
    "model lạ": [{ model: "cay", x: -1, y: 0, rot: 0 }],
  };
  for (const [label, items] of Object.entries(bad)) {
    r = run(withScenery(items));
    assert.equal(r.code, 1, `${label}: ${r.out}`);
    assert.match(r.out, /mini\.json/, label);
  }
});
