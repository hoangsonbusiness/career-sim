---
id: SPEC-025
title: Gói nghề Kỹ thuật viên ô tô (nội dung + bản đồ xưởng dịch vụ)
version: 1
status: draft
features: [F2, F3, F4, F5]
owns: [content/professions/ky-thuat-vien-o-to.json, content/worlds/ky-thuat-vien-o-to.json]
owner: anh Son
created: 2026-11-04
---

# SPEC-025 — Gói nghề Kỹ thuật viên ô tô

> Viết theo specs/STANDARD.md. Mục 2–4 là phần quy phạm. Mọi quy tắc chung theo SPEC-008.

## 1. Bối cảnh & lý do
Kỹ thuật ô tô có nhu cầu nhân lực lớn, đào tạo qua cả cao đẳng lẫn đại học, hợp với học sinh thích máy móc; app hiện chưa có nghề kỹ thuật – tay nghề nào. Nghề thật gồm chẩn đoán, bảo dưỡng, sửa chữa, an toàn lao động trong xưởng, tiếp xúc dầu mỡ, tiếng ồn, và phải cập nhật công nghệ xe điện.

**Gợi ý nguồn cần kiểm chứng** (KHÔNG phải dữ kiện, SPEC-008 R-10): Luật Giáo dục nghề nghiệp và chuẩn đầu ra trình độ cao đẳng ngành Công nghệ ô tô; Luật An toàn, vệ sinh lao động và danh mục nghề nặng nhọc, độc hại bản mới nhất; quy định điều kiện kinh doanh dịch vụ bảo dưỡng, sửa chữa ô tô; quy định bảo vệ quyền lợi người tiêu dùng; đề án tuyển sinh ngành Công nghệ kỹ thuật ô tô; báo cáo lương ngành ô tô có năm; O*NET "Automotive Service Technicians and Mechanics"; chia sẻ của kỹ thuật viên trên báo chí chính thống. Kiểm tra hiệu lực theo CLAUDE.md R4.

**Văn bản đã tra (2026-11-04, từ kết quả tìm kiếm; CHƯA mở toàn văn, phải kiểm chứng trước khi đưa vào `sources`):**
- Luật Giáo dục nghề nghiệp 2025, số 124/2025/QH15 (thay Luật 74/2014/QH13); luatvietnam.vn ghi hiệu lực 10/12/2025, ngày này bất thường → phải đối chiếu công báo.
- Nghị định 116/2017/NĐ-CP về điều kiện sản xuất, nhập khẩu và kinh doanh dịch vụ bảo hành, bảo dưỡng ô tô, sửa bởi Nghị định 117/2026/NĐ-CP (03/4/2026) (vanban.chinhphu.vn docid=217564).
- Luật An toàn, vệ sinh lao động 84/2015/QH13, hợp nhất tại VBHN 14/VBHN-VPQH 2024.
- Danh mục nghề nặng nhọc, độc hại: kết quả tìm được chủ yếu là Thông tư 28/2025/TT-BNV (riêng Quân đội) → CHƯA tìm ra danh mục áp dụng cho sửa chữa ô tô dân sự; fact mặt khó về điều kiện lao động tạm dựa vào nguồn `press`/O*NET hoặc để `needs_verification`.
- Luật Bảo vệ quyền lợi người tiêu dùng 2023, số 19/2023/QH15, hiệu lực 01/7/2024 (congbao.chinhphu.vn), làm `basis` cho phần 6.

## 2. Phạm vi
- Trong phạm vi: `content/professions/ky-thuat-vien-o-to.json`; `content/worlds/ky-thuat-vien-o-to.json`; định nghĩa bản đồ trong `scripts/gen-world.mjs`.
- Ngoài phạm vi: hướng dẫn tự sửa xe; thông số kỹ thuật xe thật; hãng xe, đại lý thật.

## 3. Thiết kế

### 3.1 Bối cảnh nhân vật
Kỹ thuật viên 2 năm kinh nghiệm tại một xưởng dịch vụ ô tô **hư cấu**, làm cùng một kỹ thuật viên chính và một cố vấn dịch vụ.

### 3.2 Chỉ số
| id | label | Ý nghĩa |
|---|---|---|
| `nang_luong` | Năng lượng | Sức làm việc còn lại |
| `an_toan` | An toàn | Mức tuân thủ an toàn lao động |
| `chat_luong` | Chất lượng | Mức sửa đúng bệnh |

### 3.3 Kế hoạch 7 phần
| # | Giờ | Việc | `task.type` | Nơi | `basis` cần nguồn chứng minh |
|---|---|---|---|---|---|
| 1 | 07:30 | Các bước an toàn trước khi nâng xe lên cầu | `sequence` | Cầu nâng | Quy định an toàn, vệ sinh lao động |
| 2 | 08:30 | Xếp đồ bảo hộ và thao tác: an toàn hay nguy hiểm | `drag_sort` | Tủ dụng cụ | Quy định an toàn, vệ sinh lao động còn hiệu lực |
| 3 | 10:00 | Đọc phiếu sửa chữa có chỗ ghi sai/thiếu | `spot_error` | Bàn cố vấn dịch vụ | Quy định về tiếp nhận và nghiệm thu dịch vụ sửa chữa |
| 4 | 11:00 | Khách nói xe kêu lạ: kiểm tra từ đâu | `choice` | Cầu nâng | Nhiệm vụ chẩn đoán của kỹ thuật viên |
| 5 | 13:30 | Chia 3 giờ: bảo dưỡng định kỳ, thay phụ tùng, chạy thử | `time_budget` | Cầu nâng | Các việc này là nhiệm vụ của kỹ thuật viên |
| 6 | 16:30 | Cố vấn dịch vụ muốn báo khách thay thêm phụ tùng chưa cần | `dialogue` | Bàn cố vấn dịch vụ | Quy định bảo vệ quyền lợi người tiêu dùng |
| 7 | 17:30 | Gần hết giờ, xe chạy thử còn tiếng lạ | `choice` | Bãi chạy thử | Trách nhiệm nghiệm thu trước khi giao xe |

- R-1. `drag_sort` (phần 2) và `spot_error` (phần 3): mỗi thẻ/lỗi "nguy hiểm/sai" PHẢI có nguồn `law` có `effective_date`.
- R-2. Narrative KHÔNG ĐƯỢC chứa hướng dẫn thao tác kỹ thuật đủ chi tiết để làm theo trên xe thật (lực siết, quy trình tháo lắp). Lý do: an toàn người dùng.
- R-3. Mọi xưởng, khách PHẢI hư cấu; KHÔNG ĐƯỢC dùng tên thương hiệu xe thật.
- R-4. Mặt khó PHẢI có ≥ 3 fact có nguồn; ít nhất một fact về điều kiện lao động (dầu mỡ, tiếng ồn, tư thế) và một fact về thu nhập khởi điểm.
- R-5. `education` PHẢI nêu cả hai đường đào tạo (giáo dục nghề nghiệp và đại học) với nguồn `law` hoặc `official_stat`.
- R-6. Phần 5: `time_budget`, `budget_min = 180`; `effect_per_30min` minh họa, KHÔNG ĐƯỢC kèm số thực tế trong narrative.

### 3.4 Bản đồ
- R-7. Bản đồ `xuong-dich-vu` PHẢI có: cầu nâng (spawn), tủ dụng cụ, bàn cố vấn dịch vụ, kho phụ tùng, bãi chạy thử. Một bản đồ.
- R-8. NPC: kỹ thuật viên chính (phần 1, 4, 7), cố vấn dịch vụ (phần 3, 6), khách hàng (phần 4), thủ kho phụ tùng (trang trí).

### 3.5 Lỗi
Như SPEC-009 3.5.

### 3.6 Conformance vectors
Không áp dụng.

## 4. Tiêu chí chấp nhận

| ID | Given | When | Then |
|---|---|---|---|
| AC-025-01 | `content/professions/ky-thuat-vien-o-to.json` | `npm run validate` | Exit 0 |
| AC-025-02 | `content/worlds/ky-thuat-vien-o-to.json` | `npm run validate:world` | Exit 0; chỉ có 1 bản đồ |
| AC-025-03 | Gói `ky-thuat-vien-o-to` | `npm run check:pack` | Có dòng `✓ ky-thuat-vien-o-to` |
| AC-025-04 | Gói `ky-thuat-vien-o-to` | Test chơi hết ngày | Kết thúc ở `done` |
| AC-025-05 | `ky-thuat-vien-o-to.json` | Đọc `sources` | Có ≥ 2 nguồn `law` có `effective_date` và ≥ 1 nguồn `market` có `issued_date` |
| AC-025-06 | Segment phần 5 | Đọc `task` | `type = "time_budget"`, `budget_min = 180` |
| AC-025-07 | Bản build | Đọc trang hồ sơ và trang màn chơi | Cả hai tồn tại; `<h1>` trang hồ sơ = `name` |

## 5. Ghi chú kiểm thử
Như SPEC-009 mục 5; test trong `tests/spec-025/`.

## 6. Câu hỏi mở
Anh đồng ý thì đánh `[x]`, không đồng ý thì sửa quy tắc tương ứng ở mục 3.
- [x] 3.1: bối cảnh nhân vật như mô tả.
- [x] R-1: chỉ đánh lỗi/vi phạm khi có nguồn quy định chính thức.
- [x] 3.3: kế hoạch 7 phần như bảng.

## 7. Lịch sử thay đổi
| Version | Ngày | Thay đổi | Lý do (BUG/ADR nếu có) |
|---|---|---|---|
| 1 | 2026-11-04 | Bản nháp đầu | PRD 4.1, SPEC-008 |
