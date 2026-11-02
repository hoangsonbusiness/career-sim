// Đọc specs/ROADMAP.md (bảng hạng mục) và tính hạng mục nào đã xong / sẵn sàng / bị chặn.
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { specDir } from "./spec.mjs";

export function readRoadmap() {
  const p = join(specDir, "ROADMAP.md");
  if (!existsSync(p)) return [];
  const rows = [];
  for (const m of readFileSync(p, "utf8").matchAll(/^\|\s*([A-Z0-9]{2,5})\s*\|([^\n]*)\|\s*$/gm)) {
    const [name, features, priority, deps, spec] = m[2].split("|").map((c) => c.trim());
    rows.push({
      key: m[1], name, features, priority,
      deps: deps === "—" || !deps ? [] : deps.split(",").map((s) => s.trim()),
      spec: /^SPEC-\d{3}$/.test(spec) ? spec : null,
    });
  }
  return rows;
}

/** specs: kết quả listSpecs(). Trả về các hạng mục kèm state: done | in_progress | ready | blocked */
export function evaluateRoadmap(rows, specs) {
  const status = Object.fromEntries(specs.map((s) => [s.fm.id, s.fm.status]));
  const done = new Set(rows.filter((r) => r.spec && status[r.spec] === "implemented").map((r) => r.key));
  const prio = (p) => Number(p?.replace(/\D/g, "") ?? 9);
  return rows
    .map((r) => {
      const missing = r.deps.filter((d) => !done.has(d));
      const state = done.has(r.key) ? "done" : r.spec ? "in_progress" : missing.length ? "blocked" : "ready";
      return { ...r, state, missing };
    })
    .sort((a, b) => prio(a.priority) - prio(b.priority) || rows.indexOf(a) - rows.indexOf(b));
}
