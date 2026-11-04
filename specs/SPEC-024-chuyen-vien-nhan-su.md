---
id: SPEC-024
title: Gói nghề Chuyên viên nhân sự (nội dung + bản đồ phòng nhân sự)
version: 1
status: implemented
features: [F2, F3, F4, F5]
owns: [content/professions/chuyen-vien-nhan-su.json, content/worlds/chuyen-vien-nhan-su.json]
owner: anh Son
created: 2026-11-04
approved_hash: a1959dfdaf882484
approved_by: Son
approved_at: 2026-11-04
---

# SPEC-024 — Gói nghề Chuyên viên nhân sự

> Viết theo specs/STANDARD.md. Mục 2–4 là phần quy phạm. Mọi quy tắc chung theo SPEC-008.

## 1. Bối cảnh & lý do
Nhân sự (HR) là lựa chọn phổ biến của sinh viên khối kinh tế – xã hội. Học sinh ít biết nghề thật gồm tuyển dụng, hợp đồng lao động, bảo hiểm xã hội, lương thưởng, và các cuộc nói chuyện khó (kỷ luật, cho nghỉ việc), luôn phải đúng luật lao động.

**Gợi ý nguồn cần kiểm chứng** (KHÔNG phải dữ kiện, SPEC-008 R-10): Bộ luật Lao động và nghị định hướng dẫn về điều kiện lao động, quan hệ lao động; Luật Bảo hiểm xã hội bản mới nhất; Luật Việc làm bản mới nhất; quy định lương tối thiểu vùng còn hiệu lực; quy định chống phân biệt đối xử trong tuyển dụng; báo cáo lương ngành nhân sự có năm (Navigos, VietnamWorks, TopCV); ESCO "human resources officer"; chia sẻ của người làm nhân sự trên báo chí chính thống. Kiểm tra hiệu lực theo CLAUDE.md R4.

**Văn bản đã tra (2026-11-04, từ kết quả tìm kiếm; CHƯA mở toàn văn, phải kiểm chứng trước khi đưa vào `sources`):**
- Bộ luật Lao động 2019, số 45/2019/QH14, hợp nhất tại Văn bản hợp nhất 18/VBHN-VPQH năm 2026 (thuvienphapluat.vn, luatvietnam.vn). Cấm phân biệt đối xử: khoản 8 Điều 3 (định nghĩa) và khoản 1 Điều 8 (hành vi nghiêm cấm).
- Luật Việc làm 2025, số 74/2025/QH15, hiệu lực 01/01/2026, có định nghĩa phân biệt đối xử trong việc làm (luatvietnam.vn, chinhphu.vn docid=214560).
- Nghị định 283/2026/NĐ-CP về xử phạt, có hành vi phân biệt đối xử trong việc làm (thuvienphapluat.vn). Cần xác minh tên đầy đủ.
- Lương tối thiểu vùng: Nghị định 293/2025/NĐ-CP hiệu lực 01/01/2026; Nghị định 399/2026/NĐ-CP thay thế từ 01/01/2027 (xaydungchinhsach.chinhphu.vn). Nội dung ra mắt gần mốc này → nếu dùng con số thì ghi cả hai và ngày chuyển tiếp (R4).
- Thị trường: Navigos Group “Báo cáo Lương & Thị trường Lao động 2026 – Talent Guide 2026” (navigosgroup.com).

## 2. Phạm vi
- Trong phạm vi: `content/professions/chuyen-vien-nhan-su.json`; `content/worlds/chuyen-vien-nhan-su.json`; định nghĩa bản đồ trong `scripts/gen-world.mjs`.
- Ngoài phạm vi: tư vấn pháp lý lao động cho người dùng; mức lương, mức đóng bảo hiểm cụ thể để tự tính; doanh nghiệp thật.

## 3. Thiết kế

### 3.1 Bối cảnh nhân vật
Chuyên viên nhân sự tổng hợp 2 năm kinh nghiệm tại một công ty sản xuất **hư cấu** có 300 lao động.

### 3.2 Chỉ số
| id | label | Ý nghĩa |
|---|---|---|
| `nang_luong` | Năng lượng | Sức làm việc còn lại |
| `tuan_thu` | Tuân thủ | Mức đúng luật lao động |
| `tin_tuong` | Tin tưởng | Niềm tin của người lao động |

### 3.3 Kế hoạch 7 phần
| # | Giờ | Việc | `task.type` | Nơi | `basis` cần nguồn chứng minh |
|---|---|---|---|---|---|
| 1 | 08:00 | Các bước tuyển dụng từ đăng tin tới nhận việc | `sequence` | Bàn nhân sự | Quy định về tuyển dụng lao động trong Bộ luật Lao động |
| 2 | 09:00 | Soát tin tuyển dụng có nội dung phân biệt đối xử | `spot_error` | Bàn nhân sự | Quy định cấm phân biệt đối xử trong lao động |
| 3 | 10:30 | Soát một hợp đồng lao động thiếu nội dung bắt buộc | `spot_error` | Bàn nhân sự | Quy định nội dung chủ yếu của hợp đồng lao động |
| 4 | 13:30 | Phỏng vấn ứng viên | `dialogue` | Phòng phỏng vấn | Quy định về tuyển dụng và quyền của người lao động |
| 5 | 15:00 | Xếp yêu cầu của trưởng bộ phận: đúng luật hay trái luật | `drag_sort` | Bảng công việc | Bộ luật Lao động còn hiệu lực |
| 6 | 16:00 | Chia 2 giờ: chấm công, giải đáp bảo hiểm, chuẩn bị đào tạo | `time_budget` | Bàn nhân sự | Các việc này là nhiệm vụ của chuyên viên nhân sự |
| 7 | 17:30 | Công nhân phản ánh bị quản lý đối xử bất công | `choice` | Phòng trưởng phòng | Quy định về đối thoại, giải quyết khiếu nại tại nơi làm việc |

- R-1. Mọi lỗi `spot_error` (phần 2, 3) và thẻ "trái luật" (phần 5) PHẢI có nguồn `law` có `effective_date`, đã kiểm tra hiệu lực theo CLAUDE.md R4.
- R-2. Narrative KHÔNG ĐƯỢC ghi mức lương tối thiểu, tỉ lệ đóng bảo hiểm hay con số pháp lý nào không có trong `basis`.
- R-3. Mọi công ty, ứng viên, người lao động PHẢI hư cấu.
- R-4. Mặt khó PHẢI có ≥ 3 fact có nguồn; ít nhất một fact về áp lực từ hai phía (doanh nghiệp – người lao động) và một fact về thu nhập khởi điểm.
- R-5. Hai segment `spot_error` PHẢI dùng hai điều khoản khác nhau làm `basis`. Lý do: tránh lặp cùng một bài học.
- R-6. Phần 6: `time_budget`, `budget_min = 120`; `effect_per_30min` minh họa, KHÔNG ĐƯỢC kèm số thực tế trong narrative.

### 3.4 Bản đồ
- R-7. Bản đồ `phong-nhan-su` PHẢI có: bàn nhân sự (spawn), phòng phỏng vấn, bảng công việc (ô trên tường), phòng trưởng phòng, phòng đào tạo. Một bản đồ.
- R-8. NPC: trưởng phòng nhân sự (phần 1, 7), ứng viên (phần 4), trưởng bộ phận sản xuất (phần 5), công nhân (phần 7).

### 3.5 Lỗi
Như SPEC-009 3.5.

### 3.6 Conformance vectors
Không áp dụng.

## 4. Tiêu chí chấp nhận

| ID | Given | When | Then |
|---|---|---|---|
| AC-024-01 | `content/professions/chuyen-vien-nhan-su.json` | `npm run validate` | Exit 0 |
| AC-024-02 | `content/worlds/chuyen-vien-nhan-su.json` | `npm run validate:world` | Exit 0; chỉ có 1 bản đồ |
| AC-024-03 | Gói `chuyen-vien-nhan-su` | `npm run check:pack` | Có dòng `✓ chuyen-vien-nhan-su` |
| AC-024-04 | Gói `chuyen-vien-nhan-su` | Test chơi hết ngày | Kết thúc ở `done` |
| AC-024-05 | `chuyen-vien-nhan-su.json` | Đọc `sources` | Có ≥ 2 nguồn `law` có `effective_date` và ≥ 1 nguồn `market` có `issued_date` |
| AC-024-06 | Segment phần 6 | Đọc `task` | `type = "time_budget"`, `budget_min = 120` |
| AC-024-07 | Bản build | Đọc trang hồ sơ và trang màn chơi | Cả hai tồn tại; `<h1>` trang hồ sơ = `name` |

## 5. Ghi chú kiểm thử
Như SPEC-009 mục 5; test trong `tests/spec-024/`.

## 6. Câu hỏi mở
Anh đồng ý thì đánh `[x]`, không đồng ý thì sửa quy tắc tương ứng ở mục 3.
- [x] 3.1: bối cảnh nhân vật như mô tả.
- [x] R-1: chỉ đánh lỗi/vi phạm khi có nguồn quy định chính thức.
- [x] 3.3: kế hoạch 7 phần như bảng.

## 7. Lịch sử thay đổi
| Version | Ngày | Thay đổi | Lý do (BUG/ADR nếu có) |
|---|---|---|---|
| 1 | 2026-11-04 | Bản nháp đầu | PRD 4.1, SPEC-008 |
