// SPEC-003 — lớp nạp nội dung nghề. Chỉ chạy lúc build (Node), không chạy trên trình duyệt (R-16).
// Không kiểm tra schema: việc đó thuộc scripts/validate.mjs (R-5).
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import type { Profession } from "../types/profession";

export type { Profession };

export type ContentErrorCode = "CONTENT_PARSE_ERROR" | "CONTENT_ID_MISMATCH";

export class ContentError extends Error {
  code: ContentErrorCode;
  file: string;
  constructor(code: ContentErrorCode, file: string, message: string) {
    super(`${code}: ${file}: ${message}`);
    this.name = "ContentError";
    this.code = code;
    this.file = file;
  }
}

const defaultDir = () => join(process.cwd(), "content/professions");

// R-2: so sánh theo code unit, không theo locale.
const byCodeUnit = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);

export function loadProfessions(dir: string = defaultDir()): Profession[] {
  // R-1: chỉ file đuôi ".json" (phân biệt hoa thường) ở cấp gốc; R-6: đọc theo tên file tăng dần.
  const files = readdirSync(dir)
    .filter((f) => f.endsWith(".json") && statSync(join(dir, f)).isFile())
    .sort(byCodeUnit);
  const out: Profession[] = [];
  for (const file of files) {
    let data: Profession;
    try {
      data = JSON.parse(readFileSync(join(dir, file), "utf8"));
    } catch (e) {
      throw new ContentError("CONTENT_PARSE_ERROR", file, (e as Error).message); // R-3
    }
    const stem = file.slice(0, -".json".length);
    if (data?.id !== stem) {
      throw new ContentError("CONTENT_ID_MISMATCH", file, `id = ${JSON.stringify(data?.id)}`); // R-4
    }
    out.push(data);
  }
  return out.sort((a, b) => byCodeUnit(a.id, b.id));
}

export function getProfession(id: string, dir?: string): Profession | null {
  return loadProfessions(dir).find((p) => p.id === id) ?? null; // R-7
}
