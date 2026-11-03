"use client";
// SPEC-007 — khối giao diện dùng chung: bong bóng thoại bám theo nhân vật, khung thoại đáy màn hình, tiêu đề việc.
import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { bubbleRect } from "./layout";

export const ink = "#3b2a1a";
export const frame = "rounded-md border-4 border-[#3b2a1a] bg-[#fff8e7] shadow-[0_4px_0_#3b2a1a]";
const btnBase = "rounded border-2 border-[#3b2a1a] px-3 py-1.5 font-bold shadow-[0_2px_0_#3b2a1a] active:translate-y-0.5 active:shadow-none disabled:opacity-40";
export const primary = `${btnBase} bg-[#ffd23f] text-[#3b2a1a]`;
export const secondary = `${btnBase} bg-white text-[#3b2a1a]`;

export type Anchor = { x: number; y: number } | null;

/** R-3, R-4: bong bóng phía trên điểm neo, kẹp trong khung game; văn bản dài thì cắt 3 dòng + nút "…". */
export function Bubble({ anchor, frameSize, speaker, children, clamp = true }: {
  anchor: Anchor;
  frameSize: { w: number; h: number };
  speaker?: string | null;
  children: ReactNode;
  clamp?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 240, h: 60 });
  const [open, setOpen] = useState(false);
  const w = Math.min(260, frameSize.w - 16);
  useLayoutEffect(() => {
    if (ref.current) setSize({ w, h: ref.current.offsetHeight });
  }, [children, open, w]);
  const a = anchor ?? { x: frameSize.w / 2, y: frameSize.h * 0.45 };
  const r = bubbleRect(a, size, frameSize, 8);
  const tailX = Math.max(12, Math.min(size.w - 12, a.x - r.x));
  return (
    <div ref={ref} className={`${frame} absolute z-20 px-3 py-2 text-sm text-[#3b2a1a]`} style={{ left: r.x, top: r.y, width: w }}>
      {speaker && <div className="mb-0.5 text-xs font-bold uppercase tracking-wide text-[#8a5a00]">{speaker}</div>}
      <div className={clamp && !open ? "line-clamp-3" : ""}>{children}</div>
      {clamp && !open && <button className="text-xs font-bold underline" onClick={() => setOpen(true)} aria-label="Đọc hết">…</button>}
      <span className="absolute -bottom-[10px] h-0 w-0 border-x-[8px] border-t-[8px] border-x-transparent border-t-[#3b2a1a]" style={{ left: tailX - 8 }} />
    </div>
  );
}

/** Khung thoại đáy màn hình: lựa chọn của nhân vật chính hoặc các nút điều khiển. */
export function DialogBox({ children }: { children: ReactNode }) {
  return <div className={`${frame} absolute inset-x-2 bottom-2 z-20 space-y-1.5 p-2`}>{children}</div>;
}

/** Một lựa chọn trong khung thoại. */
export function DialogOption({ selected, onClick, children }: { selected?: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`block w-full rounded border-2 px-2 py-1 text-left text-sm text-[#3b2a1a] ${selected ? "border-[#e0a800] bg-[#fff1b8]" : "border-transparent hover:border-[#3b2a1a]"}`}
    >
      ▸ {children}
    </button>
  );
}

/** R-4: tiêu đề một dòng (prompt), nút 📖, nút "Xong". */
export function TaskBar({ prompt, onSources, onDone, canDone }: { prompt: string; onSources: () => void; onDone: () => void; canDone: boolean }) {
  return (
    <div className="flex shrink-0 items-center gap-2">
      <div className={`${frame} min-w-0 flex-1 truncate px-2 py-1 text-sm font-bold text-[#3b2a1a]`} title={prompt}>{prompt}</div>
      <button className={`${frame} px-2 py-0.5 text-lg`} title="Nguồn: việc này có thật trong nghề" onClick={onSources}>📖</button>
      <button className={primary} disabled={!canDone} onClick={onDone}>Xong</button>
    </div>
  );
}
