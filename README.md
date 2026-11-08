# Bộ khởi động — Một Ngày Làm Nghề

Phát triển theo **SDD + TDD**, chế độ **tự chủ**: PRD → ROADMAP → Spec (chuẩn `specs/STANDARD.md`) → agent tự duyệt bằng hash → test đỏ → code xanh → `complete` (khóa test).

## Bắt đầu
1. `npm i && npm run check`: validate ✓, spec lint ✓, 14 test pass, truy vết OK.
2. `git init` và push lên GitLab. Sửa `CODEOWNERS` (thay `YOUR_GITLAB_USERNAME`), bật protected branch `main`, "Pipelines must succeed". Code Owner approval là tuỳ chọn (bật thì agent phải chờ người, chậm ship).
3. Copy `CLAUDE.md` → `AGENTS.md` cho Codex.
4. `npm run next` rồi tự xử lý mục **🤖 Chờ AGENT** (agent tự duyệt, tự implement, tự `complete`).
   Anh Son chỉ cần đọc lại diff các file `specs/`, `tests/`, `scripts/` khi review sau.
5. Mở Claude Code tại thư mục này. Hook tự chạy `npm run next` đầu phiên. Prompt gợi ý:
   > Làm các việc trong mục "Chờ AGENT" theo CLAUDE.md, trên nhánh mới, kết thúc bằng merge request.

## Gọi agent cho việc mới
| Anh muốn | Nói với Claude Code |
|---|---|
| Tính năng mới | "Yêu cầu mới: …" → agent viết SPEC, tự duyệt, implement, `complete` |
| Làm tiếp theo roadmap | "Làm hạng mục gợi ý tiếp theo" |
| Nghề mới | "Thêm nghề Điều dưỡng" → research theo R1–R8, `npm run check` |
| Báo bug | "Bug: …" → BUG-NNN + test tái hiện trong file mới |

## Lệnh
| Lệnh | Ai | Việc |
|---|---|---|
| `npm run next` | Cả hai (hook tự chạy) | Việc chờ ai + gợi ý tiếp theo |
| `npm run check` | Cả hai, CI | Cổng trước commit |
| `npm run approve SPEC-NNN -- --by "agent"` | Agent | Tự duyệt spec / mở khóa test khi test cũ sai thật |
| `npm run complete SPEC-NNN` | Agent | Hoàn tất spec + khóa test |
| `npm run scope [base]` | CI, người review | Phát hiện sửa lan sang spec khác |
| `npm run spec:lint` / `trace` | Agent | Lint spec / sinh ma trận truy vết |
