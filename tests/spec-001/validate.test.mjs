// SPEC-001 — integration tests cho scripts/validate.mjs
// Mỗi test làm hỏng đúng MỘT chỗ trong file mẫu, theo đúng một AC.
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");
const SAMPLE = join(root, "content/professions/giao-vien-thpt.json");
const tmp = mkdtempSync(join(tmpdir(), "spec001-"));

const sample = () => JSON.parse(readFileSync(SAMPLE, "utf8"));

function run(data, name = "case") {
  const file = join(tmp, `${name}.json`);
  writeFileSync(file, typeof data === "string" ? data : JSON.stringify(data));
  const r = spawnSync(process.execPath, [join(root, "scripts/validate.mjs"), file], { encoding: "utf8" });
  return { code: r.status, out: r.stdout + r.stderr };
}

test("AC-001-01 file mẫu hợp lệ → exit 0", () => {
  const r = run(sample(), "ok");
  assert.equal(r.code, 0, r.out);
  assert.match(r.out, /✓/);
});

test("AC-001-02 JSON hỏng → exit 1", () => {
  const r = run("{ not json", "broken");
  assert.equal(r.code, 1);
  assert.match(r.out, /JSON không hợp lệ/);
});

test("AC-001-03 thiếu trường bắt buộc → lỗi schema", () => {
  const d = sample(); delete d.summary;
  const r = run(d, "nosummary");
  assert.equal(r.code, 1);
  assert.match(r.out, /schema/);
});

test("AC-001-04 fact không nguồn mà không needs_verification → R1", () => {
  const d = sample();
  d.working_conditions.schedule[0].source_ids = [];
  const r = run(d, "nosource");
  assert.equal(r.code, 1);
  assert.match(r.out, /\(R1\)/);
  // Hồi quy: không được báo nhầm luật testimony khi source_ids rỗng
  assert.doesNotMatch(r.out, /schedule\[0\]: số liệu chỉ dựa trên testimony/);
});

test("AC-001-05 source_id không tồn tại", () => {
  const d = sample();
  d.downsides[0].source_ids = ["S999"];
  const r = run(d, "badref");
  assert.equal(r.code, 1);
  assert.match(r.out, /S999 không tồn tại/);
});

test("AC-001-06 nguồn law thiếu effective_date → R2", () => {
  const d = sample();
  delete d.sources.find((s) => s.type === "law").effective_date;
  const r = run(d, "noeffective");
  assert.equal(r.code, 1);
  assert.match(r.out, /effective_date \(R2\)/);
});

test("AC-001-07 verified chỉ với 1 nguồn press → R3", () => {
  const d = sample();
  const pressId = d.sources.find((s) => s.type === "press").id;
  d.downsides[0] = { kind: "fact", text: "Một dữ kiện thử nghiệm.", source_ids: [pressId], confidence: "verified" };
  const r = run(d, "weakverified");
  assert.equal(r.code, 1);
  assert.match(r.out, /\(R3\)/);
});

test("AC-001-08 needs_verification thiếu note", () => {
  const d = sample();
  const item = d.working_conditions.income.find((i) => i.confidence === "needs_verification");
  delete item.note;
  const r = run(d, "nonote");
  assert.equal(r.code, 1);
  assert.match(r.out, /phải có note/);
});

test("AC-001-09 advice chứa con số → R1", () => {
  const d = sample();
  d.requirements.thcs[0].text = "Lương khởi điểm khoảng 5,92 triệu";
  const r = run(d, "advicenum");
  assert.equal(r.code, 1);
  assert.match(r.out, /advice không được chứa/);
});

test("AC-001-10 downsides < 3 fact → R7", () => {
  const d = sample();
  d.downsides = d.downsides.slice(0, 2);
  const r = run(d, "fewdownsides");
  assert.equal(r.code, 1);
  assert.match(r.out, /\(R7\)/);
});

test("AC-001-11 ladder edge trỏ node không tồn tại", () => {
  const d = sample();
  d.career_ladder.edges.push({ from: "gv-hang-1", to: "bo-truong", type: "promotion" });
  const r = run(d, "badedge");
  assert.equal(r.code, 1);
  assert.match(r.out, /node không tồn tại/);
});

test("AC-001-12 effect dùng stat chưa khai báo", () => {
  const d = sample();
  d.day_simulation.segments[0].task.on_success = { tien_luong: 5 };
  const r = run(d, "badstat");
  assert.equal(r.code, 1);
  assert.match(r.out, /stat 'tien_luong' chưa khai báo/);
});

test("AC-001-13 nguồn mồ côi → chỉ cảnh báo, exit 0", () => {
  const d = sample();
  d.sources.push({ id: "S900", type: "press", title: "x", publisher: "x", url: "https://example.com", accessed: "2026-11-02" });
  const r = run(d, "orphan");
  assert.equal(r.code, 0, r.out);
  assert.match(r.out, /S900: nguồn không được dùng/);
});

test("AC-001-14 segment basis là advice → R6", () => {
  const d = sample();
  d.day_simulation.segments[0].basis = { kind: "advice", text: "Giáo viên thường soạn bài buổi sáng." };
  const r = run(d, "advicebasis");
  assert.equal(r.code, 1);
  assert.match(r.out, /\(R6\)/);
});
