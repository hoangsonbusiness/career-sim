// SPEC-014 — vòng chơi "xem và nghe kể": đi tới việc → xem cảnh → suy ngẫm → xong. Không chấm điểm.

export type StoryMode = "intro" | "walk" | "scene" | "reflection" | "done";

export interface StoryState {
  mode: StoryMode;
  index: number;
  total: number;
  question: number;
  questions: number;
  seen: number[];
}

export type StoryAction = "start" | "interact" | "continue";

export class StoryError extends Error {
  readonly code = "INVALID_STORY";
}

/** R-1 */
export function createStory(total: number, questions: number): StoryState {
  if (!Number.isInteger(total) || total < 1) throw new StoryError(`total không hợp lệ: ${total}`);
  if (!Number.isInteger(questions) || questions < 0) throw new StoryError(`questions không hợp lệ: ${questions}`);
  return { mode: "intro", index: 0, total, question: 0, questions, seen: [] };
}

/** R-3, bảng 3.4: thao tác không có trong bảng trả về chính `s`. */
export function reduce(s: StoryState, a: StoryAction): StoryState {
  if (s.mode === "intro" && a === "start") return { ...s, seen: [...s.seen], mode: "walk", index: 0 };
  if (s.mode === "walk" && a === "interact") {
    return { ...s, mode: "scene", seen: s.seen.includes(s.index) ? [...s.seen] : [...s.seen, s.index] };
  }
  if (s.mode === "scene" && a === "continue") {
    if (s.index < s.total - 1) return { ...s, seen: [...s.seen], mode: "walk", index: s.index + 1 };
    return { ...s, seen: [...s.seen], mode: s.questions > 0 ? "reflection" : "done", question: 0 };
  }
  if (s.mode === "reflection" && a === "continue") {
    if (s.question < s.questions - 1) return { ...s, seen: [...s.seen], question: s.question + 1 };
    return { ...s, seen: [...s.seen], mode: "done", question: 0 };
  }
  return s;
}
