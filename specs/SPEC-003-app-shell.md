---
id: SPEC-003
title: Khung app — Next.js static export, nạp nội dung nghề, sinh type từ schema
version: 1
status: draft
features: [F1, F2, F3]
owns: [src/app/**, src/content/**, src/types/**, scripts/gen-types.mjs, next.config.mjs, tsconfig.json, postcss.config.mjs]
owner: anh Son
created: 2026-11-02
---

# SPEC-003 — Khung app

> Viết theo specs/STANDARD.md. Mục 2–4 là phần quy phạm.

## 1. Bối cảnh & lý do
Hạng mục APP trong ROADMAP đang chặn CAT, PRO và SIM. Hiện repo mới có engine (SPEC-002) và validator (SPEC-001), chưa có gì chạy được trên trình duyệt. Spec này dựng **bộ khung tối thiểu** để các spec giao diện sau chỉ cần thêm trang, không phải quyết định lại hạ tầng:
- Next.js App Router, xuất tĩnh (`out/`), theo PRD mục 7.
- Một lớp nạp nội dung duy nhất, chạy lúc build, để mọi trang đọc file nghề theo cùng một cách.
- Type TypeScript sinh từ JSON Schema (luật trong CLAUDE.md: không viết type tay cho nội dung).
- Bổ sung kiểm tra kiểu `tsc --noEmit` vào cổng `check` (hệ quả đã ghi trong ADR-001).

Hai trang trong spec này chỉ là **trang khung** để chứng minh routing và nạp nội dung chạy đúng. Giao diện thật của danh mục (CAT) và hồ sơ (PRO) thuộc spec riêng và sẽ thay nội dung hai trang này.

## 2. Phạm vi
- Trong phạm vi: cấu hình Next.js + TypeScript strict + Tailwind; module nạp nội dung `src/content/`; script sinh type và kiểm tra type có cũ không; trang `/` liệt kê nghề; trang `/nghe/<id>/` hiển thị tên nghề; ngân sách JS trang đầu; thêm `types:check` và `typecheck` vào `npm run check`.
- Ngoài phạm vi: thiết kế giao diện, lọc/tìm kiếm (CAT), nội dung hồ sơ và popover nguồn (PRO), nhãn "Bản nháp" (PRO), Phaser và màn chơi (SIM), deploy Vercel, localStorage, nút "Tôi là: THCS / THPT / Sinh viên".

## 3. Thiết kế

### 3.1 Thuật ngữ
- **Thư mục nội dung**: `content/professions/`, không đệ quy.
- **File nghề**: file trong thư mục nội dung có đuôi `.json` (phân biệt hoa thường: `.JSON` không tính).
- **Stem**: tên file bỏ đuôi `.json`.
- **Bản build**: kết quả `npm run build`, nằm ở `out/`.

### 3.2 Hợp đồng API

```ts
// src/content/index.ts — API public của lớp nạp nội dung. Chỉ chạy lúc build (Node), không chạy trên trình duyệt.
import type { Profession } from "../types/profession";

/** Đọc mọi file nghề trong `dir` (mặc định: <repo>/content/professions). */
export function loadProfessions(dir?: string): Profession[];

/** Trả về nghề có `id` khớp chính xác, hoặc `null` nếu không có. Dùng cùng thư mục mặc định. */
export function getProfession(id: string, dir?: string): Profession | null;

export class ContentError extends Error {
  code: "CONTENT_PARSE_ERROR" | "CONTENT_ID_MISMATCH";
  file: string;   // đường dẫn tương đối tới thư mục nội dung, ví dụ "giao-vien-thpt.json"
}
```

```ts
// src/types/profession.d.ts — SINH TỰ ĐỘNG từ schema/profession.schema.json, không sửa tay.
export interface Profession { /* … */ }
```

Lệnh npm mới:

| Lệnh | Làm gì | Exit code |
|---|---|---|
| `npm run types` | Sinh lại `src/types/profession.d.ts` từ schema | 0 |
| `npm run types:check` | Sinh type vào bộ nhớ, so với file hiện có | 0 nếu giống hệt từng byte, 1 nếu khác hoặc file chưa có |
| `npm run typecheck` | `tsc --noEmit` theo `tsconfig.json` | 0 nếu không lỗi kiểu |
| `npm run dev` | Server phát triển của Next.js | — |
| `npm run build` | Xuất tĩnh ra `out/` | 0 nếu build thành công |

### 3.3 Quy tắc hành vi

**Nạp nội dung**
- R-1. `loadProfessions` PHẢI đọc mọi file nghề trong thư mục (không đệ quy) và KHÔNG ĐƯỢC đọc file khác. Thư mục không có file nghề → trả `[]`.
- R-2. Kết quả PHẢI sắp xếp tăng dần theo `id`, so sánh theo code unit (`a < b` của JavaScript), không theo locale. *Lý do: thứ tự không phụ thuộc máy build hay hệ điều hành.*
- R-3. File không parse được JSON → PHẢI ném `CONTENT_PARSE_ERROR` với `file` là tên file đó.
- R-4. Stem PHẢI bằng đúng trường `id` trong file; khác → ném `CONTENT_ID_MISMATCH` với `file` là tên file đó. *Lý do: URL `/nghe/<id>/` và tên file luôn khớp nhau, và hai file không thể trùng `id`.*
- R-5. Lớp nạp KHÔNG ĐƯỢC kiểm tra schema hay luật trích nguồn. *Lý do: việc đó thuộc `validate.mjs` (SPEC-001), đã chạy trong `npm run check`; làm lại ở đây sẽ tạo hai nguồn chân lý.*
- R-6. Khi gặp lỗi R-3 hoặc R-4, `loadProfessions` PHẢI ném ngay ở file lỗi đầu tiên theo thứ tự tên file tăng dần, không trả kết quả một phần.
- R-7. `getProfession(id)` PHẢI trả về đúng object mà `loadProfessions()` trả cho `id` đó (so sánh sâu), hoặc `null` nếu không có `id` nào khớp chính xác (phân biệt hoa thường).

**Type sinh từ schema**
- R-8. `src/types/profession.d.ts` PHẢI được sinh bằng `json-schema-to-typescript` từ `schema/profession.schema.json`, với dòng đầu là chú thích "SINH TỰ ĐỘNG — không sửa tay". Tên type gốc PHẢI là `Profession`.
- R-9. `npm run types:check` PHẢI trả exit 1 khi file type không khớp từng byte với kết quả sinh lại. *Lý do: sửa schema mà quên sinh lại type thì CI bắt được.*
- R-10. `tsconfig.json` PHẢI bật `"strict": true`. `npm run typecheck` PHẢI kiểm tra cả `src/engine/**`, `src/content/**`, `src/app/**`.
- R-11. Script `check` trong `package.json` PHẢI chạy thêm `types:check` và `typecheck`, cả hai trước bước `npm test`.

**Trang và build**
- R-12. `next.config.mjs` PHẢI đặt `output: "export"` và `trailingSlash: true`. *Lý do: xuất tĩnh theo PRD; dấu `/` cuối để mỗi trang là một `index.html`, chạy được trên mọi host tĩnh.*
- R-13. Mọi trang PHẢI có `<html lang="vi">`.
- R-14. Trang `/` PHẢI có, cho mỗi nghề theo thứ tự R-2, đúng một thẻ `<a>` với `href="/nghe/<id>/"` và nội dung chữ là trường `name`.
- R-15. Trang `/nghe/<id>/` PHẢI được sinh cho đúng các `id` mà `loadProfessions()` trả về (không thừa, không thiếu) và PHẢI có đúng một `<h1>` với nội dung là `name` của nghề đó. `id` khác KHÔNG ĐƯỢC có trang (`dynamicParams = false`).
- R-16. Nội dung nghề PHẢI được đọc lúc build trong Server Component. Bản build KHÔNG ĐƯỢC tải file JSON nội dung lúc chạy trên trình duyệt. *Lý do: không có backend; trang tĩnh có sẵn nội dung, tốt cho máy yếu.*
- R-17. Tổng kích thước gzip (mức nén 9) của mọi file `.js` mà `out/index.html` tham chiếu qua thẻ `<script src>` PHẢI ≤ 307200 byte (300 KB). *Lý do: ngân sách trong PRD mục 7.*
- R-18. Phiên bản `next`, `react`, `react-dom`, `typescript`, `tailwindcss`, `json-schema-to-typescript` PHẢI được ghim chính xác trong `package.json` (không `^`, không `~`) và ghi vào ADR-002. *Lý do: hai agent cài cùng lúc phải ra cùng bản build.*

### 3.4 Bảng chuyển trạng thái
Không áp dụng: spec không có trạng thái.

### 3.5 Lỗi

| code | Khi nào | Trạng thái |
|---|---|---|
| `CONTENT_PARSE_ERROR` | R-3 | Không có trạng thái; build thất bại |
| `CONTENT_ID_MISMATCH` | R-4 | Không có trạng thái; build thất bại |

### 3.6 Conformance vectors
Không áp dụng: spec không có logic tính toán. Fixture thư mục nội dung nằm ở `tests/fixtures/content-*/`.

## 4. Tiêu chí chấp nhận

| ID | Given | When | Then |
|---|---|---|---|
| AC-003-01 | Thư mục nội dung thật | `loadProfessions()` | Mảng có độ dài bằng số file `.json` trong `content/professions/`, chứa phần tử `id = "giao-vien-thpt"`, các `id` tăng dần |
| AC-003-02 | Fixture có `b.json` (id "b") và `a.json` (id "a") | `loadProfessions(dir)` | `map(p => p.id)` = `["a","b"]` |
| AC-003-03 | Fixture có `x.json` với `id = "y"` | `loadProfessions(dir)` | Ném lỗi `code = "CONTENT_ID_MISMATCH"`, `file = "x.json"` |
| AC-003-04 | Fixture có `hong.json` không phải JSON hợp lệ | `loadProfessions(dir)` | Ném lỗi `code = "CONTENT_PARSE_ERROR"`, `file = "hong.json"` |
| AC-003-05 | Fixture chỉ có `README.md`, `a.JSON` và thư mục con `sub/` chứa `c.json` | `loadProfessions(dir)` | Trả `[]` |
| AC-003-06 | Thư mục nội dung thật | `getProfession("giao-vien-thpt")`; `getProfession("GIAO-VIEN-THPT")`; `getProfession("khong-co")` | Lần 1 bằng sâu với JSON trong file; lần 2 và 3 trả `null` |
| AC-003-07 | Type đã sinh khớp schema | `npm run types:check` | Exit 0 |
| AC-003-08 | Bản chép repo trong thư mục tạm, schema được thêm một thuộc tính tùy chọn mới | `types:check` trên bản chép | Exit 1 |
| AC-003-09 | Repo hiện tại | `npm run typecheck` | Exit 0; `tsconfig.json` có `compilerOptions.strict = true` |
| AC-003-10 | `package.json` | Đọc script `check` | Chứa `types:check` và `typecheck`, cả hai đứng trước `npm test` |
| AC-003-11 | Repo hiện tại | `npm run build` | Exit 0; `out/index.html` có `<html lang="vi"`; với mỗi nghề có đúng một `<a href="/nghe/<id>/">` mà chữ là `name`, theo thứ tự `id` |
| AC-003-12 | Bản build | Đọc `out/nghe/giao-vien-thpt/index.html` | Có `<html lang="vi"`, đúng một `<h1>`, nội dung `<h1>` = "Giáo viên Trung học phổ thông" |
| AC-003-13 | Bản build | Đếm `out/nghe/*/index.html` | Tập tên thư mục = tập `id` của `loadProfessions()` |
| AC-003-14 | Bản build | Tìm trong mọi file `out/**/*.js` | Không file nào chứa chuỗi `content/professions` |
| AC-003-15 | Bản build | Tổng gzip (mức 9) các `<script src>` trong `out/index.html` | ≤ 307200 byte |
| AC-003-16 | `package.json` | Đọc phiên bản 6 gói ở R-18 | Mỗi phiên bản khớp `^\d+\.\d+\.\d+$` |

## 5. Ghi chú kiểm thử
- `node:test` (ADR-001). Test lớp nạp gọi thẳng `src/content/index.ts` với fixture `tests/fixtures/content-*/`.
- AC-003-11..15 cần một lần `npm run build` (khoảng 30–90 giây). Các test này dùng chung một lần build, chạy trong một file test riêng.
- AC-003-08 chạy trên bản chép repo trong thư mục tạm, không sửa schema thật.
- Không mock: lớp nạp chỉ đọc file.

## 6. Câu hỏi mở
Em đã chốt theo đề xuất ở các quy tắc dưới. Anh đồng ý thì đánh `[x]`, không đồng ý thì sửa quy tắc tương ứng ở mục 3.
- [ ] R-12/R-14: đường dẫn trang nghề là `/nghe/<id>/` (tiếng Việt không dấu, có `/` cuối).
- [ ] R-4: tên file nghề bắt buộc trùng `id`; sai là build thất bại, không tự bỏ qua file đó.
- [ ] R-18: dùng bản ổn định mới nhất của Next.js, React, Tailwind tại thời điểm implement, ghim chính xác và ghi vào ADR-002.
- [ ] R-17: ngân sách 300 KB gzip chỉ đo cho trang `/` ở spec này; trang màn chơi (có Phaser) sẽ đặt ngân sách riêng trong spec SIM.

## 7. Lịch sử thay đổi
| Version | Ngày | Thay đổi | Lý do (BUG/ADR nếu có) |
|---|---|---|---|
| 1 | 2026-11-02 | Bản nháp đầu | Hạng mục APP trong ROADMAP |
