// SPEC-007 — hàm thuần cho bố cục và kéo thả của hoạt cảnh mini-game.

export interface Rect { x: number; y: number; w: number; h: number }

const clamp = (v: number, lo: number, hi: number) => (hi < lo ? lo : Math.min(hi, Math.max(lo, v)));

/** R-3: bong bóng phía trên điểm neo, căn giữa theo x, kẹp trong khung. */
export function bubbleRect(anchor: { x: number; y: number }, size: { w: number; h: number }, frame: { w: number; h: number }, margin: number): Rect {
  return {
    x: clamp(anchor.x - size.w / 2, margin, frame.w - size.w - margin),
    y: clamp(anchor.y - size.h - margin, margin, frame.h - size.h - margin),
    w: size.w,
    h: size.h,
  };
}

/** R-6: chỉ số chèn = số thẻ khác thẻ đang kéo có tâm y nhỏ hơn y thả. */
export function dropIndex(centersY: number[], dragged: number, dropY: number): number {
  return centersY.filter((c, i) => i !== dragged && c < dropY).length;
}

/** R-10: mỗi ô 30 phút, tô lần lượt theo activity 0, 1, …; phần còn lại là ô trống. */
export function timeSlots(minutes: number[], budgetMin: number): (number | null)[] {
  const slots: (number | null)[] = [];
  minutes.forEach((m, i) => { for (let k = 0; k < m / 30; k++) slots.push(i); });
  while (slots.length < budgetMin / 30) slots.push(null);
  return slots.slice(0, budgetMin / 30);
}

/** R-8: khay đầu tiên chứa điểm, biên trái/trên tính vào, biên phải/dưới không. */
export function hitBucket(point: { x: number; y: number }, buckets: Rect[]): number | null {
  const i = buckets.findIndex((b) => b.x <= point.x && point.x < b.x + b.w && b.y <= point.y && point.y < b.y + b.h);
  return i === -1 ? null : i;
}
