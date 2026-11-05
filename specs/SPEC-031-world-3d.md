---
id: SPEC-031
title: Thế giới 3D stylized và HUD mới cho game một ngày làm nghề
version: 5
status: implemented
features: [F3]
owns: [src/game3d/**, content/worlds3d/**, schema/world3d.schema.json, scripts/validate-world3d.mjs, public/game3d/**, public/fonts/**]
owner: anh Son
created: 2026-11-05
approved_hash: ebca5c8379f67ef0
approved_by: Son
approved_at: 2026-11-05
---

# SPEC-031 — Thế giới 3D stylized và HUD mới

> Viết theo specs/STANDARD.md. Mục 2–4 là phần quy phạm. Quyết định kiến trúc: ADR-006.

## 1. Bối cảnh & lý do
Game một ngày làm nghề (SPEC-006, SPEC-007, SPEC-014) đang vẽ bằng Phaser 2D nhìn từ trên xuống, ô 16×16 px. Anh Son đánh giá giao diện "quá đơn giản và xấu" và lấy https://duyentu.io.vn/ làm mẫu. Trang mẫu là thế giới 3D stylized: camera góc thứ ba, bóng mềm, sương xa, HUD tông gỗ ấm. Phân tích ở ADR-006 cho thấy trang đó dùng Three.js với WebGPURenderer, model GLB và HUD bằng React.

Spec này thay **lớp render** bằng Three.js và giữ nguyên mọi thứ phía dưới:
- Logic lưới `grid.ts` (SPEC-006 R-5..R-9), vòng kể chuyện `story.ts` (SPEC-014), mini-game (SPEC-007) và engine (SPEC-002) **không đổi**.
- Cảnh 3D cài đặt **cùng giao diện `GameHandle`** của `src/game/scene.ts`. GamePlayer chỉ đổi chỗ chọn renderer.
- Bản đồ 3D dựng trên **cùng lưới** của file thế giới 2D, nên mọi kiểm tra đường đi của `validate:world` vẫn đúng cho bản 3D.
- Nghề chưa có file 3D vẫn chạy Phaser. Máy không có WebGL2 cũng chạy Phaser.

**Phạm vi bước 1:** chỉ nghề giáo viên THPT có thế giới 3D, giống cách SPEC-006 mở đầu. Các nghề khác chuyển dần ở spec gói nghề sau.

**Sửa lan có chủ đích** (D12). Spec này phải chạm vào các file thuộc spec khác sau đây; mọi commit chạm chúng ghi cả hai mã spec:
- `src/game/GamePlayer.tsx` (SPEC-006): chọn renderer, áp theme HUD.
- `src/game/minigames/ui.tsx` (SPEC-007): áp theme khung bảng.
- `src/app/globals.css` (SPEC-003): biến màu và `@font-face`.
- `package.json` (SPEC-003): thêm `three` và lệnh `validate:world3d`.

## 2. Phạm vi
- **Trong phạm vi:**
  - định dạng file `content/worlds3d/<id>.json`, kèm schema và lệnh kiểm tra;
  - các hàm thuần trong `src/game3d/`: toạ độ, camera, ánh xạ phím theo hướng camera, chọn ô bằng tia, chọn mức chất lượng, chọn renderer;
  - cảnh Three.js cài đặt `GameHandle`;
  - nạp model GLB và hoạt cảnh Idle/Walk;
  - ánh sáng, bóng, sương và bầu trời theo preset;
  - điều khiển bàn phím, chuột, chạm, xoay camera;
  - theme HUD mới (màu, font Lora tự host, thanh gợi ý phím);
  - dự phòng sang Phaser;
  - ngân sách tải;
  - thế giới 3D và asset cho giáo viên THPT;
  - ghi công asset.
- **Ngoài phạm vi:**
  - file 3D cho 29 nghề còn lại;
  - multiplayer, vật lý (Rapier), nhảy, chạy nhanh;
  - âm thanh và nhạc nền;
  - biểu cảm do người chơi tự bấm (phím Q ở trang mẫu);
  - đổi trang phục nhân vật;
  - nén Draco/KTX2;
  - bỏ hẳn Phaser;
  - sửa nội dung nghề hoặc file thế giới 2D.

## 3. Thiết kế

### 3.1 Thuật ngữ
- **Mét (m)**: đơn vị của cảnh 3D. **1 ô lưới = 1 m × 1 m.**
- **Hệ toạ độ cảnh**: trục `x` sang phải (cùng chiều `x` của lưới), trục `z` xuống dưới (cùng chiều `y` của lưới), trục `y` hướng lên trời. Mặt đất là mặt phẳng `y = 0`.
- **Góc camera `q`**: số nguyên 0..3, nghĩa là camera đã xoay `q × 90°` theo chiều kim đồng hồ khi nhìn từ trên xuống. Với `q = 0`, camera đứng ở phía `+z` của nhân vật và nhìn về hướng `up` của lưới.
- **Preset ánh sáng**: một bộ thông số ánh sáng cố định, xem bảng ở R-12.
- **Mức chất lượng**: `"high"` hoặc `"low"`.

### 3.2 Hợp đồng dữ liệu và API

**File thế giới 3D** `content/worlds3d/<id>.json`, kiểm bằng `schema/world3d.schema.json`:

```ts
type FloorMaterial = "grass" | "brick" | "tile" | "wood" | "concrete" | "sand";
type Rot = 0 | 90 | 180 | 270;               // độ, xoay quanh trục y theo chiều kim đồng hồ khi nhìn từ trên

interface World3D {
  profession_id: string;                     // PHẢI bằng stem tên file và có file content/worlds/<id>.json
  models: Record<string, {                   // khóa: tên model, chỉ gồm [a-z0-9-]
    file: string;                            // đường dẫn trong public/, bắt đầu bằng "/game3d/", đuôi ".glb"
    scale: number;                           // > 0
    license: string;                         // đường dẫn License.txt trong public/game3d/
  }>;
  player_model: string;                      // khóa trong models
  npc_models: Record<string, string>;        // khóa = npcs[].id của file thế giới 2D; giá trị = khóa trong models
  maps: Record<string, {                     // khóa = maps[].id của file thế giới 2D
    lighting: "day" | "evening" | "indoor";
    floor: { default: FloorMaterial; regions: { x: number; y: number; w: number; h: number; material: FloorMaterial }[] };
    wall: { material: "plaster" | "brick" | "hedge"; height: number };   // height (m), 0.5 ≤ height ≤ 4
    props: { model: string; x: number; y: number; rot: Rot; blocks: boolean }[];
    scenery?: { model: string; x: number; y: number; rot: Rot }[];    // cảnh nền NGOÀI lưới (R-3b); thiếu = []
  }>;
}
```

**Hàm thuần** `src/game3d/layout.ts`:

```ts
import type { Dir, Pos } from "../game/grid";
export type Quarter = 0 | 1 | 2 | 3;
export interface Vec3 { x: number; y: number; z: number }

export function tileToWorld(p: Pos): { x: number; z: number };                       // R-4
export function worldToTile(x: number, z: number, width: number, height: number): Pos | null;  // R-4
export function rotateDir(d: Dir, q: Quarter): Dir;                                 // R-6
export function snapQuarter(yawDeg: number): Quarter;                               // R-7
export function pickTile(origin: Vec3, dir: Vec3, width: number, height: number): Pos | null;  // R-8
export function stepPose(from: Pos, to: Pos, t: number): { x: number; z: number; yawDeg: number };  // R-5
export function chooseQuality(fps: number[], current: "high" | "low"): "high" | "low";  // R-14
export function chooseRenderer(has3d: boolean, caps: { webgl2: boolean }): "three" | "phaser";  // R-16
export function isTap(dxPx: number, dyPx: number, ms: number): boolean;            // R-9
export function keyAction(code: string): Dir | "interact" | null;                  // R-6b
export type KeyEffect = { kind: "press" | "release" | "tap"; dir: Dir } | { kind: "interact" } | null;
export interface KeyTracker { down(code: string, keyCode: number): KeyEffect; up(code: string): KeyEffect; imeSeen(): boolean }
export function createKeyTracker(): KeyTracker;                                    // R-6c
```

**Cảnh 3D** `src/game3d/scene3d.ts`:

```ts
export function mountGame3D(host: HTMLElement, world: WorldData, world3d: World3D, cb: GameCallbacks): Promise<GameHandle>;
```
`GameHandle` và `GameCallbacks` là đúng kiểu đang xuất ra từ `src/game/scene.ts` (SPEC-006, SPEC-007). KHÔNG ĐƯỢC thêm, bớt hay đổi chữ ký phương thức.

**Lệnh mới**: `npm run validate:world3d` (`scripts/validate-world3d.mjs`), chạy trong `npm run check` ngay sau `check:pack`. *Lý do: SPEC-008 AC-008-09 (test đã khóa) giữ `check:pack` ngay sau `validate:world`.*

### 3.3 Quy tắc hành vi

**File thế giới 3D (validate:world3d).** Mọi vi phạm PHẢI in lỗi kèm tên file và exit 1.
- R-1. File PHẢI hợp lệ theo schema. `profession_id` PHẢI bằng stem tên file, và PHẢI có `content/worlds/<id>.json` cùng tên.
- R-2. Khóa của `maps` PHẢI trùng **đúng tập** `maps[].id` của file 2D. Khóa của `npc_models` PHẢI trùng đúng tập `npcs[].id`. Mọi giá trị `model` (của `props` và `scenery`), `player_model` và `npc_models[*]` PHẢI là khóa có trong `models`. *Lý do: bản 3D phủ kín bản 2D, không có bản đồ hay NPC nào bị bỏ sót.*
- R-3. Với mỗi map, đối chiếu với lưới 2D cùng id:
  - mỗi prop và mỗi region PHẢI nằm trọn trong `[0, width) × [0, height)`;
  - prop có `blocks: true` PHẢI đặt trên ô `solid = 1`;
  - prop có `blocks: false` KHÔNG ĐƯỢC đặt trên ô là `target` của một segment, cũng không trên ô đứng đầu tiên (`standSpots[0]`) của target đó.

  *Lý do: lưới 2D vẫn là nguồn chân lý về va chạm; đồ trang trí không được che chỗ làm việc.*
- R-3b. Mỗi mục `scenery` PHẢI có `x`, `y` nguyên, nằm **ngoài** lưới (không thuộc `[0, width) × [0, height)`), và nằm trong vùng viền `[-12, width + 12) × [-12, height + 12)`. Cảnh nền KHÔNG ĐƯỢC chặn đường và không tham gia tìm đường; nó chỉ để vẽ. Toạ độ cảnh nền đổi sang mét bằng cùng công thức `tileToWorld` (R-4b); ví dụ ô `(-1, 0)` có tâm ở `x = -0.5`. *Lý do: người chơi không bao giờ tới được ngoài lưới; vì vậy cây cối bao quanh trường không ảnh hưởng tới luật đi lại; viền 12 ô đủ phủ tới vùng sương xa (R-12) mà vẫn giới hạn số model phải vẽ.*
- R-4. Với mỗi file GLB trong `models`:
  - file PHẢI tồn tại trong `public/`, và `license` PHẢI trỏ tới một file có thật;
  - mỗi file ≤ 2097152 byte (2 MB);
  - tổng dung lượng các file GLB **khác nhau** mà một nghề dùng ≤ 12582912 byte (12 MB);
  - model của `player_model` PHẢI chứa hoạt cảnh tên đúng `Idle` và `Walk`; model NPC PHẢI chứa `Idle`. Tên hoạt cảnh đọc từ chunk JSON của GLB, trường `animations[].name`.

**Toạ độ và chuyển động**
- R-4b. `tileToWorld({x, y})` trả về `{ x: x + 0.5, z: y + 0.5 }`. `worldToTile(x, z, w, h)` trả về `{ x: Math.floor(x), y: Math.floor(z) }` nếu kết quả nằm trong `[0, w) × [0, h)`; nằm ngoài thì trả về `null`.
- R-5. Một bước đi vẫn kéo dài **150 ms** như SPEC-006 R-8, và vẫn không nhận bước mới khi bước cũ chưa xong. `stepPose(from, to, t)`:
  - chặn `t` vào `[0, 1]` trước khi tính;
  - nội suy tuyến tính giữa `tileToWorld(from)` và `tileToWorld(to)`;
  - `yawDeg` là hướng di chuyển: `up` = 0, `right` = 90, `down` = 180, `left` = 270;
  - khi `from = to`, `yawDeg` = 180.

  Trong lúc đi, nhân vật chạy hoạt cảnh `Walk`; khi đứng yên thì `Idle`, chuyển giữa hai hoạt cảnh mất 150 ms.
- R-6. `rotateDir(d, q)` = `DIRS[(DIRS.indexOf(d) + q) % 4]` với `DIRS = ["up","right","down","left"]`. Phím di chuyển (SPEC-006 R-14) PHẢI đi qua `rotateDir(phím, q)` trước khi gọi `step`. *Lý do: "lên" luôn nghĩa là "đi xa khỏi camera", dù camera đang quay hướng nào.*
- R-6b. Bàn phím của game PHẢI đọc **vị trí phím vật lý** `KeyboardEvent.code`, KHÔNG ĐƯỢC đọc `KeyboardEvent.key`. Áp dụng cho cả cảnh 3D (`scene3d.ts`) và cảnh Phaser (`src/game/scene.ts`). `keyAction(code)`:
  - `KeyW`, `ArrowUp` → `"up"`; `KeyD`, `ArrowRight` → `"right"`; `KeyS`, `ArrowDown` → `"down"`; `KeyA`, `ArrowLeft` → `"left"`;
  - `KeyE`, `Space`, `Enter`, `NumpadEnter` → `"interact"`;
  - mọi `code` khác, kể cả chuỗi rỗng, → `null` (sự kiện bị bỏ qua, không đổi trạng thái phím).

  Nhả phím cũng tra theo `code`. Sự kiện có `repeat = true` bị bỏ qua (như BUG-004). Khi cửa sổ mất focus hoặc trang bị ẩn (`visibilitychange` với `document.hidden = true`), mọi phím đang giữ PHẢI được nhả. *Lý do (BUG-005): bộ gõ tiếng Việt kiểu Telex (Unikey, EVKey) dùng W/A/S/D để bỏ dấu; bộ gõ đổi `key`, chèn sự kiện giả có `code` rỗng và làm mất sự kiện nhả phím. `code` thì luôn là vị trí phím thật, không phụ thuộc bộ gõ hay bàn phím.*- R-6c. Hai cảnh PHẢI xử lý phím qua `createKeyTracker()`. Tracker giữ tập `code` đã nhận `keydown` mà chưa nhận `keyup`:
  - `down(code, keyCode)`: nếu `keyAction(code)` là một hướng `d` → thêm `code` vào tập, trả `{ kind: "press", dir: d }`; là `"interact"` → thêm `code` vào tập, trả `{ kind: "interact" }`. Nếu `code === ""` và `keyCode` là 229 hoặc 231 → đánh dấu `imeSeen` = true, trả `null`. Còn lại trả `null`.
  - `up(code)`: nếu `keyAction(code)` là `null` → `null`. Nếu `code` có trong tập → xóa khỏi tập; hướng `d` → `{ kind: "release", dir: d }`, `"interact"` → `null`. Nếu `code` **không** có trong tập (keydown đã bị bộ gõ nuốt) → hướng `d` → `{ kind: "tap", dir: d }`, `"interact"` → `{ kind: "interact" }`.

  Cảnh xử lý hiệu ứng: `press` → `MoveInput.press`; `release` → `MoveInput.release`; `tap` → `press` rồi `release` ngay (đi đúng một ô qua hướng đệm của BUG-004); `interact` → thử tương tác. *Lý do (BUG-005, đo bằng phím thật qua Unikey 2026-11-05): Unikey thường nuốt `keydown` thật của W/A/S/D và chèn sự kiện giả `code = ""`, `keyCode = 231`; `keyup` thật vẫn tới đúng `code`. Bắt lần bấm qua `keyup` thì mỗi lần bấm vẫn đi đúng một ô.*
- R-6d. Khi `imeSeen` lần đầu thành true trong mode `walk`, thanh gợi ý phím (R-22) PHẢI thêm một dòng: `Bộ gõ tiếng Việt đang bật: tắt bộ gõ (thường là Ctrl + Shift) hoặc dùng phím mũi tên để giữ phím đi liên tục.` Dòng này giữ nguyên tới hết phiên chơi. GamePlayer tự phát hiện bằng bộ nghe `keydown` của riêng nó theo đúng điều kiện ở R-6c; KHÔNG ĐƯỢC đổi `GameHandle` hay `GameCallbacks`. *Lý do: với bộ gõ bật, giữ phím có thể không đi liên tục được vì `keydown` lặp lại cũng bị nuốt; người chơi cần biết cách khắc phục.*

**Camera và điều khiển**
- R-7. Camera là phối cảnh, `fov = 45°`, bám theo nhân vật, cách 9 m, góc chúc xuống 35°, góc ngang `q × 90°`.
  - Kéo chuột trái (hoặc kéo một ngón tay) theo trục ngang thì xoay camera tự do, 0,4° cho mỗi px.
  - Khi thả, camera về góc `snapQuarter(yaw)` trong 250 ms.
  - `snapQuarter(yawDeg)` = `((Math.round(yawDeg / 90) % 4) + 4) % 4`.

  *Lý do: lưới chỉ có 4 hướng; camera phải dừng ở 4 hướng thì phím mới không gây nhầm lẫn.*
- R-8. `pickTile(origin, dir, w, h)`:
  - nếu `dir.y >= 0` thì trả về `null`;
  - ngược lại, lấy giao điểm của tia với mặt phẳng `y = 0` (`s = -origin.y / dir.y`) rồi trả về `worldToTile(origin.x + s·dir.x, origin.z + s·dir.z, w, h)`.

  Ô chọn được dùng cho điều khiển chạm/nhấp của SPEC-006 R-14 (đi theo `findPath`, tự tương tác nếu là target).
- R-9. Một lần nhấn rồi thả là **chạm** nếu `isTap(dx, dy, ms)`, tức là `Math.hypot(dx, dy) < 8` và `ms < 300`. Ngược lại là **kéo** (xoay camera). Chạm và kéo KHÔNG ĐƯỢC cùng xảy ra trong một lần nhấn.
- R-10. `focusOn(target)` (SPEC-007 R-1): camera tiến lại cách target 5 m trong 400 ms, giữ góc ngang hiện tại. `focusOn(null)` trả camera về bám nhân vật ở 9 m trong 400 ms.

  `anchorOf(id)` trả về toạ độ px (tính theo `host`) của điểm cao hơn đỉnh hộp bao của model 0,2 m. Nếu điểm đó nằm sau camera hoặc ngoài khung nhìn thì trả về `null`.
- R-11. Điểm việc hiện tại được đánh dấu bằng một khối thoi vàng `#f2c14e`, lơ lửng ở `y = 2.2 m` trên ô target. Khối xoay 90°/s quanh trục y và nhấp nhô ±0,1 m với chu kỳ 1,2 s. `setTarget(null)` ẩn khối thoi.

  `emote` hiện emoji trên một sprite cao hơn đầu 0,4 m, trong 1200 ms (SPEC-006 R-13).

  Đổi bản đồ (SPEC-006 R-10) dùng lớp phủ HTML màu `#1d140e`, mờ dần 300 ms.

**Hình ảnh**
- R-12. Mỗi map dùng đúng preset `lighting` của nó:

| Preset | Đèn mặt trời (màu, cường độ, hướng chiếu từ) | Ánh sáng bán cầu (trời / đất, cường độ) | Sương (màu, gần–xa m) | Nền |
|---|---|---|---|---|
| day | `#fff1d6`, 2.5, (−0.5, 1, 0.6) | `#cfe6ff` / `#6b8f4e`, 0.8 | `#dfe9f0`, 18–45 | bầu trời gradient `#9ec9ef` → `#e8f1f7` |
| evening | `#ffb27a`, 1.8, (−0.9, 0.4, 0.3) | `#f4c7a1` / `#4a3b52`, 0.6 | `#e9b99a`, 15–40 | gradient `#f0a27a` → `#fbe3c8` |
| indoor | `#fff4e2`, 1.2, (0.3, 1, 0.4) | `#fff8ee` / `#8a7560`, 1.0 | không sương | màu nền `#2a1f18` |

  Vật liệu sàn và tường PHẢI là `MeshToonMaterial` với màu cố định:

  | Tên | Màu |
  |---|---|
  | grass | `#7fb24a` |
  | brick | `#c9785a` |
  | tile | `#e6dccb` |
  | wood | `#b98a5e` |
  | concrete | `#b7b3ac` |
  | sand | `#e3cf9f` |
  | plaster | `#efe6d6` |
  | hedge | `#5f8f3e` |

  Mục `scenery` được vẽ giống prop (cùng cách đặt và xoay). Nền đất ngoài lưới PHẢI phủ tới hết vùng viền của R-3b, dùng vật liệu `floor.default` của map. Mỗi ô `solid = 1` không có prop `blocks: true` được dựng thành một khối tường 1 × `wall.height` × 1 m. Model GLB giữ nguyên vật liệu gốc. *Lý do: màu cố định giúp hai bản implement cho ra cùng một khung hình, và tông màu đồng bộ với HUD.*
- R-13. Mức `"high"`:
  - bóng đổ từ đèn mặt trời, shadow map 2048 px, lọc mềm (PCF soft);
  - hậu kỳ bloom với `strength = 0.25`;
  - `pixelRatio = min(devicePixelRatio, 2)`.

  Mức `"low"`:
  - shadow map 1024 px;
  - không hậu kỳ;
  - `pixelRatio = 1`.

  Phiên chơi bắt đầu ở `"high"`.
- R-14. `chooseQuality(fps, current)`:
  - `current = "low"` thì luôn trả về `"low"`;
  - mảng có ít hơn 120 phần tử thì trả về `current`;
  - ngược lại, lấy trung vị của 120 phần tử cuối (độ dài chẵn thì trung vị là trung bình của hai giá trị giữa); trung vị `< 45` thì trả về `"low"`, ngược lại trả về `"high"`.

  Cảnh gọi hàm này mỗi giây. Khi đã chuyển sang `"low"` thì giữ `"low"` tới khi tải lại trang. *Lý do: không bật tắt qua lại gây giật.*
- R-15. Khi `prefers-reduced-motion: reduce`:
  - bỏ mọi chuyển động camera có thời lượng (R-7, R-10): camera tới vị trí đích ngay;
  - khối thoi đứng yên;
  - bỏ mờ dần khi đổi bản đồ;
  - nhân vật vẫn chạy hoạt cảnh `Walk`/`Idle` (đây là thông tin trạng thái, không phải hiệu ứng trang trí).

**Chọn renderer, tải và dự phòng**
- R-16. `chooseRenderer(has3d, caps)` trả về `"three"` khi và chỉ khi `has3d && caps.webgl2`; ngược lại trả về `"phaser"`.
  - `has3d` = tồn tại `content/worlds3d/<id>.json`.
  - `caps.webgl2` = `!!document.createElement("canvas").getContext("webgl2")`, bọc try/catch; ném lỗi thì coi là `false`.
  - Renderer dùng `WebGPURenderer` của `three/webgpu`. Không có WebGPU thì renderer này tự chạy backend WebGL2.
  - Khi `mountGame3D` reject, GamePlayer PHẢI gọi `mountGame` của Phaser một lần và tiếp tục chơi; mode vẫn là `intro` cho tới khi Phaser mount xong.
- R-17. Three.js và mã `src/game3d/` PHẢI được tải bằng `import()` động khi bấm "Bắt đầu ngày làm việc", và chỉ khi `chooseRenderer` trả về `"three"`. Khi chạy đường `"three"`, chunk Phaser KHÔNG ĐƯỢC tải.
- R-18. Ngân sách tải lười cho đường `"three"`:
  - tổng gzip (mức 9) các chunk JS chứa chuỗi `__THREE__` cộng các chunk chỉ thuộc `src/game3d/` ≤ 716800 byte (700 KB);
  - model GLB tuân theo R-4.

  Trang đầu vẫn ≤ 300 KB (SPEC-005 AC-005-16).
- R-19. Asset 3D PHẢI nằm trong `public/game3d/<bộ>/`, kèm `License.txt` gốc của từng bộ. Chỉ được dùng asset có license CC0 hoặc CC-BY. Màn `done` PHẢI có thêm một dòng ghi công liệt kê tên các bộ asset 3D và license của chúng.

**HUD mới**
- R-20. `src/app/globals.css` PHẢI khai báo các biến sau:

  | Biến | Giá trị |
  |---|---|
  | `--hud-bg` | `rgba(59, 42, 31, 0.92)` |
  | `--hud-border` | `#c9a45c` |
  | `--hud-text` | `#f5ead6` |
  | `--hud-muted` | `#cbb89a` |
  | `--hud-accent` | `#f2c14e` |
  | `--hud-radius` | `10px` |
  | `--hud-font` | `"Lora", "Palatino Linotype", Georgia, serif` |

  Font Lora (OFL) PHẢI được tự host: `public/fonts/Lora-Regular.woff2`, `public/fonts/Lora-Bold.woff2`, kèm `public/fonts/OFL.txt`, khai báo bằng `@font-face` với `font-display: swap`. KHÔNG ĐƯỢC tải font từ máy chủ ngoài. *Lý do: build static export phải chạy được khi không có mạng, và không gửi dữ liệu người dùng ra bên ngoài.*
- R-21. Trong game, mọi khung HUD dùng các biến ở R-20 (nền, viền 1px, chữ, bo góc, font). Áp dụng cho: thẻ thông tin (chỉ số, giờ, "Phần i/n"), dòng nhiệm vụ, bảng cảnh hoặc task, màn intro, màn `done`. Thẻ thông tin nằm ở góc trên trái.
- R-22. Ở mode `walk`, góc dưới trái PHẢI có thanh gợi ý phím gồm đúng 3 mục theo thứ tự:
  1. `W A S D / ←↑↓→` Di chuyển
  2. `E` Tương tác
  3. `Kéo chuột` Xoay camera

  Trên thiết bị cảm ứng (`matchMedia("(pointer: coarse)")`), thanh này đổi thành 2 mục: `Chạm` Đi tới, `Kéo` Xoay camera. Ở đường `"phaser"`, mục "Xoay camera" bị ẩn.

### 3.4 Bảng chuyển trạng thái
Spec này không thêm trạng thái mới. Vòng mode vẫn theo SPEC-014. Trạng thái riêng của renderer:

| Trạng thái | Sự kiện | Trạng thái mới |
|---|---|---|
| chưa tải | bấm bắt đầu, `chooseRenderer = "three"` | đang tải 3D |
| chưa tải | bấm bắt đầu, `chooseRenderer = "phaser"` | đang tải Phaser (SPEC-006) |
| đang tải 3D | `mountGame3D` resolve | chạy 3D |
| đang tải 3D | `mountGame3D` reject | đang tải Phaser |
| đang tải Phaser | `mountGame` lỗi | lỗi tải (SPEC-006 3.5: nút "Thử lại", mode giữ `intro`) |
| chạy 3D | `chooseQuality` trả về `"low"` | chạy 3D ở mức `"low"` (không quay lại `"high"`) |

### 3.5 Lỗi

| Nơi | Khi nào | Hệ quả |
|---|---|---|
| `validate:world3d` | Vi phạm R-1..R-4 | In lỗi kèm tên file, exit 1, `npm run check` đỏ |
| `mountGame3D` | Khởi tạo renderer thất bại, hoặc tải GLB thất bại | Reject `Error` có `code: "RENDER_3D_FAILED"`; GamePlayer chuyển sang Phaser (R-16); engine chưa được `start` |
| Hàm thuần `layout.ts` | Đầu vào ngoài miền (ví dụ `t` ngoài [0,1]) | Không ném lỗi; chặn hoặc trả về `null` theo R-4b, R-5, R-8 |

### 3.6 Conformance vectors
`tests/spec-031/vectors.json` chứa các ca cho `tileToWorld`, `worldToTile`, `rotateDir`, `snapQuarter`, `pickTile`, `stepPose`, `chooseQuality`, `chooseRenderer`, `isTap`. Ví dụ:
- `rotateDir("up", 1)` = `"right"`; `rotateDir("left", 3)` = `"down"`.
- `snapQuarter(-100)` = `3`; `snapQuarter(44)` = `0`; `snapQuarter(46)` = `1`; `snapQuarter(405)` = `1`.
- `pickTile({x:2.5,y:9,z:12}, {x:0,y:-1,z:-1}, 10, 10)` = `{x:2,y:3}` (với `s = 9`, giao điểm là `(2.5, 0, 3)`).
- `stepPose({x:0,y:0}, {x:1,y:0}, 0.5)` = `{x:1, z:0.5, yawDeg:90}`; `stepPose({x:0,y:0}, {x:1,y:0}, 2)` = `{x:1.5, z:0.5, yawDeg:90}`.

## 4. Tiêu chí chấp nhận

| ID | Given | When | Then |
|---|---|---|---|
| AC-031-01 | `tests/spec-031/vectors.json` | Chạy toàn bộ vector | 100% đạt |
| AC-031-02 | Lưới 10×10 | `worldToTile(9.99, 0, 10, 10)`; `worldToTile(10, 0, 10, 10)`; `worldToTile(-0.01, 5, 10, 10)` | `{x:9,y:0}`; `null`; `null` |
| AC-031-03 | Camera `q = 2` | Ánh xạ phím `up`, `right` qua `rotateDir` | `down`, `left` |
| AC-031-04 | Tia `dir = {x:0, y:0, z:-1}`; tia trúng mặt đất ngoài lưới | `pickTile` | `null`; `null` |
| AC-031-05 | Mảng 119 giá trị 10; mảng 120 giá trị 44; mảng 120 giá trị 60 với `current = "low"`; mảng 60 giá trị 30 nối 60 giá trị 60 | `chooseQuality(fps, "high")` (ca 3 dùng `"low"`) | `"high"`; `"low"`; `"low"`; `"high"` (trung vị 45) |
| AC-031-06 | — | `chooseRenderer(true,{webgl2:true})`; `(true,{webgl2:false})`; `(false,{webgl2:true})` | `"three"`; `"phaser"`; `"phaser"` |
| AC-031-07 | — | `isTap(5,5,200)`; `isTap(8,0,100)`; `isTap(0,0,300)` | `true`; `false`; `false` |
| AC-031-08 | File 3D mẫu hợp lệ cùng file 2D mẫu (fixture) | `validate:world3d` | Exit 0 |
| AC-031-09 | Lần lượt từng ca: thiếu map; thừa khóa NPC; model không có trong `models`; prop ngoài lưới; prop `blocks: true` trên ô đi được; prop `blocks: false` đè lên target; file GLB không tồn tại; thiếu `License.txt` | `validate:world3d` | Mỗi ca exit 1, thông báo có tên file |
| AC-031-10 | GLB fixture của người chơi chỉ có hoạt cảnh `Idle`; GLB fixture 2097153 byte | `validate:world3d` | Mỗi ca exit 1 (R-4) |
| AC-031-11 | `content/worlds3d/giao-vien-thpt.json` | `validate:world3d` | Exit 0; có đủ mọi map và NPC của file 2D |
| AC-031-12 | `package.json` | Đọc script `check`; đọc `dependencies.three` | Có `validate:world3d` ngay sau `check:pack`; `three` ghim phiên bản chính xác (không có `^` hay `~`), major/minor ≥ 0.187 |
| AC-031-13 | Bản build, trang `/nghe/giao-vien-thpt/mot-ngay/` | Đọc HTML và các `<script src>` | Không file nào chứa `__THREE__` |
| AC-031-14 | Bản build | Cộng gzip mức 9 các chunk JS chứa `__THREE__` và chunk của `src/game3d/` | ≤ 716800 byte |
| AC-031-15 | Bản build | Tìm chunk chứa `__THREE__` và chunk chứa `Phaser` | Không chunk nào chứa cả hai chuỗi (R-17: hai đường tải tách biệt) |
| AC-031-16 | `src/app/globals.css`, `public/fonts/` | Đọc file | Đủ 7 biến R-20 với đúng giá trị; có `@font-face` Lora với `font-display: swap`; tồn tại 2 file woff2 và `OFL.txt`; không có URL `http` nào trong `@font-face` |
| AC-031-17 | `public/game3d/` | Liệt kê | Mỗi `models[].file` và `license` của mọi file 3D đều tồn tại; mỗi thư mục bộ asset có `License.txt` |
| AC-031-18 | `src/game3d/scene3d.ts` | Typecheck | `mountGame3D` trả về `Promise<GameHandle>` với `GameHandle` import từ `src/game/scene` (không khai báo lại) |
| AC-031-19 | Engine + vòng kể chuyện chạy không giao diện, dùng `rotateDir` với `q` lần lượt 0..3 để đi tới từng target (đổi hướng phím trước khi `step`) | Chạy hết ngày giáo viên | Mỗi `q` đều tới được mọi target và kết thúc ở `done` |
| AC-031-20 | Thế giới 3D mẫu (AC-031-08) thêm `scenery` | `validate:world3d` lần lượt với: một mục ở `(-1, 0)` và một ở `(width + 11, height + 11)`; một mục ở `(0, 0)` (trong lưới); một mục ở `(-13, 0)`; một mục có model không có trong `models` | Ca đầu exit 0; ba ca sau mỗi ca exit 1, thông báo có tên file |
| AC-031-21 | — | `keyAction` với `"KeyW"`, `"KeyA"`, `"ArrowDown"`, `"KeyD"`, `"Space"`, `"NumpadEnter"`, `"KeyE"`, `""`, `"KeyQ"`, `"Backspace"` | Lần lượt `"up"`, `"left"`, `"down"`, `"right"`, `"interact"`, `"interact"`, `"interact"`, `null`, `null`, `null`; mã nguồn `scene3d.ts` và `src/game/scene.ts` không còn đọc `e.key` trong bộ xử lý phím di chuyển/tương tác |
| AC-031-22 | `tests/spec-031/vectors-keys.json`: các chuỗi sự kiện ghi thật từ Unikey (keydown bị nuốt, Backspace và ký tự giả `code = ""`, keyup thật) và chuỗi bàn phím thường | Đưa lần lượt từng sự kiện vào một tracker mới | Dãy hiệu ứng khớp đúng vector; với chuỗi Unikey bấm `A` một lần → đúng một `{ kind: "tap", dir: "left" }` và `imeSeen() = true`; chuỗi thường `KeyA` xuống rồi lên → `press` rồi `release` |
| AC-031-23 | `src/game/GamePlayer.tsx`, `scene3d.ts`, `src/game/scene.ts` | Đọc mã nguồn | Hai cảnh gọi `createKeyTracker()`; GamePlayer có đúng câu gợi ý của R-6d |

## 5. Ghi chú kiểm thử
- Dùng `node:test`. `layout.ts` và `validate-world3d.mjs` test thuần, không mock.
- GLB fixture nhỏ sinh bằng script trong `tests/spec-031/fixtures/` (chỉ chunk JSON và chunk BIN rỗng), đủ để kiểm tên hoạt cảnh.
- AC-031-13..15 kiểm tra bản build như SPEC-006.
- Cảnh 3D (ánh sáng, bóng, camera, hoạt cảnh, theme HUD trên màn hình) chưa có test tự động. Em sẽ chơi thử trọn ngày giáo viên trên preview, chụp màn hình từng map ở cả mức `"high"` và `"low"`, cả đường dự phòng Phaser (giả lập bằng cách tắt WebGL2), rồi ghi kết quả vào commit. Test E2E vẫn thuộc hạng mục E2E.
- R-12 (bảng màu, preset) và R-13 kiểm bằng review code đối chiếu bảng.

## 6. Câu hỏi mở
Em đề xuất sẵn theo các quy tắc ở mục 3. Anh đồng ý thì đánh `[x]`, không đồng ý thì sửa quy tắc tương ứng.
- [x] Asset: dùng các bộ CC0 của **Quaternius** (nhân vật có sẵn hoạt cảnh Idle/Walk; cây, đồ nội thất) và **Kenney** (Furniture Kit, Nature Kit). Anh tải về `assets-src/`, em chọn lọc, nén bằng `gltfpack` rồi đưa vào `public/game3d/`. Nhân vật mặc áo dài như trang mẫu thì phải tự dựng hoặc đặt làm, nên em để ngoài phạm vi bước 1.
- [x] R-5/R-6: giữ **di chuyển theo ô** (chuyển động mượt giữa các ô) thay vì đi tự do. Lý do: không phải đổi logic lưới và 30 file thế giới đã kiểm. Trang mẫu đi tự do, cảm giác sẽ khác một chút.
- [x] R-7: camera **dừng ở 4 hướng** sau khi thả chuột, không xoay tự do 360°.
- [x] R-18: ngân sách JS cho đường 3D là ≤ 700 KB gzip; model ≤ 2 MB mỗi file, ≤ 12 MB mỗi nghề. Con số chính xác của three r18x sẽ đo khi implement; nếu vượt, em dừng lại báo anh chứ không tự nới.
- [x] R-20: theme HUD tông gỗ nâu, viền vàng nhạt, font Lora, áp dụng cho game. Trang hồ sơ nghề và trang chủ giữ nguyên (spec sau nếu anh muốn đồng bộ).
- [x] Phạm vi bước 1 chỉ có giáo viên THPT; 29 nghề còn lại chuyển dần ở các spec sau, trong lúc đó vẫn chạy Phaser.

## 7. Lịch sử thay đổi
| Version | Ngày | Thay đổi | Lý do (BUG/ADR nếu có) |
|---|---|---|---|
| 1 | 2026-11-05 | Bản nháp đầu | Anh Son: giao diện 2D quá đơn giản, muốn theo mẫu duyentu.io.vn; ADR-006 |
| 2 | 2026-11-05 | Lệnh `validate:world3d` chạy ngay sau `check:pack` thay vì ngay sau `validate:world` (mục 3.2, AC-031-12) | Xung đột với test đã khóa AC-008-09 phát hiện khi chạy `npm run check` |
| 3 | 2026-11-05 | Thêm `scenery` (cảnh nền ngoài lưới, R-3b), nền đất phủ vùng viền (R-12), AC-031-20 | Anh Son: muốn trồng cây bao quanh trường như trang mẫu; R-3 v2 chỉ cho đặt đồ trong lưới |
| 4 | 2026-11-05 | R-6b: phím đọc theo `KeyboardEvent.code`, nhả phím khi mất focus/ẩn trang; hàm `keyAction`; AC-031-21 | BUG-005: Unikey bật làm WASD trễ, đi quá, sai hướng || 5 | 2026-11-05 | R-6c: tracker bắt lần bấm bị bộ gõ nuốt qua keyup; R-6d: gợi ý tắt bộ gõ; AC-031-22, AC-031-23 | BUG-005 chưa hết: đo phím thật qua Unikey thấy keydown bị nuốt, chỉ keyup còn `code` |
