"use client";

import { useWidth } from "../useWidth";
import { LV, RULE, mmss, type Run, type View } from "./engine";

const X_MAX = 620;
const Y_MIN = -1.5;
const Y_MAX = 5;

/* 온도차 그래프 — 가로축은 ESP32가 잰 시각, 받은 기록만 그린다.
   도면처럼: 20 s · 0.5 °C 격자, 기준선, 치수선, 늦게 받은 구간 표시 */
export function CrChart({ run, view }: { run: Run; view: View }) {
  const [ref, w] = useWidth<HTMLDivElement>(760);
  const narrow = w < 560;
  const W = w, H = narrow ? 300 : w > 700 ? 410 : 340;
  const L = 34, R = narrow ? 14 : 80, Tp = 24, B = 26;
  const x = (s: number) => L + (Math.min(X_MAX, Math.max(0, s)) / X_MAX) * (W - L - R);
  const y = (v: number) => Tp + ((Y_MAX - v) / (Y_MAX - Y_MIN)) * (H - Tp - B);
  const { seen, last, cut, esNow } = view;

  let d = "";
  for (let k = 0; k < seen.length; k++) {
    const p = seen[k];
    // 순번이 비었거나(아직 안 온 구간) 시각이 1.6초 넘게 벌어지면 선을 끊는다
    const brk = k === 0 || p.seq - seen[k - 1].seq > 1 || p.es - seen[k - 1].es > 1.6;
    d += `${brk ? "M" : "L"}${x(p.es).toFixed(1)} ${y(p.dT).toFixed(1)}`;
  }

  const grid: React.ReactNode[] = [];
  for (let s = 0; s <= X_MAX; s += 20) grid.push(<path key={`x${s}`} d={`M${x(s)} ${Tp}V${H - B}`} className={s % 100 === 0 ? "cr-g1" : "cr-g2"} />);
  for (let v = Y_MIN; v <= Y_MAX + 1e-9; v += 0.5) grid.push(<path key={`y${v}`} d={`M${L} ${y(v)}H${W - R}`} className={Number.isInteger(v) ? "cr-g1" : "cr-g2"} />);

  const xt = (narrow ? [0, 200, 400, 600] : [0, 100, 200, 300, 400, 500, 600]).map((s) => (
    <text key={s} x={x(s)} y={H - 8} textAnchor="middle" className="cr-ax">
      {mmss(s)}
    </text>
  ));
  const yt = [-1, 0, 1, 2, 3, 4, 5].map((v) => (
    <text key={v} x={L - 7} y={y(v) + 4} textAnchor="end" className="cr-ax">
      {v}
    </text>
  ));

  const thr = RULE.dt.map((v, i) => {
    const l = i + 1;
    return (
      <g key={v} className={`cr-thr l${l}`}>
        <path d={`M${L} ${y(v)}H${W - R}`} />
        {narrow ? (
          <text x={W - R - 2} y={y(v) - 5} textAnchor="end">
            {v.toFixed(1)} {LV[l]}
          </text>
        ) : (
          <text x={W - R + 8} y={y(v) + 4}>
            {v.toFixed(1)} {LV[l]}
          </text>
        )}
      </g>
    );
  });

  // 늦게 받은 구간 (받은 만큼만)
  const lateBands = run.late.map((b) => {
    const got = seen.filter((p) => p.es >= b.from && p.es <= b.to);
    if (!got.length) return null;
    const x1 = x(b.from), x2 = x(got[got.length - 1].es);
    const label = b.kind === "boot" ? "수신 프로그램 켜기 전 · 나중에 받음" : "Wi-Fi 끊김 · 나중에 받음";
    const short = b.kind === "boot" ? "나중에 받음" : "끊김 복구";
    return (
      <g key={b.kind} className="cr-late">
        <rect x={x1} y={Tp} width={Math.max(1, x2 - x1)} height={H - Tp - B} />
        <text x={x1 + 6} y={Tp + 13}>
          {narrow || x2 - x1 < 150 ? short : label}
        </text>
      </g>
    );
  });

  // 지금 끊긴 구간: 마지막 기록 → 장치의 지금
  const hatch =
    cut && last ? (
      <g className="cr-wait">
        <rect x={x(last.es)} y={Tp} width={Math.max(1, x(esNow) - x(last.es))} height={H - Tp - B} fill="url(#cr-hatch)" />
        <text x={(x(last.es) + x(esNow)) / 2} y={y(4.55)} textAnchor="middle">
          수신 대기
        </text>
      </g>
    ) : null;

  // 사건 세로선
  const { heatOn, trip } = run.marks;
  const evx = [heatOn && { ...heatOn, t: "히터 ON" }, trip && { ...trip, t: "차단" }]
    .filter((e): e is NonNullable<typeof e> => !!e && e.pc <= view.T)
    .map((e) => (
      <g key={e.t} className="cr-evx">
        <path d={`M${x(e.es)} ${Tp}V${H - B}`} />
        <text x={x(e.es) + 5} y={Tp - 8}>
          {e.t}
        </text>
      </g>
    ));

  // 히터를 켜는 순간 NTC 값이 잠깐 흔들린 자리 (측정 잡음)
  const dip = heatOn && heatOn.pc <= view.T && !narrow ? seen.filter((p) => p.es > heatOn.es - 4 && p.es < heatOn.es + 4).sort((a, b) => a.dT - b.dT)[0] : undefined;
  const dipNote = dip ? (
    <g className="cr-note">
      <path d={`M${x(dip.es) - 6} ${y(dip.dT)}H${x(dip.es) - 30}`} />
      <text x={x(dip.es) - 34} y={y(dip.dT) + 4} textAnchor="end">
        히터 켤 때 측정 흔들림
      </text>
    </g>
  ) : null;

  // 치수선: 히터 ON → 지금, 그리고 4 °C까지 남은 폭
  let dims: React.ReactNode = null;
  if (last && heatOn && last.heat && !cut && last.es > heatOn.es + 2) {
    const yy = y(-1.15), x1 = x(heatOn.es), x2 = x(last.es), mid = (x1 + x2) / 2;
    const label = `히터 ON +${Math.round(last.es - heatOn.es)} s`;
    dims = (
      <g className="cr-dim">
        <path d={`M${x1} ${yy}H${x2}M${x1} ${yy - 5}v10M${x2} ${yy - 5}v10`} />
        {x2 - x1 > 104 && (
          <>
            <rect x={mid - 50} y={yy - 9} width={100} height={18} className="cr-dim-bg" />
            <text x={mid} y={yy + 4} textAnchor="middle">
              {label}
            </text>
          </>
        )}
        {!narrow && last.dT < RULE.dt[2] && last.dT > 0 && (
          <g>
            <path d={`M${x2 + 6} ${y(last.dT)}H${x2 + 24}M${x2 + 6} ${y(4)}H${x2 + 24}`} className="cr-dim-ext" />
            <path d={`M${x2 + 18} ${y(4)}V${y(last.dT)}M${x2 + 14} ${y(4) + 6}l4 -6 4 6M${x2 + 14} ${y(last.dT) - 6}l4 6 4 -6`} />
            <text x={x2 + 28} y={(y(last.dT) + y(4)) / 2 - 2}>
              Δ {(4 - last.dT).toFixed(2)} °C
            </text>
            {last.eta > 0 && (
              <text x={x2 + 28} y={(y(last.dT) + y(4)) / 2 + 13} className="cr-dim-sub">
                ≈ {last.eta} s
              </text>
            )}
          </g>
        )}
      </g>
    );
  }

  const label = last
    ? `온도차 그래프. 받은 기록 ${seen.length}개, 마지막 장치 시각 ${mmss(last.es)}, 온도차 ${last.dT.toFixed(2)} 도, ${LV[last.lv]} 단계${cut ? ", 지금 수신 대기 중" : ""}.`
    : "온도차 그래프. 아직 받은 기록이 없습니다.";

  return (
    <div ref={ref} className="cr-chart-box">
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label}>
        <defs>
          <pattern id="cr-hatch" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="7" className="cr-hatch-line" />
          </pattern>
        </defs>
        {grid}
        {lateBands}
        {xt}
        {yt}
        {thr}
        {evx}
        {hatch}
        <path d={d} className="cr-line" />
        {dipNote}
        {last && <circle cx={x(last.es)} cy={y(last.dT)} r={4.5} className={`cr-now l${last.lv}`} />}
        {dims}
        <text x={L} y={Tp - 8} className="cr-ax">
          °C
        </text>
      </svg>
    </div>
  );
}
