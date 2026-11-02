# ADR-002 — Phiên bản bộ khung app

- Ngày: 2026-11-02
- Liên quan: SPEC-003 (R-18)

## Bối cảnh
SPEC-003 yêu cầu ghim chính xác phiên bản các gói lõi để hai lần cài cho cùng bản build. Anh Son đã chốt: dùng bản ổn định mới nhất tại thời điểm implement.

## Lựa chọn (bản mới nhất trên npm ngày 2026-11-02)

| Gói | Phiên bản | Ghi chú |
|---|---|---|
| next | 16.4.4 | App Router, `output: "export"` |
| react, react-dom | 19.3.1 | Next 16 nhận `^19.0.0` |
| typescript | 7.0.2 | Bản trình biên dịch native; chỉ dùng cho `tsc --noEmit` |
| tailwindcss, @tailwindcss/postcss | 4.3.3 | Tailwind 4 cấu hình qua CSS, không cần `tailwind.config` |
| json-schema-to-typescript | 16.0.0 | Sinh `src/types/profession.d.ts` |
| @types/node | 22.20.5 | Khớp Node 22 đang dùng (ADR-001), không theo bản mới nhất 26.x |
| @types/react, @types/react-dom | 19.3.0 | Khớp React 19 |

## Phương án đã cân nhắc
- **TypeScript 5.x** thay vì 7.x: ít rủi ro tương thích hơn với công cụ cũ. Không chọn vì anh đã chốt dùng bản mới nhất; tương thích được kiểm chứng bằng `npm run typecheck` và `npm run build` (AC-003-09, AC-003-11). Nếu gặp lỗi tương thích, hạ xuống 5.x bằng một ADR mới.

## Hệ quả
- Nâng phiên bản bất kỳ gói nào ở trên = sửa ADR này (hoặc ADR mới) + chạy lại `npm run check` và `npm run build`.
- `ajv`, `ajv-formats` (SPEC-001) chưa được ghim; ngoài phạm vi SPEC-003.
