// SPEC-031 — đọc file thế giới 3D và ghi công asset lúc build (Node). Không chạy trên trình duyệt.
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { World3D } from "./types";

export function loadWorld3D(professionId: string): World3D | null {
  const file = join(process.cwd(), "content/worlds3d", `${professionId}.json`);
  return existsSync(file) ? (JSON.parse(readFileSync(file, "utf8")) as World3D) : null;
}

/** R-19: một dòng ghi công cho mỗi bộ asset 3D, đọc từ License.txt gốc (tên bộ, tác giả, license). */
export function assetCredits(w: World3D): string[] {
  const files = [...new Set(Object.values(w.models).map((m) => m.license))];
  return files.map((f) => {
    const text = readFileSync(join(process.cwd(), "public", f.replace(/^\//, "")), "utf8");
    const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    const title = lines[0] ?? f;
    const author = /distributed by\s+([^(]+?)\s*(\(|$)/i.exec(text)?.[1] ?? "";
    const license = /License:\s*\(([^)]*)\)/i.exec(text)?.[1].split(",").pop()?.trim() ?? "xem License.txt";
    return `${author ? `${author} ` : ""}${title} (${license})`;
  });
}
