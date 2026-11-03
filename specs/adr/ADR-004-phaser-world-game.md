# ADR-004 — Game thế giới 2D bằng Phaser 4 (thay ADR-003)

- Ngày: 2026-11-03
- Liên quan: SPEC-006, SPEC-005 v2. Thay thế ADR-003.

## Bối cảnh
ADR-003 chọn React + HTML cho mini-game để nhẹ và dễ test. Kết quả là màn chơi dạng biểu mẫu; anh Son đánh giá "full of text, không dùng nổi" và yêu cầu một game nhập vai thật: đi lại trong thế giới, tới người và đồ vật để làm việc.

## Các phương án
1. **Giữ React, thêm hình minh họa**: vẫn là biểu mẫu, không có cảm giác "ở trong" nghề.
2. **Canvas tự viết**: phải tự làm vòng lặp, tween, camera, input, tải ảnh.
3. **Phaser 4.2.1** (chọn): engine game 2D đầy đủ, hỗ trợ spritesheet có spacing, camera theo nhân vật, tween, bàn phím và chạm.

## Lựa chọn
Phương án 3, ghim `phaser@4.2.1`.

## Hệ quả
- Phaser nặng 346,6 KB gzip (đo trên `phaser.esm.min.js`), tải lười bằng `import()` khi bấm "Bắt đầu" (SPEC-006 R-16); trang đầu vẫn ≤ 300 KB. Ngân sách chunk game: 600 KB (AC-006-12).
- Logic di chuyển, va chạm, tìm đường, tương tác nằm trong `src/game/grid.ts` và `quest.ts` thuần, test không cần trình duyệt. `scene.ts` chỉ vẽ và nhận thao tác; chưa có test tự động (chờ hạng mục E2E).
- Bảng task vẫn là HTML phủ lên canvas, dùng lại controller SPEC-005 (bước 1). Hoạt cảnh riêng từng mini-game để bước 2.
- Vòng lặp Phaser dựa vào `requestAnimationFrame`: khi tab bị ẩn hoặc cửa sổ bị che, game chạy chậm hoặc dừng. Đây là hành vi bình thường của game trên web.
- Chưa có bộ Kenney Roguelike/RPG pack: sàn, tường, cỏ, lối đi tạm dùng bộ ô tự vẽ bằng code (`scripts/gen-world.mjs`, CC0). Khi có bộ RPG pack, chỉ cần đổi tileset trong file thế giới.
