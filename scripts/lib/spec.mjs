// Thư viện dùng chung cho các công cụ spec: parse, hash phần quy phạm, lint theo specs/STANDARD.md.
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";

export const root = join(dirname(fileURLToPath(import.meta.url)), "../..");
export const specDir = join(root, "specs");

const FM_RE = /^---\n([\s\S]*?)\n---\n/;

export function parseSpec(file) {
  const path = join(specDir, file);
  const text = readFileSync(path, "utf8").replace(/\r\n/g, "\n");
  const fmRaw = text.match(FM_RE)?.[1] ?? "";
  const fm = {};
  for (const line of fmRaw.split("\n")) {
    const m = line.match(/^(\w+):\s*(.*?)\s*(#.*)?$/);
    if (m) fm[m[1]] = m[2];
  }
  fm.ownsList = (fm.owns ?? "").replace(/^\[|\]$/g, "").split(",").map((s) => s.trim()).filter(Boolean);
  const body = text.replace(FM_RE, "");
  const sections = {};
  for (const m of body.matchAll(/^## (\d+)\.[^\n]*\n([\s\S]*?)(?=^## \d+\.|(?![\s\S]))/gm)) sections[m[1]] = m[2];
  const acRows = [...body.matchAll(/^\|\s*(AC-\d{3}-\d{2})\s*\|(.*)\|\s*$/gm)].map((m) => ({
    id: m[1],
    cells: m[2].split("|").map((c) => c.trim()),
  }));
  return { file, path, text, fm, body, sections, acRows, acs: acRows.map((r) => r.id) };
}

export function listSpecs() {
  return readdirSync(specDir)
    .filter((f) => /^SPEC-\d{3}-.*\.md$/.test(f))
    .sort()
    .map(parseSpec);
}

/** Hash phần QUY PHẠM: mục 2 (phạm vi), 3 (thiết kế), 4 (AC). Sửa lịch sử/ghi chú không đổi hash. */
export function normativeHash(spec) {
  const norm = ["2", "3", "4"]
    .map((k) => (spec.sections[k] ?? "").split("\n").map((l) => l.trimEnd()).join("\n").trim())
    .join("\n§\n");
  return createHash("sha256").update(norm).digest("hex").slice(0, 16);
}

export function setFrontmatter(spec, updates) {
  let fmRaw = spec.text.match(FM_RE)[1];
  for (const [k, v] of Object.entries(updates)) {
    const re = new RegExp(`^${k}:.*$`, "m");
    fmRaw = re.test(fmRaw) ? fmRaw.replace(re, `${k}: ${v}`) : `${fmRaw}\n${k}: ${v}`;
  }
  writeFileSync(spec.path, spec.text.replace(FM_RE, `---\n${fmRaw}\n---\n`));
}

/** Lint theo specs/STANDARD.md. Trả về mảng lỗi (rỗng = đạt). */
export function lintSpec(spec) {
  const e = [];
  const id = spec.fm.id;
  const num = id?.match(/^SPEC-(\d{3})$/)?.[1];
  if (!num) e.push("ST-01 frontmatter thiếu/sai `id`");
  if (!spec.file.startsWith(`${id}-`)) e.push("ST-01 tên file phải bắt đầu bằng id");
  for (const k of ["title", "status", "features", "owner", "version", "owns"])
    if (!spec.fm[k]) e.push(`ST-01 frontmatter thiếu \`${k}\``);
  if (spec.fm.status && !["draft", "approved", "implemented", "deprecated"].includes(spec.fm.status))
    e.push(`ST-01 status không hợp lệ: ${spec.fm.status}`);
  for (const n of ["1", "2", "3", "4", "5", "6", "7"]) if (!(n in spec.sections)) e.push(`ST-02 thiếu mục "## ${n}."`);

  const design = spec.sections["3"] ?? "";
  if (!/\b(PHẢI|KHÔNG ĐƯỢC)\b/.test(design)) e.push("ST-03 mục 3 không có từ khóa quy phạm PHẢI / KHÔNG ĐƯỢC");
  if (/\b(nên|có thể|tùy|khoảng|hợp lý|phù hợp|v\.v\.|\.\.\.)\b/i.test(stripCode(design)))
    e.push("ST-04 mục 3 có từ mơ hồ (nên/có thể/tùy/khoảng/hợp lý/phù hợp/v.v.) — thay bằng quy tắc cụ thể");

  if (spec.acRows.length === 0) e.push("ST-05 không có AC nào");
  spec.acRows.forEach((r, i) => {
    const want = `AC-${num}-${String(i + 1).padStart(2, "0")}`;
    if (r.id !== want) e.push(`ST-05 ${r.id}: mã AC phải liên tục, mong đợi ${want}`);
    if (r.cells.length < 3 || r.cells.slice(0, 3).some((c) => !c)) e.push(`ST-05 ${r.id}: thiếu Given/When/Then`);
    if (r.cells[2] && /\b(đúng|hợp lý|phù hợp|ổn|tốt|nhanh)\b/i.test(r.cells[2]) && !/[`=<>≤≥\d]/.test(r.cells[2]))
      e.push(`ST-06 ${r.id}: Then mơ hồ, phải có giá trị/điều kiện kiểm được bằng máy`);
  });
  return e;
}

export function openQuestions(spec) {
  return [...(spec.sections["6"] ?? "").matchAll(/^- \[ \] (.+)$/gm)].map((m) => m[1]);
}

/** Khớp đường dẫn với pattern trong `owns`: "dir/**" = mọi file dưới dir; còn lại = khớp chính xác. */
export function ownsFile(spec, rel) {
  return spec.fm.ownsList.some((p) => (p.endsWith("/**") ? rel.startsWith(p.slice(0, -2)) : rel === p));
}

function stripCode(s) {
  return s.replace(/```[\s\S]*?```/g, "").replace(/`[^`]*`/g, "");
}
