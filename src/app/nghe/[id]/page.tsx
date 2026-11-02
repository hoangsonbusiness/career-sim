// SPEC-004 — trang hồ sơ nghề (thay trang khung của SPEC-003; vẫn giữ SPEC-003 R-15: một <h1> là tên nghề).
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProfession, loadProfessions } from "../../../content";
import { buildProfileView } from "../../../profile/view";
import { ItemLine } from "../../../profile/components";

export const dynamicParams = false;

export function generateStaticParams() {
  return loadProfessions().map((p) => ({ id: p.id }));
}

export default async function ProfessionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const p = getProfession(id);
  if (!p) notFound();
  const v = buildProfileView(p);

  return (
    <main className="space-y-8">
      <div>
        <Link href="/" className="text-sm text-blue-700 underline">← Tất cả nghề</Link>
      </div>

      <header className="space-y-2">
        {v.isDraft && (
          <div data-testid="draft-banner" className="rounded border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            Bản nháp — đang kiểm chứng
          </div>
        )}
        <h1 className="text-3xl font-bold">{v.name}</h1>
        <p className="text-slate-600">
          {v.groupLabel}
          {v.aliases.length > 0 && <> · Còn gọi là: {v.aliases.join(", ")}</>}
        </p>
        <p className="text-lg">{v.summary}</p>
        {v.scopeNote && <p className="text-sm italic text-slate-600">{v.scopeNote}</p>}
        {v.simulationHref && (
          <a data-testid="play-link" href={v.simulationHref} className="inline-block rounded bg-blue-700 px-4 py-2 font-medium text-white hover:bg-blue-800">
            Chơi thử một ngày làm nghề
          </a>
        )}
      </header>

      {v.sections.map((s) => (
        <section key={s.key} className="space-y-3">
          <h2 className="border-b border-slate-200 pb-1 text-2xl font-semibold">{s.heading}</h2>
          {s.groups.map((g) => (
            <div key={g.key}>
              {g.heading && <h3 className="mb-1 text-lg font-semibold">{g.heading}</h3>}
              <ul className="list-disc pl-6">
                {g.items.map((it, k) => <ItemLine key={k} item={it} />)}
              </ul>
            </div>
          ))}
        </section>
      ))}

      <section className="space-y-3">
        <h2 className="border-b border-slate-200 pb-1 text-2xl font-semibold">Lộ trình thăng tiến</h2>
        <ol className="space-y-3">
          {v.ladder.map((step, n) => (
            <li key={step.id} className="rounded border border-slate-200 p-3">
              <h3 className="text-lg font-semibold">{n + 1}. {step.title}</h3>
              {step.description && <p className="text-slate-600">{step.description}</p>}
              <ul className="list-disc pl-6">
                {step.items.map((it, k) => <ItemLine key={k} item={it} />)}
              </ul>
            </li>
          ))}
        </ol>
      </section>

      <section className="space-y-3">
        <h2 className="border-b border-slate-200 pb-1 text-2xl font-semibold">Nguồn tham khảo</h2>
        <ol className="list-decimal space-y-1 pl-6 text-sm">
          {v.sources.map((s) => (
            <li key={s.id}>
              <span className="font-mono">{s.id}</span> — {s.title} ({s.publisher}, {s.typeLabel}
              {s.effectiveDate && <>, hiệu lực từ {s.effectiveDate}</>}).{" "}
              <a href={s.url} target="_blank" rel="noopener noreferrer" className="break-all text-blue-700 underline">{s.url}</a>
            </li>
          ))}
        </ol>
      </section>
    </main>
  );
}
