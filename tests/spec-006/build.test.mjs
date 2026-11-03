// SPEC-006 — bản build: Phaser tải lười, ngân sách JS game, asset có giấy phép.
import { test, before } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { gzipSync } from "node:zlib";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");
const out = join(root, "out");
let build;

before(() => {
  build = spawnSync("npm run build", { cwd: root, encoding: "utf8", shell: true });
});

function assertBuilt() {
  assert.equal(build.status, 0, (build.stdout + build.stderr).slice(-3000));
}

const walk = (dir) => readdirSync(dir).flatMap((f) => { const p = join(dir, f); return statSync(p).isDirectory() ? walk(p) : [p]; });
const isPhaser = (file) => readFileSync(file, "utf8").includes("Phaser");

test("AC-006-11 trang màn chơi có nút bắt đầu, script ban đầu không chứa Phaser", () => {
  assertBuilt();
  const page = readFileSync(join(out, "nghe/giao-vien-thpt/mot-ngay/index.html"), "utf8");
  assert.match(page, /<button[^>]*>Bắt đầu ngày làm việc<\/button>/);
  const srcs = [...page.matchAll(/<script[^>]*\ssrc="([^"]+)"/g)].map((m) => join(out, m[1].replace(/^\//, "")));
  assert.ok(srcs.length > 0);
  assert.deepEqual(srcs.filter(isPhaser), []);
});

test("AC-006-12 chunk Phaser tải lười ≤ 600 KB gzip", () => {
  assertBuilt();
  const chunks = walk(join(out, "_next")).filter((f) => f.endsWith(".js") && isPhaser(f));
  assert.ok(chunks.length > 0, "không tìm thấy chunk Phaser");
  const total = chunks.reduce((s, f) => s + gzipSync(readFileSync(f), { level: 9 }).length, 0);
  assert.ok(total <= 614400, `tổng gzip = ${total} byte`);
});

test("AC-006-13 ảnh tileset tồn tại và có giấy phép cho từng bộ asset", () => {
  const world = JSON.parse(readFileSync(join(root, "content/worlds/giao-vien-thpt.json"), "utf8"));
  for (const t of world.tilesets) assert.ok(existsSync(join(root, "public", t.image)), t.image);
  const dirs = new Set(world.tilesets.map((t) => dirname(join(root, "public", t.image))));
  for (const d of dirs) assert.ok(existsSync(join(d, "License.txt")), `thiếu License.txt trong ${d}`);
});
