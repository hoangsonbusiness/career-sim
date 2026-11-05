// SPEC-031 — bản build: Three.js tải lười, tách khỏi Phaser, ngân sách JS 3D.
import { test, before } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { gzipSync } from "node:zlib";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");
const out = join(root, "out");
let build;
before(() => { build = spawnSync("npm run build", { cwd: root, encoding: "utf8", shell: true }); });
const assertBuilt = () => assert.equal(build.status, 0, (build.stdout + build.stderr).slice(-3000));
const walk = (dir) => readdirSync(dir).flatMap((f) => { const p = join(dir, f); return statSync(p).isDirectory() ? walk(p) : [p]; });
const has = (file, s) => readFileSync(file, "utf8").includes(s);
const jsChunks = () => walk(join(out, "_next")).filter((f) => f.endsWith(".js"));
// Chunk của src/game3d nhận diện qua mã lỗi chỉ có trong scene3d.ts.
const is3d = (f) => has(f, "__THREE__") || has(f, "RENDER_3D_FAILED");

test("AC-031-13 HTML trang một ngày và script ban đầu không chứa Three.js", () => {
  assertBuilt();
  const page = readFileSync(join(out, "nghe/giao-vien-thpt/mot-ngay/index.html"), "utf8");
  assert.ok(!page.includes("__THREE__"));
  const srcs = [...page.matchAll(/<script[^>]*\ssrc="([^"]+)"/g)].map((m) => join(out, m[1].replace(/^\//, "")));
  assert.ok(srcs.length > 0);
  assert.deepEqual(srcs.filter((f) => has(f, "__THREE__")), []);
});

test("AC-031-14 JS tải lười của đường 3D ≤ 700 KB gzip", () => {
  assertBuilt();
  const chunks = jsChunks().filter(is3d);
  assert.ok(chunks.some((f) => has(f, "__THREE__")), "không tìm thấy chunk Three.js");
  const total = chunks.reduce((s, f) => s + gzipSync(readFileSync(f), { level: 9 }).length, 0);
  assert.ok(total <= 716800, `tổng gzip = ${total} byte`);
});

test("AC-031-15 không chunk nào chứa cả Three.js và Phaser", () => {
  assertBuilt();
  const both = jsChunks().filter((f) => has(f, "__THREE__") && has(f, "Phaser"));
  assert.deepEqual(both, []);
});
