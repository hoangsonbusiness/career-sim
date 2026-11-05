// SPEC-031 — dữ liệu thật: thế giới 3D giáo viên THPT, asset, font, theme, hợp đồng GameHandle, chơi hết ngày.
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { findPath, standSpots, step } from "../../src/game/grid.ts";
import { canInteract } from "../../src/game/quest.ts";
import { createStory, reduce } from "../../src/game/story.ts";
import { rotateDir } from "../../src/game3d/layout.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");
const read = (p) => readFileSync(join(root, p), "utf8");
const json = (p) => JSON.parse(read(p));
const DIRS = ["up", "right", "down", "left"];

test("AC-031-11 thế giới 3D giáo viên THPT hợp lệ, phủ đủ map và NPC", () => {
  const r = spawnSync(process.execPath, [join(root, "scripts/validate-world3d.mjs")], { cwd: root, encoding: "utf8" });
  assert.equal(r.status, 0, r.stdout + r.stderr);
  const w2 = json("content/worlds/giao-vien-thpt.json");
  const w3 = json("content/worlds3d/giao-vien-thpt.json");
  assert.deepEqual(Object.keys(w3.maps).sort(), w2.maps.map((m) => m.id).sort());
  assert.deepEqual(Object.keys(w3.npc_models).sort(), w2.npcs.map((n) => n.id).sort());
});

test("AC-031-16 theme HUD: 7 biến, font Lora tự host", () => {
  const css = read("src/app/globals.css");
  const vars = {
    "--hud-bg": "rgba(59, 42, 31, 0.92)", "--hud-border": "#c9a45c", "--hud-text": "#f5ead6", "--hud-muted": "#cbb89a",
    "--hud-accent": "#f2c14e", "--hud-radius": "10px", "--hud-font": `"Lora", "Palatino Linotype", Georgia, serif`,
  };
  for (const [k, v] of Object.entries(vars)) assert.ok(css.includes(`${k}: ${v};`), `${k}: ${v}`);
  const faces = [...css.matchAll(/@font-face\s*{[^}]*}/g)].map((m) => m[0]);
  const lora = faces.filter((f) => /font-family:\s*"Lora"/.test(f));
  assert.ok(lora.length >= 2, "thiếu @font-face Lora");
  for (const f of lora) {
    assert.match(f, /font-display:\s*swap/);
    assert.doesNotMatch(f, /https?:/);
  }
  for (const f of ["Lora-Regular.woff2", "Lora-Bold.woff2", "OFL.txt"]) assert.ok(existsSync(join(root, "public/fonts", f)), f);
});

test("AC-031-17 mọi model và license tồn tại; mỗi bộ asset có License.txt", () => {
  const dir = join(root, "content/worlds3d");
  for (const f of readdirSync(dir).filter((x) => x.endsWith(".json"))) {
    const w = JSON.parse(readFileSync(join(dir, f), "utf8"));
    for (const m of Object.values(w.models)) {
      assert.ok(existsSync(join(root, "public", m.file)), m.file);
      assert.ok(existsSync(join(root, "public", m.license)), m.license);
    }
  }
  for (const d of readdirSync(join(root, "public/game3d"))) assert.ok(existsSync(join(root, "public/game3d", d, "License.txt")), d);
});

test("AC-031-18 mountGame3D trả về Promise<GameHandle> import từ src/game/scene", () => {
  const src = read("src/game3d/scene3d.ts");
  assert.match(src, /import type \{[^}]*\bGameHandle\b[^}]*\} from "\.\.\/game\/scene"/);
  assert.match(src, /export async function mountGame3D\([^)]*\): Promise<GameHandle>/);
  assert.doesNotMatch(src, /interface GameHandle/);
  const r = spawnSync("npx tsc --noEmit", { cwd: root, encoding: "utf8", shell: true });
  assert.equal(r.status, 0, (r.stdout + r.stderr).slice(-2000));
});

test("AC-031-19 chơi hết ngày giáo viên với camera q = 0..3, phím đổi theo rotateDir", () => {
  const prof = json("content/professions/giao-vien-thpt.json");
  const world = json("content/worlds/giao-vien-thpt.json");
  const maps = Object.fromEntries(world.maps.map((m) => [m.id, m]));
  const segs = prof.day_simulation.segments;
  for (const q of [0, 1, 2, 3]) {
    let s = reduce(createStory(segs.length, (prof.day_simulation.reflection_questions ?? []).length), "start");
    let mapId = null, pos = null;
    for (const seg of segs) {
      assert.equal(s.mode, "walk", `q=${q} ${seg.id}`);
      const ws = world.segments[seg.id];
      const map = maps[ws.map];
      if (mapId !== ws.map) { mapId = ws.map; pos = { ...map.spawn }; }
      const npcs = world.npcs.filter((n) => n.map === mapId).map((n) => ({ x: n.x, y: n.y }));
      const spot = standSpots(map, ws.target, npcs).find((x) => findPath(map, pos, x.pos, npcs) !== null);
      assert.ok(spot, `q=${q} ${seg.id}`);
      for (const next of findPath(map, pos, spot.pos, npcs)) {
        const want = next.x > pos.x ? "right" : next.x < pos.x ? "left" : next.y > pos.y ? "down" : "up";
        // Người chơi bấm phím k sao cho rotateDir(k, q) đúng hướng cần đi trên lưới.
        const key = DIRS.find((k) => rotateDir(k, q) === want);
        pos = step(map, pos, rotateDir(key, q), npcs);
        assert.deepEqual(pos, next, `q=${q} ${seg.id}: bước bị chặn`);
      }
      assert.equal(canInteract(pos, spot.face, ws.target), true);
      s = reduce(s, "interact");
      s = reduce(s, "continue");
    }
    while (s.mode === "reflection") s = reduce(s, "continue");
    assert.equal(s.mode, "done", `q=${q}`);
  }
});
