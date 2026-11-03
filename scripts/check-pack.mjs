#!/usr/bin/env node
// SPEC-008 — kiểm chuẩn "gói sâu" (nghề có file thế giới) cho game: R-1..R-7.
//   node scripts/check-pack.mjs [--professions <dir>] [--worlds <dir>] [--public <dir>]
// Schema, luật trích nguồn và downsides đã do validate.mjs (SPEC-001) kiểm; file này chỉ kiểm phần game cần.
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const opt = (name, def) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : def; };
const profDir = opt("--professions", join(root, "content/professions"));
const worldDir = opt("--worlds", join(root, "content/worlds"));
const publicDir = opt("--public", join(root, "public"));

const TASK_TYPES = ["sequence", "choice", "drag_sort", "spot_error", "dialogue", "time_budget"];
const len = (s) => Array.from(s ?? "").length;

function check(id) {
  const errs = [], warns = [];
  const file = join(profDir, `${id}.json`);
  if (!existsSync(file)) return { errs: [`R-1: không có ${id}.json trong thư mục nghề`], warns };
  const p = JSON.parse(readFileSync(file, "utf8"));
  const sim = p.day_simulation;
  if (!sim) return { errs: ["R-1: không có day_simulation"], warns };
  const segs = sim.segments ?? [];

  // R-1
  if (segs.length !== 7) errs.push(`R-1: có ${segs.length} segment, cần đúng 7`);

  // R-2
  const count = Object.fromEntries(TASK_TYPES.map((t) => [t, 0]));
  for (const s of segs) count[s.task.type] = (count[s.task.type] ?? 0) + 1;
  const used = TASK_TYPES.filter((t) => count[t] > 0);
  if (used.length < 4) errs.push(`R-2: chỉ dùng ${used.length} loại task (${used.join(", ")}), cần ≥ 4`);
  for (const t of TASK_TYPES) if (count[t] > 2) errs.push(`R-2: loại ${t} xuất hiện ${count[t]} lần, tối đa 2`);

  // R-3
  const limit = (where, s, max) => { if (len(s) > max) errs.push(`R-3: ${where} dài ${len(s)} ký tự (tối đa ${max})`); };
  for (const s of segs) {
    const t = s.task;
    limit(`${s.id}.narrative`, s.narrative, 140);
    limit(`${s.id}.prompt`, t.prompt, 80);
    (t.options ?? []).forEach((o, k) => { limit(`${s.id}.options[${k}].text`, o.text, 90); if (o.feedback) limit(`${s.id}.options[${k}].feedback`, o.feedback, 120); });
    (t.turns ?? []).forEach((u, k) => u.replies.forEach((r, j) => { limit(`${s.id}.turns[${k}].replies[${j}].text`, r.text, 90); if (r.feedback) limit(`${s.id}.turns[${k}].replies[${j}].feedback`, r.feedback, 120); }));
    (t.steps ?? []).forEach((x, k) => limit(`${s.id}.steps[${k}]`, x, 70));
    (t.document ?? []).forEach((x, k) => limit(`${s.id}.document[${k}]`, x, 70));
    (t.items ?? []).forEach((x, k) => limit(`${s.id}.items[${k}].text`, x.text, 80));
    (t.activities ?? []).forEach((x, k) => limit(`${s.id}.activities[${k}].label`, x.label, 30));
    (t.errors ?? []).forEach((x, k) => limit(`${s.id}.errors[${k}].explain`, x.explain, 120));
  }

  // R-4
  const stats = sim.stats ?? [];
  if (stats.length !== 3) errs.push(`R-4: có ${stats.length} chỉ số, cần đúng 3`);
  for (const st of stats) if (len(st.label) > 18) errs.push(`R-4: label "${st.label}" dài ${len(st.label)} ký tự (tối đa 18)`);

  // R-5
  const testimony = (p.sources ?? []).filter((s) => s.type === "testimony");
  const publishers = new Set(testimony.map((s) => s.publisher));
  if (testimony.length < 2) errs.push(`R-5: có ${testimony.length} nguồn testimony, cần ≥ 2`);
  else if (publishers.size < 2) errs.push("R-5: các nguồn testimony phải từ ≥ 2 publisher khác nhau");
  const basisIds = new Set(segs.flatMap((s) => s.basis?.source_ids ?? []));
  for (const t of testimony) if (!basisIds.has(t.id)) errs.push(`R-5: nguồn testimony ${t.id} không được basis nào dùng`);

  // R-6
  if (p.meta?.status === "reviewed" && !p.meta?.reviewed_by) warns.push("cảnh báo R-6: status reviewed nhưng thiếu meta.reviewed_by");

  // R-7: dùng lại validate-world (SPEC-006) cho đúng một file thế giới
  const w = spawnSync(process.execPath, [join(root, "scripts/validate-world.mjs"), join(worldDir, `${id}.json`), "--professions", profDir, "--public", publicDir], { encoding: "utf8" });
  if (w.status !== 0) {
    const lines = (w.stdout + w.stderr).split("\n").filter((l) => l.trim().startsWith("- "));
    errs.push(...(lines.length ? lines : ["validate:world thất bại"]).map((l) => `R-7: ${l.trim().replace(/^- /, "")}`));
  }
  return { errs, warns };
}

const ids = existsSync(worldDir) ? readdirSync(worldDir).filter((f) => f.endsWith(".json")).map((f) => f.slice(0, -5)) : [];
let bad = 0;
for (const id of ids) {
  const { errs, warns } = check(id);
  if (errs.length) { bad++; console.error(`✗ ${id}`); errs.forEach((e) => console.error(`   - ${e}`)); }
  else console.log(`✓ ${id}`);
  warns.forEach((w) => console.log(`   ⚠ ${w}`));
}
if (ids.length === 0) console.log("(không có gói sâu nào)");
process.exit(bad ? 1 : 0);
