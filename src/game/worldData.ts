// SPEC-006 — đọc file thế giới lúc build (Node). Không chạy trên trình duyệt.
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { WorldData } from "./types";

export function loadWorld(professionId: string): WorldData | null {
  const file = join(process.cwd(), "content/worlds", `${professionId}.json`);
  return existsSync(file) ? (JSON.parse(readFileSync(file, "utf8")) as WorldData) : null;
}
