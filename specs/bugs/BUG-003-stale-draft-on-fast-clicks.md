---
id: BUG-003
spec: SPEC-005
ac: "MỚI: chưa có AC — hành vi component React, chưa có test trình duyệt"
status: fixed
reported: 2026-11-03
---

# BUG-003 — Bấm nhanh nhiều nút trong bảng task làm mất thao tác

## Tái hiện
1. Mở một segment `drag_sort` (ví dụ "Dự giờ và góp ý chuyên môn").
2. Bấm chọn nhóm cho cả 4 nhận xét liên tiếp thật nhanh, trước khi React kịp vẽ lại (phát hiện khi chơi thử bằng script, máy chậm cũng gặp).

## Mong đợi / Thực tế
- Mong đợi: cả 4 nhận xét đều được xếp nhóm, nút "Nộp" bật.
- Thực tế: chỉ lần bấm cuối được giữ, nút "Nộp" vẫn tắt.

## Test tái hiện
Chưa có test tự động: lỗi nằm ở cách component gọi `setState`, cần trình duyệt để tái hiện (hạng mục E2E). Logic `update` của controller vẫn đúng (AC-005-04..10). Đã tái hiện và kiểm lại bằng chơi thử trên preview.

## Nguyên nhân & cách sửa
`act` trong `DayPlayer.tsx` và `GamePlayer.tsx` gọi `setDraft(update(task, draft, a))` với `draft` lấy từ lần render trước. Nhiều lần bấm trong cùng một nhịp đều dùng chung `draft` cũ, lần sau ghi đè lần trước. Sửa: `setDraft((d) => update(task, d, a))`.
