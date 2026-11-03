// BUG-004 — trạng thái phím di chuyển, tách khỏi Phaser để test được.
// Cuối mỗi bước, cảnh hỏi next(): còn giữ phím thì đi tiếp ngay (không chờ hệ điều hành lặp phím);
// phím chạm nhanh rồi nhả trong lúc đang bước vẫn được đi đúng một bước.
import type { Dir } from "./grid";

export class MoveInput {
  private held: Dir[] = [];       // thứ tự nhấn; phần tử cuối được ưu tiên
  private tapped: Dir | null = null;

  press(d: Dir): void {
    if (!this.held.includes(d)) this.held.push(d); // sự kiện lặp phím không đổi thứ tự
    this.tapped = d;
  }

  release(d: Dir): void {
    this.held = this.held.filter((x) => x !== d);
  }

  /** Hướng đi bước tiếp theo, hoặc null nếu không có phím nào. */
  next(): Dir | null {
    if (this.held.length > 0) {
      this.tapped = null;
      return this.held[this.held.length - 1];
    }
    const t = this.tapped;
    this.tapped = null;
    return t;
  }

  clear(): void {
    this.held = [];
    this.tapped = null;
  }
}
