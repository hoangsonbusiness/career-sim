// SPEC-010 — gói nghề Lập trình viên.
import { test, before } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { playDay, readJson, root } from "../lib/play-day.mjs";

const ID = "lap-trinh-vien";
const node = (args) => spawnSync(process.execPath, args, { cwd: root, encoding: "utf8" });
let build;

before(() => {
  build = spawnSync("npm run build", { cwd: root, encoding: "utf8", shell: true });
});

test("AC-010-01 hồ sơ Lập trình viên qua validate", () => {
  const r = node([join(root, "scripts/validate.mjs"), join(root, `content/professions/${ID}.json`)]);
  assert.equal(r.status, 0, r.stdout + r.stderr);
});

test("AC-010-02 bản đồ Lập trình viên qua validate:world", () => {
  const r = node([join(root, "scripts/validate-world.mjs"), join(root, `content/worlds/${ID}.json`)]);
  assert.equal(r.status, 0, r.stdout + r.stderr);
});

test("AC-010-03 gói Lập trình viên đạt check:pack", () => {
  const r = node([join(root, "scripts/check-pack.mjs")]);
  assert.match(r.stdout, new RegExp(`✓ ${ID}\\b`), r.stdout + r.stderr);
});

test("AC-010-04 chơi hết ngày Lập trình viên tới done", () => {
  assert.equal(playDay(ID), "done");
});

test("AC-010-05 có ≥ 2 nguồn thị trường từ 2 nơi phát hành, mỗi nguồn có ngày phát hành", () => {
  const p = readJson(`content/professions/${ID}.json`);
  const market = p.sources.filter((s) => s.type === "market");
  assert.ok(market.length >= 2, `có ${market.length} nguồn market`);
  assert.ok(new Set(market.map((s) => s.publisher)).size >= 2, "các nguồn market phải từ ≥ 2 publisher");
  for (const s of market) assert.ok(s.issued_date, `${s.id} thiếu issued_date`);
});

test("AC-010-06 review code dùng mã giả: dòng ≤ 70 ký tự, không có { } ;", () => {
  const p = readJson(`content/professions/${ID}.json`);
  const seg = p.day_simulation.segments.find((s) => s.task.type === "spot_error");
  assert.ok(seg, "không có segment spot_error");
  for (const line of seg.task.document) {
    assert.ok(Array.from(line).length <= 70, line);
    assert.doesNotMatch(line, /[{};]/, line);
  }
});

test("AC-010-07 bản build có trang hồ sơ và trang màn chơi", () => {
  assert.equal(build.status, 0, (build.stdout + build.stderr).slice(-2000));
  const profile = join(root, `out/nghe/${ID}/index.html`);
  assert.ok(existsSync(profile));
  assert.ok(existsSync(join(root, `out/nghe/${ID}/mot-ngay/index.html`)));
  const name = readJson(`content/professions/${ID}.json`).name;
  const h1 = readFileSync(profile, "utf8").match(/<h1[^>]*>([\s\S]*?)<\/h1>/);
  assert.equal(h1?.[1].replace(/<[^>]*>/g, "").trim(), name);
});

