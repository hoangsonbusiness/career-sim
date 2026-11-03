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

console.log("✓ public/game/ và content/worlds/{giao-vien-thpt,dieu-duong,lap-trinh-vien,ke-toan,ky-su-xay-dung,nhan-vien-marketing}.json");
