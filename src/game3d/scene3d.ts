// SPEC-031 — cảnh Three.js cài đặt đúng GameHandle của src/game/scene.ts. Chỉ được tải bằng import() động (R-17).
// Luật đi lại/tương tác lấy từ grid.ts/quest.ts; toạ độ, camera, chất lượng lấy từ layout.ts. File này chỉ vẽ và nhận thao tác.
import * as THREE from "three/webgpu";
import { pass } from "three/tsl";
import { bloom } from "three/addons/tsl/display/BloomNode.js";
import { GLTFLoader, type GLTF } from "three/addons/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/addons/libs/meshopt_decoder.module.js";
import { clone as cloneSkinned } from "three/addons/utils/SkeletonUtils.js";
import { findPath, standSpots, step, type Dir, type Pos } from "../game/grid";
import { canInteract } from "../game/quest";
import { MoveInput } from "../game/input";
import type { GameCallbacks, GameHandle } from "../game/scene";
import type { WorldData, WorldMap } from "../game/types";
import { chooseQuality, createKeyTracker, isTap, keyAction, pickTile, rotateDir, snapQuarter, stepPose, tileToWorld, type KeyEffect, type Quarter } from "./layout";
import type { FloorMaterial, Lighting, Map3D, WallMaterial, World3D } from "./types";

const STEP_MS = 150; // R-5 (= SPEC-006 R-8)
const FADE_MS = 300; // R-11
const CAM = { fov: 45, dist: 9, focusDist: 5, pitchDeg: 35, degPerPx: 0.4, snapMs: 250, focusMs: 400 }; // R-7, R-10
const ANIM_FADE_S = 0.15; // R-5

// R-12: preset ánh sáng
const LIGHTING: Record<Lighting, {
  sun: [string, number, [number, number, number]];
  hemi: [string, string, number];
  fog: [string, number, number] | null;
  bg: [string, string] | string;
}> = {
  day: { sun: ["#fff1d6", 2.5, [-0.5, 1, 0.6]], hemi: ["#cfe6ff", "#6b8f4e", 0.8], fog: ["#dfe9f0", 18, 45], bg: ["#9ec9ef", "#e8f1f7"] },
  evening: { sun: ["#ffb27a", 1.8, [-0.9, 0.4, 0.3]], hemi: ["#f4c7a1", "#4a3b52", 0.6], fog: ["#e9b99a", 15, 40], bg: ["#f0a27a", "#fbe3c8"] },
  indoor: { sun: ["#fff4e2", 1.2, [0.3, 1, 0.4]], hemi: ["#fff8ee", "#8a7560", 1.0], fog: null, bg: "#2a1f18" },
};
const COLORS: Record<FloorMaterial | WallMaterial, string> = {
  grass: "#7fb24a", brick: "#c9785a", tile: "#e6dccb", wood: "#b98a5e", concrete: "#b7b3ac", sand: "#e3cf9f",
  plaster: "#efe6d6", hedge: "#5f8f3e",
};
const MARKER_COLOR = "#f2c14e";
const YAW: Record<Dir, number> = { up: 0, right: 90, down: 180, left: 270 }; // R-5
/** Nhân vật GLB mặc định nhìn về +z (hướng "down" của lưới); đổi yaw của R-5 sang góc quay quanh trục y. */
const faceRot = (yawDeg: number) => Math.PI - THREE.MathUtils.degToRad(yawDeg);

type Quality = "high" | "low";

function err(message: string, cause?: unknown): Error {
  return Object.assign(new Error(message, { cause }), { code: "RENDER_3D_FAILED" });
}

/** Nền gradient dọc (trên → dưới). */
function gradientTexture(top: string, bottom: string): THREE.Texture {
  const c = document.createElement("canvas");
  c.width = 2; c.height = 256;
  const g = c.getContext("2d")!;
  const grd = g.createLinearGradient(0, 0, 0, 256);
  grd.addColorStop(0, top); grd.addColorStop(1, bottom);
  g.fillStyle = grd; g.fillRect(0, 0, 2, 256);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function emojiSprite(emoji: string): THREE.Sprite {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const g = c.getContext("2d")!;
  g.font = "96px serif"; g.textAlign = "center"; g.textBaseline = "middle";
  g.fillText(emoji, 64, 72);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, depthTest: false, transparent: true }));
  s.scale.set(0.6, 0.6, 0.6);
  s.renderOrder = 10;
  return s;
}

const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);

interface Actor {
  root: THREE.Object3D;
  mixer: THREE.AnimationMixer | null;
  actions: Map<string, THREE.AnimationAction>;
  current: string | null;
  height: number;
}

class World3DScene {
  renderer: THREE.WebGPURenderer;
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(CAM.fov, 1, 0.1, 200);
  pipeline: THREE.RenderPipeline;
  sun = new THREE.DirectionalLight();
  hemi = new THREE.HemisphereLight();
  clock = new THREE.Clock();
  mapGroup = new THREE.Group();
  wallMesh: THREE.InstancedMesh | null = null;
  wallTiles: { x: number; z: number; cut: boolean | null }[] = [];
  marker: THREE.Mesh;
  fade: HTMLDivElement;

  gltfs = new Map<string, GLTF>();
  map!: WorldMap;
  map3d!: Map3D;
  player!: Actor;
  npcs = new Map<string, Actor>();

  pos: Pos = { x: 0, y: 0 };
  face: Dir = "up";
  moveFrom: Pos | null = null;
  moveStart = 0;
  walkEnabled = false;
  target: Pos | null = null;
  route: Pos[] = [];
  autoInteract: { face: Dir } | null = null;
  keys = new MoveInput();
  keyTracker = createKeyTracker(); // R-6c (BUG-005)

  // Camera: góc ngang hiện tại (độ), góc dừng q, khoảng cách và điểm nhìn có tween.
  yaw = 0;
  q: Quarter = 0;
  yawTween: { from: number; to: number; start: number } | null = null;
  dist = CAM.dist;
  focusTile: Pos | null = null;
  focusTween: { fromDist: number; toDist: number; fromLook: THREE.Vector3; start: number } | null = null;
  look = new THREE.Vector3();

  quality: Quality = "high";
  fps: number[] = [];
  lastQualityCheck = 0;
  emotes: { sprite: THREE.Sprite; host: Actor; until: number; born: number }[] = [];
  disposers: (() => void)[] = [];

  constructor(
    public host: HTMLElement,
    public world: WorldData,
    public world3d: World3D,
    public cb: GameCallbacks,
    public reduced: boolean,
  ) {
    this.renderer = new THREE.WebGPURenderer({ antialias: true });
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;

    this.sun.castShadow = true;
    this.scene.add(this.sun, this.sun.target, this.hemi, this.mapGroup);

    // R-11: khối thoi vàng đánh dấu điểm việc.
    this.marker = new THREE.Mesh(new THREE.OctahedronGeometry(0.22), new THREE.MeshToonMaterial({ color: MARKER_COLOR, emissive: MARKER_COLOR, emissiveIntensity: 0.35 }));
    this.marker.visible = false;
    this.scene.add(this.marker);

    const scenePass = pass(this.scene, this.camera);
    const color = scenePass.getTextureNode("output");
    this.pipeline = new THREE.RenderPipeline(this.renderer, color.add(bloom(color, 0.25, 0.4, 0.85))); // R-13

    this.fade = document.createElement("div");
    Object.assign(this.fade.style, { position: "absolute", inset: "0", background: "#1d140e", opacity: "0", pointerEvents: "none", transition: `opacity ${FADE_MS}ms` });
  }

  async init() {
    try {
      await this.renderer.init();
    } catch (e) {
      throw err("Không khởi tạo được WebGPURenderer", e);
    }
    const canvas = this.renderer.domElement;
    Object.assign(canvas.style, { position: "absolute", inset: "0", width: "100%", height: "100%", touchAction: "none" });
    if (getComputedStyle(this.host).position === "static") this.host.style.position = "relative";
    this.host.append(canvas, this.fade);
    this.applyQuality("high");
    this.resize();
    await this.loadModels();
    this.bindInput();
    this.renderer.setAnimationLoop(() => this.tick());
    if (process.env.NODE_ENV !== "production") (window as unknown as { __world3d?: World3DScene }).__world3d = this;
  }

  async loadModels() {
    const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
    try {
      await Promise.all(Object.entries(this.world3d.models).map(async ([key, m]) => {
        this.gltfs.set(key, await loader.loadAsync(m.file));
      }));
    } catch (e) {
      throw err("Không tải được model GLB", e);
    }
  }

  /** Bản sao của model, đã scale, xoay, và đặt đáy hộp bao chạm đất, tâm hộp bao trùng tâm ô. */
  instance(key: string, at: Pos, rotDeg: number): Actor {
    const g = this.gltfs.get(key)!;
    const obj = g.animations.length ? cloneSkinned(g.scene) : g.scene.clone(true);
    obj.traverse((o) => { if ((o as THREE.Mesh).isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    const s = this.world3d.models[key].scale;
    obj.scale.setScalar(s);
    obj.rotation.y = -THREE.MathUtils.degToRad(rotDeg);
    const inner = new THREE.Group();
    inner.add(obj);
    inner.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(inner);
    const c = box.getCenter(new THREE.Vector3());
    obj.position.set(-c.x, -box.min.y, -c.z);
    const root = new THREE.Group();
    root.add(inner);
    const w = tileToWorld(at);
    root.position.set(w.x, 0, w.z);
    const mixer = g.animations.length ? new THREE.AnimationMixer(obj) : null;
    const actions = new Map<string, THREE.AnimationAction>();
    if (mixer) for (const clip of g.animations) actions.set(clip.name, mixer.clipAction(clip));
    return { root, mixer, actions, current: null, height: box.max.y - box.min.y };
  }

  play(a: Actor, name: string) {
    if (a.current === name) return;
    const next = a.actions.get(name);
    if (!next) return;
    const prev = a.current ? a.actions.get(a.current) : null;
    next.reset().play();
    if (prev) prev.crossFadeTo(next, ANIM_FADE_S, false);
    a.current = name;
  }

  build(mapId: string) {
    // Chỉ InstancedMesh sàn/tường là của riêng bản đồ; model GLB dùng chung hình học với bản gốc nên không dispose.
    this.mapGroup.traverse((o) => {
      const m = o as THREE.InstancedMesh;
      if (m.isInstancedMesh) { m.geometry.dispose(); (m.material as THREE.Material).dispose(); m.dispose(); }
    });
    this.mapGroup.clear();
    this.npcs.clear();

    const m = this.world.maps.find((x) => x.id === mapId)!;
    const m3 = this.world3d.maps[mapId];
    this.map = m;
    this.map3d = m3;

    // R-12: sàn và tường là MeshToonMaterial màu cố định; vẽ bằng InstancedMesh theo từng vật liệu.
    const floorOf = (x: number, y: number): FloorMaterial => {
      for (let i = m3.floor.regions.length - 1; i >= 0; i--) {
        const r = m3.floor.regions[i];
        if (x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h) return r.material;
      }
      return m3.floor.default;
    };
    const blockedByProp = new Set(m3.props.filter((p) => p.blocks).map((p) => `${p.x},${p.y}`));
    const floors = new Map<FloorMaterial, Pos[]>();
    const walls: Pos[] = [];
    for (let y = 0; y < m.height; y++) for (let x = 0; x < m.width; x++) {
      const k = floorOf(x, y);
      if (!floors.has(k)) floors.set(k, []);
      floors.get(k)!.push({ x, y });
      if (m.solid[y * m.width + x] === 1 && !blockedByProp.has(`${x},${y}`)) walls.push({ x, y });
    }
    const mat4 = new THREE.Matrix4();
    const floorGeo = new THREE.BoxGeometry(1, 0.1, 1).translate(0, -0.05, 0);
    for (const [k, tiles] of floors) {
      const mesh = new THREE.InstancedMesh(floorGeo, new THREE.MeshToonMaterial({ color: COLORS[k] }), tiles.length);
      tiles.forEach((t, i) => { const w = tileToWorld(t); mesh.setMatrixAt(i, mat4.makeTranslation(w.x, 0, w.z)); });
      mesh.receiveShadow = true;
      this.mapGroup.add(mesh);
    }
    this.wallMesh = null;
    this.wallTiles = [];
    if (walls.length) {
      const h = m3.wall.height;
      const wallGeo = new THREE.BoxGeometry(1, h, 1).translate(0, h / 2, 0);
      const mesh = new THREE.InstancedMesh(wallGeo, new THREE.MeshToonMaterial({ color: COLORS[m3.wall.material] }), walls.length);
      this.wallTiles = walls.map((t) => ({ ...tileToWorld(t), cut: null }));
      mesh.castShadow = true; mesh.receiveShadow = true;
      this.wallMesh = mesh;
      this.mapGroup.add(mesh);
    }
    // R-12 (v3): nền đất ngoài lưới bằng vật liệu sàn mặc định, phủ hết viền 12 ô của R-3b (thừa ra 40 ô mỗi phía).
    const ground = new THREE.InstancedMesh(new THREE.BoxGeometry(m.width + 80, 0.1, m.height + 80), new THREE.MeshToonMaterial({ color: COLORS[m3.floor.default] }), 1);
    ground.setMatrixAt(0, mat4.makeTranslation(m.width / 2, -0.06, m.height / 2));
    ground.receiveShadow = true;
    this.mapGroup.add(ground);
    for (const p of m3.props) this.mapGroup.add(this.instance(p.model, p, p.rot).root);
    // R-3b: cảnh nền ngoài lưới, chỉ để vẽ (không vào lưới va chạm).
    for (const p of m3.scenery ?? []) this.mapGroup.add(this.instance(p.model, p, p.rot).root);

    for (const n of this.world.npcs.filter((n) => n.map === mapId)) {
      const a = this.instance(this.world3d.npc_models[n.id], n, 0); // NPC nhìn về "down"
      this.play(a, "Idle");
      this.npcs.set(n.id, a);
      this.mapGroup.add(a.root);
    }
    this.pos = { ...m.spawn };
    this.face = "up";
    this.moveFrom = null;
    this.player = this.instance(this.world3d.player_model, this.pos, 0);
    this.player.root.rotation.y = faceRot(YAW[this.face]);
    this.play(this.player, "Idle");
    this.mapGroup.add(this.player.root);

    this.applyLighting(m3.lighting);
    this.fps = [];
    this.focusTile = null;
    this.focusTween = null;
    this.dist = CAM.dist;
    const w = tileToWorld(this.pos);
    this.look.set(w.x, 0.8, w.z);
  }

  applyLighting(l: Lighting) {
    const p = LIGHTING[l];
    const [sc, si, sd] = p.sun;
    this.sun.color.set(sc);
    this.sun.intensity = si;
    const cx = this.map.width / 2, cz = this.map.height / 2;
    const d = new THREE.Vector3(...sd).normalize();
    const R = Math.max(this.map.width, this.map.height);
    this.sun.position.set(cx + d.x * R, d.y * R, cz + d.z * R);
    this.sun.target.position.set(cx, 0, cz);
    const sh = this.sun.shadow.camera;
    sh.left = -R * 0.75; sh.right = R * 0.75; sh.top = R * 0.75; sh.bottom = -R * 0.75; sh.near = 0.5; sh.far = R * 3;
    sh.updateProjectionMatrix();
    this.sun.shadow.bias = -0.0005;
    this.hemi.color.set(p.hemi[0]);
    this.hemi.groundColor.set(p.hemi[1]);
    this.hemi.intensity = p.hemi[2];
    this.scene.fog = p.fog ? new THREE.Fog(p.fog[0], p.fog[1], p.fog[2]) : null;
    const old = this.scene.background;
    if (old instanceof THREE.Texture) old.dispose();
    this.scene.background = typeof p.bg === "string" ? new THREE.Color(p.bg) : gradientTexture(p.bg[0], p.bg[1]);
  }

  /** R-13 */
  applyQuality(q: Quality) {
    this.quality = q;
    const size = q === "high" ? 2048 : 1024;
    this.sun.shadow.mapSize.set(size, size);
    if (this.sun.shadow.map) { this.sun.shadow.map.dispose(); this.sun.shadow.map = null; }
    this.renderer.setPixelRatio(q === "high" ? Math.min(window.devicePixelRatio, 2) : 1);
    this.resize();
  }

  resize() {
    const w = this.host.clientWidth || 1, h = this.host.clientHeight || 1;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  // ---------- Điều khiển ----------

  bindInput() {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) { if (this.walkEnabled && this.keyTracker.down(e.code, e.keyCode)) e.preventDefault(); return; } // BUG-004
      const fx = this.keyTracker.down(e.code, e.keyCode); // R-6c: luôn cập nhật tracker
      if (!this.walkEnabled || !fx) return; // ngoài mode walk để nguyên phím cho bảng task
      e.preventDefault();
      this.applyKey(fx);
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (keyAction(e.code) === null) return; // R-6b: chỉ phím game, tra theo vị trí phím
      const fx = this.keyTracker.up(e.code);
      if (!fx) return;
      if (fx.kind === "release") { this.keys.release(fx.dir); return; }
      if (this.walkEnabled) this.applyKey(fx);
    };
    const onBlur = () => this.keys.clear();
    const onVisibility = () => { if (document.hidden) this.keys.clear(); }; // R-6b

    // R-9: một lần nhấn là chạm hoặc kéo, không cả hai.
    const canvas = this.renderer.domElement;
    let down: { x: number; y: number; t: number; yaw: number; dragging: boolean } | null = null;
    const onPointerDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      down = { x: e.clientX, y: e.clientY, t: performance.now(), yaw: this.yaw, dragging: false };
      canvas.setPointerCapture(e.pointerId);
    };
    const onPointerMove = (e: PointerEvent) => {
      if (!down) return;
      const dx = e.clientX - down.x, dy = e.clientY - down.y;
      if (!down.dragging && Math.hypot(dx, dy) >= 8) down.dragging = true;
      if (down.dragging) { this.yawTween = null; this.yaw = down.yaw + dx * CAM.degPerPx; }
    };
    const onPointerUp = (e: PointerEvent) => {
      if (!down) return;
      const d = down;
      down = null;
      const dx = e.clientX - d.x, dy = e.clientY - d.y;
      if (!d.dragging && isTap(dx, dy, performance.now() - d.t)) { this.onTap(e); return; }
      this.snapCamera();
    };
    const onPointerCancel = () => { if (down?.dragging) this.snapCamera(); down = null; };
    const ro = new ResizeObserver(() => this.resize());
    ro.observe(this.host);

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", onBlur);
    document.addEventListener("visibilitychange", onVisibility);
    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("pointercancel", onPointerCancel);
    this.disposers.push(() => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onBlur);
      document.removeEventListener("visibilitychange", onVisibility);
      ro.disconnect();
    });
  }

  /** R-6c: press = giữ phím; tap = một bước (phím bị bộ gõ nuốt keydown); interact = thử tương tác. */
  applyKey(fx: NonNullable<KeyEffect>) {
    if (fx.kind === "interact") { this.tryInteract(); return; }
    if (fx.kind === "release") { this.keys.release(fx.dir); return; }
    this.route = [];
    this.autoInteract = null;
    this.keys.press(fx.dir);
    if (fx.kind === "tap") this.keys.release(fx.dir); // hướng đệm của MoveInput → đúng một bước
    if (!this.moveFrom) this.continueWalking();
  }

  /** R-7: thả chuột → về góc q gần nhất trong 250 ms. */
  snapCamera() {
    this.q = snapQuarter(this.yaw);
    const to = this.yaw + ((((this.q * 90 - this.yaw) % 360) + 540) % 360) - 180;
    if (this.reduced) { this.yaw = to; this.yawTween = null; return; }
    this.yawTween = { from: this.yaw, to, start: performance.now() };
  }

  blocked(): Pos[] {
    return this.world.npcs.filter((n) => n.map === this.map.id).map((n) => ({ x: n.x, y: n.y }));
  }

  /** Một bước theo ô (R-5). Bị chặn thì chỉ quay mặt. */
  walk(dir: Dir) {
    if (!this.walkEnabled || this.moveFrom) return;
    this.face = dir;
    const next = step(this.map, this.pos, dir, this.blocked());
    if (next.x === this.pos.x && next.y === this.pos.y) {
      this.player.root.rotation.y = faceRot(YAW[dir]);
      return;
    }
    this.moveFrom = this.pos;
    this.pos = next;
    this.moveStart = performance.now();
    this.play(this.player, "Walk");
  }

  afterStep() {
    const next = this.route.shift();
    if (next) {
      const dir: Dir = next.x > this.pos.x ? "right" : next.x < this.pos.x ? "left" : next.y > this.pos.y ? "down" : "up";
      this.walk(dir);
      return;
    }
    if (this.autoInteract) {
      this.face = this.autoInteract.face;
      this.player.root.rotation.y = faceRot(YAW[this.face]);
      this.autoInteract = null;
      this.tryInteract();
      return;
    }
    this.continueWalking();
  }

  /** R-6: phím luôn đổi theo góc camera trước khi gọi step. */
  continueWalking() {
    const d = this.keys.next();
    if (d) this.walk(rotateDir(d, this.q));
    if (!this.moveFrom) this.play(this.player, "Idle");
  }

  tryInteract() {
    if (!this.walkEnabled || this.moveFrom || !this.target) return;
    if (canInteract(this.pos, this.face, this.target)) this.cb.onInteract();
  }

  /** R-8 + SPEC-006 R-14 */
  onTap(e: PointerEvent) {
    if (!this.walkEnabled || !this.map) return;
    const r = this.renderer.domElement.getBoundingClientRect();
    const ndc = new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    const ray = new THREE.Raycaster();
    ray.setFromCamera(ndc, this.camera);
    const tile = pickTile(ray.ray.origin, ray.ray.direction, this.map.width, this.map.height);
    if (!tile) return;
    const blocked = this.blocked();
    if (this.target && tile.x === this.target.x && tile.y === this.target.y) {
      for (const s of standSpots(this.map, this.target, blocked)) {
        const path = findPath(this.map, this.pos, s.pos, blocked);
        if (path) { this.route = path; this.autoInteract = { face: s.face }; if (!this.moveFrom) this.afterStep(); return; }
      }
      return;
    }
    const path = findPath(this.map, this.pos, tile, blocked);
    if (path) { this.route = path; this.autoInteract = null; if (!this.moveFrom) this.afterStep(); }
  }

  // ---------- Vòng vẽ ----------

  tick() {
    const now = performance.now();
    const dt = this.clock.getDelta();
    if (dt > 0) this.fps.push(1 / dt);
    if (this.fps.length > 240) this.fps.splice(0, this.fps.length - 240);
    // R-14: mỗi giây xét hạ chất lượng; đã low thì giữ low.
    if (now - this.lastQualityCheck >= 1000) {
      this.lastQualityCheck = now;
      const q = chooseQuality(this.fps, this.quality);
      if (q !== this.quality) this.applyQuality(q);
    }
    if (!this.map) { this.renderer.render(this.scene, this.camera); return; }

    // Nhân vật: nội suy giữa hai ô (R-5).
    if (this.moveFrom) {
      const t = (now - this.moveStart) / STEP_MS;
      const p = stepPose(this.moveFrom, this.pos, t);
      this.player.root.position.set(p.x, 0, p.z);
      this.player.root.rotation.y = faceRot(p.yawDeg);
      if (t >= 1) { this.moveFrom = null; this.afterStep(); }
    }
    this.player.mixer?.update(dt);
    for (const a of this.npcs.values()) a.mixer?.update(dt);

    // Khối thoi (R-11).
    if (this.target && this.marker.visible) {
      const w = tileToWorld(this.target);
      const bob = this.reduced ? 0 : Math.sin((now / 1200) * Math.PI * 2) * 0.1;
      this.marker.position.set(w.x, 2.2 + bob, w.z);
      if (!this.reduced) this.marker.rotation.y += THREE.MathUtils.degToRad(90) * dt;
    }

    // Biểu cảm (R-11).
    this.emotes = this.emotes.filter((e) => {
      if (now >= e.until) { e.sprite.removeFromParent(); e.sprite.material.map?.dispose(); e.sprite.material.dispose(); return false; }
      const rise = this.reduced ? 0 : Math.min(1, (now - e.born) / 300) * 0.15;
      e.sprite.position.set(e.host.root.position.x, e.host.height + 0.4 + rise, e.host.root.position.z);
      return true;
    });

    this.updateCamera(now);
    if (this.quality === "high") this.pipeline.render();
    else this.renderer.render(this.scene, this.camera);
  }

  updateCamera(now: number) {
    if (this.yawTween) {
      const k = Math.min(1, (now - this.yawTween.start) / CAM.snapMs);
      this.yaw = this.yawTween.from + (this.yawTween.to - this.yawTween.from) * easeInOut(k);
      if (k >= 1) { this.yaw = this.yawTween.to; this.yawTween = null; }
    }
    const pp = this.player.root.position;
    const wantLook = this.focusTile
      ? (() => { const w = tileToWorld(this.focusTile!); return new THREE.Vector3(w.x, 0.8, w.z); })()
      : new THREE.Vector3(pp.x, 0.8, pp.z);
    const wantDist = this.focusTile ? CAM.focusDist : CAM.dist;
    if (this.focusTween) {
      const k = Math.min(1, (now - this.focusTween.start) / CAM.focusMs);
      const e = easeInOut(k);
      this.dist = this.focusTween.fromDist + (wantDist - this.focusTween.fromDist) * e;
      this.look.lerpVectors(this.focusTween.fromLook, wantLook, e);
      if (k >= 1) this.focusTween = null;
    } else {
      this.dist = wantDist;
      this.look.copy(wantLook);
    }
    const yawR = THREE.MathUtils.degToRad(this.yaw);
    const pitchR = THREE.MathUtils.degToRad(CAM.pitchDeg);
    const horiz = Math.cos(pitchR) * this.dist;
    this.camera.position.set(this.look.x - Math.sin(yawR) * horiz, this.look.y + Math.sin(pitchR) * this.dist, this.look.z + Math.cos(yawR) * horiz);
    this.camera.lookAt(this.look);
    this.cutWalls(yawR);
  }

  /** Tường nằm giữa camera và điểm nhìn được hạ thấp còn 0,15 m để không che nhân vật. */
  cutWalls(yawR: number) {
    const mesh = this.wallMesh;
    if (!mesh) return;
    const fx = Math.sin(yawR), fz = -Math.cos(yawR); // hướng camera nhìn trên mặt đất
    const low = 0.15 / this.map3d.wall.height;
    const m = new THREE.Matrix4();
    let dirty = false;
    this.wallTiles.forEach((t, i) => {
      const cut = (t.x - this.look.x) * fx + (t.z - this.look.z) * fz < -0.6;
      if (cut === t.cut) return;
      t.cut = cut;
      mesh.setMatrixAt(i, m.makeScale(1, cut ? low : 1, 1).setPosition(t.x, 0, t.z));
      dirty = true;
    });
    if (dirty) mesh.instanceMatrix.needsUpdate = true;
  }

  // ---------- API cho GameHandle ----------

  setTarget(t: Pos | null) {
    this.target = t;
    this.marker.visible = t !== null;
  }

  setWalkEnabled(on: boolean) {
    this.walkEnabled = on;
    if (!on) { this.route = []; this.autoInteract = null; this.keys.clear(); }
  }

  /** R-10 */
  focusOn(t: Pos | null) {
    this.focusTile = t;
    this.focusTween = this.reduced ? null : { fromDist: this.dist, toDist: t ? CAM.focusDist : CAM.dist, fromLook: this.look.clone(), start: performance.now() };
  }

  /** R-10: điểm cao hơn đỉnh hộp bao 0,2 m, theo px của host; sau camera hoặc ngoài khung → null. */
  anchorOf(npcId: string | null): { x: number; y: number } | null {
    const a = npcId ? this.npcs.get(npcId) : this.player;
    if (!a) return null;
    const p = new THREE.Vector3(a.root.position.x, a.height + 0.2, a.root.position.z).project(this.camera);
    if (p.z > 1 || p.z < -1 || Math.abs(p.x) > 1 || Math.abs(p.y) > 1) return null;
    return { x: ((p.x + 1) / 2) * this.host.clientWidth, y: ((1 - p.y) / 2) * this.host.clientHeight };
  }

  emote(npcId: string | null, emoji: string) {
    const a = npcId ? this.npcs.get(npcId) : this.player;
    if (!a) return;
    const s = emojiSprite(emoji);
    this.scene.add(s);
    const now = performance.now();
    this.emotes.push({ sprite: s, host: a, born: now, until: now + 1200 });
  }

  async showMap(mapId: string) {
    if (this.map?.id === mapId) return;
    if (!this.map || this.reduced) { this.build(mapId); return; }
    this.fade.style.opacity = "1";
    await new Promise((r) => setTimeout(r, FADE_MS));
    this.build(mapId);
    this.fade.style.opacity = "0";
  }

  destroy() {
    this.renderer.setAnimationLoop(null);
    this.disposers.forEach((d) => d());
    this.renderer.dispose();
    this.renderer.domElement.remove();
    this.fade.remove();
  }
}

export async function mountGame3D(host: HTMLElement, world: WorldData, world3d: World3D, cb: GameCallbacks): Promise<GameHandle> {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches; // R-15
  const s = new World3DScene(host, world, world3d, cb, reduced);
  try {
    await s.init();
  } catch (e) {
    s.destroy();
    throw (e as { code?: string }).code === "RENDER_3D_FAILED" ? e : err("Lỗi khởi tạo cảnh 3D", e);
  }
  return {
    showMap: (id) => s.showMap(id),
    setTarget: (t) => s.setTarget(t),
    setWalkEnabled: (on) => s.setWalkEnabled(on),
    emote: (id, e) => s.emote(id, e),
    focusOn: (t) => s.focusOn(t),
    anchorOf: (id) => s.anchorOf(id),
    destroy: () => s.destroy(),
  };
}
