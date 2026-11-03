// SPEC-006 — scripts/validate-world.mjs và file thế giới thật. Fixture dựng trong thư mục tạm.
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, cpSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { deflateSync } from "node:zlib";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");
const SCRIPT = join(root, "scripts/validate-world.mjs");
const miniProf = JSON.parse(readFileSync(join(root, "tests/fixtures/mini-profession.json"), "utf8"));

/** PNG RGBA trong suốt kích thước w×h (đủ cho validator đọc IHDR). */
function png(w, h) {
  const crcTable = Array.from({ length: 256 }, (_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
  const crc = (buf) => { let c = 0xffffffff; for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
  const chunk = (type, data) => {
    const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
    const td = Buffer.concat([Buffer.from(type), data]);
    const c = Buffer.alloc(4); c.writeUInt32BE(crc(td));
    return Buffer.concat([len, td, c]);
  };
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 6;
  const raw = Buffer.alloc((w * 4 + 1) * h);
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk("IHDR", ihdr), chunk("IDAT", deflateSync(raw)), chunk("IEND", Buffer.alloc(0))]);
}

/** Thế giới hợp lệ cho fixture mini-profession: bản đồ 7×3 trống, mỗi segment một target ở hàng giữa. */
function miniWorld() {
  const W = 7, H = 3, N = W * H;
  const ids = miniProf.day_simulation.segments.map((s) => s.id);
  return {
    profession_id: "mini",
    tile_size: 16,
    tilesets: [{ key: "t", image: "game/t.png", columns: 2, spacing: 1 }],
    maps: [{ id: "m", width: W, height: H, layers: [{ name: "floor", data: Array(N).fill("t:0") }], solid: Array(N).fill(0), spawn: { x: 0, y: 0 } }],
    npcs: [{ id: "n", map: "m", x: 6, y: 2, name: "NPC", sprite: ["t:1"] }],
    player_sprite: ["t:2"],
    segments: Object.fromEntries(ids.map((id, i) => [id, { map: "m", target: { x: i, y: 1 }, quest: `Việc ${i}` }])),
  };
}

/** Dựng thư mục tạm: worlds/mini.json, professions/mini.json, public/game/t.png (2×2 ô). */
function setup(world) {
  const dir = mkdtempSync(join(tmpdir(), "spec006-"));
  mkdirSync(join(dir, "worlds")); mkdirSync(join(dir, "professions")); mkdirSync(join(dir, "public/game"), { recursive: true });
  writeFileSync(join(dir, "worlds/mini.json"), JSON.stringify(world));
  writeFileSync(join(dir, "professions/mini.json"), JSON.stringify(miniProf));
  writeFileSync(join(dir, "public/game/t.png"), png(33, 33));
  return dir;
}

function run(world) {
  const dir = setup(world);
  const r = spawnSync(process.execPath, [SCRIPT, join(dir, "worlds/mini.json"), "--professions", join(dir, "professions"), "--public", join(dir, "public")], { encoding: "utf8" });
  return { code: r.status, out: r.stdout + r.stderr };
}

test("AC-006-06 thế giới mẫu hợp lệ → exit 0", () => {
  const r = run(miniWorld());
  assert.equal(r.code, 0, r.out);
});

test("AC-006-07 các lỗi cấu trúc → exit 1, có tên file", () => {
  const cases = {
    "thiếu segment": (w) => { delete w.segments.tbd; },
    "thừa khóa lạ": (w) => { w.segments.la = { map: "m", target: { x: 6, y: 1 }, quest: "Lạ" }; },
    "quest 61 ký tự": (w) => { w.segments.seq.quest = "x".repeat(61); },
    "ô ngoài tileset": (w) => { w.maps[0].layers[0].data[0] = "t:99999"; },
    "solid sai độ dài": (w) => { w.maps[0].solid.pop(); },
  };
  for (const [label, mutate] of Object.entries(cases)) {
    const w = miniWorld();
    mutate(w);
    const r = run(w);
    assert.equal(r.code, 1, `${label}: ${r.out}`);
    assert.match(r.out, /mini\.json/, label);
  }
});

test("AC-006-08 target bị tường bao kín → exit 1", () => {
  const w = miniWorld();
  // target của "seq" ở (0,1): chặn (0,0) và (1,1) và (0,2)
  for (const [x, y] of [[0, 0], [1, 1], [0, 2]]) w.maps[0].solid[y * 7 + x] = 1;
  w.maps[0].spawn = { x: 6, y: 0 };
  w.segments.cho.target = { x: 3, y: 1 };
  const r = run(w);
  assert.equal(r.code, 1, r.out);
  assert.match(r.out, /mini\.json/);
  assert.match(r.out, /R-4/);
});

test("AC-006-09 thế giới giáo viên THPT hợp lệ và đủ 7 segment", () => {
  const r = spawnSync(process.execPath, [SCRIPT], { cwd: root, encoding: "utf8" });
  assert.equal(r.status, 0, r.stdout + r.stderr);
  const w = JSON.parse(readFileSync(join(root, "content/worlds/giao-vien-thpt.json"), "utf8"));
  assert.equal(Object.keys(w.segments).length, 7);
});

test("AC-006-10 check chạy validate:world ngay sau validate", () => {
  const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
  assert.match(pkg.scripts.check, /^npm run validate && npm run validate:world && /);
  assert.equal(pkg.scripts["validate:world"], "node scripts/validate-world.mjs");
});
