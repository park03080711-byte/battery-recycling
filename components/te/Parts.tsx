"use client";

/* 12 기술경제성 분석 — 그림 세 개
   1) DestPicker: 영국에서 모은 배터리를 어느 나라에서 재활용하나 — 운송비 · 해체비 · 시급 (Lander 외 2021)
   2) BreakEvenFig: 손익분기 처리량 (Lander 외 2021, 영국 · NCA 팩 기준)
   3) StudyTable: 같은 질문, 다른 답 — 네 편의 경계 · 바탕 · 결과 */
import { useState } from "react";
import { Cite } from "../rc/Cite";
import { PLANT_T, breakeven, dests, studies } from "./data";

const MAXK = 4.2; // 막대 눈금 끝 ($/kWh)

export function DestPicker() {
  const [id, setId] = useState("kr");
  const d = dests.find((x) => x.id === id)!;
  const bars = [
    { k: "운송 (견적 운임)", v: d.ship, share: d.shipShare, tone: "ship" },
    { k: "해체", v: d.dis, share: d.disShare, tone: "dis" },
  ];
  return (
    <div className="te-dest">
      <div className="lc-btns five" role="group" aria-label="재활용할 나라 고르기">
        {dests.map((x) => (
          <button key={x.id} type="button" aria-pressed={id === x.id} onClick={() => setId(x.id)}>
            <b>{x.t}</b>
            <span>시급 {x.wage}달러</span>
          </button>
        ))}
      </div>
      <div className="te-bars" aria-live="polite">
        <p className="te-bars-h">
          <b>{d.t}</b>에서 재활용할 때 — 배터리 1 kWh당
        </p>
        {bars.map((b) => (
          <div key={b.k} className="te-bar-row">
            <span className="k">{b.k}</span>
            <span className="track" aria-hidden="true">
              <span className={`fill ${b.tone}`} style={{ width: `${(b.v / MAXK) * 100}%` }} />
            </span>
            <span className="v">
              <b>{b.v.toFixed(2)}</b>달러 <em>전체 비용의 {b.share}</em>
            </span>
          </div>
        ))}
        <p className="te-eb">
          견적 대신 오래된 미국 평균 운임(2015)을 쓰면 운송비는 <b>{d.shipEB.toFixed(2)}달러</b>로, 비중이 전체 비용의 <b>{d.shipShareEB}</b>.
        </p>
      </div>
    </div>
  );
}

export function BreakEvenFig() {
  const x0 = 96;
  const W = 400;
  const max = 18000;
  const sx = (v: number) => x0 + (v / max) * W;
  return (
    <svg viewBox="0 0 560 190" className="te-be" role="img" aria-labelledby="te-be-t">
      <title id="te-be-t">
        손익분기 처리량. 건식 연 1만 7천 톤, 습식 7천 톤, 직접재생 3천 톤. 연구가 가정한 공장 규모는 연 8천 톤으로, 건식만 손익분기에 못 미칩니다.
      </title>
      {[0, 5000, 10000, 15000].map((v) => (
        <g key={v}>
          <line x1={sx(v)} y1={12} x2={sx(v)} y2={146} className="lc-grid" />
          <text x={sx(v)} y={164} textAnchor="middle" className="lb">
            {v === 0 ? "0" : `${v / 1000}천`}
          </text>
        </g>
      ))}
      <text x={x0 + W} y={184} textAnchor="end" className="lb">
        톤 / 년
      </text>
      {breakeven.map((b, i) => {
        const y = 22 + i * 42;
        return (
          <g key={b.k}>
            <text x={x0 - 12} y={y + 16} textAnchor="end" className="lb strong">
              {b.k}
            </text>
            <rect x={x0} y={y} width={(b.v / max) * W} height={22} rx={4} className={`te-bar ${b.tone}`} />
            <text x={sx(b.v) + 8} y={y + 16} className="lb strong">
              {b.v.toLocaleString("ko-KR")}
            </text>
          </g>
        );
      })}
      <line x1={sx(PLANT_T)} y1={6} x2={sx(PLANT_T)} y2={150} className="te-plant" />
      <text x={sx(PLANT_T) + 6} y={14} className="lb te-plant-t">
        가정한 공장 8천 톤
      </text>
    </svg>
  );
}

export function StudyTable() {
  return (
    <div className="te-studies">
      <table className="rc-table">
        <caption className="sr-only">기술경제성 분석 네 편의 범위 · 바탕 · 결과</caption>
        <thead>
          <tr>
            <th scope="col">연구</th>
            <th scope="col">어디까지 셌나</th>
            <th scope="col">무엇을 바탕으로</th>
            <th scope="col">결과</th>
          </tr>
        </thead>
        <tbody>
          {studies.map((s) => (
            <tr key={s.id}>
              <th scope="row">
                {s.who} <Cite src={[s.id]} />
              </th>
              <td data-k="어디까지">{s.scope}</td>
              <td data-k="바탕">{s.basis}</td>
              <td data-k="결과">
                <b>{s.result}</b>
                <span className="n">{s.note}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
