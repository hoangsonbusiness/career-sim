---
id: SPEC-030
title: Gói nghề Chiến sĩ chữa cháy và cứu nạn, cứu hộ (nội dung + bản đồ đội chữa cháy và cứu nạn, cứu hộ)
version: 1
status: approved
features: [F2, F3, F4, F5]
owns: [content/professions/chien-si-chua-chay.json, content/worlds/chien-si-chua-chay.json]
owner: anh Son
created: 2026-11-04
approved_hash: 7db279c710d02cdd
approved_by: Son
approved_at: 2026-11-04
---

# SPEC-030 — Gói nghề Chiến sĩ chữa cháy và cứu nạn, cứu hộ

> Viết theo specs/STANDARD.md. Mục 2–4 là phần quy phạm. Mọi quy tắc chung theo SPEC-008.

## 1. Bối cảnh & lý do
Lính cứu hỏa là nghề nhiều em ngưỡng mộ nhưng ít biết rằng đây là lực lượng thuộc Công an nhân dân, tuyển qua con đường riêng, và phần lớn thời gian là huấn luyện, kiểm tra an toàn phòng cháy, tuyên truyền chứ không chỉ chữa cháy. Mặt khó: nguy hiểm tính mạng, trực sẵn sàng liên tục, áp lực tâm lý.

**Gợi ý nguồn cần kiểm chứng** (KHÔNG phải dữ kiện, SPEC-008 R-10): Luật Phòng cháy, chữa cháy và cứu nạn, cứu hộ và nghị định hướng dẫn; Luật Công an nhân dân; quy định tuyển sinh vào trường Công an nhân dân (ngành Phòng cháy chữa cháy); chế độ trực sẵn sàng chiến đấu; O*NET "Firefighters"; chia sẻ chiến sĩ trên báo chí chính thống. Kiểm tra hiệu lực theo CLAUDE.md R4.

**Văn bản đã tra (2026-11-04, từ kết quả tìm kiếm; CHƯA mở toàn văn, phải kiểm chứng trước khi đưa vào `sources`):**
- Luật Phòng cháy, chữa cháy và cứu nạn, cứu hộ số 55/2024/QH15, ban hành 29/11/2024, hiệu lực 01/7/2025 (congbao.chinhphu.vn; chinhphu.vn docid=212483).
- Chưa tra: nghị định hướng dẫn Luật 55/2024; thông tư tuyển sinh trường CAND năm 2026; Luật Công an nhân dân bản hợp nhất. Lương lực lượng vũ trang theo cấp bậc phụ thuộc lương cơ sở → nếu tự tính PHẢI ghi công thức (R4).

## 2. Phạm vi
- Trong phạm vi: `content/professions/chien-si-chua-chay.json`; `content/worlds/chien-si-chua-chay.json`; định nghĩa bản đồ trong `scripts/gen-world.mjs`.
- Ngoài phạm vi: hướng dẫn kỹ thuật chữa cháy; vụ cháy, đơn vị thật; thông tin tuyển sinh chưa xác minh.

## 3. Thiết kế

### 3.1 Bối cảnh nhân vật
Chiến sĩ 2 năm công tác tại một đội chữa cháy và cứu nạn, cứu hộ khu vực **hư cấu**, làm cùng một đội trưởng và một tổ trưởng.

### 3.2 Chỉ số
| id | label | Ý nghĩa |
|---|---|---|
| `the_luc` | Thể lực | Sức chiến đấu còn lại |
| `an_toan` | An toàn | Mức tuân thủ quy trình an toàn của bản thân và đồng đội |
| `san_sang` | Sẵn sàng | Mức phương tiện, trang bị luôn sẵn sàng |

### 3.3 Kế hoạch 7 phần
| # | Giờ | Việc | `task.type` | Nơi | `basis` cần nguồn chứng minh |
|---|---|---|---|---|---|
| 1 | 07:00 | Các bước giao ca và kiểm tra phương tiện | `sequence` | Nhà xe chữa cháy | Quy định trực sẵn sàng chữa cháy và cứu nạn, cứu hộ |
| 2 | 08:00 | Xếp hiện trạng: vi phạm an toàn PCCC hay không | `drag_sort` | Cơ sở được kiểm tra | Luật PCCC và CNCH, quy định kiểm tra an toàn PCCC |
| 3 | 10:00 | Đọc biên bản kiểm tra có chỗ ghi sai/thiếu | `spot_error` | Phòng trực ban | Quy định về kiểm tra an toàn PCCC còn hiệu lực |
| 4 | 11:00 | Nhận tin báo cháy: việc gì trước | `choice` | Phòng trực ban | Quy định tiếp nhận tin báo và điều động lực lượng |
| 5 | 13:30 | Chia 3 giờ: huấn luyện thể lực, bảo dưỡng phương tiện, tuyên truyền | `time_budget` | Sân tập | Các việc này là nhiệm vụ của lực lượng chữa cháy |
| 6 | 15:30 | Chủ cơ sở xin "bỏ qua" lỗi vi phạm khi kiểm tra | `dialogue` | Cơ sở được kiểm tra | Luật PCCC và CNCH; quy định các hành vi bị cấm |
| 7 | 17:00 | Tại hiện trường, đồng đội đề nghị vào khu vực chưa được chỉ huy cho phép | `choice` | Hiện trường | Quy định chỉ huy chữa cháy và an toàn cho lực lượng |

- R-1. `drag_sort` (phần 2) và `spot_error` (phần 3): mỗi thẻ/lỗi "sai/vi phạm/nguy hiểm" về pháp lý PHẢI có nguồn `law` có `effective_date`; không có nguồn quy định thì KHÔNG ĐƯỢC đánh là vi phạm.
- R-2. Narrative KHÔNG ĐƯỢC mô tả thương vong chi tiết hay hình ảnh gây sốc; KHÔNG ĐƯỢC khuyến khích người dùng tự vào đám cháy. Thông điệp an toàn cho người dân chỉ được đưa vào khi có nguồn.
- R-3. Mọi đơn vị, vụ cháy, cơ sở PHẢI hư cấu; KHÔNG ĐƯỢC dựa trên vụ cháy có thật làm narrative.
- R-4. Mặt khó PHẢI có ≥ 3 fact có nguồn; ít nhất một fact về nguy hiểm tính mạng và một fact về chế độ trực.
- R-5. `education` PHẢI nêu con đường tuyển sinh vào lực lượng với nguồn `law` hoặc `official_stat` của năm gần nhất; không tìm được thì `needs_verification`.
- R-6. Phần 5: `time_budget`, `budget_min = 180`; `effect_per_30min` minh họa, KHÔNG ĐƯỢC kèm số thực tế trong narrative.

### 3.4 Bản đồ
- R-7. Bản đồ `doi-chua-chay` PHẢI có: nhà xe chữa cháy (spawn), phòng trực ban, sân tập, cơ sở được kiểm tra, hiện trường. Một bản đồ.
- R-8. NPC: đội trưởng (phần 1, 4, 7), tổ trưởng (phần 3, 5), chủ cơ sở (phần 2, 6), người dân (trang trí).

### 3.5 Lỗi
Như SPEC-009 3.5.

### 3.6 Conformance vectors
Không áp dụng.

## 4. Tiêu chí chấp nhận

| ID | Given | When | Then |
|---|---|---|---|
| AC-030-01 | `content/professions/chien-si-chua-chay.json` | `npm run validate` | Exit 0 |
| AC-030-02 | `content/worlds/chien-si-chua-chay.json` | `npm run validate:world` | Exit 0; chỉ có 1 bản đồ |
| AC-030-03 | Gói `chien-si-chua-chay` | `npm run check:pack` | Có dòng `✓ chien-si-chua-chay` |
| AC-030-04 | Gói `chien-si-chua-chay` | Test chơi hết ngày | Kết thúc ở `done` |
| AC-030-05 | `chien-si-chua-chay.json` | Đọc `sources` | Có ≥ 2 nguồn `law` có `effective_date` và ≥ 1 nguồn `market` có `issued_date` |
| AC-030-06 | Segment phần 5 | Đọc `task` | `type = "time_budget"`, `budget_min = 180` |
| AC-030-07 | Bản build | Đọc trang hồ sơ và trang màn chơi | Cả hai tồn tại; `<h1>` trang hồ sơ = `name` |

## 5. Ghi chú kiểm thử
Như SPEC-009 mục 5; test trong `tests/spec-030/`.

## 6. Câu hỏi mở
Anh đồng ý thì đánh `[x]`, không đồng ý thì sửa quy tắc tương ứng ở mục 3.
- [x] 3.1: bối cảnh nhân vật như mô tả.
- [x] R-1: chỉ đánh lỗi/vi phạm khi có nguồn quy định chính thức.
- [x] 3.3: kế hoạch 7 phần như bảng.

## 7. Lịch sử thay đổi
| Version | Ngày | Thay đổi | Lý do (BUG/ADR nếu có) |
|---|---|---|---|
| 1 | 2026-11-04 | Bản nháp đầu | PRD 4.1, SPEC-008 |
