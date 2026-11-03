// SPIKE (nhánh spike/threejs): thử cảnh 3D cho nghề Nhân viên Marketing.
import { getProfession } from "../../content";
import { buildProfileView, type CitationView } from "../../profile/view";
import { loadWorld } from "../../game/worldData";
import { GamePlayer3D, type StorySimulation } from "../../spike3d/GamePlayer3D";

export default function Spike3DPage() {
  const p = getProfession("nhan-vien-marketing")!;
  const all = new Map(buildProfileView(p).sources.map((c) => [c.id, c]));
  const citations: Record<string, CitationView[]> = {};
  for (const s of p.day_simulation!.segments) citations[s.id] = (s.basis.source_ids ?? []).flatMap((sid) => all.get(sid) ?? []);
  return (
    <main className="mx-auto max-w-5xl p-4">
      <h1 className="text-2xl font-bold">Bản thử 3D: một ngày làm {p.name}</h1>
      <GamePlayer3D professionId={p.id} name={p.name} sim={p.day_simulation as unknown as StorySimulation} world={loadWorld(p.id)!} citations={citations} />
    </main>
  );
}
