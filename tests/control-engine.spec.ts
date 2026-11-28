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

/* LAB 02 가상 실험 → 관제실 */
import { cfgFromHash, hashOf, presetCfg, presetOf, simRows } from "../components/lab/control/fromSim";
import { PRESETS } from "../components/lab/control/presets";

test.describe("모의 실험 입력", () => {
  test.skip(({ browserName, isMobile }) => browserName !== "chromium" || !!isMobile, "한 번만");
  const sim = (id: string) => {
    const { rows, source, ext } = simRows(presetCfg(id));
    return buildRun(rows, source, ext);
  };

  test("모든 시나리오가 기록을 만든다", () => {
    for (const p of PRESETS) {
      const r = sim(p.id);
      expect(r.total, p.id).toBeGreaterThan(100);
      expect(r.source.kind).toBe("sim");
    }
  });

  test("기본 발열: 주의 · 경고 · 위험 · 차단 (실측 11 · 27 · 65초에 가까움)", () => {
    const steps = reach(sim("heat")).map((x) => [x.k, x.ev.es - x.from.es] as const);
    const at = Object.fromEntries(steps);
    expect(at["주의"]).toBeGreaterThan(8);
    expect(at["주의"]).toBeLessThan(20);
    expect(at["위험 · 차단"]).toBeGreaterThan(55);
    expect(at["위험 · 차단"]).toBeLessThan(75);
  });

  test("Wi-Fi 끊김: 버퍼 600개면 잃지 않고, 10개면 사라지고, 끄면 더 사라진다", () => {
    const full = sim("wifi"), small = sim("wifi-small"), none = sim("wifi-nobuf");
    expect(full.gap).not.toBeNull();
    expect(full.lost).toBe(0);
    expect(small.lost).toBeGreaterThan(0);
    expect(none.lost).toBeGreaterThan(small.lost);
    // 차단 기록이 사라진 경우: 앞 기록이 빠졌다고 표시
    expect(small.marks.trip?.gapBefore ?? 0).toBeGreaterThan(0);
    expect(viewAt(small, small.span).missing).toBe(small.lost);
  });

  test("센서 선 빠짐: 고장 사건 · 히터 끊음", () => {
    const r = sim("cut");
    expect(r.marks.fault).toBeDefined();
    const p = r.bySeq.find((q) => q.fault)!;
    expect(p.heat).toBe(false);
    expect(explain(r, p).title).toContain("센서 고장");
  });

  test("주소 ↔ 설정이 왕복한다", () => {
    for (const p of PRESETS) {
      const cfg = presetCfg(p.id);
      expect(presetOf(cfgFromHash(hashOf(cfg))!)).toBe(p.id);
    }
    expect(hashOf(presetCfg("heat"))).toBe("#sim");
  });

  test("현장 센서 시나리오: 센서 값과 가상 장치의 사유가 넘어온다", () => {
    const leak = sim("leak");
    expect(leak.source.sensors).toEqual(["sonar"]);
    expect(Math.max(...leak.bySeq.map((p) => p.site?.floor ?? 0))).toBeGreaterThan(3);
    const up = leak.events.find((e) => e.kind === "up" || e.kind === "trip");
    expect(up?.detail ?? "").not.toBe("");
    const door = sim("door");
    expect(door.bySeq.some((p) => p.site?.door)).toBe(true);
    expect(sim("condense").bySeq.some((p) => (p.site?.rh ?? 0) > 60)).toBe(true);
    expect(Math.max(...sim("shock").bySeq.map((p) => p.site?.tilt ?? 0))).toBeGreaterThan(20);
  });
});
