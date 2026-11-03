---
id: SPEC-013
title: Gói nghề Nhân viên Marketing (nội dung + bản đồ agency)
version: 1
status: draft
features: [F2, F3, F4, F5]
owns: [content/professions/nhan-vien-marketing.json, content/worlds/nhan-vien-marketing.json]
owner: anh Son
created: 2026-11-03
---

# SPEC-013 — Gói nghề Nhân viên Marketing

> Viết theo specs/STANDARD.md. Mục 2–4 là phần quy phạm. Mọi quy tắc chung theo SPEC-008.

## 1. Bối cảnh & lý do
Marketing thu hút học sinh thích sáng tạo, nhưng công việc thực tế gồm nhiều số liệu (KPI), làm việc với khách hàng, và **giới hạn pháp lý về quảng cáo**. Phần "một ngày" đặt người chơi ở vai nhân viên một agency: nhận brief, duyệt nội dung, chọn ý tưởng, khách hàng đổi ý, xử lý bình luận tiêu cực, chia thời gian buổi chiều, đọc số liệu chiến dịch.

**Gợi ý nguồn cần kiểm chứng** (KHÔNG phải dữ kiện, SPEC-008 R-10): Luật Quảng cáo hiện hành và các văn bản sửa đổi, hướng dẫn; quy định về quảng cáo trên mạng xã hội; báo cáo lương marketing có năm; đề án tuyển sinh ngành Marketing; ESCO "marketing assistant"/"digital marketing"; chia sẻ của người làm marketing trên báo chí chính thống.

## 2. Phạm vi
- Trong phạm vi: `content/professions/nhan-vien-marketing.json` đủ mọi mục schema; `content/worlds/nhan-vien-marketing.json` (văn phòng agency); định nghĩa bản đồ trong `scripts/gen-world.mjs`.
- Ngoài phạm vi: dạy chạy quảng cáo; tên thương hiệu thật; nền tảng quảng cáo cụ thể.

## 3. Thiết kế

### 3.1 Bối cảnh nhân vật
Nhân viên marketing 1–2 năm kinh nghiệm tại một agency, phụ trách một chiến dịch cho thương hiệu **hư cấu** (ví dụ "Trà sữa Mây"). Cả ngày diễn ra trong văn phòng.

### 3.2 Chỉ số
| id | label | Ý nghĩa |
|---|---|---|
| `nang_luong` | Năng lượng | Sức làm việc còn lại |
| `sang_tao` | Sáng tạo | Chất lượng ý tưởng |
| `ap_luc` | Áp lực KPI | Căng thẳng chỉ tiêu |

### 3.3 Kế hoạch 7 phần
| # | Giờ | Việc | `task.type` | Nơi | `basis` cần nguồn chứng minh |
|---|---|---|---|---|---|
| 1 | 09:00 | Các bước từ brief tới kế hoạch chiến dịch | `sequence` | Phòng họp | Lập kế hoạch truyền thông/chiến dịch là nhiệm vụ của nghề |
| 2 | 10:00 | Duyệt nội dung bài quảng cáo trước khi đăng | `spot_error` | Bàn làm việc | Nội dung quảng cáo phải tuân thủ quy định pháp luật về quảng cáo |
| 3 | 11:30 | Xếp ý tưởng: đúng brief hay lạc đề | `drag_sort` | Bảng ý tưởng | Phát triển ý tưởng sáng tạo theo yêu cầu khách hàng |
| 4 | 13:30 | Khách hàng muốn đổi thông điệp sát ngày | `dialogue` | Phòng họp | Làm việc, thương lượng với khách hàng |
| 5 | 15:00 | Bài đăng bị bình luận tiêu cực lan nhanh | `choice` | Bàn làm việc | Quản lý, phản hồi trên mạng xã hội |
| 6 | 16:00 | Chia 3 giờ còn lại: viết nội dung, đọc số liệu, họp | `time_budget` | Bàn làm việc | Đo lường hiệu quả chiến dịch là một phần công việc |
| 7 | 18:00 | Số liệu chiến dịch thấp hơn mục tiêu | `choice` | Phòng sếp | Báo cáo kết quả chiến dịch theo chỉ tiêu |

- R-1. `spot_error` (phần 2) PHẢI dựa trên các hành vi bị cấm hoặc điều kiện bắt buộc trong pháp luật về quảng cáo còn hiệu lực; mỗi dòng lỗi PHẢI tương ứng một quy định có nguồn `law`. Không tìm được quy định cụ thể → dòng đó không được đánh là lỗi.
- R-2. Mọi thương hiệu, sản phẩm, người trong nội dung PHẢI là hư cấu; KHÔNG ĐƯỢC dùng tên, logo hay khẩu hiệu thật.
- R-3. Mặt khó PHẢI có ít nhất 3 fact có nguồn; ít nhất một fact về áp lực chỉ tiêu (KPI) và một fact về làm ngoài giờ khi có chiến dịch/sự cố.
- R-4. Phần 6 dùng `time_budget` với `budget_min = 180`, mỗi hoạt động là một việc trong nghề; `effect_per_30min` là minh họa và KHÔNG ĐƯỢC kèm con số thực tế trong `narrative`.

### 3.4 Bản đồ
- R-5. Bản đồ `agency` PHẢI có: khu bàn làm việc mở (spawn), phòng họp, bảng ý tưởng (ô trên tường), phòng trưởng nhóm. Không cần bản đồ `nha`; cả 7 phần diễn ra trong một bản đồ.
- R-6. NPC: trưởng nhóm (phần 1, 7), khách hàng (phần 4), đồng nghiệp designer (trang trí), đồng nghiệp content (trang trí).

### 3.5 Lỗi
Như SPEC-009 3.5.

### 3.6 Conformance vectors
Không áp dụng.

## 4. Tiêu chí chấp nhận

| ID | Given | When | Then |
|---|---|---|---|
| AC-013-01 | `content/professions/nhan-vien-marketing.json` | `npm run validate` | Exit 0 |
| AC-013-02 | `content/worlds/nhan-vien-marketing.json` | `npm run validate:world` | Exit 0; chỉ có 1 bản đồ |
| AC-013-03 | Gói `nhan-vien-marketing` | `npm run check:pack` | Có dòng `✓ nhan-vien-marketing` |
| AC-013-04 | Gói `nhan-vien-marketing` | Test chơi hết ngày | Kết thúc ở `done` |
| AC-013-05 | `nhan-vien-marketing.json` | Đọc `sources` | Có ≥ 1 nguồn `law` có `effective_date` và ≥ 1 nguồn `market` có `issued_date` |
| AC-013-06 | Segment phần 6 | Đọc `task` | `type = "time_budget"`, `budget_min = 180` |
| AC-013-07 | Bản build | Đọc trang hồ sơ và trang màn chơi | Cả hai tồn tại; `<h1>` trang hồ sơ = `name` |

## 5. Ghi chú kiểm thử
Như SPEC-009 mục 5; test đặt trong `tests/spec-013/`.

## 6. Câu hỏi mở
Em đã chốt theo đề xuất ở các quy tắc dưới. Anh đồng ý thì đánh `[x]`, không đồng ý thì sửa quy tắc tương ứng ở mục 3.
- [ ] 3.1: bối cảnh agency, thương hiệu hư cấu, cả ngày ở văn phòng (không có bản đồ nhà).
- [ ] R-1: mini-game duyệt nội dung chỉ đánh lỗi những gì có quy định pháp luật quảng cáo làm nguồn.
- [ ] 3.3: kế hoạch 7 phần trong ngày như bảng.

## 7. Lịch sử thay đổi
| Version | Ngày | Thay đổi | Lý do (BUG/ADR nếu có) |
|---|---|---|---|
| 1 | 2026-11-03 | Bản nháp đầu | PRD 4.1, SPEC-008 |
