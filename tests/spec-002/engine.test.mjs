// SPEC-002 — unit test cho src/engine. Logic thuần, không mock.
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createEngine } from "../../src/engine/index.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");
const ENGINE = join(root, "src/engine/index.ts");
const FIXTURE = join(root, "tests/fixtures/mini-profession.json");
const fixture = () => JSON.parse(readFileSync(FIXTURE, "utf8"));

const SEQ_OK = { type: "sequence", order: ["X", "Y", "Z"] };
const SEQ_BAD = { type: "sequence", order: ["Y", "X", "Z"] };
// Một đáp án hợp lệ cho từng segment của fixture, theo thứ tự.
const VALID = [
  SEQ_OK,
  { type: "choice", option: 0 },
  { type: "drag_sort", placement: ["L", "R", "L"] },
  { type: "spot_error", lines: [1, 3] },
  { type: "dialogue", replies: [0, 1] },
  { type: "time_budget", minutes: [60, 30] },
];
const M = { durationMs: 0 };

/** Đưa engine tới segment index i (phase "segment"). */
function atSegment(i, prof = fixture()) {
  const e = createEngine(prof);
  e.start();
  for (let k = 0; k < i; k++) { e.submit(VALID[k], M); e.next(); }
  return e;
}

function expectCode(fn, code) {
  assert.throws(fn, (err) => { assert.equal(err.code, code); return true; });
}

/** Thao tác phải ném `code` và không đổi state. */
function expectRejected(e, fn, code) {
  const before = e.state();
  expectCode(fn, code);
  assert.deepEqual(e.state(), before);
}

test("AC-002-01 khởi tạo từ fixture → intro, stats initial, history rỗng", () => {
  const e = createEngine(fixture());
  assert.deepEqual(e.state(), { professionId: "mini", phase: "intro", segmentIndex: -1, stats: { a: 50, b: 90 }, history: [] });
});

test("AC-002-02 không có day_simulation → NO_SIMULATION", () => {
  expectCode(() => createEngine({ id: "x" }), "NO_SIMULATION");
});

test("AC-002-03 task.type lạ → UNKNOWN_TASK_TYPE ngay khi khởi tạo", () => {
  const p = fixture();
  p.day_simulation.segments[3].task.type = "quiz";
  expectCode(() => createEngine(p), "UNKNOWN_TASK_TYPE");
});

test("AC-002-04 mọi ô lỗi trong bảng chuyển trạng thái → ILLEGAL_STATE, state không đổi", () => {
  const ops = {
    start: (e) => e.start(),
    submit: (e) => e.submit(SEQ_OK, M),
    retry: (e) => e.retry(),
    next: (e) => e.next(),
    finish: (e) => e.finish(),
  };
  const phases = {
    intro: () => createEngine(fixture()),
    segment: () => atSegment(0),
    feedback: () => { const e = atSegment(0); e.submit(SEQ_OK, M); return e; },
    reflection: () => { const e = atSegment(5); e.submit(VALID[5], M); e.next(); return e; },
    done: () => { const e = atSegment(5); e.submit(VALID[5], M); e.next(); e.finish(); return e; },
  };
  const illegal = {
    intro: ["submit", "retry", "next", "finish"],
    segment: ["start", "retry", "next", "finish"],
    feedback: ["start", "submit", "finish"],
    reflection: ["start", "submit", "retry", "next"],
    done: ["start", "submit", "retry", "next", "finish"],
  };
  for (const [phase, names] of Object.entries(illegal)) {
    for (const name of names) {
      const e = phases[phase]();
      assert.equal(e.state().phase, phase);
      expectRejected(e, () => ops[name](e), "ILLEGAL_STATE");
    }
  }
  // R-26: vi phạm cả phase lẫn đáp án → ILLEGAL_STATE
  const e = createEngine(fixture());
  expectRejected(e, () => e.submit({ type: "choice", option: 99 }, { durationMs: -5 }), "ILLEGAL_STATE");
});

test("AC-002-05 mỗi vi phạm R-4..R-11 → INVALID_ANSWER, state không đổi", () => {
  const cases = [
    [0, { type: "choice", option: 0 }, M, "R-4 sai type"],
    [0, { type: "sequence", order: ["X", "Y"] }, M, "R-5 thiếu phần tử"],
    [0, { type: "sequence", order: ["X", "Y", "Y"] }, M, "R-5 trùng phần tử"],
    [0, { type: "sequence", order: ["X", "Y", "x"] }, M, "R-5 khác chuỗi"],
    [1, { type: "choice", option: 2 }, M, "R-6 vượt cận"],
    [1, { type: "choice", option: -1 }, M, "R-6 âm"],
    [1, { type: "choice", option: 0.5 }, M, "R-6 không nguyên"],
    [2, { type: "drag_sort", placement: ["L", "R"] }, M, "R-7 sai độ dài"],
    [2, { type: "drag_sort", placement: ["L", "R", "Q"] }, M, "R-7 bucket lạ"],
    [3, { type: "spot_error", lines: [1, 1] }, M, "R-8 trùng"],
    [3, { type: "spot_error", lines: [4] }, M, "R-8 vượt cận"],
    [3, { type: "spot_error", lines: [1.5] }, M, "R-8 không nguyên"],
    [4, { type: "dialogue", replies: [0] }, M, "R-9 sai độ dài"],
    [4, { type: "dialogue", replies: [0, 2] }, M, "R-9 vượt cận"],
    [5, { type: "time_budget", minutes: [30] }, M, "R-10 sai độ dài"],
    [5, { type: "time_budget", minutes: [45, 0] }, M, "R-10 không chia hết 30"],
    [5, { type: "time_budget", minutes: [-30, 30] }, M, "R-10 âm"],
    [5, { type: "time_budget", minutes: [60, 60] }, M, "R-10 vượt budget"],
    [0, SEQ_OK, { durationMs: -1 }, "R-11 âm"],
    [0, SEQ_OK, { durationMs: 1.5 }, "R-11 không nguyên"],
  ];
  for (const [seg, answer, meta, label] of cases) {
    const e = atSegment(seg);
    const before = e.state();
    assert.throws(() => e.submit(answer, meta), (err) => err.code === "INVALID_ANSWER", label);
    assert.deepEqual(e.state(), before, label);
  }
});

test("AC-002-06 sequence đúng thứ tự → success, a = 60", () => {
  const e = atSegment(0);
  const r = e.submit(SEQ_OK, M);
  assert.equal(r.success, true);
  assert.deepEqual(r.rawDelta, { a: 10 });
  assert.equal(e.state().stats.a, 60);
});

test("AC-002-07 sequence sai thứ tự → fail, a = 40", () => {
  const e = atSegment(0);
  const r = e.submit(SEQ_BAD, M);
  assert.equal(r.success, false);
  assert.deepEqual(r.rawDelta, { a: -10 });
  assert.equal(e.state().stats.a, 40);
});

test("AC-002-08 choice chặn trên 100: rawDelta 20, appliedDelta 10", () => {
  const e = atSegment(1);
  const r = e.submit({ type: "choice", option: 0 }, M);
  assert.equal(r.success, null);
  assert.equal(r.rawDelta.b, 20);
  assert.equal(r.appliedDelta.b, 10);
  assert.equal(e.state().stats.b, 100);
  assert.deepEqual(r.feedback, ["f0"]);
});

test("AC-002-09 drag_sort một item sai bucket → on_fail", () => {
  const e = atSegment(2);
  const r = e.submit({ type: "drag_sort", placement: ["L", "L", "L"] }, M);
  assert.equal(r.success, false);
  assert.deepEqual(r.rawDelta, { b: -5 });
});

test("AC-002-10 spot_error so khớp tập dòng lỗi, không phụ thuộc thứ tự", () => {
  for (const [lines, want] of [[[3, 1], true], [[1], false], [[1, 2, 3], false]]) {
    const r = atSegment(3).submit({ type: "spot_error", lines }, M);
    assert.equal(r.success, want, JSON.stringify(lines));
    assert.deepEqual(r.feedback, ["e1", "e3"]);
  }
});

test("AC-002-11 dialogue cộng effect các lượt, feedback theo lượt", () => {
  const r = atSegment(4).submit({ type: "dialogue", replies: [0, 1] }, M);
  assert.equal(r.success, null);
  assert.deepEqual(r.rawDelta, { a: 3, b: 2 });
  assert.deepEqual(r.feedback, ["d00", "d11"]);
});

test("AC-002-12 time_budget [60,30] → rawDelta {a:5, b:-1}", () => {
  const r = atSegment(5).submit({ type: "time_budget", minutes: [60, 30] }, M);
  assert.equal(r.success, null);
  assert.deepEqual(r.rawDelta, { a: 5, b: -1 });
  assert.deepEqual(r.feedback, []);
});

test("AC-002-13 retry khôi phục stats, xóa history, đếm retries", () => {
  const e = atSegment(0);
  e.submit(SEQ_BAD, M);
  assert.equal(e.state().stats.a, 40);
  e.retry();
  const s = e.state();
  assert.equal(s.phase, "segment");
  assert.equal(s.stats.a, 50);
  assert.equal(s.history.length, 0);
  const r = e.submit(SEQ_OK, { durationMs: 300 });
  assert.equal(r.retries, 1);
  assert.equal(r.durationMs, 300);
  assert.equal(e.state().stats.a, 60);
  // R-25: sang segment mới thì bộ đếm về 0
  e.next();
  assert.equal(e.submit(VALID[1], M).retries, 0);
});

test("AC-002-14 next ở segment cuối → reflection, finish → done", () => {
  const e = atSegment(5);
  e.submit(VALID[5], M);
  e.next();
  assert.equal(e.state().phase, "reflection");
  e.finish();
  assert.equal(e.state().phase, "done");
  assert.equal(e.state().history.length, 6);
});

test("AC-002-15 state() trả bản sao sâu", () => {
  const e = atSegment(0);
  const r = e.submit(SEQ_OK, M);
  const s = e.state();
  s.stats.a = 999;
  s.history[0].rawDelta.a = 999;
  s.history.push({});
  r.feedback.push("x");
  const again = e.state();
  assert.equal(again.stats.a, 60);
  assert.equal(again.history.length, 1);
  assert.deepEqual(again.history[0].rawDelta, { a: 10 });
  assert.deepEqual(again.history[0].feedback, []);
});

test("AC-002-16 toàn bộ conformance vectors đạt", () => {
  const r = spawnSync(process.execPath, [join(root, "tests/spec-002/run-vectors.mjs"), ENGINE, join(root, "tests/spec-002/vectors.json")], { encoding: "utf8" });
  assert.equal(r.status, 0, r.stdout + r.stderr);
});

/** Đáp án hợp lệ đầu tiên cho một task bất kỳ (contract test, không biết tên nghề). */
function firstValid(task) {
  switch (task.type) {
    case "sequence": return { type: "sequence", order: [...task.steps] };
    case "choice": return { type: "choice", option: 0 };
    case "drag_sort": return { type: "drag_sort", placement: task.items.map(() => task.buckets[0]) };
    case "spot_error": return { type: "spot_error", lines: [] };
    case "dialogue": return { type: "dialogue", replies: task.turns.map(() => 0) };
    case "time_budget": return { type: "time_budget", minutes: task.activities.map(() => 0) };
  }
}

test("AC-002-17 mọi nghề có day_simulation chơi hết ngày tới done", () => {
  const dir = join(root, "content/professions");
  const profs = readdirSync(dir).filter((f) => f.endsWith(".json")).map((f) => JSON.parse(readFileSync(join(dir, f), "utf8")));
  const sims = profs.filter((p) => p.day_simulation);
  assert.ok(sims.length > 0, "không có nghề nào có day_simulation");
  for (const p of sims) {
    const e = createEngine(p);
    e.start();
    for (const seg of p.day_simulation.segments) { e.submit(firstValid(seg.task), M); e.next(); }
    e.finish();
    assert.equal(e.state().phase, "done", p.id);
  }
});
