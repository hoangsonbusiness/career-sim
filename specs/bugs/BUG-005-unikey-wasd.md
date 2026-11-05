---
id: BUG-005
spec: SPEC-031
ac: AC-031-21
status: open
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
