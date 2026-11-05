// BUG-006 — `npm test` phải dọn mọi thư mục tạm do test tạo ra, kể cả test đã khóa không tự dọn.
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");
const runner = join(root, "scripts/run-tests.mjs");

test("BUG-006 run-tests xóa thư mục tạm mà test bỏ lại", () => {
  const sandbox = mkdtempSync(join(tmpdir(), "bug006r-"));
  const fixtures = mkdtempSync(join(tmpdir(), "bug006f-"));
  try {
    // Test giả lập một test đã khóa: tạo thư mục tạm rồi bỏ đó.
    const leaky = join(fixtures, "leaky.test.mjs");
    writeFileSync(leaky, [
      'import { test } from "node:test";',
      'import { mkdtempSync, writeFileSync } from "node:fs";',
      'import { tmpdir } from "node:os";',
      'import { join } from "node:path";',
      'test("leak", () => { writeFileSync(join(mkdtempSync(join(tmpdir(), "leak-")), "f.txt"), "x"); });',
    ].join("\n"));
    const env = { ...process.env, TEMP: sandbox, TMP: sandbox, TMPDIR: sandbox };
    delete env.NODE_TEST_CONTEXT;
    const r = spawnSync(process.execPath, [runner, leaky], { env, encoding: "utf8" });
    assert.equal(r.status, 0, r.stdout + r.stderr);
    assert.match(r.stdout, /# pass 1/);
    assert.deepEqual(readdirSync(sandbox).filter((n) => n !== "node-compile-cache"), []);
  } finally {
    rmSync(sandbox, { recursive: true, force: true });
    rmSync(fixtures, { recursive: true, force: true });
  }
});

test("BUG-006 run-tests trả mã lỗi khác 0 khi test đỏ", () => {
  const fixtures = mkdtempSync(join(tmpdir(), "bug006f-"));
  try {
    const failing = join(fixtures, "failing.test.mjs");
    writeFileSync(failing, 'import { test } from "node:test";\ntest("đỏ", () => { throw new Error("x"); });\n');
    const env = { ...process.env };
    delete env.NODE_TEST_CONTEXT;
    const r = spawnSync(process.execPath, [runner, failing], { env, encoding: "utf8" });
    assert.notEqual(r.status, 0);
  } finally {
    rmSync(fixtures, { recursive: true, force: true });
  }
});
