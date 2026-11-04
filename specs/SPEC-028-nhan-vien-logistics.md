---
id: SPEC-028
title: Gói nghề Nhân viên logistics (nội dung + bản đồ văn phòng và kho vận)
version: 1
status: implemented
features: [F2, F3, F4, F5]
owns: [content/professions/nhan-vien-logistics.json, content/worlds/nhan-vien-logistics.json]
owner: anh Son
created: 2026-11-04
approved_hash: a987d71898580916
approved_by: Son
approved_at: 2026-11-04
---

# SPEC-028 — Gói nghề Nhân viên logistics

> Viết theo specs/STANDARD.md. Mục 2–4 là phần quy phạm. Mọi quy tắc chung theo SPEC-008.

## 1. Bối cảnh & lý do
Logistics là ngành tuyển sinh được quan tâm nhiều năm gần đây nhưng học sinh thường chỉ hình dung là "chở hàng". Nghề thật gồm điều phối vận chuyển, làm chứng từ xuất nhập khẩu, làm việc với hãng vận chuyển/hải quan, theo dõi tồn kho, xử lý hàng trễ; áp lực thời hạn và làm ngoài giờ theo múi giờ đối tác.

**Gợi ý nguồn cần kiểm chứng** (KHÔNG phải dữ kiện, SPEC-008 R-10): Luật Thương mại (phần dịch vụ logistics) và nghị định về kinh doanh dịch vụ logistics bản mới nhất; Luật Hải quan và quy định thủ tục hải quan; đề án tuyển sinh ngành Logistics và quản lý chuỗi cung ứng; báo cáo lương ngành logistics có năm; O*NET "Logisticians"; chia sẻ người trong nghề trên báo chí chính thống. Kiểm tra hiệu lực theo CLAUDE.md R4.

**Văn bản đã tra (2026-11-04, từ kết quả tìm kiếm; CHƯA mở toàn văn, phải kiểm chứng trước khi đưa vào `sources`):**
- Nghị định 163/2017/NĐ-CP về kinh doanh dịch vụ logistics, hiệu lực 20/02/2018 (logistics.gov.vn, vanban.chinhphu.vn docid=192501). Kết quả tìm kiếm CHƯA cho thấy văn bản thay thế, nhưng chưa loại trừ → PHẢI kiểm tra hiệu lực theo R4 trước khi dùng.
- Báo cáo lương có năm (nguồn `market`, cần mở toàn văn): ManpowerGroup Việt Nam "Lương ngành Logistics 2025"; Talentnet–Mercer báo cáo lương 2025.
- Chưa tra: Luật Hải quan bản hợp nhất mới nhất; thông tư thủ tục hải quan hiện hành.

## 2. Phạm vi
- Trong phạm vi: `content/professions/nhan-vien-logistics.json`; `content/worlds/nhan-vien-logistics.json`; định nghĩa bản đồ trong `scripts/gen-world.mjs`.
- Ngoài phạm vi: hướng dẫn khai hải quan thật; biểu thuế; công ty, cảng, hãng tàu thật.

## 3. Thiết kế

### 3.1 Bối cảnh nhân vật
Nhân viên chứng từ – điều phối 1 năm kinh nghiệm của một công ty giao nhận **hư cấu**, làm cùng một trưởng nhóm và một nhân viên kho.

### 3.2 Chỉ số
| id | label | Ý nghĩa |
|---|---|---|
| `nang_luong` | Năng lượng | Sức làm việc còn lại |
| `dung_han` | Đúng hạn | Mức lô hàng đi/đến đúng hẹn |
| `chinh_xac` | Chính xác | Mức chứng từ khớp, không sai sót |

### 3.3 Kế hoạch 7 phần
| # | Giờ | Việc | `task.type` | Nơi | `basis` cần nguồn chứng minh |
|---|---|---|---|---|---|
| 1 | 08:00 | Các bước tiếp nhận một đơn hàng xuất khẩu | `sequence` | Bàn làm việc | Nội dung dịch vụ logistics theo quy định |
| 2 | 09:00 | Xếp giấy tờ: thuộc hồ sơ hải quan hay không | `drag_sort` | Bàn làm việc | Quy định về hồ sơ hải quan còn hiệu lực |
| 3 | 10:00 | Đọc tờ khai nháp có chỗ ghi sai/thiếu | `spot_error` | Bàn làm việc | Quy định về khai hải quan còn hiệu lực |
| 4 | 11:00 | Lô hàng báo trễ: báo khách thế nào, làm gì trước | `choice` | Phòng họp | Nhiệm vụ điều phối vận chuyển |
| 5 | 13:30 | Chia 3 giờ: làm chứng từ, liên hệ hãng vận chuyển, kiểm kho | `time_budget` | Kho | Các việc này là nhiệm vụ của nhân viên logistics |
| 6 | 15:30 | Khách nhờ khai giá trị hàng thấp hơn thực tế | `dialogue` | Phòng họp | Quy định pháp luật hải quan về khai báo trung thực |
| 7 | 17:30 | Gần hết giờ, phát hiện số kiện trong kho lệch chứng từ | `choice` | Kho | Trách nhiệm đối chiếu hàng hóa với chứng từ |

- R-1. `drag_sort` (phần 2) và `spot_error` (phần 3): mỗi thẻ/lỗi "sai/vi phạm/nguy hiểm" về pháp lý PHẢI có nguồn `law` có `effective_date`; không có nguồn quy định thì KHÔNG ĐƯỢC đánh là vi phạm.
- R-2. Mọi công ty, khách, hãng vận chuyển PHẢI hư cấu; KHÔNG ĐƯỢC dùng tên hãng tàu, cảng thật trong narrative.
- R-3. Narrative KHÔNG ĐƯỢC chứa mã HS, thuế suất hay mức phạt nếu không có trong `basis`.
- R-4. Mặt khó PHẢI có ≥ 3 fact có nguồn; ít nhất một fact về áp lực thời hạn/làm ngoài giờ và một fact về thu nhập khởi điểm.
- R-5. Nếu nghị định về dịch vụ logistics chưa xác minh được hiệu lực, fact dựa vào nó PHẢI để `needs_verification`.
- R-6. Phần 5: `time_budget`, `budget_min = 180`; `effect_per_30min` minh họa, KHÔNG ĐƯỢC kèm số thực tế trong narrative.

### 3.4 Bản đồ
- R-7. Bản đồ `kho-van` PHẢI có: bàn làm việc (spawn), phòng họp, kho, khu bốc xếp, phòng trưởng nhóm. Một bản đồ.
- R-8. NPC: trưởng nhóm (phần 1, 4), nhân viên kho (phần 5, 7), khách hàng (phần 6), tài xế xe tải (trang trí).

### 3.5 Lỗi
Như SPEC-009 3.5.

### 3.6 Conformance vectors
Không áp dụng.

## 4. Tiêu chí chấp nhận

| ID | Given | When | Then |
|---|---|---|---|
| AC-028-01 | `content/professions/nhan-vien-logistics.json` | `npm run validate` | Exit 0 |
| AC-028-02 | `content/worlds/nhan-vien-logistics.json` | `npm run validate:world` | Exit 0; chỉ có 1 bản đồ |
| AC-028-03 | Gói `nhan-vien-logistics` | `npm run check:pack` | Có dòng `✓ nhan-vien-logistics` |
| AC-028-04 | Gói `nhan-vien-logistics` | Test chơi hết ngày | Kết thúc ở `done` |
| AC-028-05 | `nhan-vien-logistics.json` | Đọc `sources` | Có ≥ 2 nguồn `law` có `effective_date` và ≥ 1 nguồn `market` có `issued_date` |
| AC-028-06 | Segment phần 5 | Đọc `task` | `type = "time_budget"`, `budget_min = 180` |
| AC-028-07 | Bản build | Đọc trang hồ sơ và trang màn chơi | Cả hai tồn tại; `<h1>` trang hồ sơ = `name` |

## 5. Ghi chú kiểm thử
Như SPEC-009 mục 5; test trong `tests/spec-028/`.

## 6. Câu hỏi mở
Anh đồng ý thì đánh `[x]`, không đồng ý thì sửa quy tắc tương ứng ở mục 3.
- [x] 3.1: bối cảnh nhân vật như mô tả.
- [x] R-1: chỉ đánh lỗi/vi phạm khi có nguồn quy định chính thức.
- [x] 3.3: kế hoạch 7 phần như bảng.

## 7. Lịch sử thay đổi
| Version | Ngày | Thay đổi | Lý do (BUG/ADR nếu có) |
|---|---|---|---|
| 1 | 2026-11-04 | Bản nháp đầu | PRD 4.1, SPEC-008 |
