# Ma trận truy vết

> Tự sinh bởi `npm run trace` — không sửa tay.

| Spec | Ver | Trạng thái | Duyệt | Features | AC có test |
|---|---|---|---|---|---|
| [SPEC-001](SPEC-001-content-validation.md) Kiểm tra tự động nội dung nghề (schema + luật trích nguồn) | 1 | implemented | ✓ bootstrap-claude (chờ anh Son xác nhận) 2026-11-02 | [F2, F5] | 14/14 |
| [SPEC-002](SPEC-002-day-simulation-engine.md) Engine mô phỏng "một ngày làm việc" (lõi logic, không gồm render) | 2 | draft | — | [F3, F7] | 0/17 |

## SPEC-001 — Kiểm tra tự động nội dung nghề (schema + luật trích nguồn)

| AC | Test |
|---|---|
| AC-001-01 | tests/spec-001/validate.test.mjs — "AC-001-01 file mẫu hợp lệ → exit 0" |
| AC-001-02 | tests/spec-001/validate.test.mjs — "AC-001-02 JSON hỏng → exit 1" |
| AC-001-03 | tests/spec-001/validate.test.mjs — "AC-001-03 thiếu trường bắt buộc → lỗi schema" |
| AC-001-04 | tests/spec-001/validate.test.mjs — "AC-001-04 fact không nguồn mà không needs_verification → R1" |
| AC-001-05 | tests/spec-001/validate.test.mjs — "AC-001-05 source_id không tồn tại" |
| AC-001-06 | tests/spec-001/validate.test.mjs — "AC-001-06 nguồn law thiếu effective_date → R2" |
| AC-001-07 | tests/spec-001/validate.test.mjs — "AC-001-07 verified chỉ với 1 nguồn press → R3" |
| AC-001-08 | tests/spec-001/validate.test.mjs — "AC-001-08 needs_verification thiếu note" |
| AC-001-09 | tests/spec-001/validate.test.mjs — "AC-001-09 advice chứa con số → R1" |
| AC-001-10 | tests/spec-001/validate.test.mjs — "AC-001-10 downsides < 3 fact → R7" |
| AC-001-11 | tests/spec-001/validate.test.mjs — "AC-001-11 ladder edge trỏ node không tồn tại" |
| AC-001-12 | tests/spec-001/validate.test.mjs — "AC-001-12 effect dùng stat chưa khai báo" |
| AC-001-13 | tests/spec-001/validate.test.mjs — "AC-001-13 nguồn mồ côi → chỉ cảnh báo, exit 0" |
| AC-001-14 | tests/spec-001/validate.test.mjs — "AC-001-14 segment basis là advice → R6" |

## SPEC-002 — Engine mô phỏng "một ngày làm việc" (lõi logic, không gồm render)

| AC | Test |
|---|---|
| AC-002-01 | ❌ chưa có |
| AC-002-02 | ❌ chưa có |
| AC-002-03 | ❌ chưa có |
| AC-002-04 | ❌ chưa có |
| AC-002-05 | ❌ chưa có |
| AC-002-06 | ❌ chưa có |
| AC-002-07 | ❌ chưa có |
| AC-002-08 | ❌ chưa có |
| AC-002-09 | ❌ chưa có |
| AC-002-10 | ❌ chưa có |
| AC-002-11 | ❌ chưa có |
| AC-002-12 | ❌ chưa có |
| AC-002-13 | ❌ chưa có |
| AC-002-14 | ❌ chưa có |
| AC-002-15 | ❌ chưa có |
| AC-002-16 | ❌ chưa có |
| AC-002-17 | ❌ chưa có |
