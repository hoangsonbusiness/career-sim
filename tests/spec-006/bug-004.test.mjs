// BUG-004 — logic phím di chuyển (src/game/input.ts): giữ phím đi liên tục, đệm phím khi đang bước.
import { test } from "node:test";
import assert from "node:assert/strict";
import { MoveInput } from "../../src/game/input.ts";

test("BUG-004 AC-006-02 giữ phím thì luôn có hướng đi tiếp, nhả thì dừng", () => {
  const k = new MoveInput();
  k.press("right");
  assert.equal(k.next(), "right");
  assert.equal(k.next(), "right"); // vẫn giữ → bước tiếp ngay, không chờ sự kiện lặp phím
  k.release("right");
  assert.equal(k.next(), null);
});

test("BUG-004 AC-006-02 phím nhấn sau cùng được ưu tiên; nhả nó thì quay về phím còn giữ", () => {
  const k = new MoveInput();
  k.press("right");
  k.press("up");
  assert.equal(k.next(), "up");
  k.release("up");
  assert.equal(k.next(), "right");
});

test("BUG-004 AC-006-02 chạm nhanh trong lúc đang bước vẫn được áp dụng một lần", () => {
  const k = new MoveInput();
  k.press("left");
  k.release("left"); // nhả trước khi bước hiện tại xong
  assert.equal(k.next(), "left");
  assert.equal(k.next(), null);
});

test("BUG-004 AC-006-02 nhấn lại phím đang giữ (sự kiện lặp) không làm đổi thứ tự", () => {
  const k = new MoveInput();
  k.press("down");
  k.press("right");
  k.press("down"); // lặp phím của hệ điều hành cho phím cũ
  assert.equal(k.next(), "right");
});

test("BUG-004 AC-006-02 clear() xóa mọi phím (mất focus, mở bảng task)", () => {
  const k = new MoveInput();
  k.press("up");
  k.clear();
  assert.equal(k.next(), null);
});
