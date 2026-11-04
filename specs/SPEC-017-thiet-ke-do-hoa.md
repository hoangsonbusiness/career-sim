---
id: SPEC-017
title: Gói nghề Nhà thiết kế đồ họa (nội dung + bản đồ studio)
version: 1
status: draft
features: [F2, F3, F4, F5]
owns: [content/professions/thiet-ke-do-hoa.json, content/worlds/thiet-ke-do-hoa.json]
owner: anh Son
created: 2026-11-04
---

# SPEC-017 — Gói nghề Nhà thiết kế đồ họa

> Viết theo specs/STANDARD.md. Mục 2–4 là phần quy phạm. Mọi quy tắc chung theo SPEC-008.

## 1. Bối cảnh & lý do
Thiết kế đồ họa hút học sinh thích vẽ, nhưng nghề thật gồm làm theo brief, sửa nhiều vòng theo phản hồi, kỹ thuật in/xuất file, và **bản quyền** hình ảnh, phông chữ. Nhiều người làm tự do (freelance) nên thu nhập không đều. Phần "một ngày" đặt người chơi ở vai designer tại một studio nhỏ.

**Gợi ý nguồn cần kiểm chứng** (KHÔNG phải dữ kiện, SPEC-008 R-10): Luật Sở hữu trí tuệ và luật sửa đổi gần nhất (quyền tác giả, tác phẩm mỹ thuật ứng dụng); nghị định hướng dẫn về quyền tác giả; đề án tuyển sinh ngành Thiết kế đồ họa; báo cáo lương ngành thiết kế/sáng tạo có năm; ESCO "graphic designer"; chia sẻ của designer trên báo chí chính thống. Kiểm tra hiệu lực theo CLAUDE.md R4.

## 2. Phạm vi
- Trong phạm vi: `content/professions/thiet-ke-do-hoa.json`; `content/worlds/thiet-ke-do-hoa.json`; định nghĩa bản đồ trong `scripts/gen-world.mjs`.
- Ngoài phạm vi: dạy phần mềm thiết kế; tên phần mềm/thương hiệu thật; mini-game vẽ tự do.

## 3. Thiết kế

### 3.1 Bối cảnh nhân vật
Designer 1–2 năm kinh nghiệm tại một studio **hư cấu**, đang làm bộ nhận diện cho một tiệm bánh **hư cấu**. Cả ngày ở studio.

### 3.2 Chỉ số
| id | label | Ý nghĩa |
|---|---|---|
| `nang_luong` | Năng lượng | Sức làm việc còn lại |
| `sang_tao` | Sáng tạo | Chất lượng thiết kế |
| `deadline` | Áp lực deadline | Căng thẳng tiến độ |

### 3.3 Kế hoạch 7 phần
| # | Giờ | Việc | `task.type` | Nơi | `basis` cần nguồn chứng minh |
|---|---|---|---|---|---|
| 1 | 09:00 | Các bước từ đọc brief tới phác thảo | `sequence` | Bàn làm việc | Quy trình thiết kế bắt đầu từ yêu cầu khách hàng |
| 2 | 10:30 | Soát file trước khi gửi in | `spot_error` | Bàn làm việc | Chuẩn bị file in là một nhiệm vụ của nghề |
| 3 | 11:30 | Xếp tư liệu: được phép dùng hay vi phạm bản quyền | `drag_sort` | Bảng moodboard | Quyền tác giả với hình ảnh, phông chữ |
| 4 | 13:30 | Khách đòi sửa lần thứ năm, ngoài thỏa thuận | `dialogue` | Phòng họp | Làm việc với khách hàng, phạm vi hợp đồng |
| 5 | 15:00 | Khách gửi logo "lấy cảm hứng" giống hệt logo khác | `choice` | Bàn làm việc | Như phần 3 |
| 6 | 16:00 | Chia 3 giờ: thiết kế, sửa theo phản hồi, chuẩn bị file | `time_budget` | Bàn làm việc | Các việc này là nhiệm vụ của nghề |
| 7 | 18:30 | Trưởng nhóm chê bản thiết kế trước giờ giao | `choice` | Phòng trưởng nhóm | Nhận và xử lý phản hồi là một phần nghề |

- R-1. `spot_error` (phần 2) chỉ đánh lỗi những gì có nguồn (tài liệu kỹ thuật in của nhà in/trường đào tạo, hoặc `reference`); không có nguồn → không đánh là lỗi.
- R-2. `drag_sort` (phần 3) và phần 5 PHẢI dựa trên quy định quyền tác giả có nguồn `law`. Trường hợp pháp luật chưa rõ (ví dụ ranh giới "lấy cảm hứng") → KHÔNG đánh đúng/sai, chỉ dùng làm tình huống `choice` có `note`.
- R-3. Mọi thương hiệu, logo, tác phẩm trong nội dung PHẢI hư cấu; KHÔNG ĐƯỢC dùng hình ảnh hay phông chữ thật.
- R-4. Mặt khó PHẢI có ≥ 3 fact có nguồn; ít nhất một fact về sửa nhiều vòng/làm ngoài giờ và một fact về thu nhập không ổn định của người làm tự do.
- R-5. Phần 6: `time_budget`, `budget_min = 180`; `effect_per_30min` minh họa, không kèm số thực tế trong narrative.

### 3.4 Bản đồ
- R-6. Bản đồ `studio` PHẢI có: bàn làm việc (spawn), bảng moodboard (ô trên tường), phòng họp, phòng trưởng nhóm. Một bản đồ.
- R-7. NPC: trưởng nhóm (phần 1, 7), khách hàng (phần 4, 5), đồng nghiệp in ấn (trang trí).

### 3.5 Lỗi
Như SPEC-009 3.5.

### 3.6 Conformance vectors
Không áp dụng.

## 4. Tiêu chí chấp nhận

| ID | Given | When | Then |
|---|---|---|---|
| AC-017-01 | `content/professions/thiet-ke-do-hoa.json` | `npm run validate` | Exit 0 |
| AC-017-02 | `content/worlds/thiet-ke-do-hoa.json` | `npm run validate:world` | Exit 0; chỉ có 1 bản đồ |
| AC-017-03 | Gói `thiet-ke-do-hoa` | `npm run check:pack` | Có dòng `✓ thiet-ke-do-hoa` |
| AC-017-04 | Gói `thiet-ke-do-hoa` | Test chơi hết ngày | Kết thúc ở `done` |
| AC-017-05 | `thiet-ke-do-hoa.json` | Đọc `sources` | Có ≥ 1 nguồn `law` có `effective_date` và ≥ 1 nguồn `market` có `issued_date` |
| AC-017-06 | Segment phần 6 | Đọc `task` | `type = "time_budget"`, `budget_min = 180` |
| AC-017-07 | Bản build | Đọc trang hồ sơ và trang màn chơi | Cả hai tồn tại; `<h1>` trang hồ sơ = `name` |

## 5. Ghi chú kiểm thử
Như SPEC-009 mục 5; test trong `tests/spec-017/`.

## 6. Câu hỏi mở
Anh đồng ý thì đánh `[x]`, không đồng ý thì sửa quy tắc tương ứng ở mục 3.
- [ ] 3.1: designer ở studio (không phải freelance tại nhà), cả ngày một bản đồ.
- [ ] R-2: ranh giới "lấy cảm hứng" không có đáp án đúng/sai.
- [ ] 3.3: kế hoạch 7 phần như bảng.

## 7. Lịch sử thay đổi
| Version | Ngày | Thay đổi | Lý do (BUG/ADR nếu có) |
|---|---|---|---|
| 1 | 2026-11-04 | Bản nháp đầu | PRD 4.1, SPEC-008 |
