#!/usr/bin/env node
// Sinh specs/TRACEABILITY.md: Feature → SPEC → AC → test, và kiểm tra cổng duyệt.
// Lỗi (exit 1) khi:
//   - spec approved/implemented nhưng thiếu approved_hash, hoặc phần quy phạm đã đổi sau khi duyệt
//   - spec approved/implemented còn AC chưa có test
//   - test tham chiếu AC không tồn tại
// Usage: node scripts/trace.mjs [--check]
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { listSpecs, normativeHash, specDir } from "./lib/spec.mjs";
import { testedAcs } from "./lib/tests.mjs";
import { verifyLock } from "./lib/lock.mjs";

const checkOnly = process.argv.includes("--check");
const specs = listSpecs();
const acToTests = testedAcs();
const problems = [];

let md = `# Ma trận truy vết\n\n> Tự sinh bởi \`npm run trace\` — không sửa tay.\n\n`;
md += `| Spec | Ver | Trạng thái | Duyệt | Features | AC có test |\n|---|---|---|---|---|---|\n`;
for (const s of specs) {
  const { id, title, status, features, version, approved_hash, approved_by, approved_at } = s.fm;
  const gated = ["approved", "implemented"].includes(status);
  const hash = normativeHash(s);
  let approval = "—";
  if (gated) {
    if (!approved_hash) { approval = "❌ chưa có hash"; problems.push(`${id}: status=${status} nhưng chưa được duyệt bằng \`npm run approve ${id}\``); }
    else if (approved_hash !== hash) { approval = "❌ đã đổi sau duyệt"; problems.push(`${id}: phần quy phạm (mục 2–4) đã thay đổi sau lần duyệt ${approved_at} — cần anh Son duyệt lại`); }
    else approval = `✓ ${approved_by} ${approved_at}`;
  }
  if (status === "implemented") {
    const v = verifyLock(id);
    if (!v) problems.push(`${id}: implemented nhưng chưa khóa test — chạy \`npm run complete\` (hoặc người duyệt chạy approve)`);
    else v.violations.forEach((x) => problems.push(`${id}: test đã khóa — ${x}. Hoàn tác bằng git, hoặc người duyệt chấp nhận bằng \`npm run approve ${id}\``));
  }
  const covered = s.acs.filter((a) => acToTests.has(a)).length;
  md += `| [${id}](${s.file}) ${title} | ${version} | ${status} | ${approval} | ${features} | ${covered}/${s.acs.length} |\n`;
  if (gated) for (const a of s.acs) if (!acToTests.has(a)) problems.push(`${a} (${id}, ${status}) chưa có test`);
}
for (const s of specs) {
  md += `\n## ${s.fm.id} — ${s.fm.title}\n\n| AC | Test |\n|---|---|\n`;
  for (const a of s.acs) md += `| ${a} | ${acToTests.get(a)?.join("<br>") ?? "❌ chưa có"} |\n`;
}
const known = new Set(specs.flatMap((s) => s.acs));
for (const a of acToTests.keys()) if (!known.has(a)) problems.push(`Test tham chiếu ${a} nhưng không spec nào định nghĩa AC này`);

if (!checkOnly) writeFileSync(join(specDir, "TRACEABILITY.md"), md);
if (problems.length) {
  console.error("✗ Truy vết chưa đạt:\n" + problems.map((p) => "   - " + p).join("\n"));
  process.exit(1);
}
console.log(`✓ Truy vết OK — ${specs.length} spec, ${known.size} AC, ${[...acToTests.keys()].length} AC có test`);
