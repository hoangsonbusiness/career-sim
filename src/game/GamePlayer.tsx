"use client";
// SPEC-006 — game 2D: màn tiêu đề HTML, cảnh Phaser tải lười, lớp HTML phủ (HUD, nhiệm vụ, bảng task, kết quả).
// Điểm số và vòng đời ngày do engine SPEC-002; bản nháp đáp án do controller SPEC-005.
import { useCallback, useEffect, useRef, useState } from "react";
import { createEngine, type EngineState, type SegmentResult } from "../engine/index";
import { canSubmit, formatDelta, initialDraft, toAnswer, update, type Action, type Draft } from "../sim/controller";
import { TaskView, type PlayerSimulation } from "../sim/DayPlayer";
import { Citation } from "../profile/components";
import type { CitationView } from "../profile/view";
import type { GameHandle } from "./scene";
import type { GameMode } from "./quest";
import type { WorldData } from "./types";

interface Props {
  professionId: string;
  name: string;
  sim: PlayerSimulation;
  world: WorldData;
  citations: Record<string, CitationView[]>;
}

const frame = "rounded-md border-4 border-[#3b2a1a] bg-[#fff8e7] shadow-[0_4px_0_#3b2a1a]";
const btn = "rounded border-2 border-[#3b2a1a] px-4 py-1.5 font-bold shadow-[0_2px_0_#3b2a1a] active:translate-y-0.5 active:shadow-none disabled:opacity-40";
const primary = `${btn} bg-[#ffd23f] text-[#3b2a1a]`;
const secondary = `${btn} bg-white text-[#3b2a1a]`;

/** R-13: biểu cảm theo kết quả. */
function emoteFor(r: SegmentResult, firstStat: string): string {
  if (r.success === true) return "❤️";
  if (r.success === false) return "💧";
  const d = r.appliedDelta[firstStat];
  return d === undefined || d === 0 ? "💬" : d > 0 ? "❤️" : "💧";
}

export function GamePlayer({ professionId, name, sim, world, citations }: Props) {
  const engine = useRef(createEngine({ id: professionId, day_simulation: sim })).current;
  const host = useRef<HTMLDivElement>(null);
  const game = useRef<GameHandle | null>(null);
  const shownAt = useRef(0);

  const [mode, setMode] = useState<GameMode>("intro");
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [state, setState] = useState<EngineState>(() => engine.state());
  const [draft, setDraft] = useState<Draft | null>(null);
  const [result, setResult] = useState<SegmentResult | null>(null);
  const [floating, setFloating] = useState<string[]>([]);
  const [showMore, setShowMore] = useState(false);
  const [showSources, setShowSources] = useState(false);
  const [question, setQuestion] = useState(0);

  const seg = state.segmentIndex >= 0 ? sim.segments[state.segmentIndex] : null;
  const ws = seg ? world.segments[seg.id] : null;
  const npcName = ws?.npc ? world.npcs.find((n) => n.id === ws.npc)?.name : null;

  const enterSegment = useCallback(async () => {
    const s = engine.state();
    setState(s);
    const cur = sim.segments[s.segmentIndex];
    const w = world.segments[cur.id];
    await game.current!.showMap(w.map);
    game.current!.setTarget(w.target);
    game.current!.setWalkEnabled(true);
    setMode("walk");
  }, [engine, sim, world]);

  const openTask = useCallback(() => {
    const s = engine.state();
    const cur = sim.segments[s.segmentIndex];
    game.current?.setWalkEnabled(false);
    game.current?.setTarget(null);
    setDraft(initialDraft(cur.id, cur.task));
    setShowSources(false);
    shownAt.current = performance.now();
    setMode("task");
  }, [engine, sim]);

  const start = async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const { mountGame } = await import("./scene"); // R-16: Phaser chỉ tải lúc này
      game.current = mountGame(host.current!, world, { onInteract: () => openTask() });
      engine.start();
      await enterSegment();
    } catch (e) {
      console.error("Không tải được game", e);
      game.current?.destroy();
      game.current = null;
      setLoadError(true); // 3.5: giữ intro, engine chưa start
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => () => game.current?.destroy(), []);

  const submit = () => {
    if (!seg || !draft) return;
    const durationMs = Math.max(0, Math.round(performance.now() - shownAt.current));
    const r = engine.submit(toAnswer(seg.task, draft), { durationMs });
    setResult(r);
    setState(engine.state());
    setShowMore(false);
    setFloating(formatDelta(r.appliedDelta, sim.stats));
    game.current?.emote(ws?.npc ?? null, emoteFor(r, sim.stats[0].id));
    setMode("result");
  };

  const retry = () => { engine.retry(); setState(engine.state()); openTask(); };

  const next = async () => {
    engine.next();
    const s = engine.state();
    setState(s);
    setFloating([]);
    if (s.phase === "reflection") { setQuestion(0); setMode("reflection"); return; }
    setMode("walk"); // đóng bảng kết quả ngay; di chuyển chỉ bật lại sau khi đổi bản đồ xong
    await enterSegment();
  };

  const finish = () => { engine.finish(); setState(engine.state()); setMode("done"); };

  // Cập nhật dạng hàm: bấm nhanh nhiều lần trước khi vẽ lại không làm mất thao tác trước.
  const act = (a: Action) => seg && setDraft((d) => (d ? update(seg.task, d, a) : d));
  const questions = sim.reflection_questions ?? [];

  return (
    <div className="relative h-[75vh] min-h-[420px] w-full overflow-hidden rounded-lg bg-[#2b2b35] select-none">
      <div ref={host} className="absolute inset-0" />

      {/* intro (R-11 bảng mode) */}
      {mode === "intro" && (
        <div className="absolute inset-0 flex items-center justify-center p-4">
          <div className={`${frame} max-w-md space-y-3 p-5 text-center`}>
            <p className="text-[#3b2a1a]">{sim.persona.split(/[—.]/)[0].trim()}</p>
            <button className={primary} onClick={start} disabled={loading}>Bắt đầu ngày làm việc</button>
            {loading && <p className="text-sm text-[#6b5a40]">Đang mở trường học…</p>}
            {loadError && (
              <p className="text-sm text-red-700">Không tải được game. Thử lại</p>
            )}
            <p className="text-xs text-[#6b5a40]">Phím mũi tên / WASD để đi · Space để làm việc · hoặc chạm vào nơi muốn tới</p>
          </div>
        </div>
      )}

      {/* HUD (R-11) */}
      {(mode === "walk" || mode === "task" || mode === "result") && seg && (
        <div className="pointer-events-none absolute left-2 right-2 top-2 flex flex-wrap items-start gap-2">
          <div className={`${frame} flex gap-3 px-2 py-1 text-xs`}>
            {sim.stats.map((s) => (
              <div key={s.id} className="w-28">
                <div className="flex justify-between font-bold text-[#3b2a1a]"><span className="truncate">{s.label}</span><span>{state.stats[s.id]}</span></div>
                <progress max={100} value={state.stats[s.id]} className="h-1.5 w-full" />
              </div>
            ))}
          </div>
          <div className={`${frame} px-2 py-1 text-xs font-bold text-[#3b2a1a]`}>~{seg.time} · Phần {state.segmentIndex + 1}/{sim.segments.length}</div>
          {floating.length > 0 && (
            <div className="flex animate-bounce gap-1">
              {floating.map((f) => <span key={f} className="rounded bg-[#3b2a1a] px-1.5 py-0.5 text-xs font-bold text-[#ffd23f]">{f}</span>)}
            </div>
          )}
        </div>
      )}

      {/* Dòng nhiệm vụ */}
      {mode === "walk" && ws && (
        <div className="pointer-events-none absolute left-1/2 top-16 -translate-x-1/2">
          <div className={`${frame} px-3 py-1.5 text-sm font-bold text-[#3b2a1a]`}>▶ {ws.quest}</div>
        </div>
      )}

      {/* Bảng task (R-12) */}
      {mode === "task" && seg && draft && (
        <div className="absolute inset-x-2 bottom-2 max-h-[70%] overflow-y-auto">
          <div className={`${frame} space-y-2 p-3 text-[#3b2a1a]`}>
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm"><span className="font-bold">{npcName ?? "Bạn"}:</span> {seg.narrative}</p>
              <button className="shrink-0 text-lg" title="Nguồn: việc này có thật trong nghề" onClick={() => setShowSources((v) => !v)}>📖</button>
            </div>
            {showSources && (
              <div className="rounded bg-white p-2 text-xs">
                {seg.basis.text}
                {(citations[seg.id] ?? []).map((c, k) => <Citation key={k} c={c} />)}
              </div>
            )}
            <p className="font-bold">{seg.task.prompt}</p>
            <TaskView segmentId={seg.id} task={seg.task} draft={draft} act={act} />
            <div className="flex justify-end"><button className={primary} disabled={!canSubmit(seg.task, draft)} onClick={submit}>Nộp</button></div>
          </div>
        </div>
      )}

      {/* Kết quả */}
      {mode === "result" && result && (
        <div className="absolute inset-x-2 bottom-2">
          <div className={`${frame} space-y-2 p-3 text-[#3b2a1a]`}>
            {result.success !== null && <p className="text-lg font-bold">{result.success ? "Chính xác!" : "Chưa đúng"}</p>}
            {result.feedback[0] && <p className="text-sm">{result.feedback[0]}</p>}
            {result.feedback.length > 1 && !showMore && <button className="text-sm underline" onClick={() => setShowMore(true)}>Xem thêm</button>}
            {showMore && result.feedback.slice(1).map((f, k) => <p key={k} className="text-sm">{f}</p>)}
            <div className="flex justify-end gap-2">
              <button className={secondary} onClick={retry}>Làm lại</button>
              <button className={primary} onClick={next}>Tiếp tục</button>
            </div>
          </div>
        </div>
      )}

      {/* Nhìn lại một ngày */}
      {mode === "reflection" && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 p-4">
          <div className={`${frame} max-w-md space-y-3 p-5 text-[#3b2a1a]`}>
            <p className="text-sm font-bold">Nhìn lại một ngày</p>
            {questions.length > 0 && <p className="text-lg">💭 {questions[question]}</p>}
            <div className="flex justify-end">
              {question < questions.length - 1
                ? <button className={primary} onClick={() => setQuestion((q) => q + 1)}>Tiếp</button>
                : <button className={primary} onClick={finish}>Kết thúc ngày</button>}
            </div>
          </div>
        </div>
      )}

      {/* Kết thúc */}
      {mode === "done" && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 p-4">
          <div className={`${frame} w-full max-w-md space-y-3 p-5 text-[#3b2a1a]`}>
            <p className="text-xl font-bold">Hết một ngày làm {name}</p>
            {sim.stats.map((s) => (
              <div key={s.id}>
                <div className="flex justify-between text-sm font-bold"><span>{s.label}</span><span>{state.stats[s.id]}</span></div>
                <progress max={100} value={state.stats[s.id]} className="h-2 w-full" />
              </div>
            ))}
            <a href={`/nghe/${professionId}/`} className={`${primary} inline-block`}>Về hồ sơ nghề</a>
            <p className="text-xs text-[#6b5a40]">Hình ảnh: Kenney.nl (CC0)</p>
          </div>
        </div>
      )}
    </div>
  );
}
