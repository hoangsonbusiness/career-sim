# CLAUDE.md — Một Ngày Làm Nghề

Đọc `PRD.md` trước khi làm bất cứ việc gì. File này là **luật làm việc** cho repo.

## Mục tiêu tối thượng
App hướng nghiệp cho học sinh/sinh viên Việt Nam. **Sai một con số là mất niềm tin của người dùng.** Khi phải chọn giữa "đủ nội dung" và "đúng nội dung", luôn chọn đúng.

## Cấu trúc repo
```
schema/profession.schema.json   # JSON Schema cho một nghề (nguồn chân lý về cấu trúc)
content/professions/*.json      # Mỗi nghề một file; giao-vien-thpt.json là MẪU CHUẨN
scripts/validate.mjs            # Validate schema + luật trích nguồn (SPEC-001)
scripts/trace.mjs               # Ma trận truy vết SPEC → AC → test
specs/                          # SDD: SPEC-NNN-*.md, bugs/, adr/, TRACEABILITY.md (tự sinh)
tests/spec-NNN/                 # Test theo từng spec; tên test bắt đầu bằng mã AC
src/                            # Next.js app + Phaser engine (logic engine tách khỏi render)
```

## Lệnh
- `npm run next`: việc đang chờ ai làm gì. **Chạy đầu mỗi phiên.**
- `npm run check`: **cổng duy nhất trước commit** (validate + spec:lint + test + trace --check).
- `npm run spec:lint`: kiểm tra spec theo `specs/STANDARD.md`.
- `npm run approve SPEC-NNN -- --by "Tên"`: **chỉ dành cho con người**.
- `npm run complete SPEC-NNN`: agent dùng khi đã xong spec (D9).
- `npm run scope [base]`: kiểm tra phạm vi thay đổi so với nhánh gốc (mặc định `origin/main`).
- Roadmap & thứ tự ưu tiên: `specs/ROADMAP.md`. Khi viết spec mới cho một hạng mục, điền mã SPEC vào cột Spec.
- `npm test`: chạy toàn bộ test (`tests/**/*.test.mjs`; Vitest cho `src/` khi có).
- `npm run trace`: sinh lại `specs/TRACEABILITY.md`.
- `npm run validate`: kiểm tra toàn bộ `content/`. **Không commit nội dung nếu validate còn lỗi.**
- `npm run dev`, `npm run build` (static export).

---

## QUY TẮC RESEARCH & TRÍCH NGUỒN (bắt buộc)

### R1. Không có nguồn thì không có dữ kiện
Mọi item `kind: "fact"` phải có `source_ids` trỏ tới `sources[]`. Không tìm được nguồn thì **không được tự điền theo trí nhớ**. Thay vào đó:
- bỏ dữ kiện đó đi, hoặc
- giữ lại với `confidence: "needs_verification"` + `note` nói rõ cần tìm gì.

Lời khuyên định hướng (ví dụ "nên học tốt Ngữ văn nếu muốn dạy Văn") dùng `kind: "advice"`, không bắt buộc nguồn, nhưng **không được chứa con số hay quy định pháp lý**.

### R2. Thứ tự ưu tiên nguồn (`sources[].type`)
1. `law`: luật, nghị định, thông tư. Ưu tiên cổng chính phủ (`*.gov.vn`, vbpl.vn, chinhphu.vn), sau đó tới thuvienphapluat.vn, luatvietnam.vn. **Bắt buộc có `effective_date`.**
2. `official_stat`: Tổng cục Thống kê, Bộ/Sở, đề án tuyển sinh của trường.
3. `market`: báo cáo lương/tuyển dụng (TopCV, VietnamWorks, ITviec, Navigos…), tổng hợp tin tuyển dụng thật. Ghi năm của báo cáo.
4. `press`: báo chí chính thống (giaoduc.net.vn, vnexpress, tuoitre, thanhnien…).
5. `testimony`: chia sẻ của người trong nghề, có tên/đơn vị, đăng công khai. **Chỉ dùng cho mô tả trải nghiệm, không dùng cho số liệu.**
6. `reference`: O*NET, ESCO… **Chỉ dùng làm khung phân rã nhiệm vụ, không dùng làm số liệu cho Việt Nam.**

Cấm dùng: forum ẩn danh, nội dung do AI sinh, blog SEO không rõ tác giả làm nguồn duy nhất.

### R3. Mức tin cậy (`confidence`)
- `verified`: nguồn `law`/`official_stat` trực tiếp, **hoặc** ≥ 2 nguồn độc lập khớp nhau.
- `single_source`: chỉ có 1 nguồn thứ cấp.
- `needs_verification`: nguồn mâu thuẫn, nguồn cũ, hoặc chưa tìm được nguồn gốc. UI sẽ hiển thị cảnh báo.

### R4. Pháp luật Việt Nam thay đổi nhanh, phải kiểm tra hiệu lực
- Luôn tìm văn bản **mới nhất** và kiểm tra xem văn bản có bị thay thế không (ví dụ: TT 28/2009 → TT 05/2025; TT 20/2018 → TT 30/2026; TT 04/2021 → TT 31/2026; TT 32/2020 → TT 15/2026).
- Khi 2 nguồn mâu thuẫn: ghi cả hai vào `note`, đặt `needs_verification`, không tự chọn một bên.
- Số tiền **tự tính** (hệ số × lương cơ sở) phải ghi công thức trong `note`.

### R5. Không sao chép nguyên văn
Diễn đạt lại bằng lời của mình. Trích dẫn nguyên văn (nếu thật cần) dưới 15 từ. Nguồn là để người đọc kiểm tra, không phải để chép.

### R6. Kịch bản mô phỏng ≠ dữ kiện
`day_simulation.segments[].narrative` là hư cấu minh họa, được phép sáng tác. Nhưng:
- mỗi segment **phải có `basis`** (một fact có nguồn) chứng minh công việc đó có thật trong nghề;
- giờ giấc trong ngày là minh họa → ghi `time_is_illustrative: true`;
- **không** đưa con số/quy định vào narrative nếu con số đó không có trong `basis`.

### R7. Phản ánh cả mặt khó
`downsides[]` là bắt buộc, tối thiểu 3 mục có nguồn. App là công cụ định hướng, không phải quảng cáo nghề.

### R8. Quy trình research một nghề mới
1. Phân rã nhiệm vụ: dùng O*NET/ESCO làm khung → đối chiếu với văn bản Việt Nam.
2. Tìm văn bản pháp lý: trình độ chuẩn, chuẩn nghề nghiệp, chứng chỉ hành nghề, chế độ làm việc, lương (nếu khu vực công).
3. Tìm số liệu thị trường (khu vực tư) → ghi năm.
4. Tìm ≥ 2 chia sẻ người trong nghề cho phần "một ngày".
5. Viết JSON theo **`content/professions/giao-vien-thpt.json`** (mẫu chuẩn).
6. `npm run validate` → sửa đến khi sạch.
7. Đặt `meta.status: "draft"`. Chỉ con người mới được đổi sang `reviewed`.

### R9. Ngôn ngữ
Nội dung tiếng Việt, có dấu, giọng thân thiện với học sinh. Dùng "bạn". Tránh thuật ngữ hành chính khi không cần; nếu buộc phải dùng (ví dụ "chức danh nghề nghiệp") thì giải thích ngắn.

---

## QUY TRÌNH PHÁT TRIỂN: SDD + TDD (bắt buộc)

Chi tiết ở `specs/README.md`. Tóm tắt luật cứng:

- **D0. Đầu mỗi phiên: đọc kết quả `npm run next`** (hook SessionStart trong `.claude/settings.json` tự chạy; nếu không thấy thì tự chạy). Mục "Chờ AGENT" là việc của bạn, theo thứ tự in ra. Mục "Chờ ANH SON" thì không được làm thay.
- **D1. Không spec, không code.** Mọi thay đổi hành vi trong `src/` hoặc `scripts/` phải thuộc một `SPEC-NNN` đã được duyệt (`approved_hash` khớp). Chưa có spec → viết spec từ `specs/_template.md` **theo `specs/STANDARD.md`**, chạy `npm run spec:lint` cho sạch, rồi DỪNG và báo anh Son duyệt. **Agent KHÔNG ĐƯỢC chạy `npm run approve`, không sửa tay các trường `status: approved`, `approved_hash`, `approved_by`, `approved_at`.**
- **D1b. Phân loại yêu cầu mới trước khi làm**: tính năng mới → SPEC mới; đổi hành vi đã có → sửa spec cũ (tăng `version`, ghi lịch sử, cần duyệt lại); bug → `BUG-NNN`; nội dung nghề → chỉ cần `npm run check`; refactor → không cần spec nhưng không được sửa test cũ. Mỗi spec là một **khả năng của hệ thống**, không phải một lần yêu cầu.
- **D1c. Spec phải đủ chặt để agent khác implement ra cùng kết quả**: tuân thủ `specs/STANDARD.md` (ST-01..ST-14). Spec có logic tính toán phải có conformance vectors.
- **D2. Red trước Green.** Với mỗi AC: viết test trước, chạy và **xác nhận test đỏ vì đúng lý do**, rồi mới viết code. Không viết test sau code rồi tuyên bố "đã TDD".
- **D3. Tên test mang mã truy vết**: `test("AC-002-03 mô tả")` hoặc `test("BUG-004 AC-002-03 mô tả")`. Script `trace.mjs` dựa vào quy ước này.
- **D4. Commit theo Conventional Commits + mã truy vết**:
  - `test(SPEC-002): red for AC-002-03`
  - `feat(SPEC-002): clamp stats to [0,100]` + dòng cuối `Refs: AC-002-03`
  - `fix(BUG-004): ...` + `Refs: AC-002-03`
  - `docs(SPEC-002): ...` khi chỉ sửa spec
- **D5. Sửa bug = tái hiện bằng test trước.** Tạo `specs/bugs/BUG-NNN-*.md` → test đỏ tái hiện → sửa → xanh. Nếu không AC nào bao phủ bug, thêm AC vào spec trước (đó là lỗ hổng của spec), ghi vào "Lịch sử thay đổi" của spec.
- **D6. Spec và code không được lệch nhau.** Nếu khi implement thấy spec sai hoặc thiếu: dừng lại, sửa spec (ghi lịch sử), rồi mới sửa code. Không âm thầm làm khác spec.
- **D7. Quyết định kiến trúc** (chọn thư viện, đổi cấu trúc dữ liệu, đánh đổi hiệu năng) ghi thành `specs/adr/ADR-NNN-*.md`: bối cảnh, các phương án, lựa chọn, hệ quả.
- **D8. Cổng kiểm tra**: `npm run check` (= validate + spec:lint + test + trace --check) phải xanh trước mỗi commit. `npm run trace` sinh lại `specs/TRACEABILITY.md`; commit file này cùng code. Check sẽ FAIL nếu phần quy phạm (mục 2–4) của một spec đã duyệt bị sửa — đó là tín hiệu phải dừng và xin duyệt lại, **không được tìm cách vượt qua**.
- **D9. Hoàn tất spec bằng `npm run complete SPEC-NNN`** (không sửa tay `status`). Lệnh kiểm tra mọi AC đã có test, test xanh, rồi chuyển sang `implemented` và **khóa toàn bộ file trong `tests/spec-NNN/`** (`specs/locks/SPEC-NNN.lock.json`).
- **D10. Test đã khóa là bất khả xâm phạm.** KHÔNG ĐƯỢC sửa hay xóa file test đã khóa, kể cả khi nó "sai", "cũ" hay "cản đường". Nếu bạn cho rằng test sai: dừng lại, báo anh Son kèm lý do. Chỉ người duyệt mới mở khóa (`npm run approve`). Tuyệt đối không sửa `specs/locks/`.
- **D11. Test cho bug nằm trong FILE MỚI** `tests/spec-NNN/bug-NNN.test.*`. Thêm file mới vào thư mục đã khóa là hợp lệ.
- **D12. Giữ đúng phạm vi.** Commit cho SPEC/BUG nào thì chỉ chạm file trong `owns` của spec đó. Nếu buộc phải sửa file của spec khác, ghi cả hai mã vào commit message và giải thích trong body. `npm run scope` (CI cũng chạy) sẽ cảnh báo mọi lần sửa lan.
- **D13. Tên test phải là chuỗi cố định** chứa mã AC. Không dựng tên test bằng biến hay template literal, vì công cụ truy vết không đọc được.

## Quy tắc code
- TypeScript strict. Type cho nội dung **sinh từ JSON Schema** (`json-schema-to-typescript`), không viết tay.
- Engine không được biết tên nghề cụ thể. Không `if (profession === 'giao-vien')`.
- Mini-game mới = thêm một `task.type` vào schema + một Phaser scene + test.
- `localStorage` luôn bọc try/catch.
- Mỗi PR: `npm run validate && npm run build` phải xanh.

## Phân vai với Codex
Claude Code: research, nội dung, engine. Codex: review PR, viết test, **kiểm tra chéo nguồn** (mở URL, đối chiếu dữ kiện). Không agent nào tự review nội dung do chính nó viết.
