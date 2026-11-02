// SPEC-005 — controller thuần của màn chơi. Không mock; AC-005-11 dùng engine thật.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { displayOrder, initialDraft, update, canSubmit, toAnswer, remainingMinutes, formatDelta } from "../../src/sim/controller.ts";
import { createEngine } from "../../src/engine/index.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");
const fixture = () => JSON.parse(readFileSync(join(root, "tests/fixtures/mini-profession.json"), "utf8"));
const seg = (id) => fixture().day_simulation.segments.find((s) => s.id === id);
const vectors = JSON.parse(readFileSync(join(root, "tests/spec-005/vectors.json"), "utf8"));

/** Áp lần lượt các action, trả về draft sau mỗi bước. */
function run(segmentId, actions) {
  const s = seg(segmentId);
  let d = initialDraft(s.id, s.task);
  return actions.map((a) => (d = update(s.task, d, a)));
}

test("AC-005-01 displayOrder đúng bảng mẫu", () => {
  for (const v of vectors.displayOrder.slice(0, 6)) {
    assert.deepEqual(displayOrder(v.segmentId, v.n), v.expect, `${v.segmentId}/${v.n}`);
  }
});

test("AC-005-02 mọi segment thật: hoán vị và không phải đồng nhất", () => {
  const dir = join(root, "content/professions");
  for (const f of readdirSync(dir).filter((x) => x.endsWith(".json"))) {
    const p = JSON.parse(readFileSync(join(dir, f), "utf8"));
    for (const s of p.day_simulation?.segments ?? []) {
      for (const n of [s.task.steps?.length, s.task.items?.length].filter((x) => x >= 2)) {
        const o = displayOrder(s.id, n);
        assert.deepEqual([...o].sort((a, b) => a - b), [...Array(n).keys()], `${s.id}`);
        assert.ok(o.some((v, i) => v !== i), `${s.id} không được là đồng nhất`);
      }
    }
  }
});

test("AC-005-03 initialDraft sequence xáo theo displayOrder", () => {
  assert.deepEqual(initialDraft("seq", seg("seq").task), { type: "sequence", order: ["X", "Z", "Y"] });
});

test("AC-005-04 move trong biên thì dời, ngoài biên thì giữ nguyên", () => {
  const [a, b] = run("seq", [{ kind: "move", from: 2, to: 1 }, { kind: "move", from: 0, to: 3 }]);
  assert.deepEqual(a.order, ["X", "Y", "Z"]);
  assert.deepEqual(b.order, ["X", "Y", "Z"]);
});

test("AC-005-05 choice: pick ghi đè, option lạ bị bỏ qua", () => {
  const s = seg("cho");
  assert.equal(canSubmit(s.task, initialDraft(s.id, s.task)), false);
  const steps = run("cho", [{ kind: "pick", option: 1 }, { kind: "pick", option: 0 }, { kind: "pick", option: 2 }]);
  assert.deepEqual(steps.map((d) => d.option), [1, 0, 0]);
  assert.equal(canSubmit(s.task, steps[2]), true);
});

test("AC-005-06 drag_sort: place và bucket lạ", () => {
  const s = seg("drg");
  const [a, b] = run("drg", [{ kind: "place", item: 0, bucket: "L" }, { kind: "place", item: 1, bucket: "Q" }]);
  assert.deepEqual(a.placement, ["L", null, null]);
  assert.equal(canSubmit(s.task, a), false);
  assert.deepEqual(b.placement, ["L", null, null]);
});

test("AC-005-07 spot_error: toggle giữ tăng dần, dòng ngoài biên bị bỏ qua", () => {
  const steps = run("spt", [3, 1, 3, 4].map((line) => ({ kind: "toggle", line })));
  assert.deepEqual(steps.map((d) => d.lines), [[3], [1, 3], [1], [1]]);
});

test("AC-005-08 dialogue: chỉ trả lời lượt kế tiếp", () => {
  const s = seg("dlg");
  const steps = run("dlg", [{ kind: "reply", turn: 1, reply: 0 }, { kind: "reply", turn: 0, reply: 1 }, { kind: "reply", turn: 1, reply: 1 }]);
  assert.deepEqual(steps.map((d) => d.replies), [[], [1], [1, 1]]);
  assert.equal(canSubmit(s.task, steps[2]), true);
});

test("AC-005-09 time_budget: bước 30 phút, không vượt quỹ, không âm", () => {
  const s = seg("tbd");
  const acts = [
    { kind: "add", activity: 0 }, { kind: "add", activity: 0 }, { kind: "add", activity: 0 },
    { kind: "add", activity: 1 }, { kind: "sub", activity: 1 }, { kind: "sub", activity: 0 },
  ];
  const steps = run("tbd", acts);
  assert.deepEqual(steps.map((d) => d.minutes), [[30, 0], [60, 0], [90, 0], [90, 0], [90, 0], [60, 0]]);
  assert.equal(remainingMinutes(s.task, steps[5]), 30);
});

test("AC-005-10 update không sửa draft truyền vào", () => {
  const cases = [
    ["seq", { kind: "move", from: 0, to: 2 }],
    ["cho", { kind: "pick", option: 1 }],
    ["drg", { kind: "place", item: 0, bucket: "R" }],
    ["spt", { kind: "toggle", line: 2 }],
    ["dlg", { kind: "reply", turn: 0, reply: 0 }],
    ["tbd", { kind: "add", activity: 0 }],
  ];
  for (const [id, action] of cases) {
    const s = seg(id);
    const d = initialDraft(s.id, s.task);
    const before = structuredClone(d);
    const next = update(s.task, d, action);
    assert.deepEqual(d, before, id);
    assert.notDeepEqual(next, before, `${id}: action hợp lệ phải đổi draft`);
  }
});

test("AC-005-11 toAnswer của draft đủ được engine chấp nhận", () => {
  const filled = {
    seq: [],
    cho: [{ kind: "pick", option: 1 }],
    drg: [0, 1, 2].map((item) => ({ kind: "place", item, bucket: "R" })),
    spt: [{ kind: "toggle", line: 0 }],
    dlg: [{ kind: "reply", turn: 0, reply: 1 }, { kind: "reply", turn: 1, reply: 0 }],
    tbd: [{ kind: "add", activity: 0 }, { kind: "add", activity: 1 }],
  };
  const p = fixture();
  const e = createEngine(p);
  e.start();
  for (const s of p.day_simulation.segments) {
    let d = initialDraft(s.id, s.task);
    for (const a of filled[s.id]) d = update(s.task, d, a);
    assert.equal(canSubmit(s.task, d), true, s.id);
    assert.doesNotThrow(() => e.submit(toAnswer(s.task, d), { durationMs: 0 }), s.id);
    e.next();
  }
  assert.equal(e.state().phase, "reflection");
});

test("AC-005-12 formatDelta theo thứ tự stats, bỏ 0 và khóa lạ", () => {
  const stats = [{ id: "a", label: "A" }, { id: "b", label: "B" }, { id: "c", label: "C" }];
  assert.deepEqual(formatDelta({ b: -5, a: 10, z: 3, c: 0 }, stats), ["A +10", "B -5"]);
});

test("AC-005-13 toàn bộ conformance vectors đạt", () => {
  for (const v of vectors.displayOrder) assert.deepEqual(displayOrder(v.segmentId, v.n), v.expect, `${v.segmentId}/${v.n}`);
  for (const v of vectors.actions) {
    const s = seg(v.segment);
    let d = initialDraft(s.id, s.task);
    assert.deepEqual(d, v.initial, `${v.id} initial`);
    v.steps.forEach((step, i) => {
      d = update(s.task, d, step.action);
      assert.deepEqual(d, step.expect, `${v.id} step ${i}`);
    });
  }
});
