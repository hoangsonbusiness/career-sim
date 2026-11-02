# PRD — "Một Ngày Làm Nghề" (Career Day Simulator) — bản Demo

> Trạng thái: Draft v0.1 · Ngày: 2026-11-02 · Chủ sản phẩm: anh Son
> Nguồn lực: Claude Code + Codex · Mục tiêu demo: 7–10 ngày

## 1. Vấn đề

Học sinh THCS/THPT và sinh viên chọn ngành dựa trên tên ngành, điểm chuẩn và lời người lớn. Các em gần như không biết **một ngày làm việc bình thường** của nghề đó diễn ra thế nào, nghề đòi hỏi trình độ gì, lộ trình thăng tiến ra sao, và mặt vất vả của nghề là gì.

## 2. Mục tiêu sản phẩm

1. Người dùng **trải nghiệm** một ngày làm việc của nghề qua mô phỏng 2D tương tác, không chỉ đọc mô tả.
2. Mỗi nghề có **yêu cầu trình độ theo 3 chặng**: THCS → THPT → Đại học/Cao đẳng → đi làm.
3. Mỗi nghề có **lộ trình thăng tiến** (thăng tiến dọc và rẽ ngang).
4. **Mọi dữ kiện đều truy được nguồn.** Không có dữ kiện không nguồn. Đây là tiêu chí chất lượng số 1.
5. Gợi ý nghề phù hợp dựa trên trắc nghiệm Holland (RIASEC) kết hợp hành vi khi chơi.

### Không nằm trong phạm vi demo
Mobile app, tài khoản/đăng nhập, backend/DB, 3D, AI NPC, dashboard cho trường học, đa ngôn ngữ.

## 3. Người dùng

| Persona | Nhu cầu chính | Hệ quả thiết kế |
|---|---|---|
| Học sinh THCS (12–15 tuổi) | Biết nghề là gì, có hợp với mình không, nên chọn THPT hay học nghề | Ngôn ngữ đơn giản, mini-game ngắn (≤ 2 phút) |
| Học sinh THPT (15–18) | Chọn tổ hợp môn, ngành, trường | Hiển thị rõ tổ hợp, ngành đào tạo, điều kiện |
| Sinh viên | Hiểu thực tế công việc, chứng chỉ, lương, thăng tiến | Chi tiết về chứng chỉ, lương, các nấc thăng tiến |

Nội dung phân tầng bằng nút **"Tôi là: THCS / THPT / Sinh viên"**: cùng một nghề nhưng nhấn vào phần thông tin khác nhau.

## 4. Phạm vi demo

### 4.1 Trải nghiệm sâu (6 nghề)
Giáo viên THPT (mẫu chuẩn), Điều dưỡng, Lập trình viên, Kế toán, Kỹ sư xây dựng, Nhân viên Marketing.

### 4.2 Bách khoa nghề (20–30 hồ sơ)
Dùng chung schema, nhưng có thể bỏ trống `day_simulation`. Giao diện hiển thị dạng thẻ + timeline tĩnh.

## 5. Tính năng

| # | Tính năng | Mô tả | Ưu tiên |
|---|---|---|---|
| F1 | Danh mục nghề | Lưới thẻ nghề, lọc theo nhóm ngành và nhóm Holland, tìm kiếm | P0 |
| F2 | Trang hồ sơ nghề | Tóm tắt, yêu cầu 3 chặng, điều kiện làm việc, thu nhập, mặt khó, nguồn trích dẫn | P0 |
| F3 | Mô phỏng một ngày | Các phân đoạn theo giờ; mỗi phân đoạn là một mini-game hoặc quyết định; có thanh chỉ số | P0 |
| F4 | Lộ trình thăng tiến | Cây/đồ thị các nấc, bấm vào từng nấc để xem điều kiện (có nguồn) | P0 |
| F5 | Hiển thị nguồn | Mỗi dữ kiện có icon nguồn → popover: tên văn bản, đơn vị ban hành, link, độ tin cậy | P0 |
| F6 | Trắc nghiệm Holland + gợi ý | Khoảng 30 câu, kết hợp tín hiệu khi chơi (thời gian, số lần chơi lại, mức hài lòng) | P1 |
| F7 | Tổng kết sau mô phỏng | "Bạn thích phần nào / ghét phần nào" → lưu vào localStorage → dùng cho F6 | P1 |
| F8 | Trang "Về dữ liệu" | Công khai phương pháp research, ngày cập nhật, cách báo lỗi | P1 |

## 6. Engine mô phỏng

**Nguyên tắc: engine dùng chung, nghề là dữ liệu.** Thêm một nghề = thêm một file JSON, không phải viết code mới.

Vòng lặp: `Ngày → Phân đoạn (segment) → Task (mini-game | quyết định) → Kết quả → cập nhật chỉ số → phân đoạn tiếp`.

Các loại mini-game (`task.type`) dùng chung:

| type | Cơ chế | Ví dụ |
|---|---|---|
| `sequence` | Sắp xếp các bước theo đúng thứ tự | Các bước soạn kế hoạch bài dạy |
| `choice` | Tình huống → chọn cách xử lý; mỗi lựa chọn có hệ quả | Học sinh mất trật tự trong giờ |
| `drag_sort` | Kéo thả item vào nhóm | Phân loại việc trong giờ / ngoài giờ |
| `spot_error` | Tìm lỗi trong tài liệu | Chấm bài, phát hiện lỗi sai |
| `dialogue` | Hội thoại nhiều lượt với NPC | Trao đổi với phụ huynh |
| `time_budget` | Phân bổ thời gian có giới hạn cho nhiều việc | Buổi tối: chấm bài, soạn bài, nghỉ ngơi |

Chỉ số hiển thị khai báo theo nghề (`stats`), ví dụ với giáo viên: Năng lượng, Mức độ hiểu bài của học sinh, Áp lực công việc.

**Quy tắc nội dung:** kịch bản mô phỏng là hư cấu minh họa, nhưng mỗi phân đoạn **phải có `basis`**, tức là dữ kiện có nguồn cho thấy công việc này có thật trong nghề (ví dụ: "giáo viên chủ nhiệm" → căn cứ Thông tư 05/2025).

## 7. Kỹ thuật

- **Next.js (App Router), static export**, TypeScript, Tailwind.
- **Phaser 3** cho các mini-game, nhúng trong React component. Lazy load từng scene.
- Nội dung: `content/professions/*.json`, validate bằng JSON Schema (`schema/profession.schema.json`) + script kiểm tra nguồn (`scripts/validate.mjs`) chạy trong CI.
- Không backend. Trạng thái người chơi lưu ở `localStorage` (bọc try/catch).
- Hiệu năng: tổng JS trang đầu ≤ 300KB gzip; chạy mượt trên Chrome máy 4GB RAM; không bắt buộc WebGL (Phaser fallback Canvas).
- Deploy: Vercel.

## 8. Quy trình nội dung (research → review → publish)

1. **Research** (Claude Code): theo quy tắc trong `CLAUDE.md`, xuất JSON có `sources[]`.
2. **Kiểm tra máy** (Codex + `validate.mjs`): schema hợp lệ; mỗi `fact` có nguồn; mỗi nguồn pháp luật có ngày hiệu lực; không có nguồn mồ côi.
3. **Review người**: người trong nghề hoặc anh Son đọc lại. Duyệt xong đổi `meta.status` → `reviewed`.
4. Hồ sơ `draft` vẫn hiển thị được trên bản demo nhưng có nhãn **"Bản nháp — đang kiểm chứng"**.

## 9. Tiêu chí hoàn thành (Definition of Done) cho demo

- [ ] 6 nghề sâu chơi trọn được một ngày (≥ 6 phân đoạn mỗi nghề), không lỗi console.
- [ ] ≥ 20 hồ sơ bách khoa đạt `validate.mjs`.
- [ ] 100% `fact` có ít nhất 1 nguồn hoặc được gắn `needs_verification` và hiển thị cảnh báo.
- [ ] Lộ trình thăng tiến hiển thị cho 6 nghề sâu.
- [ ] Trắc nghiệm Holland trả về top 3 nghề.
- [ ] Lighthouse Performance ≥ 80 trên mobile emulation.

## 10. Kế hoạch 10 ngày

| Ngày | Đầu ra |
|---|---|
| 1 | Repo, schema, validator, CLAUDE.md/AGENTS.md; hồ sơ Giáo viên THPT ✅ (có trong bộ khởi động) |
| 2–3 | Engine + 6 loại mini-game; chơi trọn một ngày của nghề Giáo viên |
| 4–5 | Research và kịch bản 5 nghề sâu còn lại |
| 6 | Trang hồ sơ, lộ trình thăng tiến, popover nguồn |
| 7 | 20–30 hồ sơ bách khoa + lọc/tìm kiếm |
| 8 | Trắc nghiệm Holland + tín hiệu hành vi |
| 9 | Kiểm tra chéo nguồn, review nội dung, test máy yếu |
| 10 | Chỉnh giao diện, deploy, kịch bản demo |

## 11. Phương pháp phát triển: SDD + TDD

Mục tiêu: dễ truy vết, dễ implement, dễ sửa bug về sau.

- **Spec-Driven**: mỗi tính năng `F<n>` được tách thành một hoặc nhiều `SPEC-NNN` (thư mục `specs/`). Mỗi spec có tiêu chí chấp nhận `AC-NNN-MM` viết dạng Given/When/Then, kiểm thử được bằng máy. Code chỉ được viết khi spec đã `approved`.
- **Test-Driven**: mỗi AC có ít nhất một test, viết **trước** code (red → green → refactor). Tên test mang mã AC.
- **Truy vết**: `PRD F<n> → SPEC → AC → test → commit (Refs: AC)`. `specs/TRACEABILITY.md` được sinh tự động; CI fail nếu spec đã duyệt mà còn AC chưa có test.
- **Bug**: mỗi bug có `BUG-NNN`, trỏ về AC bị vi phạm. Sửa bằng cách viết test tái hiện trước; test giữ lại vĩnh viễn để chặn lỗi quay lại.
- **Kiến trúc tách lớp để test được**: logic engine (TypeScript thuần) tách khỏi render (Phaser), nên phần lớn hành vi được unit test mà không cần trình duyệt.

Spec hiện có: `SPEC-001` Kiểm tra nội dung (implemented, 14/14 AC có test) · `SPEC-002` Engine mô phỏng (draft, 16 AC, chờ duyệt).

Kế hoạch 10 ngày (mục 10) áp dụng như sau: đầu mỗi hạng mục có thêm bước viết và duyệt spec (≈ 10–15% thời gian). Đổi lại, ngày 9 (kiểm thử) nhẹ đi vì test đã có sẵn từ đầu.

## 12. Rủi ro

| Rủi ro | Giảm thiểu |
|---|---|
| Văn bản pháp luật thay đổi nhanh (ví dụ: chính sách giáo viên thay đổi lớn trong năm 2026) | Mỗi nguồn pháp luật có `effective_date` + `accessed`; trang "Về dữ liệu" hiển thị ngày cập nhật |
| Agent "bịa" số liệu | Validator bắt buộc phải có nguồn; Codex kiểm tra chéo; mặc định `needs_verification` |
| Duyệt nội dung chậm | Cắt bớt số hồ sơ bách khoa, không cắt bước kiểm chứng |
| Thu nhập khu vực tư khó kiểm chứng | Ghi rõ "chưa có số liệu đáng tin" thay vì ước đoán |
