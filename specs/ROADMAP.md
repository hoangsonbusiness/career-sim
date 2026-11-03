# Roadmap

Danh sách mọi hạng mục cần làm cho bản demo, sinh từ `PRD.md` mục 5. `npm run next` đọc bảng này để gợi ý **hạng mục tiếp theo**: ưu tiên cao nhất, đã đủ phụ thuộc, chưa có spec.

Quy ước:
- **Mã** 2–5 chữ in hoa, cố định suốt dự án.
- **Phụ thuộc**: mã các hạng mục phải `implemented` trước. `—` = không phụ thuộc.
- **Spec**: điền `SPEC-NNN` khi đã tạo spec; `—` = chưa có.
- Hạng mục **xong** khi spec của nó ở trạng thái `implemented`.
- Thêm hoặc đổi thứ tự hạng mục là quyết định của anh Son; agent chỉ được đề xuất.

| Mã | Hạng mục | Feature | Ưu tiên | Phụ thuộc | Spec |
|---|---|---|---|---|---|
| CNT | Kiểm tra tự động nội dung nghề | F2, F5 | P0 | — | SPEC-001 |
| ENG | Engine mô phỏng (logic) | F3 | P0 | — | SPEC-002 |
| APP | Khung app: Next.js, routing, nạp content JSON, sinh type từ schema | — | P0 | — | SPEC-003 |
| CAT | Danh mục nghề: lưới thẻ, lọc, tìm kiếm | F1 | P0 | APP | — |
| PRO | Trang hồ sơ nghề + popover nguồn trích dẫn | F2, F5 | P0 | APP, CNT | SPEC-004 |
| SIM | Màn chơi: render engine bằng Phaser, 6 loại mini-game | F3 | P0 | APP, ENG | SPEC-005, SPEC-006, SPEC-007 |
| LAD | Lộ trình thăng tiến (đồ thị) | F4 | P0 | PRO | — |
| REF | Tổng kết sau mô phỏng + lưu tín hiệu hành vi | F7 | P1 | SIM | — |
| HOL | Trắc nghiệm Holland + gợi ý top 3 nghề | F6 | P1 | REF, CAT | — |
| ABT | Trang "Về dữ liệu" | F8 | P1 | PRO | — |
| E2E | Test E2E Playwright cho luồng chính | F1–F5 | P1 | CAT, PRO, SIM | — |
