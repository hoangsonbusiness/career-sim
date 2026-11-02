#!/usr/bin/env node
// SPEC-003 R-8/R-9 — sinh src/types/profession.d.ts từ schema/profession.schema.json.
//   node scripts/gen-types.mjs           — ghi file
//   node scripts/gen-types.mjs --check   — exit 1 nếu file hiện có khác kết quả sinh lại
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { compile } from "json-schema-to-typescript";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const SCHEMA = join(root, "schema/profession.schema.json");
const OUT = join(root, "src/types/profession.d.ts");
const BANNER = "/* SINH TỰ ĐỘNG — không sửa tay. Nguồn: schema/profession.schema.json. Sinh lại: npm run types */";

const schema = JSON.parse(readFileSync(SCHEMA, "utf8"));
// json-schema-to-typescript lấy tên type gốc từ `title` hoặc `$id`; bỏ cả hai để tên luôn là `Profession` (R-8).
// $ref trong schema đều là "#/$defs/…" nên không cần $id.
delete schema.title;
delete schema.$id;
const ts = (await compile(schema, "Profession", { bannerComment: BANNER, cwd: dirname(SCHEMA), additionalProperties: false }))
  .replace(/\r\n/g, "\n");

if (process.argv.includes("--check")) {
  const cur = existsSync(OUT) ? readFileSync(OUT, "utf8") : null;
  if (cur !== ts) {
    console.error(`✗ ${cur === null ? "Chưa có" : "Đã cũ:"} src/types/profession.d.ts — chạy npm run types`);
    process.exit(1);
  }
  console.log("✓ Type khớp schema");
} else {
  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, ts);
  console.log("✓ Đã sinh src/types/profession.d.ts");
}
