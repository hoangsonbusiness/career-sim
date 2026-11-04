---
id: SPEC-019
title: Gói nghề Đầu bếp nhà hàng (nội dung + bản đồ bếp)
version: 1
status: approved
features: [F2, F3, F4, F5]
owns: [content/professions/dau-bep.json, content/worlds/dau-bep.json]
owner: anh Son
created: 2026-11-04
approved_hash: 62aa8c96d3eb435b
approved_by: Son
approved_at: 2026-11-04
---

# SPEC-019 — Gói nghề Đầu bếp nhà hàng

> Viết theo specs/STANDARD.md. Mục 2–4 là phần quy phạm. Mọi quy tắc chung theo SPEC-008.

## 1. Bối cảnh & lý do
Đầu bếp là nghề học theo con đường giáo dục nghề nghiệp (trung cấp, cao đẳng), phù hợp với học sinh không theo đại học, nhưng hay bị hình dung qua chương trình truyền hình. Thực tế: đứng lâu, nóng, làm giờ cao điểm và cuối tuần, tuân thủ **an toàn thực phẩm**. Phần "một ngày" đặt người chơi ở vai đầu bếp phụ trách một khu trong bếp nhà hàng.

**Gợi ý nguồn cần kiểm chứng** (KHÔNG phải dữ kiện, SPEC-008 R-10): Luật An toàn thực phẩm và nghị định hướng dẫn; quy định về điều kiện an toàn thực phẩm với cơ sở kinh doanh dịch vụ ăn uống, lưu mẫu thức ăn; quy định ghi nhãn/khai báo chất gây dị ứng (nếu có); Luật Giáo dục nghề nghiệp, chương trình đào tạo nghề Kỹ thuật chế biến món ăn của trường có năm; báo cáo lương ngành nhà hàng – khách sạn có năm; ESCO "cook"; chia sẻ của đầu bếp trên báo chí chính thống. Kiểm tra hiệu lực theo CLAUDE.md R4.

## 2. Phạm vi
- Trong phạm vi: `content/professions/dau-bep.json`; `content/worlds/dau-bep.json`; định nghĩa bản đồ trong `scripts/gen-world.mjs`.
- Ngoài phạm vi: công thức nấu ăn; nhiệt độ/thời gian nấu cụ thể nếu không có nguồn `law`; tên nhà hàng, đầu bếp nổi tiếng thật.

## 3. Thiết kế

### 3.1 Bối cảnh nhân vật
Đầu bếp 2 năm kinh nghiệm sau khi tốt nghiệp cao đẳng nghề, phụ trách khu món nóng tại một nhà hàng **hư cấu**. Ca làm từ trưa đến tối, cả ca trong khu bếp.

### 3.2 Chỉ số
| id | label | Ý nghĩa |
|---|---|---|
| `the_luc` | Thể lực | Sức đứng bếp còn lại |
| `ve_sinh` | An toàn thực phẩm | Mức tuân thủ vệ sinh |
| `toc_do` | Nhịp bếp | Kịp ra món giờ cao điểm |

### 3.3 Kế hoạch 7 phần
| # | Giờ | Việc | `task.type` | Nơi | `basis` cần nguồn chứng minh |
|---|---|---|---|---|---|
| 1 | 10:00 | Các bước chuẩn bị đầu ca (sơ chế, kiểm nguyên liệu) | `sequence` | Khu sơ chế | Sơ chế, chuẩn bị nguyên liệu là nhiệm vụ của nghề |
| 2 | 10:45 | Soát lỗi vệ sinh trong khu bếp | `spot_error` | Khu sơ chế | Điều kiện an toàn thực phẩm của cơ sở ăn uống |
| 3 | 11:15 | Xếp nguyên liệu: dùng được hay phải loại | `drag_sort` | Kho lạnh | Không dùng nguyên liệu không rõ nguồn gốc, hết hạn |
| 4 | 12:30 | Phục vụ báo khách dị ứng, xin đổi món giờ cao điểm | `dialogue` | Quầy ra món | Quy định/khuyến cáo về chất gây dị ứng (`needs_verification` nếu chưa có nguồn) |
| 5 | 14:30 | Bếp trưởng muốn dùng lại đồ thừa hôm qua | `choice` | Kho lạnh | Như phần 2 |
| 6 | 16:00 | Chia 3 giờ trước ca tối: sơ chế, vệ sinh, thử món mới | `time_budget` | Khu món nóng | Các việc này là nhiệm vụ của nghề |
| 7 | 19:30 | Đơn dồn dập, một món bị khách trả lại | `choice` | Quầy ra món | Làm việc giờ cao điểm là một phần nghề |

- R-1. `spot_error` (phần 2) và `drag_sort` (phần 3): mỗi lỗi/thẻ "phải loại" PHẢI có nguồn `law`. Không có quy định → không đánh là lỗi.
- R-2. Nội dung KHÔNG ĐƯỢC chứa công thức, nhiệt độ hay thời gian bảo quản cụ thể trừ khi có trong `basis` với nguồn `law`.
- R-3. Phần 4 KHÔNG ĐƯỢC có lựa chọn "bỏ qua dị ứng" được thưởng điểm.
- R-4. Mọi nhà hàng, người trong nội dung PHẢI hư cấu.
- R-5. Mặt khó PHẢI có ≥ 3 fact có nguồn; ít nhất một fact về làm cuối tuần/ngày lễ và một fact về môi trường nóng, đứng lâu hoặc nguy cơ tai nạn bếp.
- R-6. `education` PHẢI nêu con đường giáo dục nghề nghiệp (trung cấp/cao đẳng) có nguồn `law` hoặc `official_stat`.
- R-7. Phần 6: `time_budget`, `budget_min = 180`; `effect_per_30min` minh họa, không kèm số thực tế trong narrative.

### 3.4 Bản đồ
- R-8. Bản đồ `bep-nha-hang` PHẢI có: khu món nóng (spawn), khu sơ chế, kho lạnh, quầy ra món. Một bản đồ.
- R-9. NPC: bếp trưởng (phần 1, 5), nhân viên phục vụ (phần 4, 7), phụ bếp (trang trí).

### 3.5 Lỗi
Như SPEC-009 3.5.

### 3.6 Conformance vectors
Không áp dụng.

## 4. Tiêu chí chấp nhận

| ID | Given | When | Then |
|---|---|---|---|
| AC-019-01 | `content/professions/dau-bep.json` | `npm run validate` | Exit 0 |
| AC-019-02 | `content/worlds/dau-bep.json` | `npm run validate:world` | Exit 0; chỉ có 1 bản đồ |
| AC-019-03 | Gói `dau-bep` | `npm run check:pack` | Có dòng `✓ dau-bep` |
| AC-019-04 | Gói `dau-bep` | Test chơi hết ngày | Kết thúc ở `done` |
| AC-019-05 | `dau-bep.json` | Đọc `sources` | Có ≥ 1 nguồn `law` có `effective_date` và ≥ 1 nguồn `market` có `issued_date` |
| AC-019-06 | Segment phần 6 | Đọc `task` | `type = "time_budget"`, `budget_min = 180` |
| AC-019-07 | Segment phần 4 | Đọc mọi lựa chọn | Không lựa chọn nào làm tăng `ve_sinh` khi bỏ qua yêu cầu dị ứng (lựa chọn đó được gắn `ignores_allergy: true` trong `note` để test đọc) |
| AC-019-08 | Bản build | Đọc trang hồ sơ và trang màn chơi | Cả hai tồn tại; `<h1>` trang hồ sơ = `name` |

## 5. Ghi chú kiểm thử
Như SPEC-009 mục 5; test trong `tests/spec-019/`.

## 6. Câu hỏi mở
Anh đồng ý thì đánh `[x]`, không đồng ý thì sửa quy tắc tương ứng ở mục 3.
- [x] 3.1: đầu bếp nhà hàng ca trưa–tối, học cao đẳng nghề.
- [x] AC-019-07: dùng dấu hiệu trong `note` để test nhận ra lựa chọn bỏ qua dị ứng (hay anh muốn thêm trường vào schema bằng spec riêng?).
- [x] 3.3: kế hoạch 7 phần như bảng.

## 7. Lịch sử thay đổi
| Version | Ngày | Thay đổi | Lý do (BUG/ADR nếu có) |
|---|---|---|---|
| 1 | 2026-11-04 | Bản nháp đầu | PRD 4.1, SPEC-008 |
