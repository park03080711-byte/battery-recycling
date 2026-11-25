"use client";

/* 14 분해를 고려한 설계 — 그림
   1) JoinPicker: 체결 방식 넷과 되돌리기 쉬운 정도 (Lander 2023 작업 시간 가정 · Scott 2023 · Thompson 2020)
   2) PackFig: 실제 팩 여섯을 사람이 뜯는 비용, 모듈까지 / 셀까지 (Lander 2023)
   3) AutoFig: 사람 · 반자동 · 완전 자동으로 한 해에 뜯는 팩 (Lander 2023) */
import { useState } from "react";
import { Cite } from "../rc/Cite";
import { auto, joins, packs } from "./data";

export function JoinPicker() {
  const [id, setId] = useState("glue");
  const j = joins.find((x) => x.id === id)!;
  return (
    <div className="df-join">
      <div className="sc-links df-links" role="group" aria-label="체결 방식 고르기">
        {joins.map((x, i) => (
          <div key={x.id} className="it">
            <button type="button" aria-pressed={id === x.id} onClick={() => setId(x.id)} className={`ez-${x.ease}`}>
              <span className="n">{i + 1}</span>
              <b>{x.t}</b>
              <span className="s">{x.sub}</span>
              <span className="kr">{x.easeT}</span>
            </button>
          </div>
        ))}
      </div>
      <div className="lc-sum" aria-live="polite">
        <p>
          <b>{j.t}</b> — {j.time}
        </p>
        <p className="d">
          {j.d} <Cite src={j.src} />
        </p>
      </div>
    </div>
  );
}

export function PackFig() {
  const [lv, setLv] = useState<"cell" | "mod">("cell");
  const max = lv === "cell" ? 200 : 40;
  const step = lv === "cell" ? 50 : 10;
  const x0 = 116;
  const W = 330;
  const sx = (v: number) => x0 + (v / max) * W;
  const rows = [...packs].sort((a, b) => (lv === "cell" ? (b.cell ?? -1) - (a.cell ?? -1) : b.mod - a.mod));
  const h = 30 + rows.length * 44 + 28;
  const ticks = Array.from({ length: max / step + 1 }, (_, i) => i * step);
  const label = rows.map((r) => `${r.t} ${lv === "cell" ? (r.cell === null ? "계산 안 함" : `${r.cell}달러`) : `${r.mod}달러`}`).join(", ");
  return (
    <div className="df-pack">
      <div className="lc-btns two" role="group" aria-label="어디까지 뜯는 비용인지 고르기">
        <button type="button" aria-pressed={lv === "cell"} onClick={() => setLv("cell")}>
          <b>셀까지</b>
          <span>팩 → 모듈 → 셀 전부</span>
        </button>
        <button type="button" aria-pressed={lv === "mod"} onClick={() => setLv("mod")}>
          <b>모듈까지</b>
          <span>팩 → 모듈만</span>
        </button>
      </div>
      <svg viewBox={`0 0 560 ${h}`} className="df-bars" role="img" aria-label={`팩을 사람이 ${lv === "cell" ? "셀까지" : "모듈까지"} 뜯는 비용(달러). ${label}`}>
        {ticks.map((v) => (
          <g key={v}>
            <line x1={sx(v)} y1={22} x2={sx(v)} y2={h - 28} className="lc-grid" />
            <text x={sx(v)} y={h - 10} textAnchor="middle" className="lb">
              {v}
            </text>
          </g>
        ))}
        <text x={x0 + W} y={14} textAnchor="end" className="lb">
          달러
        </text>
        {rows.map((r, i) => {
          const y = 28 + i * 44;
          const v = lv === "cell" ? r.cell : r.mod;
          return (
            <g key={r.id}>
              <text x={x0 - 12} y={y + 13} textAnchor="end" className="lb strong">
                {r.t}
              </text>
              <text x={x0 - 12} y={y + 29} textAnchor="end" className="lb">
                {r.kwh} kWh
              </text>
              {v === null ? (
                <text x={x0 + 6} y={y + 19} className="lb na">
                  {r.note}
                </text>
              ) : (
                <>
                  <rect x={x0} y={y + 4} width={Math.max(4, sx(v) - x0)} height={20} rx={5} className={`df-bar ${r.cell === null ? "na" : r.cell > 100 ? "hard" : "easy"}`} />
                  <text x={sx(v) + 8} y={y + 19} className="lb strong">
                    {v.toFixed(2)}
                  </text>
                </>
              )}
            </g>
          );
        })}
      </svg>
      <ul className="df-notes" aria-label="팩별 구조">
        {packs.map((p) => (
          <li key={p.id}>
            <b>{p.t}</b> {p.note}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function AutoFig() {
  const max = 14000;
  const x0 = 96;
  const W = 340;
  const sx = (v: number) => x0 + (v / max) * W;
  const h = 26 + auto.length * 46 + 26;
  return (
    <svg viewBox={`0 0 560 ${h}`} className="df-bars" role="img" aria-label={`한 해에 뜯을 수 있는 팩. ${auto.map((a) => `${a.k} ${a.v.toLocaleString("ko-KR")}개`).join(", ")}`}>
      {[0, 3500, 7000, 10500, 14000].map((v) => (
        <g key={v}>
          <line x1={sx(v)} y1={18} x2={sx(v)} y2={h - 26} className="lc-grid" />
          <text x={sx(v)} y={h - 8} textAnchor="middle" className="lb">
            {v.toLocaleString("ko-KR")}
          </text>
        </g>
      ))}
      {auto.map((a, i) => {
        const y = 24 + i * 46;
        return (
          <g key={a.k}>
            <text x={x0 - 12} y={y + 15} textAnchor="end" className="lb strong">
              {a.k}
            </text>
            <rect x={x0} y={y} width={sx(a.v) - x0} height={22} rx={5} className={`df-bar a${i}`} />
            <text x={sx(a.v) + 8} y={y + 16} className="lb strong">
              {a.v.toLocaleString("ko-KR")}
            </text>
            <text x={x0} y={y + 37} className="lb">
              {a.d}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
