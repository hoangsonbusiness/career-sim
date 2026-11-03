// SPEC-006 — kiểu dữ liệu file thế giới (khớp schema/world.schema.json).
import type { Pos } from "./grid";

export interface WorldMap {
  id: string;
  width: number;
  height: number;
  layers: { name: string; data: (string | null)[] }[];
  solid: (0 | 1)[];
  spawn: Pos;
}

export interface WorldData {
  profession_id: string;
  tile_size: 16;
  tilesets: { key: string; image: string; columns: number; spacing: number }[];
  maps: WorldMap[];
  npcs: { id: string; map: string; x: number; y: number; name: string; sprite: string[] }[];
  player_sprite: string[];
  segments: Record<string, { map: string; target: Pos; npc?: string; quest: string }>;
}
