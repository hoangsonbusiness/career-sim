---
id: SPEC-015
title: Gói nghề Dược sĩ nhà thuốc (nội dung + bản đồ nhà thuốc)
version: 1
status: draft
features: [F2, F3, F4, F5]
owns: [content/professions/duoc-si.json, content/worlds/duoc-si.json]
owner: anh Son
created: 2026-11-04
---

# SPEC-015 — Gói nghề Dược sĩ nhà thuốc

> Viết theo specs/STANDARD.md. Mục 2–4 là phần quy phạm. Mọi quy tắc chung theo SPEC-008.

## 1. Bối cảnh & lý do
Dược là ngành khối B được nhiều học sinh chọn nhưng hay bị hiểu là "đứng bán thuốc". Thực tế dược sĩ nhà thuốc chịu trách nhiệm chuyên môn theo pháp luật: kiểm tra đơn, tư vấn dùng thuốc, phân biệt thuốc kê đơn/không kê đơn, quản lý hạn dùng và bảo quản. Phần "một ngày" đặt người chơi ở vai dược sĩ đứng quầy một nhà thuốc.

**Gợi ý nguồn cần kiểm chứng** (KHÔNG phải dữ kiện, SPEC-008 R-10): Luật Dược hiện hành và luật sửa đổi gần nhất; nghị định hướng dẫn Luật Dược về chứng chỉ hành nghề dược; thông tư về Thực hành tốt cơ sở bán lẻ thuốc (GPP); thông tư về kê đơn thuốc và danh mục thuốc không kê đơn; đề án tuyển sinh ngành Dược học của trường đại học có năm; báo cáo lương ngành dược có năm; ESCO/O*NET "pharmacist"; chia sẻ của dược sĩ trên báo chí chính thống. Mọi văn bản phải kiểm tra còn hiệu lực (CLAUDE.md R4).

## 2. Phạm vi
- Trong phạm vi: `content/professions/duoc-si.json` đủ mọi mục schema; `content/worlds/duoc-si.json` (nhà thuốc); định nghĩa bản đồ trong `scripts/gen-world.mjs`.
- Ngoài phạm vi: hướng dẫn liều dùng thuốc cụ thể; tên biệt dược hay chuỗi nhà thuốc thật; dược sĩ bệnh viện, công ty dược (để spec khác).

## 3. Thiết kế

### 3.1 Bối cảnh nhân vật
Dược sĩ đại học 1–2 năm kinh nghiệm, đứng quầy tại một nhà thuốc **hư cấu** (ví dụ "Nhà thuốc An Tâm"). Cả ngày diễn ra trong nhà thuốc.

### 3.2 Chỉ số
| id | label | Ý nghĩa |
|---|---|---|
| `nang_luong` | Năng lượng | Sức làm việc còn lại |
| `chinh_xac` | Chính xác | Mức cẩn trọng chuyên môn |
| `tin_nhiem` | Tin nhiệm | Niềm tin của khách hàng |

### 3.3 Kế hoạch 7 phần
| # | Giờ | Việc | `task.type` | Nơi | `basis` cần nguồn chứng minh |
|---|---|---|---|---|---|
| 1 | 07:30 | Các bước mở cửa: kiểm nhiệt độ/độ ẩm, kiểm tủ, sổ sách | `sequence` | Kho/quầy | Nhà thuốc phải theo dõi điều kiện bảo quản theo GPP |
| 2 | 09:00 | Kiểm tra một đơn thuốc trước khi bán | `spot_error` | Quầy | Đơn thuốc phải ghi đủ thông tin bắt buộc theo quy định kê đơn |
| 3 | 10:30 | Xếp thuốc: cần đơn hay không cần đơn | `drag_sort` | Quầy | Thuốc kê đơn chỉ được bán khi có đơn |
| 4 | 13:30 | Khách đòi mua kháng sinh không có đơn | `dialogue` | Quầy | Như phần 3; dược sĩ có trách nhiệm tư vấn |
| 5 | 15:00 | Phát hiện lô thuốc sắp hết hạn trên kệ | `choice` | Kho | Nhà thuốc phải quản lý hạn dùng, không bán thuốc hết hạn |
| 6 | 16:00 | Chia 3 giờ còn lại: tư vấn khách, nhập hàng, cập nhật sổ | `time_budget` | Quầy | Các việc này là nhiệm vụ của nhà thuốc theo GPP |
| 7 | 19:00 | Khách quay lại báo bị khó chịu sau khi dùng thuốc | `choice` | Quầy | Dược sĩ theo dõi, khuyên đi khám, báo cáo phản ứng có hại |

- R-1. `spot_error` (phần 2) PHẢI dựa trên nội dung bắt buộc của đơn thuốc trong văn bản kê đơn còn hiệu lực; mỗi dòng lỗi PHẢI tương ứng một quy định có nguồn `law`. Không tìm được quy định cụ thể → dòng đó không được đánh là lỗi.
- R-2. `drag_sort` (phần 3) PHẢI dùng **nhóm thuốc chung** (ví dụ "kháng sinh", "thuốc hạ sốt thông thường"), KHÔNG ĐƯỢC dùng tên biệt dược hay hoạt chất kèm liều. Mỗi thẻ PHẢI dựa trên quy định có nguồn `law`; nhóm không chắc chắn thì bỏ.
- R-3. Nội dung KHÔNG ĐƯỢC chứa liều dùng, chỉ định điều trị hay lời khuyên dùng thuốc có thể làm theo ngoài đời. Lời kể chỉ mô tả hành vi nghề (hỏi triệu chứng, khuyên đi khám).
- R-4. Mọi nhà thuốc, khách hàng, người trong nội dung PHẢI là hư cấu.
- R-5. Mặt khó PHẢI có ít nhất 3 fact có nguồn; ít nhất một fact về đứng quầy dài giờ/làm ca tối, cuối tuần và một fact về trách nhiệm pháp lý của người phụ trách chuyên môn.
- R-6. Phần `career`/`education` PHẢI nêu điều kiện cấp chứng chỉ hành nghề dược (văn bằng + thời gian thực hành) theo văn bản còn hiệu lực, nguồn `law`.
- R-7. Phần 6 dùng `time_budget` với `budget_min = 180`; `effect_per_30min` là minh họa và KHÔNG ĐƯỢC kèm con số thực tế trong `narrative`.

### 3.4 Bản đồ
- R-8. Bản đồ `nha_thuoc` PHẢI có: quầy tư vấn (spawn), kệ thuốc không kê đơn, tủ thuốc kê đơn sau quầy, kho nhỏ có nhiệt kế/ẩm kế. Không cần bản đồ `nha`; cả 7 phần diễn ra trong một bản đồ.
- R-9. NPC: dược sĩ phụ trách chuyên môn (phần 1, 5), khách đòi kháng sinh (phần 4), khách quay lại (phần 7), khách mua đồ (trang trí).

### 3.5 Lỗi
Như SPEC-009 3.5.

### 3.6 Conformance vectors
Không áp dụng.

## 4. Tiêu chí chấp nhận

| ID | Given | When | Then |
|---|---|---|---|
| AC-015-01 | `content/professions/duoc-si.json` | `npm run validate` | Exit 0 |
| AC-015-02 | `content/worlds/duoc-si.json` | `npm run validate:world` | Exit 0; chỉ có 1 bản đồ |
| AC-015-03 | Gói `duoc-si` | `npm run check:pack` | Có dòng `✓ duoc-si` |
| AC-015-04 | Gói `duoc-si` | Test chơi hết ngày | Kết thúc ở `done` |
| AC-015-05 | `duoc-si.json` | Đọc `sources` | Có ≥ 2 nguồn `law` có `effective_date` và ≥ 1 nguồn `market` có `issued_date` |
| AC-015-06 | Segment phần 6 | Đọc `task` | `type = "time_budget"`, `budget_min = 180` |
| AC-015-07 | Bản build | Đọc trang hồ sơ và trang màn chơi | Cả hai tồn tại; `<h1>` trang hồ sơ = `name` |

## 5. Ghi chú kiểm thử
Như SPEC-009 mục 5; test đặt trong `tests/spec-015/`. R-3 (không có liều dùng) do người duyệt và Codex kiểm chéo, không tự động.

## 6. Câu hỏi mở
Em đã chốt theo đề xuất ở các quy tắc dưới. Anh đồng ý thì đánh `[x]`, không đồng ý thì sửa quy tắc tương ứng ở mục 3.
- [x] 3.1: dược sĩ nhà thuốc (không phải bệnh viện/công ty dược), cả ngày ở nhà thuốc.
- [x] R-3: cấm mọi liều dùng/chỉ định trong nội dung, kể cả có nguồn.
- [x] 3.3: kế hoạch 7 phần trong ngày như bảng.

## 7. Lịch sử thay đổi
| Version | Ngày | Thay đổi | Lý do (BUG/ADR nếu có) |
|---|---|---|---|
| 1 | 2026-11-04 | Bản nháp đầu | PRD 4.1, SPEC-008 |
