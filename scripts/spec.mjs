#!/usr/bin/env node
// CLI quản lý vòng đời spec.
//   lint                          — lint mọi spec theo specs/STANDARD.md
//   approve SPEC-NNN [--by Tên]   — CHỈ CON NGƯỜI. Duyệt phần quy phạm; nếu spec đã implemented thì khóa lại test hiện tại
//   complete SPEC-NNN             — AGENT dùng khi xong: kiểm tra đủ test + test xanh → implemented + khóa test
//   next                          — việc đang chờ ai + gợi ý hạng mục tiếp theo từ ROADMAP
import { spawnSync } from "node:child_process";
import { listSpecs, lintSpec, normativeHash, setFrontmatter, openQuestions, root } from "./lib/spec.mjs";
import { testedAcs } from "./lib/tests.mjs";
import { readLock, writeLock, removeLock, verifyLock } from "./lib/lock.mjs";
import { readRoadmap, evaluateRoadmap } from "./lib/roadmap.mjs";

const [cmd, arg] = process.argv.slice(2);
const byIdx = process.argv.indexOf("--by");
const by = byIdx > 0 ? process.argv[byIdx + 1] : process.env.USER || "unknown";
const today = new Date().toISOString().slice(0, 10);
const find = (id) => listSpecs().find((x) => x.fm.id === id) ?? die(`Không tìm thấy ${id}`);
function die(msg) { console.error("✗ " + msg); process.exit(1); }

if (cmd === "lint") {
  let bad = 0;
  for (const s of listSpecs()) {
    const errs = lintSpec(s);
    if (errs.length) { bad++; console.error(`✗ ${s.file}`); errs.forEach((x) => console.error("   - " + x)); }
    else console.log(`✓ ${s.file}`);
  }
  process.exit(bad ? 1 : 0);
}

if (cmd === "approve") {
  const s = find(arg);
  const errs = [...lintSpec(s), ...openQuestions(s).map((q) => "câu hỏi mở chưa trả lời: " + q)];
  if (errs.length) die(`Không thể duyệt ${arg}:\n` + errs.map((x) => "   - " + x).join("\n"));
  const hash = normativeHash(s);
  const unchanged = !s.fm.approved_hash || s.fm.approved_hash === hash;
  if (s.fm.status === "implemented" && unchanged) {
    // Quy phạm không đổi: người duyệt chấp nhận bộ test HIỆN TẠI → khóa lại theo test hiện tại.
    setFrontmatter(s, { approved_hash: hash, approved_by: by, approved_at: today });
    writeLock(arg, by);
    console.log(`✓ ${arg} giữ implemented; đã khóa lại test hiện tại (bởi ${by})`);
  } else {
    // Spec mới hoặc quy phạm đã đổi → về approved, mở khóa test để agent làm TDD.
    setFrontmatter(s, { status: "approved", approved_hash: hash, approved_by: by, approved_at: today });
    removeLock(arg);
    console.log(`✓ ${arg} → approved (hash ${hash}, bởi ${by}); test được mở khóa để implement`);
  }
  process.exit(0);
}

if (cmd === "complete") {
  const s = find(arg);
  if (s.fm.status !== "approved") die(`${arg} đang ở '${s.fm.status}', chỉ spec 'approved' mới complete được`);
  if (s.fm.approved_hash !== normativeHash(s)) die(`${arg} đã đổi sau khi duyệt — cần người duyệt lại`);
  if (readLock(arg)) die(`${arg} đã có khóa test; chỉ người duyệt mới khóa lại được (npm run approve)`);
  const tested = testedAcs();
  const missing = s.acs.filter((a) => !tested.has(a));
  if (missing.length) die(`Còn AC chưa có test: ${missing.join(", ")}`);
  // shell: trên Windows npm là npm.cmd, không chạy được nếu không qua shell (BUG-001). Đối số là hằng số.
  const t = spawnSync("npm test --silent", { cwd: root, encoding: "utf8", shell: true });
  if (t.error) die("Không chạy được npm test: " + t.error.message);
  if (t.status !== 0) die("npm test chưa xanh:\n" + (t.stdout + t.stderr).split("\n").filter((l) => /not ok|fail/.test(l)).join("\n"));
  setFrontmatter(s, { status: "implemented" });
  const lock = writeLock(arg, `complete ${today}`);
  console.log(`✓ ${arg} → implemented; đã khóa ${Object.keys(lock.files).length} file test`);
  process.exit(0);
}

if (cmd === "next") {
  const specs = listSpecs();
  const tested = testedAcs();
  const human = [], agent = [], done = [];
  for (const s of specs) {
    const { id, version, title, status, approved_hash, approved_at } = s.fm;
    if (status === "deprecated") continue;
    const tag = `${id} v${version} — ${title}`;
    const missing = s.acs.filter((a) => !tested.has(a));
    const lockCheck = verifyLock(id);
    if (status === "draft") {
      const qs = openQuestions(s);
      human.push(`${tag}\n      DUYỆT: đọc spec${qs.length ? `, trả lời ${qs.length} câu hỏi mở` : ""} → npm run approve ${id} -- --by "Tên"`);
    } else if (approved_hash !== normativeHash(s)) {
      human.push(`${tag}\n      DUYỆT LẠI: phần quy phạm đã đổi sau lần duyệt ${approved_at}`);
    } else if (status === "implemented" && lockCheck?.violations.length) {
      human.push(`${tag}\n      XEM XÉT: test đã khóa bị thay đổi (${lockCheck.violations.join("; ")}). Nếu chấp nhận → npm run approve ${id}; nếu không → git checkout file đó`);
    } else if (missing.length) {
      agent.push(`${tag}\n      IMPLEMENT (TDD): ${missing.length} AC chưa có test: ${missing.join(", ")}`);
    } else if (status === "approved") {
      agent.push(`${tag}\n      HOÀN TẤT: mọi AC đã có test → npm run complete ${id}`);
    } else done.push(tag);
  }
  const show = (title, xs) => console.log(`\n${title} (${xs.length})\n` + (xs.length ? xs.map((x) => "  • " + x).join("\n") : "  —"));
  show("⏳ Chờ ANH SON", human);
  show("🤖 Chờ AGENT", agent);
  show("✅ Đã xong", done);

  const road = evaluateRoadmap(readRoadmap(), specs);
  if (road.length) {
    const ready = road.filter((r) => r.state === "ready");
    const blocked = road.filter((r) => r.state === "blocked");
    const nDone = road.filter((r) => r.state === "done").length;
    console.log(`\n💡 Gợi ý tiếp theo (ROADMAP: ${nDone}/${road.length} hạng mục xong)`);
    if (ready.length) {
      const [first, ...rest] = ready;
      console.log(`  ➜ Viết spec cho [${first.key}] ${first.name} (${first.priority}, ${first.features}) — phụ thuộc đã đủ`);
      rest.slice(0, 3).forEach((r) => console.log(`    sau đó: [${r.key}] ${r.name} (${r.priority})`));
    } else console.log("  — Không có hạng mục nào sẵn sàng; hoàn tất các spec đang làm trước.");
    blocked.slice(0, 3).forEach((r) => console.log(`    bị chặn: [${r.key}] ${r.name} — chờ ${r.missing.join(", ")}`));
  }
  process.exit(0);
}

console.error("Usage: spec.mjs lint | approve SPEC-NNN [--by Tên] | complete SPEC-NNN | next");
process.exit(2);
