// SPEC-002 — engine mô phỏng "một ngày làm việc". Logic thuần: không render, không ngẫu nhiên, không Date.now().
// Chạy trực tiếp bằng type stripping của Node (ADR-001): chỉ dùng cú pháp TS xóa được.

export type StatMap = Record<string, number>;
export type Phase = "intro" | "segment" | "feedback" | "reflection" | "done";

export interface EngineState {
  professionId: string;
  phase: Phase;
  segmentIndex: number;
  stats: StatMap;
  history: SegmentResult[];
}

export interface SegmentResult {
  segmentId: string;
  success: boolean | null;
  rawDelta: StatMap;
  appliedDelta: StatMap;
  feedback: string[];
  durationMs: number;
  retries: number;
}

export type Answer =
  | { type: "sequence"; order: string[] }
  | { type: "choice"; option: number }
  | { type: "drag_sort"; placement: string[] }
  | { type: "spot_error"; lines: number[] }
  | { type: "dialogue"; replies: number[] }
  | { type: "time_budget"; minutes: number[] };

export interface DayEngine {
  state(): EngineState;
  start(): void;
  submit(answer: Answer, meta: { durationMs: number }): SegmentResult;
  retry(): void;
  next(): void;
  finish(): void;
}

export type EngineErrorCode = "NO_SIMULATION" | "UNKNOWN_TASK_TYPE" | "ILLEGAL_STATE" | "INVALID_ANSWER";

export class EngineError extends Error {
  code: EngineErrorCode;
  constructor(code: EngineErrorCode, message: string) {
    super(`${code}: ${message}`);
    this.name = "EngineError";
    this.code = code;
  }
}

// --- Dạng dữ liệu engine đọc từ file nghề (chỉ các trường cần dùng) ---
type Effect = StatMap;
interface Task {
  type: string;
  steps?: string[];
  options?: { effect: Effect; feedback: string }[];
  buckets?: string[];
  items?: { bucket: string }[];
  document?: string[];
  errors?: { line: number; explain: string }[];
  turns?: { replies: { effect?: Effect; feedback?: string }[] }[];
  budget_min?: number;
  activities?: { effect_per_30min: Effect }[];
  on_success?: Effect;
  on_fail?: Effect;
}
interface Segment { id: string; task: Task }
interface Simulation { stats: { id: string; initial: number }[]; segments: Segment[] }

const TASK_TYPES = ["sequence", "choice", "drag_sort", "spot_error", "dialogue", "time_budget"];

interface Graded { success: boolean | null; effects: Effect[]; feedback: string[] }

const isInt = (x: unknown): x is number => Number.isInteger(x);
const isIntArray = (x: unknown): x is number[] => Array.isArray(x) && x.every(isInt);
const isStrArray = (x: unknown): x is string[] => Array.isArray(x) && x.every((s) => typeof s === "string");
const inRange = (n: number, len: number) => n >= 0 && n < len;

function invalid(rule: string): never {
  throw new EngineError("INVALID_ANSWER", rule);
}

// R-12/R-14/R-15: on_success / on_fail; khóa không khai báo → không có effect nào được dùng.
function passFail(task: Task, success: boolean): Effect[] {
  const e = success ? task.on_success : task.on_fail;
  return e ? [e] : [];
}

/** R-4..R-10 rồi R-12..R-17. Ném INVALID_ANSWER trước khi tính bất cứ gì. */
function grade(task: Task, answer: Answer): Graded {
  if (!answer || answer.type !== task.type) invalid("R-4");
  switch (answer.type) {
    case "sequence": {
      const steps = task.steps!;
      const order = answer.order;
      if (!isStrArray(order) || order.length !== steps.length) invalid("R-5");
      const a = [...order].sort(), b = [...steps].sort();
      if (a.some((s, i) => s !== b[i])) invalid("R-5");
      const success = order.every((s, i) => s === steps[i]);
      return { success, effects: passFail(task, success), feedback: [] };
    }
    case "choice": {
      const options = task.options!;
      if (!isInt(answer.option) || !inRange(answer.option, options.length)) invalid("R-6");
      const o = options[answer.option];
      return { success: null, effects: [o.effect], feedback: [o.feedback] };
    }
    case "drag_sort": {
      const items = task.items!, buckets = task.buckets!;
      const p = answer.placement;
      if (!isStrArray(p) || p.length !== items.length || !p.every((x) => buckets.includes(x))) invalid("R-7");
      const success = p.every((x, i) => x === items[i].bucket);
      return { success, effects: passFail(task, success), feedback: [] };
    }
    case "spot_error": {
      const lines = answer.lines;
      if (!isIntArray(lines) || !lines.every((n) => inRange(n, task.document!.length)) || new Set(lines).size !== lines.length) invalid("R-8");
      const errors = task.errors!;
      const want = new Set(errors.map((e) => e.line));
      const success = lines.length === want.size && lines.every((n) => want.has(n));
      return { success, effects: passFail(task, success), feedback: errors.map((e) => e.explain) };
    }
    case "dialogue": {
      const turns = task.turns!;
      const r = answer.replies;
      if (!isIntArray(r) || r.length !== turns.length || !r.every((n, t) => inRange(n, turns[t].replies.length))) invalid("R-9");
      const chosen = r.map((n, t) => turns[t].replies[n]);
      return {
        success: null,
        effects: chosen.map((c) => c.effect ?? {}),
        feedback: chosen.filter((c) => c.feedback !== undefined).map((c) => c.feedback as string),
      };
    }
    case "time_budget": {
      const acts = task.activities!;
      const m = answer.minutes;
      if (!isIntArray(m) || m.length !== acts.length || !m.every((x) => x >= 0 && x % 30 === 0)) invalid("R-10");
      if (m.reduce((s, x) => s + x, 0) > task.budget_min!) invalid("R-10");
      // R-17: nhân effect theo số khối 30 phút; activity 0 phút không được dùng (R-18).
      const effects: Effect[] = [];
      m.forEach((x, i) => {
        if (x <= 0) return;
        const blocks = x / 30;
        const e: Effect = {};
        for (const [k, v] of Object.entries(acts[i].effect_per_30min)) e[k] = v * blocks;
        effects.push(e);
      });
      return { success: null, effects, feedback: [] };
    }
    default:
      return invalid("R-4");
  }
}

/** R-18: cộng theo khóa, chỉ giữ khóa xuất hiện trong effect được dùng. */
function sum(effects: Effect[]): StatMap {
  const out: StatMap = {};
  for (const e of effects) for (const [k, v] of Object.entries(e)) out[k] = (out[k] ?? 0) + v;
  return out;
}

const clamp = (n: number) => Math.min(100, Math.max(0, n));

export function createEngine(profession: { id: string; day_simulation?: unknown }): DayEngine {
  const sim = profession.day_simulation as Simulation | undefined;
  if (sim == null) throw new EngineError("NO_SIMULATION", `nghề ${profession.id} không có day_simulation`);
  for (const seg of sim.segments) {
    if (!TASK_TYPES.includes(seg.task?.type)) {
      throw new EngineError("UNKNOWN_TASK_TYPE", `segment ${seg.id}: task.type = ${String(seg.task?.type)}`);
    }
  }

  const s: EngineState = {
    professionId: profession.id,
    phase: "intro",
    segmentIndex: -1,
    stats: Object.fromEntries(sim.stats.map((x) => [x.id, x.initial])),
    history: [],
  };
  let snapshot: StatMap = {};
  let retries = 0;

  const illegal = (op: string): never => {
    throw new EngineError("ILLEGAL_STATE", `không thể ${op}() ở phase ${s.phase}`);
  };

  return {
    state: () => structuredClone(s),

    start() {
      if (s.phase !== "intro") illegal("start");
      s.phase = "segment";
      s.segmentIndex = 0;
      retries = 0;
    },

    submit(answer, meta) {
      if (s.phase !== "segment") illegal("submit"); // R-26: kiểm tra phase trước
      const seg = sim.segments[s.segmentIndex];
      const graded = grade(seg.task, answer);
      if (!meta || !isInt(meta.durationMs) || meta.durationMs < 0) invalid("R-11");

      // R-23: snapshot → áp dụng R-19/R-20 → ghi history → feedback
      snapshot = { ...s.stats };
      const rawDelta = sum(graded.effects);
      const appliedDelta: StatMap = {};
      for (const [k, d] of Object.entries(rawDelta)) {
        const old = s.stats[k];
        s.stats[k] = clamp(old + d);
        appliedDelta[k] = s.stats[k] - old;
      }
      const result: SegmentResult = {
        segmentId: seg.id,
        success: graded.success,
        rawDelta,
        appliedDelta,
        feedback: graded.feedback,
        durationMs: meta.durationMs,
        retries,
      };
      s.history.push(result);
      s.phase = "feedback";
      return structuredClone(result);
    },

    retry() {
      if (s.phase !== "feedback") illegal("retry");
      // R-24
      s.stats = snapshot;
      s.history.pop();
      retries += 1;
      s.phase = "segment";
    },

    next() {
      if (s.phase !== "feedback") illegal("next");
      if (s.segmentIndex === sim.segments.length - 1) {
        s.phase = "reflection";
      } else {
        s.segmentIndex += 1;
        s.phase = "segment";
        retries = 0; // R-25
      }
    },

    finish() {
      if (s.phase !== "reflection") illegal("finish");
      s.phase = "done";
    },
  };
}
