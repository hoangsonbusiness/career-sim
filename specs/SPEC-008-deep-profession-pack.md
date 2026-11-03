---
id: SPEC-008
title: Chuẩn đóng gói một nghề trải nghiệm sâu (nội dung + bản đồ game)
version: 1
status: draft
features: [F2, F3]
owns: [scripts/check-pack.mjs]
owner: anh Son
created: 2026-11-03
---

# SPEC-008 — Chuẩn đóng gói một nghề trải nghiệm sâu

> Viết theo specs/STANDARD.md. Mục 2–4 là phần quy phạm.

## 1. Bối cảnh & lý do
PRD mục 4.1 có 6 nghề trải nghiệm sâu. Giáo viên THPT đã chơi được trong game 2D (SPEC-006, SPEC-007). Năm nghề còn lại (Điều dưỡng, Lập trình viên, Kế toán, Kỹ sư xây dựng, Nhân viên Marketing) mỗi nghề có spec riêng (SPEC-009..013). Spec này gom **phần chung** để năm spec kia ngắn và không lệch nhau:

- Validator SPEC-001 đã kiểm schema, luật trích nguồn, `downsides`, `basis`. Nó **không** kiểm những gì game cần: độ dài chữ vừa khung thoại, độ đa dạng mini-game, có bản đồ hay không, có đủ chia sẻ người trong nghề cho phần "một ngày" (CLAUDE.md R8 bước 4) hay không.
- Test chơi hết ngày trong thế giới (AC-006-14) hiện chỉ chạy cho giáo viên. Mỗi nghề mới cần được kiểm như vậy mà không phải viết test mới.

Định nghĩa: một nghề là **gói sâu** khi có file `content/worlds/<id>.json`. Mọi quy tắc dưới đây áp dụng cho mọi gói sâu, kể cả giáo viên THPT.

## 2. Phạm vi
- Trong phạm vi: script `npm run check:pack` kiểm các quy tắc R-1..R-7 cho mọi gói sâu, chạy trong `npm run check`; test chơi hết ngày trong thế giới cho mọi gói sâu; quy trình research và vai trò người duyệt cho nội dung nghề mới.
- Ngoài phạm vi: nội dung cụ thể của từng nghề (SPEC-009..013); sửa engine, game, validator SPEC-001; asset mới (ghi ở spec từng nghề); hồ sơ bách khoa (PRD 4.2).

## 3. Thiết kế

### 3.1 Thuật ngữ
- **Gói sâu**: cặp `content/professions/<id>.json` + `content/worlds/<id>.json`.
- **Độ dài**: số code point (đếm bằng `Array.from(s).length`).

### 3.2 Hợp đồng

```
npm run check:pack          # node scripts/check-pack.mjs
  [--professions <dir>] [--worlds <dir>]
```
Với mỗi file trong thư mục worlds: kiểm R-1..R-7 cho nghề tương ứng. In `✓ <id>` hoặc `✗ <id>` kèm từng lỗi dạng `R-n: <mô tả>`. Exit 1 nếu có ít nhất một lỗi, ngược lại exit 0. Thư mục worlds rỗng → exit 0.

### 3.3 Quy tắc hành vi (kiểm bằng `check:pack`)
- R-1. Nghề PHẢI có `day_simulation` với đúng 7 segment. *Lý do: một ngày gồm sáng sớm/đầu giờ, 4–5 việc chính, cuối ngày; 7 phần khớp gói giáo viên đã chơi thử.*
- R-2. Các segment PHẢI dùng ít nhất 4 trong 6 loại `task.type`, và không loại nào xuất hiện quá 2 lần. *Lý do: tránh một ngày toàn chọn đáp án.*
- R-3. Giới hạn chữ cho khung game: `narrative` ≤ 140; `task.prompt` ≤ 80; mỗi `options[].text`, `turns[].replies[].text` ≤ 90; mỗi `steps[]`, `document[]` ≤ 70; mỗi `items[].text` ≤ 80 (tờ giấy trong khay rộng hơn thẻ); mỗi `activities[].label` ≤ 30; mỗi `feedback` ≤ 120. *Lý do: anh Son yêu cầu chữ tối thiểu; các giới hạn này vừa bong bóng 3 dòng và khung thoại 1–2 dòng (SPEC-007).*
- R-4. `stats` PHẢI có đúng 3 chỉ số; `label` ≤ 18 ký tự (vừa HUD).
- R-5. `sources` PHẢI có ít nhất 2 nguồn `testimony` khác `publisher`, và mỗi nguồn `testimony` PHẢI được ít nhất một `basis` của segment trỏ tới. *Lý do: CLAUDE.md R8 bước 4 — phần "một ngày" dựa trên chia sẻ thật của người trong nghề.*
- R-6. `meta.status` PHẢI là `"draft"` khi agent tạo hoặc sửa nội dung; chỉ con người đổi sang `"reviewed"` (CLAUDE.md R8 bước 7). `check:pack` KHÔNG ĐƯỢC báo lỗi với `"reviewed"`, nhưng PHẢI in cảnh báo nếu `meta.reviewed_by` trống khi `status = "reviewed"`.
- R-7. File thế giới PHẢI qua `validate:world` (SPEC-006 R-1..R-4); `check:pack` gọi lại cùng logic và báo lỗi với tiền tố `R-7`.

**Tích hợp**
- R-8. Script `check` trong `package.json` PHẢI chạy `check:pack` ngay sau `validate:world`.
- R-9. Test chơi hết ngày (cùng thuật toán AC-006-14: đi theo `findPath` tới chỗ đứng đầu tiên có đường, quay mặt, nộp đáp án hợp lệ đầu tiên) PHẢI chạy cho **mọi** gói sâu trong `content/worlds/`, không liệt kê tên nghề trong test.

**Quy trình nội dung (kiểm bằng người duyệt, không bằng máy)**
- R-10. Nội dung mỗi nghề PHẢI theo CLAUDE.md R1–R9. Mọi số liệu, quy định, mức lương PHẢI có nguồn; không tìm được nguồn thì bỏ, hoặc để `needs_verification` kèm `note` ghi rõ cần tìm gì. Agent KHÔNG ĐƯỢC điền theo trí nhớ, kể cả tên văn bản pháp luật nêu trong spec của từng nghề (đó là **gợi ý cần kiểm chứng**, không phải dữ kiện).
- R-11. Với nghề có văn bản pháp luật về chứng chỉ hành nghề, trình độ chuẩn hoặc chế độ làm việc: PHẢI tìm văn bản **còn hiệu lực mới nhất** và kiểm tra văn bản thay thế (CLAUDE.md R4); ghi `supersedes` nếu có.
- R-12. Trước khi người duyệt đổi `meta.status` sang `reviewed`, Codex PHẢI kiểm tra chéo nguồn (mở từng URL, đối chiếu dữ kiện) theo phân vai trong CLAUDE.md. Agent viết nội dung KHÔNG ĐƯỢC tự review nội dung của mình.

### 3.4 Bảng chuyển trạng thái
`meta.status`: `draft` → `reviewed` (chỉ con người, sau R-12). Không có chuyển ngược tự động; sửa nội dung một hồ sơ `reviewed` thì agent PHẢI đổi lại `draft` (R-6).

### 3.5 Lỗi
| Nơi | Khi nào | Hệ quả |
|---|---|---|
| `check:pack` | Vi phạm R-1..R-5, R-7 | In `✗ <id>` + lỗi, exit 1 |
| `check:pack` | `reviewed` thiếu `reviewed_by` | In cảnh báo, exit 0 |

### 3.6 Conformance vectors
Không có tính toán số. Fixture `tests/fixtures/pack-*/` (một gói hợp lệ dựng từ `mini-profession.json` mở rộng lên 7 segment, và các biến thể vi phạm từng quy tắc) đóng vai trò vector.

## 4. Tiêu chí chấp nhận

| ID | Given | When | Then |
|---|---|---|---|
| AC-008-01 | Gói fixture hợp lệ | `check:pack` | Exit 0, in `✓` |
| AC-008-02 | Gói có 6 segment | `check:pack` | Exit 1, có `R-1` |
| AC-008-03 | Gói chỉ dùng 3 loại task; gói có một loại xuất hiện 3 lần | `check:pack` | Mỗi ca exit 1, có `R-2` |
| AC-008-04 | Lần lượt: `narrative` 141 ký tự; `prompt` 81; một option 91; một step 71; một item 81; label activity 31; feedback 121 | `check:pack` | Mỗi ca exit 1, có `R-3` |
| AC-008-05 | Gói có 2 stats; gói có label stat 19 ký tự | `check:pack` | Mỗi ca exit 1, có `R-4` |
| AC-008-06 | Gói có 1 nguồn testimony; gói có 2 testimony cùng publisher; gói có testimony không được basis nào dùng | `check:pack` | Mỗi ca exit 1, có `R-5` |
| AC-008-07 | Gói `reviewed` không có `reviewed_by` | `check:pack` | Exit 0, có dòng cảnh báo |
| AC-008-08 | Gói có target bị tường bao kín | `check:pack` | Exit 1, có `R-7` |
| AC-008-09 | `package.json` | Đọc script `check` | Có `check:pack` ngay sau `validate:world` |
| AC-008-10 | Thư mục `content/worlds/` thật | Chạy test chơi hết ngày | Mọi gói sâu kết thúc ở `done`; test không chứa chuỗi id nghề nào |
| AC-008-11 | `content/` thật | `check:pack` | Exit 0 (gói giáo viên THPT đạt chuẩn) |

## 5. Ghi chú kiểm thử
- `node:test`; fixture dựng trong thư mục tạm như `tests/spec-006/world.test.mjs`.
- **AC-008-11 hiện chưa đạt và sẽ buộc sửa nội dung giáo viên THPT**: đối chiếu ngày 2026-11-03, `giao-vien-thpt.json` có 0 nguồn `testimony` (R-5 cần ≥ 2). Phải research ≥ 2 chia sẻ công khai của giáo viên THPT (có tên/đơn vị) và gắn vào `basis` các segment. Không được thêm nguồn testimony không có thật để qua kiểm tra. Sửa nội dung giáo viên = sửa nội dung, chạy `npm run check`, giữ `draft`.
- R-10..R-12 kiểm bằng người duyệt và Codex; không có test máy.

## 6. Câu hỏi mở
Em đã chốt theo đề xuất ở các quy tắc dưới. Anh đồng ý thì đánh `[x]`, không đồng ý thì sửa quy tắc tương ứng ở mục 3.
- [x] R-1: mỗi nghề đúng 7 phần trong ngày.
- [x] R-2: ít nhất 4 loại mini-game, mỗi loại tối đa 2 lần.
- [x] R-3: giới hạn chữ cho khung game (dẫn 140, câu lệnh 80, lựa chọn 90 ký tự…).
- [x] R-5: mỗi nghề cần ít nhất 2 chia sẻ người trong nghề từ 2 nơi đăng khác nhau.
- [x] R-12: Codex kiểm tra chéo nguồn trước khi anh duyệt nội dung.

## 7. Lịch sử thay đổi
| Version | Ngày | Thay đổi | Lý do (BUG/ADR nếu có) |
|---|---|---|---|
| 1 | 2026-11-03 | Bản nháp đầu | Mở rộng 5 nghề trải nghiệm sâu (PRD 4.1) |
