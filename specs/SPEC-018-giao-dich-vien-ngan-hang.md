---
id: SPEC-018
title: Gói nghề Giao dịch viên ngân hàng (nội dung + bản đồ chi nhánh)
version: 1
status: draft
features: [F2, F3, F4, F5]
owns: [content/professions/giao-dich-vien-ngan-hang.json, content/worlds/giao-dich-vien-ngan-hang.json]
owner: anh Son
created: 2026-11-04
---

# SPEC-018 — Gói nghề Giao dịch viên ngân hàng

> Viết theo specs/STANDARD.md. Mục 2–4 là phần quy phạm. Mọi quy tắc chung theo SPEC-008.

## 1. Bối cảnh & lý do
Ngân hàng là lựa chọn phổ biến của học sinh khối A/D. Giao dịch viên là vị trí đầu vào thường gặp: phục vụ khách tại quầy, kiểm tra giấy tờ, phát hiện giao dịch đáng ngờ, chịu chỉ tiêu bán sản phẩm, và khớp quỹ cuối ngày. Phần "một ngày" đặt người chơi ở vai giao dịch viên tại một chi nhánh.

**Gợi ý nguồn cần kiểm chứng** (KHÔNG phải dữ kiện, SPEC-008 R-10): Luật Các tổ chức tín dụng hiện hành; Luật Phòng, chống rửa tiền và văn bản hướng dẫn; thông tư của Ngân hàng Nhà nước về mở và sử dụng tài khoản thanh toán, nhận biết khách hàng; cảnh báo lừa đảo của Ngân hàng Nhà nước/Bộ Công an; báo cáo lương ngành ngân hàng có năm; đề án tuyển sinh ngành Tài chính – Ngân hàng; ESCO "bank teller"; chia sẻ của giao dịch viên trên báo chí. Kiểm tra hiệu lực theo CLAUDE.md R4.

## 2. Phạm vi
- Trong phạm vi: `content/professions/giao-dich-vien-ngan-hang.json`; `content/worlds/giao-dich-vien-ngan-hang.json`; định nghĩa bản đồ trong `scripts/gen-world.mjs`.
- Ngoài phạm vi: tư vấn tài chính cá nhân cho người dùng; lãi suất, biểu phí cụ thể; tên ngân hàng thật.

## 3. Thiết kế

### 3.1 Bối cảnh nhân vật
Giao dịch viên 1–2 năm kinh nghiệm tại chi nhánh của một ngân hàng **hư cấu**. Cả ngày ở chi nhánh.

### 3.2 Chỉ số
| id | label | Ý nghĩa |
|---|---|---|
| `nang_luong` | Năng lượng | Sức làm việc còn lại |
| `chinh_xac` | Chính xác | Mức cẩn thận với giấy tờ, tiền |
| `chi_tieu` | Áp lực chỉ tiêu | Căng thẳng chỉ tiêu bán sản phẩm |

### 3.3 Kế hoạch 7 phần
| # | Giờ | Việc | `task.type` | Nơi | `basis` cần nguồn chứng minh |
|---|---|---|---|---|---|
| 1 | 07:45 | Các bước mở quầy: nhận quỹ đầu ngày, kiểm tra hệ thống | `sequence` | Quầy giao dịch | Giao dịch viên quản lý quỹ tiền mặt tại quầy |
| 2 | 09:00 | Kiểm tra hồ sơ mở tài khoản | `spot_error` | Quầy giao dịch | Quy định nhận biết khách hàng khi mở tài khoản |
| 3 | 10:30 | Xếp tình huống: dấu hiệu lừa đảo hay giao dịch bình thường | `drag_sort` | Quầy giao dịch | Cảnh báo chính thức về các thủ đoạn lừa đảo |
| 4 | 13:30 | Người cao tuổi muốn chuyển gấp tiền cho "cán bộ" gọi điện | `dialogue` | Quầy giao dịch | Như phần 3 |
| 5 | 15:00 | Trưởng phòng nhắc chỉ tiêu bán sản phẩm, khách không cần | `choice` | Phòng trưởng phòng | Áp lực chỉ tiêu trong nghề (nguồn báo chí/chia sẻ) |
| 6 | 15:30 | Chia 3 giờ: phục vụ khách, nhập liệu, gọi khách tiềm năng | `time_budget` | Quầy giao dịch | Các việc này là nhiệm vụ của nghề |
| 7 | 17:30 | Khớp quỹ cuối ngày bị lệch | `choice` | Kho quỹ | Đối chiếu quỹ cuối ngày là nhiệm vụ của nghề |

- R-1. `spot_error` (phần 2): mỗi dòng lỗi PHẢI có nguồn `law` (luật/thông tư về nhận biết khách hàng, mở tài khoản). Không có quy định → không đánh là lỗi.
- R-2. `drag_sort` (phần 3) PHẢI dựa trên cảnh báo của cơ quan nhà nước (`law` hoặc `official_stat`), không dựa trên báo chí đơn lẻ.
- R-3. Nội dung KHÔNG ĐƯỢC chứa lãi suất, biểu phí, hạn mức hay khuyến nghị sản phẩm tài chính. Phần 5 PHẢI có ít nhất một lựa chọn đặt quyền lợi khách hàng lên trên chỉ tiêu, và lựa chọn đó KHÔNG bị trừ `chinh_xac` hay `nang_luong`.
- R-4. Mọi ngân hàng, khách hàng PHẢI là hư cấu.
- R-5. Mặt khó PHẢI có ≥ 3 fact có nguồn; ít nhất một fact về chỉ tiêu bán hàng và một fact về trách nhiệm khi sai lệch quỹ (không có nguồn công khai → `needs_verification`).
- R-6. Phần 6: `time_budget`, `budget_min = 180`; `effect_per_30min` minh họa, không kèm số thực tế trong narrative.

### 3.4 Bản đồ
- R-7. Bản đồ `chi-nhanh` PHẢI có: quầy giao dịch (spawn), khu khách chờ, phòng trưởng phòng, kho quỹ. Một bản đồ.
- R-8. NPC: trưởng phòng (phần 1, 5, 7), khách mở tài khoản (phần 2), khách cao tuổi (phần 4), bảo vệ (trang trí).

### 3.5 Lỗi
Như SPEC-009 3.5.

### 3.6 Conformance vectors
Không áp dụng.

## 4. Tiêu chí chấp nhận

| ID | Given | When | Then |
|---|---|---|---|
| AC-018-01 | `content/professions/giao-dich-vien-ngan-hang.json` | `npm run validate` | Exit 0 |
| AC-018-02 | `content/worlds/giao-dich-vien-ngan-hang.json` | `npm run validate:world` | Exit 0; chỉ có 1 bản đồ |
| AC-018-03 | Gói `giao-dich-vien-ngan-hang` | `npm run check:pack` | Có dòng `✓ giao-dich-vien-ngan-hang` |
| AC-018-04 | Gói `giao-dich-vien-ngan-hang` | Test chơi hết ngày | Kết thúc ở `done` |
| AC-018-05 | `giao-dich-vien-ngan-hang.json` | Đọc `sources` | Có ≥ 2 nguồn `law` có `effective_date` và ≥ 1 nguồn `market` có `issued_date` |
| AC-018-06 | Segment phần 6 | Đọc `task` | `type = "time_budget"`, `budget_min = 180` |
| AC-018-07 | Segment phần 5 | Đọc `task.options` | Có ≥ 1 lựa chọn mà `effects` không giảm `chinh_xac` và không giảm `nang_luong` |
| AC-018-08 | Bản build | Đọc trang hồ sơ và trang màn chơi | Cả hai tồn tại; `<h1>` trang hồ sơ = `name` |

## 5. Ghi chú kiểm thử
Như SPEC-009 mục 5; test trong `tests/spec-018/`. Phần không có liều/lãi suất (R-3) do người duyệt và Codex kiểm chéo.

## 6. Câu hỏi mở
Anh đồng ý thì đánh `[x]`, không đồng ý thì sửa quy tắc tương ứng ở mục 3.
- [ ] 3.1: giao dịch viên (không phải chuyên viên tín dụng), một bản đồ chi nhánh.
- [ ] R-3: lựa chọn vì khách hàng ở phần 5 không bị trừ điểm.
- [ ] 3.3: kế hoạch 7 phần như bảng.

## 7. Lịch sử thay đổi
| Version | Ngày | Thay đổi | Lý do (BUG/ADR nếu có) |
|---|---|---|---|
| 1 | 2026-11-04 | Bản nháp đầu | PRD 4.1, SPEC-008 |
