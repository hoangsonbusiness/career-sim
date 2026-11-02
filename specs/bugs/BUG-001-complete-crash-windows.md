---
id: BUG-001
spec: none          # scripts/spec.mjs (bộ công cụ SDD) chưa thuộc spec nào
ac: "MỚI: chưa có AC — công cụ SDD chưa có spec (xem Ghi chú)"
status: fixed
reported: 2026-11-02
---

# BUG-001 — `npm run complete` crash trên Windows

## Tái hiện
1. Trên Windows, có một spec `approved`, mọi AC có test và test xanh.
2. Chạy `npm run complete SPEC-002`.

## Mong đợi / Thực tế
- Mong đợi: spec chuyển sang `implemented`, test được khóa.
- Thực tế: `TypeError: (t.stdout + t.stderr).split is not a function` tại `scripts/spec.mjs`; spec không đổi.

## Test tái hiện
`tests/tooling/bug-001.test.mjs`: chép repo sang thư mục tạm, chạy `complete SPEC-002` trên bản chép, kiểm tra exit 0 và `status: implemented`.

## Nguyên nhân & cách sửa
`spawnSync("npm", …)` không có `shell`. Trên Windows `npm` là `npm.cmd`, không chạy được nếu không qua shell → `spawnSync` trả `error`, `stdout`/`stderr` = `null`, và `null + null` là số. Sửa: chạy `npm test` qua shell (đối số là hằng số, không có dữ liệu người dùng), và báo lỗi rõ ràng nếu tiến trình không khởi động được.

## Ghi chú
`scripts/spec.mjs`, `scripts/trace.mjs`, `scripts/scope.mjs`, `scripts/lib/*` chưa có spec sở hữu. Nên viết một SPEC cho bộ công cụ SDD để các lỗi sau có AC để bám.
