---
id: BUG-004
spec: SPEC-006
ac: AC-006-02
status: fixed
reported: 2026-11-03
---

# BUG-004 — Nhân vật đi giật cục, phím phản hồi chậm

## Tái hiện
1. Mở game, giữ phím mũi tên phải.
2. Bấm phím khác trong lúc nhân vật đang bước.

## Mong đợi / Thực tế
- Mong đợi (SPEC-006 R-8, R-14): giữ phím thì nhân vật đi liên tục từng ô, mỗi ô 150 ms, không khựng; phím bấm trong lúc đang bước được áp dụng ngay khi bước xong.
- Thực tế (anh Son chơi thử): bước một ô, khựng khoảng nửa giây (chờ hệ điều hành lặp phím), rồi mới đi tiếp; phím bấm khi đang bước bị bỏ; hiệu ứng nhún 2 px làm nhân vật trông như nhảy cóc; camera bám có độ trễ.

## Test tái hiện
`tests/spec-006/bug-004.test.mjs`: logic phím tách ra `src/game/input.ts` (thuần) — giữ phím thì luôn có hướng đi tiếp; phím bấm khi đang bước được giữ lại; nhả phím thì dừng; phím bấm sau cùng được ưu tiên.

## Nguyên nhân & cách sửa
`scene.ts` chỉ đi một ô cho mỗi sự kiện `keydown`, bỏ qua `keydown` khi đang bước, và dựa vào tần số lặp phím của hệ điều hành. Sửa:
- `input.ts` theo dõi các phím đang giữ (phím nhấn sau cùng thắng) và một hướng đệm khi đang bước.
- Cuối mỗi bước, `scene.ts` hỏi `input.ts` hướng tiếp theo và đi ngay, không chờ sự kiện mới.
- Bỏ hiệu ứng nhún; tween tuyến tính để các ô nối nhau đều tốc độ; camera bám sát (lerp 1).
