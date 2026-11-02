// SPEC-004 — HTML trang hồ sơ trong bản build. Dùng chung một lần `npm run build`.
import { test, before } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { buildProfileView } from "../../src/profile/view.ts";
import { getProfession } from "../../src/content/index.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");
let build;
let page;
let view;

before(() => {
  build = spawnSync("npm run build", { cwd: root, encoding: "utf8", shell: true });
  if (build.status === 0) page = readFileSync(join(root, "out/nghe/giao-vien-thpt/index.html"), "utf8");
  view = buildProfileView(getProfession("giao-vien-thpt"));
});

function assertBuilt() {
  assert.equal(build.status, 0, (build.stdout + build.stderr).slice(-3000));
}

const decode = (s) => s.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#x27;|&#39;/g, "'");
const text = (s) => decode(s.replace(/<!--.*?-->/g, "").replace(/<[^>]*>/g, "")).trim();
const allItems = (v) => [...v.sections.flatMap((s) => s.groups.flatMap((g) => g.items)), ...v.ladder.flatMap((l) => l.items)];

test("AC-004-09 nhãn bản nháp, một h1, thứ tự h2", () => {
  assertBuilt();
  const banner = page.match(/<[^>]*data-testid="draft-banner"[^>]*>([\s\S]*?)<\/[a-z]+>/);
  assert.ok(banner, "thiếu draft-banner");
  assert.match(text(banner[1]), /Bản nháp — đang kiểm chứng/);
  assert.ok(banner.index < page.indexOf("<h1"), "draft-banner phải đứng trên h1");
  assert.equal([...page.matchAll(/<h1[\s>]/g)].length, 1);
  const h2 = [...page.matchAll(/<h2[^>]*>([\s\S]*?)<\/h2>/g)].map((m) => text(m[1]));
  assert.deepEqual(h2, [...view.sections.map((s) => s.heading), "Lộ trình thăng tiến", "Nguồn tham khảo"]);
});

test("AC-004-10 mỗi trích dẫn là một details có đúng một link mở tab mới", () => {
  assertBuilt();
  const details = [...page.matchAll(/<details[^>]*data-source="([^"]+)"[^>]*>([\s\S]*?)<\/details>/g)];
  const cites = allItems(view).flatMap((i) => i.citations);
  assert.equal(details.length, cites.length);
  details.forEach((d, k) => {
    assert.equal(d[1], cites[k].id);
    const links = [...d[2].matchAll(/<a\s[^>]*>/g)].map((m) => m[0]);
    assert.equal(links.length, 1, `details ${k}`);
    assert.match(links[0], /target="_blank"/);
    assert.match(links[0], /rel="noopener noreferrer"/);
    assert.ok(links[0].includes(`href="${cites[k].url.replace(/&/g, "&amp;")}"`), links[0]);
  });
});

test("AC-004-11 số cảnh báo bằng số item cần kiểm chứng", () => {
  assertBuilt();
  const n = [...page.matchAll(/data-testid="warning"/g)].length;
  assert.equal(n, allItems(view).filter((i) => i.warning).length);
});

test("AC-004-12 có đúng một link chơi thử", () => {
  assertBuilt();
  const links = [...page.matchAll(/<a([^>]*data-testid="play-link"[^>]*)>([\s\S]*?)<\/a>/g)];
  assert.equal(links.length, 1);
  assert.match(links[0][1], /href="\/nghe\/giao-vien-thpt\/mot-ngay\/"/);
  assert.equal(text(links[0][2]), "Chơi thử một ngày làm nghề");
});

test("AC-004-13 trang hồ sơ không thêm script riêng", () => {
  assertBuilt();
  const scripts = (html) => [...html.matchAll(/<script[^>]*\ssrc="([^"]+)"/g)].length;
  assert.equal(scripts(page), scripts(readFileSync(join(root, "out/index.html"), "utf8")));
});
