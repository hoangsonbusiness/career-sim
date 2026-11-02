// SPEC-004 — buildProfileView: hàm thuần, test bằng fixture profile-mini.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { buildProfileView } from "../../src/profile/view.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");
const mini = () => JSON.parse(readFileSync(join(root, "tests/fixtures/profile-mini.json"), "utf8"));
const allItems = (v) => v.sections.flatMap((s) => s.groups.flatMap((g) => g.items));

test("AC-004-01 bỏ nhóm rỗng và mục không tồn tại", () => {
  const v = buildProfileView(mini());
  assert.deepEqual(v.sections.map((s) => s.key), ["requirements", "working_conditions", "downsides"]);
  assert.deepEqual(v.sections[1].groups.map((g) => g.key), ["schedule", "income"]);
});

test("AC-004-02 heading mục và nhóm theo bảng R-2", () => {
  const p = mini();
  p.future_outlook = [{ kind: "advice", text: "Tương lai." }];
  p.working_conditions.environment = [{ kind: "advice", text: "Môi trường." }];
  const v = buildProfileView(p);
  assert.deepEqual(
    v.sections.map((s) => [s.key, s.heading, s.groups.map((g) => [g.key, g.heading])]),
    [
      ["requirements", "Cần học gì để làm nghề này", [["thcs", "Ở cấp THCS"], ["thpt", "Ở cấp THPT"], ["higher_ed", "Đại học / Cao đẳng"], ["on_the_job", "Khi đi làm"]]],
      ["working_conditions", "Điều kiện làm việc", [["schedule", "Thời gian làm việc"], ["income", "Thu nhập"], ["environment", "Môi trường làm việc"]]],
      ["downsides", "Mặt khó của nghề", [["downsides", null]]],
      ["future_outlook", "Triển vọng", [["future_outlook", null]]],
    ],
  );
});

test("AC-004-03 trích dẫn giữ thứ tự và phần tử trùng", () => {
  const item = buildProfileView(mini()).sections[0].groups[2].items[0];
  assert.deepEqual(item.citations.map((c) => c.id), ["S2", "S1", "S2"]);
});

test("AC-004-04 source_id không tồn tại → UNKNOWN_SOURCE", () => {
  const p = mini();
  p.downsides[0].source_ids = ["S9"];
  assert.throws(() => buildProfileView(p), (err) => {
    assert.equal(err.code, "UNKNOWN_SOURCE");
    assert.equal(err.sourceId, "S9");
    return true;
  });
});

test("AC-004-05 nhãn độ tin cậy và cảnh báo", () => {
  const items = allItems(buildProfileView(mini()));
  const pick = (text) => items.find((i) => i.text === text);
  const cases = [pick("Cần bằng cử nhân."), pick("Một nguồn."), pick("Thu nhập chưa chắc."), pick("Lời khuyên THCS.")];
  assert.deepEqual(cases.map((i) => i.confidenceLabel), ["Đã kiểm chứng", "Một nguồn", "Cần kiểm chứng", null]);
  assert.deepEqual(cases.map((i) => i.warning), [false, false, true, false]);
  assert.equal(cases[2].note, "Cần thêm nguồn.");
  assert.equal(cases[0].note, null);
});

test("AC-004-06 nhãn loại nguồn và ngày hiệu lực", () => {
  const v = buildProfileView(mini());
  assert.deepEqual(v.sources.map((s) => s.typeLabel), [
    "Văn bản pháp luật", "Số liệu chính thức", "Báo cáo thị trường", "Báo chí", "Chia sẻ người trong nghề", "Tài liệu tham khảo",
  ]);
  assert.equal(v.sources[0].effectiveDate, "2026-01-01");
  assert.equal(v.sources[1].effectiveDate, null);
});

test("AC-004-07 simulationHref, aliases, scopeNote khi có và không có", () => {
  const v = buildProfileView(mini());
  assert.equal(v.simulationHref, "/nghe/mini/mot-ngay/");
  assert.deepEqual(v.aliases, ["Mini A"]);
  assert.equal(v.scopeNote, "Phạm vi thử.");
  assert.equal(v.isDraft, true);
  const p = mini();
  delete p.day_simulation;
  delete p.aliases;
  delete p.meta.scope_note;
  p.meta.status = "reviewed";
  const w = buildProfileView(p);
  assert.equal(w.simulationHref, null);
  assert.deepEqual(w.aliases, []);
  assert.equal(w.scopeNote, null);
  assert.equal(w.isDraft, false);
});

test("AC-004-08 không đổi đối số; lộ trình theo thứ tự nodes", () => {
  const p = mini();
  const before = structuredClone(p);
  const v = buildProfileView(p);
  assert.deepEqual(p, before);
  assert.deepEqual(v.ladder.map((s) => s.id), ["n2", "n1"]);
  assert.equal(v.ladder[0].description, "Mô tả bậc đầu.");
  assert.equal(v.ladder[1].description, null);
  assert.deepEqual(v.ladder[1].items[0].citations.map((c) => c.id), ["S6"]);
});
