// BUG-001 — `npm run complete` phải chạy được trên mọi hệ điều hành (kể cả Windows: npm là npm.cmd).
// Chạy trên một bản chép của repo để không đổi trạng thái spec thật.
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { cpSync, mkdtempSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");
// Không chép: .git, node_modules, test của chính thư mục này (tránh đệ quy), test cần dependency (spec-001 dùng ajv).
const SKIP = [".git", "node_modules", join("tests", "tooling"), join("tests", "spec-001"), join("specs", "locks", "SPEC-002.lock.json")];

test("BUG-001 complete chạy xong và chuyển spec sang implemented", () => {
  const dir = mkdtempSync(join(tmpdir(), "bug001-"));
  cpSync(root, dir, {
    recursive: true,
    filter: (src) => !SKIP.some((s) => { const r = relative(root, src); return r === s || r.startsWith(s + sep); }),
  });
  // Bản chép phải ở trạng thái "approved" dù spec thật đã complete; approved_hash vẫn khớp vì chỉ đổi frontmatter.
  const specFile = join(dir, "specs/SPEC-002-day-simulation-engine.md");
  writeFileSync(specFile, readFileSync(specFile, "utf8").replace(/^status: \w+$/m, "status: approved"));
  const r = spawnSync(process.execPath, [join(dir, "scripts/spec.mjs"), "complete", "SPEC-002"], { cwd: dir, encoding: "utf8" });
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.match(readFileSync(join(dir, "specs/SPEC-002-day-simulation-engine.md"), "utf8"), /^status: implemented$/m);
  assert.ok(existsSync(join(dir, "specs/locks/SPEC-002.lock.json")));
});
