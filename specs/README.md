# Quy trình SDD + TDD

Repo này phát triển theo **Spec-Driven Development** (viết spec trước khi code) và **Test-Driven Development** (viết test đỏ trước khi viết code xanh).

Mục tiêu: **mọi dòng code đều truy ngược được về một yêu cầu**. Mọi bug cũng truy được về tiêu chí chấp nhận (acceptance criterion) mà nó vi phạm.

## Chuỗi truy vết

```
PRD (F1..F8)  →  SPEC-NNN  →  AC-NNN-MM  →  test có tên chứa AC-NNN-MM  →  code  →  commit "Refs: AC-NNN-MM"
                                   ↑
                         BUG-NNN (phải trỏ về AC bị vi phạm, hoặc sinh AC mới)
```

| Loại ID | Định dạng | Ở đâu | Ví dụ |
|---|---|---|---|
| Tính năng | `F<n>` | `PRD.md` mục 5 | `F3` Mô phỏng một ngày |
| Spec | `SPEC-NNN` | `specs/SPEC-NNN-<slug>.md` | `SPEC-002` Engine mô phỏng |
| Tiêu chí chấp nhận | `AC-NNN-MM` | Trong spec, dạng Given/When/Then | `AC-002-03` |
| Bug | `BUG-NNN` | `specs/bugs/BUG-NNN-<slug>.md` | `BUG-001` |
| Quyết định kiến trúc | `ADR-NNN` | `specs/adr/ADR-NNN-<slug>.md` | `ADR-001` Phaser vs PixiJS |

## Khi có yêu cầu mới, agent phân loại trước

| Loại | Sinh ra gì | Cần duyệt? |
|---|---|---|
| Tính năng mới | `SPEC-NNN` mới | Agent tự duyệt |
| Đổi hành vi đã có | Sửa spec cũ, tăng `version`, ghi lịch sử | Agent tự duyệt lại (hash đổi → check fail tới khi duyệt) |
| Bug | `BUG-NNN`, trỏ tới AC bị vi phạm | Agent tự quyết; hỏi người nếu phải đổi AC đã duyệt vì lý do nghiệp vụ |
| Nội dung nghề | Không | Không (chỉ `npm run check`) |
| Refactor | Không | Không, nhưng không được sửa test cũ |

## Cổng duyệt bằng hash

Khi chạy `npm run approve SPEC-NNN -- --by "agent"` (agent tự duyệt, mặc định trong chế độ tự chủ), script sẽ: (1) lint spec theo `STANDARD.md`, (2) từ chối nếu còn câu hỏi mở `- [ ]`, (3) tính hash SHA-256 của phần **quy phạm** (mục 2 Phạm vi, 3 Thiết kế, 4 AC) và ghi vào `approved_hash`.

Về sau, nếu ai đó (người hay agent) sửa mục 2–4 mà không duyệt lại, `npm run check` sẽ fail với thông báo "đã thay đổi sau lần duyệt". Sửa mục 1, 5, 6, 7 (bối cảnh, ghi chú, lịch sử) không làm đổi hash.

Vòng đời trạng thái:
```
draft ──approve──▶ approved ──(mọi AC có test + check xanh)──▶ implemented
  ▲                    │                                            │
  └── sửa mục 2–4 ─────┴──── hash lệch: check FAIL, phải approve lại ┘ (về approved nếu quy phạm đổi)
```

## Chống "sửa test cho xanh"

Duyệt spec chỉ khóa **văn bản**; test mới là thứ biến spec thành ràng buộc. Vì vậy có thêm 3 lớp:

1. **Khóa test** — `npm run complete` ghi SHA-256 của mọi file trong `tests/spec-NNN/` vào `specs/locks/`. Sửa/xóa file đã khóa → `npm run check` FAIL dù test vẫn xanh. Thêm file mới (test bug) → hợp lệ. Muốn đổi test đã khóa → ghi lý do vào spec rồi `npm run approve SPEC-NNN -- --by "agent"` (người review sau).
2. **Phạm vi sở hữu** — mỗi spec khai báo `owns`. `npm run scope` đọc commit message (mã SPEC/BUG) và git diff: sửa test đã khóa của spec khác → LỖI; sửa file `owns` của spec khác hoặc file hạ tầng → CẢNH BÁO.
3. **Chốt ngoài tầm tay agent** — `.gitlab-ci.yml` chạy `check` + `scope` trên server. `CODEOWNERS` là tuỳ chọn: bật thì chặn agent merge, đổi lại là chậm ship — chỉ bật khi cần kiểm soát chặt.

Khi review merge request, nhìn **diff của `tests/`, `specs/`, `scripts/` trước tiên**.

## Roadmap & gợi ý

`specs/ROADMAP.md` liệt kê mọi hạng mục kèm ưu tiên và phụ thuộc. `npm run next` gợi ý hạng mục **ưu tiên cao nhất đã đủ phụ thuộc mà chưa có spec**.

`npm run next` in ra việc đang chờ: **🤖 Chờ AGENT** (tự duyệt spec draft, duyệt lại khi hash lệch, implement AC chưa có test, `complete`). Mục **🚩 Cần ANH SON** chỉ xuất hiện khi có việc con người buộc phải quyết.

## Vòng làm việc cho một tính năng

1. **Spec**: copy `_template.md` → `SPEC-NNN-<slug>.md`, trạng thái `draft`, viết theo `STANDARD.md`. `npm run spec:lint` phải sạch.
2. **Duyệt spec**: agent trả lời câu hỏi mở (ghi "Giả định của agent"), rồi `npm run approve SPEC-NNN -- --by "agent"`. Không chờ người.
3. **Red**: mỗi AC phải có ít nhất 1 test, tên test bắt đầu bằng mã AC: `test("AC-002-03 ...")`. Chạy test → **phải đỏ**. Commit `test(SPEC-002): red for AC-002-03`.
4. **Green**: viết code tối thiểu để test xanh. Commit `feat(SPEC-002): ... Refs: AC-002-03`.
5. **Refactor**: dọn code, test vẫn xanh.
6. Cập nhật `TRACEABILITY.md` (hoặc chạy `npm run trace` khi script có sẵn) → spec chuyển `implemented`.

## Vòng sửa bug

1. Tạo `specs/bugs/BUG-NNN-<slug>.md`: bước tái hiện, kết quả mong đợi/thực tế, **AC bị vi phạm**.
   - Nếu không có AC nào bao phủ được bug → đây là lỗ hổng của spec. Thêm AC mới vào spec trước.
2. Viết test tái hiện, tên `test("BUG-NNN AC-xxx-yy ...")` → **phải đỏ**.
3. Sửa code → xanh. Commit `fix(BUG-NNN): ... Refs: AC-xxx-yy`.
4. Test này giữ lại vĩnh viễn để chặn lỗi quay lại (regression guard).

## Nội dung nghề cũng theo "spec"

File `content/professions/*.json` có "spec" là `schema/profession.schema.json` + các luật R1–R7 trong `CLAUDE.md`. Phần kiểm tra tự động là `SPEC-001`. Thêm hoặc sửa nội dung nghề không cần spec mới, nhưng **phải qua `npm test`**.

## Quy ước test

- Runner: `node --test` cho script/nội dung, **Vitest** cho `src/` (khi dựng app). Test E2E bằng Playwright cho luồng người dùng (F1–F5).
- Đặt test cạnh phạm vi spec: `tests/spec-NNN/*.test.*`.
- Không mock engine khi test AC hành vi; chỉ mock Phaser renderer (engine tách logic khỏi render, xem SPEC-002).
- `npm test` phải xanh trước mỗi commit; CI chặn merge nếu có AC trong spec `approved` mà chưa có test.
