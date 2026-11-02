// SPEC-003 R-15 — trang khung: hồ sơ nghề. Nội dung thật thuộc spec PRO.
import { notFound } from "next/navigation";
import { getProfession, loadProfessions } from "../../../content";

export const dynamicParams = false;

export function generateStaticParams() {
  return loadProfessions().map((p) => ({ id: p.id }));
}

export default async function ProfessionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const p = getProfession(id);
  if (!p) notFound();
  return (
    <main>
      <h1 className="text-2xl font-bold">{p.name}</h1>
    </main>
  );
}
