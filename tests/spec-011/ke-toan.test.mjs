// SPEC-011 — gói nghề Kế toán.
import { test, before } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { playDay, readJson, root } from "../lib/play-day.mjs";

const ID = "ke-toan";
const node = (args) => spawnSync(process.execPath, args, { cwd: root, encoding: "utf8" });
let build;

before(() => {
  build = spawnSync("npm run build", { cwd: root, encoding: "utf8", shell: true });
});

test("AC-011-01 hồ sơ Kế toán qua validate", () => {
  const r = node([join(root, "scripts/validate.mjs"), join(root, `content/professions/${ID}.json`)]);
  assert.equal(r.status, 0, r.stdout + r.stderr);
});

test("AC-011-02 bản đồ Kế toán qua validate:world", () => {
  const r = node([join(root, "scripts/validate-world.mjs"), join(root, `content/worlds/${ID}.json`)]);
  assert.equal(r.status, 0, r.stdout + r.stderr);
});

test("AC-011-03 gói Kế toán đạt check:pack", () => {
  const r = node([join(root, "scripts/check-pack.mjs")]);
  assert.match(r.stdout, new RegExp(`✓ ${ID}\\b`), r.stdout + r.stderr);
});

test("AC-011-04 chơi hết ngày Kế toán tới done", () => {
  assert.equal(playDay(ID), "done");
});

test("AC-011-05 có ≥ 2 nguồn law có effective_date", () => {
  const p = readJson(`content/professions/${ID}.json`);
  const law = p.sources.filter((s) => s.type === "law" && s.effective_date);
  assert.ok(law.length >= 2, `có ${law.length} nguồn law có effective_date`);
});

test("AC-011-06 phần 4 có lựa chọn làm Độ chính xác giảm", () => {
  const p = readJson(`content/professions/${ID}.json`);
  const seg = p.day_simulation.segments[3];
  assert.equal(seg.task.type, "choice");
  assert.ok(seg.task.options.some((o) => (o.effect.chinh_xac ?? 0) < 0));
});

test("AC-011-07 mã số trong hóa đơn spot_error chỉ gồm chữ số 0", () => {
  const p = readJson(`content/professions/${ID}.json`);
  const seg = p.day_simulation.segments.find((s) => s.task.type === "spot_error");
  assert.ok(seg, "không có segment spot_error");
  for (const line of seg.task.document) {
    for (const m of line.match(/(?<!\d)(\d{13}|\d{10})(?!\d)/g) ?? []) assert.match(m, /^0+$/, line);
  }
});

test("AC-011-08 bản build có trang hồ sơ và trang màn chơi", () => {
  assert.equal(build.status, 0, (build.stdout + build.stderr).slice(-2000));
  const profile = join(root, `out/nghe/${ID}/index.html`);
  assert.ok(existsSync(profile));
  assert.ok(existsSync(join(root, `out/nghe/${ID}/mot-ngay/index.html`)));
  const name = readJson(`content/professions/${ID}.json`).name;
  const h1 = readFileSync(profile, "utf8").match(/<h1[^>]*>([\s\S]*?)<\/h1>/);
  assert.equal(h1?.[1].replace(/<[^>]*>/g, "").trim(), name);
});
