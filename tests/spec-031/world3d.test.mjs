// SPEC-031 — scripts/validate-world3d.mjs. Fixture dựng trong thư mục tạm.
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

test("AC-031-08 thế giới 3D mẫu hợp lệ → exit 0", () => {
  const r = run(world3d());
  assert.equal(r.code, 0, r.out);
});

test("AC-031-09 các lỗi dữ liệu 3D → exit 1, có tên file", () => {
  const cases = {
    "thiếu map": [(w) => { delete w.maps.m; }],
    "thừa khóa NPC": [(w) => { w.npc_models.la = "npc"; }],
    "model không có": [(w) => { w.maps.m.props[0].model = "ghe"; }],
    "prop ngoài lưới": [(w) => { w.maps.m.props[0].x = 7; }],
    "blocks trên ô đi được": [(w) => { w.maps.m.props[0].y = 1; }],
    "decor đè lên target": [(w) => { w.maps.m.props[1] = { model: "desk", x: 1, y: 1, rot: 0, blocks: false }; }],
    "decor đè chỗ đứng đầu tiên": [(w) => { w.maps.m.props[1] = { model: "desk", x: 1, y: 0, rot: 0, blocks: false }; }],
    "region ngoài lưới": [(w) => { w.maps.m.floor.regions[0].w = 8; }],
    "GLB không tồn tại": [() => {}, { "public/game3d/kit/desk.glb": null }],
    "thiếu License": [() => {}, { "public/game3d/kit/License.txt": null }],
    "profession_id khác tên file": [(w) => { w.profession_id = "khac"; }],
  };
  for (const [label, [mutate, files]] of Object.entries(cases)) {
    const w = world3d();
    mutate(w);
    const r = run(w, files);
    assert.equal(r.code, 1, `${label}: ${r.out}`);
    assert.match(r.out, /mini\.json/, label);
  }
});

test("AC-031-10 thiếu hoạt cảnh Walk hoặc GLB quá 2 MB → exit 1", () => {
  let r = run(world3d(), { "public/game3d/kit/hero.glb": glb(["Idle"]) });
  assert.equal(r.code, 1, r.out);
  assert.match(r.out, /Walk/);
  r = run(world3d(), { "public/game3d/kit/desk.glb": glb([], 2097153) });
  assert.equal(r.code, 1, r.out);
  assert.match(r.out, /R-4/);
  r = run(world3d(), { "public/game3d/kit/desk.glb": glb([], 2097152) });
  assert.equal(r.code, 0, r.out);
});

test("AC-031-12 check chạy validate:world3d ngay sau validate:world; three ghim chính xác ≥ 0.187", () => {
  const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
  assert.match(pkg.scripts.check, /npm run validate:world && npm run validate:world3d && /);
  assert.equal(pkg.scripts["validate:world3d"], "node scripts/validate-world3d.mjs");
  const v = pkg.dependencies.three;
  assert.match(v, /^\d+\.\d+\.\d+$/);
  const [maj, min] = v.split(".").map(Number);
  assert.ok(maj > 0 || min >= 187, v);
});
