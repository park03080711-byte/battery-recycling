"use client";

/* 13 공급망 · 자원안보 — 그림
   1) ChainPicker: 공급망 다섯 칸, 한국의 강약 · 쏠림 (IEA · 오일환 외 · 김대현 외 · 김유정)
   2) RangeFig: 재활용이 채우는 몫 — 국내(김유정 2024) · 세계(Xu 외 2020), 범위 막대
   3) TargetPicker: 한국 · EU의 목표 */
import { useState } from "react";
import { Cite } from "../rc/Cite";
import { chain, targets } from "./data";

export function ChainPicker() {
  const [id, setId] = useState("refine");
  const c = chain.find((x) => x.id === id)!;
  return (
    <div className="sc-chain">
      <div className="sc-links" role="group" aria-label="공급망 단계 고르기">
        {chain.map((x, i) => (
          <div key={x.id} className="it">
            <button type="button" aria-pressed={id === x.id} onClick={() => setId(x.id)} className={`kr-${x.kr}`}>
              <span className="n">{i + 1}</span>
              <b>{x.t}</b>
              <span className="s">{x.sub}</span>
              <span className="kr">{x.krT}</span>
            </button>
          </div>
        ))}
      </div>
      <div className="lc-sum" aria-live="polite">
        <p>
          <b>{c.t}</b> — {c.krT}
        </p>
        <p className="d">
          {c.d} <Cite src={c.src} />
        </p>
      </div>
    </div>
  );
}

/** 범위 막대: lo~hi(%) 를 0~max 눈금 위에 */
export function RangeFig({
  rows,
  max,
  title,
  unit,
  tone,
}: {
  rows: { k: string; lo: number; hi: number }[];
  max: number;
  title: string;
  unit: string;
  tone: "kr" | "world";
}) {
  const x0 = 78;
  const W = 400;
  const sx = (v: number) => x0 + (v / max) * W;
  const ticks = Array.from({ length: Math.floor(max / 10) + 1 }, (_, i) => i * 10);
  const h = 36 + rows.length * 40 + 30;
  return (
    <svg viewBox={`0 0 560 ${h}`} className="sc-range" role="img" aria-label={`${title}. ${rows.map((r) => `${r.k} ${r.lo}~${r.hi}${unit}`).join(", ")}`}>
      {ticks.map((v) => (
        <g key={v}>
          <line x1={sx(v)} y1={26} x2={sx(v)} y2={h - 30} className="lc-grid" />
          <text x={sx(v)} y={h - 14} textAnchor="middle" className="lb">
            {v}
          </text>
        </g>
      ))}
      <text x={x0 + W} y={18} textAnchor="end" className="lb">
        {unit}
      </text>
      {rows.map((r, i) => {
        const y = 32 + i * 40;
        return (
          <g key={r.k}>
            <text x={x0 - 12} y={y + 15} textAnchor="end" className="lb strong">
              {r.k}
            </text>
            <rect x={x0} y={y + 5} width={W} height={10} rx={5} className="sc-track" />
            <rect x={sx(r.lo)} y={y} width={Math.max(6, sx(r.hi) - sx(r.lo))} height={20} rx={6} className={`sc-bar ${tone}`} />
            <text x={sx(r.hi) + 8} y={y + 15} className="lb strong">
              {r.lo}~{r.hi}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export function TargetPicker() {
  const [id, setId] = useState("kr");
  const t = targets.find((x) => x.id === id)!;
  return (
    <div className="sc-tg">
      <div className="lc-btns two" role="group" aria-label="목표를 볼 곳 고르기">
        {targets.map((x) => (
          <button key={x.id} type="button" aria-pressed={id === x.id} onClick={() => setId(x.id)}>
            <b>{x.t}</b>
            <span>{x.sub}</span>
          </button>
        ))}
      </div>
      <dl className="sc-rows" aria-live="polite">
        {t.rows.map((r) => (
          <div key={r.k}>
            <dt>{r.k}</dt>
            <dd>
              <b>{r.v}</b>
              {r.note && <span>{r.note}</span>}
            </dd>
          </div>
        ))}
      </dl>
      <p className="sc-tg-d">
        {t.d} <Cite src={t.src} />
      </p>
    </div>
  );
}
