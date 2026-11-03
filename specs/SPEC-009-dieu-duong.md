---
id: SPEC-009
title: Gói nghề Điều dưỡng (nội dung + bản đồ bệnh viện)
version: 1
status: draft
features: [F2, F3, F4, F5]
owns: [content/professions/dieu-duong.json, content/worlds/dieu-duong.json]
owner: anh Son
created: 2026-11-03
---

# SPEC-009 — Gói nghề Điều dưỡng

> Viết theo specs/STANDARD.md. Mục 2–4 là phần quy phạm. Mọi quy tắc chung (7 phần, giới hạn chữ, nguồn testimony, kiểm tra chéo) theo SPEC-008.

## 1. Bối cảnh & lý do
Điều dưỡng là nghề thứ hai trong 6 nghề trải nghiệm sâu (PRD 4.1). Nghề có quy định pháp lý về giấy phép hành nghề và phạm vi chuyên môn, nên phần nội dung đòi hỏi nguồn pháp luật còn hiệu lực. Phần "một ngày" là ca ngày ở một khoa nội, nơi học sinh thấy được cả việc chuyên môn lẫn việc giao tiếp với người bệnh và người nhà.

**Gợi ý nguồn cần kiểm chứng** (KHÔNG phải dữ kiện, theo SPEC-008 R-10): Luật Khám bệnh, chữa bệnh năm 2023 và nghị định hướng dẫn về giấy phép hành nghề; thông tư của Bộ Y tế về công tác điều dưỡng trong bệnh viện; quy định chức danh nghề nghiệp và tiêu chuẩn điều dưỡng; đề án tuyển sinh ngành Điều dưỡng của các trường; báo cáo lương khu vực tư; chia sẻ của điều dưỡng đăng trên báo chí chính thống.

## 2. Phạm vi
- Trong phạm vi: `content/professions/dieu-duong.json` đủ mọi mục của schema (tóm tắt, yêu cầu 4 chặng, điều kiện làm việc, thu nhập, mặt khó, triển vọng, lộ trình thăng tiến, `day_simulation`); `content/worlds/dieu-duong.json` (bản đồ khoa nội + nhà); định nghĩa bản đồ trong `scripts/gen-world.mjs`.
- Ngoài phạm vi: ca đêm; chuyên khoa khác ngoài khoa nội; hướng dẫn kỹ thuật điều dưỡng chi tiết (game không dạy nghề); số liệu lâm sàng (ngưỡng huyết áp, liều thuốc) trong mini-game.

## 3. Thiết kế

### 3.1 Bối cảnh nhân vật
Người chơi là điều dưỡng mới đi làm vài năm ở khoa nội một bệnh viện công. Bối cảnh cụ thể (tuyến, địa phương) PHẢI khớp phạm vi của nguồn số liệu tìm được và ghi vào `meta.scope_note`.

### 3.2 Chỉ số (`stats`, 3 chỉ số theo SPEC-008 R-4)
| id | label | Ý nghĩa |
|---|---|---|
| `suc_luc` | Sức lực | Thể lực sau ca làm |
| `nguoi_benh_an_tam` | Người bệnh an tâm | Người bệnh và người nhà tin tưởng |
| `ap_luc` | Áp lực | Căng thẳng tích lũy |

### 3.3 Kế hoạch 7 phần (giờ là minh họa; `basis` mỗi phần PHẢI là fact có nguồn)
| # | Giờ | Việc | `task.type` | Nơi trên bản đồ | `basis` cần nguồn chứng minh |
|---|---|---|---|---|---|
| 1 | 06:45 | Nhận bàn giao ca | `sequence` | Phòng điều dưỡng | Bàn giao người bệnh giữa các ca là nhiệm vụ của điều dưỡng |
| 2 | 07:30 | Đi buồng, rà phiếu theo dõi | `spot_error` | Buồng bệnh 1 | Điều dưỡng ghi chép hồ sơ chăm sóc |
| 3 | 09:00 | Việc nào cần y lệnh bác sĩ | `drag_sort` | Xe/quầy thuốc | Phạm vi chuyên môn của điều dưỡng so với bác sĩ |
| 4 | 10:30 | Người nhà hỏi về tình trạng bệnh | `dialogue` | Hành lang | Điều dưỡng tư vấn, giáo dục sức khỏe cho người bệnh và người nhà |
| 5 | 13:30 | Hai chuông gọi cùng lúc | `choice` | Buồng bệnh 2 | Theo dõi, chăm sóc người bệnh liên tục trong ca |
| 6 | 15:30 | Hướng dẫn người bệnh chuẩn bị ra viện | `choice` | Buồng bệnh 1 | Hướng dẫn người bệnh khi ra viện |
| 7 | 19:00 | Sau ca: nghỉ, học thêm, gia đình | `time_budget` | Nhà | Yêu cầu cập nhật kiến thức y khoa liên tục để duy trì hành nghề |

- R-1. `spot_error` (phần 2) PHẢI là lỗi **ghi chép** (thiếu giờ, thiếu chữ ký, ghi sai tên thuốc so với y lệnh ghi cùng tờ) và KHÔNG ĐƯỢC dựa vào ngưỡng chỉ số lâm sàng, trừ khi ngưỡng đó có nguồn `law` hoặc `official_stat` của Bộ Y tế. *Lý do: sai một con số y khoa là mất niềm tin; game không dạy chuyên môn lâm sàng.*
- R-2. `drag_sort` (phần 3) PHẢI dựa trên văn bản pháp luật về phạm vi hoạt động chuyên môn của điều dưỡng; mỗi `item` PHẢI tương ứng một nội dung có trong văn bản đó. Không tìm được văn bản → đổi phần 3 sang loại task khác và ghi lý do vào lịch sử spec.
- R-3. Mọi `narrative` và lựa chọn KHÔNG ĐƯỢC chứa tên thuốc, liều dùng hay chẩn đoán cụ thể.
- R-4. Mặt khó (`downsides`) PHẢI có ít nhất 3 fact có nguồn; ít nhất một fact về làm việc theo ca/trực và một fact về thu nhập.

### 3.4 Bản đồ (`content/worlds/dieu-duong.json`)
- R-5. Bản đồ `khoa-noi` PHẢI có: phòng điều dưỡng (spawn), 2 buồng bệnh có giường (ô Kenney indoor giường), hành lang, quầy thuốc; bản đồ `nha` dùng lại bố cục nhà của gói giáo viên.
- R-6. NPC: 1 điều dưỡng ca trước (phần 1), 2–3 người bệnh nằm giường, 1 người nhà (phần 4). Mỗi NPC là `npc` của đúng một segment hoặc là NPC trang trí.

### 3.5 Lỗi
Không có hành vi phần mềm mới; lỗi nội dung do `validate`, `validate:world`, `check:pack` báo.

### 3.6 Conformance vectors
Không áp dụng (nội dung).

## 4. Tiêu chí chấp nhận

| ID | Given | When | Then |
|---|---|---|---|
| AC-009-01 | `content/professions/dieu-duong.json` | `npm run validate` | Exit 0 |
| AC-009-02 | `content/worlds/dieu-duong.json` | `npm run validate:world` | Exit 0 |
| AC-009-03 | Gói `dieu-duong` | `npm run check:pack` | Có dòng `✓ dieu-duong` |
| AC-009-04 | Gói `dieu-duong` | Test chơi hết ngày (SPEC-008 R-9) | Kết thúc ở `done` |
| AC-009-05 | `dieu-duong.json` | Đọc `sources`, `meta` | Có ≥ 1 nguồn `law` có `effective_date`; `meta.status = "draft"`; `meta.scope_note` khác rỗng |
| AC-009-06 | `dieu-duong.json` | Tìm trong mọi `narrative`, `options[].text`, `replies[].text`, `document[]` | Không chứa đơn vị liều (`mg`, `ml`, `viên`) và không chứa ký hiệu `°C`, `mmHg` |
| AC-009-07 | Bản build | Đọc `out/nghe/dieu-duong/index.html` và `out/nghe/dieu-duong/mot-ngay/index.html` | Cả hai tồn tại; trang hồ sơ có `<h1>` = `name` |

## 5. Ghi chú kiểm thử
- AC-009-01..04, 07 dùng lại công cụ có sẵn; test đặt trong `tests/spec-009/`.
- Nội dung do Claude Code research và viết; Codex kiểm tra chéo nguồn (SPEC-008 R-12); anh Son duyệt và đổi `reviewed`.

## 6. Câu hỏi mở
Em đã chốt theo đề xuất ở các quy tắc dưới. Anh đồng ý thì đánh `[x]`, không đồng ý thì sửa quy tắc tương ứng ở mục 3.
- [x] 3.1: bối cảnh khoa nội, bệnh viện công, ca ngày.
- [x] R-1: mini-game tìm lỗi chỉ là lỗi ghi chép, không dùng ngưỡng chỉ số lâm sàng khi chưa có nguồn Bộ Y tế.
- [x] R-3: không đưa tên thuốc, liều, chẩn đoán vào game.
- [x] 3.3: kế hoạch 7 phần trong ngày như bảng.

## 7. Lịch sử thay đổi
| Version | Ngày | Thay đổi | Lý do (BUG/ADR nếu có) |
|---|---|---|---|
| 1 | 2026-11-03 | Bản nháp đầu | PRD 4.1, SPEC-008 |
