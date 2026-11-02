---
id: SPEC-004
title: Trang hồ sơ nghề và trích dẫn nguồn
version: 1
status: implemented
features: [F2, F5]
owns: [src/profile/**, src/app/nghe/[id]/page.tsx]
owner: anh Son
created: 2026-11-02
approved_hash: 0405d8719bbbff1f
approved_by: Son
approved_at: 2026-11-02
---

# SPEC-004 — Trang hồ sơ nghề

> Viết theo specs/STANDARD.md. Mục 2–4 là phần quy phạm.

## 1. Bối cảnh & lý do
Trang `/nghe/<id>/` hiện chỉ có tên nghề (trang khung của SPEC-003). Đây là trang học sinh đọc nhiều nhất, và là nơi thể hiện tiêu chí chất lượng số 1 của PRD: **mọi dữ kiện đều truy được nguồn**. Spec này hiển thị toàn bộ hồ sơ nghề, kèm trích dẫn bấm được ở từng dữ kiện, cảnh báo cho dữ kiện chưa kiểm chứng, và nhãn "Bản nháp".

Logic chuyển dữ liệu nghề thành nội dung hiển thị nằm trong một hàm thuần `buildProfileView` (test được không cần trình duyệt). Component React chỉ vẽ lại kết quả của hàm này.

Spec này thay nội dung trang khung `src/app/nghe/[id]/page.tsx` của SPEC-003. SPEC-003 R-15 (đúng một `<h1>` là tên nghề) vẫn PHẢI giữ.

## 2. Phạm vi
- Trong phạm vi: hàm `buildProfileView`; trang `/nghe/<id>/` hiển thị tóm tắt, yêu cầu theo 4 chặng, điều kiện làm việc, mặt khó, triển vọng, lộ trình thăng tiến dạng danh sách, danh sách nguồn; trích dẫn mở được ở từng dữ kiện (F5); cảnh báo `needs_verification`; nhãn bản nháp; link sang màn chơi khi nghề có `day_simulation`.
- Ngoài phạm vi: nút "Tôi là: THCS / THPT / Sinh viên" (trường `audience` bị bỏ qua); lộ trình dạng đồ thị (LAD); trang danh mục (CAT); màn chơi (SPEC-005); trang "Về dữ liệu" (ABT); thiết kế hình ảnh chi tiết.

## 3. Thiết kế

### 3.1 Thuật ngữ
- **Item**: phần tử `{ kind, text, source_ids?, confidence?, note? }` trong file nghề.
- **Trích dẫn**: một nguồn mà item trỏ tới qua `source_ids`.

### 3.2 Hợp đồng API

```ts
// src/profile/view.ts
import type { Profession } from "../types/profession";

export type Confidence = "verified" | "single_source" | "needs_verification";

export interface CitationView {
  id: string;             // Source.id
  title: string;
  publisher: string;
  url: string;
  typeLabel: string;      // theo bảng R-6
  effectiveDate: string | null;   // Source.effective_date, null nếu không có
}

export interface ItemView {
  kind: "fact" | "advice";
  text: string;
  confidence: Confidence | null;  // null khi file không khai báo
  confidenceLabel: string | null; // theo bảng R-5, null khi confidence = null
  warning: boolean;               // R-7
  note: string | null;
  citations: CitationView[];      // R-4
}

export interface GroupView { key: string; heading: string | null; items: ItemView[] }
export interface SectionView { key: string; heading: string; groups: GroupView[] }
export interface LadderStepView { id: string; title: string; description: string | null; items: ItemView[] }

export interface ProfileView {
  id: string;
  name: string;
  aliases: string[];              // [] khi không có
  groupLabel: string;
  summary: string;
  isDraft: boolean;               // meta.status === "draft"
  scopeNote: string | null;
  sections: SectionView[];        // R-2
  ladder: LadderStepView[];       // R-3
  sources: CitationView[];        // mọi Source theo thứ tự trong sources[]
  simulationHref: string | null;  // R-9
}

export function buildProfileView(p: Profession): ProfileView;

export class ProfileError extends Error {
  code: "UNKNOWN_SOURCE";
  sourceId: string;
}
```

### 3.3 Quy tắc hành vi

**Dựng nội dung (`buildProfileView`)**
- R-1. `buildProfileView` PHẢI là hàm thuần: không đọc file, không dùng đồng hồ, không đổi đối số.
- R-2. `sections` PHẢI theo đúng thứ tự và tiêu đề sau. Nhóm có `items` rỗng hoặc trường không tồn tại PHẢI bị bỏ; mục không còn nhóm nào PHẢI bị bỏ. Item trong nhóm giữ nguyên thứ tự trong file.

  | key mục | heading mục | key nhóm → heading nhóm (theo thứ tự) |
  |---|---|---|
  | `requirements` | Cần học gì để làm nghề này | `thcs` → "Ở cấp THCS", `thpt` → "Ở cấp THPT", `higher_ed` → "Đại học / Cao đẳng", `on_the_job` → "Khi đi làm" |
  | `working_conditions` | Điều kiện làm việc | `schedule` → "Thời gian làm việc", `income` → "Thu nhập", `environment` → "Môi trường làm việc" |
  | `downsides` | Mặt khó của nghề | `downsides` → `null` |
  | `future_outlook` | Triển vọng | `future_outlook` → `null` |

  *Lý do: học sinh đọc từ "học gì" → "làm thế nào" → "khó gì" → "tương lai"; thứ tự cố định để mọi nghề trông giống nhau.*
- R-3. `ladder` PHẢI gồm mọi `career_ladder.nodes` theo thứ tự trong file; `items` dựng từ `requirements` của node. `edges` bị bỏ qua (đồ thị thuộc LAD).
- R-4. `citations` của một item PHẢI là các nguồn ứng với `source_ids` theo đúng thứ tự trong `source_ids`, giữ cả phần tử trùng. Item không có `source_ids` → `[]`. Một `source_id` không có trong `sources[]` → PHẢI ném `UNKNOWN_SOURCE` với `sourceId` là id đó. *Lý do: trang không bao giờ hiện trích dẫn rỗng; validator (SPEC-001) đã chặn việc này, vì vậy lỗi ở đây nghĩa là nội dung chưa qua validate.*
- R-5. `confidenceLabel`: `verified` → "Đã kiểm chứng", `single_source` → "Một nguồn", `needs_verification` → "Cần kiểm chứng".
- R-6. `typeLabel`: `law` → "Văn bản pháp luật", `official_stat` → "Số liệu chính thức", `market` → "Báo cáo thị trường", `press` → "Báo chí", `testimony` → "Chia sẻ người trong nghề", `reference` → "Tài liệu tham khảo".
- R-7. `warning = true` khi và chỉ khi `confidence = "needs_verification"`.
- R-8. `aliases` = `p.aliases` hoặc `[]`; `scopeNote` = `p.meta.scope_note` hoặc `null`; `description` của bậc lộ trình = giá trị trong file hoặc `null`.
- R-9. `simulationHref = "/nghe/<id>/mot-ngay/"` khi `day_simulation` tồn tại, ngược lại `null`.

**Hiển thị (trang `/nghe/<id>/`)**
- R-10. Trang PHẢI có đúng một `<h1>` với nội dung `name` (giữ SPEC-003 R-15). Mỗi mục là một `<h2>` với `heading`; mỗi nhóm có heading là một `<h3>`.
- R-11. Khi `isDraft`, trang PHẢI hiển thị khối có `data-testid="draft-banner"` với nội dung "Bản nháp — đang kiểm chứng" phía trên `<h1>`. Khi không phải bản nháp, khối này KHÔNG ĐƯỢC xuất hiện.
- R-12. Mỗi item là một `<li data-kind="<kind>">`. Mỗi trích dẫn là một `<details data-source="<id>">` đặt cuối item, `<summary>` có nội dung là `id` nguồn; phần mở ra PHẢI có `title`, `publisher`, `typeLabel`, ngày hiệu lực khi có, và đúng một `<a href="<url>" target="_blank" rel="noopener noreferrer">`. *Lý do: `<details>` mở được mà không cần JavaScript, dùng được bằng bàn phím và trình đọc màn hình.*
- R-13. Item có `confidenceLabel` PHẢI hiển thị nhãn đó. Item có `warning` PHẢI có phần tử `data-testid="warning"` chứa "Cần kiểm chứng" và `note` (nếu có).
- R-14. Mục "Lộ trình thăng tiến" (`<h2>`) đứng sau các mục của R-2; mỗi bậc là một `<h3>` với `title`. Mục "Nguồn tham khảo" (`<h2>`) đứng cuối trang, liệt kê mọi nguồn theo thứ tự `sources[]`, mỗi nguồn có `<a>` như R-12.
- R-15. Khi `simulationHref` khác `null`, trang PHẢI có đúng một `<a data-testid="play-link" href="<simulationHref>">` với nội dung "Chơi thử một ngày làm nghề". Khi `null`, KHÔNG ĐƯỢC có phần tử này.
- R-16. Trang PHẢI tiếp tục là trang tĩnh sinh lúc build và KHÔNG ĐƯỢC thêm JavaScript chạy trên trình duyệt ngoài phần Next.js đã có. *Lý do: trang chữ, cần nhẹ cho máy yếu.*

### 3.4 Bảng chuyển trạng thái
Không áp dụng.

### 3.5 Lỗi

| code | Khi nào | Trạng thái |
|---|---|---|
| `UNKNOWN_SOURCE` | R-4 | Hàm thuần, không có trạng thái; build thất bại |

### 3.6 Conformance vectors
Không có tính toán số. Fixture `tests/fixtures/profile-mini.json` (đủ mọi nhánh của R-2..R-9) đóng vai trò vector: AC-004-01..08 kiểm tra trên fixture này.

## 4. Tiêu chí chấp nhận

| ID | Given | When | Then |
|---|---|---|---|
| AC-004-01 | Fixture profile-mini có đủ 4 mục, `environment` rỗng, không có `future_outlook` | `buildProfileView` | `sections.map(s => s.key)` = `["requirements","working_conditions","downsides"]`; nhóm của `working_conditions` = `["schedule","income"]` |
| AC-004-02 | Fixture profile-mini | `buildProfileView` | Heading mục và nhóm đúng bảng R-2; nhóm `downsides` có `heading = null` |
| AC-004-03 | Item có `source_ids = ["S2","S1","S2"]` | `buildProfileView` | `citations.map(c => c.id)` = `["S2","S1","S2"]` |
| AC-004-04 | Item có `source_ids = ["S9"]`, không có S9 trong `sources` | `buildProfileView` | Ném lỗi `code = "UNKNOWN_SOURCE"`, `sourceId = "S9"` |
| AC-004-05 | Ba item với confidence `verified`, `single_source`, `needs_verification` và một item advice không có confidence | `buildProfileView` | `confidenceLabel` lần lượt "Đã kiểm chứng", "Một nguồn", "Cần kiểm chứng", `null`; `warning` lần lượt `false`, `false`, `true`, `false` |
| AC-004-06 | Fixture có đủ 6 loại nguồn, nguồn law có `effective_date` | `buildProfileView` | `typeLabel` đúng bảng R-6; `effectiveDate` của nguồn law = giá trị trong file, của nguồn khác không có = `null` |
| AC-004-07 | Fixture có và không có `day_simulation`, `aliases`, `scope_note` | `buildProfileView` | `simulationHref` = `"/nghe/mini/mot-ngay/"` / `null`; `aliases` = giá trị / `[]`; `scopeNote` = giá trị / `null` |
| AC-004-08 | Fixture profile-mini | Gọi `buildProfileView` rồi so sánh đối số trước/sau | Đối số không đổi (so sánh sâu); `ladder.map(s => s.id)` theo đúng thứ tự `nodes` |
| AC-004-09 | Bản build | Đọc `out/nghe/giao-vien-thpt/index.html` | Có `data-testid="draft-banner"` chứa "Bản nháp — đang kiểm chứng"; đúng một `<h1>`; các `<h2>` theo thứ tự: các mục của view, "Lộ trình thăng tiến", "Nguồn tham khảo" |
| AC-004-10 | Bản build, trang giáo viên THPT | Đếm `<details data-source=…>` | Bằng tổng số `citations` của mọi item (mục + lộ trình) trong view; mỗi `<details>` có đúng một `<a … target="_blank" rel="noopener noreferrer">` với `href` = url nguồn |
| AC-004-11 | Bản build, trang giáo viên THPT | Đếm `data-testid="warning"` | Bằng số item có `warning = true` trong view |
| AC-004-12 | Bản build, trang giáo viên THPT | Tìm `data-testid="play-link"` | Đúng một, `href="/nghe/giao-vien-thpt/mot-ngay/"`, nội dung "Chơi thử một ngày làm nghề" |
| AC-004-13 | Bản build, trang giáo viên THPT | Đếm `<script src>` | Bằng số `<script src>` của `out/index.html` (không thêm JS riêng cho trang hồ sơ) |

## 5. Ghi chú kiểm thử
- `node:test`. AC-004-01..08 gọi thẳng `src/profile/view.ts` với `tests/fixtures/profile-mini.json` (và biến thể dựng trong test).
- AC-004-09..13 kiểm tra HTML của bản build (cần `npm run build`).
- Link `play-link` trỏ tới trang của SPEC-005; trước khi SPEC-005 xong, link này dẫn tới trang 404. Chấp nhận được vì spec làm tuần tự.
- Sau khi implement: kiểm tra bằng mắt trên trình duyệt (preview), vì giao diện không có test hình ảnh.

## 6. Câu hỏi mở
Em đã chốt theo đề xuất ở các quy tắc dưới. Anh đồng ý thì đánh `[x]`, không đồng ý thì sửa quy tắc tương ứng ở mục 3.
- [x] R-2: thứ tự mục "Cần học gì → Điều kiện làm việc → Mặt khó → Triển vọng", rồi tới lộ trình và nguồn.
- [x] R-3: lộ trình thăng tiến hiển thị tạm dạng danh sách ở spec này; đồ thị để LAD làm sau.
- [x] R-12: trích dẫn dùng `<details>` (bấm mở tại chỗ, không cần JavaScript) thay cho popover nổi.
- [x] Ngoài phạm vi: chưa làm nút "Tôi là: THCS / THPT / Sinh viên"; trang hiện mọi nội dung cho mọi người.

## 7. Lịch sử thay đổi
| Version | Ngày | Thay đổi | Lý do (BUG/ADR nếu có) |
|---|---|---|---|
| 1 | 2026-11-02 | Bản nháp đầu | Hạng mục PRO trong ROADMAP |
