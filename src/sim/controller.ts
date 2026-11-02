// SPEC-005 — logic giao diện màn chơi. Module thuần: không đồng hồ, không ngẫu nhiên, không sửa đối số.
import type { Answer, StatMap } from "../engine/index.ts";

/** Task của một segment, đọc từ file nghề (chỉ các trường màn chơi dùng). */
export interface Task {
  type: "sequence" | "choice" | "drag_sort" | "spot_error" | "dialogue" | "time_budget";
  prompt: string;
  steps?: string[];
  options?: { text: string; feedback?: string }[];
  buckets?: string[];
  items?: { text: string; bucket: string }[];
  document?: string[];
  turns?: { npc_line: string; replies: { text: string }[] }[];
  npc?: string;
  budget_min?: number;
  activities?: { label: string }[];
}

export type Draft =
  | { type: "sequence"; order: string[] }
  | { type: "choice"; option: number | null }
  | { type: "drag_sort"; placement: (string | null)[] }
  | { type: "spot_error"; lines: number[] }
  | { type: "dialogue"; replies: number[] }
  | { type: "time_budget"; minutes: number[] };

export type Action =
  | { kind: "move"; from: number; to: number }
  | { kind: "pick"; option: number }
  | { kind: "place"; item: number; bucket: string }
  | { kind: "toggle"; line: number }
  | { kind: "reply"; turn: number; reply: number }
  | { kind: "add" | "sub"; activity: number };

// --- R-1: thứ tự hiển thị tất định ---
function fnv1a32(s: string): number {
  let h = 0x811c9dc5;
  for (const b of new TextEncoder().encode(s)) {
    h ^= b;
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

function fmix32(h: number): number {
  h ^= h >>> 16;
  h = Math.imul(h, 0x85ebca6b) >>> 0;
  h ^= h >>> 13;
  h = Math.imul(h, 0xc2b2ae35) >>> 0;
  h ^= h >>> 16;
  return h >>> 0;
}

export function displayOrder(segmentId: string, n: number): number[] {
  const key = (i: number) => fmix32(fnv1a32(`${segmentId}|${i}`));
  const idx = [...Array(n).keys()].sort((a, b) => key(a) - key(b) || a - b);
  if (n >= 2 && idx.every((v, i) => v === i)) idx.push(idx.shift()!);
  return idx;
}

// --- R-2 ---
export function initialDraft(segmentId: string, task: Task): Draft {
  switch (task.type) {
    case "sequence": {
      const steps = task.steps!;
      return { type: "sequence", order: displayOrder(segmentId, steps.length).map((i) => steps[i]) };
    }
    case "choice": return { type: "choice", option: null };
    case "drag_sort": return { type: "drag_sort", placement: task.items!.map(() => null) };
    case "spot_error": return { type: "spot_error", lines: [] };
    case "dialogue": return { type: "dialogue", replies: [] };
    case "time_budget": return { type: "time_budget", minutes: task.activities!.map(() => 0) };
  }
}

const inRange = (n: unknown, len: number): n is number => Number.isInteger(n) && (n as number) >= 0 && (n as number) < len;

export function remainingMinutes(task: Task, draft: Draft): number {
  const used = draft.type === "time_budget" ? draft.minutes.reduce((s, m) => s + m, 0) : 0;
  return task.budget_min! - used; // R-4
}

// --- R-3: action không hợp lệ → trả về draft cũ; hợp lệ → draft mới, không sửa draft cũ ---
export function update(task: Task, draft: Draft, action: Action): Draft {
  if (draft.type !== task.type) return draft;
  switch (draft.type) {
    case "sequence": {
      if (action.kind !== "move") return draft;
      const len = draft.order.length;
      if (!inRange(action.from, len) || !inRange(action.to, len)) return draft;
      const order = [...draft.order];
      const [moved] = order.splice(action.from, 1);
      order.splice(action.to, 0, moved);
      return { type: "sequence", order };
    }
    case "choice": {
      if (action.kind !== "pick" || !inRange(action.option, task.options!.length)) return draft;
      return { type: "choice", option: action.option };
    }
    case "drag_sort": {
      if (action.kind !== "place" || !inRange(action.item, draft.placement.length) || !task.buckets!.includes(action.bucket)) return draft;
      const placement = [...draft.placement];
      placement[action.item] = action.bucket;
      return { type: "drag_sort", placement };
    }
    case "spot_error": {
      if (action.kind !== "toggle" || !inRange(action.line, task.document!.length)) return draft;
      const has = draft.lines.includes(action.line);
      const lines = has ? draft.lines.filter((l) => l !== action.line) : [...draft.lines, action.line];
      return { type: "spot_error", lines: lines.sort((a, b) => a - b) };
    }
    case "dialogue": {
      const turns = task.turns!;
      if (action.kind !== "reply" || action.turn !== draft.replies.length || action.turn >= turns.length) return draft;
      if (!inRange(action.reply, turns[action.turn].replies.length)) return draft;
      return { type: "dialogue", replies: [...draft.replies, action.reply] };
    }
    case "time_budget": {
      if ((action.kind !== "add" && action.kind !== "sub") || !inRange(action.activity, draft.minutes.length)) return draft;
      const minutes = [...draft.minutes];
      if (action.kind === "add") {
        if (remainingMinutes(task, draft) < 30) return draft;
        minutes[action.activity] += 30;
      } else {
        if (minutes[action.activity] < 30) return draft;
        minutes[action.activity] -= 30;
      }
      return { type: "time_budget", minutes };
    }
  }
}

// --- R-5 ---
export function canSubmit(task: Task, draft: Draft): boolean {
  switch (draft.type) {
    case "choice": return draft.option !== null;
    case "drag_sort": return draft.placement.every((b) => b !== null);
    case "dialogue": return draft.replies.length === task.turns!.length;
    default: return true;
  }
}

// --- R-6 ---
export function toAnswer(_task: Task, draft: Draft): Answer {
  switch (draft.type) {
    case "sequence": return { type: "sequence", order: [...draft.order] };
    case "choice": return { type: "choice", option: draft.option as number };
    case "drag_sort": return { type: "drag_sort", placement: draft.placement as string[] };
    case "spot_error": return { type: "spot_error", lines: [...draft.lines] };
    case "dialogue": return { type: "dialogue", replies: [...draft.replies] };
    case "time_budget": return { type: "time_budget", minutes: [...draft.minutes] };
  }
}

// --- R-7 ---
export function formatDelta(delta: StatMap, stats: { id: string; label: string }[]): string[] {
  const out: string[] = [];
  for (const s of stats) {
    const d = delta[s.id];
    if (d === undefined || d === 0) continue;
    out.push(`${s.label} ${d > 0 ? "+" : "-"}${Math.abs(d)}`);
  }
  return out;
}
