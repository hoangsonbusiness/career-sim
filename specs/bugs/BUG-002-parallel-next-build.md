---
id: BUG-002
spec: none          # script `test` trong package.json (bộ công cụ) chưa thuộc spec nào
ac: "MỚI: chưa có AC — công cụ SDD chưa có spec"
status: fixed
reported: 2026-11-02
---

# BUG-002 — Test build chạy song song làm `next build` thất bại

## Tái hiện
1. Có từ hai file test trở lên cùng gọi `npm run build` trong `before()` (hiện có `tests/spec-003/build.test.mjs` và `tests/spec-004/build.test.mjs`).
2. Chạy `npm test`.

## Mong đợi / Thực tế
- Mong đợi: mọi test build xanh như khi chạy riêng từng file.
- Thực tế: `node --test` chạy các file song song; một trong hai `next build` báo "Another next build process is already running", các test AC-004-09..13 đỏ.

## Test tái hiện
Chính các test AC-004-09..13 khi chạy qua `npm test` (đã quan sát đỏ, đúng lỗi trên). Không thêm file test mới.

## Nguyên nhân & cách sửa
`node --test` mặc định chạy mỗi file trong một tiến trình con song song. Next.js giữ khóa cho thư mục `.next/` khi build. Sửa: script `test` chạy với `--test-concurrency=1` để các file test chạy tuần tự. Đổi lại `npm test` chậm hơn.

## Ghi chú
Khi số test build tăng, cân nhắc gộp về một bước build dùng chung (build một lần trước `npm test`).
