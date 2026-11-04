---
id: SPEC-021
title: Gói nghề Giáo viên mầm non (nội dung + bản đồ lớp mẫu giáo)
version: 1
status: approved
features: [F2, F3, F4, F5]
owns: [content/professions/giao-vien-mam-non.json, content/worlds/giao-vien-mam-non.json]
owner: anh Son
created: 2026-11-04
approved_hash: 70e717ad295fb404
approved_by: Son
approved_at: 2026-11-04
---

# SPEC-021 — Gói nghề Giáo viên mầm non

> Viết theo specs/STANDARD.md. Mục 2–4 là phần quy phạm. Mọi quy tắc chung theo SPEC-008.

## 1. Bối cảnh & lý do
Mầm non là ngành sư phạm tuyển nhiều, được nhà nước ưu tiên, nhưng học sinh thường chỉ thấy phần "chơi với trẻ". Nghề thật gồm chăm sóc – nuôi dưỡng (ăn, ngủ, vệ sinh), tổ chức hoạt động giáo dục theo chương trình, đảm bảo an toàn tuyệt đối cho trẻ, làm việc với phụ huynh; giờ làm dài (đón sớm, trả muộn) và thu nhập là điểm khó. Khác mẫu `giao-vien-thpt` (dạy theo môn, có thi cử).

**Gợi ý nguồn cần kiểm chứng** (KHÔNG phải dữ kiện, SPEC-008 R-10): Luật Giáo dục và quy định trình độ chuẩn giáo viên mầm non; chuẩn nghề nghiệp giáo viên mầm non; Điều lệ trường mầm non; chương trình giáo dục mầm non hiện hành; quy định chế độ làm việc giáo viên mầm non; quy định mã số, chức danh nghề nghiệp và xếp lương giáo viên mầm non công lập; quy định về phòng, chống bạo lực/xâm hại trẻ em; đề án tuyển sinh ngành Giáo dục Mầm non; báo cáo lương khu vực tư thục có năm; ESCO "early years teacher"; chia sẻ của giáo viên mầm non trên báo chí chính thống. Kiểm tra hiệu lực theo CLAUDE.md R4.

**Văn bản đã tra (2026-11-04, từ kết quả tìm kiếm; CHƯA mở toàn văn, phải kiểm chứng trước khi đưa vào `sources`):**
- Thông tư 11/2026/TT-BGDĐT (ban hành 04/3/2026) quy định chế độ làm việc giáo viên mầm non, thay Thông tư 48/2011/TT-BGDĐT. Nguồn: vanban.chinhphu.vn docid=217127; thuvienphapluat.vn.
- Thông tư 28/2026/TT-BGDĐT quy định chuẩn nghề nghiệp giáo viên mầm non; congbao.chinhphu.vn ghi hiệu lực 09/4/2026.
- Điều lệ trường mầm non: Văn bản hợp nhất 09/2026/VBHN-TT-BGDĐT (23/7/2026), hợp nhất Thông tư 52/2020/TT-BGDĐT và Thông tư 51/2026/TT-BGDĐT sửa đổi.
- Lộ trình nâng trình độ chuẩn: Nghị định 71/2020/NĐ-CP được sửa bởi Nghị định 311/2025/NĐ-CP (baochinhphu.vn).
- Chương trình giáo dục mầm non: năm học 2026–2027 có chương trình thí điểm tại 510 cơ sở (theo hoatieu.vn, nguồn thứ cấp). Cần xác định chương trình nào đang áp dụng chính thức trước khi viết phần 2 → nếu chưa rõ thì `needs_verification`.

## 2. Phạm vi
- Trong phạm vi: `content/professions/giao-vien-mam-non.json`; `content/worlds/giao-vien-mam-non.json`; định nghĩa bản đồ trong `scripts/gen-world.mjs`.
- Ngoài phạm vi: hướng dẫn chăm sóc y tế cho trẻ; thực đơn, khẩu phần cụ thể; trường, trẻ, phụ huynh thật.

## 3. Thiết kế

### 3.1 Bối cảnh nhân vật
Giáo viên 2 năm kinh nghiệm, phụ trách một lớp mẫu giáo 4–5 tuổi cùng một giáo viên khác tại một trường mầm non công lập **hư cấu**. Một ngày từ giờ đón trẻ tới giờ trả trẻ.

### 3.2 Chỉ số
| id | label | Ý nghĩa |
|---|---|---|
| `nang_luong` | Năng lượng | Sức làm việc còn lại |
| `an_toan` | An toàn | Mức đảm bảo an toàn cho trẻ |
| `gan_ket` | Gắn kết | Niềm tin của trẻ và phụ huynh |

### 3.3 Kế hoạch 7 phần
| # | Giờ | Việc | `task.type` | Nơi | `basis` cần nguồn chứng minh |
|---|---|---|---|---|---|
| 1 | 06:45 | Các bước đón trẻ và kiểm tra sức khỏe đầu ngày | `sequence` | Cửa lớp | Quy định đón trả trẻ trong Điều lệ trường mầm non |
| 2 | 08:00 | Soát kế hoạch hoạt động trong ngày có chỗ sai chương trình | `spot_error` | Bàn giáo viên | Chương trình giáo dục mầm non hiện hành |
| 3 | 09:30 | Xếp đồ dùng: an toàn cho trẻ 4–5 tuổi hay không | `drag_sort` | Góc chơi | Quy định về an toàn, phòng tránh tai nạn thương tích cho trẻ |
| 4 | 11:00 | Một bé không chịu ăn, khóc đòi mẹ | `choice` | Khu ăn | Nhiệm vụ chăm sóc nuôi dưỡng của giáo viên mầm non |
| 5 | 13:30 | Chia 2 giờ: làm đồ dùng dạy học, ghi sổ theo dõi, trang trí lớp | `time_budget` | Bàn giáo viên | Các việc này là nhiệm vụ của giáo viên mầm non |
| 6 | 15:30 | Hai bé xô nhau, một bé trầy tay | `choice` | Sân chơi | Trách nhiệm xử lý sự cố và báo cáo |
| 7 | 16:45 | Phụ huynh phàn nàn khi đón con | `dialogue` | Cửa lớp | Quy định phối hợp nhà trường – gia đình |

- R-1. `drag_sort` (phần 3): mỗi thẻ "không an toàn" PHẢI có `basis` dẫn quy định hoặc hướng dẫn chính thức (nguồn `law` hoặc `official_stat`). Không có nguồn → KHÔNG ĐƯỢC đánh là không an toàn.
- R-2. Narrative KHÔNG ĐƯỢC mô tả chi tiết thương tích, bạo lực với trẻ; sự cố phần 6 chỉ ở mức nhẹ (trầy xước). Lý do: người dùng là học sinh.
- R-3. Mọi trẻ, phụ huynh, trường PHẢI hư cấu; KHÔNG ĐƯỢC dùng ảnh hay tên trẻ thật.
- R-4. Mặt khó PHẢI có ≥ 3 fact có nguồn; ít nhất một fact về thời gian làm việc kéo dài trong ngày và một fact về thu nhập.
- R-5. `education` PHẢI nêu trình độ chuẩn giáo viên mầm non theo văn bản còn hiệu lực, nguồn `law` có `effective_date`.
- R-6. Phần 5: `time_budget`, `budget_min = 120`; `effect_per_30min` minh họa, KHÔNG ĐƯỢC kèm số thực tế trong narrative.

### 3.4 Bản đồ
- R-7. Bản đồ `truong-mam-non` PHẢI có: cửa lớp (spawn), bàn giáo viên, góc chơi, khu ăn, sân chơi. Một bản đồ.
- R-8. NPC: giáo viên cùng lớp (phần 1, 5), phụ huynh (phần 1, 7), hiệu phó chuyên môn (phần 2, 6), nhân viên cấp dưỡng (phần 4), trẻ (trang trí, không thoại cá nhân hóa).

### 3.5 Lỗi
Như SPEC-009 3.5.

### 3.6 Conformance vectors
Không áp dụng.

## 4. Tiêu chí chấp nhận

| ID | Given | When | Then |
|---|---|---|---|
| AC-021-01 | `content/professions/giao-vien-mam-non.json` | `npm run validate` | Exit 0 |
| AC-021-02 | `content/worlds/giao-vien-mam-non.json` | `npm run validate:world` | Exit 0; chỉ có 1 bản đồ |
| AC-021-03 | Gói `giao-vien-mam-non` | `npm run check:pack` | Có dòng `✓ giao-vien-mam-non` |
| AC-021-04 | Gói `giao-vien-mam-non` | Test chơi hết ngày | Kết thúc ở `done` |
| AC-021-05 | `giao-vien-mam-non.json` | Đọc `sources` | Có ≥ 2 nguồn `law` có `effective_date` và ≥ 1 nguồn `market` có `issued_date` |
| AC-021-06 | Segment phần 5 | Đọc `task` | `type = "time_budget"`, `budget_min = 120` |
| AC-021-07 | Bản build | Đọc trang hồ sơ và trang màn chơi | Cả hai tồn tại; `<h1>` trang hồ sơ = `name` |

## 5. Ghi chú kiểm thử
Như SPEC-009 mục 5; test trong `tests/spec-021/`.

## 6. Câu hỏi mở
Anh đồng ý thì đánh `[x]`, không đồng ý thì sửa quy tắc tương ứng ở mục 3.
- [x] 3.1: bối cảnh nhân vật như mô tả.
- [x] R-1: chỉ đánh lỗi/vi phạm khi có nguồn quy định chính thức.
- [x] 3.3: kế hoạch 7 phần như bảng.

## 7. Lịch sử thay đổi
| Version | Ngày | Thay đổi | Lý do (BUG/ADR nếu có) |
|---|---|---|---|
| 1 | 2026-11-04 | Bản nháp đầu | PRD 4.1, SPEC-008 |
