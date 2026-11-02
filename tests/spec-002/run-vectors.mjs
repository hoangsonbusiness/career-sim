// Runner conformance vectors dùng chung (CLI + AC-002-16). Usage: node tests/spec-002/run-vectors.mjs <engine-module> tests/spec-002/vectors.json
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { isDeepStrictEqual } from "node:util";
import { pathToFileURL } from "node:url";

const [enginePath, vecPath] = process.argv.slice(2);
const { createEngine } = await import(pathToFileURL(resolve(enginePath)).href);
const spec = JSON.parse(readFileSync(vecPath, "utf8"));
const fixture = JSON.parse(readFileSync(resolve(dirname(vecPath), spec.fixture), "utf8"));

let fail = 0;
for (const v of spec.vectors) {
  const eng = createEngine(fixture);
  v.steps.forEach((s, i) => {
    const where = `${v.id} step ${i} (${s.op})`;
    let result, err;
    const before = eng.state();
    try { result = s.op === "submit" ? eng.submit(s.answer, { durationMs: s.durationMs }) : s.op === "state" ? undefined : eng[s.op](); }
    catch (e) { err = e; }
    if (s.expectError) {
      if (err?.code !== s.expectError) { fail++; console.error(`✗ ${where}: mong đợi lỗi ${s.expectError}, nhận ${err?.code ?? "không lỗi"}`); }
      else if (!isDeepStrictEqual(before, eng.state())) { fail++; console.error(`✗ ${where}: lỗi nhưng state bị đổi`); }
      return;
    }
    if (err) { fail++; console.error(`✗ ${where}: lỗi bất ngờ ${err.code ?? err.message}`); return; }
    const st = eng.state();
    for (const [k, want] of Object.entries(s.expect?.result ?? {}))
      if (!isDeepStrictEqual(result[k], want)) { fail++; console.error(`✗ ${where}: result.${k} = ${JSON.stringify(result[k])}, mong đợi ${JSON.stringify(want)}`); }
    for (const [k, want] of Object.entries(s.expect?.state ?? {})) {
      const got = k === "historyLength" ? st.history.length : k === "stats" ? Object.fromEntries(Object.keys(want).map((x) => [x, st.stats[x]])) : st[k];
      if (!isDeepStrictEqual(got, want)) { fail++; console.error(`✗ ${where}: state.${k} = ${JSON.stringify(got)}, mong đợi ${JSON.stringify(want)}`); }
    }
  });
  console.log(`${fail ? "…" : "✓"} ${v.id}`);
}
console.log(fail ? `✗ ${fail} kiểm tra thất bại` : "✓ Toàn bộ vectors đạt");
process.exit(fail ? 1 : 0);
