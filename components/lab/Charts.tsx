"use client";

import { useMemo, useState, type PointerEvent } from "react";
import { comm, heatRuns } from "@/data/lab/essData";
import { ticks, useWidth } from "./useWidth";

/* 회차 색 — 상태색(초록·노랑·주황·빨강)과 겹치지 않는 범주색 3개. 대비 · 색각 이상 분리 검증 통과 */
const RUN_COLOR = ["#3b5bdb", "#0b9488", "#9c36b5"];
const RUN_META = [
  { start: 21.62, note: "251초 이후 디지털 센서 신호 끊김" },
  { start: 23.62, note: "센서 접촉이 약했던 것으로 추정" },
  { start: 23.75, note: "" },
];
const TH = [
  { v: 2, name: "주의", c: "var(--lv1)" },
  { v: 3, name: "경고", c: "var(--lv2)" },
  { v: 4, name: "위험", c: "var(--lv3)" },
];

function linePath(pts: [number, number | null][], X: (v: number) => number, Y: (v: number) => number) {
  let d = "";
  let pen = false;
  for (const [x, y] of pts) {
    if (y === null) {
      pen = false;
      continue;
    }
    d += `${pen ? "L" : "M"}${X(x).toFixed(1)},${Y(y).toFixed(1)}`;
    pen = true;
  }
  return d;
}

/* ── 그림: 발열 3회 — 시작 대비 온도 상승 ── */
export function HeatChart() {
  const [ref, w] = useWidth<HTMLDivElement>();
  const [on, setOn] = useState([true, true, true]);
  const [hx, setHx] = useState<number | null>(null);
  const narrow = w < 560;
  const H = narrow ? 300 : 360;
  const m = { l: 40, r: narrow ? 44 : 56, t: 28, b: 40 };
  const pw = w - m.l - m.r;
  const ph = H - m.t - m.b;
  const X = (t: number) => m.l + (t / 300) * pw;
  const Y = (v: number) => m.t + ph - ((v + 0.5) / 7.5) * ph;

  const paths = useMemo(() => heatRuns.map((r) => linePath(r.map((p) => [p[0], p[1]]), X, Y)), [w]); // eslint-disable-line react-hooks/exhaustive-deps

  // 오른쪽 끝 직접 표시 — 마지막 유효값 높이, 서로 16px 이상 떨어지게
  const ends = useMemo(() => {
    const raw = heatRuns.map((r, i) => {
      const v = r.filter((p) => p[1] !== null);
      const last = v[v.length - 1];
      return { i, t: last[0], v: last[1] as number, y: Y(last[1] as number) };
    });
    const sorted = [...raw].sort((a, b) => a.y - b.y);
    for (let k = 1; k < sorted.length; k++) if (sorted[k].y - sorted[k - 1].y < 16) sorted[k].y = sorted[k - 1].y + 16;
    return raw;
  }, [w]); // eslint-disable-line react-hooks/exhaustive-deps

  const t = hx === null ? null : Math.max(0, Math.min(299, Math.round(((hx - m.l) / pw) * 300)));
  const at = (i: number) => (t === null ? null : heatRuns[i].find((p) => p[0] === t) ?? null);

  const move = (e: PointerEvent<SVGRectElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    setHx(e.clientX - r.left + m.l);
  };

  return (
    <div className="lab-chart">
      <div className="lab-legend" role="group" aria-label="회차 보이기 · 숨기기">
        {heatRuns.map((_, i) => (
          <button key={i} type="button" aria-pressed={on[i]} onClick={() => setOn((o) => o.map((x, k) => (k === i ? !x : x)))}>
            <i style={{ background: RUN_COLOR[i] }} aria-hidden="true" />
            {i + 1}회 <small>시작 {RUN_META[i].start.toFixed(1)} °C</small>
          </button>
        ))}
        <span className="lab-thkey" aria-hidden="true">
          {TH.map((h) => (
            <span key={h.v}>
              <i style={{ borderColor: h.c }} />
              {h.name} {h.v}
            </span>
          ))}
        </span>
      </div>
      <div ref={ref} className="lab-plot">
        <svg width={w} height={H} role="img" aria-label="발열 3회의 온도 상승 곡선. 180초 동안 히터를 켜고 120초 식혔다. 180초 때 상승량은 1회 6.38, 2회 4.00, 3회 5.37 °C.">
          {/* 히터 켠 구간 */}
          <rect x={X(0)} y={m.t} width={X(180) - X(0)} height={ph} fill="var(--lab-heat)" />
          <text x={X(4)} y={m.t - 10} className="lab-ax-note">
            히터 켬 0 ~ 180 s
          </text>
          <text x={X(184)} y={m.t - 10} className="lab-ax-note">
            끄고 식힘
          </text>
          {/* 격자 · 축 */}
          {ticks(0, 7, 1).map((v) => (
            <g key={v}>
              <line x1={m.l} x2={m.l + pw} y1={Y(v)} y2={Y(v)} className="lab-grid" />
              <text x={m.l - 8} y={Y(v) + 4} textAnchor="end" className="lab-tick">
                {v}
              </text>
            </g>
          ))}
          {ticks(0, 300, narrow ? 100 : 60).map((s) => (
            <text key={s} x={X(s)} y={m.t + ph + 18} textAnchor="middle" className="lab-tick">
              {s}
            </text>
          ))}
          <text x={m.l + pw} y={H - 4} textAnchor="end" className="lab-ax">
            시간 (s)
          </text>
          <text x={m.l - 32} y={m.t - 10} className="lab-ax">
            °C ↑
          </text>
          {/* 판정 기준선 */}
          {TH.map((h) => (
            <g key={h.v}>
              <line x1={m.l} x2={m.l + pw} y1={Y(h.v)} y2={Y(h.v)} stroke={h.c} strokeWidth={1.5} strokeDasharray="5 4" />
              {!narrow && (
                <text x={X(2)} y={Y(h.v) - 5} className="lab-th">
                  {h.name} {h.v}
                </text>
              )}
            </g>
          ))}
          {/* 곡선 */}
          {paths.map((d, i) =>
            on[i] ? <path key={i} d={d} fill="none" stroke={RUN_COLOR[i]} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" /> : null
          )}
          {ends.map((e) =>
            on[e.i] ? (
              <g key={e.i}>
                <circle cx={X(e.t)} cy={Y(e.v)} r={4} fill={RUN_COLOR[e.i]} stroke="#fff" strokeWidth={2} />
                <text x={m.l + pw + 8} y={e.y + 4} className="lab-endlbl">
                  {e.i + 1}회
                </text>
              </g>
            ) : null
          )}
          {/* 십자선 */}
          {t !== null && (
            <g pointerEvents="none">
              <line x1={X(t)} x2={X(t)} y1={m.t} y2={m.t + ph} className="lab-cross" />
              {heatRuns.map((_, i) => {
                const p = at(i);
                return on[i] && p && p[1] !== null ? <circle key={i} cx={X(t)} cy={Y(p[1])} r={5} fill={RUN_COLOR[i]} stroke="#fff" strokeWidth={2} /> : null;
              })}
            </g>
          )}
          <rect x={m.l} y={m.t} width={pw} height={ph} fill="transparent" onPointerMove={move} onPointerDown={move} onPointerLeave={() => setHx(null)} />
        </svg>
        {t !== null && (
          <div className="lab-tip" style={{ left: Math.min(X(t) + 12, w - 168), top: m.t + 8 }}>
            <b>
              {t} s · {t < 180 ? "가열 중" : "식히는 중"}
            </b>
            {heatRuns.map((_, i) => {
              const p = at(i);
              if (!on[i]) return null;
              return (
                <span key={i}>
                  <i style={{ background: RUN_COLOR[i] }} />
                  {i + 1}회 {p && p[1] !== null ? `+${p[1].toFixed(2)} °C` : "신호 없음"}
                  {p && p[3] > 0 ? ` · ${p[3].toFixed(1)} mA` : ""}
                </span>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── 그림: 통신 — 순번별 전달 지연 ── */
const BUF = "#9c36b5";
const OK = "#3b5bdb";
export function CommChart() {
  const [ref, w] = useWidth<HTMLDivElement>();
  const [hi, setHi] = useState<number | null>(null);
  const narrow = w < 560;
  const H = narrow ? 260 : 300;
  const m = { l: 44, r: 16, t: 24, b: 40 };
  const pw = w - m.l - m.r;
  const ph = H - m.t - m.b;
  const X = (s: number) => m.l + (s / 615) * pw;
  const Y = (d: number) => m.t + ph - (d / 140) * ph;
  const c = hi === null ? null : comm[hi];

  const move = (e: PointerEvent<SVGRectElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const s = Math.round(((e.clientX - r.left) / pw) * 615);
    setHi(Math.max(0, Math.min(615, s)));
  };

  return (
    <div className="lab-chart">
      <div className="lab-legend static" aria-hidden="true">
        <span>
          <i className="dot" style={{ background: OK }} />
          바로 전달 (2초 이내)
        </span>
        <span>
          <i className="dot" style={{ background: BUF }} />
          버퍼에 담았다가 전달
        </span>
      </div>
      <div ref={ref} className="lab-plot">
        <svg width={w} height={H} role="img" aria-label="순번 0~615 패킷의 전달 지연. 대부분 0초 근처이고, 연결 전 0~130번과 끊김 중 501~550번은 버퍼에 쌓였다가 연결 후 몰아서 전달됐다.">
          {ticks(0, 140, 20).map((v) => (
            <g key={v}>
              <line x1={m.l} x2={m.l + pw} y1={Y(v)} y2={Y(v)} className="lab-grid" />
              <text x={m.l - 8} y={Y(v) + 4} textAnchor="end" className="lab-tick">
                {v}
              </text>
            </g>
          ))}
          {ticks(0, 600, narrow ? 200 : 100).map((s) => (
            <text key={s} x={X(s)} y={m.t + ph + 18} textAnchor="middle" className="lab-tick">
              {s}
            </text>
          ))}
          <text x={m.l + pw} y={H - 4} textAnchor="end" className="lab-ax">
            패킷 순번
          </text>
          <text x={m.l - 36} y={m.t - 10} className="lab-ax">
            지연 s ↑
          </text>
          {comm.map((p) => (
            <circle key={p[0]} cx={X(p[0])} cy={Y(p[1])} r={2.6} fill={p[1] > 2 ? BUF : OK} />
          ))}
          {/* 사건 번호 */}
          <g className="lab-badge">
            <circle cx={X(65)} cy={Y(96)} r={11} />
            <text x={X(65)} y={Y(96) + 4} textAnchor="middle">
              1
            </text>
            <circle cx={X(526)} cy={Y(72)} r={11} />
            <text x={X(526)} y={Y(72) + 4} textAnchor="middle">
              2
            </text>
          </g>
          {c && (
            <g pointerEvents="none">
              <line x1={X(c[0])} x2={X(c[0])} y1={m.t} y2={m.t + ph} className="lab-cross" />
              <circle cx={X(c[0])} cy={Y(c[1])} r={6} fill={c[1] > 2 ? BUF : OK} stroke="#fff" strokeWidth={2} />
            </g>
          )}
          <rect x={m.l} y={m.t} width={pw} height={ph} fill="transparent" onPointerMove={move} onPointerDown={move} onPointerLeave={() => setHi(null)} />
        </svg>
        {c && (
          <div className="lab-tip" style={{ left: Math.min(X(c[0]) + 12, w - 176), top: m.t + 8 }}>
            <b>순번 {c[0]}</b>
            <span>전달 지연 {c[1] < 0.1 ? "0.1 s 미만" : `${c[1].toFixed(1)} s`}</span>
            <span>
              전송 {c[3]}번{c[3] > 1 ? " (재전송)" : ""} · 왕복 {c[4] > 0 ? `${c[4]} ms` : "—"}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── 그림: 정상 구간 왕복 지연 분포 ── */
export function RttBars() {
  const rtt = comm.filter((c) => c[1] <= 2 && c[4] > 0).map((c) => c[4]);
  const bins = [
    { lo: 0, hi: 10, label: "0–9" },
    { lo: 10, hi: 20, label: "10–19" },
    { lo: 20, hi: 30, label: "20–29" },
    { lo: 30, hi: 40, label: "30–39" },
    { lo: 40, hi: 60, label: "40–59" },
    { lo: 60, hi: 1e9, label: "60+" },
  ].map((b) => ({ ...b, n: rtt.filter((v) => v >= b.lo && v < b.hi).length }));
  const max = Math.max(...bins.map((b) => b.n));
  return (
    <div className="lab-bars" role="img" aria-label={`정상 구간 ${rtt.length}개 패킷의 왕복 지연 분포: ${bins.map((b) => `${b.label} ms ${b.n}개`).join(", ")}`}>
      {bins.map((b) => (
        <div key={b.label} className="lab-bar">
          <span className="n">{b.n}</span>
          <span className="b" style={{ height: `${Math.max(2, (b.n / max) * 100)}%` }} />
          <span className="l">{b.label}</span>
        </div>
      ))}
    </div>
  );
}
