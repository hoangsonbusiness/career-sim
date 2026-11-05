// SPEC-005 R-8, R-9 — trang màn chơi; dữ liệu truyền vào component client qua props lúc build.
import { notFound } from "next/navigation";
import { getProfession, loadProfessions } from "../../../../content";
import { buildProfileView, type CitationView } from "../../../../profile/view";
import { DayPlayer, type PlayerSimulation } from "../../../../sim/DayPlayer";
import { GamePlayer } from "../../../../game/GamePlayer";
import { loadWorld } from "../../../../game/worldData";
import { assetCredits, loadWorld3D } from "../../../../game3d/worldData3d";

export const dynamicParams = false;

export function generateStaticParams() {
  return loadProfessions().filter((p) => p.day_simulation).map((p) => ({ id: p.id }));
}

export default async function DayPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const p = getProfession(id);
  if (!p || !p.day_simulation) notFound();

  // Trích dẫn cho basis của từng segment, dựng giống trang hồ sơ (SPEC-004 R-12).
  const all = new Map(buildProfileView(p).sources.map((c) => [c.id, c]));
  const citations: Record<string, CitationView[]> = {};
  for (const s of p.day_simulation.segments) {
    citations[s.id] = (s.basis.source_ids ?? []).flatMap((sid) => all.get(sid) ?? []);
  }

  const sim = p.day_simulation as unknown as PlayerSimulation;
  // SPEC-005 R-10b: nghề có bản đồ dùng game 2D (SPEC-006), chưa có thì dùng giao diện biểu mẫu.
  const world = loadWorld(p.id);
  // SPEC-031: nghề có file thế giới 3D thì chơi bằng Three.js (R-16).
  const world3d = world ? loadWorld3D(p.id) : null;
  const credits3d = world3d ? assetCredits(world3d) : [];

  return (
    <main className="space-y-6">
      <h1 className="text-2xl font-bold">Một ngày làm {p.name}</h1>
      {world
        ? <GamePlayer professionId={p.id} name={p.name} sim={sim} world={world} world3d={world3d} credits3d={credits3d} citations={citations} />
        : <DayPlayer professionId={p.id} sim={sim} citations={citations} />}
    </main>
  );
}
