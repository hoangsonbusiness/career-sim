// BUG-004 — khung cho bước red.
export class MoveInput {
  press(_d: unknown): void { throw new Error("NOT_IMPLEMENTED"); }
  release(_d: unknown): void { throw new Error("NOT_IMPLEMENTED"); }
  next(): never { throw new Error("NOT_IMPLEMENTED"); }
  clear(): void { throw new Error("NOT_IMPLEMENTED"); }
}
