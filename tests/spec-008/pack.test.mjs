// SPEC-008 — scripts/check-pack.mjs. Mỗi test làm hỏng đúng một quy tắc của một gói hợp lệ dựng trong thư mục tạm.
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, copyFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");
const SCRIPT = join(root, "scripts/check-pack.mjs");
const mini = JSON.parse(readFileSync(join(root, "tests/fixtures/mini-profession.json"), "utf8"));
const basis = (ids) => ({ kind: "fact", text: "Căn cứ thử.", source_ids: ids, confidence: "single_source" });

/** Nghề hợp lệ theo SPEC-008: 7 segment, 5 loại task, 3 stats, 2 testimony khác publisher được basis dùng. */
function goodProfession() {
  const sim = structuredClone(mini.day_simulation);
  sim.stats.push({ id: "c", label: "C", initial: 50 });
  sim.segments.push({
    id: "cho2", time: "21:00", title: "choice 2", narrative: "-", basis: basis(["T2"]),
    task: { type: "choice", prompt: "-", options: [{ text: "o", effect: { c: 1 }, feedback: "f" }] },
  });
  sim.segments[0].basis = basis(["T1"]);
  return {
    id: "mini",
    sources: [
      { id: "T1", type: "testimony", title: "Chia sẻ 1", publisher: "Báo A", url: "https://example.com/1", accessed: "2026-11-03" },
      { id: "T2", type: "testimony", title: "Chia sẻ 2", publisher: "Báo B", url: "https://example.com/2", accessed: "2026-11-03" },
    ],
    day_simulation: sim,
    meta: { status: "draft" },
  };
}

/** Bản đồ 7×3 trống, mỗi segment một target ở hàng giữa. */
function goodWorld(prof) {
  const W = 8, H = 3, N = W * H;
  return {
    profession_id: "mini", tile_size: 16,
    tilesets: [{ key: "base", image: "game/base/base.png", columns: 7, spacing: 1 }],
    maps: [{ id: "m", width: W, height: H, layers: [{ name: "floor", data: Array(N).fill("base:0") }], solid: Array(N).fill(0), spawn: { x: 0, y: 0 } }],
    npcs: [], player_sprite: ["base:0"],
    segments: Object.fromEntries(prof.day_simulation.segments.map((s, i) => [s.id, { map: "m", target: { x: i, y: 1 }, quest: `Việc ${i}` }])),
  };
}

function run(mutate = () => {}, mutateWorld = () => {}) {
  const prof = goodProfession();
  mutate(prof);
  const world = goodWorld(prof);
  mutateWorld(world);
  const dir = mkdtempSync(join(tmpdir(), "spec008-"));
  for (const d of ["professions", "worlds", "public/game/base"]) mkdirSync(join(dir, d), { recursive: true });
  writeFileSync(join(dir, "professions/mini.json"), JSON.stringify(prof));
  writeFileSync(join(dir, "worlds/mini.json"), JSON.stringify(world));
  copyFileSync(join(root, "public/game/base/base.png"), join(dir, "public/game/base/base.png"));
  const r = spawnSync(process.execPath, [SCRIPT, "--professions", join(dir, "professions"), "--worlds", join(dir, "worlds"), "--public", join(dir, "public")], { encoding: "utf8" });
  return { code: r.status, out: r.stdout + r.stderr };
}

function expectRule(rule, cases) {
  for (const [label, mutate, mutateWorld] of cases) {
    const r = run(mutate, mutateWorld);
    assert.equal(r.code, 1, `${label}: ${r.out}`);
    assert.match(r.out, new RegExp(`${rule}\\b`), `${label}: ${r.out}`);
  }
}

const seg = (p, id) => p.day_simulation.segments.find((s) => s.id === id);

test("AC-008-01 gói hợp lệ → exit 0", () => {
  const r = run();
  assert.equal(r.code, 0, r.out);
  assert.match(r.out, /✓ mini/);
});

test("AC-008-02 không đủ 7 segment → R-1", () => {
  expectRule("R-1", [["6 segment", (p) => { p.day_simulation.segments.pop(); }, (w) => { delete w.segments.cho2; }]]);
});

test("AC-008-03 ít loại task hoặc một loại quá 2 lần → R-2", () => {
  const toChoice = (s) => { s.task = { type: "choice", prompt: "-", options: [{ text: "o", effect: { a: 1 }, feedback: "f" }] }; };
  expectRule("R-2", [
    ["3 loại", (p) => { ["drg", "spt", "dlg"].forEach((id) => toChoice(seg(p, id))); }],
    ["choice 3 lần", (p) => { toChoice(seg(p, "drg")); }],
  ]);
});

test("AC-008-04 vượt giới hạn chữ → R-3", () => {
  const x = (n) => "x".repeat(n);
  expectRule("R-3", [
    ["narrative 141", (p) => { seg(p, "seq").narrative = x(141); }],
    ["prompt 81", (p) => { seg(p, "seq").task.prompt = x(81); }],
    ["option 91", (p) => { seg(p, "cho").task.options[0].text = x(91); }],
    ["step 71", (p) => { const t = seg(p, "seq").task; t.steps[0] = x(71); }],
    ["item 81", (p) => { seg(p, "drg").task.items[0].text = x(81); }],
    ["activity 31", (p) => { seg(p, "tbd").task.activities[0].label = x(31); }],
    ["feedback 121", (p) => { seg(p, "cho").task.options[0].feedback = x(121); }],
  ]);
});

test("AC-008-05 stats không đúng 3 hoặc label dài → R-4", () => {
  expectRule("R-4", [
    ["2 stats", (p) => { p.day_simulation.stats.pop(); }],
    ["label 19", (p) => { p.day_simulation.stats[0].label = "x".repeat(19); }],
  ]);
});

test("AC-008-06 thiếu testimony, trùng publisher, testimony không được dùng → R-5", () => {
  expectRule("R-5", [
    ["1 testimony", (p) => { p.sources.pop(); seg(p, "cho2").basis = basis(["T1"]); }],
    ["cùng publisher", (p) => { p.sources[1].publisher = "Báo A"; }],
    ["không được dùng", (p) => { seg(p, "cho2").basis = basis(["T1"]); }],
  ]);
});

test("AC-008-07 reviewed thiếu reviewed_by → chỉ cảnh báo, exit 0", () => {
  const r = run((p) => { p.meta.status = "reviewed"; });
  assert.equal(r.code, 0, r.out);
  assert.match(r.out, /cảnh báo/i);
});

test("AC-008-08 bản đồ có target bị bao kín → R-7", () => {
  expectRule("R-7", [["target kín", () => {}, (w) => {
    const m = w.maps[0];
    for (const [x, y] of [[0, 0], [1, 1], [0, 2]]) m.solid[y * m.width + x] = 1;
    m.spawn = { x: 7, y: 0 };
    w.segments.cho.target = { x: 7, y: 2 };
  }]]);
});

test("AC-008-09 check chạy check:pack ngay sau validate:world", () => {
  const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
  assert.match(pkg.scripts.check, /npm run validate:world && npm run check:pack && /);
  assert.equal(pkg.scripts["check:pack"], "node scripts/check-pack.mjs");
});

test("AC-008-11 nội dung thật đạt chuẩn gói sâu", () => {
  const r = spawnSync(process.execPath, [SCRIPT], { cwd: root, encoding: "utf8" });
  assert.equal(r.status, 0, r.stdout + r.stderr);
});
