#!/usr/bin/env node
// SPEC-006 — sinh asset và file thế giới cho nghề giáo viên THPT.
//   node scripts/gen-world.mjs
// 1. Vẽ bộ ô nền tự làm (sàn, tường, cỏ, lối đi) → public/game/base/ (CC0, chưa có Kenney RPG pack).
// 2. Chép tilesheet Kenney + License.txt từ assets-src/ → public/game/kenney-*/ (nếu có assets-src).
// 3. Dựng content/worlds/giao-vien-thpt.json từ sơ đồ ký tự bên dưới.
import { copyFileSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { deflateSync } from "node:zlib";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const out = (p) => { const f = join(root, p); mkdirSync(dirname(f), { recursive: true }); return f; };

// ---------- 1. Bộ ô nền ----------
const T = 16, GAP = 1;
const BASE = ["school_floor", "wood_floor", "wall_face", "wall_top", "grass", "path", "door"];
const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16), 255];

/** Hàm vẽ từng ô: trả về màu RGBA của điểm (x, y) trong ô 16×16. */
const PAINT = {
  school_floor: (x, y) => (x % 8 === 0 || y % 8 === 0 ? hex("#c9c2b2") : (x + y) % 7 === 0 ? hex("#e2dccd") : hex("#ddd6c6")),
  wood_floor: (x, y) => (y % 4 === 3 ? hex("#8a5a35") : (x + (Math.floor(y / 4) % 2) * 8) % 16 === 0 ? hex("#93613b") : hex("#a8703f")),
  wall_face: (x, y) => (y >= 14 ? hex("#8f8068") : y < 2 ? hex("#b9ab8d") : x % 8 === 0 && y % 6 === 0 ? hex("#cbbd9f") : hex("#d8cbaa")),
  wall_top: (x, y) => (x === 0 || y === 0 || x === 15 || y === 15 ? hex("#6f6450") : hex("#e7dcc0")),
  grass: (x, y) => ((x * 7 + y * 13) % 11 === 0 ? hex("#6fae4f") : (x * 3 + y * 5) % 17 === 0 ? hex("#93cf6b") : hex("#82c05c")),
  path: (x, y) => ((x * 5 + y * 3) % 9 === 0 ? hex("#c7ad7a") : hex("#d9c08c")),
  door: (x, y) => (x < 2 || x > 13 ? hex("#6b4a2b") : y % 5 === 4 ? hex("#7d5532") : hex("#9b6a3d")),
};

// Ô nền công trường (SPEC-012): đất, bê tông, rào tôn, giàn giáo, sàn cốt thép.
const SITE = ["dirt", "concrete", "fence", "scaffold", "rebar"];
const SITE_PAINT = {
  dirt: (x, y) => ((x * 3 + y * 5) % 13 === 0 ? hex("#6f5538") : (x * 7 + y * 11) % 17 === 0 ? hex("#a07d52") : hex("#8b6a45")),
  concrete: (x, y) => (x === 0 || y === 0 ? hex("#8e8e88") : (x * 5 + y * 3) % 19 === 0 ? hex("#777771") : (x + y) % 7 === 0 ? hex("#b0b0a8") : hex("#a3a39b")),
  fence: (x, y) => (y === 0 || y === 15 ? hex("#6f7378") : x % 4 === 0 ? hex("#b8bcc0") : x % 4 === 2 ? hex("#8d9297") : hex("#a7abaf")),
  scaffold: (x, y) => (x < 2 || x > 13 ? hex("#6b6f74") : y === 0 || y === 15 || y === 7 || y === 8 ? hex("#c46a2b") : (x + y) % 5 === 0 ? hex("#9aa0a5") : hex("#7d8287")),
  rebar: (x, y) => (x % 5 === 0 || y % 5 === 0 ? hex("#5b5f63") : (x + y) % 9 === 0 ? hex("#b9b6aa") : hex("#a9a79c")),
};

function png(width, height, pixel) {
  const crcT = Array.from({ length: 256 }, (_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
  const crc = (buf) => { let c = 0xffffffff; for (const b of buf) c = crcT[(c ^ b) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
  const chunk = (type, data) => {
    const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
    const td = Buffer.concat([Buffer.from(type), data]);
    const c = Buffer.alloc(4); c.writeUInt32BE(crc(td));
    return Buffer.concat([len, td, c]);
  };
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(width, 0); ihdr.writeUInt32BE(height, 4); ihdr[8] = 8; ihdr[9] = 6;
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) raw.set(pixel(x, y), y * (width * 4 + 1) + 1 + x * 4);
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk("IHDR", ihdr), chunk("IDAT", deflateSync(raw)), chunk("IEND", Buffer.alloc(0))]);
}

function sheet(tiles, paint) {
  const w = tiles.length * (T + GAP) - GAP;
  return png(w, T, (x, y) => {
    const i = Math.floor(x / (T + GAP)), lx = x % (T + GAP);
    return lx >= T ? [0, 0, 0, 0] : paint[tiles[i]](lx, y);
  });
}

writeFileSync(out("public/game/base/base.png"), sheet(BASE, PAINT));
writeFileSync(out("public/game/site/site.png"), sheet(SITE, SITE_PAINT));
writeFileSync(out("public/game/base/License.txt"), [
  "Bộ ô nền (sàn, tường, cỏ, lối đi) của dự án Một Ngày Làm Nghề.",
  "Vẽ bằng code trong scripts/gen-world.mjs.",
  "Ô nền công trường (đất, bê tông, rào tôn, giàn giáo, cốt thép) nằm ở public/game/site/.",
  "License: Creative Commons Zero (CC0) http://creativecommons.org/publicdomain/zero/1.0/",
  "",
].join("\n"));
writeFileSync(out("public/game/site/License.txt"), [
  "Bộ ô nền công trường (đất, nền bê tông, rào tôn, giàn giáo, sàn cốt thép) của dự án Một Ngày Làm Nghề.",
  "Vẽ bằng code trong scripts/gen-world.mjs.",
  "License: Creative Commons Zero (CC0) http://creativecommons.org/publicdomain/zero/1.0/",
  "",
].join("\n"));

// ---------- 2. Asset Kenney ----------
const KENNEY = [
  ["assets-src/kenney_roguelike-indoors/Tilesheets/roguelikeIndoor_transparent.png", "assets-src/kenney_roguelike-indoors/License.txt", "public/game/kenney-indoor"],
  ["assets-src/kenney_roguelike-characters/Spritesheet/roguelikeChar_transparent.png", "assets-src/kenney_roguelike-characters/License.txt", "public/game/kenney-chars"],
];
for (const [img, lic, dir] of KENNEY) {
  if (!existsSync(join(root, img))) { console.warn(`⚠ thiếu ${img} — giữ bản đã có trong ${dir}`); continue; }
  copyFileSync(join(root, img), out(`${dir}/sheet.png`));
  copyFileSync(join(root, lic), out(`${dir}/License.txt`));
}

// ---------- 3. Bản đồ ----------
// '#' tường, '.' sàn gạch, ',' sàn gỗ, 'g' cỏ, '=' lối đi, 'D' cửa (đi được).
const SCHOOL = [
  "##############################",
  "#........#........#..........#",
  "#........#........#..........#",
  "#........#........#..........#",
  "#........#........#..........#",
  "#........#........#..........#",
  "####D#########D#########D#####",
  "#............................#",
  "#............................#",
  "####D###############=#########",
  "#........#gggggggggg=gggggggg#",
  "#........#gggggggggg=gggggggg#",
  "#........#gggggggggg=gggggggg#",
  "#........#gggggggggg=gggggggg#",
  "##########gggggggggg=gggggggg#",
  "gggggggggggggggggggg=ggggggggg",
];
const HOME = [
  "############",
  "#,,,,,,,,,,#",
  "#,,,,,,,,,,#",
  "#,,,,,,,,,,#",
  "#,,,,,,,,,,#",
  "#,,,,,,,,,,#",
  "#,,,,,,,,,,#",
  "############",
];

// Đồ vật: [x, y, ô Kenney indoor, solid]
const SCHOOL_PROPS = [
  // Lớp 11A2 (chủ nhiệm)
  [3, 1, 448, 1], [4, 1, 449, 1], [5, 1, 450, 1], [1, 1, 16, 1], [8, 1, 17, 1],
  [2, 3, 5, 1], [4, 3, 5, 1], [6, 3, 5, 1], [2, 5, 5, 1], [6, 5, 5, 1],
  // Lớp 10A5
  [12, 1, 448, 1], [13, 1, 449, 1], [14, 1, 450, 1], [17, 1, 16, 1],
  [11, 3, 5, 1], [13, 3, 5, 1], [15, 3, 5, 1], [11, 5, 5, 1], [13, 5, 5, 1],
  // Phòng giáo viên: bàn dài có chồng bài, điện thoại ở góc
  [21, 3, 0, 1], [22, 3, 1, 1], [23, 3, 1, 1], [24, 3, 2, 1],
  [19, 1, 329, 1], [20, 1, 330, 1], [28, 1, 16, 1], [27, 5, 97, 1], [19, 5, 17, 1],
  // Phòng tổ chuyên môn
  [3, 11, 0, 1], [4, 11, 1, 1], [5, 11, 2, 1], [1, 10, 329, 1], [8, 10, 16, 1],
];
const SCHOOL_DECOR = [[23, 3, 18], [4, 11, 18]]; // giấy tờ trên bàn (lớp trên, không đổi solid)
const HOME_PROPS = [
  [2, 2, 85, 1], [3, 2, 86, 1], [1, 1, 16, 1], [5, 1, 329, 1], [6, 1, 330, 1],
  [9, 1, 116, 1], [9, 2, 143, 1], [8, 5, 97, 1], [10, 6, 17, 1],
];
const HOME_DECOR = [[3, 2, 18]];

function buildMap(id, rows, props, decor, spawn, extraFloor = {}) {
  const width = rows[0].length, height = rows.length;
  if (!rows.every((r) => r.length === width)) throw new Error(`map ${id}: dòng không đều`);
  const at = (x, y) => (y < 0 || y >= height || x < 0 || x >= width ? "#" : rows[y][x]);
  const FLOOR = { ".": "base:0", ",": "base:1", g: "base:4", "=": "base:5", D: "base:6", ...extraFloor };
  const floor = [], walls = [], furniture = Array(width * height).fill(null), top = Array(width * height).fill(null), solid = [];
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const c = at(x, y);
    const isWall = c === "#";
    floor.push(FLOOR[c] ?? (isWall ? null : "base:0"));
    // Tường có sàn ngay bên dưới → mặt tường; còn lại → đỉnh tường.
    walls.push(isWall ? (at(x, y + 1) !== "#" && y + 1 < height ? "base:2" : "base:3") : null);
    solid.push(isWall || c === "r" || c === "s" ? 1 : 0);
  }
  for (const [x, y, tile, s] of props) {
    const i = y * width + x;
    if (rows[y][x] === "#") throw new Error(`map ${id}: đồ vật (${x},${y}) đè lên tường`);
    furniture[i] = `indoor:${tile}`;
    if (s) solid[i] = 1;
  }
  for (const [x, y, tile] of decor) top[y * width + x] = `indoor:${tile}`;
  return {
    id, width, height, spawn, solid,
    layers: [{ name: "floor", data: floor }, { name: "walls", data: walls }, { name: "furniture", data: furniture }, { name: "decor", data: top }],
  };
}

// Nhân vật ghép lớp từ Kenney Roguelike Characters.
const C = (...ids) => ids.map((i) => `chars:${i}`);
const world = {
  profession_id: "giao-vien-thpt",
  tile_size: 16,
  tilesets: [
    { key: "base", image: "game/base/base.png", columns: BASE.length, spacing: 1 },
    { key: "indoor", image: "game/kenney-indoor/sheet.png", columns: 27, spacing: 1 },
    { key: "chars", image: "game/kenney-chars/sheet.png", columns: 54, spacing: 1 },
  ],
  maps: [
    buildMap("nha", HOME, HOME_PROPS, HOME_DECOR, { x: 6, y: 5 }),
    buildMap("truong", SCHOOL, SCHOOL_PROPS, SCHOOL_DECOR, { x: 20, y: 15 }),
  ],
  npcs: [
    { id: "hs-11a2", map: "truong", x: 4, y: 4, name: "Học sinh lớp 11A2", sprite: C(0, 121, 128) },
    { id: "hs-11a2-b", map: "truong", x: 2, y: 4, name: "Học sinh lớp 11A2", sprite: C(54, 71, 19) },
    { id: "hs-11a2-c", map: "truong", x: 7, y: 4, name: "Học sinh lớp 11A2", sprite: C(1, 13, 76) },
    { id: "hs-10a5", map: "truong", x: 15, y: 4, name: "Học sinh lớp 10A5", sprite: C(54, 17, 22) },
    { id: "hs-10a5-b", map: "truong", x: 11, y: 4, name: "Học sinh lớp 10A5", sprite: C(54, 125, 23) },
    { id: "to-truong", map: "truong", x: 6, y: 12, name: "Tổ trưởng chuyên môn", sprite: C(379) },
    { id: "dong-nghiep", map: "truong", x: 25, y: 5, name: "Đồng nghiệp", sprite: C(108, 16, 73) },
  ],
  player_sprite: C(0, 13, 20),
  segments: {
    "s1-soan-bai": { map: "nha", target: { x: 3, y: 2 }, quest: "Ngồi vào bàn, xem lại giáo án" },
    "s2-chao-co": { map: "truong", target: { x: 4, y: 4 }, npc: "hs-11a2", quest: "Tới lớp chủ nhiệm 11A2" },
    "s3-len-lop": { map: "truong", target: { x: 15, y: 4 }, npc: "hs-10a5", quest: "Lên lớp 10A5, tiết 2" },
    "s4-to-chuyen-mon": { map: "truong", target: { x: 6, y: 12 }, npc: "to-truong", quest: "Gặp tổ trưởng ở phòng tổ chuyên môn" },
    "s5-cham-bai": { map: "truong", target: { x: 23, y: 3 }, quest: "Chấm bài ở phòng giáo viên" },
    "s6-phu-huynh": { map: "truong", target: { x: 27, y: 5 }, quest: "Nghe điện thoại ở phòng giáo viên" },
    "s7-buoi-toi": { map: "nha", target: { x: 3, y: 2 }, quest: "Về nhà, sắp xếp buổi tối" },
  },
};

writeFileSync(out("content/worlds/giao-vien-thpt.json"), JSON.stringify(world) + "\n");

// ---------- Điều dưỡng (SPEC-009): khoa Nội + nhà ----------
const KHOA_NOI = [
  "##########################",
  "#......#........#........#",
  "#......#........#........#",
  "#......#........#........#",
  "#......#........#........#",
  "###D########D########D####",
  "#........................#",
  "#........................#",
  "#####D###########D########",
  "#.........#..............#",
  "#.........#..............#",
  "#.........#..............#",
  "#.........D..............#",
  "##########################",
];
const KHOA_NOI_PROPS = [
  // Buồng 1: giường 12 (x2), giường 3 (x5) — giường dọc 2 ô
  [2, 1, 116, 1], [2, 2, 143, 1], [5, 1, 116, 1], [5, 2, 143, 1], [1, 4, 17, 1],
  // Buồng 2: giường 5 (x10), giường 9 (x13)
  [10, 1, 116, 1], [10, 2, 143, 1], [13, 1, 116, 1], [13, 2, 143, 1], [15, 4, 16, 1],
  // Phòng điều dưỡng: bàn, kệ hồ sơ, cây
  [18, 2, 0, 1], [19, 2, 1, 1], [20, 2, 2, 1], [23, 1, 329, 1], [24, 1, 330, 1], [17, 4, 16, 1],
  // Quầy thuốc: tủ, xe thuốc (điểm việc)
  [2, 9, 324, 1], [3, 9, 325, 1], [4, 9, 326, 1], [6, 11, 97, 1], [9, 9, 17, 1],
  // Sảnh chờ: ghế, cây
  [13, 11, 55, 1], [14, 11, 55, 1], [15, 11, 55, 1], [16, 11, 55, 1], [24, 9, 17, 1],
];
const KHOA_NOI_DECOR = [[19, 2, 18], [6, 11, 18]];
const PATIENT = C(595);

const nurseWorld = {
  profession_id: "dieu-duong",
  tile_size: 16,
  tilesets: world.tilesets,
  maps: [
    buildMap("khoa-noi", KHOA_NOI, KHOA_NOI_PROPS, KHOA_NOI_DECOR, { x: 20, y: 3 }),
    buildMap("nha", HOME, HOME_PROPS, HOME_DECOR, { x: 6, y: 5 }),
  ],
  npcs: [
    { id: "dd-ca-dem", map: "khoa-noi", x: 22, y: 3, name: "Điều dưỡng ca đêm", sprite: C(0, 71, 19) },
    { id: "bn-12", map: "khoa-noi", x: 2, y: 2, name: "Người bệnh giường 12", sprite: PATIENT },
    { id: "bn-3", map: "khoa-noi", x: 5, y: 2, name: "Người bệnh giường 3", sprite: PATIENT },
    { id: "bn-5", map: "khoa-noi", x: 10, y: 2, name: "Người bệnh giường 5", sprite: PATIENT },
    { id: "bn-9", map: "khoa-noi", x: 13, y: 2, name: "Người bệnh giường 9", sprite: PATIENT },
    { id: "nguoi-nha", map: "khoa-noi", x: 8, y: 7, name: "Con gái người bệnh", sprite: C(486) },
  ],
  player_sprite: C(1, 125, 20),
  segments: {
    "d1-ban-giao": { map: "khoa-noi", target: { x: 22, y: 3 }, npc: "dd-ca-dem", quest: "Nhận bàn giao ở phòng điều dưỡng" },
    "d2-phieu-theo-doi": { map: "khoa-noi", target: { x: 2, y: 2 }, npc: "bn-12", quest: "Rà phiếu chăm sóc giường 12 (Buồng 1)" },
    "d3-y-lenh": { map: "khoa-noi", target: { x: 6, y: 11 }, quest: "Tới quầy thuốc chuẩn bị việc buổi sáng" },
    "d4-nguoi-nha": { map: "khoa-noi", target: { x: 8, y: 7 }, npc: "nguoi-nha", quest: "Người nhà giường 12 đang chờ ở hành lang" },
    "d5-hai-chuong": { map: "khoa-noi", target: { x: 10, y: 2 }, npc: "bn-5", quest: "Chuông gọi! Tới Buồng 2" },
    "d6-ra-vien": { map: "khoa-noi", target: { x: 5, y: 2 }, npc: "bn-3", quest: "Hướng dẫn ra viện cho giường 3 (Buồng 1)" },
    "d7-sau-ca": { map: "nha", target: { x: 3, y: 2 }, quest: "Về nhà sau ca làm" },
  },
};
writeFileSync(out("content/worlds/dieu-duong.json"), JSON.stringify(nurseWorld) + "\n");

// ---------- Lập trình viên (SPEC-010): văn phòng phần mềm + nhà ----------
const VAN_PHONG = [
  "########################",
  "#.......#..............#",
  "#.......#..............#",
  "#.......#..............#",
  "#.......D..............#",
  "#.......#..............#",
  "#########..............#",
  "#......................#",
  "#......................#",
  "#......................#",
  "#......................#",
  "########################",
];
const VAN_PHONG_PROPS = [
  // Phòng họp: bàn dài, cây
  [2, 2, 0, 1], [3, 2, 1, 1], [4, 2, 1, 1], [5, 2, 2, 1], [7, 1, 16, 1],
  // Khu bàn mở: bàn của bạn (x12), bàn đồng nghiệp (x16), bàn khác
  [11, 2, 85, 1], [12, 2, 86, 1], [16, 2, 85, 1], [17, 2, 86, 1], [20, 2, 85, 1], [21, 2, 86, 1],
  [11, 6, 85, 1], [12, 6, 86, 1], [16, 6, 85, 1], [17, 6, 86, 1], [22, 1, 17, 1],
  // Pantry: quầy, cây
  [2, 8, 324, 1], [3, 8, 325, 1], [4, 8, 326, 1], [1, 10, 16, 1],
  // Tủ máy chủ ở góc
  [22, 8, 416, 1],
];
const VAN_PHONG_DECOR = [[12, 2, 18], [17, 2, 18]];

const devWorld = {
  profession_id: "lap-trinh-vien",
  tile_size: 16,
  tilesets: world.tilesets,
  maps: [
    buildMap("van-phong", VAN_PHONG, VAN_PHONG_PROPS, VAN_PHONG_DECOR, { x: 14, y: 10 }),
    buildMap("nha", HOME, HOME_PROPS, HOME_DECOR, { x: 6, y: 5 }),
  ],
  npcs: [
    { id: "truong-nhom", map: "van-phong", x: 4, y: 3, name: "Trưởng nhóm", sprite: C(379) },
    { id: "khach-hang", map: "van-phong", x: 2, y: 4, name: "Khách hàng", sprite: C(433) },
    { id: "dong-nghiep", map: "van-phong", x: 16, y: 3, name: "Đồng nghiệp", sprite: C(54, 17, 22) },
    { id: "dong-nghiep-b", map: "van-phong", x: 20, y: 3, name: "Đồng nghiệp", sprite: C(1, 13, 76) },
    { id: "dong-nghiep-c", map: "van-phong", x: 11, y: 7, name: "Đồng nghiệp", sprite: C(0, 121, 128) },
  ],
  player_sprite: C(0, 13, 20),
  segments: {
    "l1-hop-dau-ngay": { map: "van-phong", target: { x: 4, y: 3 }, npc: "truong-nhom", quest: "Vào phòng họp, họp đầu ngày" },
    "l2-chia-viec": { map: "van-phong", target: { x: 12, y: 2 }, quest: "Về bàn làm việc, nhận tính năng mới" },
    "l3-review-code": { map: "van-phong", target: { x: 16, y: 3 }, npc: "dong-nghiep", quest: "Đồng nghiệp nhờ review code" },
    "l4-phan-loai-loi": { map: "van-phong", target: { x: 12, y: 2 }, quest: "Xem danh sách lỗi ở bàn làm việc" },
    "l5-khach-hang": { map: "van-phong", target: { x: 2, y: 4 }, npc: "khach-hang", quest: "Khách hàng đang chờ ở phòng họp" },
    "l6-su-co": { map: "van-phong", target: { x: 22, y: 8 }, quest: "Sự cố! Kiểm tra tủ máy chủ" },
    "l7-buoi-toi": { map: "nha", target: { x: 3, y: 2 }, quest: "Về nhà, sắp xếp buổi tối" },
  },
};
writeFileSync(out("content/worlds/lap-trinh-vien.json"), JSON.stringify(devWorld) + "\n");

// ---------- Kế toán (SPEC-011): văn phòng doanh nghiệp + nhà ----------
const CONG_TY = [
  "########################",
  "#.........#............#",
  "#.........#............#",
  "#.........D............#",
  "#.........#............#",
  "#.........#............#",
  "#####D#####............#",
  "#.........#............#",
  "#.........D............#",
  "#.........#............#",
  "#.........#............#",
  "########################",
];
const CONG_TY_PROPS = [
  // Phòng giám đốc: bàn, kệ, cây
  [4, 2, 85, 1], [5, 2, 86, 1], [8, 1, 329, 1], [9, 1, 330, 1], [1, 1, 16, 1],
  // Quầy lễ tân: quầy, cây
  [3, 8, 324, 1], [4, 8, 325, 1], [5, 8, 326, 1], [1, 10, 17, 1],
  // Phòng kế toán: bàn của bạn (x14), điện thoại (x16), bàn đồng nghiệp (x19), tủ hồ sơ
  [14, 2, 85, 1], [15, 2, 86, 1], [16, 2, 97, 1], [19, 2, 85, 1], [20, 2, 86, 1],
  [21, 5, 329, 1], [22, 5, 330, 1], [21, 7, 329, 1], [22, 7, 330, 1], [22, 1, 16, 1],
];
const CONG_TY_DECOR = [[15, 2, 18], [20, 2, 18], [5, 2, 18]];

const accountantWorld = {
  profession_id: "ke-toan",
  tile_size: 16,
  tilesets: world.tilesets,
  maps: [
    buildMap("cong-ty", CONG_TY, CONG_TY_PROPS, CONG_TY_DECOR, { x: 16, y: 9 }),
    buildMap("nha", HOME, HOME_PROPS, HOME_DECOR, { x: 6, y: 5 }),
  ],
  npcs: [
    { id: "giam-doc", map: "cong-ty", x: 5, y: 3, name: "Giám đốc", sprite: C(379) },
    { id: "ke-toan-truong", map: "cong-ty", x: 19, y: 3, name: "Kế toán trưởng", sprite: C(54, 17, 22) },
  ],
  player_sprite: C(1, 125, 20),
  segments: {
    "k1-hoa-don": { map: "cong-ty", target: { x: 14, y: 2 }, quest: "Về bàn kế toán, kiểm hóa đơn mới về" },
    "k2-chung-tu": { map: "cong-ty", target: { x: 15, y: 2 }, quest: "Xếp chứng từ chi tiêu ở bàn kế toán" },
    "k3-duyet-chi": { map: "cong-ty", target: { x: 5, y: 3 }, npc: "giam-doc", quest: "Mang hồ sơ thanh toán sang phòng giám đốc" },
    "k4-chinh-so": { map: "cong-ty", target: { x: 5, y: 3 }, npc: "giam-doc", quest: "Giám đốc gọi bạn vào phòng" },
    "k5-nha-cung-cap": { map: "cong-ty", target: { x: 16, y: 2 }, quest: "Điện thoại bàn kế toán đang reo" },
    "k6-to-khai": { map: "cong-ty", target: { x: 14, y: 2 }, quest: "Hạn tờ khai thuế! Về bàn kế toán" },
    "k7-buoi-toi": { map: "nha", target: { x: 3, y: 2 }, quest: "Về nhà, sắp xếp buổi tối" },
  },
};
writeFileSync(out("content/worlds/ke-toan.json"), JSON.stringify(accountantWorld) + "\n");

// ---------- Kỹ sư xây dựng (SPEC-012): công trường ngoài trời + nhà ----------
// ';' đất, 'c' nền bê tông, 'r' rào tôn (solid), 's' giàn giáo (solid), 'b' sàn cốt thép.
const CONG_TRUONG = [
  "rrrrrrrrrrrrrrrrrrrrrrrrrr",
  "r;;;;;;;;;;;cc;;;;;;;;;;;r",
  "r;sssss;;;;;bbbbbbb;;;;;;r",
  "r;sssss;;;;;bbbbbbb;;;;;;r",
  "r;sssss;;;;;bbbbbbb;;;;;;r",
  "r;sssss;;;;;bbbbbbb;;;;;;r",
  "r;;;;;;;;;;;bbbbbbb;;;;;;r",
  "r;;;;;;;;;;;cc;;;;#.....#r",
  "r;;;;;;;;;;;cc;;;;#.....#r",
  "r;;;;;;;;;;;cc;;;;D.....#r",
  "r;;;;;;;;;;;cc;;;;#.....#r",
  "r;;;;;;;;;;;cc;;;;#######r",
  "r;;;;;;;;;;;cccccc;;;;;;;r",
  "rrrrrrrrrrrrccrrrrrrrrrrrr",
];
const CONG_TRUONG_PROPS = [
  // Lán ban chỉ huy: bàn làm việc, điện thoại, bảng tiến độ, cây
  [20, 8, 85, 1], [21, 8, 86, 1], [22, 8, 97, 1], [23, 8, 329, 1],
  [19, 10, 16, 1],
];
const CONG_TRUONG_DECOR = [[21, 8, 18], [23, 8, 18]];
const SITE_FLOOR = { ";": "site:0", c: "site:1", r: "site:2", s: "site:3", b: "site:4" };

const constructionWorld = {
  profession_id: "ky-su-xay-dung",
  tile_size: 16,
  tilesets: [...world.tilesets, { key: "site", image: "game/site/site.png", columns: SITE.length, spacing: 1 }],
  maps: [
    buildMap("cong-truong", CONG_TRUONG, CONG_TRUONG_PROPS, CONG_TRUONG_DECOR, { x: 12, y: 13 }, SITE_FLOOR),
    buildMap("nha", HOME, HOME_PROPS, HOME_DECOR, { x: 6, y: 5 }),
  ],
  npcs: [
    { id: "cong-nhan-1", map: "cong-truong", x: 13, y: 12, name: "Công nhân tổ 1", sprite: C(0, 121, 128) },
    { id: "cong-nhan-2", map: "cong-truong", x: 8, y: 4, name: "Công nhân giàn giáo", sprite: C(54, 17, 22) },
    { id: "chi-huy-truong", map: "cong-truong", x: 17, y: 4, name: "Chỉ huy trưởng nhà thầu", sprite: C(379) },
    { id: "chu-dau-tu", map: "cong-truong", x: 21, y: 9, name: "Chủ đầu tư", sprite: C(1, 13, 76) },
    { id: "cong-nhan-3", map: "cong-truong", x: 10, y: 10, name: "Công nhân tổ 2", sprite: C(1, 125, 20) },
    { id: "cong-nhan-4", map: "cong-truong", x: 14, y: 11, name: "Công nhân tổ 3", sprite: C(54, 71, 19) },
  ],
  player_sprite: C(0, 13, 20),
  segments: {
    "x1-kiem-tra-dau-ca": { map: "cong-truong", target: { x: 12, y: 12 }, npc: "cong-nhan-1", quest: "Tới cổng công trường, kiểm tra bảo hộ đầu ca" },
    "x2-gian-giao": { map: "cong-truong", target: { x: 6, y: 5 }, npc: "cong-nhan-2", quest: "Tới khu giàn giáo, rà phiếu kiểm tra" },
    "x3-do-be-tong": { map: "cong-truong", target: { x: 15, y: 4 }, npc: "chi-huy-truong", quest: "Lên sàn tầng 5, gặp chỉ huy trưởng nhà thầu" },
    "x4-phan-loai-vi-pham": { map: "cong-truong", target: { x: 23, y: 8 }, quest: "Về lán ban chỉ huy, xem bảng tiến độ" },
    "x5-chu-dau-tu": { map: "cong-truong", target: { x: 22, y: 9 }, npc: "chu-dau-tu", quest: "Họp với chủ đầu tư ở lán ban chỉ huy" },
    "x6-mua-lon": { map: "cong-truong", target: { x: 15, y: 2 }, quest: "Mưa lớn! Quay lại sàn đang thi công" },
    "x7-buoi-toi": { map: "nha", target: { x: 3, y: 2 }, quest: "Về nhà, sắp xếp buổi tối" },
  },
};
writeFileSync(out("content/worlds/ky-su-xay-dung.json"), JSON.stringify(constructionWorld) + "\n");

// ---------- Nhân viên Marketing (SPEC-013): một văn phòng agency ----------
// Phòng họp trái, hành lang bảng ý tưởng giữa, phòng trưởng nhóm phải, khu bàn mở phía dưới.
const AGENCY = [
  "##############################",
  "#...........#...#............#",
  "#...........#...#............#",
  "#...........#...#............#",
  "#...........#...#............#",
  "#...........#...#............#",
  "#...........#...#............#",
  "######D#######D########D######",
  "#............................#",
  "#............................#",
  "#............................#",
  "#............................#",
  "#............................#",
  "#............................#",
  "#............................#",
  "##############################",
];
const AGENCY_PROPS = [
  // Phòng họp: bàn dài, ghế, cây
  [4, 2, 0, 1], [5, 2, 1, 1], [6, 2, 2, 1],
  [4, 3, 162, 1], [5, 3, 163, 1], [6, 3, 164, 1],
  [1, 1, 16, 1], [10, 1, 17, 1],
  // Phòng trưởng nhóm: bàn, kệ hồ sơ, cây
  [21, 2, 85, 1], [22, 2, 86, 1], [23, 2, 97, 1],
  [27, 1, 329, 1], [26, 5, 330, 1], [18, 1, 16, 1], [28, 5, 17, 1],
  // Khu bàn mở: bàn của bạn, bàn designer, bàn content, góc cà phê
  [14, 10, 85, 1], [15, 10, 86, 1], [16, 10, 97, 1],
  [5, 10, 85, 1], [6, 10, 86, 1], [24, 10, 85, 1], [25, 10, 86, 1],
  [1, 13, 324, 1], [2, 13, 325, 1], [3, 13, 326, 1], [28, 14, 17, 1],
];
const AGENCY_DECOR = [
  // Bảng ý tưởng ghép từ các tờ giấy trên tường hành lang.
  [12, 2, 18], [12, 3, 18], [12, 4, 18],
  [15, 10, 18], [6, 10, 18], [25, 10, 18],
];

const marketingWorld = {
  profession_id: "nhan-vien-marketing",
  tile_size: 16,
  tilesets: world.tilesets,
  maps: [
    buildMap("agency", AGENCY, AGENCY_PROPS, AGENCY_DECOR, { x: 15, y: 13 }),
  ],
  npcs: [
    { id: "truong-nhom-hop", map: "agency", x: 3, y: 4, name: "Trưởng nhóm", sprite: C(379) },
    { id: "khach-hang", map: "agency", x: 9, y: 4, name: "Khách hàng", sprite: C(433) },
    { id: "truong-nhom", map: "agency", x: 22, y: 4, name: "Trưởng nhóm", sprite: C(379) },
    { id: "designer", map: "agency", x: 5, y: 11, name: "Đồng nghiệp Designer", sprite: C(54, 17, 22) },
    { id: "content", map: "agency", x: 24, y: 11, name: "Đồng nghiệp Content", sprite: C(1, 13, 76) },
  ],
  player_sprite: C(1, 125, 20),
  segments: {
    "m1-brief": { map: "agency", target: { x: 3, y: 4 }, npc: "truong-nhom-hop", quest: "Vào phòng họp, nhận brief chiến dịch" },
    "m2-duyet-noi-dung": { map: "agency", target: { x: 15, y: 10 }, quest: "Về bàn làm việc, duyệt nội dung trước khi đăng" },
    "m3-y-tuong": { map: "agency", target: { x: 12, y: 3 }, quest: "Tới bảng ý tưởng, xếp lại các đề xuất" },
    "m4-khach-doi-y": { map: "agency", target: { x: 9, y: 4 }, npc: "khach-hang", quest: "Khách hàng đang chờ trong phòng họp" },
    "m5-binh-luan": { map: "agency", target: { x: 15, y: 10 }, quest: "Bình luận tiêu cực lan nhanh, về bàn xử lý" },
    "m6-chia-thoi-gian": { map: "agency", target: { x: 15, y: 10 }, quest: "Chia ba giờ còn lại cho các việc cuối ngày" },
    "m7-bao-cao-kpi": { map: "agency", target: { x: 22, y: 4 }, npc: "truong-nhom", quest: "Mang số liệu KPI sang phòng trưởng nhóm" },
  },
};
writeFileSync(out("content/worlds/nhan-vien-marketing.json"), JSON.stringify(marketingWorld) + "\n");

// ---------- Dược sĩ nhà thuốc (SPEC-015): một nhà thuốc ----------
// Kho nhỏ trái, tủ thuốc kê đơn sau quầy ở giữa, phòng dược sĩ phụ trách phải, khu bán hàng phía dưới.
const NHA_THUOC = AGENCY;
const NHA_THUOC_PROPS = [
  // Kho: kệ hàng, thùng thuốc, tủ lạnh bảo quản
  [2, 1, 329, 1], [4, 1, 329, 1], [6, 1, 329, 1], [8, 1, 330, 1],
  [2, 5, 330, 1], [9, 5, 330, 1],
  // Tủ thuốc kê đơn phía sau quầy
  [13, 1, 329, 1], [15, 1, 329, 1],
  // Phòng dược sĩ phụ trách: bàn, kệ hồ sơ, cây
  [21, 2, 85, 1], [22, 2, 86, 1], [23, 2, 97, 1],
  [27, 1, 329, 1], [18, 1, 16, 1], [28, 5, 17, 1],
  // Quầy tư vấn
  [12, 9, 85, 1], [13, 9, 86, 1], [14, 9, 86, 1], [15, 9, 86, 1], [16, 9, 97, 1],
  // Kệ thuốc không kê đơn hai bên, ghế chờ, cây
  [3, 10, 329, 1], [4, 10, 330, 1], [25, 10, 329, 1], [26, 10, 330, 1],
  [1, 13, 162, 1], [2, 13, 163, 1], [3, 13, 164, 1], [28, 14, 17, 1],
];
const NHA_THUOC_DECOR = [
  // Nhiệt kế, ẩm kế và sổ theo dõi trên tường kho.
  [3, 3, 18], [5, 3, 18],
  // Bảng hướng dẫn trên quầy.
  [14, 9, 18],
];

const pharmacyWorld = {
  profession_id: "duoc-si",
  tile_size: 16,
  tilesets: world.tilesets,
  maps: [
    buildMap("nha-thuoc", NHA_THUOC, NHA_THUOC_PROPS, NHA_THUOC_DECOR, { x: 14, y: 12 }),
  ],
  npcs: [
    { id: "duoc-si-phu-trach", map: "nha-thuoc", x: 5, y: 4, name: "Dược sĩ phụ trách", sprite: C(379) },
    { id: "me-be", map: "nha-thuoc", x: 13, y: 10, name: "Mẹ bé K.", sprite: C(54, 17, 22) },
    { id: "khach-quen", map: "nha-thuoc", x: 15, y: 10, name: "Khách quen", sprite: C(433) },
    { id: "khach-quay-lai", map: "nha-thuoc", x: 11, y: 11, name: "Khách quay lại", sprite: C(1, 13, 76) },
    { id: "khach-mua-do", map: "nha-thuoc", x: 4, y: 11, name: "Khách mua đồ", sprite: C(1, 125, 20) },
  ],
  player_sprite: C(1, 125, 20),
  segments: {
    "d1-mo-cua": { map: "nha-thuoc", target: { x: 5, y: 4 }, npc: "duoc-si-phu-trach", quest: "Vào kho, kiểm nhiệt kế, ẩm kế cùng dược sĩ phụ trách" },
    "d2-soat-don": { map: "nha-thuoc", target: { x: 13, y: 10 }, npc: "me-be", quest: "Ra quầy, soát đơn thuốc của mẹ bé K." },
    "d3-xep-yeu-cau": { map: "nha-thuoc", target: { x: 14, y: 9 }, quest: "Quầy đông khách, xử lý từng yêu cầu mua thuốc" },
    "d4-khach-doi-mua": { map: "nha-thuoc", target: { x: 15, y: 10 }, npc: "khach-quen", quest: "Khách quen đang chờ ở quầy" },
    "d5-thuoc-het-han": { map: "nha-thuoc", target: { x: 5, y: 4 }, npc: "duoc-si-phu-trach", quest: "Vào kho kiểm hàng, báo dược sĩ phụ trách" },
    "d6-chia-thoi-gian": { map: "nha-thuoc", target: { x: 14, y: 9 }, quest: "Về quầy, chia thời gian ca chiều" },
    "d7-khach-quay-lai": { map: "nha-thuoc", target: { x: 11, y: 11 }, npc: "khach-quay-lai", quest: "Một khách quay lại quầy, trông không khỏe" },
  },
};
writeFileSync(out("content/worlds/duoc-si.json"), JSON.stringify(pharmacyWorld) + "\n");

// ---------- Luật sư (SPEC-016): một văn phòng luật ----------
// Phòng tiếp khách trái, phòng hồ sơ hẹp ở giữa, phòng luật sư điều hành phải, khu bàn làm việc phía dưới.
const VAN_PHONG_LUAT = AGENCY;
const VAN_PHONG_LUAT_PROPS = [
  // Phòng tiếp khách: bàn, ghế, cây
  [4, 2, 0, 1], [5, 2, 1, 1], [6, 2, 2, 1],
  [4, 3, 162, 1], [5, 3, 163, 1], [6, 3, 164, 1],
  [1, 1, 16, 1], [10, 1, 17, 1],
  // Phòng hồ sơ: kệ tài liệu
  [13, 1, 329, 1], [15, 1, 329, 1], [13, 5, 330, 1], [15, 5, 330, 1],
  // Phòng luật sư điều hành: bàn, kệ sách, cây
  [21, 2, 85, 1], [22, 2, 86, 1], [23, 2, 97, 1],
  [27, 1, 329, 1], [26, 5, 330, 1], [18, 1, 16, 1], [28, 5, 17, 1],
  // Khu bàn làm việc: bàn của bạn, bàn thư ký, góc nước
  [14, 10, 85, 1], [15, 10, 86, 1], [16, 10, 97, 1],
  [5, 10, 85, 1], [6, 10, 86, 1],
  [1, 13, 324, 1], [2, 13, 325, 1], [3, 13, 326, 1], [28, 14, 17, 1],
];
const VAN_PHONG_LUAT_DECOR = [
  // Giấy tờ trên bàn và lịch phiên tòa trên tường.
  [15, 10, 18], [6, 10, 18], [24, 1, 18],
];

const lawWorld = {
  profession_id: "luat-su",
  tile_size: 16,
  tilesets: world.tilesets,
  maps: [
    buildMap("van-phong-luat", VAN_PHONG_LUAT, VAN_PHONG_LUAT_PROPS, VAN_PHONG_LUAT_DECOR, { x: 15, y: 13 }),
  ],
  npcs: [
    { id: "luat-su-dieu-hanh", map: "van-phong-luat", x: 22, y: 4, name: "Luật sư điều hành", sprite: C(379) },
    { id: "khach-hang", map: "van-phong-luat", x: 3, y: 4, name: "Khách hàng", sprite: C(54, 17, 22) },
    { id: "nguoi-ben-kia", map: "van-phong-luat", x: 9, y: 4, name: "Chủ nhà (bên kia)", sprite: C(433) },
    { id: "thu-ky", map: "van-phong-luat", x: 5, y: 11, name: "Thư ký", sprite: C(1, 13, 76) },
  ],
  player_sprite: C(1, 125, 20),
  segments: {
    "ls1-chuan-bi-ho-so": { map: "van-phong-luat", target: { x: 22, y: 4 }, npc: "luat-su-dieu-hanh", quest: "Sang phòng luật sư điều hành nhận việc chuẩn bị hồ sơ" },
    "ls2-ra-hop-dong": { map: "van-phong-luat", target: { x: 15, y: 10 }, quest: "Về bàn làm việc, rà hợp đồng dịch vụ pháp lý" },
    "ls3-xep-tai-lieu": { map: "van-phong-luat", target: { x: 14, y: 3 }, quest: "Vào phòng hồ sơ, chọn tài liệu nộp cho tòa" },
    "ls4-khach-noi-sai": { map: "van-phong-luat", target: { x: 3, y: 4 }, npc: "khach-hang", quest: "Khách hàng đang chờ ở phòng tiếp khách" },
    "ls5-sap-het-han": { map: "van-phong-luat", target: { x: 15, y: 10 }, quest: "Về bàn, xử lý giấy tờ còn thiếu trước hạn nộp" },
    "ls6-chia-thoi-gian": { map: "van-phong-luat", target: { x: 15, y: 10 }, quest: "Chia thời gian cho các việc cuối chiều" },
    "ls7-xung-dot-loi-ich": { map: "van-phong-luat", target: { x: 9, y: 4 }, npc: "nguoi-ben-kia", quest: "Có người lạ chờ bạn ở phòng tiếp khách" },
  },
};
writeFileSync(out("content/worlds/luat-su.json"), JSON.stringify(lawWorld) + "\n");

// ---------- Nhà thiết kế đồ họa (SPEC-017): một studio nhỏ ----------
// Phòng họp trái, hành lang có bảng moodboard giữa, phòng trưởng nhóm phải, khu bàn làm việc phía dưới.
const STUDIO = AGENCY;
const STUDIO_PROPS = [
  // Phòng họp: bàn dài, ghế, cây
  [4, 2, 0, 1], [5, 2, 1, 1], [6, 2, 2, 1],
  [4, 3, 162, 1], [5, 3, 163, 1], [6, 3, 164, 1],
  [1, 1, 16, 1], [10, 1, 17, 1],
  // Phòng trưởng nhóm: bàn, kệ mẫu in, cây
  [21, 2, 85, 1], [22, 2, 86, 1], [23, 2, 97, 1],
  [27, 1, 329, 1], [26, 5, 330, 1], [18, 1, 16, 1], [28, 5, 17, 1],
  // Khu bàn làm việc: bàn của bạn, bàn đồng nghiệp in ấn, kệ giấy mẫu
  [14, 10, 85, 1], [15, 10, 86, 1], [16, 10, 97, 1],
  [24, 10, 85, 1], [25, 10, 86, 1],
  [2, 10, 329, 1], [3, 10, 330, 1], [28, 14, 17, 1],
];
const STUDIO_DECOR = [
  // Bảng moodboard ghép từ ảnh, mẫu màu trên tường hành lang.
  [12, 2, 18], [12, 3, 18], [12, 4, 18],
  [15, 10, 18], [25, 10, 18],
];

const designWorld = {
  profession_id: "thiet-ke-do-hoa",
  tile_size: 16,
  tilesets: world.tilesets,
  maps: [
    buildMap("studio", STUDIO, STUDIO_PROPS, STUDIO_DECOR, { x: 15, y: 13 }),
  ],
  npcs: [
    { id: "truong-nhom", map: "studio", x: 22, y: 4, name: "Trưởng nhóm", sprite: C(379) },
    { id: "khach-hang", map: "studio", x: 3, y: 4, name: "Chủ tiệm bánh", sprite: C(433) },
    { id: "dong-nghiep-in", map: "studio", x: 24, y: 11, name: "Đồng nghiệp in ấn", sprite: C(1, 13, 76) },
  ],
  player_sprite: C(1, 125, 20),
  segments: {
    "tk1-doc-brief": { map: "studio", target: { x: 22, y: 4 }, npc: "truong-nhom", quest: "Sang phòng trưởng nhóm nhận brief" },
    "tk2-soat-file-in": { map: "studio", target: { x: 15, y: 10 }, quest: "Về bàn, soát file trước khi gửi in" },
    "tk3-xep-tu-lieu": { map: "studio", target: { x: 12, y: 3 }, quest: "Tới bảng moodboard, chọn tư liệu được phép dùng" },
    "tk4-khach-doi-sua": { map: "studio", target: { x: 3, y: 4 }, npc: "khach-hang", quest: "Chủ tiệm bánh đang chờ ở phòng họp" },
    "tk5-lay-cam-hung": { map: "studio", target: { x: 15, y: 10 }, quest: "Khách vừa gửi một logo mẫu, về bàn xem" },
    "tk6-chia-thoi-gian": { map: "studio", target: { x: 15, y: 10 }, quest: "Chia thời gian cho các việc cuối chiều" },
    "tk7-truong-nhom-gop-y": { map: "studio", target: { x: 22, y: 4 }, npc: "truong-nhom", quest: "Mang bản thiết kế sang cho trưởng nhóm xem" },
  },
};
writeFileSync(out("content/worlds/thiet-ke-do-hoa.json"), JSON.stringify(designWorld) + "\n");

// ---------- Giao dịch viên ngân hàng (SPEC-018): một chi nhánh ngân hàng ----------
// Kho quỹ trái, hành lang giữa, phòng trưởng phòng phải, sảnh giao dịch với quầy và ghế chờ phía dưới.
const CHI_NHANH = AGENCY;
const CHI_NHANH_PROPS = [
  // Kho quỹ: két, kệ tiền, bàn kiểm đếm
  [2, 1, 329, 1], [4, 1, 329, 1], [8, 1, 330, 1],
  [4, 3, 85, 1], [5, 3, 86, 1], [6, 3, 97, 1],
  // Phòng trưởng phòng: bàn, kệ hồ sơ, cây
  [21, 2, 85, 1], [22, 2, 86, 1], [23, 2, 97, 1],
  [27, 1, 329, 1], [26, 5, 330, 1], [18, 1, 16, 1], [28, 5, 17, 1],
  // Quầy giao dịch
  [12, 9, 85, 1], [13, 9, 86, 1], [14, 9, 86, 1], [15, 9, 86, 1], [16, 9, 97, 1],
  // Khu khách chờ: dãy ghế, cây
  [2, 13, 162, 1], [3, 13, 163, 1], [4, 13, 164, 1],
  [24, 13, 162, 1], [25, 13, 163, 1], [26, 13, 164, 1],
  [1, 11, 16, 1], [28, 14, 17, 1],
];
const CHI_NHANH_DECOR = [
  // Bảng tỷ giá, bảng cảnh báo lừa đảo trên tường.
  [12, 2, 18], [12, 4, 18], [14, 9, 18],
];

const bankWorld = {
  profession_id: "giao-dich-vien-ngan-hang",
  tile_size: 16,
  tilesets: world.tilesets,
  maps: [
    buildMap("chi-nhanh", CHI_NHANH, CHI_NHANH_PROPS, CHI_NHANH_DECOR, { x: 14, y: 12 }),
  ],
  npcs: [
    { id: "truong-phong", map: "chi-nhanh", x: 22, y: 4, name: "Trưởng phòng", sprite: C(379) },
    { id: "truong-phong-kho", map: "chi-nhanh", x: 5, y: 4, name: "Trưởng phòng", sprite: C(379) },
    { id: "khach-mo-tk", map: "chi-nhanh", x: 13, y: 10, name: "Khách mở tài khoản", sprite: C(1, 13, 76) },
    { id: "ba-cu", map: "chi-nhanh", x: 15, y: 10, name: "Bà cụ", sprite: C(433) },
    { id: "bao-ve", map: "chi-nhanh", x: 10, y: 13, name: "Bảo vệ", sprite: C(54, 17, 22) },
  ],
  player_sprite: C(1, 125, 20),
  segments: {
    "gd1-mo-quay": { map: "chi-nhanh", target: { x: 5, y: 4 }, npc: "truong-phong-kho", quest: "Vào kho quỹ nhận tiền mặt đầu ngày" },
    "gd2-ho-so-mo-tk": { map: "chi-nhanh", target: { x: 13, y: 10 }, npc: "khach-mo-tk", quest: "Ra quầy, soát hồ sơ mở tài khoản của khách" },
    "gd3-dau-hieu-lua-dao": { map: "chi-nhanh", target: { x: 14, y: 9 }, quest: "Quầy đông khách, để ý các dấu hiệu bất thường" },
    "gd4-khach-cao-tuoi": { map: "chi-nhanh", target: { x: 15, y: 10 }, npc: "ba-cu", quest: "Một bà cụ đang chờ ở quầy, trông rất lo lắng" },
    "gd5-chi-tieu-bao-hiem": { map: "chi-nhanh", target: { x: 22, y: 4 }, npc: "truong-phong", quest: "Trưởng phòng gọi bạn vào nhắc chỉ tiêu" },
    "gd6-chia-thoi-gian": { map: "chi-nhanh", target: { x: 14, y: 9 }, quest: "Về quầy, chia thời gian cuối chiều" },
    "gd7-lech-quy": { map: "chi-nhanh", target: { x: 5, y: 4 }, npc: "truong-phong-kho", quest: "Mang quỹ vào kho đối chiếu cuối ngày" },
  },
};
writeFileSync(out("content/worlds/giao-dich-vien-ngan-hang.json"), JSON.stringify(bankWorld) + "\n");

// ---------- Đầu bếp nhà hàng (SPEC-019): một bếp nhà hàng ----------
// Kho lạnh trái, khu sơ chế giữa, phòng bếp trưởng phải, khu món nóng và quầy ra món phía dưới.
const BEP_NHA_HANG = AGENCY;
const BEP_NHA_HANG_PROPS = [
  // Kho lạnh: tủ, kệ nguyên liệu
  [2, 1, 329, 1], [4, 1, 329, 1], [6, 1, 329, 1], [8, 1, 330, 1],
  [2, 5, 330, 1], [9, 5, 330, 1],
  // Khu sơ chế: bàn sơ chế
  [13, 2, 85, 1], [14, 2, 86, 1], [15, 2, 97, 1],
  // Phòng bếp trưởng: bàn, kệ, cây
  [21, 2, 85, 1], [22, 2, 86, 1], [23, 2, 97, 1],
  [27, 1, 329, 1], [18, 1, 16, 1], [28, 5, 17, 1],
  // Khu món nóng: dãy bếp
  [12, 10, 85, 1], [13, 10, 86, 1], [14, 10, 86, 1], [15, 10, 86, 1], [16, 10, 97, 1],
  // Quầy ra món
  [22, 12, 85, 1], [23, 12, 86, 1], [24, 12, 97, 1],
  [1, 13, 324, 1], [2, 13, 325, 1], [28, 14, 17, 1],
];
const BEP_NHA_HANG_DECOR = [
  // Phiếu order và bảng thực đơn trên tường.
  [23, 12, 18], [14, 10, 18], [12, 3, 18],
];

const kitchenWorld = {
  profession_id: "dau-bep",
  tile_size: 16,
  tilesets: world.tilesets,
  maps: [
    buildMap("bep-nha-hang", BEP_NHA_HANG, BEP_NHA_HANG_PROPS, BEP_NHA_HANG_DECOR, { x: 14, y: 12 }),
  ],
  npcs: [
    { id: "bep-truong", map: "bep-nha-hang", x: 22, y: 4, name: "Bếp trưởng", sprite: C(379) },
    { id: "bep-truong-kho", map: "bep-nha-hang", x: 5, y: 3, name: "Bếp trưởng", sprite: C(379) },
    { id: "phuc-vu", map: "bep-nha-hang", x: 23, y: 13, name: "Nhân viên phục vụ", sprite: C(1, 13, 76) },
    { id: "phu-bep", map: "bep-nha-hang", x: 14, y: 4, name: "Phụ bếp", sprite: C(54, 17, 22) },
  ],
  player_sprite: C(1, 125, 20),
  segments: {
    "db1-dau-ca": { map: "bep-nha-hang", target: { x: 22, y: 4 }, npc: "bep-truong", quest: "Gặp bếp trưởng nhận việc đầu ca" },
    "db2-soat-ve-sinh": { map: "bep-nha-hang", target: { x: 14, y: 2 }, quest: "Đi một vòng khu sơ chế, soát lỗi vệ sinh" },
    "db3-xep-nguyen-lieu": { map: "bep-nha-hang", target: { x: 4, y: 1 }, quest: "Vào kho lạnh, loại nguyên liệu không đạt" },
    "db4-khach-di-ung": { map: "bep-nha-hang", target: { x: 23, y: 13 }, npc: "phuc-vu", quest: "Phục vụ đang gọi bạn ở quầy ra món" },
    "db5-do-thua": { map: "bep-nha-hang", target: { x: 5, y: 3 }, npc: "bep-truong-kho", quest: "Bếp trưởng gọi bạn vào kho lạnh" },
    "db6-chia-thoi-gian": { map: "bep-nha-hang", target: { x: 14, y: 10 }, quest: "Về khu món nóng, chuẩn bị cho ca tối" },
    "db7-gio-cao-diem": { map: "bep-nha-hang", target: { x: 23, y: 12 }, quest: "Giờ cao điểm tối, ra quầy xem phiếu order" },
  },
};
writeFileSync(out("content/worlds/dau-bep.json"), JSON.stringify(kitchenWorld) + "\n");

// ---------- Kiến trúc sư (SPEC-020): một văn phòng kiến trúc ----------
// Phòng họp trái, hành lang có bảng phương án giữa, phòng kiến trúc sư chủ trì phải, khu bàn vẽ và bàn mô hình phía dưới.
const VAN_PHONG_KIEN_TRUC = AGENCY;
const VAN_PHONG_KIEN_TRUC_PROPS = [
  // Phòng họp: bàn dài, ghế, cây
  [4, 2, 0, 1], [5, 2, 1, 1], [6, 2, 2, 1],
  [4, 3, 162, 1], [5, 3, 163, 1], [6, 3, 164, 1],
  [1, 1, 16, 1], [10, 1, 17, 1],
  // Phòng kiến trúc sư chủ trì: bàn, kệ hồ sơ, cây
  [21, 2, 85, 1], [22, 2, 86, 1], [23, 2, 97, 1],
  [27, 1, 329, 1], [26, 5, 330, 1], [18, 1, 16, 1], [28, 5, 17, 1],
  // Khu bàn vẽ: bàn của bạn, bàn đồng nghiệp dựng hình
  [14, 10, 85, 1], [15, 10, 86, 1], [16, 10, 97, 1],
  [24, 10, 85, 1], [25, 10, 86, 1],
  // Bàn mô hình
  [4, 12, 85, 1], [5, 12, 86, 1], [6, 12, 97, 1], [28, 14, 17, 1],
];
const VAN_PHONG_KIEN_TRUC_DECOR = [
  // Bảng phương án ghim bản vẽ trên tường hành lang; mô hình trên bàn.
  [12, 2, 18], [12, 3, 18], [12, 4, 18],
  [15, 10, 18], [5, 12, 18],
];

const architectWorld = {
  profession_id: "kien-truc-su",
  tile_size: 16,
  tilesets: world.tilesets,
  maps: [
    buildMap("van-phong-kien-truc", VAN_PHONG_KIEN_TRUC, VAN_PHONG_KIEN_TRUC_PROPS, VAN_PHONG_KIEN_TRUC_DECOR, { x: 15, y: 13 }),
  ],
  npcs: [
    { id: "kts-chu-tri", map: "van-phong-kien-truc", x: 22, y: 4, name: "Kiến trúc sư chủ trì", sprite: C(379) },
    { id: "chu-nha", map: "van-phong-kien-truc", x: 3, y: 4, name: "Anh Lâm (chủ nhà)", sprite: C(433) },
    { id: "ky-su-ket-cau", map: "van-phong-kien-truc", x: 9, y: 4, name: "Kỹ sư kết cấu", sprite: C(54, 17, 22) },
    { id: "dong-nghiep-dung-hinh", map: "van-phong-kien-truc", x: 24, y: 11, name: "Đồng nghiệp dựng hình", sprite: C(1, 13, 76) },
  ],
  player_sprite: C(1, 125, 20),
  segments: {
    "kt1-khao-sat": { map: "van-phong-kien-truc", target: { x: 22, y: 4 }, npc: "kts-chu-tri", quest: "Sang phòng kiến trúc sư chủ trì nhận dự án" },
    "kt2-soat-ban-ve": { map: "van-phong-kien-truc", target: { x: 15, y: 10 }, quest: "Về bàn vẽ, soát bộ bản vẽ trình" },
    "kt3-yeu-cau-chu-nha": { map: "van-phong-kien-truc", target: { x: 12, y: 3 }, quest: "Tới bảng phương án, xếp các yêu cầu của chủ nhà" },
    "kt4-vuot-giay-phep": { map: "van-phong-kien-truc", target: { x: 3, y: 4 }, npc: "chu-nha", quest: "Anh Lâm đang chờ trong phòng họp" },
    "kt5-cat-ngan-sach": { map: "van-phong-kien-truc", target: { x: 3, y: 4 }, npc: "chu-nha", quest: "Chủ nhà muốn bàn lại ngân sách" },
    "kt6-chia-thoi-gian": { map: "van-phong-kien-truc", target: { x: 5, y: 12 }, quest: "Tới bàn mô hình, chia thời gian cuối chiều" },
    "kt7-ket-cau": { map: "van-phong-kien-truc", target: { x: 9, y: 4 }, npc: "ky-su-ket-cau", quest: "Kỹ sư kết cấu muốn trao đổi về phương án" },
  },
};
writeFileSync(out("content/worlds/kien-truc-su.json"), JSON.stringify(architectWorld) + "\n");

// ---------- Giáo viên mầm non (SPEC-021): một trường mầm non ----------
// Lớp mẫu giáo (bàn giáo viên, góc chơi) trái, khu ăn phải, hành lang có cửa lớp giữa, sân chơi cỏ phía dưới.
const TRUONG_MAM_NON = [
  "##############################",
  "#.................#..........#",
  "#.................#..........#",
  "#.................#..........#",
  "#.................#..........#",
  "#.................#..........#",
  "#.................#..........#",
  "#########D############D#######",
  "#............................#",
  "#............................#",
  "#######=######################",
  "#gggggg=ggggggggggggggggggggg#",
  "#gggggg=ggggggggggggggggggggg#",
  "#gggggg=ggggggggggggggggggggg#",
  "#gggggg=ggggggggggggggggggggg#",
  "##############################",
];
const TRUONG_MAM_NON_PROPS = [
  // Lớp: bàn giáo viên, kệ đồ chơi góc chơi, bàn nhỏ của trẻ, cây
  [2, 2, 85, 1], [3, 2, 86, 1], [4, 2, 97, 1],
  [14, 1, 329, 1], [15, 1, 330, 1], [16, 1, 329, 1],
  [8, 4, 5, 1], [10, 4, 5, 1], [12, 4, 5, 1], [1, 6, 16, 1], [16, 6, 17, 1],
  // Khu ăn: bàn dài, ghế, cây
  [21, 3, 0, 1], [22, 3, 1, 1], [23, 3, 1, 1], [24, 3, 2, 1],
  [21, 4, 162, 1], [22, 4, 163, 1], [23, 4, 163, 1], [24, 4, 164, 1],
  [28, 1, 16, 1],
  // Sân chơi: cây
  [3, 12, 17, 1], [27, 12, 17, 1], [18, 14, 16, 1],
];
const TRUONG_MAM_NON_DECOR = [
  // Sổ theo dõi trên bàn giáo viên, tranh của trẻ trên kệ góc chơi.
  [3, 2, 18], [15, 1, 18],
];
const KID = C(1, 13, 76);

const preschoolWorld = {
  profession_id: "giao-vien-mam-non",
  tile_size: 16,
  tilesets: world.tilesets,
  maps: [
    buildMap("truong-mam-non", TRUONG_MAM_NON, TRUONG_MAM_NON_PROPS, TRUONG_MAM_NON_DECOR, { x: 9, y: 8 }),
  ],
  npcs: [
    { id: "co-lan", map: "truong-mam-non", x: 11, y: 8, name: "Cô Lan (giáo viên cùng lớp)", sprite: C(379) },
    { id: "hieu-pho-lop", map: "truong-mam-non", x: 5, y: 3, name: "Cô hiệu phó chuyên môn", sprite: C(54, 17, 22) },
    { id: "hieu-pho-san", map: "truong-mam-non", x: 14, y: 12, name: "Cô hiệu phó chuyên môn", sprite: C(54, 17, 22) },
    { id: "cap-duong", map: "truong-mam-non", x: 25, y: 4, name: "Cô cấp dưỡng", sprite: C(433) },
    { id: "me-be-su", map: "truong-mam-non", x: 7, y: 8, name: "Chị Mai (mẹ bé Su)", sprite: C(1, 125, 20) },
    { id: "tre-1", map: "truong-mam-non", x: 9, y: 5, name: "Một bạn nhỏ", sprite: KID },
    { id: "tre-2", map: "truong-mam-non", x: 20, y: 12, name: "Một bạn nhỏ", sprite: KID },
  ],
  player_sprite: C(1, 125, 20),
  segments: {
    "mn1-don-tre": { map: "truong-mam-non", target: { x: 11, y: 8 }, npc: "co-lan", quest: "Ra cửa lớp cùng cô Lan đón trẻ" },
    "mn2-ke-hoach": { map: "truong-mam-non", target: { x: 5, y: 3 }, npc: "hieu-pho-lop", quest: "Về bàn giáo viên, soát kế hoạch ngày" },
    "mn3-goc-choi": { map: "truong-mam-non", target: { x: 15, y: 2 }, quest: "Tới góc chơi, kiểm tra đồ dùng" },
    "mn4-gio-an": { map: "truong-mam-non", target: { x: 25, y: 4 }, npc: "cap-duong", quest: "Sang khu ăn, giờ ăn trưa đã tới" },
    "mn5-chia-thoi-gian": { map: "truong-mam-non", target: { x: 3, y: 3 }, quest: "Trẻ ngủ rồi, về bàn giáo viên làm việc" },
    "mn6-va-cham": { map: "truong-mam-non", target: { x: 14, y: 12 }, npc: "hieu-pho-san", quest: "Ra sân chơi, có bé vừa bị ngã" },
    "mn7-tra-tre": { map: "truong-mam-non", target: { x: 7, y: 8 }, npc: "me-be-su", quest: "Giờ trả trẻ, mẹ bé Su đang chờ ở cửa lớp" },
  },
};
writeFileSync(out("content/worlds/giao-vien-mam-non.json"), JSON.stringify(preschoolWorld) + "\n");

// ---------- Phóng viên (SPEC-022): một tòa soạn báo điện tử ----------
// Phòng họp trái, hành lang có bảng đề tài giữa, phòng thư ký tòa soạn phải, khu bàn phóng viên và góc in thử phía dưới.
const TOA_SOAN = AGENCY;
const TOA_SOAN_PROPS = [
  // Phòng họp: bàn dài, ghế, cây
  [4, 2, 0, 1], [5, 2, 1, 1], [6, 2, 2, 1],
  [4, 3, 162, 1], [5, 3, 163, 1], [6, 3, 164, 1],
  [1, 1, 16, 1], [10, 1, 17, 1],
  // Phòng thư ký tòa soạn: bàn, kệ báo, cây
  [21, 2, 85, 1], [22, 2, 86, 1], [23, 2, 97, 1],
  [27, 1, 329, 1], [26, 5, 330, 1], [18, 1, 16, 1], [28, 5, 17, 1],
  // Khu bàn phóng viên: bàn của bạn, bàn trưởng ban, bàn phóng viên ảnh
  [14, 10, 85, 1], [15, 10, 86, 1], [16, 10, 97, 1],
  [5, 10, 85, 1], [6, 10, 86, 1], [24, 10, 85, 1], [25, 10, 86, 1],
  // Góc in thử
  [1, 13, 324, 1], [2, 13, 325, 1], [28, 14, 17, 1],
];
const TOA_SOAN_DECOR = [
  // Bảng đề tài ghim giấy trên tường hành lang; bản thảo trên bàn.
  [12, 2, 18], [12, 3, 18], [12, 4, 18],
  [15, 10, 18], [6, 10, 18], [2, 13, 18],
];

const reporterWorld = {
  profession_id: "phong-vien",
  tile_size: 16,
  tilesets: world.tilesets,
  maps: [
    buildMap("toa-soan", TOA_SOAN, TOA_SOAN_PROPS, TOA_SOAN_DECOR, { x: 15, y: 12 }),
  ],
  npcs: [
    { id: "thu-ky-toa-soan", map: "toa-soan", x: 22, y: 4, name: "Thư ký tòa soạn", sprite: C(379) },
    { id: "truong-ban", map: "toa-soan", x: 6, y: 11, name: "Trưởng ban Xã hội", sprite: C(54, 17, 22) },
    { id: "ba-hanh", map: "toa-soan", x: 3, y: 4, name: "Bà Hạnh (người dân sống sát kè)", sprite: C(433) },
    { id: "phong-vien-anh", map: "toa-soan", x: 24, y: 11, name: "Phóng viên ảnh", sprite: C(1, 13, 76) },
  ],
  player_sprite: C(1, 125, 20),
  segments: {
    "pv1-nhan-de-tai": { map: "toa-soan", target: { x: 22, y: 4 }, npc: "thu-ky-toa-soan", quest: "Sang phòng thư ký tòa soạn nhận đề tài" },
    "pv2-nguon-tin": { map: "toa-soan", target: { x: 15, y: 11 }, quest: "Mở điện thoại xem tin trên mạng xã hội" },
    "pv3-xep-thong-tin": { map: "toa-soan", target: { x: 12, y: 3 }, quest: "Tới bảng đề tài, xếp thông tin thu được" },
    "pv4-ban-thao": { map: "toa-soan", target: { x: 6, y: 11 }, npc: "truong-ban", quest: "Soát bản thảo trước khi gửi trưởng ban" },
    "pv5-chia-thoi-gian": { map: "toa-soan", target: { x: 15, y: 11 }, quest: "Về bàn, chia thời gian trước hạn nộp" },
    "pv6-rut-loi": { map: "toa-soan", target: { x: 3, y: 4 }, npc: "ba-hanh", quest: "Bà Hạnh đang chờ bạn ở phòng họp" },
    "pv7-doi-tit": { map: "toa-soan", target: { x: 22, y: 4 }, npc: "thu-ky-toa-soan", quest: "Thư ký tòa soạn gọi bạn về cái tít" },
  },
};
writeFileSync(out("content/worlds/phong-vien.json"), JSON.stringify(reporterWorld) + "\n");

// ---------- Hướng dẫn viên du lịch (SPEC-023): một quần thể di tích hư cấu ----------
// Nhà hàng trái, sân chính giữa (lối vào qua cổng di tích), khu bán hàng phải; đường lớn và bãi xe phía dưới.
const DIEM_THAM_QUAN = [
  "##############################",
  "#,,,,,,,#gggggggggggg#.......#",
  "#,,,,,,,#gggggggggggg#.......#",
  "#,,,,,,,#gggggggggggg#.......#",
  "#,,,,,,,#gggggggggggg#.......#",
  "#,,,,,,,#gggggggggggg#.......#",
  "####D####ggggg=gggggg####D####",
  "#ggggggggggggg=gggggggggggggg#",
  "#============================#",
  "#ggggggggggggg=gggggggggggggg#",
  "#ggggggggggggg=gggggggggggggg#",
  "#ggggggggggggg=gggggggggggggg#",
  "#ggggggggggggg=gggggggggggggg#",
  "#ggggggggggggg=gggggggggggggg#",
  "#============================#",
  "##############################",
];
const DIEM_THAM_QUAN_PROPS = [
  // Nhà hàng: bàn dài, ghế, cây
  [2, 2, 0, 1], [3, 2, 1, 1], [4, 2, 2, 1],
  [2, 3, 162, 1], [3, 3, 163, 1], [4, 3, 164, 1],
  [7, 1, 16, 1],
  // Sân chính của di tích: cây cảnh hai bên
  [10, 1, 16, 1], [19, 1, 17, 1], [10, 5, 17, 1], [19, 5, 16, 1],
  // Khu bán hàng: kệ hàng lưu niệm, quầy
  [22, 1, 329, 1], [23, 1, 330, 1], [27, 1, 329, 1],
  [25, 3, 85, 1], [26, 3, 86, 1],
  // Bãi xe: cây ven đường
  [2, 11, 17, 1], [27, 11, 16, 1],
];
const DIEM_THAM_QUAN_DECOR = [
  // Đồ lưu niệm trên quầy, thực đơn trên bàn nhà hàng.
  [26, 3, 18], [3, 2, 18],
];

const guideWorld = {
  profession_id: "huong-dan-vien-du-lich",
  tile_size: 16,
  tilesets: world.tilesets,
  maps: [
    buildMap("diem-tham-quan", DIEM_THAM_QUAN, DIEM_THAM_QUAN_PROPS, DIEM_THAM_QUAN_DECOR, { x: 14, y: 13 }),
  ],
  npcs: [
    { id: "tai-xe", map: "diem-tham-quan", x: 17, y: 12, name: "Anh Toàn (tài xế)", sprite: C(54, 17, 22) },
    { id: "truong-doan", map: "diem-tham-quan", x: 11, y: 12, name: "Chú Bình (trưởng đoàn khách)", sprite: C(433) },
    { id: "truong-doan-san", map: "diem-tham-quan", x: 12, y: 3, name: "Chú Bình (trưởng đoàn khách)", sprite: C(433) },
    { id: "bao-ve", map: "diem-tham-quan", x: 15, y: 7, name: "Bảo vệ di tích", sprite: C(379) },
    { id: "bac-tu", map: "diem-tham-quan", x: 18, y: 4, name: "Bác Tư (khách)", sprite: C(1, 13, 76) },
    { id: "chu-cua-hang", map: "diem-tham-quan", x: 25, y: 4, name: "Chủ cửa hàng lưu niệm", sprite: C(1, 125, 20) },
  ],
  player_sprite: C(1, 125, 20),
  segments: {
    "hd1-xuat-phat": { map: "diem-tham-quan", target: { x: 17, y: 12 }, npc: "tai-xe", quest: "Ra bãi xe gặp tài xế, chuẩn bị đón đoàn" },
    "hd2-soat-chuong-trinh": { map: "diem-tham-quan", target: { x: 11, y: 12 }, npc: "truong-doan", quest: "Cùng trưởng đoàn xem lại chương trình tour" },
    "hd3-yeu-cau-khach": { map: "diem-tham-quan", target: { x: 15, y: 7 }, npc: "bao-ve", quest: "Dẫn đoàn tới cổng di tích" },
    "hd4-lac-doan": { map: "diem-tham-quan", target: { x: 18, y: 4 }, npc: "bac-tu", quest: "Thiếu một khách! Tìm quanh sân chính" },
    "hd5-chia-thoi-gian": { map: "diem-tham-quan", target: { x: 4, y: 4 }, quest: "Đưa đoàn vào nhà hàng ăn trưa" },
    "hd6-hoa-hong": { map: "diem-tham-quan", target: { x: 25, y: 4 }, npc: "chu-cua-hang", quest: "Chủ cửa hàng lưu niệm đang vẫy bạn" },
    "hd7-mua-lon": { map: "diem-tham-quan", target: { x: 12, y: 3 }, npc: "truong-doan-san", quest: "Trời mưa to, bàn với trưởng đoàn về điểm cuối" },
  },
};
writeFileSync(out("content/worlds/huong-dan-vien-du-lich.json"), JSON.stringify(guideWorld) + "\n");

// ---------- Chuyên viên nhân sự (SPEC-024): phòng nhân sự của một công ty sản xuất ----------
// Phòng phỏng vấn trái, hành lang có bảng công việc giữa, phòng trưởng phòng phải; khu bàn nhân sự và phòng đào tạo phía dưới.
const PHONG_NHAN_SU = AGENCY;
const PHONG_NHAN_SU_PROPS = [
  // Phòng phỏng vấn: bàn, ghế, cây
  [4, 2, 0, 1], [5, 2, 1, 1], [6, 2, 2, 1],
  [4, 3, 162, 1], [5, 3, 163, 1], [6, 3, 164, 1],
  [1, 1, 16, 1], [10, 1, 17, 1],
  // Phòng trưởng phòng: bàn, tủ hồ sơ, cây
  [21, 2, 85, 1], [22, 2, 86, 1], [23, 2, 97, 1],
  [27, 1, 329, 1], [26, 5, 330, 1], [18, 1, 16, 1], [28, 5, 17, 1],
  // Khu bàn nhân sự: bàn của bạn, bàn đồng nghiệp C&B, tủ hồ sơ
  [14, 10, 85, 1], [15, 10, 86, 1], [16, 10, 97, 1],
  [24, 10, 85, 1], [25, 10, 86, 1], [27, 13, 329, 1],
  // Phòng đào tạo: dãy bàn học viên
  [2, 10, 5, 1], [4, 10, 5, 1], [6, 10, 5, 1], [2, 12, 5, 1], [4, 12, 5, 1], [6, 12, 5, 1],
];
const PHONG_NHAN_SU_DECOR = [
  // Bảng công việc trên tường hành lang; hồ sơ trên bàn.
  [12, 2, 18], [12, 3, 18], [12, 4, 18],
  [15, 10, 18], [25, 10, 18],
];

const hrWorld = {
  profession_id: "chuyen-vien-nhan-su",
  tile_size: 16,
  tilesets: world.tilesets,
  maps: [
    buildMap("phong-nhan-su", PHONG_NHAN_SU, PHONG_NHAN_SU_PROPS, PHONG_NHAN_SU_DECOR, { x: 15, y: 12 }),
  ],
  npcs: [
    { id: "truong-phong-ns", map: "phong-nhan-su", x: 22, y: 4, name: "Chị Mai (trưởng phòng nhân sự)", sprite: C(379) },
    { id: "ung-vien", map: "phong-nhan-su", x: 3, y: 4, name: "Chị Hoa (ứng viên)", sprite: C(433) },
    { id: "truong-xuong", map: "phong-nhan-su", x: 14, y: 3, name: "Anh Dũng (trưởng xưởng)", sprite: C(54, 17, 22) },
    { id: "cong-nhan-tam", map: "phong-nhan-su", x: 24, y: 4, name: "Anh Tâm (công nhân tổ tiện)", sprite: C(1, 13, 76) },
    { id: "dong-nghiep-cb", map: "phong-nhan-su", x: 24, y: 11, name: "Đồng nghiệp lương thưởng", sprite: C(1, 125, 20) },
  ],
  player_sprite: C(1, 125, 20),
  segments: {
    "ns1-tuyen-dung": { map: "phong-nhan-su", target: { x: 22, y: 4 }, npc: "truong-phong-ns", quest: "Trưởng phòng gọi bạn bàn việc tuyển công nhân" },
    "ns2-tin-tuyen-dung": { map: "phong-nhan-su", target: { x: 15, y: 11 }, quest: "Về bàn, soát tin tuyển dụng trước khi đăng" },
    "ns3-hop-dong": { map: "phong-nhan-su", target: { x: 15, y: 11 }, quest: "Mở bản nháp hợp đồng trưởng phòng vừa gửi" },
    "ns4-phong-van": { map: "phong-nhan-su", target: { x: 3, y: 4 }, npc: "ung-vien", quest: "Ứng viên đang chờ ở phòng phỏng vấn" },
    "ns5-yeu-cau-truong-bo-phan": { map: "phong-nhan-su", target: { x: 14, y: 3 }, npc: "truong-xuong", quest: "Trưởng xưởng đứng chờ bạn ở bảng công việc" },
    "ns6-chia-thoi-gian": { map: "phong-nhan-su", target: { x: 15, y: 11 }, quest: "Về bàn, xử lý việc cuối chiều" },
    "ns7-phan-anh": { map: "phong-nhan-su", target: { x: 24, y: 4 }, npc: "cong-nhan-tam", quest: "Có công nhân xin gặp ở phòng trưởng phòng" },
  },
};
writeFileSync(out("content/worlds/chuyen-vien-nhan-su.json"), JSON.stringify(hrWorld) + "\n");

// ---------- Kỹ thuật viên ô tô (SPEC-025): một xưởng dịch vụ ô tô ----------
// Kho phụ tùng trên trái, phòng cố vấn dịch vụ dưới trái, xưởng nền bê tông có cầu nâng và tủ dụng cụ, bãi chạy thử phía dưới.
const XUONG_DICH_VU = [
  "##############################",
  "#.......#cccccccccccccccccccc#",
  "#.......#cccccccccccccccccccc#",
  "#.......#cccccccccccccccccccc#",
  "#.......#cccccccccccccccccccc#",
  "#.......#cccccccccccccccccccc#",
  "#.......#cccccccccccccccccccc#",
  "####D####cccccccccccccccccccc#",
  "#.......#cccccccccccccccccccc#",
  "#.......Dcccccccccccccccccccc#",
  "#.......#cccccccccccccccccccc#",
  "##############D###############",
  "#============================#",
  "#============================#",
  "#============================#",
  "##############################",
];
const XUONG_DICH_VU_PROPS = [
  // Kho phụ tùng: các kệ
  [1, 1, 329, 1], [2, 1, 330, 1], [5, 1, 329, 1], [6, 1, 330, 1], [1, 5, 329, 1], [6, 5, 330, 1],
  // Xưởng: hai cầu nâng (bàn dài làm khung), tủ dụng cụ, cây
  [14, 4, 0, 1], [15, 4, 1, 1], [16, 4, 2, 1],
  [21, 4, 0, 1], [22, 4, 1, 1], [23, 4, 2, 1],
  [26, 1, 329, 1], [27, 1, 330, 1], [28, 1, 329, 1],
  [10, 1, 16, 1],
  // Phòng cố vấn dịch vụ: bàn tiếp khách
  [3, 8, 85, 1], [4, 8, 86, 1], [5, 8, 97, 1], [1, 10, 17, 1],
];
const XUONG_DICH_VU_DECOR = [
  // Phiếu sửa chữa trên bàn cố vấn, dụng cụ trên tủ.
  [4, 8, 18], [27, 1, 18],
];

const mechanicWorld = {
  profession_id: "ky-thuat-vien-o-to",
  tile_size: 16,
  tilesets: [...world.tilesets, { key: "site", image: "game/site/site.png", columns: SITE.length, spacing: 1 }],
  maps: [
    buildMap("xuong-dich-vu", XUONG_DICH_VU, XUONG_DICH_VU_PROPS, XUONG_DICH_VU_DECOR, { x: 14, y: 6 }, SITE_FLOOR),
  ],
  npcs: [
    { id: "ktv-chinh", map: "xuong-dich-vu", x: 16, y: 6, name: "Anh Hùng (kỹ thuật viên chính)", sprite: C(54, 17, 22) },
    { id: "ktv-chinh-bai", map: "xuong-dich-vu", x: 20, y: 13, name: "Anh Hùng (kỹ thuật viên chính)", sprite: C(54, 17, 22) },
    { id: "co-van", map: "xuong-dich-vu", x: 5, y: 9, name: "Anh Khoa (cố vấn dịch vụ)", sprite: C(379) },
    { id: "khach-hang", map: "xuong-dich-vu", x: 12, y: 8, name: "Chị Hạnh (khách hàng)", sprite: C(433) },
    { id: "thu-kho", map: "xuong-dich-vu", x: 4, y: 3, name: "Thủ kho phụ tùng", sprite: C(1, 13, 76) },
  ],
  player_sprite: C(1, 125, 20),
  segments: {
    "kt1-cau-nang": { map: "xuong-dich-vu", target: { x: 16, y: 6 }, npc: "ktv-chinh", quest: "Tới cầu nâng, anh Hùng đang chờ" },
    "kt2-bao-ho": { map: "xuong-dich-vu", target: { x: 27, y: 2 }, quest: "Ra tủ dụng cụ lấy đồ bảo hộ" },
    "kt3-phieu-sua-chua": { map: "xuong-dich-vu", target: { x: 5, y: 9 }, npc: "co-van", quest: "Cố vấn dịch vụ nhờ bạn ký phiếu sửa chữa" },
    "kt4-chan-doan": { map: "xuong-dich-vu", target: { x: 12, y: 8 }, npc: "khach-hang", quest: "Khách vừa đưa xe vào, nghe chị kể bệnh xe" },
    "kt5-chia-thoi-gian": { map: "xuong-dich-vu", target: { x: 15, y: 5 }, quest: "Về cầu nâng, ba chiếc xe đang chờ" },
    "kt6-ban-them": { map: "xuong-dich-vu", target: { x: 5, y: 9 }, npc: "co-van", quest: "Anh Khoa gọi bạn ra nói chuyện riêng" },
    "kt7-giao-xe": { map: "xuong-dich-vu", target: { x: 20, y: 13 }, npc: "ktv-chinh-bai", quest: "Ra bãi chạy thử xe trước khi giao" },
  },
};
writeFileSync(out("content/worlds/ky-thuat-vien-o-to.json"), JSON.stringify(mechanicWorld) + "\n");

// ---------- Bác sĩ đa khoa (SPEC-026): phòng khám đa khoa của một bệnh viện quận ----------
// Dùng khung KHOA_NOI: phòng giao ban trái trên, phòng khám giữa trên, phòng cấp cứu phải trên, hành lang giữa, quầy tiếp đón dưới trái, sảnh chờ dưới phải.
const PHONG_KHAM = KHOA_NOI;
const PHONG_KHAM_PROPS = [
  // Phòng giao ban: bàn dài, ghế, kệ hồ sơ
  [2, 2, 0, 1], [3, 2, 1, 1], [4, 2, 2, 1], [6, 1, 329, 1], [1, 4, 17, 1],
  // Phòng khám: bàn bác sĩ, giường khám, cây
  [9, 2, 85, 1], [10, 2, 86, 1], [14, 1, 116, 1], [14, 2, 143, 1], [15, 4, 16, 1],
  // Phòng cấp cứu: hai giường, tủ thuốc
  [18, 1, 116, 1], [18, 2, 143, 1], [21, 1, 116, 1], [21, 2, 143, 1], [24, 1, 324, 1],
  // Quầy tiếp đón: quầy, cây
  [2, 9, 324, 1], [3, 9, 325, 1], [4, 9, 326, 1], [9, 9, 17, 1],
  // Sảnh chờ: dãy ghế, cây
  [13, 11, 55, 1], [14, 11, 55, 1], [15, 11, 55, 1], [16, 11, 55, 1], [24, 9, 17, 1],
];
const PHONG_KHAM_DECOR = [[3, 2, 18], [9, 2, 18], [3, 9, 18]];

const doctorWorld = {
  profession_id: "bac-si-da-khoa",
  tile_size: 16,
  tilesets: world.tilesets,
  maps: [
    buildMap("phong-kham", PHONG_KHAM, PHONG_KHAM_PROPS, PHONG_KHAM_DECOR, { x: 11, y: 3 }),
  ],
  npcs: [
    { id: "truong-khoa", map: "phong-kham", x: 5, y: 3, name: "Bác sĩ Lan (trưởng khoa)", sprite: C(0, 71, 19) },
    { id: "truong-khoa-cc", map: "phong-kham", x: 20, y: 3, name: "Bác sĩ Lan (trưởng khoa)", sprite: C(0, 71, 19) },
    { id: "dieu-duong", map: "phong-kham", x: 14, y: 4, name: "Chị Thu (điều dưỡng)", sprite: C(486) },
    { id: "chu-tu", map: "phong-kham", x: 13, y: 3, name: "Chú Tư (người bệnh)", sprite: PATIENT },
    { id: "nguoi-nha", map: "phong-kham", x: 9, y: 4, name: "Anh Quang (người nhà)", sprite: C(433) },
    { id: "tiep-don", map: "phong-kham", x: 5, y: 10, name: "Nhân viên tiếp đón", sprite: C(1, 13, 76) },
  ],
  player_sprite: C(1, 125, 20),
  segments: {
    "bs1-giao-ban": { map: "phong-kham", target: { x: 5, y: 3 }, npc: "truong-khoa", quest: "Vào phòng giao ban nhận ca" },
    "bs2-phan-loai": { map: "phong-kham", target: { x: 14, y: 4 }, npc: "dieu-duong", quest: "Điều dưỡng mang danh sách người bệnh vào phòng khám" },
    "bs3-don-thuoc": { map: "phong-kham", target: { x: 10, y: 3 }, quest: "Về bàn khám, soát đơn thuốc trước khi ký" },
    "bs4-dau-bung": { map: "phong-kham", target: { x: 13, y: 3 }, npc: "chu-tu", quest: "Chú Tư đang chờ khám ở giường khám" },
    "bs5-chia-thoi-gian": { map: "phong-kham", target: { x: 10, y: 3 }, quest: "Về bàn khám, danh sách chờ buổi chiều còn dài" },
    "bs6-ho-so-sai": { map: "phong-kham", target: { x: 9, y: 4 }, npc: "nguoi-nha", quest: "Người nhà một người bệnh đợi bạn ở góc phòng khám" },
    "bs7-tro-nang": { map: "phong-kham", target: { x: 20, y: 3 }, npc: "truong-khoa-cc", quest: "Chú Tư trở nặng! Tới phòng cấp cứu" },
  },
};
writeFileSync(out("content/worlds/bac-si-da-khoa.json"), JSON.stringify(doctorWorld) + "\n");

// ---------- Thợ điện (SPEC-027): một tòa nhà văn phòng đang hoàn thiện ----------
// Phòng chỉ huy công trường trên trái, thang máy công trình giữa, kho vật tư trên phải; sàn thi công nền bê tông phía dưới, tủ điện tầng ở góc trái.
const TOA_NHA = AGENCY.map((row, y) => (y >= 8 && y <= 14 ? row.replace(/\./g, "c") : row));
const TOA_NHA_PROPS = [
  // Phòng chỉ huy: bàn, bảng tiến độ, cây
  [4, 2, 85, 1], [5, 2, 86, 1], [6, 2, 97, 1], [9, 1, 329, 1], [1, 1, 16, 1],
  // Thang máy công trình: khung cabin
  [13, 1, 324, 1], [15, 1, 326, 1],
  // Kho vật tư: các kệ
  [18, 1, 329, 1], [19, 1, 330, 1], [22, 1, 329, 1], [23, 1, 330, 1], [26, 1, 329, 1], [27, 1, 330, 1],
  // Sàn thi công: tủ điện tầng, bàn vật tư
  [1, 9, 324, 1], [2, 9, 325, 1], [14, 12, 0, 1], [15, 12, 1, 1], [16, 12, 2, 1],
];
const TOA_NHA_DECOR = [[5, 2, 18], [2, 9, 18], [15, 12, 18]];

const electricianWorld = {
  profession_id: "tho-dien",
  tile_size: 16,
  tilesets: [...world.tilesets, { key: "site", image: "game/site/site.png", columns: SITE.length, spacing: 1 }],
  maps: [
    buildMap("toa-nha", TOA_NHA, TOA_NHA_PROPS, TOA_NHA_DECOR, { x: 3, y: 11 }, SITE_FLOOR),
  ],
  npcs: [
    { id: "doi-truong", map: "toa-nha", x: 4, y: 10, name: "Anh Bình (đội trưởng)", sprite: C(54, 17, 22) },
    { id: "doi-truong-san", map: "toa-nha", x: 20, y: 12, name: "Anh Bình (đội trưởng)", sprite: C(54, 17, 22) },
    { id: "giam-sat", map: "toa-nha", x: 7, y: 4, name: "Anh Phúc (giám sát kỹ thuật)", sprite: C(379) },
    { id: "giam-sat-san", map: "toa-nha", x: 25, y: 12, name: "Anh Phúc (giám sát kỹ thuật)", sprite: C(379) },
    { id: "tho-phu", map: "toa-nha", x: 12, y: 11, name: "Long (thợ phụ)", sprite: C(1, 13, 76) },
    { id: "bao-ve", map: "toa-nha", x: 14, y: 3, name: "Bảo vệ công trường", sprite: C(0, 121, 128) },
  ],
  player_sprite: C(0, 13, 20),
  segments: {
    "td1-truoc-khi-lam": { map: "toa-nha", target: { x: 4, y: 10 }, npc: "doi-truong", quest: "Tới tủ điện tầng, đội trưởng đang chờ" },
    "td2-kho-vat-tu": { map: "toa-nha", target: { x: 22, y: 4 }, quest: "Vào kho vật tư lấy đồ cho buổi sáng" },
    "td3-phieu-cong-tac": { map: "toa-nha", target: { x: 7, y: 4 }, npc: "giam-sat", quest: "Giám sát gọi bạn sang phòng chỉ huy ký phiếu" },
    "td4-mat-dien": { map: "toa-nha", target: { x: 3, y: 11 }, quest: "Tầng 3 báo mất điện! Ra tủ điện xem trước" },
    "td5-chia-thoi-gian": { map: "toa-nha", target: { x: 12, y: 11 }, npc: "tho-phu", quest: "Ra sàn thi công cùng thợ phụ" },
    "td6-bo-buoc": { map: "toa-nha", target: { x: 20, y: 12 }, npc: "doi-truong-san", quest: "Đội trưởng gọi bạn ra góc sàn nói chuyện" },
    "td7-do-kiem": { map: "toa-nha", target: { x: 25, y: 12 }, npc: "giam-sat-san", quest: "Đo kiểm lại các mạch trước khi về" },
  },
};
writeFileSync(out("content/worlds/tho-dien.json"), JSON.stringify(electricianWorld) + "\n");

// ---------- Nhân viên logistics (SPEC-028): văn phòng và kho vận của một công ty giao nhận ----------
// Phòng trưởng nhóm và phòng họp phía trên trái, khu bàn làm việc dưới trái, kho nền bê tông bên phải, khu bốc xếp dọc phía dưới.
const KHO_VAN = [
  "##############################",
  "#.......#.......#cccccccccccc#",
  "#.......#.......#cccccccccccc#",
  "#.......#.......#cccccccccccc#",
  "#.......#.......#cccccccccccc#",
  "#.......#.......#cccccccccccc#",
  "#.......#.......#cccccccccccc#",
  "####D#######D####cccccccccccc#",
  "#...............#cccccccccccc#",
  "#...............Dcccccccccccc#",
  "#...............#cccccccccccc#",
  "#...............#cccccccccccc#",
  "######################D#######",
  "#============================#",
  "#============================#",
  "##############################",
];
const KHO_VAN_PROPS = [
  // Phòng trưởng nhóm: bàn, tủ hồ sơ, cây
  [3, 2, 85, 1], [4, 2, 86, 1], [5, 2, 97, 1], [1, 1, 329, 1], [6, 5, 16, 1],
  // Phòng họp: bàn dài, ghế
  [10, 3, 0, 1], [11, 3, 1, 1], [12, 3, 2, 1], [10, 4, 162, 1], [11, 4, 163, 1], [12, 4, 164, 1], [15, 1, 17, 1],
  // Khu bàn làm việc: bàn của bạn, bàn đồng nghiệp, máy in
  [5, 10, 85, 1], [6, 10, 86, 1], [10, 10, 85, 1], [11, 10, 86, 1], [14, 8, 324, 1],
  // Kho: các dãy kệ hàng
  [19, 2, 329, 1], [20, 2, 330, 1], [23, 2, 329, 1], [24, 2, 330, 1], [27, 2, 329, 1],
  [19, 6, 329, 1], [20, 6, 330, 1], [23, 6, 329, 1], [24, 6, 330, 1], [27, 6, 329, 1],
];
const KHO_VAN_DECOR = [[4, 2, 18], [6, 10, 18], [11, 3, 18]];

const logisticsWorld = {
  profession_id: "nhan-vien-logistics",
  tile_size: 16,
  tilesets: [...world.tilesets, { key: "site", image: "game/site/site.png", columns: SITE.length, spacing: 1 }],
  maps: [
    buildMap("kho-van", KHO_VAN, KHO_VAN_PROPS, KHO_VAN_DECOR, { x: 6, y: 11 }, SITE_FLOOR),
  ],
  npcs: [
    { id: "truong-nhom", map: "kho-van", x: 8, y: 11, name: "Chị Ngân (trưởng nhóm)", sprite: C(379) },
    { id: "truong-nhom-hop", map: "kho-van", x: 13, y: 5, name: "Chị Ngân (trưởng nhóm)", sprite: C(379) },
    { id: "nhan-vien-kho", map: "kho-van", x: 21, y: 8, name: "Anh Lộc (nhân viên kho)", sprite: C(54, 17, 22) },
    { id: "khach-hang", map: "kho-van", x: 9, y: 5, name: "Anh Tuấn (khách hàng)", sprite: C(433) },
    { id: "tai-xe", map: "kho-van", x: 10, y: 13, name: "Tài xế xe tải", sprite: C(1, 13, 76) },
  ],
  player_sprite: C(1, 125, 20),
  segments: {
    "lg1-don-hang": { map: "kho-van", target: { x: 8, y: 11 }, npc: "truong-nhom", quest: "Trưởng nhóm ghé bàn giao bạn đơn hàng mới" },
    "lg2-ho-so": { map: "kho-van", target: { x: 6, y: 11 }, quest: "Về bàn làm việc, phân loại giấy tờ khách gửi" },
    "lg3-to-khai": { map: "kho-van", target: { x: 6, y: 11 }, quest: "Mở tờ khai nháp để soát lại" },
    "lg4-hang-tre": { map: "kho-van", target: { x: 13, y: 5 }, npc: "truong-nhom-hop", quest: "Hãng vận chuyển báo trễ! Vào phòng họp báo trưởng nhóm" },
    "lg5-chia-thoi-gian": { map: "kho-van", target: { x: 21, y: 8 }, npc: "nhan-vien-kho", quest: "Xuống kho, anh Lộc đang chờ kiểm hàng" },
    "lg6-khai-gia-thap": { map: "kho-van", target: { x: 9, y: 5 }, npc: "khach-hang", quest: "Khách hàng chờ bạn trong phòng họp" },
    "lg7-lech-so-kien": { map: "kho-van", target: { x: 21, y: 8 }, npc: "nhan-vien-kho", quest: "Xuống kho, anh Lộc báo số kiện lệch" },
  },
};
writeFileSync(out("content/worlds/nhan-vien-logistics.json"), JSON.stringify(logisticsWorld) + "\n");

// ---------- Chuyên viên phân tích dữ liệu (SPEC-029): văn phòng một công ty thương mại điện tử ----------
// Dùng khung AGENCY: phòng họp trái trên, hành lang bảng số liệu giữa, phòng trưởng nhóm phải trên; khu bàn mở dưới (bàn của bạn giữa, khu marketing phải, góc pantry trái).
const VAN_PHONG_DU_LIEU = AGENCY;
const VAN_PHONG_DU_LIEU_PROPS = AGENCY_PROPS;
const VAN_PHONG_DU_LIEU_DECOR = [
  // Biểu đồ dán trên tường hành lang; báo cáo trên bàn.
  [12, 2, 18], [12, 3, 18], [12, 4, 18],
  [15, 10, 18], [25, 10, 18],
];

const dataWorld = {
  profession_id: "chuyen-vien-phan-tich-du-lieu",
  tile_size: 16,
  tilesets: world.tilesets,
  maps: [
    buildMap("van-phong-du-lieu", VAN_PHONG_DU_LIEU, VAN_PHONG_DU_LIEU_PROPS, VAN_PHONG_DU_LIEU_DECOR, { x: 15, y: 12 }),
  ],
  npcs: [
    { id: "truong-nhom-du-lieu", map: "van-phong-du-lieu", x: 17, y: 11, name: "Anh Duy (trưởng nhóm dữ liệu)", sprite: C(379) },
    { id: "quan-ly-marketing", map: "van-phong-du-lieu", x: 3, y: 4, name: "Chị Vy (quản lý marketing)", sprite: C(433) },
    { id: "truong-nhom-du-lieu-hop", map: "van-phong-du-lieu", x: 8, y: 4, name: "Anh Duy (trưởng nhóm dữ liệu)", sprite: C(379) },
    { id: "ky-su-du-lieu", map: "van-phong-du-lieu", x: 13, y: 11, name: "Chị Hằng (kỹ sư dữ liệu)", sprite: C(54, 17, 22) },
    { id: "dong-nghiep", map: "van-phong-du-lieu", x: 4, y: 13, name: "Đồng nghiệp ở pantry", sprite: C(1, 13, 76) },
  ],
  player_sprite: C(1, 125, 20),
  segments: {
    "da1-ke-hoach": { map: "van-phong-du-lieu", target: { x: 17, y: 11 }, npc: "truong-nhom-du-lieu", quest: "Trưởng nhóm ghé bàn giao bạn yêu cầu báo cáo" },
    "da2-du-lieu-ca-nhan": { map: "van-phong-du-lieu", target: { x: 15, y: 11 }, quest: "Về bàn, xem lại các cột trong bảng đơn hàng" },
    "da3-bieu-do": { map: "van-phong-du-lieu", target: { x: 3, y: 4 }, npc: "quan-ly-marketing", quest: "Quản lý marketing mời bạn vào phòng họp xem bản trình bày" },
    "da4-doanh-so-giam": { map: "van-phong-du-lieu", target: { x: 13, y: 11 }, npc: "ky-su-du-lieu", quest: "Dashboard báo doanh số giảm! Hỏi kỹ sư dữ liệu" },
    "da5-chia-thoi-gian": { map: "van-phong-du-lieu", target: { x: 15, y: 11 }, quest: "Về bàn, hoàn thiện báo cáo tháng" },
    "da6-xin-file": { map: "van-phong-du-lieu", target: { x: 3, y: 4 }, npc: "quan-ly-marketing", quest: "Chị Vy mời bạn vào phòng họp" },
    "da7-so-trung": { map: "van-phong-du-lieu", target: { x: 8, y: 4 }, npc: "truong-nhom-du-lieu-hop", quest: "Số liệu có vấn đề! Vào phòng họp báo trưởng nhóm" },
  },
};
writeFileSync(out("content/worlds/chuyen-vien-phan-tich-du-lieu.json"), JSON.stringify(dataWorld) + "\n");

// ---------- Chiến sĩ chữa cháy (SPEC-030): một đội chữa cháy và cứu nạn, cứu hộ khu vực ----------
// Phòng trực ban trên trái, nhà xe chữa cháy nền bê tông giữa, sân tập đất bên phải; sân chung ở giữa; cơ sở được kiểm tra dưới trái, hiện trường dưới phải.
const DOI_CHUA_CHAY = [
  "##############################",
  "#.......#cccccccccccc#;;;;;;;#",
  "#.......#cccccccccccc#;;;;;;;#",
  "#.......#cccccccccccc#;;;;;;;#",
  "#.......#cccccccccccc#;;;;;;;#",
  "#.......#cccccccccccc#;;;;;;;#",
  "#.......#cccccccccccc;;;;;;;;#",
  "####D####cccccccccccc#;;;;;;;#",
  "#============================#",
  "#============================#",
  "#============================#",
  "######D###############D#######",
  "#.............#;;;;;;;;;;;;;;#",
  "#.............#;;;;;;;;;;;;;;#",
  "#.............#;;;;;;;;;;;;;;#",
  "##############################",
];
const DOI_CHUA_CHAY_PROPS = [
  // Phòng trực ban: bàn tiếp nhận tin báo, điện thoại, tủ hồ sơ
  [2, 2, 85, 1], [3, 2, 86, 1], [4, 2, 97, 1], [6, 1, 329, 1], [1, 5, 17, 1],
  // Nhà xe: hai xe chữa cháy (bàn dài làm khung), giá vòi
  [11, 2, 0, 1], [12, 2, 1, 1], [13, 2, 2, 1],
  [16, 2, 0, 1], [17, 2, 1, 1], [18, 2, 2, 1],
  [20, 5, 329, 1],
  // Sân tập: dụng cụ tập
  [24, 2, 5, 1], [27, 2, 5, 1], [25, 5, 5, 1],
  // Cơ sở được kiểm tra: kệ hàng, bàn
  [2, 13, 329, 1], [3, 13, 330, 1], [9, 12, 85, 1], [10, 12, 86, 1],
];
const DOI_CHUA_CHAY_DECOR = [[3, 2, 18], [10, 12, 18]];

const firefighterWorld = {
  profession_id: "chien-si-chua-chay",
  tile_size: 16,
  tilesets: [...world.tilesets, { key: "site", image: "game/site/site.png", columns: SITE.length, spacing: 1 }],
  maps: [
    buildMap("doi-chua-chay", DOI_CHUA_CHAY, DOI_CHUA_CHAY_PROPS, DOI_CHUA_CHAY_DECOR, { x: 14, y: 5 }, SITE_FLOOR),
  ],
  npcs: [
    { id: "doi-truong", map: "doi-chua-chay", x: 15, y: 4, name: "Anh Thắng (đội trưởng)", sprite: C(54, 17, 22) },
    { id: "doi-truong-truc", map: "doi-chua-chay", x: 5, y: 4, name: "Anh Thắng (đội trưởng)", sprite: C(54, 17, 22) },
    { id: "doi-truong-ht", map: "doi-chua-chay", x: 21, y: 13, name: "Anh Thắng (đội trưởng)", sprite: C(54, 17, 22) },
    { id: "to-truong", map: "doi-chua-chay", x: 3, y: 4, name: "Anh Toàn (tổ trưởng)", sprite: C(379) },
    { id: "to-truong-san", map: "doi-chua-chay", x: 25, y: 4, name: "Anh Toàn (tổ trưởng)", sprite: C(379) },
    { id: "chu-co-so", map: "doi-chua-chay", x: 6, y: 13, name: "Ông Hải (chủ xưởng may)", sprite: C(433) },
    { id: "nguoi-dan", map: "doi-chua-chay", x: 18, y: 9, name: "Người dân", sprite: C(1, 13, 76) },
  ],
  player_sprite: C(0, 13, 20),
  segments: {
    "cc1-giao-ca": { map: "doi-chua-chay", target: { x: 15, y: 4 }, npc: "doi-truong", quest: "Ra nhà xe nhận ca, đội trưởng đang chờ" },
    "cc2-kiem-tra-co-so": { map: "doi-chua-chay", target: { x: 6, y: 13 }, npc: "chu-co-so", quest: "Đi kiểm tra an toàn ở xưởng may" },
    "cc3-bien-ban": { map: "doi-chua-chay", target: { x: 3, y: 4 }, npc: "to-truong", quest: "Về phòng trực ban soát biên bản cùng tổ trưởng" },
    "cc4-tin-bao": { map: "doi-chua-chay", target: { x: 5, y: 4 }, npc: "doi-truong-truc", quest: "Chuông báo! Vào bàn tiếp nhận tin báo" },
    "cc5-chia-thoi-gian": { map: "doi-chua-chay", target: { x: 25, y: 4 }, npc: "to-truong-san", quest: "Ra sân tập, tổ trưởng phân việc buổi chiều" },
    "cc6-bo-qua": { map: "doi-chua-chay", target: { x: 6, y: 13 }, npc: "chu-co-so", quest: "Chủ xưởng may muốn gặp bạn" },
    "cc7-hien-truong": { map: "doi-chua-chay", target: { x: 21, y: 13 }, npc: "doi-truong-ht", quest: "Xuất quân! Tới hiện trường gặp đội trưởng" },
  },
};
writeFileSync(out("content/worlds/chien-si-chua-chay.json"), JSON.stringify(firefighterWorld) + "\n");

console.log("✓ public/game/ và content/worlds/{giao-vien-thpt,dieu-duong,lap-trinh-vien,ke-toan,ky-su-xay-dung,nhan-vien-marketing,duoc-si,luat-su,thiet-ke-do-hoa,giao-dich-vien-ngan-hang,dau-bep,kien-truc-su,giao-vien-mam-non,phong-vien,huong-dan-vien-du-lich,chuyen-vien-nhan-su,ky-thuat-vien-o-to,bac-si-da-khoa,tho-dien,nhan-vien-logistics,chuyen-vien-phan-tich-du-lieu,chien-si-chua-chay}.json");
