// SPEC-004 — các khối hiển thị dùng chung (hồ sơ nghề, và trích dẫn ở màn chơi SPEC-005).
// Server Component, không có JavaScript phía trình duyệt (R-16).
import type { CitationView, ItemView } from "./view";

/** R-12: trích dẫn mở tại chỗ bằng <details>, không cần JavaScript. */
export function Citation({ c }: { c: CitationView }) {
  return (
    <details data-source={c.id} className="ml-1 inline-block align-baseline text-sm">
      <summary className="inline cursor-pointer rounded bg-slate-100 px-1 text-slate-700 hover:bg-slate-200">{c.id}</summary>
      <div className="mt-1 block rounded border border-slate-200 bg-white p-2 shadow-sm">
        <div className="font-medium">{c.title}</div>
        <div className="text-slate-600">{c.publisher} · {c.typeLabel}</div>
        {c.effectiveDate && <div className="text-slate-600">Hiệu lực từ {c.effectiveDate}</div>}
        <a href={c.url} target="_blank" rel="noopener noreferrer" className="break-all text-blue-700 underline">{c.url}</a>
      </div>
    </details>
  );
}

/** R-12, R-13: một item kèm nhãn độ tin cậy, cảnh báo và trích dẫn. */
export function ItemLine({ item }: { item: ItemView }) {
  return (
    <li data-kind={item.kind} className="mb-2">
      <span>{item.text}</span>
      {item.confidenceLabel && (
        <span className={`ml-2 rounded px-1 text-xs ${item.warning ? "bg-amber-100 text-amber-900" : "bg-emerald-50 text-emerald-800"}`}>
          {item.confidenceLabel}
        </span>
      )}
      {item.warning && (
        <div data-testid="warning" className="mt-1 rounded border-l-4 border-amber-400 bg-amber-50 px-2 py-1 text-sm text-amber-900">
          ⚠ Cần kiểm chứng{item.note ? `: ${item.note}` : ""}
        </div>
      )}
      {item.citations.map((c, k) => <Citation key={k} c={c} />)}
    </li>
  );
}
