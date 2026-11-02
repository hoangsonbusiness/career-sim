// SPEC-003 — lớp nạp nội dung src/content. Chỉ đọc file, không mock.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { loadProfessions, getProfession } from "../../src/content/index.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");
const fx = (name) => join(root, "tests/fixtures", name);

function expectContentError(fn, code, file) {
  assert.throws(fn, (err) => {
    assert.equal(err.code, code);
    assert.equal(err.file, file);
    return true;
  });
}

test("AC-003-01 nạp thư mục nội dung thật: đủ file, có giao-vien-thpt, id tăng dần", () => {
  const files = readdirSync(join(root, "content/professions")).filter((f) => f.endsWith(".json"));
  const ids = loadProfessions().map((p) => p.id);
  assert.equal(ids.length, files.length);
  assert.ok(ids.includes("giao-vien-thpt"));
  assert.deepEqual(ids, [...ids].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0)));
});

test("AC-003-02 sắp xếp theo id, không theo thứ tự đọc file", () => {
  assert.deepEqual(loadProfessions(fx("content-order")).map((p) => p.id), ["a", "b"]);
});

test("AC-003-03 tên file khác id → CONTENT_ID_MISMATCH", () => {
  expectContentError(() => loadProfessions(fx("content-mismatch")), "CONTENT_ID_MISMATCH", "x.json");
});

test("AC-003-04 JSON hỏng → CONTENT_PARSE_ERROR", () => {
  expectContentError(() => loadProfessions(fx("content-broken")), "CONTENT_PARSE_ERROR", "hong.json");
});

test("AC-003-05 bỏ qua file không phải .json, đuôi .JSON và thư mục con", () => {
  assert.deepEqual(loadProfessions(fx("content-ignored")), []);
});

test("AC-003-06 getProfession khớp chính xác id, phân biệt hoa thường", () => {
  const raw = JSON.parse(readFileSync(join(root, "content/professions/giao-vien-thpt.json"), "utf8"));
  assert.deepEqual(getProfession("giao-vien-thpt"), raw);
  assert.equal(getProfession("GIAO-VIEN-THPT"), null);
  assert.equal(getProfession("khong-co"), null);
});
