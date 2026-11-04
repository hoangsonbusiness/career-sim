---
id: SPEC-029
title: Gói nghề Chuyên viên phân tích dữ liệu (nội dung + bản đồ văn phòng công ty thương mại điện tử)
version: 1
status: implemented
features: [F2, F3, F4, F5]
owns: [content/professions/chuyen-vien-phan-tich-du-lieu.json, content/worlds/chuyen-vien-phan-tich-du-lieu.json]
owner: anh Son
created: 2026-11-04
approved_hash: cc3258e1c02c79be
approved_by: Son
approved_at: 2026-11-04
---

# SPEC-029 — Gói nghề Chuyên viên phân tích dữ liệu

> Viết theo specs/STANDARD.md. Mục 2–4 là phần quy phạm. Mọi quy tắc chung theo SPEC-008.

## 1. Bối cảnh & lý do
Phân tích dữ liệu là nghề mới, được nhắc nhiều nhưng học sinh ít biết công việc cụ thể. Khác Lập trình viên (SPEC-010): trọng tâm là làm sạch dữ liệu, truy vấn, trực quan hóa, giải thích con số cho người ra quyết định, và tuân thủ quy định bảo vệ dữ liệu cá nhân.

**Gợi ý nguồn cần kiểm chứng** (KHÔNG phải dữ kiện, SPEC-008 R-10): Luật Dữ liệu; Luật Bảo vệ dữ liệu cá nhân và nghị định hướng dẫn; đề án tuyển sinh ngành Khoa học dữ liệu; báo cáo lương IT/Data có năm; O*NET "Data Scientists"; chia sẻ người trong nghề trên báo chí chính thống. Kiểm tra hiệu lực theo CLAUDE.md R4.

**Văn bản đã tra (2026-11-04, từ kết quả tìm kiếm; CHƯA mở toàn văn, phải kiểm chứng trước khi đưa vào `sources`):**
- Luật Dữ liệu số 60/2024/QH15, ban hành 30/11/2024, hiệu lực 01/7/2025 (congbao.chinhphu.vn).
- Luật Bảo vệ dữ liệu cá nhân số 91/2025/QH15, ban hành 26/6/2025, hiệu lực 01/01/2026 (luatvietnam.vn; vanban.chinhphu.vn docid=214590) → kiểm tra công báo và nghị định hướng dẫn mới nhất; Nghị định 13/2023/NĐ-CP có thể đã bị thay.
- Báo cáo lương (nguồn `market`): ITviec "Báo cáo Lương IT & Thị trường tuyển dụng IT Việt Nam 2025-2026"; TopCV tra cứu lương Data Analyst 2026. Bài Facebook của ITviec trích số liệu KHÔNG được dùng làm nguồn, phải mở báo cáo gốc.

## 2. Phạm vi
- Trong phạm vi: `content/professions/chuyen-vien-phan-tich-du-lieu.json`; `content/worlds/chuyen-vien-phan-tich-du-lieu.json`; định nghĩa bản đồ trong `scripts/gen-world.mjs`.
- Ngoài phạm vi: dạy SQL/Python; dữ liệu thật của doanh nghiệp; công ty thật.

## 3. Thiết kế

### 3.1 Bối cảnh nhân vật
Chuyên viên phân tích dữ liệu 1 năm kinh nghiệm tại một công ty thương mại điện tử **hư cấu**, làm cùng một trưởng nhóm dữ liệu và một quản lý marketing.

### 3.2 Chỉ số
| id | label | Ý nghĩa |
|---|---|---|
| `nang_luong` | Năng lượng | Sức làm việc còn lại |
| `chinh_xac` | Chính xác | Mức số liệu đúng, có kiểm tra |
| `bao_mat` | Bảo mật | Mức tuân thủ bảo vệ dữ liệu cá nhân |

### 3.3 Kế hoạch 7 phần
| # | Giờ | Việc | `task.type` | Nơi | `basis` cần nguồn chứng minh |
|---|---|---|---|---|---|
| 1 | 08:30 | Các bước làm một báo cáo từ yêu cầu tới bàn giao | `sequence` | Bàn làm việc | Nhiệm vụ phân tích dữ liệu (khung O*NET, đối chiếu tin tuyển dụng VN) |
| 2 | 09:30 | Xếp trường dữ liệu: là dữ liệu cá nhân hay không | `drag_sort` | Bàn làm việc | Luật Bảo vệ dữ liệu cá nhân còn hiệu lực |
| 3 | 10:30 | Đọc biểu đồ báo cáo có chỗ sai/gây hiểu nhầm | `spot_error` | Phòng họp | Nhiệm vụ kiểm tra chất lượng dữ liệu, trình bày số liệu |
| 4 | 11:30 | Doanh số giảm đột ngột trên dashboard: kiểm tra từ đâu | `choice` | Bàn làm việc | Nhiệm vụ làm sạch, kiểm tra dữ liệu |
| 5 | 13:30 | Chia 3 giờ: làm sạch dữ liệu, phân tích, viết báo cáo | `time_budget` | Bàn làm việc | Các việc này là nhiệm vụ của chuyên viên phân tích dữ liệu |
| 6 | 15:30 | Quản lý marketing xin file danh sách khách hàng kèm số điện thoại | `dialogue` | Phòng họp | Luật Bảo vệ dữ liệu cá nhân còn hiệu lực |
| 7 | 17:00 | Gần hạn nộp, phát hiện số liệu tuần trước bị trùng | `choice` | Phòng họp | Trách nhiệm bảo đảm số liệu đúng trước khi báo cáo |

- R-1. `drag_sort` (phần 2) và `spot_error` (phần 3): mỗi thẻ/lỗi "sai/vi phạm/nguy hiểm" về pháp lý PHẢI có nguồn `law` có `effective_date`; không có nguồn quy định thì KHÔNG ĐƯỢC đánh là vi phạm.
- R-2. `spot_error` phần 3 là lỗi trình bày số liệu (không phải vi phạm pháp luật): mỗi lỗi PHẢI có `basis` là nguồn mô tả nhiệm vụ nghề, KHÔNG ĐƯỢC gọi là "vi phạm".
- R-3. Mọi công ty, khách hàng, bộ dữ liệu PHẢI hư cấu; số liệu trong biểu đồ minh họa KHÔNG ĐƯỢC trình bày như số thật của thị trường.
- R-4. Mặt khó PHẢI có ≥ 3 fact có nguồn; ít nhất một fact về thu nhập khởi điểm và một fact về yêu cầu học liên tục/cạnh tranh tuyển dụng.
- R-5. `education` PHẢI nêu ít nhất một ngành đào tạo đại học liên quan với nguồn `official_stat` (đề án tuyển sinh).
- R-6. Phần 5: `time_budget`, `budget_min = 180`; `effect_per_30min` minh họa, KHÔNG ĐƯỢC kèm số thực tế trong narrative.

### 3.4 Bản đồ
- R-7. Bản đồ `van-phong-du-lieu` PHẢI có: bàn làm việc (spawn), phòng họp, phòng trưởng nhóm, góc pantry, khu marketing. Một bản đồ.
- R-8. NPC: trưởng nhóm dữ liệu (phần 1, 7), quản lý marketing (phần 3, 6), kỹ sư dữ liệu (phần 4), nhân viên văn phòng (trang trí).

### 3.5 Lỗi
Như SPEC-009 3.5.

### 3.6 Conformance vectors
Không áp dụng.

## 4. Tiêu chí chấp nhận

| ID | Given | When | Then |
|---|---|---|---|
| AC-029-01 | `content/professions/chuyen-vien-phan-tich-du-lieu.json` | `npm run validate` | Exit 0 |
| AC-029-02 | `content/worlds/chuyen-vien-phan-tich-du-lieu.json` | `npm run validate:world` | Exit 0; chỉ có 1 bản đồ |
| AC-029-03 | Gói `chuyen-vien-phan-tich-du-lieu` | `npm run check:pack` | Có dòng `✓ chuyen-vien-phan-tich-du-lieu` |
| AC-029-04 | Gói `chuyen-vien-phan-tich-du-lieu` | Test chơi hết ngày | Kết thúc ở `done` |
| AC-029-05 | `chuyen-vien-phan-tich-du-lieu.json` | Đọc `sources` | Có ≥ 2 nguồn `law` có `effective_date` và ≥ 1 nguồn `market` có `issued_date` |
| AC-029-06 | Segment phần 5 | Đọc `task` | `type = "time_budget"`, `budget_min = 180` |
| AC-029-07 | Bản build | Đọc trang hồ sơ và trang màn chơi | Cả hai tồn tại; `<h1>` trang hồ sơ = `name` |

## 5. Ghi chú kiểm thử
Như SPEC-009 mục 5; test trong `tests/spec-029/`.

## 6. Câu hỏi mở
Anh đồng ý thì đánh `[x]`, không đồng ý thì sửa quy tắc tương ứng ở mục 3.
- [x] 3.1: bối cảnh nhân vật như mô tả.
- [x] R-1: chỉ đánh lỗi/vi phạm khi có nguồn quy định chính thức.
- [x] 3.3: kế hoạch 7 phần như bảng.

## 7. Lịch sử thay đổi
| Version | Ngày | Thay đổi | Lý do (BUG/ADR nếu có) |
|---|---|---|---|
| 1 | 2026-11-04 | Bản nháp đầu | PRD 4.1, SPEC-008 |
