// BUG-005 — Unikey bật thì WASD trễ/đi quá: phím phải đọc theo KeyboardEvent.code (SPEC-031 R-6b).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { keyAction } from "../../src/game3d/layout.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");
const read = (p) => readFileSync(join(root, p), "utf8");

test("BUG-005 AC-031-21 keyAction theo code, không phụ thuộc bộ gõ", () => {
  const cases = [
    ["KeyW", "up"], ["KeyA", "left"], ["ArrowDown", "down"], ["KeyD", "right"],
    ["Space", "interact"], ["NumpadEnter", "interact"], ["KeyE", "interact"],
    ["", null], ["KeyQ", null], ["Backspace", null],
  ];
  for (const [code, want] of cases) assert.equal(keyAction(code), want, code);
  assert.equal(keyAction("KeyS"), "down");
  assert.equal(keyAction("ArrowUp"), "up");
  assert.equal(keyAction("Enter"), "interact");
});

test("BUG-005 AC-031-21 hai cảnh không còn tra phím bằng e.key", () => {
  for (const f of ["src/game3d/scene3d.ts", "src/game/scene.ts"]) {
    const src = read(f);
    assert.doesNotMatch(src, /KEY_DIR\[e\.key\]|INTERACT_KEYS\.has\(e\.key\)/, f);
    assert.match(src, /keyAction\(e\.code\)/, f);
    assert.match(src, /visibilitychange/, f);
  }
});
