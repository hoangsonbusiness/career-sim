"use client";
// SPEC-007 R-6..R-11 — sáu hoạt cảnh. Mỗi thao tác chỉ gọi `act` với đúng action của controller SPEC-005.
import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { displayOrder, remainingMinutes, type Action, type Draft, type Task } from "../../sim/controller";
import { dropIndex, hitBucket, timeSlots, type Rect } from "./layout";
import { DialogBox, DialogOption, frame } from "./ui";

type Act = (a: Action) => void;
interface StageProps { segmentId: string; task: Task; draft: Draft; act: Act; announce: (msg: string) => void }

/** Vùng giữa màn hình cho bảng đen / tờ bài / khay / thanh thời gian. */
// data-minigame ghi trực tiếp ở nơi gọi (chuỗi cố định) để kiểm được tên hoạt cảnh trong mã nguồn (AC-007-09).
function Stage({ children, className = "", ...rest }: { children: React.ReactNode; className?: string; "data-minigame": string }) {
  return (
    <div {...rest} className={`mx-auto flex min-h-0 w-full max-w-xl flex-1 flex-col overflow-y-auto ${className}`}>
      {children}
    </div>
  );
}

// ---------------- sequence: bảng đen, kéo thẻ phấn ----------------
export function SequenceBoard({ draft, act, announce }: StageProps) {
  const order = draft.type === "sequence" ? draft.order : [];
  const refs = useRef<(HTMLLIElement | null)[]>([]);
  const [drag, setDrag] = useState<{ i: number; startY: number; dy: number } | null>(null);
  const [lifted, setLifted] = useState<number | null>(null);

  const onDown = (i: number) => (e: PointerEvent) => {
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setDrag({ i, startY: e.clientY, dy: 0 });
  };
  const onMove = (e: PointerEvent) => drag && setDrag({ ...drag, dy: e.clientY - drag.startY });
  const onUp = (e: PointerEvent) => {
    if (!drag) return;
    const centers = refs.current.map((el) => { const r = el!.getBoundingClientRect(); return r.top + r.height / 2; });
    const to = dropIndex(centers, drag.i, e.clientY);
    if (to !== drag.i) act({ kind: "move", from: drag.i, to });
    setDrag(null);
  };
  // R-5: bàn phím — Space/Enter nhấc/thả, mũi tên dời, Escape hủy.
  const origin = useRef<number | null>(null);
  const onKey = (i: number) => (e: KeyboardEvent) => {
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      if (lifted === null) { setLifted(i); origin.current = i; announce(`Đã nhấc thẻ ${i + 1} trên ${order.length}`); }
      else { setLifted(null); announce(`Đã đặt thẻ ở vị trí ${i + 1} trên ${order.length}`); }
    } else if (lifted === i && (e.key === "ArrowUp" || e.key === "ArrowDown")) {
      e.preventDefault();
      const to = i + (e.key === "ArrowUp" ? -1 : 1);
      if (to < 0 || to >= order.length) return;
      act({ kind: "move", from: i, to });
      setLifted(to);
      announce(`Thẻ ${to + 1} trên ${order.length}`);
      requestAnimationFrame(() => refs.current[to]?.focus());
    } else if (lifted === i && e.key === "Escape") {
      if (origin.current !== null && origin.current !== i) act({ kind: "move", from: i, to: origin.current });
      setLifted(null);
      announce("Đã hủy");
    }
  };

  return (
    <Stage data-minigame="sequence">
      <div className="flex-1 rounded-md border-[6px] border-[#7a5230] bg-[#2f4f3a] p-3 shadow-[inset_0_0_30px_rgba(0,0,0,0.4)]">
        <ol className="space-y-2">
          {order.map((step, i) => (
            <li
              key={step}
              ref={(el) => { refs.current[i] = el; }}
              tabIndex={0}
              onPointerDown={onDown(i)}
              onPointerMove={onMove}
              onPointerUp={onUp}
              onKeyDown={onKey(i)}
              aria-grabbed={lifted === i}
              style={drag?.i === i ? { transform: `translateY(${drag.dy}px) rotate(-1deg)`, zIndex: 5 } : undefined}
              className={`relative flex cursor-grab touch-none select-none items-center gap-2 rounded border-2 border-dashed px-3 py-2 font-[cursive] text-[#f4f1e8] transition-colors ${drag?.i === i ? "border-[#ffd23f] bg-white/15" : lifted === i ? "border-[#ffd23f] bg-white/10" : "border-white/40 bg-white/5 hover:bg-white/10"}`}
            >
              <span className="w-5 text-[#ffd23f]">{i + 1}.</span>
              <span className="flex-1">{step}</span>
              <span aria-hidden className="text-white/50">⠿</span>
            </li>
          ))}
        </ol>
      </div>
    </Stage>
  );
}

// ---------------- choice: lựa chọn ở khung thoại ----------------
export function ChoiceBox({ task, draft, act }: StageProps) {
  const option = draft.type === "choice" ? draft.option : null;
  return (
    <div data-minigame="choice">
      <DialogBox>
        {task.options!.map((o, k) => (
          <DialogOption key={k} selected={option === k} onClick={() => act({ kind: "pick", option: k })}>{o.text}</DialogOption>
        ))}
      </DialogBox>
    </div>
  );
}

// ---------------- drag_sort: khay tài liệu ----------------
export function TraySort({ segmentId, task, draft, act, announce }: StageProps) {
  const placement = draft.type === "drag_sort" ? draft.placement : [];
  const buckets = task.buckets!;
  const items = task.items!;
  const trayRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [drag, setDrag] = useState<{ item: number; x: number; y: number; ox: number; oy: number } | null>(null);
  const [lifted, setLifted] = useState<{ item: number; tray: number } | null>(null);
  const order = displayOrder(segmentId, items.length);

  const onDown = (item: number) => (e: PointerEvent) => {
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setDrag({ item, x: e.clientX, y: e.clientY, ox: e.clientX - r.left, oy: e.clientY - r.top });
  };
  const onMove = (e: PointerEvent) => drag && setDrag({ ...drag, x: e.clientX, y: e.clientY });
  const onUp = (e: PointerEvent) => {
    if (!drag) return;
    const rects: Rect[] = trayRefs.current.map((el) => { const r = el!.getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height }; });
    const b = hitBucket({ x: e.clientX, y: e.clientY }, rects);
    if (b !== null) act({ kind: "place", item: drag.item, bucket: buckets[b] });
    setDrag(null);
  };
  // R-5: Space nhấc, ←/→ chọn khay, Space thả, Escape hủy.
  const onKey = (item: number) => (e: KeyboardEvent) => {
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      if (!lifted) { setLifted({ item, tray: 0 }); announce(`Đã nhấc tờ. Khay: ${buckets[0]}`); }
      else { act({ kind: "place", item: lifted.item, bucket: buckets[lifted.tray] }); announce(`Đã đặt vào khay ${buckets[lifted.tray]}`); setLifted(null); }
    } else if (lifted && (e.key === "ArrowLeft" || e.key === "ArrowRight")) {
      e.preventDefault();
      const tray = (lifted.tray + (e.key === "ArrowRight" ? 1 : buckets.length - 1)) % buckets.length;
      setLifted({ ...lifted, tray });
      announce(`Khay: ${buckets[tray]}`);
    } else if (e.key === "Escape") { setLifted(null); announce("Đã hủy"); }
  };

  const sheet = (item: number) => (
    <div
      key={item}
      tabIndex={0}
      onPointerDown={onDown(item)}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onKeyDown={onKey(item)}
      aria-grabbed={lifted?.item === item}
      style={drag?.item === item ? { position: "fixed", left: drag.x - drag.ox, top: drag.y - drag.oy, zIndex: 50, width: 180 } : undefined}
      className={`cursor-grab touch-none select-none rounded-sm border border-[#d6cfb8] bg-white px-2 py-1.5 text-xs text-[#3b2a1a] shadow-[2px_2px_0_rgba(0,0,0,0.25)] ${lifted?.item === item ? "ring-2 ring-[#ffd23f]" : ""}`}
    >
      📝 {items[item].text}
    </div>
  );

  return (
    <Stage data-minigame="drag_sort">
      <div className="mb-3 flex min-h-[3rem] flex-wrap gap-2">{order.filter((i) => placement[i] === null).map(sheet)}</div>
      <div className="grid flex-1 grid-cols-2 gap-3">
        {buckets.map((b, k) => (
          <div
            key={b}
            ref={(el) => { trayRefs.current[k] = el; }}
            className={`flex flex-col gap-1.5 rounded-md border-4 border-[#7a5230] bg-[#c99a5b] p-2 shadow-[inset_0_4px_0_rgba(0,0,0,0.2)] ${lifted?.tray === k ? "outline outline-4 outline-[#ffd23f]" : ""}`}
          >
            <div className="rounded bg-[#3b2a1a] px-2 py-0.5 text-center text-xs font-bold text-[#ffd23f]">{b}</div>
            {order.filter((i) => placement[i] === b).map(sheet)}
          </div>
        ))}
      </div>
    </Stage>
  );
}

// ---------------- spot_error: tờ bài, bút đỏ khoanh ----------------
export function PaperSpot({ task, draft, act }: StageProps) {
  const lines = draft.type === "spot_error" ? draft.lines : [];
  return (
    <Stage data-minigame="spot_error" className="items-center justify-center">
      <div className="w-full max-w-md rotate-[-1deg] rounded-sm bg-[#fdfcf7] p-4 shadow-[4px_6px_0_rgba(0,0,0,0.35)]" style={{ backgroundImage: "repeating-linear-gradient(#fdfcf7 0 31px, #b9d3ee 31px 32px)" }}>
        <div className="mb-2 border-b-2 border-red-300 pb-1 text-xs text-slate-500">Bài kiểm tra — Ngữ văn</div>
        {task.document!.map((line, k) => {
          const on = lines.includes(k);
          return (
            <button key={k} aria-pressed={on} onClick={() => act({ kind: "toggle", line: k })} className="relative block h-8 w-full text-left font-[cursive] text-[15px] text-[#1f3a8a]">
              {line}
              {on && (
                <svg className="pointer-events-none absolute -inset-x-1 -inset-y-0.5" viewBox="0 0 100 20" preserveAspectRatio="none" aria-hidden>
                  <ellipse cx="50" cy="10" rx="49" ry="9" fill="none" stroke="#d62828" strokeWidth="1.2" vectorEffect="non-scaling-stroke" pathLength={1} className="pen-circle" />
                </svg>
              )}
            </button>
          );
        })}
      </div>
    </Stage>
  );
}

// ---------------- time_budget: thanh thời gian buổi tối ----------------
const SLOT_COLORS = ["#4f8cc9", "#e07a3f", "#5fae5a", "#b46ac9"];
export function TimeBar({ task, draft, act }: StageProps) {
  const minutes = draft.type === "time_budget" ? draft.minutes : [];
  const slots = timeSlots(minutes, task.budget_min!);
  const left = remainingMinutes(task, draft);
  return (
    <Stage data-minigame="time_budget" className="justify-center gap-3">
      <div className={`${frame} p-3`}>
        <div className="mb-1 text-xs font-bold text-[#3b2a1a]">🕗 Buổi tối</div>
        <div className="flex gap-1">
          {slots.map((s, k) => (
            <div key={k} className="h-10 flex-1 rounded-sm border-2 border-[#3b2a1a] transition-colors duration-300" style={{ background: s === null ? "#efe6cf" : SLOT_COLORS[s % SLOT_COLORS.length] }} title={s === null ? "Trống" : task.activities![s].label} />
          ))}
        </div>
        <div className="mt-1 text-right text-xs font-bold text-[#3b2a1a]">Còn {left} phút</div>
      </div>
      <div className="grid gap-2 sm:grid-cols-3">
        {task.activities!.map((a, k) => (
          <div key={k} className={`${frame} flex items-center gap-2 p-2`}>
            <span className="h-4 w-4 shrink-0 rounded-sm border-2 border-[#3b2a1a]" style={{ background: SLOT_COLORS[k % SLOT_COLORS.length] }} />
            <span className="min-w-0 flex-1 text-xs font-bold text-[#3b2a1a]">{a.label}</span>
            <button className="h-7 w-7 rounded border-2 border-[#3b2a1a] bg-white font-bold disabled:opacity-30" disabled={minutes[k] < 30} onClick={() => act({ kind: "sub", activity: k })} aria-label={`Bớt 30 phút ${a.label}`}>−</button>
            <button className="h-7 w-7 rounded border-2 border-[#3b2a1a] bg-[#ffd23f] font-bold disabled:opacity-30" disabled={left < 30} onClick={() => act({ kind: "add", activity: k })} aria-label={`Thêm 30 phút ${a.label}`}>+</button>
          </div>
        ))}
      </div>
    </Stage>
  );
}

// ---------------- dialogue: bong bóng qua lại ----------------
/** Trả về lời NPC đang nói và câu vừa chọn (hiện 1200 ms, R-11) để lớp ngoài vẽ bong bóng. */
export function useDialogue(task: Task, draft: Draft) {
  const replies = draft.type === "dialogue" ? draft.replies : [];
  const [echo, setEcho] = useState<string | null>(null);
  const prev = useRef(replies.length);
  useEffect(() => {
    if (replies.length > prev.current) {
      const t = replies.length - 1;
      setEcho(task.turns?.[t]?.replies[replies[t]]?.text ?? null);
      const h = setTimeout(() => setEcho(null), 1200);
      prev.current = replies.length;
      return () => clearTimeout(h);
    }
    prev.current = replies.length;
  }, [replies, task]);
  // Hook luôn được gọi (luật hook của React), kể cả với task không phải hội thoại.
  const turns = task.turns ?? [];
  if (turns.length === 0) return { npcLine: "", echo: null, next: null };
  const turn = Math.min(replies.length, turns.length - 1);
  return { npcLine: turns[turn].npc_line, echo, next: replies.length < turns.length ? replies.length : null };
}

export function DialogueBox({ task, draft, act }: StageProps) {
  const { next, echo } = useDialogue(task, draft);
  return (
    <div data-minigame="dialogue">
      {next !== null && !echo && (
        <DialogBox>
          {task.turns![next].replies.map((r, j) => (
            <DialogOption key={j} onClick={() => act({ kind: "reply", turn: next, reply: j })}>{r.text}</DialogOption>
          ))}
        </DialogBox>
      )}
    </div>
  );
}
