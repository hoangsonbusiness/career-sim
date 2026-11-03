#!/usr/bin/env node
// SPEC-006 R-1..R-4 — kiểm tra file thế giới game.
//   node scripts/validate-world.mjs [file.json ...] [--professions <dir>] [--public <dir>]
// Không truyền file → kiểm mọi content/worlds/*.json.
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { basename, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import Ajv from "ajv/dist/2020.js";
import { findPath, isWalkable, standSpots } from "../src/game/grid.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const opt = (name, def) => { const i = args.indexOf(name); return i >= 0 ? args.splice(i, 2)[1] : def; };
const profDir = opt("--professions", join(root, "content/professions"));
const publicDir = opt("--public", join(root, "public"));
const worldsDir = join(root, "content/worlds");
const files = args.length ? args : existsSync(worldsDir) ? readdirSync(worldsDir).filter((f) => f.endsWith(".json")).map((f) => join(worldsDir, f)) : [];

const validateSchema = new Ajv({ allErrors: true }).compile(JSON.parse(readFileSync(join(root, "schema/world.schema.json"), "utf8")));

/** Kích thước ảnh PNG từ IHDR. */
function pngSize(file) {
  const b = readFileSync(file);
  return { width: b.readUInt32BE(16), height: b.readUInt32BE(20) };
}

function check(file) {
  const errs = [];
  const name = basename(file);
  let w;
  try { w = JSON.parse(readFileSync(file, "utf8")); } catch (e) { return [`R-1 JSON hỏng: ${e.message}`]; }

  // R-1
  if (!validateSchema(w)) return validateSchema.errors.map((e) => `R-1 schema: ${e.instancePath || "/"} ${e.message}`);
  if (w.profession_id !== name.replace(/\.json$/, "")) errs.push(`R-1 profession_id "${w.profession_id}" khác tên file`);
  const profFile = join(profDir, `${w.profession_id}.json`);
  const prof = existsSync(profFile) ? JSON.parse(readFileSync(profFile, "utf8")) : null;
  if (!prof?.day_simulation) return [...errs, `R-1 không có nghề "${w.profession_id}" với day_simulation`];

  // R-2: số ô của từng tileset lấy từ kích thước ảnh
  const tileCount = {};
  for (const t of w.tilesets) {
    const img = join(publicDir, t.image);
    if (!existsSync(img)) { errs.push(`R-2 không có ảnh ${t.image}`); continue; }
    const { height } = pngSize(img);
    tileCount[t.key] = t.columns * Math.floor((height + t.spacing) / (w.tile_size + t.spacing));
  }
  const badRef = (ref) => {
    const [key, idx] = ref.split(":");
    return !(key in tileCount) || Number(idx) >= tileCount[key];
  };
  const maps = Object.fromEntries(w.maps.map((m) => [m.id, m]));
  for (const m of w.maps) {
    const n = m.width * m.height;
    if (m.solid.length !== n) errs.push(`R-2 map ${m.id}: solid dài ${m.solid.length}, cần ${n}`);
    for (const l of m.layers) {
      if (l.data.length !== n) errs.push(`R-2 map ${m.id} layer ${l.name}: dài ${l.data.length}, cần ${n}`);
      l.data.forEach((ref, i) => { if (ref !== null && badRef(ref)) errs.push(`R-2 map ${m.id} layer ${l.name} ô ${i}: "${ref}" ngoài tileset`); });
    }
  }
  for (const s of [...w.player_sprite, ...w.npcs.flatMap((n) => n.sprite)]) if (badRef(s)) errs.push(`R-2 sprite "${s}" ngoài tileset`);
  for (const n of w.npcs) if (!maps[n.map]) errs.push(`R-2 NPC ${n.id}: không có map "${n.map}"`);
  if (errs.length) return errs;

  // R-3
  const segIds = prof.day_simulation.segments.map((s) => s.id);
  for (const id of segIds) if (!w.segments[id]) errs.push(`R-3 thiếu segment "${id}"`);
  for (const id of Object.keys(w.segments)) if (!segIds.includes(id)) errs.push(`R-3 segment lạ "${id}"`);
  for (const [id, s] of Object.entries(w.segments)) {
    const len = [...s.quest].length;
    if (len < 1 || len > 60) errs.push(`R-3 segment "${id}": quest dài ${len} ký tự (1–60)`);
    if (!maps[s.map]) errs.push(`R-3 segment "${id}": không có map "${s.map}"`);
    if (s.npc && !w.npcs.some((n) => n.id === s.npc)) errs.push(`R-3 segment "${id}": không có NPC "${s.npc}"`);
  }
  if (errs.length) return errs;

  // R-4: spawn đi được; mỗi target có chỗ đứng tới được từ spawn
  for (const m of w.maps) {
    const blocked = w.npcs.filter((n) => n.map === m.id).map((n) => ({ x: n.x, y: n.y }));
    if (!isWalkable(m, m.spawn, blocked)) errs.push(`R-4 map ${m.id}: spawn không đi được`);
  }
  for (const [id, s] of Object.entries(w.segments)) {
    const m = maps[s.map];
    const blocked = w.npcs.filter((n) => n.map === m.id).map((n) => ({ x: n.x, y: n.y }));
    const spots = standSpots(m, s.target, blocked);
    if (spots.length === 0) errs.push(`R-4 segment "${id}": target không có ô đứng cạnh`);
    else if (!spots.some((sp) => findPath(m, m.spawn, sp.pos, blocked) !== null)) errs.push(`R-4 segment "${id}": không có đường từ spawn tới target`);
  }
  return errs;
}

let bad = 0;
for (const f of files) {
  const errs = check(f);
  if (errs.length) { bad++; console.error(`✗ ${basename(f)}`); errs.forEach((e) => console.error("   - " + e)); }
  else console.log(`✓ ${basename(f)}`);
}
if (files.length === 0) console.log("(không có file thế giới)");
process.exit(bad ? 1 : 0);
