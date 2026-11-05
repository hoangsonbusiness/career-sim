// BUG-006 — chạy test với thư mục tạm riêng, rồi xóa sạch thư mục đó dù test xanh hay đỏ.
// Nhờ vậy cả các test đã khóa (không tự dọn mkdtempSync) cũng không làm đầy ổ C.
// Dùng: node scripts/run-tests.mjs [file test ...]   (mặc định: tests/**/*.test.mjs)
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const files = process.argv.slice(2);
const targets = files.length ? files : ["tests/**/*.test.mjs"];
const sandbox = mkdtempSync(join(tmpdir(), "career-sim-test-"));
const env = { ...process.env, TEMP: sandbox, TMP: sandbox, TMPDIR: sandbox };

let status = 1;
try {
  const r = spawnSync(process.execPath, ["--test", "--test-concurrency=1", ...targets], { env, stdio: "inherit" });
  if (r.error) console.error(`Không chạy được node --test: ${r.error.message}`);
  status = r.status ?? 1;
} finally {
  rmSync(sandbox, { recursive: true, force: true, maxRetries: 3 });
}
process.exit(status);
