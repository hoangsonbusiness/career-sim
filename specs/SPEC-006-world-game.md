---
id: SPEC-006
title: Game thế giới 2D — đi lại và làm việc trong một ngày làm nghề
version: 1
status: approved
features: [F3]
owns: [src/game/**, content/worlds/**, schema/world.schema.json, scripts/validate-world.mjs, public/game/**]
owner: anh Son
created: 2026-11-03
approved_hash: af05c144ca09f322
approved_by: Son
approved_at: 2026-11-03
---

# SPEC-006 — Game thế giới 2D

> Viết theo specs/STANDARD.md. Mục 2–4 là phần quy phạm.

## 1. Bối cảnh & lý do
Màn chơi của SPEC-005 là biểu mẫu nhiều bước: đọc chữ rồi bấm nút. Anh Son đánh giá "full of text, không dùng nổi". Spec này thay lớp trải nghiệm bằng **một game nhập vai 2D nhìn từ trên xuống**: người chơi điều khiển nhân vật đi trong trường, tới đúng người hoặc đồ vật để làm từng việc trong ngày. Chữ giảm xuống còn một dòng nhiệm vụ và bong bóng thoại ngắn.

Những gì giữ nguyên:
- Engine SPEC-002 vẫn quản lý vòng đời ngày, chấm điểm, chỉ số.
- Controller thuần của SPEC-005 (`displayOrder`, `initialDraft`, `update`, `canSubmit`, `toAnswer`, `formatDelta`) vẫn là logic của mini-game.

Những gì đổi:
- Thêm Phaser (đảo ngược ADR-003; ghi ADR-004 khi implement).
- Mỗi nghề có thêm một **file thế giới** (`content/worlds/<id>.json`) mô tả bản đồ và vị trí từng việc. File nghề (schema SPEC-001) không đổi.
- SPEC-005 lên v2: R-11..R-13 (giao diện dạng biểu mẫu) chỉ còn áp dụng cho nghề **chưa có** file thế giới.

Asset: Kenney Roguelike Indoors + Roguelike Characters (CC0, đã tải về `assets-src/`). Hai bộ này không có ô sàn và tường; cần thêm **Kenney Roguelike/RPG pack** (CC0) cho sàn, tường, cửa. Nhân vật Kenney chỉ có một khung hình, không có khung đi bộ, vì vậy game dùng **di chuyển theo ô** kèm hiệu ứng nhún.

**Phạm vi bước 1:** chơi trọn 7 phần trong ngày của giáo viên THPT trong thế giới 2D, mỗi loại task hiện dưới dạng một bảng trong game. Bước 2 (spec sau) làm hoạt cảnh riêng cho từng mini-game (bút đỏ khoanh lỗi trên tờ bài, kéo thẻ lên bảng…).

## 2. Phạm vi
- Trong phạm vi: định dạng và kiểm tra file thế giới; logic lưới thuần (di chuyển, va chạm, tìm đường, tương tác); cảnh Phaser (bản đồ, nhân vật, NPC, camera); vòng nhiệm vụ nối với engine; bảng task trong game cho 6 loại task; HUD chỉ số và giờ; điều khiển bàn phím và chạm; tải Phaser lười; bản đồ và file thế giới cho nghề giáo viên THPT; ghi công asset.
- Ngoài phạm vi: hoạt cảnh riêng cho từng mini-game (bước 2); âm thanh; lưu tiến trình; nghề khác ngoài giáo viên THPT; sửa văn bản nội dung nghề; trình biên tập bản đồ trong app.

## 3. Thiết kế

### 3.1 Thuật ngữ
- **Ô (tile)**: ô vuông 16×16 px của bản đồ, toạ độ nguyên `(x, y)`, gốc ở góc trên trái.
- **Bản đồ (map)**: một lưới ô, ví dụ "trường", "nhà".
- **Điểm việc (target)**: ô mà người chơi phải đứng **cạnh và quay mặt vào** để bắt đầu một segment.
- **Hướng**: `up`, `right`, `down`, `left`.

### 3.2 Hợp đồng dữ liệu và API

**File thế giới** `content/worlds/<id>.json`, kiểm bằng `schema/world.schema.json`:

```ts
interface World {
  profession_id: string;                 // PHẢI bằng tên file và trỏ tới một nghề có day_simulation
  tile_size: 16;
  tilesets: { key: string; image: string; columns: number; spacing: 1 }[];   // image: đường dẫn trong public/
  maps: {
    id: string;
    width: number; height: number;       // số ô
    layers: { name: string; data: (string | null)[] }[];   // "tilesetKey:index" hoặc null; độ dài = width*height
    solid: (0 | 1)[];                    // 1 = không đi qua được; độ dài = width*height
    spawn: { x: number; y: number };
  }[];
  npcs: { id: string; map: string; x: number; y: number; name: string; sprite: string[] }[];   // sprite: các lớp "tilesetKey:index" vẽ chồng
  player_sprite: string[];
  segments: Record<string, {           // khóa = segment.id trong file nghề
    map: string;
    target: { x: number; y: number };  // ô của NPC hoặc đồ vật
    npc?: string;                      // id NPC đứng ở target, nếu có
    quest: string;                     // dòng nhiệm vụ, ≤ 60 ký tự
  }>;
}
```

**Logic lưới thuần** `src/game/grid.ts`:

```ts
export type Dir = "up" | "right" | "down" | "left";
export interface Pos { x: number; y: number }
export interface Grid { width: number; height: number; solid: (0 | 1)[] }

export function isWalkable(g: Grid, p: Pos, blocked: Pos[]): boolean;
export function step(g: Grid, p: Pos, d: Dir, blocked: Pos[]): Pos;          // R-5
export function findPath(g: Grid, from: Pos, to: Pos, blocked: Pos[]): Pos[] | null;   // R-6
export function facingTile(p: Pos, d: Dir): Pos;
export function standSpots(g: Grid, target: Pos, blocked: Pos[]): { pos: Pos; face: Dir }[];   // R-7
```

**Vòng nhiệm vụ thuần** `src/game/quest.ts`:

```ts
export type GameMode = "intro" | "walk" | "task" | "result" | "reflection" | "done";
export function canInteract(player: Pos, face: Dir, target: Pos): boolean;   // R-9
```

Lệnh mới: `npm run validate:world` (`scripts/validate-world.mjs`), chạy trong `npm run check` ngay sau `validate`.

### 3.3 Quy tắc hành vi

**File thế giới (validate:world)** — mọi vi phạm PHẢI in lỗi kèm tên file và exit 1:
- R-1. File PHẢI hợp lệ theo `schema/world.schema.json`; `profession_id` PHẢI bằng stem tên file và trỏ tới nghề có `day_simulation`.
- R-2. Mỗi `layers[].data` và `solid` PHẢI có độ dài `width × height`. Mỗi tham chiếu `"key:index"` PHẢI có `key` thuộc `tilesets` và `0 ≤ index < columns × số hàng của ảnh`. *Lý do: lỗi ô sai hiện ra như ô trống trong game, khó phát hiện bằng mắt.*
- R-3. `segments` PHẢI có đúng một mục cho **mỗi** segment của nghề, không thừa khóa lạ. `quest` PHẢI dài 1–60 ký tự (đếm theo code point).
- R-4. Với mỗi segment: `standSpots(map, target, npcs trên map)` PHẢI khác rỗng, và ít nhất một vị trí đứng PHẢI có đường đi (`findPath`) từ `spawn` của map đó. `spawn` PHẢI đi được. *Lý do: người chơi không bao giờ bị kẹt không tới được việc.*

**Di chuyển và tương tác (`grid.ts`)**
- R-5. `step` trả về ô kề theo hướng `d` nếu ô đó nằm trong bản đồ, `solid = 0` và không thuộc `blocked`; ngược lại trả về chính `p`. Không đi chéo.
- R-6. `findPath` PHẢI là BFS 4 hướng, duyệt láng giềng theo thứ tự `up, right, down, left`; trả về danh sách ô **không gồm** `from`, **gồm** `to`; `from = to` → `[]`; không tới được hoặc `to` không đi được → `null`. *Lý do: thứ tự cố định để hai bản implement cho cùng một đường.*
- R-7. `standSpots` trả về các ô kề `target` theo thứ tự `up, right, down, left` mà đi được; `face` là hướng từ ô đứng nhìn về `target`.
- R-8. Nhân vật PHẢI di chuyển theo ô: mỗi bước kéo dài 150 ms; không nhận bước mới khi bước cũ chưa xong. Khi đang ở mode khác `walk`, mọi lệnh di chuyển bị bỏ qua.
- R-9. `canInteract` = `facingTile(player, face)` trùng `target` của segment hiện tại. Tương tác với ô khác KHÔNG ĐƯỢC mở task.

**Vòng nhiệm vụ (nối với engine SPEC-002)**

| Mode | Hiển thị | Chuyển sang |
|---|---|---|
| intro | Màn tiêu đề HTML: `<h1>` "Một ngày làm <name>", `persona` (1 câu), nút "Bắt đầu ngày làm việc" | Bấm nút → tải Phaser → `engine.start()` → `walk` |
| walk | Bản đồ của segment hiện tại, dòng nhiệm vụ `quest`, mũi tên nhấp nháy trên `target`, HUD | `canInteract` + phím tương tác → `task` |
| task | Bảng task trong game (R-12): bong bóng `narrative` của NPC (hoặc của nhân vật chính nếu không có NPC), `prompt`, giao diện task, nút 📖 | Nộp → `engine.submit` → `result` |
| result | Biểu cảm trên đầu NPC/nhân vật (R-13), số `formatDelta` bay lên từ HUD, tối đa 1 dòng `feedback` đầu tiên + nút "Xem thêm" nếu còn | "Làm lại" → `engine.retry()` → `task`; "Tiếp tục" → `engine.next()` → `walk` (segment kế) hoặc `reflection` |
| reflection | Cảnh nhân vật ngồi ở bàn, lần lượt từng `reflection_questions` trong bong bóng, nút "Tiếp" | Hết câu → `engine.finish()` → `done` |
| done | Bảng tổng kết: 3 chỉ số cuối ngày, link "Về hồ sơ nghề" | — |

- R-10. Khi sang segment có `map` khác bản đồ hiện tại: màn hình mờ dần 300 ms, đổi bản đồ, đặt người chơi ở `spawn` của bản đồ mới, rồi hiện lại.
- R-11. HUD luôn hiện trong `walk`, `task`, `result`: thanh chỉ số (nhãn rút gọn + giá trị 0–100), giờ `"~<time>"` (dấu `~` = giờ minh họa), `"Phần <i+1>/<n>"`.
- R-12. Bảng task dùng **đúng** controller SPEC-005 (R-1..R-7 của SPEC-005), hiển thị bằng HTML phủ lên canvas, khung pixel. Toàn bộ chữ trong bảng chỉ gồm: `narrative`, `prompt`, nội dung lựa chọn của task, nhãn nút. Trích dẫn của `basis` chỉ hiện khi bấm 📖. *Lý do: chữ tối thiểu, nhưng nguồn luôn truy được.*
- R-13. Biểu cảm kết quả: `success = true` → ❤️; `false` → 💧; `null` → dấu hiệu theo tổng `appliedDelta` của stat đầu tiên trong `stats` (dương ❤️, âm 💧, bằng 0 hoặc không có → 💬). Biểu cảm hiện 1200 ms phía trên NPC của segment (hoặc nhân vật chính).

**Điều khiển**
- R-14. Bàn phím: mũi tên và WASD di chuyển; `Space`, `Enter`, `E` tương tác. Chạm/nhấp chuột lên một ô: đi theo `findPath` tới ô đó; nếu ô đó là `target` thì đi tới ô đứng đầu tiên của `standSpots` có đường đi, quay mặt vào và tự tương tác.
- R-15. Khi `prefers-reduced-motion: reduce`: bỏ hiệu ứng nhún, bỏ mờ dần (đổi bản đồ ngay), biểu cảm hiện tĩnh.

**Tải và hiệu năng**
- R-16. Phaser và mã cảnh game PHẢI được tải bằng `import()` động khi bấm "Bắt đầu ngày làm việc"; KHÔNG ĐƯỢC nằm trong `<script src>` của HTML trang. *Lý do: giữ trang đầu nhẹ (SPEC-005 AC-005-16 vẫn đúng).*
- R-17. Tổng gzip (mức 9) các file JS tải thêm sau khi bấm bắt đầu PHẢI ≤ 614400 byte (600 KB).
- R-18. Asset dùng trong game PHẢI nằm trong `public/game/`, kèm `License.txt` gốc của từng bộ. Màn `done` PHẢI có dòng "Hình ảnh: Kenney.nl (CC0)".

### 3.4 Bảng chuyển trạng thái
Bảng mode ở 3.3. Mọi thao tác không có trong bảng của mode hiện tại PHẢI bị bỏ qua (không ném lỗi, không gọi engine).

### 3.5 Lỗi

| Nơi | Khi nào | Hệ quả |
|---|---|---|
| `validate:world` | Vi phạm R-1..R-4 | In lỗi, exit 1, `npm run check` đỏ |
| Trang game | Tải Phaser thất bại (mạng) | Hiện "Không tải được game. Thử lại" + nút thử lại; mode giữ `intro`; engine chưa `start` |

### 3.6 Conformance vectors
`tests/spec-006/vectors.json`: các lưới nhỏ với ca `step`, `findPath`, `standSpots` và kết quả mong đợi. Ví dụ lưới 3×3 tường giữa:

```
. . .
. # .
. . .
```
`findPath((0,0) → (2,2))` = `[(1,0),(2,0),(2,1),(2,2)]` (BFS ưu tiên `up, right, down, left`).

## 4. Tiêu chí chấp nhận

| ID | Given | When | Then |
|---|---|---|---|
| AC-006-01 | `tests/spec-006/vectors.json` | Chạy toàn bộ vector | 100% đạt |
| AC-006-02 | Lưới 3×3 tường giữa | `step((0,1),"right")`; `step((0,0),"up")`; `step((0,0),"right", blocked=[(1,0)])` | Lần lượt `(0,1)`, `(0,0)`, `(0,0)` |
| AC-006-03 | Lưới 3×3 tường giữa | `findPath((0,0),(2,2))`; `findPath((0,0),(0,0))`; `findPath((0,0),(1,1))` | `[(1,0),(2,0),(2,1),(2,2)]`; `[]`; `null` |
| AC-006-04 | Lưới 3×3 tường giữa, target `(1,1)` | `standSpots` | `[{(1,0),"down"},{(2,1),"left"},{(1,2),"up"},{(0,1),"right"}]` |
| AC-006-05 | Người chơi `(1,0)` quay `down`, target `(1,1)` | `canInteract`; quay `left` | `true`; `false` |
| AC-006-06 | File thế giới mẫu hợp lệ | `validate:world` | Exit 0 |
| AC-006-07 | Lần lượt: thiếu segment; thừa khóa lạ; quest 61 ký tự; tham chiếu `"indoor:99999"`; `solid` sai độ dài | `validate:world` | Mỗi ca exit 1, thông báo có tên file |
| AC-006-08 | Target bị tường bao kín | `validate:world` | Exit 1 (R-4) |
| AC-006-09 | `content/worlds/giao-vien-thpt.json` | `validate:world` | Exit 0; có đủ 7 segment |
| AC-006-10 | `package.json` | Đọc script `check` | Có `validate:world` ngay sau `validate` |
| AC-006-11 | Bản build, trang `/nghe/giao-vien-thpt/mot-ngay/` | Đọc HTML | Có nút "Bắt đầu ngày làm việc"; không `<script src>` nào chứa mã Phaser (tìm chuỗi `Phaser` trong các file đó) |
| AC-006-12 | Bản build | Tìm các chunk JS chứa `Phaser`, cộng gzip mức 9 | ≤ 614400 byte |
| AC-006-13 | `public/game/` | Liệt kê | Mỗi ảnh tileset được `tilesets[].image` tham chiếu đều tồn tại; có `License.txt` cho từng bộ asset |
| AC-006-14 | Engine + vòng nhiệm vụ chạy không giao diện (test thuần): mô phỏng đi tới từng target theo `findPath` của `standSpots[0]` rồi nộp đáp án hợp lệ đầu tiên | Chạy hết ngày giáo viên | Engine kết thúc ở `done`, không lỗi; mỗi segment đều tới được target |

## 5. Ghi chú kiểm thử
- `node:test`; `grid.ts`, `quest.ts`, `validate-world.mjs` test thuần, không mock.
- AC-006-11..13 kiểm tra bản build.
- Cảnh Phaser (vẽ, camera, hiệu ứng) chưa có test tự động; em chơi thử trọn ngày trên preview, chụp màn hình từng cảnh và ghi kết quả vào commit. Test E2E bằng trình duyệt thật vẫn thuộc hạng mục E2E.
- Bản đồ được vẽ bằng script sinh dữ liệu trong `scripts/` hoặc bằng tay; nếu anh muốn sửa bản đồ bằng phần mềm Tiled, đó là việc của spec sau.

## 6. Câu hỏi mở
Em đã chốt theo đề xuất ở các quy tắc dưới. Anh đồng ý thì đánh `[x]`, không đồng ý thì sửa quy tắc tương ứng ở mục 3.
- [x] Bối cảnh: dùng Phaser, đảo ngược ADR-003; SPEC-005 lên v2, giao diện biểu mẫu chỉ còn cho nghề chưa có bản đồ.
- [x] Bối cảnh: anh tải thêm Kenney Roguelike/RPG pack (sàn, tường, cửa) vào `assets-src/`.
- [x] R-8: di chuyển theo ô (vì nhân vật không có khung đi bộ), mỗi bước 150 ms.
- [x] R-12: bước 1 hiển thị task bằng bảng HTML phủ lên game; hoạt cảnh riêng từng mini-game để bước 2.
- [x] R-17: ngân sách JS game tải lười ≤ 600 KB gzip (trang đầu vẫn ≤ 300 KB).
- [x] Bản đồ giáo viên THPT gồm: sân trường (spawn), lớp 11A2 (chủ nhiệm), lớp 10A5, phòng tổ chuyên môn, phòng giáo viên (chấm bài, nghe điện thoại phụ huynh), và bản đồ "nhà" cho buổi sáng sớm (soạn bài) và buổi tối.

## 7. Lịch sử thay đổi
| Version | Ngày | Thay đổi | Lý do (BUG/ADR nếu có) |
|---|---|---|---|
| 1 | 2026-11-03 | Bản nháp đầu | Anh Son: màn chơi SPEC-005 nhiều chữ, cần game nhập vai thật |
