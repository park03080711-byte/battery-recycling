"use client";

import { useState } from "react";
import { LV_NAME, ticks, useWidth } from "../useWidth";
import type { Sample, SimEvent } from "./engine";

/* 모의실험 그래프 — 펌웨어가 본 ΔT와 실제 셀 ΔT, 판정 단계 띠, 히터 켜짐 띠 */
const LVC = ["var(--lv0)", "var(--lv1)", "var(--lv2)", "var(--lv3)"];
const C_FW = "#3b5bdb";
const C_TRUE = "#172033";

export function SimChart({ samples, duration, th, events, event = null }: { samples: Sample[]; duration: number; th: { c: number; w: number; d: number } | null; events: SimEvent[]; event?: { t: number; label: string } | null }) {
  const [ref, W] = useWidth<HTMLDivElement>(640);
  const [hover, setHover] = useState<number | null>(null);
  const narrow = W < 520;
  const H = narrow ? 250 : 290;
  const m = { l: 40, r: narrow ? 12 : 64, t: 26, b: 52 };
  const iw = W - m.l - m.r,
    ih = H - m.t - m.b;
  const vals = samples.flatMap((s) => [s.truth, s.dT ?? 0]);
  const yMin = Math.min(-1, Math.floor(Math.min(0, ...vals)));
  const yMax = Math.max(7, Math.ceil(Math.max(0, ...vals)));
  const x = (t: number) => m.l + (t / duration) * iw;
  const y = (v: number) => m.t + (1 - (v - yMin) / (yMax - yMin)) * ih;
  const line = (pick: (s: Sample) => number | null) => {
    let d = "";
    let pen = false;
    for (const s of samples) {
      const v = pick(s);
      if (v === null || Number.isNaN(v)) {
        pen = false;
        continue;
      }
      d += `${pen ? "L" : "M"}${x(s.t).toFixed(1)},${y(v).toFixed(1)}`;
      pen = true;
    }
    return d;
  };
  // 띠: 같은 값이 이어지는 구간
  const runs = <T,>(pick: (s: Sample) => T) => {
    const out: { a: number; b: number; v: T }[] = [];
    for (const s of samples) {
      const v = pick(s);
      const last = out[out.length - 1];
      if (last && last.v === v) last.b = s.t;
      else out.push({ a: last ? last.b : 0, b: s.t, v });
    }
    return out;
  };
  const lv = runs((s) => s.level);
  const heat = runs((s) => s.heat).filter((r) => r.v);
  const last = samples[samples.length - 1];
  const hasFw = samples.some((s) => s.dT !== null);
  const cuts = events.filter((e) => e.kind === "cut");
  const hs = hover === null ? null : samples[Math.min(samples.length - 1, Math.max(0, Math.round(hover / 0.5) - 1))];

  const onMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const t = ((e.clientX - r.left - m.l) / iw) * duration;
    if (!last || t < 0 || t > last.t) return setHover(null);
    setHover(t);
  };

  return (
    <div className="lab-chart">
      <div className="lab-legend static" aria-hidden="true">
        {hasFw && (
          <span>
            <i style={{ background: C_FW }} />
            펌웨어가 본 ΔT
          </span>
        )}
        <span>
          <i style={{ background: `repeating-linear-gradient(90deg, ${C_TRUE} 0 5px, transparent 5px 8px)` }} />
          실제 셀 <small>(센서가 모르는 값)</small>
        </span>
        <span>
          <i style={{ background: "#f59f00", height: 8 }} />
          히터 켜짐
        </span>
      </div>
      <div ref={ref} className="lab-plot">
        <svg width={W} height={H} role="img" aria-label="시간에 따른 ΔT 그래프. 위쪽 띠는 판정 단계, 아래쪽 띠는 히터가 켜진 구간." onPointerMove={onMove} onPointerLeave={() => setHover(null)}>
          {ticks(yMin, yMax, yMax - yMin > 8 ? 2 : 1).map((v) => (
            <g key={v}>
              <line x1={m.l} x2={m.l + iw} y1={y(v)} y2={y(v)} className="lab-grid" />
              <text x={m.l - 8} y={y(v) + 4} textAnchor="end" className="lab-tick">
                {v}
              </text>
            </g>
          ))}
          <line x1={m.l} x2={m.l + iw} y1={y(0)} y2={y(0)} stroke="#c3c8d2" />
          {ticks(0, duration, duration > 240 ? 60 : 30).map((t) => (
            <text key={t} x={x(t)} y={m.t + ih + 34} textAnchor="middle" className="lab-tick">
              {t}
            </text>
          ))}
          <text x={m.l + iw} y={m.t + ih + 48} textAnchor="end" className="lab-ax">
            시간 (초)
          </text>
          <text x={m.l - 32} y={m.t - 12} className="lab-ax">
            ΔT (°C)
          </text>
          {/* 단계 띠 */}
          {lv.map((r, i) => (
            <rect key={i} x={x(r.a)} y={m.t - 10} width={Math.max(0, x(r.b) - x(r.a))} height={6} fill={LVC[r.v]} rx={1} />
          ))}
          {/* 히터 띠 */}
          {heat.map((r, i) => (
            <rect key={i} x={x(r.a)} y={m.t + ih + 8} width={Math.max(1, x(r.b) - x(r.a))} height={8} rx={2} fill="#f59f00" opacity={0.85} />
          ))}
          {/* 기준선 */}
          {th &&
            [
              { v: th.c, lv: 1 },
              { v: th.w, lv: 2 },
              { v: th.d, lv: 3 },
            ].map((t) => (
              <g key={t.lv}>
                <line x1={m.l} x2={m.l + iw} y1={y(t.v)} y2={y(t.v)} stroke={LVC[t.lv]} strokeWidth={1.5} strokeDasharray="5 4" />
                {!narrow && (
                  <text x={m.l + iw + 6} y={y(t.v) + 4} className="lab-th">
                    {LV_NAME[t.lv]} {t.v}
                  </text>
                )}
              </g>
            ))}
          {event && (
            <g>
              <line x1={x(event.t)} x2={x(event.t)} y1={m.t - 2} y2={m.t + ih} stroke="#9c36b5" strokeWidth={1.5} strokeDasharray="3 3" />
              <text x={x(event.t) + 5} y={m.t + 12} className="lab-evt" fill="#7c2593">
                {event.label}
              </text>
            </g>
          )}
          <path d={line((s) => s.truth)} fill="none" stroke={C_TRUE} strokeWidth={2} strokeDasharray="6 4" strokeLinejoin="round" />
          {hasFw && <path d={line((s) => s.dT)} fill="none" stroke={C_FW} strokeWidth={2.2} strokeLinejoin="round" />}
          {cuts.map((c, i) => (
            <g key={i} transform={`translate(${x(c.t)} ${y(samples.find((s) => s.t >= c.t)?.truth ?? 0)})`}>
              <circle r={8} fill="var(--lv3)" stroke="#fff" strokeWidth={2} />
              <path d="M-3,-3 L3,3 M3,-3 L-3,3" stroke="#fff" strokeWidth={2} strokeLinecap="round" />
            </g>
          ))}
          {last && (
            <circle cx={x(last.t)} cy={y(last.dT ?? last.truth)} r={4.5} fill={last.dT !== null ? C_FW : C_TRUE} stroke="#fff" strokeWidth={2} />
          )}
          {hs && (
            <g>
              <line x1={x(hs.t)} x2={x(hs.t)} y1={m.t - 10} y2={m.t + ih + 16} className="lab-cross" />
              {hs.dT !== null && <circle cx={x(hs.t)} cy={y(hs.dT)} r={4} fill={C_FW} stroke="#fff" strokeWidth={2} />}
              <circle cx={x(hs.t)} cy={y(hs.truth)} r={4} fill={C_TRUE} stroke="#fff" strokeWidth={2} />
            </g>
          )}
        </svg>
        {hs && (
          <div className="lab-tip" style={{ left: Math.min(W - 180, Math.max(0, x(hs.t) + 12)), top: 8 }}>
            <b>{hs.t.toFixed(1)}초</b>
            {hs.dT !== null && (
              <span>
                <i style={{ background: C_FW }} />
                펌웨어 ΔT {hs.dT.toFixed(2)} °C
              </span>
            )}
            <span>
              <i style={{ background: C_TRUE }} />
              실제 셀 {hs.truth.toFixed(2)} °C
            </span>
            <span>
              <i style={{ background: LVC[hs.level], height: 8, width: 8, borderRadius: 4 }} />
              {LV_NAME[hs.level]} · 히터 {hs.heat ? "켜짐" : "꺼짐"}
            </span>
          </div>
        )}
      </div>
      <p className="sr-only">{last ? `${last.t.toFixed(0)}초 현재 단계 ${LV_NAME[last.level]}` : "아직 실행 전"}</p>
    </div>
  );
}
