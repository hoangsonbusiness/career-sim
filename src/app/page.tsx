// SPEC-003 R-14 — trang khung: danh sách nghề. Giao diện thật thuộc spec CAT.
import Link from "next/link";
import { loadProfessions } from "../content";

export default function Home() {
  const professions = loadProfessions();
  return (
    <main>
      <h1 className="mb-4 text-2xl font-bold">Một Ngày Làm Nghề</h1>
      <ul className="list-disc pl-6">
        {professions.map((p) => (
          <li key={p.id}>
            <Link href={`/nghe/${p.id}/`} className="text-blue-700 underline">{p.name}</Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
