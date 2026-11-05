// SPEC-031 — kiểu dữ liệu file thế giới 3D (khớp schema/world3d.schema.json).

export type FloorMaterial = "grass" | "brick" | "tile" | "wood" | "concrete" | "sand";
export type WallMaterial = "plaster" | "brick" | "hedge";
export type Lighting = "day" | "evening" | "indoor";
export type Rot = 0 | 90 | 180 | 270;

export interface Map3D {
  lighting: Lighting;
  floor: { default: FloorMaterial; regions: { x: number; y: number; w: number; h: number; material: FloorMaterial }[] };
  wall: { material: WallMaterial; height: number };
  props: { model: string; x: number; y: number; rot: Rot; blocks: boolean }[];
  scenery?: { model: string; x: number; y: number; rot: Rot }[];
}

export interface World3D {
  profession_id: string;
  models: Record<string, { file: string; scale: number; license: string }>;
  player_model: string;
  npc_models: Record<string, string>;
  maps: Record<string, Map3D>;
}
