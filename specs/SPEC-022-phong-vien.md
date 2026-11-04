---
id: SPEC-022
title: Gói nghề Phóng viên (nội dung + bản đồ tòa soạn)
version: 1
status: draft
features: [F2, F3, F4, F5]
owns: [content/professions/phong-vien.json, content/worlds/phong-vien.json]
owner: anh Son
created: 2026-11-04
---

# SPEC-022 — Gói nghề Phóng viên

> Viết theo specs/STANDARD.md. Mục 2–4 là phần quy phạm. Mọi quy tắc chung theo SPEC-008.

## 1. Bối cảnh & lý do
Báo chí hấp dẫn học sinh khối C/D thích viết và đi nhiều. Nghề thật gắn với kiểm chứng thông tin, áp lực hạn chót, trách nhiệm pháp lý với từng chữ, và rủi ro khi tác nghiệp. Mô phỏng giúp người dùng thấy phần "kiểm chứng" quan trọng không kém phần "viết".

**Gợi ý nguồn cần kiểm chứng** (KHÔNG phải dữ kiện, SPEC-008 R-10): Luật Báo chí và văn bản sửa đổi còn hiệu lực; quy định cấp, đổi thẻ nhà báo; Quy định đạo đức nghề nghiệp người làm báo Việt Nam (Hội Nhà báo Việt Nam); quy định xử phạt vi phạm hành chính trong lĩnh vực báo chí; đề án tuyển sinh ngành Báo chí; báo cáo lương ngành truyền thông có năm; ESCO "journalist"; chia sẻ của phóng viên trên báo chí chính thống. Kiểm tra hiệu lực theo CLAUDE.md R4.

**Văn bản đã tra (2026-11-04, từ kết quả tìm kiếm; CHƯA mở toàn văn, phải kiểm chứng trước khi đưa vào `sources`):**
- Luật Báo chí 2025, số 126/2025/QH15, hiệu lực 01/7/2026 (luatvietnam.vn); thay Luật Báo chí 2016.
- Nghị định 237/2026/NĐ-CP (26/6/2026) hướng dẫn Luật Báo chí 2025, có quy định cấp thẻ nhà báo (tuoitre.vn, thuvienphapluat.vn).
- Thông tư 19/2026/TT-BVHTTDL về hồ sơ, thủ tục cấp, đổi, thu hồi thẻ nhà báo (thuvienphapluat.vn).
- Điều kiện thẻ nhà báo theo các bài tổng hợp: bằng đại học trở lên, công tác liên tục ≥ 02 năm tại cơ quan báo chí đề nghị cấp thẻ. Nguồn thứ cấp (thuvienphapluat.vn, lsvn.vn) → phải đối chiếu Điều 28 Luật 126/2025/QH15.
- Quy định đạo đức nghề nghiệp người làm báo Việt Nam: Quyết định 483/QĐ-HNBVN ngày 16/12/2016, hiệu lực 01/01/2017 (hoinhabao.vn, nhandan.vn). Đây là quy định của tổ chức xã hội – nghề nghiệp, KHÔNG phải văn bản pháp luật → anh Son chốt: ghi `type: "official_stat"`.

## 2. Phạm vi
- Trong phạm vi: `content/professions/phong-vien.json`; `content/worlds/phong-vien.json`; định nghĩa bản đồ trong `scripts/gen-world.mjs`.
- Ngoài phạm vi: hướng dẫn viết tin bài; nhận định về cơ quan báo chí thật; sự kiện, nhân vật thật.

## 3. Thiết kế

### 3.1 Bối cảnh nhân vật
Phóng viên mảng xã hội 3 năm kinh nghiệm tại một tờ báo điện tử **hư cấu**. Buổi sáng đi hiện trường (cảnh chuyển, không cần bản đồ riêng), còn lại ở tòa soạn.

### 3.2 Chỉ số
| id | label | Ý nghĩa |
|---|---|---|
| `nang_luong` | Năng lượng | Sức làm việc còn lại |
| `chinh_xac` | Chính xác | Mức kiểm chứng thông tin |
| `toc_do` | Tốc độ | Khả năng kịp hạn |

### 3.3 Kế hoạch 7 phần
| # | Giờ | Việc | `task.type` | Nơi | `basis` cần nguồn chứng minh |
|---|---|---|---|---|---|
| 1 | 08:00 | Các bước từ nhận đề tài tới lên đường tác nghiệp | `sequence` | Bàn phóng viên | Quy trình biên tập của cơ quan báo chí |
| 2 | 10:30 | Một nguồn tin trên mạng xã hội: đăng ngay hay kiểm chứng | `choice` | Bàn phóng viên | Nghĩa vụ kiểm chứng thông tin theo luật và quy định đạo đức nghề |
| 3 | 11:30 | Xếp thông tin thu được: đã kiểm chứng hay chưa | `drag_sort` | Bảng đề tài | Quy định đạo đức nghề nghiệp người làm báo |
| 4 | 13:30 | Soát bản thảo có lỗi sai sự thật, lộ danh tính | `spot_error` | Bàn phóng viên | Quy định về thông tin cấm/không được đăng trong Luật Báo chí |
| 5 | 15:00 | Chia 2 giờ: viết bài, gọi xác minh, xử lý ảnh | `time_budget` | Bàn phóng viên | Các việc này là nhiệm vụ của phóng viên |
| 6 | 17:00 | Nhân vật trong bài xin rút lời đã nói | `dialogue` | Phòng họp | Quy định đạo đức về tôn trọng nguồn tin |
| 7 | 19:00 | Thư ký tòa soạn yêu cầu đổi tít câu khách | `choice` | Phòng thư ký tòa soạn | Trách nhiệm biên tập và đạo đức nghề |

- R-1. `spot_error` (phần 4) và `drag_sort` (phần 3): mỗi lỗi/thẻ "vi phạm" PHẢI có nguồn `law` (có `effective_date`) hoặc văn bản quy định đạo đức nghề chính thức của Hội Nhà báo Việt Nam (nguồn này PHẢI ghi `type: "official_stat"` vì không phải văn bản pháp luật).
- R-2. Sự kiện trong narrative PHẢI hư cấu; KHÔNG ĐƯỢC mô phỏng tin thật, thảm họa thật.
- R-3. Mọi tòa soạn, nhân vật PHẢI hư cấu.
- R-4. Mặt khó PHẢI có ≥ 3 fact có nguồn; ít nhất một fact về áp lực thời gian/làm ngoài giờ và một fact về rủi ro khi tác nghiệp.
- R-5. `career` PHẢI nêu điều kiện cấp thẻ nhà báo theo văn bản còn hiệu lực, nguồn `law`.
- R-6. Phần 5: `time_budget`, `budget_min = 120`; `effect_per_30min` minh họa, KHÔNG ĐƯỢC kèm số thực tế trong narrative.

### 3.4 Bản đồ
- R-7. Bản đồ `toa-soan` PHẢI có: bàn phóng viên (spawn), bảng đề tài (ô trên tường), phòng họp, phòng thư ký tòa soạn, góc in thử. Một bản đồ.
- R-8. NPC: thư ký tòa soạn (phần 1, 7), trưởng ban (phần 3, 4), nhân vật phỏng vấn (phần 6), phóng viên ảnh (trang trí).

### 3.5 Lỗi
Như SPEC-009 3.5.

### 3.6 Conformance vectors
Không áp dụng.

## 4. Tiêu chí chấp nhận

| ID | Given | When | Then |
|---|---|---|---|
| AC-022-01 | `content/professions/phong-vien.json` | `npm run validate` | Exit 0 |
| AC-022-02 | `content/worlds/phong-vien.json` | `npm run validate:world` | Exit 0; chỉ có 1 bản đồ |
| AC-022-03 | Gói `phong-vien` | `npm run check:pack` | Có dòng `✓ phong-vien` |
| AC-022-04 | Gói `phong-vien` | Test chơi hết ngày | Kết thúc ở `done` |
| AC-022-05 | `phong-vien.json` | Đọc `sources` | Có ≥ 2 nguồn `law` có `effective_date` và ≥ 1 nguồn `market` có `issued_date` |
| AC-022-06 | Segment phần 5 | Đọc `task` | `type = "time_budget"`, `budget_min = 120` |
| AC-022-07 | Bản build | Đọc trang hồ sơ và trang màn chơi | Cả hai tồn tại; `<h1>` trang hồ sơ = `name` |

## 5. Ghi chú kiểm thử
Như SPEC-009 mục 5; test trong `tests/spec-022/`.

## 6. Câu hỏi mở
Anh đồng ý thì đánh `[x]`, không đồng ý thì sửa quy tắc tương ứng ở mục 3.
- [x] 3.1: bối cảnh nhân vật như mô tả.
- [x] R-1: chỉ đánh lỗi/vi phạm khi có nguồn quy định chính thức.
- [x] 3.3: kế hoạch 7 phần như bảng.

## 7. Lịch sử thay đổi
| Version | Ngày | Thay đổi | Lý do (BUG/ADR nếu có) |
|---|---|---|---|
| 1 | 2026-11-04 | Bản nháp đầu | PRD 4.1, SPEC-008 |
