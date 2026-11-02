---
id: SPEC-001
title: Kiểm tra tự động nội dung nghề (schema + luật trích nguồn)
version: 1
status: implemented
features: [F2, F5]
owns: [scripts/validate.mjs, schema/profession.schema.json]
owner: anh Son
created: 2026-11-02
approved_hash: 61add0adf38176c9
approved_by: Son
approved_at: 2026-11-02
---

# SPEC-001 — Kiểm tra tự động nội dung nghề

## 1. Bối cảnh & lý do
App hướng nghiệp chỉ có giá trị khi dữ kiện đúng. Agent AI có thể "bịa" số liệu một cách rất tự tin, nên mọi file nghề phải qua một cổng kiểm tra bằng máy trước khi được merge. Cổng này hiện thực hóa các luật R1–R7 trong `CLAUDE.md`.

## 2. Phạm vi
- Trong phạm vi: `content/professions/*.json`.
- Ngoài phạm vi: kiểm tra nội dung URL (Codex làm thủ công), chính tả.

## 3. Thiết kế
- R-1. CLI `node scripts/validate.mjs [file...]`. Không truyền tham số thì PHẢI quét toàn bộ `content/professions/*.json`.
- R-2. Mỗi file PHẢI in đúng một dòng `✓ <path>` hoặc `✗ <path>` kèm danh sách lỗi, mỗi lỗi một dòng bắt đầu bằng `   - `.
- R-3. Exit code PHẢI là `0` khi mọi file hợp lệ, `1` khi có ít nhất một lỗi.
- R-4. Cảnh báo (`⚠`, ví dụ nguồn mồ côi) KHÔNG ĐƯỢC làm exit code khác `0`.
- R-5. Các luật nội dung là R1–R7 trong `CLAUDE.md`; mỗi thông báo lỗi PHẢI chứa mã luật tương ứng trong ngoặc, ví dụ `(R1)`, khi lỗi đó thuộc một luật R.

## 4. Tiêu chí chấp nhận

| ID | Given | When | Then |
|---|---|---|---|
| AC-001-01 | File mẫu `giao-vien-thpt.json` | Chạy validate | Exit 0, in `✓` |
| AC-001-02 | File không phải JSON hợp lệ | Chạy validate | Exit 1, báo "JSON không hợp lệ" |
| AC-001-03 | File thiếu trường bắt buộc của schema | Chạy validate | Exit 1, báo lỗi `schema` |
| AC-001-04 | Một `fact` có `source_ids: []` và confidence ≠ `needs_verification` | Chạy validate | Exit 1, báo vi phạm R1 |
| AC-001-05 | Một item trỏ tới source id không tồn tại | Chạy validate | Exit 1, báo "không tồn tại" |
| AC-001-06 | Nguồn `type: law` thiếu `effective_date` | Chạy validate | Exit 1, báo R2 |
| AC-001-07 | Fact `verified` chỉ có 1 nguồn `press` | Chạy validate | Exit 1, báo R3 |
| AC-001-08 | Fact `needs_verification` không có `note` | Chạy validate | Exit 1 |
| AC-001-09 | Item `advice` chứa con số tiền/tiết/% hoặc tên văn bản luật | Chạy validate | Exit 1, báo R1 |
| AC-001-10 | `downsides` có ít hơn 3 fact | Chạy validate | Exit 1, báo R7 |
| AC-001-11 | Edge của `career_ladder` trỏ tới node không tồn tại | Chạy validate | Exit 1 |
| AC-001-12 | Effect trong mini-game dùng stat chưa khai báo | Chạy validate | Exit 1 |
| AC-001-13 | Một nguồn không được item nào dùng | Chạy validate | Exit 0, in cảnh báo "mồ côi" |
| AC-001-14 | Segment có `basis.kind = advice` | Chạy validate | Exit 1, báo R6 |

## 5. Ghi chú kiểm thử
Integration test: tạo bản sao file mẫu, làm hỏng đúng một chỗ theo từng AC, ghi ra thư mục tạm, chạy CLI, kiểm tra exit code + nội dung stderr. File: `tests/spec-001/validate.test.mjs`.

## 6. Câu hỏi mở
Không có.

## 7. Lịch sử thay đổi
| Version | Ngày | Thay đổi | Lý do |
|---|---|---|---|
| 1 | 2026-11-02 | Viết spec bù cho validator đã có; bổ sung test cho 14 AC | Áp dụng SDD/TDD cho repo |
| 1 | 2026-11-02 | Sửa: luật "số liệu chỉ dựa trên testimony" báo nhầm khi `source_ids` rỗng | Phát hiện khi test thủ công (nay được AC-001-04 bao phủ) |
