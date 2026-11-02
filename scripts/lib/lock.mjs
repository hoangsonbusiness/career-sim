// Khóa test của một spec: ghi SHA-256 từng file trong tests/spec-NNN/ vào specs/locks/SPEC-NNN.lock.json.
// Sau khi khóa: SỬA hoặc XÓA file đã khóa → check fail. THÊM file mới (ví dụ test cho bug) → được phép.
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, statSync, rmSync } from "node:fs";
import { join, relative } from "node:path";
import { createHash } from "node:crypto";
import { root, specDir } from "./spec.mjs";

const lockDir = join(specDir, "locks");
export const lockPath = (id) => join(lockDir, `${id}.lock.json`);
export const testDirOf = (id) => join(root, "tests", id.toLowerCase());

const sha = (p) => createHash("sha256").update(readFileSync(p)).digest("hex").slice(0, 16);

function walk(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
}

export function readLock(id) {
  return existsSync(lockPath(id)) ? JSON.parse(readFileSync(lockPath(id), "utf8")) : null;
}

export function writeLock(id, by) {
  mkdirSync(lockDir, { recursive: true });
  const files = Object.fromEntries(walk(testDirOf(id)).sort().map((p) => [relative(root, p), sha(p)]));
  const lock = { spec: id, locked_by: by, locked_at: new Date().toISOString().slice(0, 10), files };
  writeFileSync(lockPath(id), JSON.stringify(lock, null, 2) + "\n");
  return lock;
}

export function removeLock(id) {
  if (existsSync(lockPath(id))) rmSync(lockPath(id));
}

/** So file hiện tại với lock. Trả về { violations: string[], added: string[] } */
export function verifyLock(id) {
  const lock = readLock(id);
  if (!lock) return null;
  const violations = [];
  for (const [rel, h] of Object.entries(lock.files)) {
    const p = join(root, rel);
    if (!existsSync(p)) violations.push(`${rel} đã bị XÓA`);
    else if (sha(p) !== h) violations.push(`${rel} đã bị SỬA`);
  }
  const added = walk(testDirOf(id)).map((p) => relative(root, p)).filter((r) => !(r in lock.files));
  return { violations, added };
}
