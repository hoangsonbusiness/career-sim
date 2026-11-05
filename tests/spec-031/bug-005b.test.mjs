// BUG-005 (lần 2) — Unikey nuốt keydown thật; bắt lần bấm qua keyup (SPEC-031 R-6c, R-6d).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createKeyTracker } from "../../src/game3d/layout.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");
const read = (p) => readFileSync(join(root, p), "utf8");

test("BUG-005 AC-031-22 tracker khớp vector ghi thật từ Unikey", () => {
  const V = JSON.parse(read("tests/spec-031/vectors-keys.json"));
  for (const c of V.cases) {
    const t = createKeyTracker();
    const got = c.events.map(([kind, code, keyCode]) => (kind === "down" ? t.down(code, keyCode) : t.up(code)));
    assert.deepEqual(got, c.expect, c.name);
    assert.equal(t.imeSeen(), c.imeSeen, c.name);
  }
});

test("BUG-005 AC-031-23 hai cảnh dùng tracker; GamePlayer có gợi ý tắt bộ gõ", () => {
  for (const f of ["src/game3d/scene3d.ts", "src/game/scene.ts"]) assert.match(read(f), /createKeyTracker\(\)/, f);
  assert.ok(read("src/game/GamePlayer.tsx").includes("Bộ gõ tiếng Việt đang bật: tắt bộ gõ (thường là Ctrl + Shift) hoặc dùng phím mũi tên để giữ phím đi liên tục."));
});
