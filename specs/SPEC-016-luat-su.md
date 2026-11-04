---
id: SPEC-016
title: Gói nghề Luật sư (nội dung + bản đồ văn phòng luật)
version: 1
status: draft
features: [F2, F3, F4, F5]
owns: [content/professions/luat-su.json, content/worlds/luat-su.json]
owner: anh Son
created: 2026-11-04
---

# SPEC-016 — Gói nghề Luật sư

> Viết theo specs/STANDARD.md. Mục 2–4 là phần quy phạm. Mọi quy tắc chung theo SPEC-008.

## 1. Bối cảnh & lý do
Học sinh hay hình dung luật sư qua phim: tranh luận hùng hồn ở tòa. Thực tế phần lớn thời gian là đọc hồ sơ, nghiên cứu văn bản, soạn giấy tờ, gặp khách hàng, và con đường trở thành luật sư dài (cử nhân luật → đào tạo nghề → tập sự → kiểm tra → chứng chỉ → gia nhập Đoàn). Phần "một ngày" đặt người chơi ở vai luật sư trẻ tại một văn phòng luật.

**Gợi ý nguồn cần kiểm chứng** (KHÔNG phải dữ kiện, SPEC-008 R-10): Luật Luật sư và các luật sửa đổi; nghị định hướng dẫn; thông tư về tập sự hành nghề luật sư; Bộ Quy tắc Đạo đức và Ứng xử nghề nghiệp luật sư của Liên đoàn Luật sư Việt Nam; Bộ luật Tố tụng dân sự về thời hạn tố tụng; đề án tuyển sinh ngành Luật; báo cáo lương ngành pháp lý có năm; ESCO "lawyer"; chia sẻ của luật sư trên báo chí chính thống. Kiểm tra hiệu lực theo CLAUDE.md R4.

## 2. Phạm vi
- Trong phạm vi: `content/professions/luat-su.json` đủ mọi mục schema; `content/worlds/luat-su.json`; định nghĩa bản đồ trong `scripts/gen-world.mjs`.
- Ngoài phạm vi: tư vấn pháp lý cho người dùng; vụ án thật; tên văn phòng, khách hàng thật.

## 3. Thiết kế

### 3.1 Bối cảnh nhân vật
Luật sư 1–2 năm sau khi được cấp chứng chỉ, làm tại một văn phòng luật **hư cấu**, phụ trách một vụ tranh chấp dân sự hư cấu (ví dụ tranh chấp hợp đồng thuê nhà). Buổi sáng có một phiên làm việc ở tòa.

### 3.2 Chỉ số
| id | label | Ý nghĩa |
|---|---|---|
| `nang_luong` | Năng lượng | Sức làm việc còn lại |
| `chat_che` | Chặt chẽ | Mức cẩn thận với hồ sơ, lập luận |
| `tin_nhiem` | Tin nhiệm | Niềm tin của khách hàng |

### 3.3 Kế hoạch 7 phần
| # | Giờ | Việc | `task.type` | Nơi | `basis` cần nguồn chứng minh |
|---|---|---|---|---|---|
| 1 | 08:00 | Các bước chuẩn bị hồ sơ trước phiên làm việc ở tòa | `sequence` | Bàn làm việc | Luật sư nghiên cứu hồ sơ, chuẩn bị tài liệu cho khách hàng |
| 2 | 09:30 | Rà lỗi một văn bản (đơn/hợp đồng) trước khi nộp | `spot_error` | Bàn làm việc | Văn bản tố tụng phải có nội dung bắt buộc theo luật |
| 3 | 11:00 | Xếp tài liệu: có giá trị chứng cứ hay không liên quan | `drag_sort` | Phòng hồ sơ | Luật sư thu thập, đánh giá chứng cứ |
| 4 | 13:30 | Khách hàng muốn luật sư "nói giúp" điều không đúng sự thật | `dialogue` | Phòng tiếp khách | Quy tắc đạo đức nghề luật sư cấm hành vi gian dối |
| 5 | 15:00 | Sắp hết hạn nộp tài liệu, thiếu một giấy tờ | `choice` | Bàn làm việc | Tố tụng có thời hạn luật định |
| 6 | 16:00 | Chia 3 giờ còn lại: nghiên cứu luật, soạn văn bản, gọi khách | `time_budget` | Bàn làm việc | Các việc này là nhiệm vụ của luật sư |
| 7 | 18:30 | Khách hàng của bên kia xin tư vấn cùng vụ | `choice` | Phòng tiếp khách | Quy tắc về xung đột lợi ích |

- R-1. `spot_error` (phần 2) PHẢI dựa trên nội dung bắt buộc của văn bản trong luật còn hiệu lực; mỗi dòng lỗi PHẢI có nguồn `law`. Không tìm được quy định → không đánh là lỗi.
- R-2. Phần 4 và 7 PHẢI dựa trên điều cụ thể của Bộ Quy tắc đạo đức luật sư hoặc Luật Luật sư, ghi vào `basis`.
- R-3. Nội dung KHÔNG ĐƯỢC chứa lời khuyên pháp lý người dùng có thể áp vào vụ việc thật. Thời hạn tố tụng chỉ nêu khi có nguồn `law`, không đưa vào narrative nếu không có trong `basis`.
- R-4. Mọi người, văn phòng, vụ việc PHẢI là hư cấu.
- R-5. Mặt khó PHẢI có ≥ 3 fact có nguồn; ít nhất một fact về thời gian dài trước khi hành nghề độc lập (đào tạo + tập sự) và một fact về áp lực thời hạn/làm ngoài giờ.
- R-6. `career`/`education` PHẢI nêu các bước để trở thành luật sư theo luật còn hiệu lực, nguồn `law`.
- R-7. Phần 6: `time_budget`, `budget_min = 180`; `effect_per_30min` minh họa, không kèm số thực tế trong narrative.

### 3.4 Bản đồ
- R-8. Bản đồ `van_phong_luat` PHẢI có: bàn làm việc (spawn), phòng hồ sơ, phòng tiếp khách, phòng luật sư điều hành. Phần 1 có thể kết thúc bằng cảnh chuyển sang tòa nhưng không cần bản đồ tòa; cả 7 phần chơi trong một bản đồ.
- R-9. NPC: luật sư điều hành (phần 1, 5), khách hàng (phần 4), người bên kia (phần 7), thư ký (trang trí).

### 3.5 Lỗi
Như SPEC-009 3.5.

### 3.6 Conformance vectors
Không áp dụng.

## 4. Tiêu chí chấp nhận

| ID | Given | When | Then |
|---|---|---|---|
| AC-016-01 | `content/professions/luat-su.json` | `npm run validate` | Exit 0 |
| AC-016-02 | `content/worlds/luat-su.json` | `npm run validate:world` | Exit 0; chỉ có 1 bản đồ |
| AC-016-03 | Gói `luat-su` | `npm run check:pack` | Có dòng `✓ luat-su` |
| AC-016-04 | Gói `luat-su` | Test chơi hết ngày | Kết thúc ở `done` |
| AC-016-05 | `luat-su.json` | Đọc `sources` | Có ≥ 2 nguồn `law` có `effective_date` và ≥ 1 nguồn `market` có `issued_date` |
| AC-016-06 | Segment phần 6 | Đọc `task` | `type = "time_budget"`, `budget_min = 180` |
| AC-016-07 | Bản build | Đọc trang hồ sơ và trang màn chơi | Cả hai tồn tại; `<h1>` trang hồ sơ = `name` |

## 5. Ghi chú kiểm thử
Như SPEC-009 mục 5; test trong `tests/spec-016/`. R-3 do người duyệt và Codex kiểm chéo.

## 6. Câu hỏi mở
Anh đồng ý thì đánh `[x]`, không đồng ý thì sửa quy tắc tương ứng ở mục 3.
- [ ] 3.1: luật sư tranh tụng dân sự ở văn phòng luật (không phải hình sự, pháp chế doanh nghiệp).
- [ ] R-8: phiên ở tòa chỉ là cảnh chuyển, không làm bản đồ tòa án.
- [ ] 3.3: kế hoạch 7 phần như bảng.

## 7. Lịch sử thay đổi
| Version | Ngày | Thay đổi | Lý do (BUG/ADR nếu có) |
|---|---|---|---|
| 1 | 2026-11-04 | Bản nháp đầu | PRD 4.1, SPEC-008 |
