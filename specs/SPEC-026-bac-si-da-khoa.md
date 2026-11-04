---
id: SPEC-026
title: Gói nghề Bác sĩ đa khoa (nội dung + bản đồ phòng khám đa khoa)
version: 1
status: approved
features: [F2, F3, F4, F5]
owns: [content/professions/bac-si-da-khoa.json, content/worlds/bac-si-da-khoa.json]
owner: anh Son
created: 2026-11-04
approved_hash: 6a1d9bff4e6d9405
approved_by: Son
approved_at: 2026-11-04
---

# SPEC-026 — Gói nghề Bác sĩ đa khoa

> Viết theo specs/STANDARD.md. Mục 2–4 là phần quy phạm. Mọi quy tắc chung theo SPEC-008.

## 1. Bối cảnh & lý do
Y khoa là nhóm ngành nhiều học sinh quan tâm nhưng ít em biết rõ con đường dài: học nhiều năm, thực hành rồi mới được cấp giấy phép hành nghề. App đã có Điều dưỡng và Dược sĩ, chưa có bác sĩ. Nghề thật gồm hỏi bệnh, khám, chỉ định cận lâm sàng, kê đơn, ghi hồ sơ bệnh án, trực đêm và áp lực trách nhiệm cao.

**Gợi ý nguồn cần kiểm chứng** (KHÔNG phải dữ kiện, SPEC-008 R-10): Luật Khám bệnh, chữa bệnh và nghị định hướng dẫn về giấy phép hành nghề; quy định về hồ sơ bệnh án, kê đơn thuốc; đề án tuyển sinh ngành Y khoa; báo cáo thu nhập bác sĩ có năm; O*NET "Family Medicine Physicians"; chia sẻ của bác sĩ trên báo chí chính thống. Kiểm tra hiệu lực theo CLAUDE.md R4.

**Văn bản đã tra (2026-11-04, từ kết quả tìm kiếm; CHƯA mở toàn văn, phải kiểm chứng trước khi đưa vào `sources`):**
- Luật Khám bệnh, chữa bệnh số 15/2023/QH15, ban hành 09/01/2023, hiệu lực 01/01/2024 (congbao.chinhphu.vn, vanban.chinhphu.vn docid=207396).
- Nghị định 96/2023/NĐ-CP hướng dẫn Luật Khám bệnh, chữa bệnh (vanban.chinhphu.vn docid=209491). Một bài hỏi–đáp trên thuvienphapluat.vn nói thời gian thực hành của bác sĩ là 12 tháng (luật cũ 18 tháng) → nguồn thứ cấp, PHẢI đối chiếu điều khoản gốc và kiểm tra NĐ 96/2023 đã bị sửa/thay chưa.
- Chưa tra: thông tư về kê đơn thuốc, hồ sơ bệnh án bản mới nhất; chế độ trực.

## 2. Phạm vi
- Trong phạm vi: `content/professions/bac-si-da-khoa.json`; `content/worlds/bac-si-da-khoa.json`; định nghĩa bản đồ trong `scripts/gen-world.mjs`.
- Ngoài phạm vi: tư vấn chẩn đoán/điều trị cho người dùng; thông tin thuốc cụ thể; bệnh viện, bác sĩ thật.

## 3. Thiết kế

### 3.1 Bối cảnh nhân vật
Bác sĩ mới có giấy phép hành nghề, làm tại phòng khám nội tổng quát của một bệnh viện quận **hư cấu**, làm cùng một bác sĩ trưởng khoa và một điều dưỡng.

### 3.2 Chỉ số
| id | label | Ý nghĩa |
|---|---|---|
| `nang_luong` | Năng lượng | Sức làm việc còn lại |
| `an_toan_nguoi_benh` | An toàn người bệnh | Mức tuân thủ quy trình chuyên môn |
| `tin_cay` | Tin cậy | Mức người bệnh và đồng nghiệp tin tưởng |

### 3.3 Kế hoạch 7 phần
| # | Giờ | Việc | `task.type` | Nơi | `basis` cần nguồn chứng minh |
|---|---|---|---|---|---|
| 1 | 07:00 | Các bước giao ban, nhận bàn giao người bệnh | `sequence` | Phòng giao ban | Quy định về khám bệnh, chữa bệnh, bàn giao người bệnh |
| 2 | 08:00 | Xếp thông tin: cần xử trí ngay hay có thể chờ | `drag_sort` | Phòng khám | Quy định về khám bệnh, phân loại người bệnh |
| 3 | 09:30 | Đọc đơn thuốc nháp có chỗ ghi sai/thiếu | `spot_error` | Phòng khám | Quy định kê đơn thuốc còn hiệu lực |
| 4 | 10:30 | Người bệnh đau bụng: hỏi và khám gì trước | `choice` | Phòng khám | Nhiệm vụ khám, chẩn đoán của bác sĩ |
| 5 | 13:30 | Chia 3 giờ: khám bệnh, ghi hồ sơ bệnh án, tư vấn người bệnh | `time_budget` | Phòng khám | Các việc này là nhiệm vụ của người hành nghề |
| 6 | 15:30 | Người nhà xin bác sĩ ghi hồ sơ khác sự thật để hưởng bảo hiểm | `dialogue` | Phòng khám | Quy định các hành vi bị cấm trong khám bệnh, chữa bệnh |
| 7 | 17:00 | Gần hết ca, người bệnh có dấu hiệu nặng hơn | `choice` | Phòng cấp cứu | Trách nhiệm người hành nghề khi tình trạng người bệnh thay đổi |

- R-1. `drag_sort` (phần 2) và `spot_error` (phần 3): mỗi thẻ/lỗi "sai/vi phạm/nguy hiểm" về pháp lý PHẢI có nguồn `law` có `effective_date`; không có nguồn quy định thì KHÔNG ĐƯỢC đánh là vi phạm.
- R-2. Narrative KHÔNG ĐƯỢC chứa liều thuốc, tên biệt dược hay phác đồ điều trị đủ chi tiết để người dùng tự áp dụng. Lý do: an toàn người dùng.
- R-3. Mọi bệnh viện, người bệnh PHẢI hư cấu; KHÔNG ĐƯỢC mô tả ca bệnh của người thật.
- R-4. Mặt khó PHẢI có ≥ 3 fact có nguồn; ít nhất một fact về thời gian đào tạo + thực hành trước khi hành nghề và một fact về trực đêm hoặc áp lực công việc.
- R-5. `education` PHẢI nêu thời gian học ngành Y khoa và điều kiện cấp giấy phép hành nghề với nguồn `law` có `effective_date`.
- R-6. Phần 5: `time_budget`, `budget_min = 180`; `effect_per_30min` minh họa, KHÔNG ĐƯỢC kèm số thực tế trong narrative.

### 3.4 Bản đồ
- R-7. Bản đồ `phong-kham` PHẢI có: phòng khám (spawn), phòng giao ban, phòng cấp cứu, quầy tiếp đón, hành lang. Một bản đồ.
- R-8. NPC: bác sĩ trưởng khoa (phần 1, 7), điều dưỡng (phần 2, 4), người bệnh (phần 4), người nhà người bệnh (phần 6), nhân viên tiếp đón (trang trí).

### 3.5 Lỗi
Như SPEC-009 3.5.

### 3.6 Conformance vectors
Không áp dụng.

## 4. Tiêu chí chấp nhận

| ID | Given | When | Then |
|---|---|---|---|
| AC-026-01 | `content/professions/bac-si-da-khoa.json` | `npm run validate` | Exit 0 |
| AC-026-02 | `content/worlds/bac-si-da-khoa.json` | `npm run validate:world` | Exit 0; chỉ có 1 bản đồ |
| AC-026-03 | Gói `bac-si-da-khoa` | `npm run check:pack` | Có dòng `✓ bac-si-da-khoa` |
| AC-026-04 | Gói `bac-si-da-khoa` | Test chơi hết ngày | Kết thúc ở `done` |
| AC-026-05 | `bac-si-da-khoa.json` | Đọc `sources` | Có ≥ 2 nguồn `law` có `effective_date` và ≥ 1 nguồn `market` có `issued_date` |
| AC-026-06 | Segment phần 5 | Đọc `task` | `type = "time_budget"`, `budget_min = 180` |
| AC-026-07 | Bản build | Đọc trang hồ sơ và trang màn chơi | Cả hai tồn tại; `<h1>` trang hồ sơ = `name` |

## 5. Ghi chú kiểm thử
Như SPEC-009 mục 5; test trong `tests/spec-026/`.

## 6. Câu hỏi mở
Anh đồng ý thì đánh `[x]`, không đồng ý thì sửa quy tắc tương ứng ở mục 3.
- [x] 3.1: bối cảnh nhân vật như mô tả.
- [x] R-1: chỉ đánh lỗi/vi phạm khi có nguồn quy định chính thức.
- [x] 3.3: kế hoạch 7 phần như bảng.

## 7. Lịch sử thay đổi
| Version | Ngày | Thay đổi | Lý do (BUG/ADR nếu có) |
|---|---|---|---|
| 1 | 2026-11-04 | Bản nháp đầu | PRD 4.1, SPEC-008 |
