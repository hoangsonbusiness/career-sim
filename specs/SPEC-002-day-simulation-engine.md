---
id: SPEC-002
title: Engine mô phỏng "một ngày làm việc" (lõi logic, không gồm render)
version: 2
status: approved
features: [F3, F7]
owns: [src/engine/**]
owner: anh Son
created: 2026-11-02
approved_hash: 5920924b90d30998
approved_by: Son
approved_at: 2026-11-02
---

# SPEC-002 — Engine mô phỏng một ngày

> Viết theo specs/STANDARD.md. Mục 2–4 là phần quy phạm.

## 1. Bối cảnh & lý do
F3 là trải nghiệm cốt lõi. Engine phải chạy với **mọi** file nghề hợp lệ mà không có logic riêng cho từng nghề. Logic (TypeScript thuần) được tách khỏi render (Phaser) để mọi luật chơi kiểm thử được bằng unit test, không cần trình duyệt.

Có thể hình dung giống Spring: `DayEngine` là container quản lý vòng đời, mỗi `task.type` là một bean `TaskEvaluator` đăng ký vào registry.

## 2. Phạm vi
- Trong phạm vi: máy trạng thái của một ngày; kiểm tra và chấm 6 loại task; cập nhật chỉ số; lịch sử kết quả (dữ liệu đầu vào cho F6/F7).
- Ngoài phạm vi: Phaser scene, xáo trộn thứ tự hiển thị, âm thanh, lưu localStorage, đo thời gian thực (do tầng UI đo rồi truyền vào `durationMs`).

## 3. Thiết kế

### 3.1 Thuật ngữ
- **Stat**: chỉ số khai báo trong `day_simulation.stats`, giá trị số nguyên.
- **Effect**: object `{ [statId]: integer }` trong file nghề.
- **rawDelta**: tổng các effect của một lần nộp bài, **trước** khi chặn.
- **appliedDelta**: thay đổi thực tế của stat, **sau** khi chặn (= giá trị mới − giá trị cũ).

### 3.2 Hợp đồng API

```ts
// src/engine/index.ts — đây là toàn bộ API public
export type StatMap = Record<string, number>;
export type Phase = "intro" | "segment" | "feedback" | "reflection" | "done";

export interface EngineState {
  professionId: string;
  phase: Phase;
  segmentIndex: number;          // -1 khi phase = "intro"
  stats: StatMap;                // chứa đúng các stat đã khai báo
  history: SegmentResult[];      // mỗi segment tối đa 1 phần tử (lần nộp cuối cùng)
}

export interface SegmentResult {
  segmentId: string;
  success: boolean | null;       // null với choice, dialogue, time_budget
  rawDelta: StatMap;
  appliedDelta: StatMap;
  feedback: string[];
  durationMs: number;
  retries: number;               // số lần retry() trước lần nộp này
}

export type Answer =
  | { type: "sequence"; order: string[] }
  | { type: "choice"; option: number }
  | { type: "drag_sort"; placement: string[] }   // placement[i] = bucket của items[i]
  | { type: "spot_error"; lines: number[] }
  | { type: "dialogue"; replies: number[] }      // replies[t] = index reply ở lượt t
  | { type: "time_budget"; minutes: number[] };  // minutes[i] cho activities[i]

export interface DayEngine {
  state(): EngineState;                          // trả về bản sao sâu
  start(): void;
  submit(answer: Answer, meta: { durationMs: number }): SegmentResult;
  retry(): void;
  next(): void;
  finish(): void;
}

// Engine chỉ đọc 2 trường: profession.id và profession.day_simulation
export function createEngine(profession: { id: string; day_simulation?: unknown }): DayEngine;

export class EngineError extends Error {
  code: "NO_SIMULATION" | "UNKNOWN_TASK_TYPE" | "ILLEGAL_STATE" | "INVALID_ANSWER";
}
```

### 3.3 Quy tắc hành vi

**Khởi tạo**
- R-1. `createEngine` PHẢI ném `NO_SIMULATION` nếu `day_simulation` không tồn tại.
- R-2. `createEngine` PHẢI ném `UNKNOWN_TASK_TYPE` nếu bất kỳ segment nào có `task.type` ngoài 6 loại trong schema. Kiểm tra ngay khi khởi tạo. *Lý do: phát hiện lỗi sớm, không để người chơi tới giữa ngày mới hỏng.*
- R-3. Sau `createEngine`: `phase = "intro"`, `segmentIndex = -1`, `stats` = giá trị `initial` của từng stat, `history = []`.

**Kiểm tra đáp án.** Đáp án không hợp lệ PHẢI ném `INVALID_ANSWER` và KHÔNG ĐƯỢC thay đổi trạng thái.
- R-4. `answer.type` PHẢI trùng `task.type` của segment hiện tại.
- R-5. `sequence`: `order` PHẢI là một hoán vị của `task.steps` (cùng độ dài, cùng tập phần tử, so sánh chuỗi chính xác).
- R-6. `choice`: `option` PHẢI là số nguyên trong `[0, options.length − 1]`.
- R-7. `drag_sort`: `placement.length` PHẢI bằng `items.length`, mỗi phần tử PHẢI thuộc `task.buckets`.
- R-8. `spot_error`: `lines` PHẢI gồm các số nguyên trong `[0, document.length − 1]`, không trùng lặp. Mảng rỗng là hợp lệ.
- R-9. `dialogue`: `replies.length` PHẢI bằng `turns.length`; `replies[t]` PHẢI là số nguyên trong `[0, turns[t].replies.length − 1]`.
- R-10. `time_budget`: `minutes.length` PHẢI bằng `activities.length`; mỗi phần tử PHẢI là số nguyên ≥ 0 và chia hết cho 30; tổng PHẢI ≤ `budget_min`. *Lý do: effect khai báo theo khối 30 phút; bước nhỏ hơn sẽ buộc phải chọn cách làm tròn, gây khác biệt giữa các bản implement.*
- R-11. `meta.durationMs` PHẢI là số nguyên ≥ 0.

**Chấm điểm (success, rawDelta, feedback)**
- R-12. `sequence`: `success = true` khi và chỉ khi `order[i] === steps[i]` với mọi `i`. `rawDelta = on_success` nếu đúng, `on_fail` nếu sai; nếu khóa đó không khai báo thì `rawDelta = {}`. `feedback = []`.
- R-13. `choice`: `success = null`; `rawDelta = options[option].effect`; `feedback = [options[option].feedback]`.
- R-14. `drag_sort`: `success = true` khi và chỉ khi `placement[i] === items[i].bucket` với mọi `i`. `rawDelta` theo R-12. `feedback = []`.
- R-15. `spot_error`: `success = true` khi và chỉ khi tập `lines` bằng đúng tập `errors[].line` (không thừa, không thiếu; thứ tự không quan trọng). `rawDelta` theo R-12. `feedback` = các `explain` của `errors`, theo thứ tự trong file.
- R-16. `dialogue`: `success = null`; `rawDelta` = tổng theo từng stat của các `effect` đã chọn; `feedback` = các `feedback` của reply đã chọn, theo thứ tự lượt, bỏ qua reply không có feedback.
- R-17. `time_budget`: `success = null`; `rawDelta[k] = Σ_i effect_per_30min_i[k] × (minutes[i] / 30)`, chỉ tính các activity có `minutes[i] > 0` (activity 0 phút **không** được coi là "được dùng" theo R-18); `feedback = []`.
- R-18. `rawDelta` PHẢI chỉ chứa các khóa xuất hiện trong ít nhất một effect được dùng (kể cả khi tổng bằng 0). Khi `rawDelta = {}` thì `appliedDelta = {}`.

**Áp dụng chỉ số**
- R-19. Với mỗi khóa `k` trong `rawDelta`: `mới = min(100, max(0, cũ + rawDelta[k]))`. Chặn **một lần** trên tổng, KHÔNG ĐƯỢC chặn từng effect con. *Lý do: kết quả không phụ thuộc thứ tự cộng.*
- R-20. `appliedDelta[k] = mới − cũ` với đúng các khóa của `rawDelta`.

**Tính tất định**
- R-21. Engine KHÔNG ĐƯỢC dùng số ngẫu nhiên, `Date.now()`, hay bất kỳ trạng thái toàn cục nào. Cùng chuỗi thao tác PHẢI cho cùng `state()`. *Lý do: tầng UI chịu trách nhiệm xáo trộn hiển thị; engine giữ tính tất định để test được.*
- R-22. `state()` PHẢI trả về bản sao sâu; sửa bản sao KHÔNG ĐƯỢC ảnh hưởng engine.

### 3.4 Bảng chuyển trạng thái

Ô "lỗi" = ném `ILLEGAL_STATE`, trạng thái giữ nguyên.

| Phase hiện tại | `start()` | `submit()` | `retry()` | `next()` | `finish()` |
|---|---|---|---|---|---|
| intro | → segment, index = 0 | lỗi | lỗi | lỗi | lỗi |
| segment | lỗi | → feedback (xem R-23) | lỗi | lỗi | lỗi |
| feedback | lỗi | lỗi | → segment (R-24) | → segment, index+1, hoặc reflection nếu là segment cuối | lỗi |
| reflection | lỗi | lỗi | lỗi | lỗi | → done |
| done | lỗi | lỗi | lỗi | lỗi | lỗi |

- R-23. `submit` hợp lệ: chụp snapshot `stats` trước khi áp dụng → áp dụng R-12..R-20 → thêm `SegmentResult` vào `history` với `retries` = bộ đếm retry của segment hiện tại → phase `feedback` → trả về đúng object đã thêm vào `history`.
- R-24. `retry`: khôi phục `stats` về snapshot của R-23, xóa phần tử cuối của `history`, tăng bộ đếm retry của segment hiện tại thêm 1.
- R-25. `next` từ feedback sang segment mới: đặt lại bộ đếm retry = 0.
- R-26. Thứ tự kiểm tra trong `submit`: (1) phase theo bảng 3.4 → `ILLEGAL_STATE`; (2) R-4..R-11 → `INVALID_ANSWER`. Một lời gọi vi phạm cả hai PHẢI ném `ILLEGAL_STATE`.

### 3.5 Lỗi

| code | Khi nào | Trạng thái |
|---|---|---|
| `NO_SIMULATION` | R-1 | — (không tạo được engine) |
| `UNKNOWN_TASK_TYPE` | R-2 | — |
| `ILLEGAL_STATE` | Thao tác không được phép theo bảng 3.4 | Không đổi |
| `INVALID_ANSWER` | Vi phạm R-4..R-11 | Không đổi |

### 3.6 Conformance vectors
`tests/spec-002/vectors.json` + fixture `tests/fixtures/mini-profession.json` (đủ 6 loại task). Mỗi vector là một chuỗi thao tác kèm kết quả mong đợi. **Khi văn bản và vector mâu thuẫn, vector được ưu tiên, đồng thời PHẢI mở BUG để sửa spec.**

## 4. Tiêu chí chấp nhận

| ID | Given | When | Then |
|---|---|---|---|
| AC-002-01 | Fixture mini-profession | `createEngine` | `state()` = `{phase:"intro", segmentIndex:-1, stats:{a:50,b:90}, history:[]}` |
| AC-002-02 | Profession không có `day_simulation` | `createEngine` | Ném lỗi `code = "NO_SIMULATION"` |
| AC-002-03 | Fixture có 1 segment `task.type = "quiz"` | `createEngine` | Ném lỗi `code = "UNKNOWN_TASK_TYPE"` |
| AC-002-04 | Mọi phase × thao tác ô "lỗi" trong bảng 3.4 | Gọi thao tác | Ném `ILLEGAL_STATE`, `state()` trước = sau |
| AC-002-05 | Mỗi vi phạm R-4..R-11 (≥ 1 ca cho mỗi quy tắc) | `submit` | Ném `INVALID_ANSWER`, `state()` trước = sau |
| AC-002-06 | Segment sequence, a=50 | `order` đúng thứ tự | `success = true`, `rawDelta = {a:10}`, a = 60 |
| AC-002-07 | Segment sequence, a=50 | `order` sai thứ tự | `success = false`, `rawDelta = {a:-10}`, a = 40 |
| AC-002-08 | Segment choice, b=90 | `option = 0` (effect b:+20) | `success = null`, `rawDelta.b = 20`, `appliedDelta.b = 10`, b = 100, `feedback = ["f0"]` |
| AC-002-09 | Segment drag_sort | 1 item sai bucket | `success = false`, `rawDelta = on_fail` |
| AC-002-10 | Segment spot_error, errors {1,3} | `lines = [3,1]` → true; `[1]` → false; `[1,2,3]` → false | `success` lần lượt `true`, `false`, `false` |
| AC-002-11 | Segment dialogue | `replies = [0,1]` | `rawDelta` = tổng 2 effect, `feedback = ["d00","d11"]` |
| AC-002-12 | Segment time_budget, budget 90 | `minutes = [60,30]` | `rawDelta = {a:5, b:-1}` |
| AC-002-13 | Đã submit sai ở segment 0 (a=40) | `retry()` rồi submit đúng | Sau retry a = 50, `history.length = 0`; lần nộp sau có `retries = 1`, a = 60 |
| AC-002-14 | Đang feedback ở segment cuối | `next()` rồi `finish()` | phase lần lượt `reflection`, `done` |
| AC-002-15 | Đã gọi `state()` và sửa bản trả về | Gọi `state()` lần nữa | Giá trị không bị ảnh hưởng |
| AC-002-16 | `tests/spec-002/vectors.json` | Chạy toàn bộ vector | 100% vector đạt |
| AC-002-17 | Mọi file trong `content/professions/` có `day_simulation` | Tự động chơi hết ngày với đáp án hợp lệ đầu tiên | Kết thúc ở phase `done`, không ném lỗi |

## 5. Ghi chú kiểm thử
- Unit test (`node:test`, xem ADR-001) trong `tests/spec-002/`. Test kiểm tra lỗi theo `err.code`, không theo tên class.
- AC-002-16 là test chạy vector: một vòng lặp đọc `vectors.json`. Thêm vector không cần sửa test.
- AC-002-17 là contract test: nghề mới tự động được kiểm tra.
- Không mock gì cả: engine là logic thuần.

## 6. Câu hỏi mở
Spec đã chốt theo đề xuất của em ở các quy tắc dưới. Anh đồng ý thì đánh dấu `[x]`, không đồng ý thì sửa quy tắc tương ứng ở mục 3.
- [x] R-10: `time_budget` chỉ nhận bội số 30 phút (không cho bước nhỏ hơn).
- [x] R-21: Engine không xáo trộn; việc xáo thứ tự hiển thị (`sequence`, `drag_sort`) do tầng UI làm.
- [x] R-24: `retry` không giới hạn số lần; số lần retry được ghi lại để làm tín hiệu cho F6.

## 7. Lịch sử thay đổi
| Version | Ngày | Thay đổi | Lý do |
|---|---|---|---|
| 1 | 2026-11-02 | Bản nháp đầu | — |
| 2 | 2026-11-02 | Viết lại theo STANDARD.md: thêm hợp đồng đáp án cho 6 loại task, tách rawDelta/appliedDelta, chốt thứ tự chặn, bảng chuyển trạng thái, mã lỗi, conformance vectors | Bản 1 có 8 chỗ mơ hồ dẫn tới các bản implement khác nhau (xem trả lời trong hội thoại 2026-11-02) |
| 2 | 2026-11-02 | §5: Vitest → `node:test` (không đổi phần quy phạm) | Repo chỉ có một test runner; xem ADR-001 |
