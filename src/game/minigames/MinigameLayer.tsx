"use client";
// SPEC-007 — lớp hoạt cảnh phủ lên canvas: tiêu đề việc, bong bóng thoại bám nhân vật, hoạt cảnh theo loại task, kết quả.
import { useEffect, useState } from "react";
import type { SegmentResult } from "../../engine/index";
import { canSubmit, type Action, type Draft, type Task } from "../../sim/controller";
import { Citation } from "../../profile/components";
import type { CitationView } from "../../profile/view";
import type { GameHandle } from "../scene";
import { ChoiceBox, DialogueBox, PaperSpot, SequenceBoard, TimeBar, TraySort, useDialogue } from "./stages";
import { Bubble, DialogBox, frame, primary, secondary, TaskBar, type Anchor } from "./ui";

/** Theo dõi điểm neo của nhân vật mỗi khung hình (camera đang dịch/phóng to). */
export function useAnchor(game: GameHandle | null, id: string | null, active: boolean): Anchor {
  const [a, setA] = useState<Anchor>(null);
  useEffect(() => {
    if (!active || !game) return;
    let raf = 0;
    const tick = () => {
      const n = game.anchorOf(id);
      setA((old) => (n && old && Math.abs(n.x - old.x) < 0.5 && Math.abs(n.y - old.y) < 0.5 ? old : n));
      raf = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(raf);
  }, [game, id, active]);
  return a;
}

/** Kích thước khung game để kẹp bong bóng. */
export function useFrameSize(el: HTMLElement | null) {
  const [s, setS] = useState({ w: 800, h: 600 });
  useEffect(() => {
    if (!el) return;
    const ro = new ResizeObserver(() => setS({ w: el.clientWidth, h: el.clientHeight }));
    ro.observe(el);
    setS({ w: el.clientWidth, h: el.clientHeight });
    return () => ro.disconnect();
  }, [el]);
  return s;
}

interface TaskProps {
  segmentId: string;
  task: Task & { npc?: string; turns?: { npc_line: string; replies: { text: string }[] }[] };
  narrative: string;
  basis: string;
  citations: CitationView[];
  draft: Draft;
  act: (a: Action) => void;
  onDone: () => void;
  speaker: string | null;
  anchor: Anchor;
  playerAnchor: Anchor;
  frameSize: { w: number; h: number };
}

export function MinigameLayer(p: TaskProps) {
  const [sources, setSources] = useState(false);
  const [live, setLive] = useState("");
  const stage = { segmentId: p.segmentId, task: p.task, draft: p.draft, act: p.act, announce: setLive };
  const isDialogue = p.task.type === "dialogue";
  const dlg = useDialogue(p.task, p.draft);
  const talking = p.task.type === "choice" || isDialogue;

  return (
    <>
      <style>{`.pen-circle{stroke-dasharray:1;stroke-dashoffset:1;animation:pen .25s ease-out forwards}@keyframes pen{to{stroke-dashoffset:0}}@media (prefers-reduced-motion: reduce){.pen-circle{animation:none;stroke-dashoffset:0}}`}</style>
      {/* Cột trên cùng: tiêu đề việc → (nguồn) → dòng dẫn → hoạt cảnh. Xếp dọc để không đè nhau ở mọi kích thước. */}
      <div className={`absolute inset-x-2 top-14 z-20 flex flex-col gap-2 ${talking ? "" : "bottom-2"}`}>
        <TaskBar prompt={p.task.prompt} onSources={() => setSources((v) => !v)} onDone={p.onDone} canDone={canSubmit(p.task, p.draft)} />
        {sources && (
          <div className={`${frame} shrink-0 p-2 text-xs text-[#3b2a1a]`}>
            {p.basis}
            {p.citations.map((c, k) => <Citation key={k} c={c} />)}
          </div>
        )}
        {!talking && <div className={`${frame} line-clamp-2 shrink-0 px-2 py-1 text-xs text-[#3b2a1a]`}>{p.narrative}</div>}
        {p.task.type === "sequence" && <SequenceBoard {...stage} />}
        {p.task.type === "drag_sort" && <TraySort {...stage} />}
        {p.task.type === "spot_error" && <PaperSpot {...stage} />}
        {p.task.type === "time_budget" && <TimeBar {...stage} />}
      </div>

      {/* R-4: narrative trong bong bóng của NPC; với hội thoại là lời NPC của lượt hiện tại (R-11). */}
      {talking && (
        <Bubble anchor={p.anchor} frameSize={p.frameSize} speaker={isDialogue ? p.task.npc ?? p.speaker : p.speaker}>
          {isDialogue ? dlg.npcLine : p.narrative}
        </Bubble>
      )}
      {isDialogue && dlg.echo && (
        <Bubble anchor={p.playerAnchor} frameSize={p.frameSize} speaker="Bạn" clamp={false}>{dlg.echo}</Bubble>
      )}
      {p.task.type === "choice" && <ChoiceBox {...stage} />}
      {p.task.type === "dialogue" && <DialogueBox {...stage} />}

      <div aria-live="polite" className="sr-only">{live}</div>
    </>
  );
}

/** R-12: kết quả trong bong bóng NPC, nút ở khung thoại. */
export function ResultLayer({ result, speaker, anchor, frameSize, onRetry, onNext }: {
  result: SegmentResult; speaker: string | null; anchor: Anchor; frameSize: { w: number; h: number }; onRetry: () => void; onNext: () => void;
}) {
  const [more, setMore] = useState(false);
  return (
    <>
      <Bubble anchor={anchor} frameSize={frameSize} speaker={speaker} clamp={false}>
        {result.success !== null && <div className="font-bold">{result.success ? "Chính xác!" : "Chưa đúng"}</div>}
        {result.feedback[0] && <div>{result.feedback[0]}</div>}
        {more && result.feedback.slice(1).map((f, k) => <div key={k} className="mt-1">{f}</div>)}
        {result.feedback.length > 1 && !more && <button className="text-xs underline" onClick={() => setMore(true)}>Xem thêm</button>}
      </Bubble>
      <DialogBox>
        <div className="flex justify-end gap-2">
          <button className={secondary} onClick={onRetry}>Làm lại</button>
          <button className={primary} onClick={onNext}>Tiếp tục</button>
        </div>
      </DialogBox>
    </>
  );
}
