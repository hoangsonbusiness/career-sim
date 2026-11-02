// Tìm các AC được test tham chiếu (tên test chứa mã AC). Dùng chung cho trace.mjs và spec.mjs.
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { root } from "./spec.mjs";

function walk(dir) {
  let out = [];
  for (const f of readdirSync(dir)) {
    if (f === "node_modules" || f.startsWith(".")) continue;
    const p = join(dir, f);
    if (statSync(p).isDirectory()) out = out.concat(walk(p));
    else out.push(p);
  }
  return out;
}

/** Map<AC id, string[] mô tả test> */
export function testedAcs() {
  const files = ["tests", "src"]
    .map((d) => join(root, d))
    .flatMap((d) => { try { return walk(d); } catch { return []; } })
    .filter((f) => /\.(test|spec)\.(m?[jt]sx?)$/.test(f));
  const map = new Map();
  for (const f of files) {
    const text = readFileSync(f, "utf8");
    for (const m of text.matchAll(/(?:test|it)\(\s*["'`]((?:BUG-\d{3}\s+)?(AC-\d{3}-\d{2})[^"'`]*)/g)) {
      const list = map.get(m[2]) ?? [];
      list.push(`${relative(root, f)} — "${m[1].slice(0, 60)}"`);
      map.set(m[2], list);
    }
  }
  return map;
}
