// SPEC-005 — HTML trang màn chơi trong bản build (chỉ phase intro; các phase sau chạy trên trình duyệt).
import { test, before } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { gzipSync } from "node:zlib";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { loadProfessions } from "../../src/content/index.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");
const out = join(root, "out");
const PAGE = "nghe/giao-vien-thpt/mot-ngay/index.html";
let build;

before(() => {
  build = spawnSync("npm run build", { cwd: root, encoding: "utf8", shell: true });
});

function assertBuilt() {
  assert.equal(build.status, 0, (build.stdout + build.stderr).slice(-3000));
}

const text = (s) => s.replace(/<!--.*?-->/g, "").replace(/<[^>]*>/g, "").trim();
const walk = (dir) => readdirSync(dir).flatMap((f) => { const p = join(dir, f); return statSync(p).isDirectory() ? walk(p) : [p]; });

test("AC-005-14 sinh trang màn chơi cho đúng các nghề có day_simulation", () => {
  assertBuilt();
  const dirs = readdirSync(join(out, "nghe")).filter((d) => existsSync(join(out, "nghe", d, "mot-ngay/index.html")));
  assert.deepEqual(new Set(dirs), new Set(loadProfessions().filter((p) => p.day_simulation).map((p) => p.id)));
  const page = readFileSync(join(out, PAGE), "utf8");
  assert.match(page, /<html lang="vi"/);
  const h1 = [...page.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/g)];
  assert.equal(h1.length, 1);
  assert.equal(text(h1[0][1]), "Một ngày làm Giáo viên Trung học phổ thông");
  assert.match(page, /<button[^>]*>Bắt đầu ngày làm việc<\/button>/);
});

test("AC-005-15 JS không chứa đường dẫn nội dung", () => {
  assertBuilt();
  const hits = walk(out).filter((f) => f.endsWith(".js") && readFileSync(f, "utf8").includes("content/professions"));
  assert.deepEqual(hits, []);
});

test("AC-005-16 tổng JS gzip trang màn chơi ≤ 300 KB", () => {
  assertBuilt();
  const srcs = [...readFileSync(join(out, PAGE), "utf8").matchAll(/<script[^>]*\ssrc="([^"]+)"/g)].map((m) => m[1]);
  assert.ok(srcs.length > 0);
  const total = srcs.reduce((s, src) => s + gzipSync(readFileSync(join(out, src.replace(/^\//, ""))), { level: 9 }).length, 0);
  assert.ok(total <= 307200, `tổng gzip = ${total} byte`);
});
