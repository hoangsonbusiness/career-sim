#!/usr/bin/env node
// Validate content/professions/*.json: JSON Schema + các luật trích nguồn trong CLAUDE.md (R1–R7).
// Usage: node scripts/validate.mjs [file...]
import { readFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const schema = JSON.parse(readFileSync(join(root, "schema/profession.schema.json"), "utf8"));
const ajv = new Ajv2020({ allErrors: true, strict: false });
addFormats(ajv);
const validateSchema = ajv.compile(schema);

const dir = join(root, "content/professions");
const files = process.argv.slice(2).length
  ? process.argv.slice(2)
  : readdirSync(dir).filter((f) => f.endsWith(".json")).map((f) => join(dir, f));

// Duyệt mọi Item (có field kind) trong cây JSON, kèm đường dẫn.
function* items(node, path = "$") {
  if (Array.isArray(node)) {
    for (let i = 0; i < node.length; i++) yield* items(node[i], `${path}[${i}]`);
  } else if (node && typeof node === "object") {
    if (node.kind === "fact" || node.kind === "advice") yield [path, node];
    for (const [k, v] of Object.entries(node)) yield* items(v, `${path}.${k}`);
  }
}

let failed = 0;
for (const file of files) {
  const errors = [];
  const warnings = [];
  let data;
  try {
    data = JSON.parse(readFileSync(file, "utf8"));
  } catch (e) {
    console.error(`✗ ${file}: JSON không hợp lệ — ${e.message}`);
    failed++;
    continue;
  }

  if (!validateSchema(data)) {
    for (const e of validateSchema.errors) errors.push(`schema ${e.instancePath || "/"} ${e.message}`);
  }

  const sources = new Map((data.sources ?? []).map((s) => [s.id, s]));
  const used = new Set();

  // Nguồn: id trùng, law thiếu effective_date
  if (sources.size !== (data.sources ?? []).length) errors.push("sources: có id trùng");
  for (const s of sources.values()) {
    if (s.type === "law" && !s.effective_date) errors.push(`${s.id}: nguồn law thiếu effective_date (R2)`);
  }

  for (const [path, it] of items(data)) {
    const ids = it.source_ids ?? [];
    ids.forEach((id) => used.add(id));
    for (const id of ids) if (!sources.has(id)) errors.push(`${path}: source_id ${id} không tồn tại`);

    if (it.kind === "fact") {
      if (ids.length === 0 && it.confidence !== "needs_verification")
        errors.push(`${path}: fact không có nguồn mà không gắn needs_verification (R1)`);
      if (it.confidence === "verified") {
        const types = ids.map((id) => sources.get(id)?.type);
        const primary = types.some((t) => t === "law" || t === "official_stat");
        if (!primary && ids.length < 2) errors.push(`${path}: 'verified' cần nguồn law/official_stat hoặc ≥2 nguồn (R3)`);
        if (types.length && types.every((t) => t === "testimony" || t === "reference") && /\d/.test(it.text))
          errors.push(`${path}: số liệu chỉ dựa trên testimony/reference (R2)`);
      }
      if (it.confidence === "needs_verification" && !it.note)
        errors.push(`${path}: needs_verification phải có note nói rõ cần kiểm chứng gì`);
    }
    if (it.kind === "advice" && /\b(Thông tư|Nghị định|Luật)\b|\d+[.,]?\d*\s*(triệu|đồng|%|tiết)/i.test(it.text))
      errors.push(`${path}: advice không được chứa quy định pháp lý/con số — chuyển thành fact (R1)`);
  }

  // Mỗi segment phải có basis là fact
  for (const [i, seg] of (data.day_simulation?.segments ?? []).entries()) {
    if (seg.basis?.kind !== "fact") errors.push(`segments[${i}].basis phải là fact (R6)`);
  }
  // downsides tối thiểu 3 fact
  if ((data.downsides ?? []).filter((d) => d.kind === "fact").length < 3) errors.push("downsides cần ≥3 fact (R7)");

  // Ladder: edge trỏ đúng node
  const nodeIds = new Set((data.career_ladder?.nodes ?? []).map((n) => n.id));
  for (const e of data.career_ladder?.edges ?? []) {
    if (!nodeIds.has(e.from) || !nodeIds.has(e.to)) errors.push(`ladder edge ${e.from}→${e.to}: node không tồn tại`);
  }

  // Effect phải dùng stat đã khai báo
  const statIds = new Set((data.day_simulation?.stats ?? []).map((s) => s.id));
  const checkEffect = (eff, where) => {
    for (const k of Object.keys(eff ?? {})) if (!statIds.has(k)) errors.push(`${where}: stat '${k}' chưa khai báo`);
  };
  (function walk(n, p) {
    if (Array.isArray(n)) return n.forEach((x, i) => walk(x, `${p}[${i}]`));
    if (n && typeof n === "object")
      for (const [k, v] of Object.entries(n)) {
        if (["effect", "on_success", "on_fail", "effect_per_30min"].includes(k)) checkEffect(v, `${p}.${k}`);
        else walk(v, `${p}.${k}`);
      }
  })(data.day_simulation, "$.day_simulation");

  for (const id of sources.keys()) if (!used.has(id)) warnings.push(`${id}: nguồn không được dùng (mồ côi)`);

  const stats = [...items(data)].reduce(
    (a, [, it]) => (it.kind === "fact" ? (a[it.confidence] = (a[it.confidence] ?? 0) + 1, a) : a),
    {}
  );

  if (errors.length) {
    failed++;
    console.error(`✗ ${file}`);
    errors.forEach((e) => console.error(`   - ${e}`));
  } else {
    console.log(`✓ ${file}  facts: ${JSON.stringify(stats)}`);
  }
  warnings.forEach((w) => console.warn(`   ⚠ ${w}`));
}
process.exit(failed ? 1 : 0);
