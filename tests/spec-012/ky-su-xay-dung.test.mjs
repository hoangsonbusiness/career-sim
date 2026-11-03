// SPEC-012 — gói nghề Kỹ sư xây dựng.
import { test, before } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { playDay, readJson, root } from "../lib/play-day.mjs";

const ID = "ky-su-xay-dung";
const node = (args) => spawnSync(process.execPath, args, { cwd: root, encoding: "utf8" });
let build;

before(() => {
  build = spawnSync("npm run build", { cwd: root, encoding: "utf8", shell: true });
});

test("AC-012-01 hồ sơ Kỹ sư xây dựng qua validate", () => {
  const r = node([join(root, "scripts/validate.mjs"), join(root, `content/professions/${ID}.json`)]);
  assert.equal(r.status, 0, r.stdout + r.stderr);
});

test("AC-012-02 bản đồ Kỹ sư xây dựng qua validate:world", () => {
  const r = node([join(root, "scripts/validate-world.mjs"), join(root, `content/worlds/${ID}.json`)]);
  assert.equal(r.status, 0, r.stdout + r.stderr);
});

test("AC-012-03 gói Kỹ sư xây dựng đạt check:pack", () => {
  const r = node([join(root, "scripts/check-pack.mjs")]);
  assert.match(r.stdout, new RegExp(`✓ ${ID}\\b`), r.stdout + r.stderr);
});

test("AC-012-04 chơi hết ngày Kỹ sư xây dựng tới done", () => {
  assert.equal(playDay(ID), "done");
});

test("AC-012-05 có ≥ 2 nguồn law có effective_date", () => {
  const p = readJson(`content/professions/${ID}.json`);
  const law = p.sources.filter((s) => s.type === "law" && s.effective_date);
  assert.ok(law.length >= 2, `có ${law.length} nguồn law có effective_date`);
});

test("AC-012-06 phần 3 có lựa chọn làm an toàn giảm", () => {
  const p = readJson(`content/professions/${ID}.json`);
  const seg = p.day_simulation.segments[2];
  assert.equal(seg.task.type, "choice");
  assert.ok(seg.task.options.some((o) => (o.effect.an_toan ?? 0) < 0));
});

test("AC-012-07 mọi tileset của gói có License.txt cùng thư mục", () => {
  const w = readJson(`content/worlds/${ID}.json`);
  for (const ts of w.tilesets) {
    const dir = dirname(join(root, "public", ts.image));
    assert.ok(existsSync(join(dir, "License.txt")), `thiếu License.txt cho ${ts.image}`);
  }
});

test("AC-012-08 bản build có trang hồ sơ và trang màn chơi", () => {
  assert.equal(build.status, 0, (build.stdout + build.stderr).slice(-2000));
  const profile = join(root, `out/nghe/${ID}/index.html`);
  assert.ok(existsSync(profile));
  assert.ok(existsSync(join(root, `out/nghe/${ID}/mot-ngay/index.html`)));
  const name = readJson(`content/professions/${ID}.json`).name;
  const h1 = readFileSync(profile, "utf8").match(/<h1[^>]*>([\s\S]*?)<\/h1>/);
  assert.equal(h1?.[1].replace(/<[^>]*>/g, "").trim(), name);
});
