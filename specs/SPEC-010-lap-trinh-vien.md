---
id: SPEC-010
title: Gói nghề Lập trình viên (nội dung + bản đồ văn phòng phần mềm)
version: 1
status: approved
features: [F2, F3, F4, F5]
owns: [content/professions/lap-trinh-vien.json, content/worlds/lap-trinh-vien.json]
owner: anh Son
created: 2026-11-03
approved_hash: 5b559b17f9204937
approved_by: Son
approved_at: 2026-11-03
---

# SPEC-010 — Gói nghề Lập trình viên

> Viết theo specs/STANDARD.md. Mục 2–4 là phần quy phạm. Mọi quy tắc chung theo SPEC-008.

## 1. Bối cảnh & lý do
Lập trình viên là nghề được học sinh quan tâm nhiều nhưng hình dung thường lệch (chỉ "ngồi gõ code"). Phần "một ngày" cho thấy cả họp, đọc yêu cầu, review code, xử lý sự cố, trao đổi với người không chuyên.

Khác các nghề khác: nghề này **không có chứng chỉ hành nghề bắt buộc** theo hiểu biết hiện tại của em (cần kiểm chứng). Vì vậy nguồn chính là đề án tuyển sinh, báo cáo thị trường lao động có năm, khung ESCO/O*NET để phân rã nhiệm vụ, và chia sẻ người trong nghề.

**Gợi ý nguồn cần kiểm chứng** (KHÔNG phải dữ kiện, SPEC-008 R-10): báo cáo lương và thị trường IT Việt Nam theo năm (ITviec, TopDev, VietnamWorks); đề án tuyển sinh ngành Công nghệ thông tin/Khoa học máy tính; ESCO "software developer"; chia sẻ của lập trình viên trên báo chí chính thống.

## 2. Phạm vi
- Trong phạm vi: `content/professions/lap-trinh-vien.json` đủ mọi mục schema; `content/worlds/lap-trinh-vien.json` (văn phòng + nhà); định nghĩa bản đồ trong `scripts/gen-world.mjs`.
- Ngoài phạm vi: dạy lập trình; code chạy thật trong game; phân biệt chi tiết các vị trí (frontend/backend/mobile).

## 3. Thiết kế

### 3.1 Bối cảnh nhân vật
Lập trình viên đi làm vài năm tại một công ty phần mềm ở Việt Nam. Loại công ty (gia công phần mềm hay làm sản phẩm) PHẢI chốt theo câu hỏi mở và ghi vào `meta.scope_note`.

### 3.2 Chỉ số
| id | label | Ý nghĩa |
|---|---|---|
| `nang_luong` | Năng lượng | Sức tập trung còn lại |
| `chat_luong` | Chất lượng code | Ít lỗi, dễ bảo trì |
| `ap_luc` | Áp lực deadline | Căng thẳng tiến độ |

### 3.3 Kế hoạch 7 phần
| # | Giờ | Việc | `task.type` | Nơi | `basis` cần nguồn chứng minh |
|---|---|---|---|---|---|
| 1 | 09:00 | Họp đầu ngày (daily stand-up) | `choice` | Phòng họp | Họp nhóm ngắn hằng ngày là thực hành phổ biến trong nhóm phần mềm |
| 2 | 09:30 | Chia nhỏ một yêu cầu thành các bước làm | `sequence` | Bàn làm việc | Phân tích yêu cầu, thiết kế, lập trình, kiểm thử là nhiệm vụ của lập trình viên |
| 3 | 11:00 | Review code của đồng nghiệp | `spot_error` | Bàn đồng nghiệp | Review code là một phần công việc |
| 4 | 13:30 | Phân loại lỗi: sửa ngay hay để sau | `drag_sort` | Bàn làm việc | Sửa lỗi, bảo trì phần mềm là nhiệm vụ của lập trình viên |
| 5 | 15:00 | Khách hàng muốn đổi yêu cầu sát hạn | `dialogue` | Phòng họp | Lập trình viên trao đổi yêu cầu với khách hàng/quản lý dự án |
| 6 | 17:30 | Hệ thống đang chạy gặp sự cố | `choice` | Bàn làm việc | Hỗ trợ, xử lý sự cố hệ thống |
| 7 | 20:00 | Buổi tối: học công nghệ mới, nghỉ, gia đình | `time_budget` | Nhà | Nghề đòi hỏi tự học liên tục |

- R-1. `spot_error` (phần 3) PHẢI dùng **mã giả tiếng Việt** (ví dụ "nếu tuổi > 18 thì …"), mỗi dòng ≤ 70 ký tự, lỗi là lỗi logic đọc hiểu được mà không cần biết ngôn ngữ lập trình. *Lý do: học sinh THCS/THPT chưa học lập trình vẫn chơi được.*
- R-2. Mọi mức lương PHẢI ghi năm của báo cáo và phân biệt theo kinh nghiệm theo đúng cách nguồn phân loại; hai nguồn lệch nhau → ghi cả hai vào `note`, đặt `needs_verification` (CLAUDE.md R4).
- R-3. Mặt khó PHẢI có ít nhất 3 fact có nguồn; ít nhất một fact về làm thêm giờ/áp lực tiến độ và một fact về yêu cầu tự học liên tục.
- R-4. Yêu cầu chặng `on_the_job` KHÔNG ĐƯỢC khẳng định "không cần bằng đại học" hay "bắt buộc bằng đại học" nếu không có nguồn khảo sát tuyển dụng cụ thể.

### 3.4 Bản đồ
- R-5. Bản đồ `van-phong` PHẢI có: khu bàn làm việc mở (spawn), phòng họp có bàn dài, góc pantry; bản đồ `nha` dùng lại bố cục nhà.
- R-6. NPC: trưởng nhóm (phần 1), đồng nghiệp (phần 3), khách hàng/quản lý dự án (phần 5), 2–3 đồng nghiệp trang trí.

### 3.5 Lỗi
Như SPEC-009 3.5.

### 3.6 Conformance vectors
Không áp dụng.

## 4. Tiêu chí chấp nhận

| ID | Given | When | Then |
|---|---|---|---|
| AC-010-01 | `content/professions/lap-trinh-vien.json` | `npm run validate` | Exit 0 |
| AC-010-02 | `content/worlds/lap-trinh-vien.json` | `npm run validate:world` | Exit 0 |
| AC-010-03 | Gói `lap-trinh-vien` | `npm run check:pack` | Có dòng `✓ lap-trinh-vien` |
| AC-010-04 | Gói `lap-trinh-vien` | Test chơi hết ngày | Kết thúc ở `done` |
| AC-010-05 | `lap-trinh-vien.json` | Đọc `sources` | Có ≥ 2 nguồn `market` với 2 `publisher` khác nhau, mỗi nguồn có `issued_date` |
| AC-010-06 | Segment `spot_error` | Đọc `document[]` | Mỗi dòng ≤ 70 ký tự; không dòng nào chứa `{`, `}` hoặc `;` (mã giả, không phải code thật) |
| AC-010-07 | Bản build | Đọc trang hồ sơ và trang màn chơi | Cả hai tồn tại; `<h1>` trang hồ sơ = `name` |

## 5. Ghi chú kiểm thử
Như SPEC-009 mục 5; test đặt trong `tests/spec-010/`.

## 6. Câu hỏi mở
Em đã chốt theo đề xuất ở các quy tắc dưới. Anh đồng ý thì đánh `[x]`, không đồng ý thì sửa quy tắc tương ứng ở mục 3.
- [x] 3.1: bối cảnh công ty phần mềm làm sản phẩm (không phải gia công), lập trình viên 2–3 năm kinh nghiệm.
- [x] R-1: mini-game review code dùng mã giả tiếng Việt.
- [x] 3.3: kế hoạch 7 phần trong ngày như bảng.

## 7. Lịch sử thay đổi
| Version | Ngày | Thay đổi | Lý do (BUG/ADR nếu có) |
|---|---|---|---|
| 1 | 2026-11-03 | Bản nháp đầu | PRD 4.1, SPEC-008 |
