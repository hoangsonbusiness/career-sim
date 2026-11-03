// SPEC-014 — vòng chơi "xem và nghe kể" (story.ts) và gỡ quiz khỏi game.
import { test, before } from "node:test";
import { spawnSync } from "node:child_process";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createStory, reduce } from "../../src/game/story.ts";
import { findPath, standSpots, step } from "../../src/game/grid.ts";
import { canInteract } from "../../src/game/quest.ts";
import { verifyLock } from "../../scripts/lib/lock.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");
const read = (p) => readFileSync(join(root, p), "utf8");
const json = (p) => JSON.parse(read(p));

const run = (total, questions, actions) => actions.reduce(reduce, createStory(total, questions));

test("AC-014-01 đạt toàn bộ conformance vectors", () => {
  for (const v of json("tests/spec-014/vectors.json")) {
    assert.deepEqual(run(v.total, v.questions, v.actions), v.expect, v.name);
  }
});

test("AC-014-02 createStory ném INVALID_STORY khi tham số sai", () => {
  for (const [t, q] of [[0, 1], [2, -1], [1.5, 0]]) {
    assert.throws(() => createStory(t, q), (e) => e.code === "INVALID_STORY", `${t},${q}`);
  }
});

test("AC-014-03 thao tác không có trong bảng trả về chính state cũ", () => {
  const s = createStory(3, 2);
  assert.equal(reduce(s, "continue"), s);
  const w = reduce(s, "start");
  assert.equal(w.mode, "walk");
  assert.equal(reduce(w, "start"), w);
});

test("AC-014-04 reduce không sửa state gốc", () => {
  const s = run(3, 0, ["start", "interact", "continue", "interact", "continue", "interact"]);
  assert.equal(s.mode, "scene");
  assert.equal(s.index, 2);
  const before = structuredClone(s);
  const r = reduce(s, "continue");
  assert.equal(r.mode, "done");
  assert.deepEqual(s, before);
});

test("AC-014-05 interact không thêm trùng vào seen", () => {
  const s = { mode: "walk", index: 1, total: 3, question: 0, questions: 0, seen: [0, 1] };
  const r = reduce(s, "interact");
  assert.equal(r.mode, "scene");
  assert.deepEqual(r.seen, [0, 1]);
});

test("AC-014-06 mọi gói sâu chơi trọn ngày bằng story.ts", () => {
  const ids = readdirSync(join(root, "content/worlds")).filter((f) => f.endsWith(".json")).map((f) => f.slice(0, -5));
  assert.ok(ids.length >= 6);
  for (const id of ids) {
    const prof = json(`content/professions/${id}.json`);
    const world = json(`content/worlds/${id}.json`);
    const segs = prof.day_simulation.segments;
    const maps = Object.fromEntries(world.maps.map((m) => [m.id, m]));
    let s = reduce(createStory(segs.length, (prof.day_simulation.reflection_questions ?? []).length), "start");
    let mapId = null, pos = null;
    while (s.mode !== "done") {
      if (s.mode === "walk") {
        const ws = world.segments[segs[s.index].id];
        const map = maps[ws.map];
        if (mapId !== ws.map) { mapId = ws.map; pos = { ...map.spawn }; }
        const npcs = world.npcs.filter((n) => n.map === mapId).map((n) => ({ x: n.x, y: n.y }));
        const spot = standSpots(map, ws.target, npcs).find((p) => findPath(map, pos, p.pos, npcs) !== null);
        assert.ok(spot, `${id}/${segs[s.index].id}: không tới được target`);
        for (const n of findPath(map, pos, spot.pos, npcs)) {
          const dir = n.x > pos.x ? "right" : n.x < pos.x ? "left" : n.y > pos.y ? "down" : "up";
          pos = step(map, pos, dir, npcs);
        }
        assert.ok(canInteract(pos, spot.face, ws.target));
        s = reduce(s, "interact");
      } else {
        s = reduce(s, "continue");
      }
    }
    assert.deepEqual(s.seen, segs.map((_, i) => i), id);
  }
});

function files(dir) {
  return readdirSync(join(root, dir)).flatMap((f) => {
    const p = `${dir}/${f}`;
    return statSync(join(root, p)).isDirectory() ? files(p) : [p];
  });
}

test("AC-014-07 game không gọi engine, controller hay mini-game", () => {
  for (const f of files("src/game").filter((p) => !p.startsWith("src/game/minigames/"))) {
    const src = read(f);
    for (const bad of ["createEngine", "src/engine", "sim/controller", "minigames/"]) {
      assert.ok(!src.includes(bad), `${f} chứa ${bad}`);
    }
  }
});

test("AC-014-08 GamePlayer không còn chữ chấm đúng/sai", () => {
  const src = read("src/game/GamePlayer.tsx");
  for (const bad of ["Chính xác", "Chưa đúng", "Làm lại", "❤️", "💧"]) {
    assert.ok(!src.includes(bad), bad);
  }
});

test("AC-014-09 GamePlayer có thẻ Ngoài đời thật và màn kết mới", () => {
  const src = read("src/game/GamePlayer.tsx");
  for (const s of ["Ngoài đời thật", "Đã kiểm chứng", "Một nguồn", "Cần kiểm chứng thêm", "Hết một ngày làm", "Về hồ sơ nghề", "Kenney.nl (CC0)"]) {
    assert.ok(src.includes(s), s);
  }
});

let build;
before(() => {
  build = spawnSync("npm run build", { cwd: root, encoding: "utf8", shell: true });
});

test("AC-014-10 trang một ngày của 6 nghề có nút bắt đầu, không nhúng Phaser", () => {
  assert.equal(build.status, 0, (build.stdout + build.stderr).slice(-3000));
  const ids = readdirSync(join(root, "content/worlds")).map((f) => f.slice(0, -5));
  assert.equal(ids.length, 6);
  for (const id of ids) {
    const html = read(`out/nghe/${id}/mot-ngay/index.html`);
    assert.ok(html.includes("Bắt đầu ngày làm việc"), id);
    for (const [, src] of html.matchAll(/<script[^>]*src="([^"]+)"/g)) {
      assert.ok(!read(`out${src}`).includes("Phaser"), `${id}: ${src}`);
    }
  }
});

test("AC-014-11 không file test đã khóa nào bị sửa", () => {
  for (const id of ["SPEC-002", "SPEC-005", "SPEC-006", "SPEC-007", "SPEC-008"]) {
    assert.deepEqual(verifyLock(id).violations, [], id);
  }
});
