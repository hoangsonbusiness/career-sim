# ADR-005 — Bỏ quiz, game một ngày chỉ còn "xem và nghe kể"

- Ngày: 2026-11-03
- Liên quan: SPEC-014. Thay một phần SPEC-006 (mode `task`/`result`, HUD chỉ số); SPEC-007 không còn được dùng.

## Bối cảnh
Mỗi phần trong ngày đang là một bài có đáp án đúng/sai và có chấm điểm qua chỉ số. Người chơi là học sinh chưa biết nghề, nên không có cơ sở để làm đúng. Thất bại liên tục làm các em không thấy được nghề trông như thế nào, trong khi đó chính là mục tiêu của app.

## Các phương án
1. **Làm theo hướng dẫn**: vẫn thao tác nhưng có gợi ý, không chấm. Vẫn còn dáng dấp bài tập.
2. **Tình huống không đúng/sai**: lựa chọn chỉ dẫn tới hệ quả. Cần viết lại hệ quả cho cả 6 nghề.
3. **Chỉ xem và nghe kể** (anh Son chọn): đi tới chỗ làm việc, xem lời kể, đọc thẻ "Ngoài đời thật" có nguồn, rồi đi tiếp.

## Lựa chọn
Phương án 3.

## Hệ quả
- Game không dùng engine SPEC-002 nữa. Vòng chơi chuyển sang reducer thuần `src/game/story.ts`. Engine, controller và các test đã khóa vẫn giữ nguyên.
- Thẻ "Ngoài đời thật" đưa `basis` có nguồn ra trước mắt người chơi, thay vì giấu sau nút 📖.
- Trường `task` trong nội dung trở thành dữ liệu thừa. Việc dọn dẹp để sang spec sau.
- Mất tín hiệu hành vi (thời gian làm, số lần làm lại) mà hạng mục REF/HOL định dùng. Khi làm REF cần tìm tín hiệu khác.
