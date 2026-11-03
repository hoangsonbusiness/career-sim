---
id: SPEC-012
title: Gói nghề Kỹ sư xây dựng (nội dung + bản đồ công trường)
version: 1
status: draft
features: [F2, F3, F4, F5]
owns: [content/professions/ky-su-xay-dung.json, content/worlds/ky-su-xay-dung.json]
owner: anh Son
created: 2026-11-03
---

# SPEC-012 — Gói nghề Kỹ sư xây dựng

> Viết theo specs/STANDARD.md. Mục 2–4 là phần quy phạm. Mọi quy tắc chung theo SPEC-008.

## 1. Bối cảnh & lý do
Kỹ sư xây dựng là nghề có yếu tố **an toàn lao động** và **chứng chỉ hành nghề**. Học sinh thường hình dung là "vẽ thiết kế trong văn phòng"; phần "một ngày" đặt người chơi ở vai kỹ sư giám sát thi công tại công trường: đầu ca an toàn, kiểm tra hiện trường, nghiệm thu, xử lý thời tiết, làm việc với chủ đầu tư.

**Gợi ý nguồn cần kiểm chứng** (KHÔNG phải dữ kiện, SPEC-008 R-10): Luật Xây dựng và các lần sửa đổi; nghị định về chứng chỉ hành nghề hoạt động xây dựng; nghị định về quản lý chất lượng, thi công và nghiệm thu công trình; quy chuẩn kỹ thuật quốc gia về an toàn trong thi công xây dựng; báo cáo lương có năm; đề án tuyển sinh ngành Kỹ thuật xây dựng; chia sẻ của kỹ sư công trường trên báo chí chính thống.

**Asset:** công trường là cảnh ngoài trời; bộ Kenney Indoor + Characters hiện có không có đất, rào, giàn giáo, máy móc. Xem câu hỏi mở về nguồn hình.

## 2. Phạm vi
- Trong phạm vi: `content/professions/ky-su-xay-dung.json` đủ mọi mục schema; `content/worlds/ky-su-xay-dung.json` (công trường + lán ban chỉ huy + nhà); định nghĩa bản đồ và ô nền mới trong `scripts/gen-world.mjs`.
- Ngoài phạm vi: kỹ sư thiết kế/kết cấu trong văn phòng; tính toán kỹ thuật; thông số kỹ thuật cụ thể (mác bê tông, đường kính thép) trừ khi có nguồn và cần cho mini-game.

## 3. Thiết kế

### 3.1 Bối cảnh nhân vật
Kỹ sư giám sát thi công (phía nhà thầu hoặc tư vấn giám sát — chốt theo câu hỏi mở) tại công trình nhà nhiều tầng đang thi công phần thân.

### 3.2 Chỉ số
| id | label | Ý nghĩa |
|---|---|---|
| `suc_luc` | Sức lực | Thể lực khi làm ngoài trời |
| `an_toan` | An toàn công trường | Rủi ro tai nạn được kiểm soát |
| `tien_do` | Tiến độ | Công việc theo kế hoạch |

### 3.3 Kế hoạch 7 phần
| # | Giờ | Việc | `task.type` | Nơi | `basis` cần nguồn chứng minh |
|---|---|---|---|---|---|
| 1 | 06:45 | Các bước kiểm tra an toàn đầu ca | `sequence` | Cổng công trường | Kiểm tra an toàn trước khi thi công theo quy chuẩn an toàn xây dựng |
| 2 | 07:30 | Đi kiểm tra hiện trường, rà bảng kiểm an toàn | `spot_error` | Khu giàn giáo | Kỹ sư giám sát kiểm tra điều kiện an toàn tại hiện trường |
| 3 | 09:30 | Nhà thầu muốn đổ bê tông khi chưa nghiệm thu cốt thép | `choice` | Sàn đang thi công | Công việc phải được nghiệm thu trước khi chuyển bước |
| 4 | 11:00 | Phân loại vi phạm: dừng thi công ngay hay ghi nhận khắc phục | `drag_sort` | Lán ban chỉ huy | Quyền và trách nhiệm dừng thi công khi có nguy cơ mất an toàn |
| 5 | 14:00 | Chủ đầu tư muốn rút ngắn tiến độ | `dialogue` | Lán ban chỉ huy | Kỹ sư làm việc với chủ đầu tư, tư vấn giám sát |
| 6 | 16:00 | Mưa lớn bất ngờ | `choice` | Sàn đang thi công | Biện pháp an toàn khi thời tiết xấu |
| 7 | 19:30 | Buổi tối: nhật ký, ôn thi chứng chỉ, gia đình | `time_budget` | Nhà | Yêu cầu chứng chỉ hành nghề / ghi nhật ký thi công |

- R-1. Mọi mini-game về an toàn PHẢI dựa trên quy chuẩn hoặc văn bản pháp luật còn hiệu lực; đáp án "đúng" của `sequence`, `spot_error`, `drag_sort` PHẢI truy được về nội dung trong văn bản đó. Không tìm được → phần đó dùng `choice` mô tả tình huống và `feedback` chỉ nêu điều có nguồn.
- R-2. Phần 3 PHẢI có ít nhất một lựa chọn đồng ý đổ bê tông khi chưa nghiệm thu, dẫn tới `an_toan` giảm và `feedback` có nguồn.
- R-3. Mặt khó PHẢI có ít nhất 3 fact có nguồn; ít nhất một fact về làm việc ngoài trời/xa nhà và một fact về rủi ro an toàn lao động trong ngành xây dựng (số liệu tai nạn lao động chỉ dùng nguồn `official_stat`).

### 3.4 Bản đồ
- R-4. Bản đồ `cong-truong` PHẢI có: cổng có lối vào (spawn), khu giàn giáo, sàn đang thi công, lán ban chỉ huy có bàn và bảng tiến độ; bản đồ `nha` dùng lại bố cục nhà.
- R-5. Ô nền ngoài trời (đất, nền bê tông, rào tôn) PHẢI lấy từ bộ asset được chốt ở câu hỏi mở; nếu tự vẽ bằng code thì ghi vào `public/game/base/License.txt` như bộ ô nền hiện có.
- R-6. NPC: công nhân (phần 1, 2), chỉ huy trưởng nhà thầu (phần 3), chủ đầu tư (phần 5), 2–3 công nhân trang trí.

### 3.5 Lỗi
Như SPEC-009 3.5.

### 3.6 Conformance vectors
Không áp dụng.

## 4. Tiêu chí chấp nhận

| ID | Given | When | Then |
|---|---|---|---|
| AC-012-01 | `content/professions/ky-su-xay-dung.json` | `npm run validate` | Exit 0 |
| AC-012-02 | `content/worlds/ky-su-xay-dung.json` | `npm run validate:world` | Exit 0 |
| AC-012-03 | Gói `ky-su-xay-dung` | `npm run check:pack` | Có dòng `✓ ky-su-xay-dung` |
| AC-012-04 | Gói `ky-su-xay-dung` | Test chơi hết ngày | Kết thúc ở `done` |
| AC-012-05 | `ky-su-xay-dung.json` | Đọc `sources` | Có ≥ 2 nguồn `law` có `effective_date` |
| AC-012-06 | Segment phần 3 | Đọc `options` | Có ít nhất một option có `effect.an_toan < 0` |
| AC-012-07 | `public/game/` | Liệt kê | Mọi tileset của `ky-su-xay-dung.json` có `License.txt` cùng thư mục |
| AC-012-08 | Bản build | Đọc trang hồ sơ và trang màn chơi | Cả hai tồn tại; `<h1>` trang hồ sơ = `name` |

## 5. Ghi chú kiểm thử
Như SPEC-009 mục 5; test đặt trong `tests/spec-012/`.

## 6. Câu hỏi mở
Em đã chốt theo đề xuất ở các quy tắc dưới. Anh đồng ý thì đánh `[x]`, không đồng ý thì sửa quy tắc tương ứng ở mục 3.
- [ ] 3.1: vai kỹ sư giám sát thi công phía nhà thầu, công trình nhà nhiều tầng.
- [ ] R-5: ô nền ngoài trời lấy từ Kenney Roguelike/RPG pack (anh tải về `assets-src/`); nếu chưa có thì em tự vẽ bằng code như bộ ô nền hiện tại.
- [ ] R-1: mini-game an toàn chỉ dùng đáp án truy được về quy chuẩn còn hiệu lực.
- [ ] 3.3: kế hoạch 7 phần trong ngày như bảng.

## 7. Lịch sử thay đổi
| Version | Ngày | Thay đổi | Lý do (BUG/ADR nếu có) |
|---|---|---|---|
| 1 | 2026-11-03 | Bản nháp đầu | PRD 4.1, SPEC-008 |
