---
id: SPEC-023
title: Gói nghề Hướng dẫn viên du lịch (nội dung + bản đồ điểm tham quan)
version: 1
status: draft
features: [F2, F3, F4, F5]
owns: [content/professions/huong-dan-vien-du-lich.json, content/worlds/huong-dan-vien-du-lich.json]
owner: anh Son
created: 2026-11-04
---

# SPEC-023 — Gói nghề Hướng dẫn viên du lịch

> Viết theo specs/STANDARD.md. Mục 2–4 là phần quy phạm. Mọi quy tắc chung theo SPEC-008.

## 1. Bối cảnh & lý do
Du lịch thu hút học sinh thích giao tiếp, ngoại ngữ. Nghề thật cần thẻ hướng dẫn viên, chịu trách nhiệm an toàn đoàn khách, làm việc theo mùa vụ, xa nhà, thu nhập không ổn định. Mô phỏng một ngày dẫn đoàn nội địa.

**Gợi ý nguồn cần kiểm chứng** (KHÔNG phải dữ kiện, SPEC-008 R-10): Luật Du lịch và văn bản hướng dẫn còn hiệu lực về điều kiện cấp thẻ hướng dẫn viên (nội địa, quốc tế, tại điểm); quy định về trách nhiệm của hướng dẫn viên; số liệu cơ quan quản lý du lịch, Tổng cục Thống kê về lượng khách; đề án tuyển sinh ngành Quản trị dịch vụ du lịch và lữ hành; báo cáo thu nhập ngành du lịch có năm; ESCO "tour guide"; chia sẻ của hướng dẫn viên trên báo chí chính thống. Kiểm tra hiệu lực theo CLAUDE.md R4.

**Văn bản đã tra (2026-11-04, từ kết quả tìm kiếm; CHƯA mở toàn văn, phải kiểm chứng trước khi đưa vào `sources`):**
- Luật Du lịch 2017, số 09/2017/QH14, hiệu lực 01/01/2018; theo thuvienphapluat.vn chưa có luật thay thế. Tuy nhiên cổng duthaoonline.quochoi.vn có dự thảo Luật Du lịch (sửa đổi) → PHẢI kiểm tra đã thông qua/có hiệu lực chưa (R4).
- Thông tư 06/2017/TT-BVHTTDL được sửa bởi Thông tư 04/2024/TT-BVHTTDL (26/6/2024), có quy định về thẻ hướng dẫn viên và điều kiện ngoại ngữ (bvhttdl.gov.vn, baochinhphu.vn); hợp nhất tại VBHN 5538/VBHN-BVHTTDL.
- MÂU THUẪN cần xử lý: một kết quả tìm kiếm gắn VBHN 5538 với “Nghị định 295/2025/NĐ-CP”, nhưng Nghị định 295/2025/NĐ-CP tìm được lại thuộc lĩnh vực viễn thông. Phải mở toàn văn VBHN trước khi trích.
- Quyết định 77/2026 cập nhật thủ tục hành chính du lịch (nguồn luật sư tư, cần tìm bản gốc trên cổng Bộ).

## 2. Phạm vi
- Trong phạm vi: `content/professions/huong-dan-vien-du-lich.json`; `content/worlds/huong-dan-vien-du-lich.json`; định nghĩa bản đồ trong `scripts/gen-world.mjs`.
- Ngoài phạm vi: thông tin lịch sử – văn hóa về địa danh thật; giá tour; công ty lữ hành thật.

## 3. Thiết kế

### 3.1 Bối cảnh nhân vật
Hướng dẫn viên nội địa 2 năm kinh nghiệm, dẫn một đoàn 30 khách tham quan một quần thể di tích **hư cấu** trong ngày. Phần di chuyển trên xe là cảnh chuyển.

### 3.2 Chỉ số
| id | label | Ý nghĩa |
|---|---|---|
| `nang_luong` | Năng lượng | Sức làm việc còn lại |
| `an_toan` | An toàn | Mức kiểm soát đoàn |
| `hai_long` | Hài lòng | Mức hài lòng của khách |

### 3.3 Kế hoạch 7 phần
| # | Giờ | Việc | `task.type` | Nơi | `basis` cần nguồn chứng minh |
|---|---|---|---|---|---|
| 1 | 06:30 | Các bước trước khi xe lăn bánh: điểm danh, phổ biến lịch trình | `sequence` | Bãi xe | Trách nhiệm của hướng dẫn viên theo Luật Du lịch |
| 2 | 08:30 | Soát chương trình tour có chỗ sai so với hợp đồng | `spot_error` | Bãi xe | Quy định về chương trình du lịch trong Luật Du lịch |
| 3 | 09:30 | Xếp yêu cầu của khách: đáp ứng được hay vi phạm quy định điểm tham quan | `drag_sort` | Cổng di tích | Quy định bảo vệ di tích |
| 4 | 11:30 | Một khách lạc đoàn | `choice` | Sân chính | Trách nhiệm bảo đảm an toàn cho khách |
| 5 | 13:30 | Chia 2 giờ: thuyết minh, xử lý thủ tục nhà hàng, chăm khách lớn tuổi | `time_budget` | Nhà hàng | Các việc này là nhiệm vụ của hướng dẫn viên |
| 6 | 15:30 | Người bán hàng gợi ý đưa khách mua hàng ngoài chương trình để hưởng hoa hồng | `dialogue` | Khu bán hàng | Quy định về nghĩa vụ của hướng dẫn viên |
| 7 | 17:30 | Mưa lớn, phải quyết định bỏ một điểm trong lịch trình | `choice` | Sân chính | Quy định về thay đổi chương trình du lịch |

- R-1. `spot_error` (phần 2) và `drag_sort` (phần 3): mỗi lỗi/thẻ "vi phạm" PHẢI có nguồn `law` có `effective_date`.
- R-2. Narrative KHÔNG ĐƯỢC chứa dữ kiện lịch sử – văn hóa về địa danh thật; di tích là hư cấu. Lý do: tránh phát tán kiến thức sai.
- R-3. Mọi công ty, khách, điểm đến PHẢI hư cấu.
- R-4. Mặt khó PHẢI có ≥ 3 fact có nguồn; ít nhất một fact về tính mùa vụ/thu nhập không ổn định và một fact về xa nhà, giờ làm dài.
- R-5. `career`/`education` PHẢI nêu điều kiện cấp thẻ hướng dẫn viên theo văn bản còn hiệu lực, nguồn `law`.
- R-6. Phần 5: `time_budget`, `budget_min = 120`; `effect_per_30min` minh họa, KHÔNG ĐƯỢC kèm số thực tế trong narrative.

### 3.4 Bản đồ
- R-7. Bản đồ `diem-tham-quan` PHẢI có: bãi xe (spawn), cổng di tích, sân chính, nhà hàng, khu bán hàng. Một bản đồ.
- R-8. NPC: tài xế (phần 1), trưởng đoàn khách (phần 2, 7), khách lạc đoàn (phần 4), người bán hàng (phần 6), bảo vệ di tích (phần 3).

### 3.5 Lỗi
Như SPEC-009 3.5.

### 3.6 Conformance vectors
Không áp dụng.

## 4. Tiêu chí chấp nhận

| ID | Given | When | Then |
|---|---|---|---|
| AC-023-01 | `content/professions/huong-dan-vien-du-lich.json` | `npm run validate` | Exit 0 |
| AC-023-02 | `content/worlds/huong-dan-vien-du-lich.json` | `npm run validate:world` | Exit 0; chỉ có 1 bản đồ |
| AC-023-03 | Gói `huong-dan-vien-du-lich` | `npm run check:pack` | Có dòng `✓ huong-dan-vien-du-lich` |
| AC-023-04 | Gói `huong-dan-vien-du-lich` | Test chơi hết ngày | Kết thúc ở `done` |
| AC-023-05 | `huong-dan-vien-du-lich.json` | Đọc `sources` | Có ≥ 2 nguồn `law` có `effective_date` và ≥ 1 nguồn `market` có `issued_date` |
| AC-023-06 | Segment phần 5 | Đọc `task` | `type = "time_budget"`, `budget_min = 120` |
| AC-023-07 | Bản build | Đọc trang hồ sơ và trang màn chơi | Cả hai tồn tại; `<h1>` trang hồ sơ = `name` |

## 5. Ghi chú kiểm thử
Như SPEC-009 mục 5; test trong `tests/spec-023/`.

## 6. Câu hỏi mở
Anh đồng ý thì đánh `[x]`, không đồng ý thì sửa quy tắc tương ứng ở mục 3.
- [x] 3.1: bối cảnh nhân vật như mô tả.
- [x] R-1: chỉ đánh lỗi/vi phạm khi có nguồn quy định chính thức.
- [x] 3.3: kế hoạch 7 phần như bảng.

## 7. Lịch sử thay đổi
| Version | Ngày | Thay đổi | Lý do (BUG/ADR nếu có) |
|---|---|---|---|
| 1 | 2026-11-04 | Bản nháp đầu | PRD 4.1, SPEC-008 |
