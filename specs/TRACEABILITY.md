# Ma trận truy vết

> Tự sinh bởi `npm run trace` — không sửa tay.

| Spec | Ver | Trạng thái | Duyệt | Features | AC có test |
|---|---|---|---|---|---|
| [SPEC-001](SPEC-001-content-validation.md) Kiểm tra tự động nội dung nghề (schema + luật trích nguồn) | 1 | implemented | ✓ Son 2026-11-02 | [F2, F5] | 14/14 |
| [SPEC-002](SPEC-002-day-simulation-engine.md) Engine mô phỏng "một ngày làm việc" (lõi logic, không gồm render) | 2 | implemented | ✓ Son 2026-11-02 | [F3, F7] | 17/17 |
| [SPEC-003](SPEC-003-app-shell.md) Khung app — Next.js static export, nạp nội dung nghề, sinh type từ schema | 1 | implemented | ✓ Son 2026-11-02 | [F1, F2, F3] | 16/16 |
| [SPEC-004](SPEC-004-profession-profile.md) Trang hồ sơ nghề và trích dẫn nguồn | 1 | implemented | ✓ Son 2026-11-02 | [F2, F5] | 13/13 |
| [SPEC-005](SPEC-005-day-player.md) Màn chơi "một ngày làm nghề" trên trình duyệt | 2 | implemented | ✓ Son 2026-11-03 | [F3] | 16/16 |
| [SPEC-006](SPEC-006-world-game.md) Game thế giới 2D — đi lại và làm việc trong một ngày làm nghề | 1 | implemented | ✓ Son 2026-11-03 | [F3] | 14/14 |
| [SPEC-007](SPEC-007-minigame-scenes.md) Hoạt cảnh mini-game trong thế giới 2D | 1 | implemented | ✓ Son 2026-11-03 | [F3] | 10/10 |
| [SPEC-008](SPEC-008-deep-profession-pack.md) Chuẩn đóng gói một nghề trải nghiệm sâu (nội dung + bản đồ game) | 1 | implemented | ✓ Son 2026-11-03 | [F2, F3] | 11/11 |
| [SPEC-009](SPEC-009-dieu-duong.md) Gói nghề Điều dưỡng (nội dung + bản đồ bệnh viện) | 1 | implemented | ✓ Son 2026-11-03 | [F2, F3, F4, F5] | 7/7 |
| [SPEC-010](SPEC-010-lap-trinh-vien.md) Gói nghề Lập trình viên (nội dung + bản đồ văn phòng phần mềm) | 1 | approved | ✓ Son 2026-11-03 | [F2, F3, F4, F5] | 0/7 |
| [SPEC-011](SPEC-011-ke-toan.md) Gói nghề Kế toán (nội dung + bản đồ văn phòng doanh nghiệp) | 1 | approved | ✓ Son 2026-11-03 | [F2, F3, F4, F5] | 0/8 |
| [SPEC-012](SPEC-012-ky-su-xay-dung.md) Gói nghề Kỹ sư xây dựng (nội dung + bản đồ công trường) | 1 | approved | ✓ Son 2026-11-03 | [F2, F3, F4, F5] | 0/8 |
| [SPEC-013](SPEC-013-nhan-vien-marketing.md) Gói nghề Nhân viên Marketing (nội dung + bản đồ agency) | 1 | approved | ✓ Son 2026-11-03 | [F2, F3, F4, F5] | 0/7 |

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

## SPEC-006 — Game thế giới 2D — đi lại và làm việc trong một ngày làm nghề

| AC | Test |
|---|---|
| AC-006-01 | tests\spec-006\grid.test.mjs — "AC-006-01 toàn bộ conformance vectors đạt" |
| AC-006-02 | tests\spec-006\bug-004.test.mjs — "BUG-004 AC-006-02 giữ phím thì luôn có hướng đi tiếp, nhả th"<br>tests\spec-006\bug-004.test.mjs — "BUG-004 AC-006-02 phím nhấn sau cùng được ưu tiên; nhả nó th"<br>tests\spec-006\bug-004.test.mjs — "BUG-004 AC-006-02 chạm nhanh trong lúc đang bước vẫn được áp"<br>tests\spec-006\bug-004.test.mjs — "BUG-004 AC-006-02 nhấn lại phím đang giữ (sự kiện lặp) không"<br>tests\spec-006\bug-004.test.mjs — "BUG-004 AC-006-02 clear() xóa mọi phím (mất focus, mở bảng t"<br>tests\spec-006\grid.test.mjs — "AC-006-02 step: tường, biên, ô bị chặn" |
| AC-006-03 | tests\spec-006\grid.test.mjs — "AC-006-03 findPath: BFS ưu tiên up, right, down, left" |
| AC-006-04 | tests\spec-006\grid.test.mjs — "AC-006-04 standSpots: thứ tự up, right, down, left và hướng " |
| AC-006-05 | tests\spec-006\grid.test.mjs — "AC-006-05 canInteract chỉ khi quay mặt đúng vào target" |
| AC-006-06 | tests\spec-006\world.test.mjs — "AC-006-06 thế giới mẫu hợp lệ → exit 0" |
| AC-006-07 | tests\spec-006\world.test.mjs — "AC-006-07 các lỗi cấu trúc → exit 1, có tên file" |
| AC-006-08 | tests\spec-006\world.test.mjs — "AC-006-08 target bị tường bao kín → exit 1" |
| AC-006-09 | tests\spec-006\world.test.mjs — "AC-006-09 thế giới giáo viên THPT hợp lệ và đủ 7 segment" |
| AC-006-10 | tests\spec-006\world.test.mjs — "AC-006-10 check chạy validate:world ngay sau validate" |
| AC-006-11 | tests\spec-006\build.test.mjs — "AC-006-11 trang màn chơi có nút bắt đầu, script ban đầu khôn" |
| AC-006-12 | tests\spec-006\build.test.mjs — "AC-006-12 chunk Phaser tải lười ≤ 600 KB gzip" |
| AC-006-13 | tests\spec-006\build.test.mjs — "AC-006-13 ảnh tileset tồn tại và có giấy phép cho từng bộ as" |
| AC-006-14 | tests\spec-006\playthrough.test.mjs — "AC-006-14 chơi hết ngày giáo viên trong thế giới, tới được m" |

## SPEC-007 — Hoạt cảnh mini-game trong thế giới 2D

| AC | Test |
|---|---|
| AC-007-01 | tests\spec-007\layout.test.mjs — "AC-007-01 toàn bộ conformance vectors đạt" |
| AC-007-02 | tests\spec-007\layout.test.mjs — "AC-007-02 bong bóng nằm trên điểm neo, căn giữa" |
| AC-007-03 | tests\spec-007\layout.test.mjs — "AC-007-03 bong bóng bị kẹp trong khung" |
| AC-007-04 | tests\spec-007\layout.test.mjs — "AC-007-04 dropIndex đếm thẻ khác có tâm phía trên điểm thả" |
| AC-007-05 | tests\spec-007\layout.test.mjs — "AC-007-05 thả thẻ ở dropIndex tạo đúng action move" |
| AC-007-06 | tests\spec-007\layout.test.mjs — "AC-007-06 timeSlots tô ô theo thứ tự activity" |
| AC-007-07 | tests\spec-007\layout.test.mjs — "AC-007-07 timeSlots chưa phân bổ thì toàn ô trống" |
| AC-007-08 | tests\spec-007\layout.test.mjs — "AC-007-08 hitBucket: biên trái/trên tính vào khay, khe giữa " |
| AC-007-09 | tests\spec-007\build.test.mjs — "AC-007-09 bản build có đủ 6 hoạt cảnh" |
| AC-007-10 | tests\spec-007\build.test.mjs — "AC-007-10 chunk game (Phaser) vẫn ≤ 600 KB gzip" |

## SPEC-008 — Chuẩn đóng gói một nghề trải nghiệm sâu (nội dung + bản đồ game)

| AC | Test |
|---|---|
| AC-008-01 | tests\spec-008\pack.test.mjs — "AC-008-01 gói hợp lệ → exit 0" |
| AC-008-02 | tests\spec-008\pack.test.mjs — "AC-008-02 không đủ 7 segment → R-1" |
| AC-008-03 | tests\spec-008\pack.test.mjs — "AC-008-03 ít loại task hoặc một loại quá 2 lần → R-2" |
| AC-008-04 | tests\spec-008\pack.test.mjs — "AC-008-04 vượt giới hạn chữ → R-3" |
| AC-008-05 | tests\spec-008\pack.test.mjs — "AC-008-05 stats không đúng 3 hoặc label dài → R-4" |
| AC-008-06 | tests\spec-008\pack.test.mjs — "AC-008-06 thiếu testimony, trùng publisher, testimony không " |
| AC-008-07 | tests\spec-008\pack.test.mjs — "AC-008-07 reviewed thiếu reviewed_by → chỉ cảnh báo, exit 0" |
| AC-008-08 | tests\spec-008\pack.test.mjs — "AC-008-08 bản đồ có target bị bao kín → R-7" |
| AC-008-09 | tests\spec-008\pack.test.mjs — "AC-008-09 check chạy check:pack ngay sau validate:world" |
| AC-008-10 | tests\spec-008\playthrough.test.mjs — "AC-008-10 mọi gói sâu chơi hết ngày trong thế giới tới done" |
| AC-008-11 | tests\spec-008\pack.test.mjs — "AC-008-11 nội dung thật đạt chuẩn gói sâu" |

## SPEC-009 — Gói nghề Điều dưỡng (nội dung + bản đồ bệnh viện)

| AC | Test |
|---|---|
| AC-009-01 | tests\spec-009\dieu-duong.test.mjs — "AC-009-01 hồ sơ Điều dưỡng qua validate" |
| AC-009-02 | tests\spec-009\dieu-duong.test.mjs — "AC-009-02 bản đồ Điều dưỡng qua validate:world" |
| AC-009-03 | tests\spec-009\dieu-duong.test.mjs — "AC-009-03 gói Điều dưỡng đạt check:pack" |
| AC-009-04 | tests\spec-009\dieu-duong.test.mjs — "AC-009-04 chơi hết ngày Điều dưỡng tới done" |
| AC-009-05 | tests\spec-009\dieu-duong.test.mjs — "AC-009-05 có nguồn pháp luật có ngày hiệu lực, draft, có phạ" |
| AC-009-06 | tests\spec-009\dieu-duong.test.mjs — "AC-009-06 không có liều thuốc, nhiệt độ, huyết áp trong chữ " |
| AC-009-07 | tests\spec-009\dieu-duong.test.mjs — "AC-009-07 bản build có trang hồ sơ và trang màn chơi" |

## SPEC-010 — Gói nghề Lập trình viên (nội dung + bản đồ văn phòng phần mềm)

| AC | Test |
|---|---|
| AC-010-01 | ❌ chưa có |
| AC-010-02 | ❌ chưa có |
| AC-010-03 | ❌ chưa có |
| AC-010-04 | ❌ chưa có |
| AC-010-05 | ❌ chưa có |
| AC-010-06 | ❌ chưa có |
| AC-010-07 | ❌ chưa có |

## SPEC-011 — Gói nghề Kế toán (nội dung + bản đồ văn phòng doanh nghiệp)

| AC | Test |
|---|---|
| AC-011-01 | ❌ chưa có |
| AC-011-02 | ❌ chưa có |
| AC-011-03 | ❌ chưa có |
| AC-011-04 | ❌ chưa có |
| AC-011-05 | ❌ chưa có |
| AC-011-06 | ❌ chưa có |
| AC-011-07 | ❌ chưa có |
| AC-011-08 | ❌ chưa có |

## SPEC-012 — Gói nghề Kỹ sư xây dựng (nội dung + bản đồ công trường)

| AC | Test |
|---|---|
| AC-012-01 | ❌ chưa có |
| AC-012-02 | ❌ chưa có |
| AC-012-03 | ❌ chưa có |
| AC-012-04 | ❌ chưa có |
| AC-012-05 | ❌ chưa có |
| AC-012-06 | ❌ chưa có |
| AC-012-07 | ❌ chưa có |
| AC-012-08 | ❌ chưa có |

## SPEC-013 — Gói nghề Nhân viên Marketing (nội dung + bản đồ agency)

| AC | Test |
|---|---|
| AC-013-01 | ❌ chưa có |
| AC-013-02 | ❌ chưa có |
| AC-013-03 | ❌ chưa có |
| AC-013-04 | ❌ chưa có |
| AC-013-05 | ❌ chưa có |
| AC-013-06 | ❌ chưa có |
| AC-013-07 | ❌ chưa có |
