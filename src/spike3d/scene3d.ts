// SPIKE (nhánh spike/threejs, không có spec) — cảnh 3D low-poly bằng Three.js, cùng giao diện GameHandle với scene.ts.
// Logic di chuyển/tương tác vẫn lấy từ grid.ts/quest.ts/input.ts; file này chỉ vẽ và nhận thao tác.
import * as THREE from "three";
import { GLTFLoader, type GLTF } from "three/examples/jsm/loaders/GLTFLoader.js";
import { clone as cloneSkinned } from "three/examples/jsm/utils/SkeletonUtils.js";
import { findPath, standSpots, step, type Dir, type Pos } from "../game/grid";
import { canInteract } from "../game/quest";
import { MoveInput } from "../game/input";
import type { GameCallbacks, GameHandle } from "../game/scene";
import type { WorldData, WorldMap } from "../game/types";

const STEP_MS = 170;
const KEY_DIR: Record<string, Dir> = {
  ArrowUp: "up", ArrowRight: "right", ArrowDown: "down", ArrowLeft: "left",
  w: "up", d: "right", s: "down", a: "left", W: "up", D: "right", S: "down", A: "left",
};
const INTERACT_KEYS = new Set([" ", "Enter", "e", "E"]);
const YAW: Record<Dir, number> = { down: 0, right: Math.PI / 2, up: Math.PI, left: -Math.PI / 2 };

/** Đồ đạc đặt tay cho bản thử (toạ độ ô, xoay theo bội số 90°). */
export interface Prop { model: string; x: number; y: number; rot?: number; dy?: number; scale?: number }

const PROPS_MARKETING: Prop[] = [
  // Phòng họp: bàn dài, ghế hai bên, thảm, kệ, cây
  { model: "rugRectangle", x: 5, y: 3, scale: 2.2 },
  { model: "table", x: 5, y: 2.5, scale: 2 },
  { model: "chair", x: 4.3, y: 1.6, rot: 0 }, { model: "chair", x: 5.7, y: 1.6, rot: 0 },
  { model: "chair", x: 4.3, y: 3.4, rot: 2 }, { model: "chair", x: 5.7, y: 3.4, rot: 2 },
  { model: "laptop", x: 5, y: 2.5, scale: 0.9, dy: 0.66 },
  { model: "pottedPlant", x: 1, y: 1 }, { model: "pottedPlant", x: 10, y: 1 },
  { model: "bookcaseClosedWide", x: 8, y: 1 },
  // Hành lang: sofa chờ
  { model: "loungeSofa", x: 14, y: 5, rot: 3 },
  { model: "plantSmall1", x: 15, y: 1 },
  // Phòng trưởng nhóm
  { model: "rugRound", x: 22, y: 2.6, scale: 2 },
  { model: "desk", x: 22, y: 2.4 }, { model: "computerScreen", x: 22, y: 2.3, dy: 0.62, scale: 1.3 },
  { model: "chairDesk", x: 22, y: 1.6, rot: 0 },
  { model: "bookcaseOpen", x: 26, y: 1 }, { model: "bookcaseOpen", x: 27, y: 1 },
  { model: "pottedPlant", x: 18, y: 1 }, { model: "pottedPlant", x: 28, y: 5 },
  { model: "lampSquareFloor", x: 26, y: 5 },
  // Khu bàn mở: bàn của bạn (14–16), designer (5–6), content (24–25)
  { model: "desk", x: 14.5, y: 10 }, { model: "computerScreen", x: 14.5, y: 9.9, dy: 0.62, scale: 1.3 },
  { model: "desk", x: 15.9, y: 10 }, { model: "laptop", x: 15.9, y: 10, dy: 0.62, scale: 0.9 },
  { model: "chairDesk", x: 15.2, y: 10.9, rot: 2 },
  { model: "desk", x: 5.5, y: 10 }, { model: "computerScreen", x: 5.5, y: 9.9, dy: 0.62, scale: 1.3 },
  { model: "desk", x: 24.5, y: 10 }, { model: "laptop", x: 24.5, y: 10, dy: 0.62, scale: 0.9 },
  { model: "books", x: 16.5, y: 10, dy: 0.62 },
  { model: "sideTable", x: 1, y: 13 }, { model: "sideTable", x: 2, y: 13 }, { model: "sideTable", x: 3, y: 13 },
  { model: "kitchenCoffeeMachine", x: 1, y: 13, dy: 0.5 },
  { model: "pottedPlant", x: 28, y: 14 }, { model: "trashcan", x: 17, y: 11, scale: 0.7 },
  { model: "plantSmall2", x: 9, y: 8 }, { model: "plantSmall2", x: 20, y: 8 },
  { model: "loungeChair", x: 27, y: 9, rot: 3 }, { model: "loungeChair", x: 27, y: 12, rot: 3 },
];

const FURN = 1.6;
const CHAR_MODELS = ["character-female-b", "character-male-a", "character-female-d", "character-male-c", "character-female-e", "character-male-e"];

const v3 = (p: Pos, y = 0) => new THREE.Vector3(p.x + 0.5, y, p.y + 0.5);

interface Actor { root: THREE.Object3D; mixer: THREE.AnimationMixer; actions: Record<string, THREE.AnimationAction>; current: string; height: number }

class World3D {
  renderer: THREE.WebGLRenderer;
  scene = new THREE.Scene();
  camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 200);
  viewH = 10;
  clock = new THREE.Clock();
  loader = new GLTFLoader();
  cache = new Map<string, Promise<GLTF>>();
  mapGroup = new THREE.Group();
  map!: WorldMap;
  player!: Actor;
  npcs = new Map<string, Actor>();
  pos: Pos = { x: 0, y: 0 };
  face: Dir = "down";
  moving = false;
  walkEnabled = false;
  target: Pos | null = null;
  marker: THREE.Group;
  route: Pos[] = [];
  autoInteract: { face: Dir } | null = null;
  keys = new MoveInput();
  focus: Pos | null = null;
  camTarget = new THREE.Vector3();
  raf = 0;
  frames: number[] = [];
  onKeyDown: (e: KeyboardEvent) => void;
  onKeyUp: (e: KeyboardEvent) => void;
  onPointer: (e: PointerEvent) => void;
  ro: ResizeObserver;

  constructor(public host: HTMLElement, public world: WorldData, public cb: GameCallbacks, public lowQuality: boolean) {
    this.renderer = new THREE.WebGLRenderer({ antialias: !lowQuality });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, lowQuality ? 1 : 2));
    this.renderer.shadowMap.enabled = !lowQuality;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    host.appendChild(this.renderer.domElement);
    this.renderer.domElement.style.display = "block";

    this.scene.background = new THREE.Color("#2b2b35");
    this.scene.add(new THREE.HemisphereLight("#fff4e0", "#5a4a6a", 1.6));
    const sun = new THREE.DirectionalLight("#ffffff", 2.2);
    sun.position.set(-8, 14, 6);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    Object.assign(sun.shadow.camera, { left: -20, right: 20, top: 20, bottom: -20 });
    sun.shadow.bias = -0.0005;
    this.scene.add(sun, sun.target);
    this.scene.add(this.mapGroup);

    this.marker = this.makeMarker();
    this.scene.add(this.marker);

    this.onKeyDown = (e) => {
      if (!this.walkEnabled) return;
      if (INTERACT_KEYS.has(e.key)) { e.preventDefault(); if (!e.repeat) this.tryInteract(); return; }
      const dir = KEY_DIR[e.key];
      if (!dir) return;
      e.preventDefault();
      if (e.repeat) return;
      this.route = [];
      this.autoInteract = null;
      this.keys.press(dir);
      if (!this.moving) this.continueWalking();
    };
    this.onKeyUp = (e) => { const d = KEY_DIR[e.key]; if (d) this.keys.release(d); };
    this.onPointer = (e) => this.onTap(e);
    window.addEventListener("keydown", this.onKeyDown);
    window.addEventListener("keyup", this.onKeyUp);
    this.renderer.domElement.addEventListener("pointerdown", this.onPointer);
    this.ro = new ResizeObserver(() => this.resize());
    this.ro.observe(host);
    this.resize();
    this.loop();
  }

  aspect = 1;
  applyZoom() {
    const h = this.viewH / 2, w = h * this.aspect;
    Object.assign(this.camera, { left: -w, right: w, top: h, bottom: -h });
    this.camera.updateProjectionMatrix();
  }

  resize() {
    const w = this.host.clientWidth, h = this.host.clientHeight;
    this.renderer.setSize(w, h);
    this.aspect = w / h;
    this.applyZoom();
  }

  load(url: string): Promise<GLTF> {
    let p = this.cache.get(url);
    if (!p) { p = this.loader.loadAsync(url); this.cache.set(url, p); }
    return p;
  }

  async prop(name: string): Promise<THREE.Object3D> {
    const g = await this.load(`/game3d/furniture/${name}.glb`);
    const o = g.scene.clone(true);
    o.traverse((c) => { if ((c as THREE.Mesh).isMesh) { c.castShadow = !this.lowQuality; c.receiveShadow = !this.lowQuality; } });
    return o;
  }

  async actor(model: string): Promise<Actor> {
    const g = await this.load(`/game3d/characters/${model}.glb`);
    const root = cloneSkinned(g.scene);
    root.traverse((c) => { if ((c as THREE.Mesh).isMesh) c.castShadow = !this.lowQuality; });
    const box = new THREE.Box3().setFromObject(root);
    const s = 0.85 / (box.max.y - box.min.y);
    root.scale.setScalar(s);
    const mixer = new THREE.AnimationMixer(root);
    const actions: Record<string, THREE.AnimationAction> = {};
    for (const clip of g.animations) actions[clip.name] = mixer.clipAction(clip);
    actions.idle?.play();
    return { root, mixer, actions, current: "idle", height: 0.85 };
  }

  play(a: Actor, name: string) {
    if (a.current === name || !a.actions[name]) return;
    a.actions[name].reset().fadeIn(0.15).play();
    a.actions[a.current]?.fadeOut(0.15);
    a.current = name;
  }

  makeMarker() {
    const g = new THREE.Group();
    const cone = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.3, 4), new THREE.MeshStandardMaterial({ color: "#ffd23f", emissive: "#ffb000", emissiveIntensity: 0.6 }));
    cone.rotation.x = Math.PI;
    cone.position.y = 1.35;
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.38, 0.46, 32), new THREE.MeshBasicMaterial({ color: "#ffd23f", transparent: true, opacity: 0.8, side: THREE.DoubleSide }));
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.03;
    g.add(cone, ring);
    g.visible = false;
    return g;
  }

  async build(mapId: string) {
    this.mapGroup.clear();
    this.npcs.clear();
    const map = this.world.maps.find((m) => m.id === mapId)!;
    this.map = map;
    const walls = map.layers.find((l) => l.name === "walls")!.data;
    const isWall = (x: number, y: number) => x < 0 || y < 0 || x >= map.width || y >= map.height || !!walls[y * map.width + x];

    // Sàn: mỗi phòng (vùng liền không có tường) một màu gỗ ấm, dựng từ canvas để có vân nhẹ.
    const floorTex = this.floorTexture(map, isWall);
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(map.width, map.height), new THREE.MeshStandardMaterial({ map: floorTex, roughness: 0.9 }));
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(map.width / 2, 0, map.height / 2);
    floor.receiveShadow = !this.lowQuality;
    floor.name = "floor";
    this.mapGroup.add(floor);

    // Tường kiểu cắt ngang (thấp để nhìn vào trong), có viền trên sẫm.
    const wallMat = new THREE.MeshStandardMaterial({ color: "#f1e7d6", roughness: 0.95 });
    const capMat = new THREE.MeshStandardMaterial({ color: "#8a6a50", roughness: 0.8 });
    const wallGeo = new THREE.BoxGeometry(1, 0.7, 1);
    const capGeo = new THREE.BoxGeometry(1.002, 0.06, 1.002);
    const wallsMesh = new THREE.InstancedMesh(wallGeo, wallMat, map.width * map.height);
    const capsMesh = new THREE.InstancedMesh(capGeo, capMat, map.width * map.height);
    let n = 0;
    const m4 = new THREE.Matrix4();
    for (let y = 0; y < map.height; y++) for (let x = 0; x < map.width; x++) {
      if (!isWall(x, y)) continue;
      m4.makeTranslation(x + 0.5, 0.35, y + 0.5); wallsMesh.setMatrixAt(n, m4);
      m4.makeTranslation(x + 0.5, 0.73, y + 0.5); capsMesh.setMatrixAt(n, m4);
      n++;
    }
    wallsMesh.count = capsMesh.count = n;
    wallsMesh.castShadow = wallsMesh.receiveShadow = !this.lowQuality;
    this.mapGroup.add(wallsMesh, capsMesh);

    // Bảng ý tưởng: tấm trắng gắn tường hành lang, giấy nhớ nhiều màu.
    const idea = this.world.segments["m3-y-tuong"];
    if (idea && idea.map === mapId) this.mapGroup.add(this.ideaBoard(idea.target));

    const props = await Promise.all(PROPS_MARKETING.map(async (p) => {
      // Căn giữa mô hình theo đáy, phóng to FURN lần cho cân với nhân vật; toạ độ là tâm vật trên lưới.
      const inner = await this.prop(p.model);
      const box = new THREE.Box3().setFromObject(inner);
      const c = box.getCenter(new THREE.Vector3());
      inner.position.set(-c.x, -box.min.y, -c.z);
      const o = new THREE.Group();
      o.add(inner);
      o.scale.setScalar(FURN * (p.scale ?? 1));
      o.rotation.y = (p.rot ?? 0) * Math.PI / 2;
      o.position.set(p.x + 0.5, (p.dy ?? 0) * FURN, p.y + 0.5);
      return o;
    }));
    props.forEach((o) => this.mapGroup.add(o));

    const npcs = this.world.npcs.filter((n) => n.map === mapId);
    const actors = await Promise.all([this.actor("character-female-a"), ...npcs.map((_, i) => this.actor(CHAR_MODELS[i % CHAR_MODELS.length]))]);
    this.player = actors[0];
    this.mapGroup.add(this.player.root);
    npcs.forEach((n, i) => {
      const a = actors[i + 1];
      a.root.position.copy(v3(n));
      a.root.rotation.y = YAW.down;
      this.npcs.set(n.id, a);
      this.mapGroup.add(a.root);
      this.mapGroup.add(this.nameTag(n.name, n));
    });

    this.pos = { ...map.spawn };
    this.face = "up";
    this.player.root.position.copy(v3(this.pos));
    this.player.root.rotation.y = YAW.up;
    this.camTarget.copy(this.player.root.position);
  }

  floorTexture(map: WorldMap, isWall: (x: number, y: number) => boolean) {
    const px = 32;
    const c = document.createElement("canvas");
    c.width = map.width * px; c.height = map.height * px;
    const g = c.getContext("2d")!;
    // Tô vùng theo phòng: flood fill trên ô không phải tường.
    const room = new Int32Array(map.width * map.height).fill(-1);
    let rid = 0;
    for (let y = 0; y < map.height; y++) for (let x = 0; x < map.width; x++) {
      if (isWall(x, y) || room[y * map.width + x] >= 0) continue;
      const q = [[x, y]]; room[y * map.width + x] = rid;
      while (q.length) {
        const [cx, cy] = q.pop()!;
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const nx = cx + dx, ny = cy + dy;
          if (isWall(nx, ny) || room[ny * map.width + nx] >= 0) continue;
          room[ny * map.width + nx] = rid; q.push([nx, ny]);
        }
      }
      rid++;
    }
    const palette = ["#c99a6b", "#b9c4cf", "#d8b98f", "#a9c2a4", "#cfa78a", "#c8b8d8"];
    for (let y = 0; y < map.height; y++) for (let x = 0; x < map.width; x++) {
      const r = room[y * map.width + x];
      const base = r < 0 ? "#5b4636" : palette[r % palette.length];
      g.fillStyle = base;
      g.fillRect(x * px, y * px, px, px);
      if (r >= 0) {
        g.fillStyle = "rgba(0,0,0,0.06)";
        g.fillRect(x * px, y * px + px - 2, px, 2);
        if ((x + y) % 2 === 0) { g.fillStyle = "rgba(255,255,255,0.05)"; g.fillRect(x * px, y * px, px, px); }
      }
    }
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 4;
    return t;
  }

  ideaBoard(t: Pos) {
    const g = new THREE.Group();
    const board = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.55, 0.04), new THREE.MeshStandardMaterial({ color: "#ffffff" }));
    board.position.set(t.x + 0.5, 0.95, t.y + 0.5);
    board.rotation.y = Math.PI / 2;
    const colors = ["#ffd23f", "#ff8fab", "#7bdff2", "#b2f7ef", "#f7d6e0"];
    for (let i = 0; i < 9; i++) {
      const note = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 0.01), new THREE.MeshStandardMaterial({ color: colors[i % colors.length] }));
      note.position.set(t.x + 0.5 - 0.03, 0.82 + Math.floor(i / 3) * 0.15, t.y + 0.5 - 0.3 + (i % 3) * 0.3);
      note.rotation.y = Math.PI / 2;
      g.add(note);
    }
    g.add(board);
    return g;
  }

  nameTag(text: string, p: Pos) {
    const c = document.createElement("canvas");
    const g = c.getContext("2d")!;
    g.font = "bold 28px system-ui, sans-serif";
    const w = Math.ceil(g.measureText(text).width) + 24;
    c.width = w; c.height = 44;
    g.font = "bold 28px system-ui, sans-serif";
    g.fillStyle = "rgba(43,43,53,0.8)";
    g.beginPath(); g.roundRect(0, 0, w, 44, 12); g.fill();
    g.fillStyle = "#fff"; g.textBaseline = "middle"; g.fillText(text, 12, 23);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, depthTest: false }));
    s.scale.set(w / 110, 44 / 110, 1);
    s.position.copy(v3(p, 1.1));
    s.renderOrder = 10;
    return s;
  }

  blocked(): Pos[] {
    return this.world.npcs.filter((n) => n.map === this.map.id).map((n) => ({ x: n.x, y: n.y }));
  }

  walk(dir: Dir) {
    if (!this.walkEnabled || this.moving) return;
    this.face = dir;
    this.player.root.rotation.y = YAW[dir];
    const next = step(this.map, this.pos, dir, this.blocked());
    if (next.x === this.pos.x && next.y === this.pos.y) { this.play(this.player, "idle"); return; }
    const from = v3(this.pos), to = v3(next);
    this.pos = next;
    this.moving = true;
    this.play(this.player, "walk");
    const t0 = performance.now();
    const tick = () => {
      const k = Math.min(1, (performance.now() - t0) / STEP_MS);
      this.player.root.position.lerpVectors(from, to, k);
      if (k < 1) requestAnimationFrame(tick);
      else { this.moving = false; this.afterStep(); }
    };
    requestAnimationFrame(tick);
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
      this.player.root.rotation.y = YAW[this.face];
      this.autoInteract = null;
      this.play(this.player, "idle");
      this.tryInteract();
      return;
    }
    this.continueWalking();
  }

  continueWalking() {
    const d = this.keys.next();
    if (d) this.walk(d); else this.play(this.player, "idle");
  }

  tryInteract() {
    if (!this.walkEnabled || this.moving || !this.target) return;
    if (canInteract(this.pos, this.face, this.target)) this.cb.onInteract();
  }

  onTap(e: PointerEvent) {
    if (!this.walkEnabled || !this.map) return;
    const r = this.renderer.domElement.getBoundingClientRect();
    const ndc = new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    const ray = new THREE.Raycaster();
    ray.setFromCamera(ndc, this.camera);
    // Chạm vào NPC/đồ vật: lấy ô dưới điểm chạm trên mặt phẳng sàn ở độ cao của vật; đơn giản: giao với mặt y = 0.4.
    const hit = new THREE.Vector3();
    if (!ray.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), hit)) return;
    let tile = { x: Math.floor(hit.x), y: Math.floor(hit.z) };
    const blocked = this.blocked();
    if (this.target) {
      const near = new THREE.Vector3(); ray.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0, 1, 0), -0.5), near);
      const t2 = { x: Math.floor(near.x), y: Math.floor(near.z) };
      if (t2.x === this.target.x && t2.y === this.target.y) tile = t2;
    }
    if (this.target && tile.x === this.target.x && tile.y === this.target.y) {
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
    this.marker.visible = !!t;
    if (t) this.marker.position.copy(v3(t));
  }

  anchorOf(id: string | null) {
    const a = id ? this.npcs.get(id) : this.player;
    if (!a) return null;
    const p = a.root.position.clone(); p.y += a.height + 0.1;
    p.project(this.camera);
    return { x: (p.x + 1) / 2 * this.host.clientWidth, y: (1 - p.y) / 2 * this.host.clientHeight };
  }

  loop = () => {
    this.raf = requestAnimationFrame(this.loop);
    const dt = Math.min(this.clock.getDelta(), 0.1);
    this.frames.push(dt);
    if (this.frames.length > 240) this.frames.shift();
    if (this.player) {
      this.player.mixer.update(dt);
      for (const a of this.npcs.values()) a.mixer.update(dt);
      const goal = this.focus ? v3(this.focus) : this.player.root.position;
      this.camTarget.lerp(goal, 1 - Math.pow(0.001, dt));
      const want = this.focus ? 7 : 10;
      if (Math.abs(want - this.viewH) > 0.01) { this.viewH += (want - this.viewH) * Math.min(1, dt * 5); this.applyZoom(); }
      this.camera.position.set(this.camTarget.x, this.camTarget.y + 12, this.camTarget.z + 12);
      this.camera.lookAt(this.camTarget);
      const t = performance.now() / 1000;
      this.marker.children[0].position.y = 1.35 + Math.sin(t * 4) * 0.08;
      this.marker.rotation.y = t;
    }
    this.renderer.render(this.scene, this.camera);
  };

  fps() {
    const avg = this.frames.reduce((s, d) => s + d, 0) / Math.max(1, this.frames.length);
    return avg > 0 ? Math.round(1 / avg) : 0;
  }

  destroy() {
    cancelAnimationFrame(this.raf);
    window.removeEventListener("keydown", this.onKeyDown);
    window.removeEventListener("keyup", this.onKeyUp);
    this.ro.disconnect();
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }
}

export function mountGame(parent: HTMLElement, world: WorldData, cb: GameCallbacks): GameHandle & { fps: () => number } {
  const low = new URLSearchParams(location.search).has("low");
  const w = new World3D(parent, world, cb, low);
  (window as unknown as { __w3d: World3D }).__w3d = w;
  let current: string | null = null;
  return {
    async showMap(mapId) { if (current === mapId) return; current = mapId; await w.build(mapId); },
    setTarget: (t) => w.setTarget(t),
    setWalkEnabled: (on) => { w.walkEnabled = on; if (!on) { w.route = []; w.autoInteract = null; w.keys.clear(); } },
    emote: () => {},
    focusOn: (t) => { w.focus = t; },
    anchorOf: (id) => w.anchorOf(id),
    destroy: () => w.destroy(),
    fps: () => w.fps(),
  };
}
