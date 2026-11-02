#!/usr/bin/env node
// Kiểm tra PHẠM VI thay đổi: commit nói làm cho SPEC/BUG nào thì chỉ nên chạm file thuộc spec đó.
// Usage: node scripts/scope.mjs [base-ref] [--strict]
//   base-ref mặc định: origin/main (CI GitLab truyền $CI_MERGE_REQUEST_DIFF_BASE_SHA)
//   --strict: cảnh báo cũng làm exit 1
// Quy tắc:
//   - File test đã khóa của spec KHÁC bị sửa/xóa → LỖI (luôn luôn)
//   - File thuộc `owns` của spec KHÁC bị sửa → CẢNH BÁO
//   - File hạ tầng quy trình (scripts/, specs/STANDARD.md, CLAUDE.md, .gitlab-ci.yml) bị sửa → CẢNH BÁO
import { execSync } from "node:child_process";
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { listSpecs, ownsFile, root } from "./lib/spec.mjs";
import { readLock } from "./lib/lock.mjs";

const args = process.argv.slice(2);
const strict = args.includes("--strict");
const base = args.find((a) => !a.startsWith("--")) ?? "origin/main";
const git = (c) => execSync(`git ${c}`, { cwd: root, encoding: "utf8" }).trim();

let changed, messages;
try {
  changed = git(`diff --name-only ${base}...HEAD`).split("\n").filter(Boolean);
  messages = git(`log ${base}..HEAD --format=%s%n%b`);
} catch (e) {
  console.error(`✗ Không đọc được git diff so với '${base}': ${e.message.split("\n")[0]}`);
  process.exit(2);
}

// Spec mục tiêu = SPEC được nhắc trong commit + spec của các BUG được nhắc
const targets = new Set(messages.match(/SPEC-\d{3}/g) ?? []);
for (const bug of new Set(messages.match(/BUG-\d{3}/g) ?? [])) {
  const bugDir = join(root, "specs/bugs");
  const f = existsSync(bugDir) ? readdirSync(bugDir).find((n) => n.startsWith(bug)) : undefined;
  const spec = f && readFileSync(join(root, "specs/bugs", f), "utf8").match(/^spec:\s*(SPEC-\d{3})/m)?.[1];
  if (spec) targets.add(spec); else console.warn(`⚠ ${bug}: không tìm thấy file bug hoặc thiếu trường 'spec:'`);
}

const specs = listSpecs();
const errors = [], warnings = [];
const INFRA = [/^scripts\//, /^specs\/STANDARD\.md$/, /^specs\/locks\//, /^CLAUDE\.md$/, /^AGENTS\.md$/, /^\.gitlab-ci\.yml$/, /^CODEOWNERS$/, /^\.claude\//];

for (const rel of changed) {
  for (const s of specs) {
    const id = s.fm.id;
    if (targets.has(id)) continue;
    const lock = readLock(id);
    if (lock && rel in lock.files) errors.push(`${rel}: test ĐÃ KHÓA của ${id} bị thay đổi trong khi commit làm cho ${[...targets].join(", ") || "(không ghi spec)"}`);
    else if (ownsFile(s, rel)) warnings.push(`${rel}: thuộc ${id}, nhưng commit làm cho ${[...targets].join(", ") || "(không ghi spec)"}`);
  }
  if (INFRA.some((r) => r.test(rel))) warnings.push(`${rel}: file hạ tầng quy trình — cần người review kỹ`);
}

console.log(`Phạm vi: ${changed.length} file đổi so với ${base}; spec mục tiêu: ${[...targets].join(", ") || "—"}`);
warnings.forEach((w) => console.warn("⚠ " + w));
errors.forEach((e) => console.error("✗ " + e));
if (errors.length || (strict && warnings.length)) process.exit(1);
console.log(errors.length ? "" : "✓ Không có vi phạm phạm vi bắt buộc");
