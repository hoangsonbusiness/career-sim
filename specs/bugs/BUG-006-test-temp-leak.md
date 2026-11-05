---
id: BUG-006
spec: none          # tests/tooling (bộ công cụ SDD) chưa thuộc spec nào, giống BUG-001
ac: "MỚI: chưa có AC — công cụ SDD chưa có spec (xem Ghi chú)"
status: fixed
reported: 2026-11-05
---

# BUG-006 — Test bỏ lại bản chép repo trong thư mục tạm, làm đầy ổ C

## Tái hiện
1. Chạy `npm run check` (hoặc `npm test`) vài chục lần trên Windows.
2. Mở `%LOCALAPPDATA%\Temp`.

## Mong đợi / Thực tế
- Mong đợi: test dọn thư mục tạm của chính nó; chạy bao nhiêu lần cũng không để lại gì.
- Thực tế (đo ngày 2026-11-05): 104 thư mục `bug001-*`, tổng 21,52 GB, mỗi thư mục khoảng 0,35 GB. Ngoài ra còn khoảng 100 thư mục `spec003-*` (1,76 GB) và vài trăm thư mục nhỏ `spec031-*`, `spec006-*`, `spec008-*`, `spec001-*`.

## Test tái hiện
`tests/tooling/bug-006.test.mjs`: chạy `tests/tooling/bug-001.test.mjs` trong tiến trình con, trỏ `TEMP`/`TMP`/`TMPDIR` tới một thư mục riêng, rồi kiểm tra thư mục đó rỗng sau khi chạy xong.

## Nguyên nhân & cách sửa
`tests/tooling/bug-001.test.mjs` chép repo sang `mkdtempSync(tmpdir())` nhưng:
- không bao giờ xóa bản chép;
- danh sách bỏ qua thiếu `.next` và `out` (kết quả build), nên mỗi bản chép nặng hàng trăm MB.

Cách sửa: bỏ qua thêm `.next`, `out`; xóa bản chép trong `finally` (`rmSync(dir, { recursive: true, force: true })`).

## Lần sửa 2: dọn cả test đã khóa (2026-11-05)
Các test sau cũng tạo thư mục tạm mà không dọn, nhưng **đã khóa** (D10) nên không sửa được: `tests/spec-001/validate.test.mjs`, `tests/spec-003/tooling.test.mjs` (khoảng 18 MB mỗi lần chạy), `tests/spec-006/world.test.mjs`, `tests/spec-008/pack.test.mjs`, `tests/spec-031/scenery.test.mjs`, `tests/spec-031/world3d.test.mjs`.

Theo yêu cầu của anh Son ("phải xóa hết, kể cả test khóa"), lần sửa này dọn ở tầng trình chạy, không đụng vào file test:
- `scripts/run-tests.mjs` tạo một thư mục tạm riêng, đặt `TEMP`/`TMP`/`TMPDIR` trỏ vào đó, chạy `node --test`, rồi xóa thư mục đó trong `finally`. Mã thoát giữ nguyên theo kết quả test.
- `npm test` (và `npm run check`, `npm run complete`, vì cả hai gọi `npm test`) chạy qua script này.
- Test: `tests/tooling/bug-006-runner.test.mjs`.

Giới hạn: nếu tiến trình bị giết cứng (đóng terminal, Task Manager) thì bước `finally` không chạy. Khi đó thư mục `career-sim-test-*` còn lại trong Temp và cần xóa tay.

## Ghi chú
`scripts/run-tests.mjs` là công cụ SDD, chưa có spec sở hữu (xem BUG-001).
