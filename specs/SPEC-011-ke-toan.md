---
id: SPEC-011
title: Gói nghề Kế toán (nội dung + bản đồ văn phòng doanh nghiệp)
version: 1
status: draft
features: [F2, F3, F4, F5]
owns: [content/professions/ke-toan.json, content/worlds/ke-toan.json]
owner: anh Son
created: 2026-11-03
---

# SPEC-011 — Gói nghề Kế toán

> Viết theo specs/STANDARD.md. Mục 2–4 là phần quy phạm. Mọi quy tắc chung theo SPEC-008.

## 1. Bối cảnh & lý do
Kế toán là nghề phổ biến, nhiều học sinh chọn vì "ổn định" mà không biết công việc gắn chặt với quy định pháp luật (chứng từ, hóa đơn, thuế) và với **đạo đức nghề nghiệp** (không làm sai lệch số liệu). Phần "một ngày" xoay quanh chứng từ, thanh toán, kê khai và một tình huống bị yêu cầu "chỉnh số".

**Gợi ý nguồn cần kiểm chứng** (KHÔNG phải dữ kiện, SPEC-008 R-10): Luật Kế toán hiện hành và các văn bản sửa đổi; quy định về hóa đơn, chứng từ; quy định về chứng chỉ kế toán viên và đăng ký hành nghề dịch vụ kế toán; chuẩn mực đạo đức nghề nghiệp kế toán, kiểm toán; báo cáo lương có năm; đề án tuyển sinh ngành Kế toán; chia sẻ của kế toán viên trên báo chí chính thống.

## 2. Phạm vi
- Trong phạm vi: `content/professions/ke-toan.json` đủ mọi mục schema; `content/worlds/ke-toan.json` (văn phòng + nhà); định nghĩa bản đồ trong `scripts/gen-world.mjs`.
- Ngoài phạm vi: nghiệp vụ hạch toán chi tiết (bút toán, tài khoản); kiểm toán độc lập; kế toán khu vực công.

## 3. Thiết kế

### 3.1 Bối cảnh nhân vật
Kế toán viên tại một doanh nghiệp nhỏ và vừa, giai đoạn cuối tháng. Nếu số liệu tìm được chỉ áp dụng cho một loại hình doanh nghiệp, `meta.scope_note` PHẢI ghi rõ.

### 3.2 Chỉ số
| id | label | Ý nghĩa |
|---|---|---|
| `nang_luong` | Năng lượng | Sức tập trung còn lại |
| `chinh_xac` | Độ chính xác | Sổ sách đúng, đủ chứng từ |
| `ap_luc` | Áp lực | Căng thẳng hạn nộp |

### 3.3 Kế hoạch 7 phần
| # | Giờ | Việc | `task.type` | Nơi | `basis` cần nguồn chứng minh |
|---|---|---|---|---|---|
| 1 | 08:00 | Kiểm tra một hóa đơn đầu vào | `spot_error` | Bàn kế toán | Kế toán kiểm tra tính hợp lệ của chứng từ, hóa đơn |
| 2 | 09:30 | Xếp các khoản chi: đủ chứng từ hay thiếu | `drag_sort` | Bàn kế toán | Chi phí phải có chứng từ hợp lệ |
| 3 | 10:30 | Các bước duyệt một khoản thanh toán | `sequence` | Phòng giám đốc | Quy trình thanh toán, phê duyệt trong doanh nghiệp |
| 4 | 13:30 | Cấp trên đề nghị "chỉnh số cho đẹp" | `choice` | Phòng giám đốc | Pháp luật kế toán nghiêm cấm làm sai lệch số liệu |
| 5 | 15:00 | Nhà cung cấp gọi hỏi tiền | `dialogue` | Bàn kế toán | Kế toán theo dõi công nợ, làm việc với nhà cung cấp |
| 6 | 16:30 | Hạn nộp tờ khai thuế sát nút | `choice` | Bàn kế toán | Kế toán lập và nộp tờ khai thuế theo hạn |
| 7 | 19:30 | Buổi tối mùa quyết toán | `time_budget` | Nhà | Mùa quyết toán khối lượng công việc tăng |

- R-1. `spot_error` (phần 1) PHẢI dựa trên các nội dung bắt buộc của hóa đơn theo văn bản pháp luật về hóa đơn còn hiệu lực; mỗi dòng lỗi PHẢI tương ứng một nội dung bắt buộc trong văn bản đó. Tên doanh nghiệp, mã số thuế trong tài liệu PHẢI là hư cấu và có dạng không trùng mã số thuế thật (ví dụ toàn số 0).
- R-2. Phần 4 PHẢI có ít nhất một lựa chọn làm theo yêu cầu sai và lựa chọn đó PHẢI dẫn tới `Độ chính xác` giảm và `feedback` nêu hệ quả pháp lý có nguồn. *Lý do: phản ánh mặt khó và trách nhiệm của nghề (CLAUDE.md R7).*
- R-3. Thời hạn nộp tờ khai thuế (nếu nêu) PHẢI lấy từ văn bản pháp luật về quản lý thuế còn hiệu lực, kèm `effective_date`.
- R-4. Mặt khó PHẢI có ít nhất 3 fact có nguồn; ít nhất một fact về áp lực mùa quyết toán và một fact về trách nhiệm pháp lý của người làm kế toán.

### 3.4 Bản đồ
- R-5. Bản đồ `cong-ty` PHẢI có: phòng kế toán (spawn) với tủ hồ sơ, phòng giám đốc, quầy lễ tân; bản đồ `nha` dùng lại bố cục nhà.
- R-6. NPC: giám đốc (phần 3, 4), kế toán trưởng hoặc đồng nghiệp (trang trí), nhà cung cấp gọi điện (phần 5, không có NPC trên bản đồ, bong bóng neo vào nhân vật chính như gói giáo viên).

### 3.5 Lỗi
Như SPEC-009 3.5.

### 3.6 Conformance vectors
Không áp dụng.

## 4. Tiêu chí chấp nhận

| ID | Given | When | Then |
|---|---|---|---|
| AC-011-01 | `content/professions/ke-toan.json` | `npm run validate` | Exit 0 |
| AC-011-02 | `content/worlds/ke-toan.json` | `npm run validate:world` | Exit 0 |
| AC-011-03 | Gói `ke-toan` | `npm run check:pack` | Có dòng `✓ ke-toan` |
| AC-011-04 | Gói `ke-toan` | Test chơi hết ngày | Kết thúc ở `done` |
| AC-011-05 | `ke-toan.json` | Đọc `sources` | Có ≥ 2 nguồn `law` có `effective_date` |
| AC-011-06 | Segment phần 4 | Đọc `options` | Có ít nhất một option có `effect.chinh_xac < 0` |
| AC-011-07 | Segment `spot_error` | Tìm chuỗi 10 hoặc 13 chữ số liền nhau trong `document[]` | Mọi chuỗi như vậy chỉ gồm chữ số 0 |
| AC-011-08 | Bản build | Đọc trang hồ sơ và trang màn chơi | Cả hai tồn tại; `<h1>` trang hồ sơ = `name` |

## 5. Ghi chú kiểm thử
Như SPEC-009 mục 5; test đặt trong `tests/spec-011/`.

## 6. Câu hỏi mở
Em đã chốt theo đề xuất ở các quy tắc dưới. Anh đồng ý thì đánh `[x]`, không đồng ý thì sửa quy tắc tương ứng ở mục 3.
- [ ] 3.1: bối cảnh doanh nghiệp nhỏ và vừa, cuối tháng.
- [ ] R-2: có tình huống bị yêu cầu "chỉnh số" để phản ánh đạo đức nghề nghiệp.
- [ ] R-1: mã số thuế trong game là số hư cấu toàn chữ số 0.
- [ ] 3.3: kế hoạch 7 phần trong ngày như bảng.

## 7. Lịch sử thay đổi
| Version | Ngày | Thay đổi | Lý do (BUG/ADR nếu có) |
|---|---|---|---|
| 1 | 2026-11-03 | Bản nháp đầu | PRD 4.1, SPEC-008 |
