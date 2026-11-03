// SPEC-006 — cảnh Phaser: vẽ bản đồ, nhân vật, NPC; di chuyển theo ô; tương tác. Chỉ được tải bằng import() động (R-16).
// Mọi luật di chuyển/tương tác lấy từ grid.ts/quest.ts; file này chỉ vẽ và nhận thao tác.
import * as Phaser from "phaser";
import { findPath, standSpots, step, type Dir, type Pos } from "./grid";
import { canInteract } from "./quest";
import type { WorldData, WorldMap } from "./types";

export interface GameCallbacks {
  /** Người chơi đứng đúng chỗ, quay mặt vào target và bấm tương tác (R-9). */
  onInteract: () => void;
}

export interface GameHandle {
  /** Chuyển bản đồ (mờ dần 300 ms, R-10) và đặt người chơi ở spawn. */
  showMap: (mapId: string) => Promise<void>;
  /** Đặt điểm việc hiện tại (mũi tên nhấp nháy); null = ẩn. */
  setTarget: (target: Pos | null) => void;
  /** Bật/tắt nhận lệnh di chuyển (R-8: chỉ khi mode = walk). */
  setWalkEnabled: (on: boolean) => void;
  /** Hiện biểu cảm trên NPC (id) hoặc trên người chơi (null), 1200 ms (R-13). */
  emote: (npcId: string | null, emoji: string) => void;
  destroy: () => void;
}

const T = 16;
const STEP_MS = 150; // R-8
const KEY_DIR: Record<string, Dir> = {
  ArrowUp: "up", ArrowRight: "right", ArrowDown: "down", ArrowLeft: "left",
  w: "up", d: "right", s: "down", a: "left", W: "up", D: "right", S: "down", A: "left",
};
const INTERACT_KEYS = new Set([" ", "Enter", "e", "E"]); // R-14

const center = (p: Pos) => ({ x: p.x * T + T / 2, y: p.y * T + T / 2 });

class WorldScene extends Phaser.Scene {
  world!: WorldData;
  cb!: GameCallbacks;
  reduced = false;

  map!: WorldMap;
  layerObjs: Phaser.GameObjects.GameObject[] = [];
  npcObjs = new Map<string, Phaser.GameObjects.Container>();
  player!: Phaser.GameObjects.Container;
  pos: Pos = { x: 0, y: 0 };
  face: Dir = "down";
  moving = false;
  walkEnabled = false;
  target: Pos | null = null;
  arrow!: Phaser.GameObjects.Text;
  edgeArrow!: Phaser.GameObjects.Text;
  route: Pos[] = [];
  autoInteract: { face: Dir } | null = null;

  constructor() { super("world"); }

  onReady!: (s: WorldScene) => void;

  init(data: { world: WorldData; cb: GameCallbacks; reduced: boolean; onReady: (s: WorldScene) => void }) {
    this.world = data.world;
    this.cb = data.cb;
    this.reduced = data.reduced;
    this.onReady = data.onReady;
  }

  preload() {
    for (const t of this.world.tilesets) {
      this.load.spritesheet(t.key, `/${t.image}`, { frameWidth: T, frameHeight: T, spacing: t.spacing });
    }
  }

  create() {
    this.cameras.main.setRoundPixels(true);
    this.arrow = this.add.text(0, 0, "▼", { fontSize: "10px", color: "#ffd23f", stroke: "#3a2a00", strokeThickness: 3 }).setOrigin(0.5, 1).setDepth(1000).setVisible(false);
    if (!this.reduced) this.tweens.add({ targets: this.arrow, y: "-=3", duration: 400, yoyo: true, repeat: -1 });
    // Mũi tên ở mép khung nhìn, chỉ về điểm việc khi điểm việc nằm ngoài màn hình.
    this.edgeArrow = this.add.text(0, 0, "➤", { fontSize: "12px", color: "#ffd23f", stroke: "#3a2a00", strokeThickness: 3 }).setOrigin(0.5).setDepth(1000).setVisible(false);

    this.input.keyboard?.on("keydown", (e: KeyboardEvent) => {
      // Ngoài mode walk để nguyên phím cho bảng task (radio, nút) dùng.
      if (!this.walkEnabled) return;
      if (INTERACT_KEYS.has(e.key)) { e.preventDefault(); this.tryInteract(); return; }
      const dir = KEY_DIR[e.key];
      if (dir) { e.preventDefault(); this.route = []; this.autoInteract = null; this.walk(dir); }
    });
    this.input.on("pointerdown", (p: Phaser.Input.Pointer) => this.onTap(p));
    this.scale.on("resize", () => this.fitCamera());
    // Chỉ bản dev: cho phép đọc trạng thái cảnh khi chơi thử bằng công cụ trình duyệt.
    if (process.env.NODE_ENV !== "production") (window as unknown as { __worldScene?: WorldScene }).__worldScene = this;
    this.onReady(this);
  }

  update() {
    if (!this.edgeArrow) return;
    const view = this.cameras.main.worldView;
    if (!this.target || !this.walkEnabled || view.width === 0) { this.edgeArrow.setVisible(false); return; }
    const t = center(this.target);
    const m = 10;
    if (view.contains(t.x, t.y)) { this.edgeArrow.setVisible(false); return; }
    const x = Phaser.Math.Clamp(t.x, view.x + m, view.right - m);
    const y = Phaser.Math.Clamp(t.y, view.y + m, view.bottom - m);
    this.edgeArrow.setPosition(x, y).setRotation(Math.atan2(t.y - this.player.y, t.x - this.player.x)).setVisible(true);
  }

  /** Ghép nhiều lớp ô thành một nhân vật. */
  sprite(layers: string[], at: Pos, depth: number) {
    const c = this.add.container(center(at).x, center(at).y);
    for (const ref of layers) {
      const [key, idx] = ref.split(":");
      c.add(this.add.image(0, 0, key, Number(idx)));
    }
    return c.setDepth(depth);
  }

  build(mapId: string) {
    this.layerObjs.forEach((o) => o.destroy());
    this.layerObjs = [];
    this.npcObjs.forEach((o) => o.destroy());
    this.npcObjs.clear();
    this.player?.destroy();

    const m = this.world.maps.find((x) => x.id === mapId)!;
    this.map = m;
    m.layers.forEach((layer, li) => {
      layer.data.forEach((ref, i) => {
        if (!ref) return;
        const [key, idx] = ref.split(":");
        const x = (i % m.width) * T + T / 2, y = Math.floor(i / m.width) * T + T / 2;
        this.layerObjs.push(this.add.image(x, y, key, Number(idx)).setDepth(li));
      });
    });
    for (const n of this.world.npcs.filter((n) => n.map === mapId)) {
      this.npcObjs.set(n.id, this.sprite(n.sprite, n, 10 + n.y));
    }
    this.pos = { ...m.spawn };
    this.face = "up";
    this.player = this.sprite(this.world.player_sprite, this.pos, 10 + this.pos.y);
    this.cameras.main.startFollow(this.player, true, 0.2, 0.2);
    this.fitCamera();
  }

  fitCamera() {
    if (!this.map) return;
    const { width, height } = this.scale.gameSize;
    // Phóng to theo số nguyên để pixel art sắc nét; bản đồ nhỏ thì vừa khung, lớn thì cuộn theo người chơi.
    const mw = this.map.width * T, mh = this.map.height * T;
    const fit = Math.min(width / mw, height / mh);
    const zoom = Math.max(2, Math.min(4, Math.floor(fit * 2) / 2 || 2));
    const cam = this.cameras.main.setZoom(zoom);
    // Bản đồ nhỏ hơn khung nhìn thì nới biên camera đều hai phía để bản đồ nằm giữa.
    const vw = width / zoom, vh = height / zoom;
    cam.setBounds(Math.min(0, (mw - vw) / 2), Math.min(0, (mh - vh) / 2), Math.max(mw, vw), Math.max(mh, vh));
  }

  blocked(): Pos[] {
    return this.world.npcs.filter((n) => n.map === this.map.id).map((n) => ({ x: n.x, y: n.y }));
  }

  walk(dir: Dir) {
    if (!this.walkEnabled || this.moving) return;
    this.face = dir;
    const next = step(this.map, this.pos, dir, this.blocked());
    if (next.x === this.pos.x && next.y === this.pos.y) { this.afterStep(); return; }
    this.pos = next;
    this.moving = true;
    this.player.setDepth(10 + next.y);
    const to = center(next);
    this.tweens.add({ targets: this.player, x: to.x, y: to.y, duration: STEP_MS, onComplete: () => { this.moving = false; this.afterStep(); } });
    if (!this.reduced) this.tweens.add({ targets: this.player.list, y: -2, duration: STEP_MS / 2, yoyo: true });
  }

  /** Đi tiếp theo route (chạm/nhấp chuột), hết route thì tự tương tác nếu đã định. */
  afterStep() {
    const next = this.route.shift();
    if (next) {
      const dir: Dir = next.x > this.pos.x ? "right" : next.x < this.pos.x ? "left" : next.y > this.pos.y ? "down" : "up";
      this.walk(dir);
      return;
    }
    if (this.autoInteract) {
      this.face = this.autoInteract.face;
      this.autoInteract = null;
      this.tryInteract();
    }
  }

  tryInteract() {
    if (!this.walkEnabled || this.moving || !this.target) return;
    if (canInteract(this.pos, this.face, this.target)) this.cb.onInteract();
  }

  onTap(p: Phaser.Input.Pointer) {
    if (!this.walkEnabled || !this.map) return;
    const tile = { x: Math.floor(p.worldX / T), y: Math.floor(p.worldY / T) };
    const blocked = this.blocked();
    if (this.target && tile.x === this.target.x && tile.y === this.target.y) {
      // R-14: chạm vào điểm việc → đi tới chỗ đứng đầu tiên có đường, quay mặt, tự tương tác.
      for (const s of standSpots(this.map, this.target, blocked)) {
        const path = findPath(this.map, this.pos, s.pos, blocked);
        if (path) { this.route = path; this.autoInteract = { face: s.face }; if (!this.moving) this.afterStep(); return; }
      }
      return;
    }
    const path = findPath(this.map, this.pos, tile, blocked);
    if (path) { this.route = path; this.autoInteract = null; if (!this.moving) this.afterStep(); }
  }

  setTarget(t: Pos | null) {
    this.target = t;
    if (!t) { this.arrow.setVisible(false); return; }
    const c = center(t);
    this.arrow.setPosition(c.x, c.y - T / 2).setVisible(true);
  }

  emote(npcId: string | null, emoji: string) {
    const host = npcId ? this.npcObjs.get(npcId) : this.player;
    if (!host) return;
    const e = this.add.text(host.x, host.y - T, emoji, { fontSize: "12px" }).setOrigin(0.5, 1).setDepth(1001);
    if (!this.reduced) this.tweens.add({ targets: e, y: e.y - 6, duration: 300, ease: "Back.Out" });
    this.time.delayedCall(1200, () => e.destroy());
  }
}

export function mountGame(parent: HTMLElement, world: WorldData, cb: GameCallbacks): GameHandle {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches; // R-15
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    pixelArt: true,
    backgroundColor: "#2b2b35",
    scale: { mode: Phaser.Scale.RESIZE, width: parent.clientWidth, height: parent.clientHeight },
    scene: [],
  });
  // Scene chưa có `events` cho tới khi game khởi động xong, nên scene tự báo sẵn sàng ở cuối create().
  const ready = new Promise<WorldScene>((resolve) => {
    game.scene.add("world", new WorldScene(), true, { world, cb, reduced, onReady: resolve });
  });

  return {
    async showMap(mapId) {
      const s = await ready;
      if (s.map?.id === mapId) return;
      if (!s.map || reduced) { s.build(mapId); return; }
      await new Promise<void>((r) => { s.cameras.main.fadeOut(300); s.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => r()); });
      s.build(mapId);
      s.cameras.main.fadeIn(300);
    },
    setTarget: (t) => { void ready.then((s) => s.setTarget(t)); },
    setWalkEnabled: (on) => { void ready.then((s) => { s.walkEnabled = on; if (!on) { s.route = []; s.autoInteract = null; } }); },
    emote: (id, e) => { void ready.then((s) => s.emote(id, e)); },
    destroy: () => game.destroy(true),
  };
}
