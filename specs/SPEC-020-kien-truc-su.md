---
id: SPEC-020
title: Gói nghề Kiến trúc sư (nội dung + bản đồ văn phòng kiến trúc)
version: 1
status: draft
features: [F2, F3, F4, F5]
owns: [content/professions/kien-truc-su.json, content/worlds/kien-truc-su.json]
owner: anh Son
created: 2026-11-04
---

# SPEC-020 — Gói nghề Kiến trúc sư

> Viết theo specs/STANDARD.md. Mục 2–4 là phần quy phạm. Mọi quy tắc chung theo SPEC-008.

## 1. Bối cảnh & lý do
Kiến trúc thu hút học sinh khối V/H thích vẽ và thiết kế. Nghề thật đòi hỏi cân bằng ý tưởng với **quy chuẩn xây dựng**, ngân sách, yêu cầu chủ đầu tư; học dài (thường 5 năm) và cần chứng chỉ hành nghề kiến trúc. Khác SPEC-012 (kỹ sư xây dựng ở công trường), nghề này ở văn phòng thiết kế.

**Gợi ý nguồn cần kiểm chứng** (KHÔNG phải dữ kiện, SPEC-008 R-10): Luật Kiến trúc và nghị định hướng dẫn; quy định về chứng chỉ hành nghề kiến trúc; Quy tắc ứng xử nghề nghiệp của kiến trúc sư hành nghề; quy chuẩn kỹ thuật quốc gia về quy hoạch xây dựng và an toàn cháy cho nhà và công trình (bản mới nhất); đề án tuyển sinh ngành Kiến trúc; báo cáo lương ngành kiến trúc có năm; ESCO "architect"; chia sẻ của kiến trúc sư trên báo chí chính thống. Kiểm tra hiệu lực theo CLAUDE.md R4.

## 2. Phạm vi
- Trong phạm vi: `content/professions/kien-truc-su.json`; `content/worlds/kien-truc-su.json`; định nghĩa bản đồ trong `scripts/gen-world.mjs`.
- Ngoài phạm vi: dạy vẽ kỹ thuật; thông số quy chuẩn chi tiết người dùng có thể áp vào nhà thật; công trình, công ty thật.

## 3. Thiết kế

### 3.1 Bối cảnh nhân vật
Kiến trúc sư 2–3 năm kinh nghiệm tại một văn phòng **hư cấu**, đang thiết kế một nhà ở phố **hư cấu** cho một gia đình. Buổi chiều có một lần ra khu đất (cảnh chuyển, không cần bản đồ riêng).

### 3.2 Chỉ số
| id | label | Ý nghĩa |
|---|---|---|
| `nang_luong` | Năng lượng | Sức làm việc còn lại |
| `sang_tao` | Sáng tạo | Chất lượng ý tưởng |
| `tuan_thu` | Tuân thủ | Mức đúng quy chuẩn |

### 3.3 Kế hoạch 7 phần
| # | Giờ | Việc | `task.type` | Nơi | `basis` cần nguồn chứng minh |
|---|---|---|---|---|---|
| 1 | 08:30 | Các bước từ khảo sát tới phương án sơ bộ | `sequence` | Bàn làm việc | Quy trình thiết kế kiến trúc theo luật |
| 2 | 09:30 | Soát bản vẽ trước khi trình | `spot_error` | Bàn làm việc | Quy chuẩn kỹ thuật bắt buộc (ví dụ lối thoát nạn) |
| 3 | 11:00 | Xếp yêu cầu của chủ nhà: làm được hay trái quy định | `drag_sort` | Bảng phương án | Quy chuẩn, quy hoạch còn hiệu lực |
| 4 | 13:30 | Chủ nhà muốn xây vượt tầng cho phép | `dialogue` | Phòng họp | Quy tắc ứng xử nghề và quy định quy hoạch |
| 5 | 15:00 | Ngân sách bị cắt, phải bỏ bớt ý tưởng | `choice` | Phòng họp | Làm việc với chủ đầu tư về chi phí |
| 6 | 16:00 | Chia 3 giờ: dựng mô hình, sửa bản vẽ, phối hợp kỹ sư | `time_budget` | Bàn làm việc | Các việc này là nhiệm vụ của nghề |
| 7 | 18:30 | Kỹ sư kết cấu báo phương án khó thi công | `choice` | Phòng chủ trì | Phối hợp kiến trúc – kết cấu |

- R-1. `spot_error` (phần 2) và `drag_sort` (phần 3): mỗi lỗi/thẻ "trái quy định" PHẢI có nguồn `law` (luật hoặc quy chuẩn bắt buộc, có `effective_date`). Không có quy định → không đánh là lỗi.
- R-2. Nội dung KHÔNG ĐƯỢC đưa thông số quy chuẩn (kích thước, chiều cao, số tầng) vào narrative trừ khi có trong `basis`.
- R-3. Mọi công trình, người, văn phòng PHẢI hư cấu.
- R-4. Mặt khó PHẢI có ≥ 3 fact có nguồn; ít nhất một fact về thời gian học/điều kiện chứng chỉ hành nghề và một fact về làm ngoài giờ trước hạn nộp hồ sơ.
- R-5. `career`/`education` PHẢI nêu điều kiện cấp chứng chỉ hành nghề kiến trúc theo văn bản còn hiệu lực, nguồn `law`.
- R-6. Phần 6: `time_budget`, `budget_min = 180`; `effect_per_30min` minh họa, không kèm số thực tế trong narrative.

### 3.4 Bản đồ
- R-7. Bản đồ `van-phong-kien-truc` PHẢI có: bàn làm việc (spawn), bảng phương án (ô trên tường), phòng họp, phòng kiến trúc sư chủ trì, bàn mô hình. Một bản đồ.
- R-8. NPC: kiến trúc sư chủ trì (phần 1, 7), chủ nhà (phần 4, 5), kỹ sư kết cấu (phần 7), đồng nghiệp dựng hình (trang trí).

### 3.5 Lỗi
Như SPEC-009 3.5.

### 3.6 Conformance vectors
Không áp dụng.

## 4. Tiêu chí chấp nhận

| ID | Given | When | Then |
|---|---|---|---|
| AC-020-01 | `content/professions/kien-truc-su.json` | `npm run validate` | Exit 0 |
| AC-020-02 | `content/worlds/kien-truc-su.json` | `npm run validate:world` | Exit 0; chỉ có 1 bản đồ |
| AC-020-03 | Gói `kien-truc-su` | `npm run check:pack` | Có dòng `✓ kien-truc-su` |
| AC-020-04 | Gói `kien-truc-su` | Test chơi hết ngày | Kết thúc ở `done` |
| AC-020-05 | `kien-truc-su.json` | Đọc `sources` | Có ≥ 2 nguồn `law` có `effective_date` và ≥ 1 nguồn `market` có `issued_date` |
| AC-020-06 | Segment phần 6 | Đọc `task` | `type = "time_budget"`, `budget_min = 180` |
| AC-020-07 | Bản build | Đọc trang hồ sơ và trang màn chơi | Cả hai tồn tại; `<h1>` trang hồ sơ = `name` |

## 5. Ghi chú kiểm thử
Như SPEC-009 mục 5; test trong `tests/spec-020/`.

## 6. Câu hỏi mở
Anh đồng ý thì đánh `[x]`, không đồng ý thì sửa quy tắc tương ứng ở mục 3.
- [x] 3.1: kiến trúc sư nhà ở tại văn phòng; ra khu đất chỉ là cảnh chuyển.
- [x] R-1: chỉ đánh lỗi theo quy chuẩn bắt buộc có nguồn `law`.
- [x] 3.3: kế hoạch 7 phần như bảng.

## 7. Lịch sử thay đổi
| Version | Ngày | Thay đổi | Lý do (BUG/ADR nếu có) |
|---|---|---|---|
| 1 | 2026-11-04 | Bản nháp đầu | PRD 4.1, SPEC-008 |
