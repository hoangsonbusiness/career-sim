---
id: SPEC-007
title: Hoạt cảnh mini-game trong thế giới 2D
version: 2
status: implemented
features: [F3]
owns: [src/game/minigames/**]
owner: anh Son
created: 2026-11-03
approved_hash: 8747c30f0440e099
approved_by: Son
approved_at: 2026-11-03
---

# SPEC-007 — Hoạt cảnh mini-game

> Viết theo specs/STANDARD.md. Mục 2–4 là phần quy phạm.

## 1. Bối cảnh & lý do
SPEC-006 (bước 1) mở mỗi việc bằng một bảng HTML phủ gần kín màn hình: đoạn dẫn, câu lệnh, danh sách nút. Người chơi rời khỏi thế giới game mỗi khi làm việc. Bước 2 thay bảng đó bằng **hoạt cảnh riêng cho từng loại việc**, diễn ra ngay trong cảnh:

| Loại | Hoạt cảnh |
|---|---|
| `sequence` | Bảng đen hiện lên; các thẻ hoạt động viết phấn; **kéo thẻ** để xếp thứ tự |
| `choice` | NPC nói trong **bong bóng thoại trên đầu**; các lựa chọn hiện như lời thoại của nhân vật chính ở khung thoại dưới màn hình (kiểu game nhập vai) |
| `drag_sort` | Hai **khay tài liệu** có nhãn; các tờ nhận xét bay ra; **kéo tờ vào khay** |
| `spot_error` | **Tờ bài kiểm tra** phóng to; chạm vào dòng nào thì **bút đỏ khoanh** dòng đó |
| `dialogue` | Bong bóng thoại lần lượt trên đầu NPC và nhân vật chính; chọn câu đáp ở khung thoại |
| `time_budget` | **Thanh thời gian buổi tối** gồm các ô 30 phút; chạm vào hoạt động để tô ô thời gian bằng màu của hoạt động đó |

Logic chấm điểm và bản nháp đáp án vẫn là engine SPEC-002 và controller SPEC-005; spec này chỉ đổi cách hiển thị và thao tác. Hoạt cảnh là lớp HTML/CSS gắn theo vị trí nhân vật trên canvas (không vẽ bằng Phaser) để dùng được bằng bàn phím, trình đọc màn hình và test được.

## 2. Phạm vi
- Trong phạm vi: 6 hoạt cảnh trên; camera tiến lại gần khi bắt đầu việc; bong bóng thoại bám theo vị trí NPC; kéo thả bằng chuột và chạm; thao tác thay thế bằng bàn phím; các hàm thuần cho bố cục và kéo thả.
- Ngoài phạm vi: âm thanh; hoạt cảnh nhân vật (khung hình đi bộ); thay đổi nội dung nghề; thay đổi chấm điểm; nghề khác.

## 3. Thiết kế

### 3.1 Thuật ngữ
- **Điểm neo**: toạ độ màn hình (px, gốc góc trên trái khung game) của đỉnh đầu một nhân vật.
- **Khung thoại**: dải ở đáy màn hình chứa các lựa chọn của nhân vật chính.

### 3.2 Hợp đồng API

```ts
// src/game/minigames/layout.ts — hàm thuần
export interface Rect { x: number; y: number; w: number; h: number }

/** Vị trí bong bóng thoại: phía trên điểm neo, căn giữa theo x, kẹp trong khung (R-3). */
export function bubbleRect(anchor: { x: number; y: number }, size: { w: number; h: number }, frame: { w: number; h: number }, margin: number): Rect;

/** Chỉ số chèn khi thả thẻ: số thẻ (trừ thẻ đang kéo) có tâm y nhỏ hơn y thả (R-6). */
export function dropIndex(centersY: number[], dragged: number, dropY: number): number;

/** Ô thời gian: mảng dài budget/30, mỗi ô là chỉ số activity hoặc null, tô theo thứ tự activity (R-10). */
export function timeSlots(minutes: number[], budgetMin: number): (number | null)[];

/** Khay chứa của một điểm thả, hoặc null nếu không rơi vào khay nào (R-8). */
export function hitBucket(point: { x: number; y: number }, buckets: Rect[]): number | null;
```

```ts
// Bổ sung GameHandle (src/game/scene.ts)
anchorOf(npcId: string | null): { x: number; y: number } | null;   // R-2
focusOn(target: { x: number; y: number } | null): void;            // R-1
```

### 3.3 Quy tắc hành vi

**Chung**
- R-1. Khi mở một việc (mode `task`), camera PHẢI dịch tới trung điểm giữa người chơi và target và phóng to thêm 1 mức (zoom + 1, tối đa 5) trong 300 ms; khi rời mode `task`/`result`, camera trở lại bám người chơi ở mức zoom cũ. Khi `prefers-reduced-motion`, đổi ngay không hoạt cảnh.
- R-2. `anchorOf(id)` trả về điểm neo của NPC `id` (hoặc người chơi khi `null`) theo camera hiện tại; NPC không có trên bản đồ hiện tại → `null`.
- R-3. `bubbleRect`: `x = anchor.x − w/2`, `y = anchor.y − h − margin`; sau đó kẹp `x` vào `[margin, frame.w − w − margin]` và `y` vào `[margin, frame.h − h − margin]`. Khi `w + 2·margin > frame.w` thì `x = margin` (tương tự cho `y`).
- R-4. Mỗi hoạt cảnh PHẢI hiển thị `prompt` dạng tiêu đề một dòng (cắt bằng dấu `…` nếu dài hơn khung), nút 📖 (giữ SPEC-006 R-12), và nút "Xong" (thay "Nộp") bật/tắt theo `canSubmit` của SPEC-005. `narrative` hiện trong bong bóng thoại của NPC của segment (hoặc của nhân vật chính khi segment không có NPC), tối đa 3 dòng, có nút "…" để mở hết.
- R-5. Mọi thao tác kéo thả PHẢI có thao tác thay thế bằng bàn phím: phần tử kéo được nhận focus bằng `Tab`; `Space`/`Enter` nhấc lên hoặc thả xuống; mũi tên dời vị trí hoặc đổi khay; `Escape` hủy. Mỗi lần dời, vùng `aria-live="polite"` đọc vị trí mới (ví dụ "Thẻ 2 trên 5").

**Từng hoạt cảnh** (mỗi thao tác gọi `update` của controller SPEC-005 với đúng action)
- R-6. `sequence` (bảng đen): thẻ theo thứ tự `draft.order`, xếp dọc. Thả thẻ đang kéo ở toạ độ `y` → `move { from, to: dropIndex(...) }`. `dropIndex` = số phần tử `i ≠ dragged` có `centersY[i] < dropY`.
- R-7. `choice`: bong bóng NPC chứa `narrative`; khung thoại liệt kê `options[].text` theo thứ tự file, mỗi lựa chọn một nút; chọn → `pick`, lựa chọn đang chọn có viền vàng.
- R-8. `drag_sort` (khay): các tờ hiện theo `displayOrder` (SPEC-005 R-1) ở hàng trên; hai khay ở dưới, nhãn là `buckets`. `hitBucket` trả về chỉ số khay đầu tiên chứa điểm, với điểm thuộc khay khi `x ≤ px < x + w` và `y ≤ py < y + h`. Thả tờ: `hitBucket` khác `null` → `place { item, bucket }`; `null` → tờ trở về chỗ cũ, draft không đổi. Tờ đã xếp nằm trong khay của nó, kéo ra được để đổi khay.
- R-9. `spot_error` (tờ bài): tờ giấy kẻ dòng, mỗi dòng `document` là một vùng chạm. Chạm → `toggle { line }`; dòng nằm trong `draft.lines` có nét khoanh đỏ vẽ trong 250 ms (hiện ngay khi reduced motion).
- R-10. `time_budget` (thanh thời gian): một thanh gồm `budget_min/30` ô; `timeSlots` tô ô từ trái sang phải: `minutes[0]/30` ô đầu cho activity 0, tiếp theo activity 1, …, còn lại `null` (ô trống). Mỗi activity là một thẻ có màu riêng và hai nút "−"/"+" (→ `sub`/`add`). Dưới thanh hiện "Còn <remainingMinutes> phút".
- R-11. `dialogue`: lượt `t` hiện `npc_line` trong bong bóng NPC; khung thoại liệt kê các `replies` của lượt kế tiếp; chọn → `reply`, câu đã chọn hiện thành bong bóng của nhân vật chính trong 1200 ms rồi sang lượt sau. Khi đủ lượt, nút "Xong" bật.

**Kết quả**
- R-12. Sau khi nộp, hoạt cảnh đóng; kết quả (mode `result`) hiện trong bong bóng NPC: dòng "Chính xác!"/"Chưa đúng" (khi `success ≠ null`) và `feedback[0]`; nút "Làm lại"/"Tiếp tục" ở khung thoại. Biểu cảm và số bay lên giữ như SPEC-006 R-13.

### 3.4 Bảng chuyển trạng thái
Giữ bảng mode của SPEC-006. Hoạt cảnh chỉ tồn tại trong mode `task`.

### 3.5 Lỗi
Không có lỗi mới. Thao tác không hợp lệ đã được controller bỏ qua (SPEC-005 R-3).

### 3.6 Conformance vectors
`tests/spec-007/vectors.json`: các ca `bubbleRect`, `dropIndex`, `timeSlots`, `hitBucket`. Ví dụ: `timeSlots([60,30,0], 120)` = `[0,0,1,null]`; `dropIndex([10,30,50,70], 0, 55)` = `2`.

## 4. Tiêu chí chấp nhận

| ID | Given | When | Then |
|---|---|---|---|
| AC-007-01 | `tests/spec-007/vectors.json` | Chạy toàn bộ vector | 100% đạt |
| AC-007-02 | anchor (100, 80), size 60×20, frame 200×150, margin 4 | `bubbleRect` | `{x:70, y:56, w:60, h:20}` |
| AC-007-03 | anchor (5, 10), size 60×20, frame 200×150, margin 4 | `bubbleRect` | `{x:4, y:4, w:60, h:20}` |
| AC-007-04 | `centersY = [10,30,50,70]` | `dropIndex(c, 0, 55)`; `dropIndex(c, 3, 0)`; `dropIndex(c, 1, 100)` | `2`; `0`; `3` |
| AC-007-05 | Thẻ 0 của `["X","Z","Y"]` thả ở vị trí `dropIndex = 2` | `update(move {from:0,to:2})` | `order = ["Z","Y","X"]` |
| AC-007-06 | `minutes = [60,30,0]`, budget 120 | `timeSlots` | `[0,0,1,null]` |
| AC-007-07 | `minutes = [0,0]`, budget 90 | `timeSlots` | `[null,null,null]` |
| AC-007-08 | Khay `[{0,0,50,50},{60,0,50,50}]` | `hitBucket` tại (70,10); (55,10); (0,0) | `1`; `null`; `0` |
| AC-007-09 | Mã nguồn `src/game/minigames/stages.tsx` | Tìm chuỗi | Có đủ 6 thành phần hoạt cảnh (`data-minigame="sequence"`, `"choice"`, `"drag_sort"`, `"spot_error"`, `"dialogue"`, `"time_budget"`) |
| AC-007-10 | Bản build | Tổng gzip chunk game | ≤ 614400 byte (giữ SPEC-006 R-17) |

## 5. Ghi chú kiểm thử
- `node:test`; `layout.ts` thuần, không mock.
- Hoạt cảnh (kéo thả, nét khoanh đỏ, camera) chưa có test tự động vì cần trình duyệt; em chơi thử trên preview từng hoạt cảnh, cả bằng chuột và bằng bàn phím, ghi kết quả vào commit. Anh Son chơi thử để đánh giá cảm giác (như BUG-004).
- AC-007-09 chỉ chứng minh 6 hoạt cảnh có trong mã nguồn, không chứng minh chúng chạy đúng. Từ v2, game (SPEC-014) không còn dùng hoạt cảnh nên bản build không chứa chúng.

## 6. Câu hỏi mở
Em đã chốt theo đề xuất ở các quy tắc dưới. Anh đồng ý thì đánh `[x]`, không đồng ý thì sửa quy tắc tương ứng ở mục 3.
- [x] Bối cảnh: hoạt cảnh làm bằng HTML/CSS gắn theo vị trí nhân vật trên canvas (dùng được bằng bàn phím, test được), không vẽ bằng Phaser.
- [x] Bảng ở mục 1: thiết kế 6 hoạt cảnh (bảng đen, bong bóng thoại, khay tài liệu, bút đỏ khoanh, thanh thời gian).
- [x] R-1: camera tiến lại gần (zoom thêm 1 mức) khi bắt đầu việc.
- [x] R-4: `narrative` hiện tối đa 3 dòng trong bong bóng, có nút "…" để đọc hết.
- [x] R-5: mọi kéo thả có thao tác thay thế bằng bàn phím.

## 7. Lịch sử thay đổi
| Version | Ngày | Thay đổi | Lý do (BUG/ADR nếu có) |
|---|---|---|---|
| 1 | 2026-11-03 | Bản nháp đầu | Bước 2 của SPEC-006: thay bảng task phủ màn hình bằng hoạt cảnh trong cảnh |
| 2 | 2026-11-03 | AC-007-09 kiểm 6 hoạt cảnh trong mã nguồn thay vì trong bản build | SPEC-014 / ADR-005: game bỏ quiz, không còn đóng gói mini-game |
