// SPEC-018 — gói nghề Giao dịch viên ngân hàng.
import { test, before } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { playDay, readJson, root } from "../lib/play-day.mjs";

const ID = "giao-dich-vien-ngan-hang";
const node = (args) => spawnSync(process.execPath, args, { cwd: root, encoding: "utf8" });
let build;

before(() => {
  build = spawnSync("npm run build", { cwd: root, encoding: "utf8", shell: true });
});

test("AC-018-01 hồ sơ Giao dịch viên ngân hàng qua validate", () => {
  const r = node([join(root, "scripts/validate.mjs"), join(root, `content/professions/${ID}.json`)]);
  assert.equal(r.status, 0, r.stdout + r.stderr);
});

test("AC-018-02 bản đồ Giao dịch viên ngân hàng qua validate:world và chỉ có một bản đồ", () => {
  const r = node([join(root, "scripts/validate-world.mjs"), join(root, `content/worlds/${ID}.json`)]);
  assert.equal(r.status, 0, r.stdout + r.stderr);
  const w = readJson(`content/worlds/${ID}.json`);
  assert.equal(w.maps.length, 1);
  assert.equal(w.maps[0].id, "chi-nhanh");
});

test("AC-018-03 gói Giao dịch viên ngân hàng đạt check:pack", () => {
  const r = node([join(root, "scripts/check-pack.mjs")]);
  assert.match(r.stdout, new RegExp(`✓ ${ID}\\b`), r.stdout + r.stderr);
});

test("AC-018-04 chơi hết ngày Giao dịch viên ngân hàng tới done", () => {
  assert.equal(playDay(ID), "done");
});

test("AC-018-05 có ≥ 2 nguồn law có effective_date và market có issued_date", () => {
  const p = readJson(`content/professions/${ID}.json`);
  assert.ok(p.sources.filter((s) => s.type === "law" && s.effective_date).length >= 2, "cần ≥ 2 nguồn law có effective_date");
  assert.ok(p.sources.some((s) => s.type === "market" && s.issued_date), "thiếu nguồn market có issued_date");
});

test("AC-018-06 phần 6 chia đúng 180 phút bằng time_budget", () => {
  const p = readJson(`content/professions/${ID}.json`);
  const seg = p.day_simulation.segments[5];
  assert.equal(seg.task.type, "time_budget");
  assert.equal(seg.task.budget_min, 180);
});

test("AC-018-07 phần 5 có lựa chọn vì khách hàng không bị trừ chinh_xac và nang_luong", () => {
  const p = readJson(`content/professions/${ID}.json`);
  const seg = p.day_simulation.segments[4];
  assert.equal(seg.task.type, "choice");
  assert.ok(seg.task.options.some((o) => (o.effect.chinh_xac ?? 0) >= 0 && (o.effect.nang_luong ?? 0) >= 0));
});

test("AC-018-08 bản build có trang hồ sơ và trang màn chơi", () => {
  assert.equal(build.status, 0, (build.stdout + build.stderr).slice(-2000));
  const profile = join(root, `out/nghe/${ID}/index.html`);
  assert.ok(existsSync(profile));
  assert.ok(existsSync(join(root, `out/nghe/${ID}/mot-ngay/index.html`)));
  const name = readJson(`content/professions/${ID}.json`).name;
  const h1 = readFileSync(profile, "utf8").match(/<h1[^>]*>([\s\S]*?)<\/h1>/);
  assert.equal(h1?.[1].replace(/<[^>]*>/g, "").trim(), name);
});
