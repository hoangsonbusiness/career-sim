"use client";
// SPEC-006 + SPEC-014 — game 2D "xem và nghe kể": màn tiêu đề HTML, cảnh Phaser tải lười, lớp HTML phủ
// (HUD, nhiệm vụ, bong bóng lời kể, thẻ "Ngoài đời thật"). Vòng chơi do story.ts; không chấm điểm (R-2).
import { useCallback, useEffect, useRef, useState } from "react";
import type { CitationView } from "../profile/view";
import { Citation } from "../profile/components";
import type { GameHandle } from "./scene";
import { createStory, reduce, type StoryAction, type StoryState } from "./story";
import type { WorldData } from "./types";
import type { World3D } from "../game3d/types";
import { chooseRenderer } from "../game3d/layout";

type Confidence = "verified" | "single_source" | "needs_verification";

/** Phần của file nghề mà game cần (R-6: không đọc `task`). */
export interface StorySimulation {
  persona: string;
  segments: { id: string; time: string; title: string; narrative: string; basis: { text: string; confidence?: Confidence } }[];
  reflection_questions?: string[];
}

interface Props {
  professionId: string;
  name: string;
  sim: StorySimulation;
  world: WorldData;
  /** SPEC-031: dữ liệu 3D nếu nghề đã có; null = chạy Phaser 2D. */
  world3d?: World3D | null;
  /** SPEC-031 R-19: ghi công các bộ asset 3D. */
  credits3d?: string[];
  citations: Record<string, CitationView[]>;
}

// SPEC-031 R-20, R-21: khung HUD dùng biến --hud-* trong globals.css.
const frame = "hud";
const primary = "hud-btn";

/** SPEC-031 R-16: WebGL2 có sẵn không; lỗi thì coi là không. */
function hasWebGL2(): boolean {
  try { return !!document.createElement("canvas").getContext("webgl2"); } catch { return false; }
}

/** R-5: nhãn mức tin cậy. */
const CONFIDENCE: Record<Confidence, { label: string; cls: string }> = {
  verified: { label: "Đã kiểm chứng", cls: "bg-emerald-100 text-emerald-900" },
  single_source: { label: "Một nguồn", cls: "bg-sky-100 text-sky-900" },
  needs_verification: { label: "⚠ Cần kiểm chứng thêm", cls: "bg-amber-100 text-amber-900" },
};

type Anchor = { x: number; y: number } | null;

/** Theo dõi điểm neo của nhân vật mỗi khung hình (camera có thể đang dịch). */
function useAnchor(game: GameHandle | null, id: string | null, active: boolean): Anchor {
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

export function GamePlayer({ professionId, name, sim, world, world3d = null, credits3d = [], citations }: Props) {
  const host = useRef<HTMLDivElement>(null);
  const game = useRef<GameHandle | null>(null);
  const storyRef = useRef<StoryState>(createStory(sim.segments.length, (sim.reflection_questions ?? []).length));

  const [story, setStory] = useState<StoryState>(storyRef.current);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [renderer, setRenderer] = useState<"three" | "phaser" | null>(null);
  const [coarse, setCoarse] = useState(false);
  useEffect(() => { try { setCoarse(window.matchMedia("(pointer: coarse)").matches); } catch { /* giữ mặc định */ } }, []);

  const dispatch = useCallback((a: StoryAction) => {
    const next = reduce(storyRef.current, a);
    storyRef.current = next;
    setStory(next);
    return next;
  }, []);

  const mode = story.mode;
  const seg = mode === "walk" || mode === "scene" ? sim.segments[story.index] : null;
  const ws = seg ? world.segments[seg.id] : null;

  const enterSegment = useCallback(async (s: StoryState) => {
    const w = world.segments[sim.segments[s.index].id];
    await game.current!.showMap(w.map); // SPEC-006 R-10
    game.current!.setTarget(w.target);
    game.current!.setWalkEnabled(true);
  }, [sim, world]);

  const openScene = useCallback(() => {
    if (storyRef.current.mode !== "walk") return;
    const s = dispatch("interact");
    game.current?.setWalkEnabled(false);
    game.current?.setTarget(null);
    game.current?.focusOn(world.segments[sim.segments[s.index].id].target);
  }, [dispatch, sim, world]);

  const start = async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const cb = { onInteract: () => openScene() };
      let used: "three" | "phaser" = chooseRenderer(world3d !== null, { webgl2: hasWebGL2() });
      if (used === "three") {
        try {
          // SPEC-031 R-17: Three.js chỉ tải lúc này, và chỉ trên đường "three".
          const { mountGame3D } = await import("../game3d/scene3d");
          game.current = await mountGame3D(host.current!, world, world3d!, cb);
        } catch (e) {
          console.error("Không mở được cảnh 3D, chuyển sang bản 2D", e); // R-16: dự phòng Phaser một lần
          used = "phaser";
        }
      }
      if (used === "phaser") {
        const { mountGame } = await import("./scene"); // SPEC-006 R-16: Phaser chỉ tải lúc này
        game.current = mountGame(host.current!, world, cb);
      }
      setRenderer(used);
      await enterSegment(dispatch("start"));
    } catch (e) {
      console.error("Không tải được game", e);
      game.current?.destroy();
      game.current = null;
      setLoadError(true); // SPEC-006 3.5: giữ intro
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => () => game.current?.destroy(), []);

  /** R-7, R-10 */
  const next = useCallback(async () => {
    const s = dispatch("continue");
    game.current?.focusOn(null);
    if (s.mode === "walk") await enterSegment(s);
  }, [dispatch, enterSegment]);

  // R-7: phím Space/Enter/E cũng là "Tiếp tục" khi đang xem cảnh.
  useEffect(() => {
    if (mode !== "scene") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === " " || e.key === "Enter" || e.key.toLowerCase() === "e") { e.preventDefault(); void next(); }
    };
    // Bỏ qua phím vừa dùng để tương tác mở cảnh.
    const t = setTimeout(() => window.addEventListener("keydown", onKey), 200);
    return () => { clearTimeout(t); window.removeEventListener("keydown", onKey); };
  }, [mode, next]);

  const questions = sim.reflection_questions ?? [];
  const anchor = useAnchor(game.current, ws?.npc ?? null, mode === "scene");
  const conf = seg?.basis.confidence ? CONFIDENCE[seg.basis.confidence] : null;

  return (
    <div className="relative h-[75vh] min-h-[420px] w-full overflow-hidden rounded-lg bg-[#2a1f18] select-none" style={{ fontFamily: "var(--hud-font)" }}>
      <div ref={host} className="absolute inset-0" />

      {mode === "intro" && (
        <div className="absolute inset-0 flex items-center justify-center p-4">
          <div className={`${frame} max-w-md space-y-3 p-5 text-center`}>
            <p className="">{sim.persona.split(/[—.]/)[0].trim()}</p>
            <button className={primary} onClick={start} disabled={loading}>Bắt đầu ngày làm việc</button>
            {loading && <p className="text-sm hud-muted">Đang mở bản đồ…</p>}
            {loadError && <p className="text-sm text-red-300">Không tải được game. Thử lại</p>}
            <p className="text-xs hud-muted">Phím mũi tên / WASD để đi · Space để xem việc · hoặc chạm vào nơi muốn tới</p>
          </div>
        </div>
      )}

      {/* HUD (R-8): chỉ giờ minh họa và số phần, không chỉ số */}
      {seg && (
        <div className="pointer-events-none absolute left-2 top-2">
          <div className={`${frame} px-2 py-1 text-xs font-bold`}>~{seg.time} · Phần {story.index + 1}/{story.total}</div>
        </div>
      )}

      {mode === "walk" && ws && (
        <div className="pointer-events-none absolute left-1/2 top-12 -translate-x-1/2">
          <div className={`${frame} px-3 py-1.5 text-sm font-bold`}>▶ {ws.quest}</div>
        </div>
      )}

      {/* SPEC-031 R-22: thanh gợi ý phím */}
      {mode === "walk" && renderer && (
        <div className="pointer-events-none absolute bottom-2 left-2">
          <div className={`${frame} flex flex-wrap items-center gap-x-4 gap-y-1 px-3 py-1.5 text-xs`}>
            {coarse ? (
              <>
                <span><span className="hud-key">Chạm</span>Đi tới</span>
                {renderer === "three" && <span><span className="hud-key">Kéo</span>Xoay camera</span>}
              </>
            ) : (
              <>
                <span><span className="hud-key">W A S D / ←↑↓→</span>Di chuyển</span>
                <span><span className="hud-key">E</span>Tương tác</span>
                {renderer === "three" && <span><span className="hud-key">Kéo chuột</span>Xoay camera</span>}
              </>
            )}
          </div>
        </div>
      )}

      {/* Cảnh (R-4, R-5, R-6) */}
      {mode === "scene" && seg && (
        <>
          <div
            className="pointer-events-none absolute z-10 w-[min(22rem,80%)] -translate-x-1/2 -translate-y-full"
            style={anchor ? { left: anchor.x, top: anchor.y - 8 } : { left: "50%", top: "40%" }}
          >
            <div className={`${frame} px-3 py-2 text-sm`}>{seg.narrative}</div>
          </div>
          <div className="absolute bottom-2 left-2 right-2 z-20 flex justify-center">
            <div className={`${frame} w-full max-w-xl space-y-2 p-3`}>
              <p className="text-xs font-bold uppercase tracking-wide hud-muted">Ngoài đời thật · {seg.title}</p>
              <p className="text-sm">{seg.basis.text}</p>
              <div className="flex flex-wrap items-center gap-2">
                {conf && <span className={`rounded px-1.5 text-xs ${conf.cls}`}>{conf.label}</span>}
                {(citations[seg.id] ?? []).map((c, k) => <Citation key={k} c={c} />)}
                <button className={`${primary} ml-auto`} onClick={() => void next()}>Tiếp tục</button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Nhìn lại một ngày (R-10) */}
      {mode === "reflection" && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 p-4">
          <div className={`${frame} max-w-md space-y-3 p-5`}>
            <p className="text-sm font-bold">Nhìn lại một ngày</p>
            <p className="text-lg">💭 {questions[story.question]}</p>
            <div className="flex justify-end">
              <button className={primary} onClick={() => void next()}>Tiếp</button>
            </div>
          </div>
        </div>
      )}

      {/* Kết thúc (R-9) */}
      {mode === "done" && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 p-4">
          <div className={`${frame} max-h-full w-full max-w-md space-y-3 overflow-auto p-5`}>
            <p className="text-xl font-bold">Hết một ngày làm {name}</p>
            <p className="text-sm">Hôm nay bạn đã xem:</p>
            <ol className="list-decimal space-y-1 pl-5 text-sm">
              {story.seen.map((i) => <li key={i}>{sim.segments[i].title}</li>)}
            </ol>
            <a href={`/nghe/${professionId}/`} className={`${primary} inline-block`}>Về hồ sơ nghề</a>
            <p className="text-xs hud-muted">Hình ảnh: Kenney.nl (CC0)</p>
            {renderer === "three" && credits3d.length > 0 && <p className="text-xs hud-muted">Mô hình 3D: {credits3d.join(", ")}</p>}
          </div>
        </div>
      )}
    </div>
  );
}
