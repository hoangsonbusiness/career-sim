---
id: SPEC-NNN
title: <Tên ngắn>
version: 1
status: draft   # draft | approved | implemented | deprecated — chỉ đổi sang approved bằng `npm run approve`
features: [F?]  # trỏ về PRD.md mục 5
owns: [src/<module>/**]  # file thuộc spec này (scripts/scope.mjs dùng để cảnh báo sửa lan)
owner: <người duyệt>
created: YYYY-MM-DD
---

# SPEC-NNN — <Tên>

> Viết theo specs/STANDARD.md. Mục 2–4 là phần QUY PHẠM (được hash khi duyệt). Sửa mục 2–4 sau khi duyệt → phải duyệt lại.

## 1. Bối cảnh & lý do
Vấn đề, ai bị ảnh hưởng, vì sao làm bây giờ.

## 2. Phạm vi
- Trong phạm vi: …
- Ngoài phạm vi: …

## 3. Thiết kế

### 3.1 Thuật ngữ
### 3.2 Hợp đồng API (kiểu dữ liệu chính xác, ST-07)
### 3.3 Quy tắc hành vi (đánh số R-1, R-2…; mỗi quy tắc có PHẢI / KHÔNG ĐƯỢC + lý do, ST-03/ST-14)
### 3.4 Bảng chuyển trạng thái (nếu có trạng thái, ST-11)
### 3.5 Lỗi (mã, điều kiện, trạng thái có bị đổi không, ST-08)
### 3.6 Conformance vectors (nếu có tính toán, ST-12)

## 4. Tiêu chí chấp nhận

| ID | Given | When | Then |
|---|---|---|---|
| AC-NNN-01 | … | … | … |

## 5. Ghi chú kiểm thử
Loại test, fixture, phần được mock.

## 6. Câu hỏi mở
(Không còn `- [ ]` thì mới duyệt được.)

## 7. Lịch sử thay đổi
| Version | Ngày | Thay đổi | Lý do (BUG/ADR nếu có) |
|---|---|---|---|
