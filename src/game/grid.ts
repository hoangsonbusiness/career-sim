// SPEC-006 — logic lưới thuần: di chuyển theo ô, va chạm, tìm đường, chỗ đứng tương tác.
// Không phụ thuộc Phaser để test được không cần trình duyệt.

export type Dir = "up" | "right" | "down" | "left";
export interface Pos { x: number; y: number }
export interface Grid { width: number; height: number; solid: (0 | 1)[] }

// Thứ tự cố định up, right, down, left (R-6, R-7).
export const DIRS: Dir[] = ["up", "right", "down", "left"];
const DELTA: Record<Dir, Pos> = { up: { x: 0, y: -1 }, right: { x: 1, y: 0 }, down: { x: 0, y: 1 }, left: { x: -1, y: 0 } };
const OPPOSITE: Record<Dir, Dir> = { up: "down", right: "left", down: "up", left: "right" };

const same = (a: Pos, b: Pos) => a.x === b.x && a.y === b.y;

export function facingTile(p: Pos, d: Dir): Pos {
  return { x: p.x + DELTA[d].x, y: p.y + DELTA[d].y };
}

export function isWalkable(g: Grid, p: Pos, blocked: Pos[]): boolean {
  if (p.x < 0 || p.y < 0 || p.x >= g.width || p.y >= g.height) return false;
  if (g.solid[p.y * g.width + p.x] === 1) return false;
  return !blocked.some((b) => same(b, p));
}

/** R-5: một bước theo hướng d, bị chặn thì đứng yên. */
export function step(g: Grid, p: Pos, d: Dir, blocked: Pos[]): Pos {
  const n = facingTile(p, d);
  return isWalkable(g, n, blocked) ? n : { x: p.x, y: p.y };
}

/** R-6: BFS 4 hướng; kết quả không gồm `from`, gồm `to`. */
export function findPath(g: Grid, from: Pos, to: Pos, blocked: Pos[]): Pos[] | null {
  if (same(from, to)) return [];
  if (!isWalkable(g, to, blocked)) return null;
  const key = (p: Pos) => p.y * g.width + p.x;
  const prev = new Map<number, Pos>([[key(from), from]]);
  const queue: Pos[] = [from];
  for (let i = 0; i < queue.length; i++) {
    const cur = queue[i];
    for (const d of DIRS) {
      const n = facingTile(cur, d);
      if (prev.has(key(n)) || !isWalkable(g, n, blocked)) continue;
      prev.set(key(n), cur);
      if (same(n, to)) {
        const path: Pos[] = [n];
        for (let p = cur; !same(p, from); p = prev.get(key(p))!) path.unshift(p);
        return path;
      }
      queue.push(n);
    }
  }
  return null;
}

/** R-7: ô kề target đi được, kèm hướng quay mặt vào target. */
export function standSpots(g: Grid, target: Pos, blocked: Pos[]): { pos: Pos; face: Dir }[] {
  return DIRS.map((d) => ({ pos: facingTile(target, d), face: OPPOSITE[d] })).filter((s) => isWalkable(g, s.pos, blocked));
}
