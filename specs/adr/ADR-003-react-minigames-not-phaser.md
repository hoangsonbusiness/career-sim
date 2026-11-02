# ADR-003 — Mini-game bằng React + HTML, chưa dùng Phaser

- Ngày: 2026-11-02
- Liên quan: SPEC-005; lệch PRD mục 7 ("Phaser 3 cho các mini-game"). Anh Son đã đồng ý trong câu hỏi mở của SPEC-005.

## Bối cảnh
PRD dự kiến dùng Phaser cho mini-game. Khi viết SPEC-005, cả 6 loại task (`sequence`, `choice`, `drag_sort`, `spot_error`, `dialogue`, `time_budget`) đều là thao tác chọn, sắp xếp, bấm; không cần vẽ đồ họa, vật lý hay vòng lặp khung hình.

## Các phương án
1. **Phaser cho từng mini-game** như PRD: thêm một engine game lớn vào trang màn chơi; khó test không cần trình duyệt; khó dùng bằng bàn phím và trình đọc màn hình.
2. **React + HTML thường** (chọn): nút, radio, danh sách; logic tách vào `src/sim/controller.ts` thuần.
3. Kết hợp: HTML cho task, Phaser cho hoạt cảnh trang trí. Hoãn lại tới khi có nhu cầu.

## Lựa chọn
Phương án 2.

## Hệ quả
- JS trang màn chơi đo được 173,8 KB gzip (cùng mức trang chủ), dưới ngân sách 300 KB (AC-005-16).
- Kéo thả được thay bằng nút chọn nhóm; sắp xếp thứ tự dùng nút "Lên"/"Xuống".
- Engine (SPEC-002) không đổi; nếu sau này thêm Phaser thì chỉ thay lớp hiển thị.
- Hạng mục SIM trong ROADMAP vẫn ghi "Phaser"; đổi mô tả là quyết định của anh Son.
