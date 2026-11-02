# Ma trận truy vết

> Tự sinh bởi `npm run trace` — không sửa tay.

| Spec | Ver | Trạng thái | Duyệt | Features | AC có test |
|---|---|---|---|---|---|
| [SPEC-001](SPEC-001-content-validation.md) Kiểm tra tự động nội dung nghề (schema + luật trích nguồn) | 1 | implemented | ✓ Son 2026-11-02 | [F2, F5] | 14/14 |
| [SPEC-002](SPEC-002-day-simulation-engine.md) Engine mô phỏng "một ngày làm việc" (lõi logic, không gồm render) | 2 | implemented | ✓ Son 2026-11-02 | [F3, F7] | 17/17 |
| [SPEC-003](SPEC-003-app-shell.md) Khung app — Next.js static export, nạp nội dung nghề, sinh type từ schema | 1 | implemented | ✓ Son 2026-11-02 | [F1, F2, F3] | 16/16 |
| [SPEC-004](SPEC-004-profession-profile.md) Trang hồ sơ nghề và trích dẫn nguồn | 1 | implemented | ✓ Son 2026-11-02 | [F2, F5] | 13/13 |
| [SPEC-005](SPEC-005-day-player.md) Màn chơi "một ngày làm nghề" trên trình duyệt | 1 | approved | ✓ Son 2026-11-02 | [F3] | 16/16 |

## SPEC-001 — Kiểm tra tự động nội dung nghề (schema + luật trích nguồn)

| AC | Test |
|---|---|
| AC-001-01 | tests\spec-001\validate.test.mjs — "AC-001-01 file mẫu hợp lệ → exit 0" |
| AC-001-02 | tests\spec-001\validate.test.mjs — "AC-001-02 JSON hỏng → exit 1" |
| AC-001-03 | tests\spec-001\validate.test.mjs — "AC-001-03 thiếu trường bắt buộc → lỗi schema" |
| AC-001-04 | tests\spec-001\validate.test.mjs — "AC-001-04 fact không nguồn mà không needs_verification → R1" |
| AC-001-05 | tests\spec-001\validate.test.mjs — "AC-001-05 source_id không tồn tại" |
| AC-001-06 | tests\spec-001\validate.test.mjs — "AC-001-06 nguồn law thiếu effective_date → R2" |
| AC-001-07 | tests\spec-001\validate.test.mjs — "AC-001-07 verified chỉ với 1 nguồn press → R3" |
| AC-001-08 | tests\spec-001\validate.test.mjs — "AC-001-08 needs_verification thiếu note" |
| AC-001-09 | tests\spec-001\validate.test.mjs — "AC-001-09 advice chứa con số → R1" |
| AC-001-10 | tests\spec-001\validate.test.mjs — "AC-001-10 downsides < 3 fact → R7" |
| AC-001-11 | tests\spec-001\validate.test.mjs — "AC-001-11 ladder edge trỏ node không tồn tại" |
| AC-001-12 | tests\spec-001\validate.test.mjs — "AC-001-12 effect dùng stat chưa khai báo" |
| AC-001-13 | tests\spec-001\validate.test.mjs — "AC-001-13 nguồn mồ côi → chỉ cảnh báo, exit 0" |
| AC-001-14 | tests\spec-001\validate.test.mjs — "AC-001-14 segment basis là advice → R6" |

## SPEC-002 — Engine mô phỏng "một ngày làm việc" (lõi logic, không gồm render)

| AC | Test |
|---|---|
| AC-002-01 | tests\spec-002\engine.test.mjs — "AC-002-01 khởi tạo từ fixture → intro, stats initial, histor" |
| AC-002-02 | tests\spec-002\engine.test.mjs — "AC-002-02 không có day_simulation → NO_SIMULATION" |
| AC-002-03 | tests\spec-002\engine.test.mjs — "AC-002-03 task.type lạ → UNKNOWN_TASK_TYPE ngay khi khởi tạo" |
| AC-002-04 | tests\spec-002\engine.test.mjs — "AC-002-04 mọi ô lỗi trong bảng chuyển trạng thái → ILLEGAL_S" |
| AC-002-05 | tests\spec-002\engine.test.mjs — "AC-002-05 mỗi vi phạm R-4..R-11 → INVALID_ANSWER, state khôn" |
| AC-002-06 | tests\spec-002\engine.test.mjs — "AC-002-06 sequence đúng thứ tự → success, a = 60" |
| AC-002-07 | tests\spec-002\engine.test.mjs — "AC-002-07 sequence sai thứ tự → fail, a = 40" |
| AC-002-08 | tests\spec-002\engine.test.mjs — "AC-002-08 choice chặn trên 100: rawDelta 20, appliedDelta 10" |
| AC-002-09 | tests\spec-002\engine.test.mjs — "AC-002-09 drag_sort một item sai bucket → on_fail" |
| AC-002-10 | tests\spec-002\engine.test.mjs — "AC-002-10 spot_error so khớp tập dòng lỗi, không phụ thuộc t" |
| AC-002-11 | tests\spec-002\engine.test.mjs — "AC-002-11 dialogue cộng effect các lượt, feedback theo lượt" |
| AC-002-12 | tests\spec-002\engine.test.mjs — "AC-002-12 time_budget [60,30] → rawDelta {a:5, b:-1}" |
| AC-002-13 | tests\spec-002\engine.test.mjs — "AC-002-13 retry khôi phục stats, xóa history, đếm retries" |
| AC-002-14 | tests\spec-002\engine.test.mjs — "AC-002-14 next ở segment cuối → reflection, finish → done" |
| AC-002-15 | tests\spec-002\engine.test.mjs — "AC-002-15 state() trả bản sao sâu" |
| AC-002-16 | tests\spec-002\engine.test.mjs — "AC-002-16 toàn bộ conformance vectors đạt" |
| AC-002-17 | tests\spec-002\engine.test.mjs — "AC-002-17 mọi nghề có day_simulation chơi hết ngày tới done" |

## SPEC-003 — Khung app — Next.js static export, nạp nội dung nghề, sinh type từ schema

| AC | Test |
|---|---|
| AC-003-01 | tests\spec-003\content.test.mjs — "AC-003-01 nạp thư mục nội dung thật: đủ file, có giao-vien-t" |
| AC-003-02 | tests\spec-003\content.test.mjs — "AC-003-02 sắp xếp theo id, không theo thứ tự đọc file" |
| AC-003-03 | tests\spec-003\content.test.mjs — "AC-003-03 tên file khác id → CONTENT_ID_MISMATCH" |
| AC-003-04 | tests\spec-003\content.test.mjs — "AC-003-04 JSON hỏng → CONTENT_PARSE_ERROR" |
| AC-003-05 | tests\spec-003\content.test.mjs — "AC-003-05 bỏ qua file không phải .json, đuôi .JSON và thư mụ" |
| AC-003-06 | tests\spec-003\content.test.mjs — "AC-003-06 getProfession khớp chính xác id, phân biệt hoa thư" |
| AC-003-07 | tests\spec-003\tooling.test.mjs — "AC-003-07 type đã sinh khớp schema → types:check exit 0" |
| AC-003-08 | tests\spec-003\tooling.test.mjs — "AC-003-08 schema đổi mà chưa sinh lại type → types:check exi" |
| AC-003-09 | tests\spec-003\tooling.test.mjs — "AC-003-09 typecheck strict không lỗi" |
| AC-003-10 | tests\spec-003\tooling.test.mjs — "AC-003-10 script check chạy types:check và typecheck trước n" |
| AC-003-11 | tests\spec-003\build.test.mjs — "AC-003-11 trang chủ: lang vi, mỗi nghề đúng một link /nghe/<" |
| AC-003-12 | tests\spec-003\build.test.mjs — "AC-003-12 trang nghề giáo viên THPT có đúng một h1 là tên ng" |
| AC-003-13 | tests\spec-003\build.test.mjs — "AC-003-13 sinh trang cho đúng tập id, không thừa không thiếu" |
| AC-003-14 | tests\spec-003\build.test.mjs — "AC-003-14 JS trên trình duyệt không tải file nội dung" |
| AC-003-15 | tests\spec-003\build.test.mjs — "AC-003-15 tổng JS gzip của trang chủ ≤ 300 KB" |
| AC-003-16 | tests\spec-003\tooling.test.mjs — "AC-003-16 6 gói lõi được ghim phiên bản chính xác" |

## SPEC-004 — Trang hồ sơ nghề và trích dẫn nguồn

| AC | Test |
|---|---|
| AC-004-01 | tests\spec-004\view.test.mjs — "AC-004-01 bỏ nhóm rỗng và mục không tồn tại" |
| AC-004-02 | tests\spec-004\view.test.mjs — "AC-004-02 heading mục và nhóm theo bảng R-2" |
| AC-004-03 | tests\spec-004\view.test.mjs — "AC-004-03 trích dẫn giữ thứ tự và phần tử trùng" |
| AC-004-04 | tests\spec-004\view.test.mjs — "AC-004-04 source_id không tồn tại → UNKNOWN_SOURCE" |
| AC-004-05 | tests\spec-004\view.test.mjs — "AC-004-05 nhãn độ tin cậy và cảnh báo" |
| AC-004-06 | tests\spec-004\view.test.mjs — "AC-004-06 nhãn loại nguồn và ngày hiệu lực" |
| AC-004-07 | tests\spec-004\view.test.mjs — "AC-004-07 simulationHref, aliases, scopeNote khi có và không" |
| AC-004-08 | tests\spec-004\view.test.mjs — "AC-004-08 không đổi đối số; lộ trình theo thứ tự nodes" |
| AC-004-09 | tests\spec-004\build.test.mjs — "AC-004-09 nhãn bản nháp, một h1, thứ tự h2" |
| AC-004-10 | tests\spec-004\build.test.mjs — "AC-004-10 mỗi trích dẫn là một details có đúng một link mở t" |
| AC-004-11 | tests\spec-004\build.test.mjs — "AC-004-11 số cảnh báo bằng số item cần kiểm chứng" |
| AC-004-12 | tests\spec-004\build.test.mjs — "AC-004-12 có đúng một link chơi thử" |
| AC-004-13 | tests\spec-004\build.test.mjs — "AC-004-13 trang hồ sơ không thêm script riêng" |

## SPEC-005 — Màn chơi "một ngày làm nghề" trên trình duyệt

| AC | Test |
|---|---|
| AC-005-01 | tests\spec-005\controller.test.mjs — "AC-005-01 displayOrder đúng bảng mẫu" |
| AC-005-02 | tests\spec-005\controller.test.mjs — "AC-005-02 mọi segment thật: hoán vị và không phải đồng nhất" |
| AC-005-03 | tests\spec-005\controller.test.mjs — "AC-005-03 initialDraft sequence xáo theo displayOrder" |
| AC-005-04 | tests\spec-005\controller.test.mjs — "AC-005-04 move trong biên thì dời, ngoài biên thì giữ nguyên" |
| AC-005-05 | tests\spec-005\controller.test.mjs — "AC-005-05 choice: pick ghi đè, option lạ bị bỏ qua" |
| AC-005-06 | tests\spec-005\controller.test.mjs — "AC-005-06 drag_sort: place và bucket lạ" |
| AC-005-07 | tests\spec-005\controller.test.mjs — "AC-005-07 spot_error: toggle giữ tăng dần, dòng ngoài biên b" |
| AC-005-08 | tests\spec-005\controller.test.mjs — "AC-005-08 dialogue: chỉ trả lời lượt kế tiếp" |
| AC-005-09 | tests\spec-005\controller.test.mjs — "AC-005-09 time_budget: bước 30 phút, không vượt quỹ, không â" |
| AC-005-10 | tests\spec-005\controller.test.mjs — "AC-005-10 update không sửa draft truyền vào" |
| AC-005-11 | tests\spec-005\controller.test.mjs — "AC-005-11 toAnswer của draft đủ được engine chấp nhận" |
| AC-005-12 | tests\spec-005\controller.test.mjs — "AC-005-12 formatDelta theo thứ tự stats, bỏ 0 và khóa lạ" |
| AC-005-13 | tests\spec-005\controller.test.mjs — "AC-005-13 toàn bộ conformance vectors đạt" |
| AC-005-14 | tests\spec-005\build.test.mjs — "AC-005-14 sinh trang màn chơi cho đúng các nghề có day_simul" |
| AC-005-15 | tests\spec-005\build.test.mjs — "AC-005-15 JS không chứa đường dẫn nội dung" |
| AC-005-16 | tests\spec-005\build.test.mjs — "AC-005-16 tổng JS gzip trang màn chơi ≤ 300 KB" |
