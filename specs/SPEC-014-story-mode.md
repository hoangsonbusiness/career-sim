---
id: SPEC-014
title: Chế độ "xem và nghe kể" — bỏ quiz khỏi game một ngày làm nghề
version: 2
status: implemented
features: [F3]
owns: [src/game/story.ts, src/game/GamePlayer.tsx, src/game/scene.ts, src/game/types.ts]
owner: anh Son
created: 2026-11-03
approved_hash: 60b806c79d361167
approved_by: Son
approved_at: 2026-11-03
---

# SPEC-014 — Chế độ "xem và nghe kể"

> Viết theo specs/STANDARD.md. Mục 2–4 là phần quy phạm.

## 1. Bối cảnh & lý do
Hiện tại, trong game thế giới 2D (SPEC-006, SPEC-007), mỗi phần của một ngày là một bài có đáp án đúng/sai: sắp thứ tự, phân loại, tìm lỗi, chọn đáp án, trả lời hội thoại, chia thời gian. Kết quả hiện ❤️/💧 và cộng trừ chỉ số. Anh Son nhận xét như sau: học sinh **chưa biết gì về nghề** nên không thể làm đúng. Quiz biến trải nghiệm thành bài kiểm tra. Người chơi làm sai, bị trừ điểm và không hiểu được nghề trông như thế nào, trong khi mục tiêu của app là cho các em **thấy** nghề.

Quyết định (anh Son, 2026-11-03): bỏ hoàn toàn phần làm bài. Mỗi phần trong ngày chỉ còn ba bước: **đi tới chỗ làm việc → xem cảnh và nghe kể → đọc một thẻ "Ngoài đời thật" có nguồn → đi tiếp**. Không có đáp án, không có đúng/sai, không có điểm.

Những gì giữ nguyên:
- Bản đồ, di chuyển, tìm đường, tương tác, đổi bản đồ (SPEC-006 R-1..R-10, R-14..R-18).
- Engine SPEC-002 và controller SPEC-005 không đổi. Game không gọi tới chúng nữa (R-2).
- File nghề và file thế giới không đổi. Trường `task` vẫn nằm trong nội dung nhưng game không hiển thị (xem mục 6).

Những gì đổi (thay cho các quy tắc đã duyệt, cần anh duyệt lại các spec đó, xem R-12):
- SPEC-006: các mode `task` và `result` được thay bằng mode `scene`. R-11 bỏ thanh chỉ số. R-12 và R-13 không còn áp dụng. Màn `done` đổi.
- SPEC-007: game không dùng hoạt cảnh mini-game nữa.

## 2. Phạm vi
- Trong phạm vi: module thuần `src/game/story.ts` (vòng đi → cảnh → suy ngẫm → xong); mode `scene` và thẻ "Ngoài đời thật" trong `GamePlayer`; HUD và màn `done` mới; gỡ việc gọi engine, mini-game và chỉ số khỏi game; áp dụng cho mọi gói sâu (6 nghề).
- Ngoài phạm vi: sửa engine SPEC-002, controller SPEC-005 và trang biểu mẫu SPEC-005; xóa trường `task` khỏi schema và nội dung; xóa mã `src/game/minigames/**` (các test khóa của SPEC-007 vẫn import `layout.ts`); sửa `check:pack` (SPEC-008); viết lời kể mới cho nghề; âm thanh.

## 3. Thiết kế

### 3.1 Thuật ngữ
- **Cảnh (scene)**: phần trình bày một segment sau khi người chơi tương tác với target, gồm bong bóng lời kể và thẻ "Ngoài đời thật".
- **Thẻ "Ngoài đời thật"**: hộp hiện `basis.text` của segment, nhãn mức tin cậy và mã nguồn.

### 3.2 Hợp đồng API

`src/game/story.ts` (thuần, không React, không Phaser, không đồng hồ):

```ts
export type StoryMode = "intro" | "walk" | "scene" | "reflection" | "done";

export interface StoryState {
  mode: StoryMode;
  index: number;          // segment hiện tại, 0..total-1; ở reflection/done giữ = total-1
  total: number;          // số segment, ≥ 1
  question: number;       // câu suy ngẫm hiện tại, 0..questions-1; ngoài reflection = 0
  questions: number;      // số reflection_questions, ≥ 0
  seen: number[];         // index các segment đã xem cảnh, theo thứ tự xem, không trùng
}

export type StoryAction = "start" | "interact" | "continue";

export function createStory(total: number, questions: number): StoryState;   // R-1
export function reduce(s: StoryState, a: StoryAction): StoryState;           // R-3, bảng 3.4
```

`quest.ts` giữ `canInteract`. `GameMode` của SPEC-006 được thay bằng `StoryMode`.

### 3.3 Quy tắc hành vi

**Logic thuần (`story.ts`)**
- R-1. `createStory(total, questions)` trả về `{ mode: "intro", index: 0, total, question: 0, questions, seen: [] }`. Nếu `total` không phải số nguyên ≥ 1, hoặc `questions` không phải số nguyên ≥ 0, PHẢI ném lỗi `code: "INVALID_STORY"`.
- R-2. Game KHÔNG ĐƯỢC gọi `createEngine`, `submit`, `retry` hay bất kỳ hàm nào của controller SPEC-005. Game cũng KHÔNG ĐƯỢC import `src/game/minigames/**`. *Lý do: bỏ chấm điểm tận gốc, không để sót đường nào dẫn tới đúng/sai.*
- R-3. `reduce` là hàm thuần. Nó KHÔNG ĐƯỢC sửa `s` mà trả về object mới theo bảng 3.4. Cặp (mode, action) không có trong bảng thì trả về **chính `s`** (cùng tham chiếu, không ném lỗi). *Lý do: thống nhất với SPEC-006 mục 3.4, thao tác lạ bị bỏ qua.*

**Cảnh (`scene`)**
- R-4. Khi vào `scene`, game PHẢI hiện bong bóng chứa `narrative` của segment phía trên NPC của segment, hoặc phía trên nhân vật chính nếu segment không có `npc`.
- R-5. Cùng lúc đó, game PHẢI hiện thẻ "Ngoài đời thật" ở dưới màn hình, gồm đúng các phần sau:
  - tiêu đề "Ngoài đời thật";
  - `basis.text`;
  - nhãn tin cậy: `verified` → "Đã kiểm chứng", `single_source` → "Một nguồn", `needs_verification` → "⚠ Cần kiểm chứng thêm";
  - các mã `source_ids` (ví dụ "S7"); bấm vào một mã thì mở phần trích dẫn của nguồn đó (cùng nội dung với nút 📖 hiện có);
  - một nút "Tiếp tục".
  
  *Lý do: lời kể là hư cấu (CLAUDE.md R6), còn thẻ này cho các em biết việc đó có thật trong nghề và nguồn nằm ở đâu.*
- R-6. Ở `scene`, game KHÔNG ĐƯỢC hiện bất kỳ nội dung nào lấy từ `task` (`prompt`, lựa chọn, `feedback`, `effect`). Game cũng KHÔNG ĐƯỢC hiện các chữ "Chính xác", "Chưa đúng", "Làm lại", hay biểu cảm ❤️/💧.
- R-7. Bấm "Tiếp tục" (hoặc phím `Space`/`Enter`/`E`) → `reduce(s, "continue")`. Nếu segment kế nằm ở bản đồ khác thì áp dụng SPEC-006 R-10 (mờ dần, đổi bản đồ).

**HUD và màn kết**
- R-8. HUD hiện ở `walk` và `scene`, chỉ gồm `"~<time>"` và `"Phần <index+1>/<total>"`. KHÔNG ĐƯỢC hiện thanh chỉ số. *Lý do: không còn điểm để hiện. Con số cho một ngày hư cấu cũng dễ bị hiểu nhầm là dữ kiện.*
- R-9. Màn `done` PHẢI gồm: tiêu đề "Hết một ngày làm <name>"; danh sách `title` của các segment theo thứ tự trong `seen`; link "Về hồ sơ nghề" trỏ `/nghe/<id>/`; dòng "Hình ảnh: Kenney.nl (CC0)" (giữ SPEC-006 R-18). Màn này KHÔNG ĐƯỢC hiện điểm hay chỉ số.
- R-10. Màn `reflection` giữ cách hiển thị của SPEC-006 (từng câu trong bong bóng, nút "Tiếp"). Mỗi lần bấm "Tiếp" → `reduce(s, "continue")`.

**Áp dụng và kiểm chứng**
- R-11. Mọi gói sâu trong `content/worlds/` PHẢI chơi được trọn ngày bằng `story.ts` + `grid.ts`. Với mỗi segment: đi theo `findPath` tới `standSpots[0]` có đường, quay mặt vào, `interact`, rồi `continue`. Chạy hết ngày PHẢI kết thúc ở `done` với `seen = [0..total-1]`.
- R-12. Sau khi SPEC-014 được duyệt, SPEC-006 PHẢI lên v2 (mode và màn hình ghi trỏ sang SPEC-014) và SPEC-007 PHẢI chuyển sang `deprecated`. Trước đó, SPEC-007 lên v2: AC-007-09 kiểm hoạt cảnh trong mã nguồn thay vì bản build, vì game không còn đóng gói mini-game. Hai việc này do anh Son duyệt, agent không tự sửa phần quy phạm của hai spec đó trước khi được duyệt.

### 3.4 Bảng chuyển trạng thái (`reduce`)

| Mode | `start` | `interact` | `continue` |
|---|---|---|---|
| intro | → `walk`, `index = 0` | bỏ qua | bỏ qua |
| walk | bỏ qua | → `scene`; thêm `index` vào `seen` nếu chưa có | bỏ qua |
| scene | bỏ qua | bỏ qua | `index < total-1` → `walk`, `index + 1`; `index = total-1` và `questions > 0` → `reflection`, `question = 0`; `index = total-1` và `questions = 0` → `done` |
| reflection | bỏ qua | bỏ qua | `question < questions-1` → `question + 1`; ngược lại → `done` |
| done | bỏ qua | bỏ qua | bỏ qua |

`interact` chỉ được gửi khi `canInteract` đúng (SPEC-006 R-9). Kiểm tra đó nằm ở game, không nằm trong `reduce`.

### 3.5 Lỗi

| Hàm | Mã | Khi nào | Trạng thái |
|---|---|---|---|
| `createStory` | `INVALID_STORY` | `total` không nguyên hoặc < 1; `questions` không nguyên hoặc < 0 | Không tạo state |

### 3.6 Conformance vectors
`tests/spec-014/vectors.json`: mỗi vector gồm `{ total, questions, actions: StoryAction[], expect: StoryState }`. Ví dụ `total = 2, questions = 1`, chuỗi hành động `start, interact, continue, interact, continue, continue` → `{ mode: "done", index: 1, total: 2, question: 0, questions: 1, seen: [0, 1] }`.

## 4. Tiêu chí chấp nhận

| ID | Given | When | Then |
|---|---|---|---|
| AC-014-01 | `tests/spec-014/vectors.json` | Chạy toàn bộ vector qua `createStory` + `reduce` | 100% đạt |
| AC-014-02 | `createStory(0, 1)`; `createStory(2, -1)`; `createStory(1.5, 0)` | Gọi | Mỗi ca ném lỗi có `code = "INVALID_STORY"` |
| AC-014-03 | `createStory(3, 2)` | `reduce(s, "continue")` ở `intro`; `reduce(s, "start")` ở `walk` | Kết quả `=== s` (cùng tham chiếu) ở cả hai ca |
| AC-014-04 | State ở `scene`, `index = 2`, `total = 3`, `questions = 0` | `reduce(s, "continue")` | `mode = "done"`; `s` gốc không đổi (so sánh với bản `structuredClone` trước khi gọi) |
| AC-014-05 | State ở `walk`, `index = 1`, `seen = [0, 1]` | `reduce(s, "interact")` | `mode = "scene"`, `seen = [0, 1]` (không trùng) |
| AC-014-06 | Mọi gói sâu trong `content/worlds/` | Chạy trọn ngày theo R-11 | Mỗi nghề kết thúc `mode = "done"`, `seen` = `[0..total-1]`; mọi segment tới được target |
| AC-014-07 | Mã nguồn `src/game/**` trừ `src/game/minigames/**` | Tìm chuỗi `createEngine`, `src/engine`, `sim/controller`, `minigames/` | Không có kết quả nào |
| AC-014-08 | Mã nguồn `src/game/GamePlayer.tsx` | Tìm chuỗi `Chính xác`, `Chưa đúng`, `Làm lại`, `❤️`, `💧` | Không có kết quả nào |
| AC-014-09 | `src/game/GamePlayer.tsx` | Tìm chuỗi | Có `Ngoài đời thật`, `Đã kiểm chứng`, `Một nguồn`, `Cần kiểm chứng thêm`, `Hết một ngày làm`, `Về hồ sơ nghề`, `Kenney.nl (CC0)` |
| AC-014-10 | Bản build, trang `/nghe/<id>/mot-ngay/` của cả 6 nghề | Đọc HTML | Có nút "Bắt đầu ngày làm việc"; không `<script src>` nào chứa mã Phaser (giữ AC-006-11) |
| AC-014-11 | Khóa test của SPEC-002, 005, 006, 008 | So hash từng file với `specs/locks/` | Không file nào bị sửa hoặc xóa (SPEC-007 lên v2 cùng đợt, AC-007-09 đổi theo) |

## 5. Ghi chú kiểm thử
- `node:test`. `story.ts` là test thuần, không mock. AC-014-06 dùng lại `tests/lib/play-day.mjs` nếu hợp, nếu không thì viết helper mới trong `tests/spec-014/` (không sửa file của spec khác).
- AC-014-07..09 là test tĩnh trên mã nguồn. Phần hiển thị cảnh (bong bóng, thẻ, đổi bản đồ) em chơi thử trọn ngày ít nhất 2 nghề trên preview, chụp màn hình và ghi vào commit.
- AC-014-11 bảo đảm thay đổi không đụng tới test đã khóa (CLAUDE.md D10).

## 6. Câu hỏi mở
Em đã chốt theo đề xuất dưới đây. Anh đồng ý thì đánh `[x]`, không đồng ý thì sửa quy tắc tương ứng ở mục 3.
- [x] Bỏ hẳn chỉ số (Năng lượng, Áp lực…) khỏi game (R-8, R-9), vì không còn việc nào làm thay đổi chỉ số.
- [x] Trường `task` tạm giữ trong nội dung và schema, game chỉ bỏ qua. Việc dọn `task` khỏi schema, 6 file nghề và `check:pack` (SPEC-001, SPEC-008 R-2/R-3/R-9) để sang spec sau. *Lý do: tách nhỏ thay đổi, không phải mở khóa test của 7 spec cùng lúc.*
- [x] Mã `src/game/minigames/**` tạm giữ (test khóa SPEC-007 còn import `layout.ts`); SPEC-007 chuyển `deprecated` (R-12).
- [x] Trang biểu mẫu SPEC-005 (cho nghề chưa có bản đồ) chưa đổi, vì cả 6 nghề hiện đều có bản đồ nên trang này không còn đường vào.

## 7. Lịch sử thay đổi
| Version | Ngày | Thay đổi | Lý do (BUG/ADR nếu có) |
|---|---|---|---|
| 1 | 2026-11-03 | Bản nháp đầu | Anh Son: học sinh chưa biết nghề nên không làm được quiz; cần xem nghề chứ không phải bị kiểm tra (ADR-005) |
| 2 | 2026-11-03 | AC-014-11 bỏ SPEC-007 khỏi danh sách khóa phải giữ nguyên; R-12 thêm bước SPEC-007 v2 | Khi implement, test khóa AC-007-09 (bắt mini-game có trong bản build) mâu thuẫn với R-2; v1 bỏ sót (D6) |
