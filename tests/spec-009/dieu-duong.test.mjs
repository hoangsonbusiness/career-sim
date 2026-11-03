// SPEC-009 — gói nghề Điều dưỡng.
import { test, before } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { playDay, readJson, root } from "../lib/play-day.mjs";

const ID = "dieu-duong";
const node = (args) => spawnSync(process.execPath, args, { cwd: root, encoding: "utf8" });
let build;

before(() => {
  build = spawnSync("npm run build", { cwd: root, encoding: "utf8", shell: true });
});

test("AC-009-01 hồ sơ Điều dưỡng qua validate", () => {
  const r = node([join(root, "scripts/validate.mjs"), join(root, `content/professions/${ID}.json`)]);
  assert.equal(r.status, 0, r.stdout + r.stderr);
});

test("AC-009-02 bản đồ Điều dưỡng qua validate:world", () => {
  const r = node([join(root, "scripts/validate-world.mjs"), join(root, `content/worlds/${ID}.json`)]);
  assert.equal(r.status, 0, r.stdout + r.stderr);
});

test("AC-009-03 gói Điều dưỡng đạt check:pack", () => {
  const r = node([join(root, "scripts/check-pack.mjs")]);
  assert.match(r.stdout, new RegExp(`✓ ${ID}\\b`), r.stdout + r.stderr);
});

test("AC-009-04 chơi hết ngày Điều dưỡng tới done", () => {
  assert.equal(playDay(ID), "done");
});

test("AC-009-05 có nguồn pháp luật có ngày hiệu lực, draft, có phạm vi áp dụng", () => {
  const p = readJson(`content/professions/${ID}.json`);
  assert.ok(p.sources.some((s) => s.type === "law" && s.effective_date), "thiếu nguồn law có effective_date");
  assert.equal(p.meta.status, "draft");
  assert.ok(p.meta.scope_note && p.meta.scope_note.trim().length > 0, "thiếu meta.scope_note");
});

test("AC-009-06 không có liều thuốc, nhiệt độ, huyết áp trong chữ của game", () => {
  const p = readJson(`content/professions/${ID}.json`);
  const texts = p.day_simulation.segments.flatMap((s) => [
    s.narrative,
    ...(s.task.options ?? []).map((o) => o.text),
    ...(s.task.turns ?? []).flatMap((t) => t.replies.map((r) => r.text)),
    ...(s.task.document ?? []),
  ]);
  const bad = texts.filter((t) => /\b\d+\s*(mg|ml)\b|\bviên\b|°C|mmHg/i.test(t));
  assert.deepEqual(bad, []);
});

test("AC-009-07 bản build có trang hồ sơ và trang màn chơi", () => {
  assert.equal(build.status, 0, (build.stdout + build.stderr).slice(-2000));
  const profile = join(root, `out/nghe/${ID}/index.html`);
  assert.ok(existsSync(profile));
  assert.ok(existsSync(join(root, `out/nghe/${ID}/mot-ngay/index.html`)));
  const name = readJson(`content/professions/${ID}.json`).name;
  const h1 = readFileSync(profile, "utf8").match(/<h1[^>]*>([\s\S]*?)<\/h1>/);
  assert.equal(h1?.[1].replace(/<[^>]*>/g, "").trim(), name);
});
