// SPEC-031 — hàm thuần của cảnh 3D: toạ độ, camera, ánh xạ phím, chọn ô bằng tia, chất lượng, renderer.
// Không phụ thuộc Three.js để test được không cần trình duyệt. Chỉ import kiểu (Node chạy .ts cần đuôi file).
import type { Dir, Pos } from "../game/grid";

export type Quarter = 0 | 1 | 2 | 3;
export interface Vec3 { x: number; y: number; z: number }

const DIRS: Dir[] = ["up", "right", "down", "left"];
const YAW: Record<Dir, number> = { up: 0, right: 90, down: 180, left: 270 };

/** R-4b: 1 ô = 1 m; tâm ô. */
export function tileToWorld(p: Pos): { x: number; z: number } {
  return { x: p.x + 0.5, z: p.y + 0.5 };
}

/** R-4b */
export function worldToTile(x: number, z: number, width: number, height: number): Pos | null {
  const tx = Math.floor(x);
  const ty = Math.floor(z);
  if (tx < 0 || ty < 0 || tx >= width || ty >= height) return null;
  return { x: tx, y: ty };
}

/** R-6: "lên" luôn là đi xa khỏi camera. */
export function rotateDir(d: Dir, q: Quarter): Dir {
  return DIRS[(DIRS.indexOf(d) + q) % 4];
}

/** R-7 */
export function snapQuarter(yawDeg: number): Quarter {
  return ((((Math.round(yawDeg / 90) % 4) + 4) % 4) as Quarter);
}

/** R-8: giao tia với mặt đất y = 0. */
export function pickTile(origin: Vec3, dir: Vec3, width: number, height: number): Pos | null {
  if (dir.y >= 0) return null;
  const s = -origin.y / dir.y;
  return worldToTile(origin.x + s * dir.x, origin.z + s * dir.z, width, height);
}

function dirBetween(from: Pos, to: Pos): Dir | null {
  if (to.x > from.x) return "right";
  if (to.x < from.x) return "left";
  if (to.y < from.y) return "up";
  if (to.y > from.y) return "down";
  return null;
}

/** R-5: chặn t vào [0,1] rồi nội suy tuyến tính; from = to → yaw 180. */
export function stepPose(from: Pos, to: Pos, t: number): { x: number; z: number; yawDeg: number } {
  const k = Math.min(1, Math.max(0, t));
  const a = tileToWorld(from);
  const b = tileToWorld(to);
  const d = dirBetween(from, to);
  return { x: a.x + (b.x - a.x) * k, z: a.z + (b.z - a.z) * k, yawDeg: d === null ? 180 : YAW[d] };
}

/** R-14: trung vị 120 khung cuối; đã "low" thì giữ "low". */
export function chooseQuality(fps: number[], current: "high" | "low"): "high" | "low" {
  if (current === "low") return "low";
  if (fps.length < 120) return current;
  const s = fps.slice(-120).sort((a, b) => a - b);
  const median = (s[59] + s[60]) / 2;
  return median < 45 ? "low" : "high";
}

/** R-16 */
export function chooseRenderer(has3d: boolean, caps: { webgl2: boolean }): "three" | "phaser" {
  return has3d && caps.webgl2 ? "three" : "phaser";
}

/** R-9 */
export function isTap(dxPx: number, dyPx: number, ms: number): boolean {
  return Math.hypot(dxPx, dyPx) < 8 && ms < 300;
}
