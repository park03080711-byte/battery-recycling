"use client";

import { useMemo } from "react";
import { stage2 } from "@/data/lab/essData";
import { ticks, useWidth } from "../useWidth";
import { defaultCards, defaultParams, defaultPins } from "./catalog";
import { Sim, defaultPresent } from "./engine";

/* 이 모의실험은 얼마나 맞나 — 기본 환경을 LAB 01 판정 실험 2회차 실측과 겹쳐 본다 (히터를 켠 순간을 0초로) */
const C_REAL = "#0b9488";
const C_SIM = "#3b5bdb";
const T0 = stage2[0][0];
const REAL = stage2.map((r) => ({ t: r[0] - T0, dT: r[5], lv: r[9] }));
const REAL_EVT = [11.0, 27.1, 65.3];
const LBL = ["주의", "경고", "위험"];

export function useValidation() {
  return useMemo(() => {
    const s = new Sim({ env: "heat", present: defaultPresent(), pins: defaultPins(), cards: defaultCards(), params: defaultParams(), seed: 7 }).runAll();
    const h0 = s.env.heaterAt!;
    const sim = s.samples.filter((x) => x.dT !== null && x.t >= h0 - 0.01).map((x) => ({ t: x.t - h0, dT: x.dT as number }));
    const evt = [1, 2, 3].map((lv) => s.events.find((e) => e.kind === "level" && e.level === lv && !e.text.includes("내려감"))?.t ?? NaN).map((t) => t - h0);
    // 차단 전 구간(0~65초) 평균 오차
    const errs = REAL.filter((r) => r.t <= 65).map((r) => {
      const a = sim.findLast((x) => x.t <= r.t) ?? sim[0];
      return a.dT - r.dT;
    });
    const rmse = Math.sqrt(errs.reduce((a, e) => a + e * e, 0) / errs.length);
    return { sim, evt, rmse };
  }, []);
}

export function SimValidation() {
  const { sim, evt, rmse } = useValidation();
  const [ref, W] = useWidth<HTMLDivElement>(640);
  const H = W < 520 ? 230 : 260;
  const m = { l: 40, r: 16, t: 16, b: 40 };
  const iw = W - m.l - m.r,
    ih = H - m.t - m.b;
  const tMax = 75;
  const x = (t: number) => m.l + (t / tMax) * iw;
  const y = (v: number) => m.t + (1 - (v + 0.5) / 5.5) * ih;
  const path = (pts: { t: number; dT: number }[]) =>
    pts
      .filter((p) => p.t >= 0 && p.t <= tMax)
      .map((p, i) => `${i ? "L" : "M"}${x(p.t).toFixed(1)},${y(p.dT).toFixed(1)}`)
      .join("");
  return (
    <div className="sim-valid">
      <div className="lab-chart">
        <div className="lab-legend static" aria-hidden="true">
          <span>
            <i style={{ background: C_REAL }} />
            실측 (LAB 01 판정 2회차)
          </span>
          <span>
            <i style={{ background: C_SIM }} />
            모의실험 기본 환경
          </span>
        </div>
        <div ref={ref} className="lab-plot">
          <svg width={W} height={H} role="img" aria-label={`실측과 모의실험의 ΔT 곡선 비교. 차단 전 평균 오차 ${rmse.toFixed(2)}도.`}>
            {ticks(0, 5, 1).map((v) => (
              <g key={v}>
                <line x1={m.l} x2={m.l + iw} y1={y(v)} y2={y(v)} className="lab-grid" />
                <text x={m.l - 8} y={y(v) + 4} textAnchor="end" className="lab-tick">
                  {v}
                </text>
              </g>
            ))}
            {ticks(0, tMax, 15).map((t) => (
              <text key={t} x={x(t)} y={m.t + ih + 20} textAnchor="middle" className="lab-tick">
                {t}
              </text>
            ))}
            <text x={m.l + iw} y={m.t + ih + 36} textAnchor="end" className="lab-ax">
              히터 켠 뒤 (초)
            </text>
            <line x1={m.l} x2={m.l + iw} y1={y(4)} y2={y(4)} stroke="var(--lv3)" strokeWidth={1.5} strokeDasharray="5 4" />
            <text x={m.l + 6} y={y(4) - 6} className="lab-th">
              위험 4 °C
            </text>
            <path d={path(REAL)} fill="none" stroke={C_REAL} strokeWidth={2.4} strokeLinejoin="round" />
            <path d={path(sim)} fill="none" stroke={C_SIM} strokeWidth={2} strokeDasharray="1 0" strokeLinejoin="round" opacity={0.9} />
          </svg>
        </div>
      </div>
      <div className="rc-table-wrap">
        <table className="rc-table sim-vtable">
          <caption className="lab-tcap">표 1. 히터를 켠 뒤 단계가 오른 시각 (초)</caption>
          <thead>
            <tr>
              <th scope="col" />
              <th scope="col">주의</th>
              <th scope="col">경고</th>
              <th scope="col">위험 · 차단</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th scope="row">실측</th>
              {REAL_EVT.map((t, i) => (
                <td key={i}>{t.toFixed(1)}</td>
              ))}
            </tr>
            <tr>
              <th scope="row">모의실험</th>
              {evt.map((t, i) => (
                <td key={i}>{Number.isNaN(t) ? "—" : t.toFixed(1)}</td>
              ))}
            </tr>
          </tbody>
        </table>
        <p className="lab-small">
          차단 전(0~65초) 두 곡선의 평균 차이는 {rmse.toFixed(2)} °C, 단계가 오른 시각 차이는 {evt.map((t, i) => `${LBL[i]} ${t - REAL_EVT[i] >= 0 ? "+" : ""}${(t - REAL_EVT[i]).toFixed(1)}초`).join(" · ")}예요. 차단 직후 실측 ΔT가 급히
          떨어진 건 셀이 식어서가 아니라, 주변 센서(NTC)가 차단 3초 안에 1.7 °C 올랐기 때문이에요(원인은 아직 모름, LAB 01 7절). 모의실험은 이 현상을 넣지 않았어요.
        </p>
      </div>
    </div>
  );
}
