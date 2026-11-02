// SPEC-003 — kiểm tra bản build tĩnh. Mọi test dùng chung một lần `npm run build`.
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
let build;

before(() => {
  build = spawnSync("npm run build", { cwd: root, encoding: "utf8", shell: true });
});

function assertBuilt() {
  assert.equal(build.status, 0, (build.stdout + build.stderr).slice(-3000));
}

const html = (p) => readFileSync(join(out, p), "utf8");
const decode = (s) => s.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#x27;|&#39;/g, "'");
const text = (s) => decode(s.replace(/<[^>]*>/g, "")).trim();

function walk(dir) {
  return readdirSync(dir).flatMap((f) => { const p = join(dir, f); return statSync(p).isDirectory() ? walk(p) : [p]; });
}

test("AC-003-11 trang chủ: lang vi, mỗi nghề đúng một link /nghe/<id>/ theo thứ tự id", () => {
  assertBuilt();
  const page = html("index.html");
  assert.match(page, /<html lang="vi"/);
  const profs = loadProfessions();
  const positions = profs.map((p) => {
    const re = new RegExp(`<a[^>]*href="/nghe/${p.id}/"[^>]*>([\\s\\S]*?)</a>`, "g");
    const hits = [...page.matchAll(re)];
    assert.equal(hits.length, 1, `link cho ${p.id}`);
    assert.equal(text(hits[0][1]), p.name);
    return hits[0].index;
  });
  assert.deepEqual(positions, [...positions].sort((a, b) => a - b));
});

test("AC-003-12 trang nghề giáo viên THPT có đúng một h1 là tên nghề", () => {
  assertBuilt();
  const page = html("nghe/giao-vien-thpt/index.html");
  assert.match(page, /<html lang="vi"/);
  const h1 = [...page.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/g)];
  assert.equal(h1.length, 1);
  assert.equal(text(h1[0][1]), "Giáo viên Trung học phổ thông");
});

test("AC-003-13 sinh trang cho đúng tập id, không thừa không thiếu", () => {
  assertBuilt();
  const dirs = readdirSync(join(out, "nghe")).filter((d) => existsSync(join(out, "nghe", d, "index.html")));
  assert.deepEqual(new Set(dirs), new Set(loadProfessions().map((p) => p.id)));
});

test("AC-003-14 JS trên trình duyệt không tải file nội dung", () => {
  assertBuilt();
  const hits = walk(out).filter((f) => f.endsWith(".js") && readFileSync(f, "utf8").includes("content/professions"));
  assert.deepEqual(hits, []);
});

test("AC-003-15 tổng JS gzip của trang chủ ≤ 300 KB", () => {
  assertBuilt();
  const srcs = [...html("index.html").matchAll(/<script[^>]*\ssrc="([^"]+)"/g)].map((m) => m[1]);
  assert.ok(srcs.length > 0, "không tìm thấy script nào");
  const total = srcs.reduce((sum, src) => sum + gzipSync(readFileSync(join(out, src.replace(/^\//, ""))), { level: 9 }).length, 0);
  assert.ok(total <= 307200, `tổng gzip = ${total} byte`);
});
