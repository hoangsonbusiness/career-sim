# ADR-001 — Test engine bằng `node:test`, chạy TypeScript bằng type stripping của Node

- Ngày: 2026-11-02
- Liên quan: SPEC-002

## Bối cảnh
SPEC-002 §5 ghi "Unit test (Vitest)". Nhưng repo hiện chưa có Next.js, chưa có bundler, và `npm test` chạy `node --test "tests/**/*.test.mjs"`; SPEC-001 cũng dùng `node:test`. Engine viết bằng TypeScript (`src/engine/index.ts`) theo quy tắc code của CLAUDE.md.

## Các phương án
1. **Thêm Vitest** cho `src/`, giữ `node:test` cho `scripts/`. Hai test runner, `npm test` phải gọi cả hai.
2. **Biên dịch bằng `tsc`** ra JS rồi test bằng `node:test`. Thêm bước build trước khi test.
3. **`node:test` + type stripping có sẵn trong Node ≥ 22.18**: Node import thẳng file `.ts`, chỉ xóa phần type.

## Lựa chọn
Phương án 3. Một test runner duy nhất, không thêm dependency, `run-vectors.mjs` import thẳng `src/engine/index.ts`.

## Hệ quả
- Engine chỉ được dùng cú pháp TS "xóa được" (không `enum`, không `namespace`, không parameter properties); import nội bộ ghi rõ đuôi `.ts`.
- Type stripping **không kiểm tra kiểu**. Khi có khung app (hạng mục APP), thêm `tsc --noEmit` (strict) vào `npm run check`.
- Cần Node ≥ 22.18. CI phải dùng image Node tương ứng.
- Nếu sau này khung app cần Vitest (ví dụ test component), viết ADR mới; test engine giữ nguyên vì không phụ thuộc runner ngoài `node:test`.
