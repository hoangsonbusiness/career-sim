---
id: SPEC-027
title: Gói nghề Thợ điện (nội dung + bản đồ tòa nhà đang hoàn thiện)
version: 1
status: approved
features: [F2, F3, F4, F5]
owns: [content/professions/tho-dien.json, content/worlds/tho-dien.json]
owner: anh Son
created: 2026-11-04
approved_hash: 9453e8063e4f9b73
approved_by: Son
approved_at: 2026-11-04
---

# SPEC-027 — Gói nghề Thợ điện

> Viết theo specs/STANDARD.md. Mục 2–4 là phần quy phạm. Mọi quy tắc chung theo SPEC-008.

## 1. Bối cảnh & lý do
Thợ điện là nghề kỹ thuật – tay nghề có nhu cầu ổn định, đào tạo chủ yếu qua giáo dục nghề nghiệp, hợp với học sinh thích làm việc bằng tay và tư duy kỹ thuật. Nghề thật gồm đọc bản vẽ, đi dây, lắp thiết bị, đo kiểm, sửa sự cố; rủi ro điện giật và làm việc trên cao là mặt khó lớn.

**Gợi ý nguồn cần kiểm chứng** (KHÔNG phải dữ kiện, SPEC-008 R-10): Luật Điện lực và quy chuẩn kỹ thuật quốc gia về an toàn điện bản mới nhất; Luật An toàn, vệ sinh lao động; quy định huấn luyện an toàn điện, bậc an toàn; chương trình đào tạo trung cấp/cao đẳng Điện công nghiệp, Điện dân dụng; báo cáo lương có năm; O*NET "Electricians"; chia sẻ thợ điện trên báo chí chính thống. Kiểm tra hiệu lực theo CLAUDE.md R4.

**Văn bản đã tra (2026-11-04, từ kết quả tìm kiếm; CHƯA mở toàn văn, phải kiểm chứng trước khi đưa vào `sources`):**
- Luật Điện lực số 61/2024/QH15, hiệu lực 01/02/2025 (luatvietnam.vn; vanban.chinhphu.vn docid=212489) → kiểm tra trên công báo.
- Thông tư 41/2025/TT-BCT ban hành QCVN về an toàn điện, hiệu lực 08/8/2025, thay Thông tư 39/2020/TT-BCT (thuvienphapluat.vn, luatvietnam.vn; PDF datafiles.chinhphu.vn/cpp/files/vbpq/2025/6/41-bct.pdf) → `basis` chính cho phần 1, 2, 3.
- Luật Giáo dục nghề nghiệp 2025, số 124/2025/QH15: thuvienphapluat.vn ghi hiệu lực 01/01/2026 (một số điều từ 01/7/2026), luatvietnam.vn ghi 10/12/2025 → hai nguồn mâu thuẫn, PHẢI đối chiếu công báo; chưa rõ thì `needs_verification`.
- Luật An toàn, vệ sinh lao động 84/2015/QH13 (VBHN 14/VBHN-VPQH 2024), đã ghi ở SPEC-025.

## 2. Phạm vi
- Trong phạm vi: `content/professions/tho-dien.json`; `content/worlds/tho-dien.json`; định nghĩa bản đồ trong `scripts/gen-world.mjs`.
- Ngoài phạm vi: hướng dẫn tự sửa điện; thông số thiết bị thật; công ty, công trình thật.

## 3. Thiết kế

### 3.1 Bối cảnh nhân vật
Thợ điện 2 năm kinh nghiệm của một công ty cơ điện **hư cấu**, đang thi công hệ thống điện trong một tòa nhà văn phòng, làm cùng một đội trưởng và một giám sát kỹ thuật.

### 3.2 Chỉ số
| id | label | Ý nghĩa |
|---|---|---|
| `nang_luong` | Năng lượng | Sức làm việc còn lại |
| `an_toan` | An toàn | Mức tuân thủ an toàn điện |
| `chat_luong` | Chất lượng | Mức thi công đúng bản vẽ |

### 3.3 Kế hoạch 7 phần
| # | Giờ | Việc | `task.type` | Nơi | `basis` cần nguồn chứng minh |
|---|---|---|---|---|---|
| 1 | 07:30 | Các bước an toàn trước khi làm việc trên mạch điện | `sequence` | Tủ điện tầng | Quy chuẩn kỹ thuật quốc gia về an toàn điện |
| 2 | 08:30 | Xếp thao tác và dụng cụ: an toàn hay nguy hiểm | `drag_sort` | Kho vật tư | Quy chuẩn kỹ thuật quốc gia về an toàn điện |
| 3 | 10:00 | Đọc phiếu công tác có chỗ ghi sai/thiếu | `spot_error` | Phòng chỉ huy công trường | Quy định về phiếu/lệnh công tác trong QCVN an toàn điện |
| 4 | 11:00 | Một tầng mất điện: kiểm tra từ đâu | `choice` | Tủ điện tầng | Nhiệm vụ đo kiểm, sửa sự cố của thợ điện |
| 5 | 13:30 | Chia 3 giờ: đi dây, lắp thiết bị, đo kiểm | `time_budget` | Sàn thi công | Các việc này là nhiệm vụ của thợ điện |
| 6 | 15:30 | Đội trưởng giục làm nhanh, bỏ bước cắt điện | `dialogue` | Sàn thi công | QCVN an toàn điện; quyền từ chối công việc nguy hiểm theo Luật ATVSLĐ |
| 7 | 17:00 | Gần hết giờ, một mạch đo kiểm chưa đạt | `choice` | Sàn thi công | Trách nhiệm kiểm tra trước khi bàn giao |

- R-1. `drag_sort` (phần 2) và `spot_error` (phần 3): mỗi thẻ/lỗi "sai/vi phạm/nguy hiểm" về pháp lý PHẢI có nguồn `law` có `effective_date`; không có nguồn quy định thì KHÔNG ĐƯỢC đánh là vi phạm.
- R-2. Narrative KHÔNG ĐƯỢC chứa hướng dẫn đấu nối, thông số cụ thể đủ để người dùng tự làm điện tại nhà. Lý do: an toàn tính mạng.
- R-3. Mọi công ty, công trình PHẢI hư cấu; KHÔNG ĐƯỢC dùng tên thương hiệu thiết bị thật.
- R-4. Mặt khó PHẢI có ≥ 3 fact có nguồn; ít nhất một fact về rủi ro tai nạn điện và một fact về thu nhập khởi điểm.
- R-5. `education` PHẢI nêu đường đào tạo giáo dục nghề nghiệp và yêu cầu huấn luyện an toàn điện với nguồn `law` có `effective_date`.
- R-6. Phần 5: `time_budget`, `budget_min = 180`; `effect_per_30min` minh họa, KHÔNG ĐƯỢC kèm số thực tế trong narrative.

### 3.4 Bản đồ
- R-7. Bản đồ `toa-nha` PHẢI có: tủ điện tầng (spawn), kho vật tư, phòng chỉ huy công trường, sàn thi công, thang máy công trình. Một bản đồ.
- R-8. NPC: đội trưởng (phần 1, 6), giám sát kỹ thuật (phần 3, 7), thợ phụ (phần 5), bảo vệ công trường (trang trí).

### 3.5 Lỗi
Như SPEC-009 3.5.

### 3.6 Conformance vectors
Không áp dụng.

## 4. Tiêu chí chấp nhận

| ID | Given | When | Then |
|---|---|---|---|
| AC-027-01 | `content/professions/tho-dien.json` | `npm run validate` | Exit 0 |
| AC-027-02 | `content/worlds/tho-dien.json` | `npm run validate:world` | Exit 0; chỉ có 1 bản đồ |
| AC-027-03 | Gói `tho-dien` | `npm run check:pack` | Có dòng `✓ tho-dien` |
| AC-027-04 | Gói `tho-dien` | Test chơi hết ngày | Kết thúc ở `done` |
| AC-027-05 | `tho-dien.json` | Đọc `sources` | Có ≥ 2 nguồn `law` có `effective_date` và ≥ 1 nguồn `market` có `issued_date` |
| AC-027-06 | Segment phần 5 | Đọc `task` | `type = "time_budget"`, `budget_min = 180` |
| AC-027-07 | Bản build | Đọc trang hồ sơ và trang màn chơi | Cả hai tồn tại; `<h1>` trang hồ sơ = `name` |

## 5. Ghi chú kiểm thử
Như SPEC-009 mục 5; test trong `tests/spec-027/`.

## 6. Câu hỏi mở
Anh đồng ý thì đánh `[x]`, không đồng ý thì sửa quy tắc tương ứng ở mục 3.
- [x] 3.1: bối cảnh nhân vật như mô tả.
- [x] R-1: chỉ đánh lỗi/vi phạm khi có nguồn quy định chính thức.
- [x] 3.3: kế hoạch 7 phần như bảng.

## 7. Lịch sử thay đổi
| Version | Ngày | Thay đổi | Lý do (BUG/ADR nếu có) |
|---|---|---|---|
| 1 | 2026-11-04 | Bản nháp đầu | PRD 4.1, SPEC-008 |
