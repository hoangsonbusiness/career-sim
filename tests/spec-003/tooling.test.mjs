// SPEC-003 — sinh type, typecheck, script check, ghim phiên bản.
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { cpSync, mkdtempSync, readFileSync, writeFileSync, symlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");
const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
const node = (args, cwd = root) => spawnSync(process.execPath, args, { cwd, encoding: "utf8" });

test("AC-003-07 type đã sinh khớp schema → types:check exit 0", () => {
  const r = node([join(root, "scripts/gen-types.mjs"), "--check"]);
  assert.equal(r.status, 0, r.stdout + r.stderr);
});

test("AC-003-08 schema đổi mà chưa sinh lại type → types:check exit 1", () => {
  const dir = mkdtempSync(join(tmpdir(), "spec003-types-"));
  const SKIP = ["node_modules", ".git", ".next", "out"];
  cpSync(root, dir, { recursive: true, filter: (src) => { const r = relative(root, src); return !SKIP.some((s) => r === s || r.startsWith(s + sep)); } });
  symlinkSync(join(root, "node_modules"), join(dir, "node_modules"), "junction");
  // Trước khi đổi schema, bản chép phải sạch: tránh "xanh giả" khi script không tồn tại (cũng exit 1).
  const clean = node([join(dir, "scripts/gen-types.mjs"), "--check"], dir);
  assert.equal(clean.status, 0, clean.stdout + clean.stderr);
  const schemaFile = join(dir, "schema/profession.schema.json");
  const schema = JSON.parse(readFileSync(schemaFile, "utf8"));
  schema.properties.ac_003_08_extra = { type: "string" };
  writeFileSync(schemaFile, JSON.stringify(schema, null, 2));
  const r = node([join(dir, "scripts/gen-types.mjs"), "--check"], dir);
  assert.equal(r.status, 1, r.stdout + r.stderr);
});

test("AC-003-09 typecheck strict không lỗi", () => {
  const ts = JSON.parse(readFileSync(join(root, "tsconfig.json"), "utf8"));
  assert.equal(ts.compilerOptions.strict, true);
  const r = spawnSync("npm run typecheck --silent", { cwd: root, encoding: "utf8", shell: true });
  assert.equal(r.status, 0, r.stdout + r.stderr);
});

test("AC-003-10 script check chạy types:check và typecheck trước npm test", () => {
  const check = pkg.scripts.check;
  const t = check.indexOf("npm test");
  assert.ok(t >= 0, check);
  for (const s of ["types:check", "typecheck"]) {
    const i = check.indexOf(s);
    assert.ok(i >= 0 && i < t, `${s} phải đứng trước npm test: ${check}`);
  }
});

test("AC-003-16 6 gói lõi được ghim phiên bản chính xác", () => {
  const all = { ...pkg.dependencies, ...pkg.devDependencies };
  for (const name of ["next", "react", "react-dom", "typescript", "tailwindcss", "json-schema-to-typescript"]) {
    assert.match(all[name] ?? "(thiếu)", /^\d+\.\d+\.\d+$/, name);
  }
});
