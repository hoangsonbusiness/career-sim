#!/usr/bin/env node
// SPEC-031 R-1..R-4 — kiểm tra file thế giới 3D.
//   node scripts/validate-world3d.mjs [file.json ...] [--worlds <dir>] [--public <dir>]
// Không truyền file → kiểm mọi content/worlds3d/*.json.
import { readFileSync, readdirSync, existsSync, statSync } from "node:fs";
import { basename, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import Ajv from "ajv/dist/2020.js";
import { standSpots } from "../src/game/grid.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const opt = (name, def) => { const i = args.indexOf(name); return i >= 0 ? args.splice(i, 2)[1] : def; };
const worldsDir = opt("--worlds", join(root, "content/worlds"));
const publicDir = opt("--public", join(root, "public"));
const dir3d = join(root, "content/worlds3d");
const files = args.length ? args : existsSync(dir3d) ? readdirSync(dir3d).filter((f) => f.endsWith(".json")).map((f) => join(dir3d, f)) : [];

const MAX_FILE = 2097152; // R-4: 2 MB mỗi file
const MAX_TOTAL = 12582912; // R-4: 12 MB mỗi nghề
const validateSchema = new Ajv({ allErrors: true }).compile(JSON.parse(readFileSync(join(root, "schema/world3d.schema.json"), "utf8")));

/** Tên hoạt cảnh trong chunk JSON đầu tiên của GLB; null nếu không phải GLB. */
function glbAnimations(buf) {
  if (buf.length < 20 || buf.toString("latin1", 0, 4) !== "glTF") return null;
  const len = buf.readUInt32LE(12);
  if (buf.toString("latin1", 16, 20) !== "JSON" || 20 + len > buf.length) return null;
  try {
    const j = JSON.parse(buf.toString("utf8", 20, 20 + len));
    return (j.animations ?? []).map((a) => a.name);
  } catch { return null; }
}

const sameSet = (a, b) => a.length === b.length && a.every((x) => b.includes(x));
const pub = (p) => join(publicDir, p.replace(/^\//, ""));

function check(file) {
  const errs = [];
  const name = basename(file);
  let w;
  try { w = JSON.parse(readFileSync(file, "utf8")); } catch (e) { return [`R-1 JSON hỏng: ${e.message}`]; }

  // R-1
  if (!validateSchema(w)) return validateSchema.errors.map((e) => `R-1 schema: ${e.instancePath || "/"} ${e.message}`);
  if (w.profession_id !== name.replace(/\.json$/, "")) errs.push(`R-1 profession_id "${w.profession_id}" khác tên file`);
  const f2d = join(worldsDir, `${w.profession_id}.json`);
  if (!existsSync(f2d)) return [...errs, `R-1 không có file thế giới 2D ${w.profession_id}.json`];
  const w2 = JSON.parse(readFileSync(f2d, "utf8"));

  // R-2
  const mapIds = w2.maps.map((m) => m.id);
  const npcIds = w2.npcs.map((n) => n.id);
  if (!sameSet(Object.keys(w.maps), mapIds)) errs.push(`R-2 maps phải đúng tập [${mapIds}], đang là [${Object.keys(w.maps)}]`);
  if (!sameSet(Object.keys(w.npc_models), npcIds)) errs.push(`R-2 npc_models phải đúng tập [${npcIds}], đang là [${Object.keys(w.npc_models)}]`);
  const refs = [
    ["player_model", w.player_model],
    ...Object.entries(w.npc_models).map(([k, v]) => [`npc_models.${k}`, v]),
    ...Object.entries(w.maps).flatMap(([id, m]) => m.props.map((p, i) => [`maps.${id}.props[${i}]`, p.model])),
    ...Object.entries(w.maps).flatMap(([id, m]) => (m.scenery ?? []).map((p, i) => [`maps.${id}.scenery[${i}]`, p.model])),
  ];
  for (const [where, key] of refs) if (!(key in w.models)) errs.push(`R-2 ${where}: không có model "${key}"`);
  if (errs.length) return errs;

  // R-3: lưới 2D là nguồn chân lý về va chạm; đồ trang trí không che chỗ làm việc.
  for (const m2 of w2.maps) {
    const m = w.maps[m2.id];
    const inside = (x, y, ww = 1, hh = 1) => x >= 0 && y >= 0 && x + ww <= m2.width && y + hh <= m2.height;
    m.floor.regions.forEach((r, i) => { if (!inside(r.x, r.y, r.w, r.h)) errs.push(`R-3 map ${m2.id} region[${i}] ngoài lưới`); });
    const blocked = w2.npcs.filter((n) => n.map === m2.id).map((n) => ({ x: n.x, y: n.y }));
    const reserved = [];
    for (const s of Object.values(w2.segments)) {
      if (s.map !== m2.id) continue;
      reserved.push(s.target);
      const spot = standSpots(m2, s.target, blocked)[0];
      if (spot) reserved.push(spot.pos);
    }
    m.props.forEach((p, i) => {
      const at = `R-3 map ${m2.id} props[${i}] (${p.x},${p.y})`;
      if (!inside(p.x, p.y)) { errs.push(`${at} ngoài lưới`); return; }
      const solid = m2.solid[p.y * m2.width + p.x] === 1;
      if (p.blocks && !solid) errs.push(`${at}: blocks=true nhưng ô đi được`);
      if (!p.blocks && reserved.some((r) => r.x === p.x && r.y === p.y)) errs.push(`${at}: đồ trang trí che target hoặc chỗ đứng`);
    });
    // R-3b: cảnh nền nằm ngoài lưới, trong viền 12 ô.
    const MARGIN = 12;
    (m.scenery ?? []).forEach((p, i) => {
      const at = `R-3b map ${m2.id} scenery[${i}] (${p.x},${p.y})`;
      if (inside(p.x, p.y)) errs.push(`${at} nằm trong lưới`);
      else if (p.x < -MARGIN || p.y < -MARGIN || p.x >= m2.width + MARGIN || p.y >= m2.height + MARGIN) errs.push(`${at} quá viền ${MARGIN} ô`);
    });
  }

  // R-4
  const used = new Set();
  for (const [key, md] of Object.entries(w.models)) {
    if (!existsSync(pub(md.license))) errs.push(`R-4 model ${key}: không có license ${md.license}`);
    const p = pub(md.file);
    if (!existsSync(p)) { errs.push(`R-4 model ${key}: không có file ${md.file}`); continue; }
    const size = statSync(p).size;
    if (size > MAX_FILE) errs.push(`R-4 model ${key}: ${size} byte > ${MAX_FILE}`);
    used.add(p);
  }
  let total = 0;
  for (const p of used) total += statSync(p).size;
  if (total > MAX_TOTAL) errs.push(`R-4 tổng GLB ${total} byte > ${MAX_TOTAL}`);
  const need = [[w.player_model, ["Idle", "Walk"]], ...Object.values(w.npc_models).map((k) => [k, ["Idle"]])];
  for (const [key, clips] of need) {
    const p = pub(w.models[key].file);
    if (!existsSync(p)) continue;
    const anims = glbAnimations(readFileSync(p));
    if (anims === null) { errs.push(`R-4 model ${key}: không đọc được GLB`); continue; }
    for (const c of clips) if (!anims.includes(c)) errs.push(`R-4 model ${key}: thiếu hoạt cảnh "${c}"`);
  }
  return errs;
}

let failed = 0;
for (const f of files) {
  const errs = check(f);
  if (errs.length) { failed++; for (const e of errs) console.error(`✗ ${basename(f)}: ${e}`); }
  else console.log(`✓ ${basename(f)}`);
}
if (!files.length) console.log("(không có file thế giới 3D)");
process.exit(failed ? 1 : 0);
