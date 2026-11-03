"use client";
// SPEC-005 — màn chơi trên trình duyệt. Chỉ hiển thị và chuyển thao tác: điểm số do engine (SPEC-002),
// bản nháp đáp án do controller. Đồng hồ (performance.now) chỉ dùng ở đây (R-14).
import { useRef, useState } from "react";
import { createEngine, type EngineState, type SegmentResult } from "../engine/index";
import { canSubmit, displayOrder, formatDelta, initialDraft, remainingMinutes, toAnswer, update, type Action, type Draft, type Task } from "./controller";
import type { CitationView } from "../profile/view";
import { Citation } from "../profile/components";

export interface PlayerSimulation {
  persona: string;
  setting: string;
  stats: { id: string; label: string; initial: number }[];
  segments: { id: string; time: string; title: string; narrative: string; basis: { text: string }; task: Task }[];
  reflection_questions?: string[];
}

interface Props {
  professionId: string;
  sim: PlayerSimulation;
  citations: Record<string, CitationView[]>;
}

const btn = "rounded px-4 py-2 font-medium disabled:cursor-not-allowed disabled:opacity-40";
const primary = `${btn} bg-blue-700 text-white hover:bg-blue-800`;
const secondary = `${btn} border border-slate-300 bg-white hover:bg-slate-50`;
const small = "rounded border border-slate-300 bg-white px-2 py-1 text-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40";
const toggle = (on: boolean) => `rounded border px-3 py-1 text-left ${on ? "border-blue-700 bg-blue-50 text-blue-900" : "border-slate-300 bg-white hover:bg-slate-50"}`;

export function DayPlayer({ professionId, sim, citations }: Props) {
  const engine = useRef(createEngine({ id: professionId, day_simulation: sim })).current;
  const [state, setState] = useState<EngineState>(() => engine.state());
  const [result, setResult] = useState<SegmentResult | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const shownAt = useRef(0);

  const seg = state.segmentIndex >= 0 ? sim.segments[state.segmentIndex] : null;

  // R-15: draft mới mỗi khi một segment hiện ra (sau start, next sang segment, retry).
  const showSegment = () => {
    const s = engine.state();
    setState(s);
    if (s.phase === "segment") {
      const cur = sim.segments[s.segmentIndex];
      setDraft(initialDraft(cur.id, cur.task));
      shownAt.current = performance.now();
    }
  };

  // Cập nhật dạng hàm: bấm nhanh nhiều lần trước khi vẽ lại không làm mất thao tác trước (BUG-003).
  const act = (a: Action) => seg && setDraft((d) => (d ? update(seg.task, d, a) : d));

  const submit = () => {
    if (!seg || !draft) return;
    const durationMs = Math.max(0, Math.round(performance.now() - shownAt.current)); // R-14
    setResult(engine.submit(toAnswer(seg.task, draft), { durationMs }));
    setState(engine.state());
  };

  return (
    <div className="space-y-5">
      {state.phase !== "done" && <StatBars stats={sim.stats} values={state.stats} />}

      {state.phase === "intro" && (
        <section className="space-y-3">
          <p className="text-lg">{sim.persona}</p>
          <p className="text-slate-700">{sim.setting}</p>
          <button className={primary} onClick={() => { engine.start(); showSegment(); }}>Bắt đầu ngày làm việc</button>
        </section>
      )}

      {state.phase === "segment" && seg && draft && (
        <section className="space-y-3">
          <p className="text-sm text-slate-500">Phần {state.segmentIndex + 1}/{sim.segments.length} · {seg.time} (giờ minh họa)</p>
          <h2 className="text-xl font-semibold">{seg.title}</h2>
          <p>{seg.narrative}</p>
          {/* <div>, không phải <p>: <details> của trích dẫn không được nằm trong <p>. */}
          <div className="text-sm text-slate-600">
            Việc này có thật trong nghề: {seg.basis.text}
            {(citations[seg.id] ?? []).map((c, k) => <Citation key={k} c={c} />)}
          </div>
          <p className="font-medium">{seg.task.prompt}</p>
          <TaskView segmentId={seg.id} task={seg.task} draft={draft} act={act} />
          <button className={primary} disabled={!canSubmit(seg.task, draft)} onClick={submit}>Nộp</button>
        </section>
      )}

      {state.phase === "feedback" && seg && result && (
        <section className="space-y-3">
          <h2 className="text-xl font-semibold">{seg.title}</h2>
          {result.success === true && <p className="text-lg font-semibold text-emerald-700">Chính xác!</p>}
          {result.success === false && <p className="text-lg font-semibold text-amber-700">Chưa đúng</p>}
          <ul className="flex flex-wrap gap-2">
            {formatDelta(result.appliedDelta, sim.stats).map((d) => <li key={d} className="rounded bg-slate-100 px-2 py-1 text-sm">{d}</li>)}
          </ul>
          {result.feedback.length > 0 && (
            <ul className="list-disc space-y-1 pl-6">{result.feedback.map((f, k) => <li key={k}>{f}</li>)}</ul>
          )}
          <div className="flex gap-3">
            <button className={secondary} onClick={() => { engine.retry(); showSegment(); }}>Làm lại</button>
            <button className={primary} onClick={() => { engine.next(); showSegment(); }}>Tiếp tục</button>
          </div>
        </section>
      )}

      {state.phase === "reflection" && (
        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Nhìn lại một ngày</h2>
          {sim.reflection_questions && sim.reflection_questions.length > 0 && (
            <ul className="list-disc space-y-1 pl-6">{sim.reflection_questions.map((q, k) => <li key={k}>{q}</li>)}</ul>
          )}
          <button className={primary} onClick={() => { engine.finish(); setState(engine.state()); }}>Kết thúc ngày</button>
        </section>
      )}

      {state.phase === "done" && (
        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Kết thúc một ngày</h2>
          <p>Bạn đã đi qua {state.history.length} phần của một ngày làm việc.</p>
          <StatBars stats={sim.stats} values={state.stats} />
          <a href={`/nghe/${professionId}/`} className="inline-block text-blue-700 underline">Về hồ sơ nghề</a>
        </section>
      )}
    </div>
  );
}

/** R-13 */
function StatBars({ stats, values }: { stats: PlayerSimulation["stats"]; values: Record<string, number> }) {
  return (
    <div className="grid gap-2 rounded border border-slate-200 bg-slate-50 p-3 sm:grid-cols-3">
      {stats.map((s) => (
        <label key={s.id} className="block text-sm">
          <span className="flex justify-between"><span>{s.label}</span><span className="font-mono">{values[s.id]}</span></span>
          <progress max={100} value={values[s.id]} className="h-2 w-full" />
        </label>
      ))}
    </div>
  );
}

/** R-12. Dùng lại trong bảng task của game 2D (SPEC-006 R-12). */
export function TaskView({ segmentId, task, draft, act }: { segmentId: string; task: Task; draft: Draft; act: (a: Action) => void }) {
  switch (draft.type) {
    case "sequence":
      return (
        <ol className="space-y-2">
          {draft.order.map((step, i) => (
            <li key={step} className="flex items-center gap-2 rounded border border-slate-200 bg-white p-2">
              <span className="w-6 text-right font-mono text-slate-500">{i + 1}.</span>
              <span className="flex-1">{step}</span>
              <button className={small} disabled={i === 0} onClick={() => act({ kind: "move", from: i, to: i - 1 })}>Lên</button>
              <button className={small} disabled={i === draft.order.length - 1} onClick={() => act({ kind: "move", from: i, to: i + 1 })}>Xuống</button>
            </li>
          ))}
        </ol>
      );
    case "choice":
      return (
        <fieldset className="space-y-2">
          {task.options!.map((o, k) => (
            <label key={k} className="flex gap-2 rounded border border-slate-200 bg-white p-2">
              <input type="radio" name={`choice-${segmentId}`} checked={draft.option === k} onChange={() => act({ kind: "pick", option: k })} />
              <span>{o.text}</span>
            </label>
          ))}
        </fieldset>
      );
    case "drag_sort":
      return (
        <ul className="space-y-2">
          {displayOrder(segmentId, task.items!.length).map((i) => (
            <li key={i} className="rounded border border-slate-200 bg-white p-2">
              <div className="mb-1">{task.items![i].text}</div>
              <div className="flex flex-wrap gap-2">
                {task.buckets!.map((b) => (
                  <button key={b} aria-pressed={draft.placement[i] === b} className={toggle(draft.placement[i] === b)} onClick={() => act({ kind: "place", item: i, bucket: b })}>{b}</button>
                ))}
              </div>
            </li>
          ))}
        </ul>
      );
    case "spot_error":
      return (
        <div className="space-y-1">
          {task.document!.map((line, k) => (
            <button key={k} aria-pressed={draft.lines.includes(k)} className={`block w-full ${toggle(draft.lines.includes(k))}`} onClick={() => act({ kind: "toggle", line: k })}>{line}</button>
          ))}
        </div>
      );
    case "dialogue": {
      const turns = task.turns!;
      const next = draft.replies.length;
      return (
        <div className="space-y-3">
          {turns.slice(0, Math.min(next + 1, turns.length)).map((t, k) => (
            <div key={k} className="space-y-2">
              <p className="rounded bg-slate-100 p-2"><span className="font-medium">{task.npc}:</span> {t.npc_line}</p>
              {k < next ? (
                <p className="ml-6 rounded bg-blue-50 p-2">Bạn: {t.replies[draft.replies[k]].text}</p>
              ) : (
                <div className="ml-6 space-y-1">
                  {t.replies.map((r, j) => (
                    <button key={j} className={`block w-full ${toggle(false)}`} onClick={() => act({ kind: "reply", turn: k, reply: j })}>{r.text}</button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      );
    }
    case "time_budget":
      return (
        <div className="space-y-2">
          <p className="font-medium">Còn lại {remainingMinutes(task, draft)} phút</p>
          {task.activities!.map((a, k) => (
            <div key={k} className="flex items-center gap-2 rounded border border-slate-200 bg-white p-2">
              <span className="flex-1">{a.label}</span>
              <button className={small} disabled={draft.minutes[k] < 30} onClick={() => act({ kind: "sub", activity: k })}>−30</button>
              <span className="w-16 text-center font-mono">{draft.minutes[k]} phút</span>
              <button className={small} disabled={remainingMinutes(task, draft) < 30} onClick={() => act({ kind: "add", activity: k })}>+30</button>
            </div>
          ))}
        </div>
      );
  }
}
