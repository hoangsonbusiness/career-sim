# ADR-006 — Thế giới 3D stylized bằng Three.js (WebGPURenderer), giữ Phaser làm dự phòng

- Ngày: 2026-11-05
- Trạng thái: đề xuất (chờ anh Son duyệt cùng SPEC-031)
- Liên quan: SPEC-031 (mới), SPEC-006, SPEC-007, SPEC-014. Bổ sung cho ADR-004, không thay thế.

## Bối cảnh
Game "một ngày làm nghề" đang là bản đồ 2D nhìn từ trên xuống, vẽ bằng Phaser 4 với ô 16×16 px (ADR-004). Anh Son đánh giá giao diện "quá đơn giản và xấu". Anh muốn hướng tới chất lượng như https://duyentu.io.vn/: thế giới 3D stylized, camera góc thứ ba, ánh sáng mềm, HUD tông gỗ ấm.

Ngày 2026-11-05 em đọc bundle công khai của trang đó và thấy:
- Engine là **Three.js r187** (`__THREE__ = "187"`), dùng **WebGPURenderer** cùng TSL, có `MeshToonMaterial` và `PMREMGenerator`.
- Model ở dạng **GLB**, mỗi model có thêm bản `-lod1`, kèm bộ giải nén Draco, KTX2 và meshopt. Cây cỏ vẽ bằng `InstancedMesh`.
- Vật lý dùng **Rapier**, multiplayer dùng **Colyseus**.
- HUD làm bằng **React** (DOM phủ lên canvas), font **Lora** và Water Brush. Build bằng Vite (rolldown).

Kết luận: chất lượng hình ảnh đến từ asset 3D, ánh sáng và hậu kỳ. Nó không đến từ một engine đặc biệt nào.

## Các phương án
1. **Giữ Phaser 2D, đổi tileset đẹp hơn** (Kenney RPG, LPC). Rẻ nhất, nhưng vẫn là 2D nhìn từ trên xuống, xa mẫu anh muốn.
2. **Unity WebGL.** Hình đẹp, có sẵn editor. Đổi lại phải học và bảo trì một chuỗi công cụ ngoài Node, bản build nặng (thường > 10 MB), khó test bằng `node:test`, và không dùng chung được kiểu dữ liệu TypeScript sinh từ schema.
3. **Babylon.js.** Mạnh và nhiều tính năng có sẵn. Bundle lớn hơn Three. Không có lợi thế rõ so với Three cho nhu cầu của mình.
4. **React Three Fiber + drei.** Viết khai báo trong React, tiện. Nhưng thêm một lớp reconciler giữa React và vòng lặp render. Lớp `GameHandle` hiện có (mệnh lệnh: `showMap`, `setTarget`…) sẽ phải viết lại thành props/state, và GamePlayer phải đổi theo.
5. **Three.js thuần, viết mệnh lệnh, thay `scene.ts` bằng `scene3d.ts` cùng giao diện `GameHandle`** (chọn).

## Lựa chọn
Phương án 5:
- Ghim `three` ở **bản ổn định mới nhất trên npm vào ngày implement**, tối thiểu r187. Bản ghim được ghi bổ sung vào ADR này lúc implement.
- Dùng `WebGPURenderer` từ `three/webgpu`. Renderer này tự lùi về backend WebGL2 khi trình duyệt không có WebGPU. Máy không có cả WebGL2 thì GamePlayer dùng lại cảnh Phaser 2D hiện có.
- Logic lưới (`grid.ts`), vòng nhiệm vụ (`quest.ts`, `story.ts`), controller và mini-game **không đổi**. Nhân vật vẫn đi theo ô 1×1, nhưng chuyển động giữa hai ô được nội suy mượt và có hoạt cảnh đi bộ.
- Dữ liệu 3D của mỗi nghề là **file riêng** `content/worlds3d/<id>.json`, ánh xạ lên đúng lưới của file thế giới 2D. Nghề chưa có file 3D vẫn chạy Phaser. Nhờ vậy 30 nghề được chuyển dần, không có lúc nào hỏng cả loạt.
- Model GLB nén bằng **meshopt** (`gltfpack`). Bước 1 chưa dùng Draco và KTX2, để giảm số bộ giải nén phải tải và số thành phần dễ hỏng.
- **Không** dùng Rapier: va chạm đã do lưới `solid` xử lý. **Không** dùng Colyseus: app không có multiplayer.
- HUD giữ HTML/React và đổi sang theme mới (tông gỗ, viền vàng nhạt, font Lora tự host). HUD không vẽ trong canvas.

## Ghi lúc implement (2026-11-05)
- Ghim `three@0.187.0` và `@types/three@0.187.0` (bản mới nhất trên npm ngày implement).
- Hậu kỳ dùng `THREE.RenderPipeline` (r183 đổi tên từ `PostProcessing`) với `bloom` của `three/addons/tsl/display/BloomNode.js`.
- Chunk JS của đường 3D đo được 264 928 byte gzip mức 9, nằm trong ngân sách 716 800 byte (SPEC-031 R-18).
- Asset bước 1 lấy từ bộ Kenney có sẵn trong `assets-src/`: Furniture Kit 2.0 (15 model) và Mini Characters 1.0 (10 nhân vật), đều CC0. Tên hoạt cảnh `idle`/`walk` của Mini Characters được đổi thành `Idle`/`Walk` lúc chép sang `public/game3d/`. Đổi cùng độ dài byte nên cấu trúc GLB không đổi.
- Chưa có bộ cây cối/ngoại cảnh, nên sân trường hiện mới là bãi cỏ, lối gạch và tường thấp.
- Font Lora lấy từ repo google/fonts (OFL 1.1), tách 2 độ đậm 400/700 từ bản variable rồi nén woff2. Font có đủ dấu tiếng Việt.

## Lý do chính
- Thay đúng một module render, giữ nguyên hợp đồng `GameHandle`. Hơn 30 spec đã khóa test không bị ảnh hưởng.
- Three.js là thư viện chính của trang mẫu, đã chứng minh làm ra được chất lượng anh muốn.
- Giữ Phaser làm dự phòng thì không nghề nào hỏng trong lúc chuyển đổi, và máy yếu vẫn chơi được.

## Hệ quả
- Phải có asset GLB stylized với license rõ ràng (đề xuất Quaternius và Kenney, đều CC0). Asset chỉ được đưa vào sau khi kiểm license, kèm `License.txt`.
- Thêm một chunk JS tải lười, ngân sách riêng (SPEC-031). Trang đầu vẫn ≤ 300 KB.
- Cảnh 3D (ánh sáng, bóng, hậu kỳ) không test tự động được bằng `node:test`. Logic thuần (toạ độ, camera, ánh xạ phím, chọn ô bằng tia) có conformance vectors. Phần hình ảnh kiểm bằng chụp màn hình trên preview cho tới khi có hạng mục E2E.
- Hai renderer (Phaser và Three) cùng tồn tại cho tới khi mọi nghề có file 3D. Bỏ Phaser là quyết định của một ADR sau.
- Máy yếu: khi đo được FPS thấp, SPEC-031 hạ chất lượng (tắt hậu kỳ, giảm bóng) thay vì để game giật.
