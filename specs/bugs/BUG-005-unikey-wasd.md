---
id: BUG-005
spec: SPEC-031
ac: AC-031-21
status: fixed
reported: 2026-11-05
---

# BUG-005 — Bật Unikey thì phím WASD trễ, đi quá, sai hướng

## Tái hiện
1. Bật Unikey (hoặc EVKey) kiểu gõ Telex.
2. Mở `/nghe/giao-vien-thpt/mot-ngay/`, bấm "Bắt đầu ngày làm việc".
3. Đi bằng W/A/S/D: bấm từng phím một lần, rồi giữ phím.

## Mong đợi / Thực tế
- Mong đợi (SPEC-006 R-8, R-14; SPEC-031 R-5, R-6): bấm một lần thì đi một ô; giữ phím thì đi liên tục, nhả ra thì dừng; hướng đi đúng phím.
- Thực tế (anh Son chơi thử): phím phản hồi trễ, nhân vật đi quá số lần bấm, có lúc đi sai hướng, khó dừng đúng chỗ việc. Với phím mũi tên thì mọi thứ bình thường.

## Nguyên nhân
Cả `scene3d.ts` và `src/game/scene.ts` tra phím bằng `KeyboardEvent.key`. Với Telex, W/A/S/D là phím bỏ dấu (ư, â, dấu sắc, đ). Bộ gõ chặn các phím này ngay cả ngoài ô nhập liệu, nên game nhận `key` khác đi, nhận sự kiện giả (code rỗng) và có lúc mất sự kiện nhả phím. Vì vậy `MoveInput` tưởng phím còn đang giữ, hoặc nhận thêm lượt bấm. Phím mũi tên không phải phím bỏ dấu nên không bị ảnh hưởng.

## Test tái hiện
`tests/spec-031/bug-005.test.mjs`: `keyAction` theo `code` (AC-031-21), và kiểm mã nguồn hai cảnh không còn tra phím bằng `e.key`.

## Cách sửa
SPEC-031 v4 R-6b: hàm thuần `keyAction(code)` trong `src/game3d/layout.ts`; hai cảnh dùng `e.code` cho cả nhấn và nhả; nhả mọi phím khi `blur` hoặc trang bị ẩn.

## Lần sửa 1 chưa đủ (2026-11-05)
Sau khi đổi sang `e.code` (SPEC-031 v4), anh Son vẫn gặp lỗi: đi lên sát tường bằng W rồi bấm A thì không đi.

Đo bằng phím thật qua Unikey trên máy anh Son: gửi phím bằng `SendInput` (scancode) tới một trang ghi sự kiện ở localhost.
- Phần lớn lần bấm, Unikey **nuốt `keydown` thật** và chèn sự kiện giả `code = ""`, `keyCode = 231`, `key` là `a`, `â`, `ư` hoặc `·`, có khi kèm 2 lần `Backspace`.
- `keyup` thật vẫn tới với đúng `code` (`KeyA`, `KeyW`…).
- Có lần Unikey cho `keydown` thật đi qua bình thường.

Bản sửa 1 bỏ qua sự kiện `code = ""`, nên lần bấm bị nuốt mất hẳn. Bản sửa 2 (SPEC-031 v5 R-6c, R-6d): tracker bắt lần bấm qua `keyup` (thành một bước), và hiện gợi ý tắt bộ gõ. Vector lấy từ log thật: `tests/spec-031/vectors-keys.json`.

## Kiểm chứng bản sửa 2 (2026-11-05)
Gửi phím thật bằng `SendInput` qua Unikey (Telex) vào trang game chạy trong Edge, đọc vị trí nhân vật qua cổng debug. Xuất phát (6,3) trong bản đồ nhà:
- W → (6,2); W sát tường → đứng yên; A → (5,2); A → (4,2); D → (5,2); S → (5,3); A ×3 từ (5,2) → (4,2) rồi dừng vì (3,2) là bàn.
- Giữ W 700 ms chỉ đi 1 ô (Unikey nuốt cả các keydown lặp lại). Đây là giới hạn đã nêu ở R-6d; game hiện dòng gợi ý tắt bộ gõ.
