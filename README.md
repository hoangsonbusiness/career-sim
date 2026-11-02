# Bộ khởi động — Một Ngày Làm Nghề

Phát triển theo **SDD + TDD**: PRD → ROADMAP → Spec (chuẩn `specs/STANDARD.md`) → duyệt bằng hash → test đỏ → code xanh → `complete` (khóa test).

## Bắt đầu
1. `npm i && npm run check`: validate ✓, spec lint ✓, 14 test pass, truy vết OK.
2. `git init` và push lên GitLab. Sửa `CODEOWNERS` (thay `YOUR_GITLAB_USERNAME`), bật protected branch `main`, "Pipelines must succeed", Code Owner approval.
3. Copy `CLAUDE.md` → `AGENTS.md` cho Codex.
4. `npm run next` rồi làm mục **⏳ Chờ ANH SON**:
   - Xác nhận SPEC-001 (đang duyệt tạm dưới tên `bootstrap-claude`): `npm run approve SPEC-001 -- --by "Son"`
   - Duyệt SPEC-002: đánh `[x]` 3 câu hỏi mục 6 → `npm run approve SPEC-002 -- --by "Son"`
5. Mở Claude Code tại thư mục này. Hook tự chạy `npm run next` đầu phiên. Prompt gợi ý:
   > Làm các việc trong mục "Chờ AGENT" theo CLAUDE.md, trên nhánh mới, kết thúc bằng merge request.

## Gọi agent cho việc mới
| Anh muốn | Nói với Claude Code |
|---|---|
| Tính năng mới | "Yêu cầu mới: …" → agent viết SPEC, dừng chờ duyệt |
| Làm tiếp theo roadmap | "Làm hạng mục gợi ý tiếp theo" |
| Nghề mới | "Thêm nghề Điều dưỡng" → research theo R1–R8, `npm run check` |
| Báo bug | "Bug: …" → BUG-NNN + test tái hiện trong file mới |

## Lệnh
| Lệnh | Ai | Việc |
|---|---|---|
| `npm run next` | Cả hai (hook tự chạy) | Việc chờ ai + gợi ý tiếp theo |
| `npm run check` | Cả hai, CI | Cổng trước commit |
| `npm run approve SPEC-NNN -- --by "Tên"` | **Chỉ người** | Duyệt spec / chấp nhận thay đổi test đã khóa |
| `npm run complete SPEC-NNN` | Agent | Hoàn tất spec + khóa test |
| `npm run scope [base]` | CI, người review | Phát hiện sửa lan sang spec khác |
| `npm run spec:lint` / `trace` | Agent | Lint spec / sinh ma trận truy vết |
