// SPEC-006 — vòng nhiệm vụ: các mode của game và điều kiện tương tác.
// Chỉ import kiểu từ grid: Node chạy .ts trực tiếp cần đuôi file, còn tsconfig không bật allowImportingTsExtensions.
import type { Dir, Pos } from "./grid";

export type GameMode = "intro" | "walk" | "task" | "result" | "reflection" | "done";

const DELTA: Record<Dir, Pos> = { up: { x: 0, y: -1 }, right: { x: 1, y: 0 }, down: { x: 0, y: 1 }, left: { x: -1, y: 0 } };

/** R-9: chỉ tương tác khi ô đang quay mặt vào đúng là target của segment hiện tại. */
export function canInteract(player: Pos, face: Dir, target: Pos): boolean {
  return player.x + DELTA[face].x === target.x && player.y + DELTA[face].y === target.y;
}
