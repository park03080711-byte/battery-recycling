import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";
import { buildRun, explain, parseCsv, reach, riskParts, viewAt } from "../components/lab/control/engine";

/* 관제실 재생 엔진: comm_run1.csv에서 실험 기록과 같은 사건이 나오는지 (브라우저 없이) */
const run = buildRun(parseCsv(readFileSync("public/lab/comm_run1.csv", "utf8")));
const ev = (k: string, lv?: number) => run.events.find((e) => e.kind === k && (lv === undefined || e.lv === lv));

test.describe("관제실 엔진", () => {
  test.skip(({ browserName, isMobile }) => browserName !== "chromium" || !!isMobile, "한 번만");

  test("기록 수 · 중복 · 끊김", () => {
    expect(run.pkts.length).toBe(624);
    expect(run.total).toBe(616);
    expect(run.pkts.filter((p) => p.dup).length).toBe(8);
    expect(run.gap).not.toBeNull();
    expect(run.gap!.to - run.gap!.from).toBeGreaterThan(49);
    expect(run.gap!.to - run.gap!.from).toBeLessThan(52);
    expect(run.boot?.n).toBe(130);
  });

  test("사건 시각 (장치 시각, 초)", () => {
    expect(ev("heat-on")!.es).toBeCloseTo(302.6, 1);
    expect(ev("up", 1)!.es).toBeCloseTo(317.7, 1);
    expect(ev("up", 2)!.es).toBeCloseTo(358.0, 1);
    expect(ev("trip", 3)!.es).toBeCloseTo(425.4, 1);
    expect(ev("down", 2)!.es).toBeCloseTo(451.5, 1);
    expect(reach(run).map((r) => r.k)).toEqual(["주의", "경고", "위험 · 차단", "정상 복귀"]);
  });

  test("판정 사유는 펌웨어 규칙에서", () => {
    const at = (es: number) => run.bySeq.find((p) => Math.abs(p.es - es) < 0.2)!;
    expect(explain(run, at(317.7)).title).toContain("상승 속도");
    expect(explain(run, at(358.0)).title).toContain("경고 기준 3.0");
    expect(explain(run, at(425.4)).title).toContain("위험 기준 4.0");
  });

  test("위험지수 막대 합은 기록값과 ±1.5", () => {
    for (const p of run.bySeq) expect(Math.abs(riskParts(p).reduce((a, b) => a + b.v, 0) - p.risk)).toBeLessThanOrEqual(1.5);
  });

  test("끊긴 동안은 마지막 상태 · 다시 연결되면 밀린 기록", () => {
    const mid = viewAt(run, run.gap!.from + 20);
    expect(mid.cut).toBe(true);
    expect(mid.pending).toBeGreaterThan(15);
    const after = viewAt(run, run.gap!.to + 3);
    expect(after.cut).toBe(false);
    expect(after.seen.length - mid.seen.length).toBeGreaterThan(45);
    expect(viewAt(run, run.span).seen.length).toBe(616);
  });
});
