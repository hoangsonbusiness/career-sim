// SPEC-007 — bản build có đủ 6 hoạt cảnh, chunk game vẫn trong ngân sách.
import { test, before } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { gzipSync } from "node:zlib";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");
let build;

before(() => {
  build = spawnSync("npm run build", { cwd: root, encoding: "utf8", shell: true });
});

const walk = (dir) => readdirSync(dir).flatMap((f) => { const p = join(dir, f); return statSync(p).isDirectory() ? walk(p) : [p]; });
const jsFiles = () => walk(join(root, "out/_next")).filter((f) => f.endsWith(".js"));

test("AC-007-09 bản build có đủ 6 hoạt cảnh", () => {
  assert.equal(build.status, 0, (build.stdout + build.stderr).slice(-3000));
  const all = jsFiles().map((f) => readFileSync(f, "utf8")).join("\n");
  for (const kind of ["sequence", "choice", "drag_sort", "spot_error", "dialogue", "time_budget"]) {
    assert.ok(new RegExp(`data-minigame["':,\\s]+["']?${kind}`).test(all) || all.includes(`"data-minigame":"${kind}"`), `thiếu hoạt cảnh ${kind}`);
  }
});

test("AC-007-10 chunk game (Phaser) vẫn ≤ 600 KB gzip", () => {
  assert.equal(build.status, 0);
  const chunks = jsFiles().filter((f) => readFileSync(f, "utf8").includes("Phaser"));
  assert.ok(chunks.length > 0);
  const total = chunks.reduce((s, f) => s + gzipSync(readFileSync(f), { level: 9 }).length, 0);
  assert.ok(total <= 614400, `tổng gzip = ${total} byte`);
});
