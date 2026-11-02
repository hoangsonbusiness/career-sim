---
id: SPEC-005
title: Màn chơi "một ngày làm nghề" trên trình duyệt
version: 1
status: approved
features: [F3]
owns: [src/sim/**, src/app/nghe/[id]/mot-ngay/**]
owner: anh Son
created: 2026-11-02
approved_hash: 5b82ebb024438d5e
approved_by: Son
approved_at: 2026-11-02
---

# SPEC-005 — Màn chơi một ngày

> Viết theo specs/STANDARD.md. Mục 2–4 là phần quy phạm.

## 1. Bối cảnh & lý do
Engine SPEC-002 đã chấm điểm và quản lý vòng đời một ngày, nhưng chưa có giao diện. Spec này đưa engine lên trình duyệt tại `/nghe/<id>/mot-ngay/` để học sinh chơi trọn một ngày.

**Đổi so với PRD mục 7:** PRD ghi dùng Phaser cho mini-game. Spec này đề xuất làm 6 mini-game bằng **React + HTML thường** cho bản demo (xem câu hỏi mở và ADR-003 sẽ viết khi implement):
- cả 6 loại task đều là thao tác chọn, sắp xếp, bấm; không cần vẽ đồ họa hay vật lý;
- Phaser là một engine game đầy đủ, thêm vào sẽ chiếm phần lớn ngân sách JS 300 KB của PRD (chưa đo; sẽ đo nếu chọn Phaser);
- HTML dùng được bằng bàn phím và trình đọc màn hình, test được không cần canvas.
Nếu sau này cần hoạt cảnh, có thể thêm Phaser cho từng scene mà không đổi engine.

Mọi logic giao diện (bản nháp đáp án, thứ tự hiển thị, điều kiện bật nút Nộp) nằm trong module thuần `src/sim/controller.ts`, test được không cần trình duyệt. Component React chỉ hiển thị trạng thái và chuyển thao tác của người chơi vào controller và engine.

## 2. Phạm vi
- Trong phạm vi: controller thuần cho 6 loại task; thứ tự hiển thị tất định cho `sequence` và `drag_sort`; trang `/nghe/<id>/mot-ngay/` cho mọi nghề có `day_simulation`; hiển thị 5 phase của engine; thanh chỉ số; đo `durationMs`.
- Ngoài phạm vi: lưu tiến trình hay câu trả lời phản tư vào localStorage (REF / F7); âm thanh; hoạt cảnh; Phaser; kéo thả bằng chuột (thay bằng nút chọn); test E2E bằng trình duyệt thật (hạng mục E2E).

## 3. Thiết kế

### 3.1 Thuật ngữ
- **Bản nháp (draft)**: đáp án người chơi đang soạn cho segment hiện tại, chưa nộp.
- **Vị trí hiển thị**: thứ tự phần tử trên màn hình, khác thứ tự trong file.

### 3.2 Hợp đồng API

```ts
// src/sim/controller.ts — module thuần
import type { Answer, StatMap } from "../engine/index.ts";

export type Task = /* task của một segment, đọc từ file nghề */;

export type Draft =
  | { type: "sequence"; order: string[] }                 // các bước theo vị trí hiển thị hiện tại
  | { type: "choice"; option: number | null }
  | { type: "drag_sort"; placement: (string | null)[] }    // chỉ số = chỉ số items trong file
  | { type: "spot_error"; lines: number[] }               // luôn tăng dần, không trùng
  | { type: "dialogue"; replies: number[] }                // replies[t] cho lượt t, độ dài = số lượt đã trả lời
  | { type: "time_budget"; minutes: number[] };

export type Action =
  | { kind: "move"; from: number; to: number }            // sequence
  | { kind: "pick"; option: number }                      // choice
  | { kind: "place"; item: number; bucket: string }       // drag_sort
  | { kind: "toggle"; line: number }                      // spot_error
  | { kind: "reply"; turn: number; reply: number }        // dialogue
  | { kind: "add" | "sub"; activity: number };            // time_budget

/** Hoán vị chỉ số hiển thị cho n phần tử của segment. */
export function displayOrder(segmentId: string, n: number): number[];
export function initialDraft(segmentId: string, task: Task): Draft;
export function update(task: Task, draft: Draft, action: Action): Draft;
export function canSubmit(task: Task, draft: Draft): boolean;
export function toAnswer(task: Task, draft: Draft): Answer;   // chỉ gọi khi canSubmit = true
export function remainingMinutes(task: Task, draft: Draft): number;   // chỉ cho time_budget
export function formatDelta(delta: StatMap, stats: { id: string; label: string }[]): string[];
```

### 3.3 Quy tắc hành vi

**Thứ tự hiển thị** (`displayOrder`)
- R-1. `displayOrder(segmentId, n)` PHẢI là hàm tất định trả về một hoán vị của `[0..n-1]`, tính như sau:
  1. `key(i) = fmix32(fnv1a32(utf8(segmentId + "|" + i)))`, trong đó `fnv1a32` là FNV-1a 32 bit (offset `0x811c9dc5`, prime `0x01000193`) trên các byte UTF-8, `i` viết dạng thập phân, và `fmix32` là hàm trộn cuối của MurmurHash3 (`h ^= h>>>16; h = h*0x85ebca6b; h ^= h>>>13; h = h*0xc2b2ae35; h ^= h>>>16`, mọi phép tính theo 32 bit không dấu).
  2. Sắp `[0..n-1]` tăng dần theo `key(i)`; bằng nhau thì theo `i` tăng dần.
  3. Nếu kết quả là hoán vị đồng nhất và `n ≥ 2`: xoay trái một bước (phần tử đầu chuyển xuống cuối).

  *Lý do: engine không xáo (SPEC-002 R-21), tầng UI xáo; xáo tất định thì mọi người chơi thấy cùng một đề, test được, và không bao giờ hiện sẵn đáp án đúng.*

**Bản nháp** (`initialDraft`, `update`)
- R-2. `initialDraft`:
  - `sequence`: `order[k] = steps[displayOrder(segId, steps.length)[k]]`.
  - `choice`: `option = null`.
  - `drag_sort`: `placement` = mảng `null` dài bằng `items`.
  - `spot_error`: `lines = []`.
  - `dialogue`: `replies = []`.
  - `time_budget`: `minutes` = mảng `0` dài bằng `activities`.
- R-3. `update` PHẢI trả về draft mới và KHÔNG ĐƯỢC sửa draft cũ. Action không đúng loại task, hoặc vi phạm điều kiện dưới đây, PHẢI trả về draft bằng (so sánh sâu) draft cũ.
  - `move`: `from`, `to` là số nguyên trong `[0, order.length − 1]`; lấy phần tử ở `from` ra rồi chèn vào vị trí `to`.
  - `pick`: `option` là số nguyên trong `[0, options.length − 1]`; ghi đè lựa chọn cũ.
  - `place`: `item` trong `[0, items.length − 1]`, `bucket` thuộc `buckets`; ghi đè.
  - `toggle`: `line` trong `[0, document.length − 1]`; có thì bỏ, chưa có thì thêm; kết quả sắp tăng dần.
  - `reply`: `turn` PHẢI bằng `replies.length` (chỉ trả lời lượt kế tiếp), `reply` trong `[0, turns[turn].replies.length − 1]`; thêm vào cuối. *Lý do: hội thoại diễn ra tuần tự, không sửa câu đã nói.*
  - `add`: chỉ khi `remainingMinutes ≥ 30`; tăng `minutes[activity]` thêm 30. `sub`: chỉ khi `minutes[activity] ≥ 30`; giảm 30.
- R-4. `remainingMinutes = budget_min − tổng minutes`.
- R-5. `canSubmit`: `sequence`, `spot_error`, `time_budget` → luôn `true`; `choice` → `option ≠ null`; `drag_sort` → không còn `null`; `dialogue` → `replies.length = turns.length`.
- R-6. `toAnswer` PHẢI trả đáp án theo hợp đồng `Answer` của SPEC-002, cùng tên trường với draft (`option`, `placement` đã đủ, các mảng còn lại giữ nguyên).

**Hiển thị kết quả** (`formatDelta`)
- R-7. `formatDelta` PHẢI duyệt `stats` theo thứ tự khai báo; với mỗi stat có khóa trong `delta` và giá trị khác 0, sinh chuỗi `"<label> +<n>"` khi dương, `"<label> -<n>"` khi âm (`n` là trị tuyệt đối). Khóa không thuộc `stats` hoặc bằng 0 bị bỏ.

**Trang `/nghe/<id>/mot-ngay/`**
- R-8. Trang PHẢI được sinh tĩnh cho đúng các nghề có `day_simulation`, và KHÔNG ĐƯỢC sinh cho nghề khác (`dynamicParams = false`). Trang PHẢI có `<html lang="vi">` và đúng một `<h1>` với nội dung `"Một ngày làm " + name`.
- R-9. Dữ liệu `day_simulation` PHẢI được truyền vào component client qua props lúc build; trang KHÔNG ĐƯỢC tải file nội dung lúc chạy (giữ SPEC-003 R-16).
- R-10. Component PHẢI tạo engine bằng `createEngine` của SPEC-002 và chỉ đổi phase qua `start`, `submit`, `retry`, `next`, `finish`. Mọi số hiển thị (chỉ số, delta, feedback) PHẢI lấy từ `engine.state()` hoặc kết quả `submit`.
- R-11. Nội dung theo phase (chuỗi trong ngoặc kép là chính xác):

  | Phase | Hiển thị | Nút |
  |---|---|---|
  | intro | `persona`, `setting`, thanh chỉ số | "Bắt đầu ngày làm việc" → `start()` |
  | segment | `"<time> (giờ minh họa)"`, `title`, `narrative`, `basis.text` kèm trích dẫn như SPEC-004 R-12, `prompt`, giao diện task, thanh chỉ số, `"Phần <i+1>/<số segment>"` | "Nộp" (tắt khi `canSubmit = false`) → `submit(toAnswer(task, draft), { durationMs })` |
  | feedback | `success = true` → "Chính xác!", `false` → "Chưa đúng", `null` → không hiện dòng này; danh sách `formatDelta(appliedDelta)`; từng dòng `feedback`; thanh chỉ số | "Làm lại" → `retry()`; "Tiếp tục" → `next()` |
  | reflection | Tiêu đề "Nhìn lại một ngày", danh sách `reflection_questions` (bỏ qua nếu không có) | "Kết thúc ngày" → `finish()` |
  | done | Tiêu đề "Kết thúc một ngày", thanh chỉ số cuối ngày, số phần đã chơi | Link "Về hồ sơ nghề" → `/nghe/<id>/` |

- R-12. Giao diện task (thứ tự phần tử theo draft hoặc `displayOrder`):
  - `sequence`: danh sách theo `draft.order`; mỗi dòng có nút "Lên" (→ `move` tới vị trí trên) và "Xuống"; nút ở biên bị tắt.
  - `choice`: nhóm radio theo thứ tự `options` trong file.
  - `drag_sort`: items theo `displayOrder(segId, items.length)`; mỗi item có một nút cho mỗi bucket, nút đang chọn có `aria-pressed="true"`.
  - `spot_error`: mỗi dòng `document` là một nút bật/tắt với `aria-pressed`.
  - `dialogue`: hiện lời NPC của lượt `0..replies.length` và câu trả lời đã chọn; chỉ lượt kế tiếp có nút chọn reply.
  - `time_budget`: mỗi activity có nút "−30" và "+30" (tắt theo R-3), số phút hiện tại, và dòng `"Còn lại <remainingMinutes> phút"`.
- R-13. Thanh chỉ số: mỗi stat theo thứ tự khai báo hiện `label`, giá trị số, và một `<progress max="100" value="<giá trị>">`.
- R-14. `durationMs` = `Math.round(t_nộp − t_hiện)`, trong đó `t_hiện` lấy lúc segment hiện ra (kể cả sau `retry`) và `t_nộp` lúc bấm "Nộp", cả hai từ `performance.now()`; giá trị âm được đổi thành 0. *Lý do: tín hiệu thời gian cho F6; đồng hồ chỉ dùng ở component, controller và engine vẫn thuần.*
- R-15. Khi chuyển segment hoặc `retry`, draft PHẢI được đặt lại bằng `initialDraft`.
- R-16. Tổng gzip (mức 9) các `<script src>` của `out/nghe/giao-vien-thpt/mot-ngay/index.html` PHẢI ≤ 307200 byte.

### 3.4 Bảng chuyển trạng thái
Phase do engine quản lý theo SPEC-002 bảng 3.4. Component chỉ hiện các nút hợp lệ của phase hiện tại (R-11), vì vậy không gọi thao tác ILLEGAL_STATE.

### 3.5 Lỗi
Controller không ném lỗi: action không hợp lệ trả về draft cũ (R-3). Lỗi của engine (`INVALID_ANSWER`, `ILLEGAL_STATE`) không xảy ra khi tuân thủ R-5, R-6, R-11; nếu xảy ra thì là lỗi lập trình và để nổi lên (không bắt).

### 3.6 Conformance vectors
`tests/spec-005/vectors.json`: các ca `displayOrder` và chuỗi action → draft mong đợi, dùng fixture `tests/fixtures/mini-profession.json`. Ca mẫu đã tính bằng bản tham chiếu:

| segmentId | n | displayOrder |
|---|---|---|
| `seq` | 3 | `[0,2,1]` |
| `drg` | 3 | `[1,0,2]` |
| `s1-soan-bai` | 5 | `[3,4,2,0,1]` |
| `x` | 1 | `[0]` |
| `x` | 0 | `[]` |
| `a` | 2 | `[1,0]` |

## 4. Tiêu chí chấp nhận

| ID | Given | When | Then |
|---|---|---|---|
| AC-005-01 | Bảng ở 3.6 | `displayOrder` | Đúng từng giá trị trong bảng |
| AC-005-02 | Mọi segment của mọi nghề có `day_simulation` trong `content/` với n ≥ 2 | `displayOrder(seg.id, n)` | Là hoán vị của `[0..n-1]` và khác hoán vị đồng nhất |
| AC-005-03 | Fixture, segment `seq` | `initialDraft` | `order = ["X","Z","Y"]` |
| AC-005-04 | Draft sequence `["X","Z","Y"]` | `move {from:2,to:1}`; rồi `move {from:0,to:3}` | Lần 1 `["X","Y","Z"]`; lần 2 draft không đổi |
| AC-005-05 | Segment `cho` | `pick 1`, `pick 0`, `pick 2` | `option` lần lượt `1`, `0`, `0` (lần 3 không đổi); `canSubmit` trước khi pick = `false` |
| AC-005-06 | Segment `drg` | `place {item:0,bucket:"L"}`, `place {item:1,bucket:"Q"}` | Sau lần 1 `placement = ["L",null,null]`, `canSubmit = false`; lần 2 không đổi |
| AC-005-07 | Segment `spt` | `toggle 3`, `toggle 1`, `toggle 3`, `toggle 4` | `lines` lần lượt `[3]`, `[1,3]`, `[1]`, `[1]` |
| AC-005-08 | Segment `dlg` | `reply {turn:1,reply:0}`, `reply {turn:0,reply:1}`, `reply {turn:1,reply:1}` | `replies` lần lượt `[]`, `[1]`, `[1,1]`; `canSubmit` cuối = `true` |
| AC-005-09 | Segment `tbd` (budget 90) | `add 0` ×3, `add 1`, `sub 1`, `sub 0` | `minutes` sau từng bước: `[30,0]`, `[60,0]`, `[90,0]`, `[90,0]`, `[90,0]`, `[60,0]`; `remainingMinutes` cuối = 30 |
| AC-005-10 | Một draft bất kỳ | `update` | Đối tượng draft truyền vào không bị đổi (so sánh sâu trước/sau) |
| AC-005-11 | Mỗi segment của fixture với draft đã đủ | `engine.submit(toAnswer(...))` | Không ném lỗi |
| AC-005-12 | `delta = {b:-5, a:10, z:3, c:0}`, stats `[a "A", b "B", c "C"]` | `formatDelta` | `["A +10", "B -5"]` |
| AC-005-13 | `tests/spec-005/vectors.json` | Chạy toàn bộ vector | 100% đạt |
| AC-005-14 | Bản build | Liệt kê `out/nghe/*/mot-ngay/index.html` | Đúng tập `id` có `day_simulation`; trang giáo viên có `<html lang="vi"`, đúng một `<h1>` = "Một ngày làm Giáo viên Trung học phổ thông", và nút "Bắt đầu ngày làm việc" |
| AC-005-15 | Bản build | Tìm `content/professions` trong `out/**/*.js` | Không có (giữ AC-003-14) |
| AC-005-16 | Bản build | Tổng gzip `<script src>` của trang màn chơi giáo viên | ≤ 307200 byte |

## 5. Ghi chú kiểm thử
- `node:test`; controller test thuần, không mock. AC-005-11 dùng engine thật.
- AC-005-14..16 kiểm tra HTML bản build. HTML tĩnh chỉ chứa phase `intro`; các phase sau chạy trên trình duyệt.
- Tương tác thật trên trình duyệt (bấm qua đủ 7 segment) chưa có test tự động vì E2E là hạng mục riêng; khi implement em chạy thử bằng preview và ghi kết quả vào commit.

## 6. Câu hỏi mở
Em đã chốt theo đề xuất ở các quy tắc dưới. Anh đồng ý thì đánh `[x]`, không đồng ý thì sửa quy tắc tương ứng ở mục 3.
- [x] Bối cảnh: làm 6 mini-game bằng React + HTML thay vì Phaser cho bản demo (lệch PRD mục 7; ghi ADR-003).
- [x] R-1: đề xáo theo công thức cố định, mọi người chơi cùng một nghề thấy cùng thứ tự.
- [x] R-3: hội thoại chỉ trả lời tuần tự, không quay lại sửa câu đã chọn (muốn sửa thì nộp xong bấm "Làm lại").
- [x] Ngoài phạm vi: câu hỏi phản tư chỉ hiển thị, chưa có ô trả lời và chưa lưu (để hạng mục REF làm).

## 7. Lịch sử thay đổi
| Version | Ngày | Thay đổi | Lý do (BUG/ADR nếu có) |
|---|---|---|---|
| 1 | 2026-11-02 | Bản nháp đầu | Hạng mục SIM trong ROADMAP |
