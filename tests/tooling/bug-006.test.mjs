// BUG-006 — test BUG-001 không được bỏ lại bản chép repo trong thư mục tạm.
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));

test("BUG-006 test BUG-001 dọn sạch thư mục tạm sau khi chạy", () => {
  const sandbox = mkdtempSync(join(tmpdir(), "bug006-"));
  try {
    const env = { ...process.env, TEMP: sandbox, TMP: sandbox, TMPDIR: sandbox };
    delete env.NODE_TEST_CONTEXT; // để tiến trình con chạy test thật thay vì báo về runner cha
    const r = spawnSync(process.execPath, ["--test", join(here, "bug-001.test.mjs")], { env, encoding: "utf8" });
    assert.equal(r.status, 0, r.stdout + r.stderr);
    assert.match(r.stdout, /# pass 1/);
    // node-compile-cache là bộ nhớ đệm của Node, không phải do test tạo ra.
    assert.deepEqual(readdirSync(sandbox).filter((n) => n !== "node-compile-cache"), []);
  } finally {
    rmSync(sandbox, { recursive: true, force: true });
  }
});
