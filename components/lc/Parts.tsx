"use client";

/* 11 전과정평가 — 그림 세 개
   1) BoundaryPicker: 경계를 바꾸면 어느 단계를 세는지 · 기능 단위가 바뀐다
   2) GateFig: 공장 안 정제 단계 온실가스 (Machala 외 2025, 양극재 1 kg NCA 환산)
   3) AllocPicker: 재활용을 어느 배터리 장부에 적나 (개념) */
import { useState } from "react";
import { allocs, bounds, cuts, gate, stages } from "./data";

export function BoundaryPicker() {
  const [id, setId] = useState("c2g");
  const b = bounds.find((x) => x.id === id)!;
  const on = new Set(b.on);
  return (
    <div className="lc-bd">
      <div className="lc-btns" role="group" aria-label="경계 고르기">
        {bounds.map((x) => (
          <button key={x.id} type="button" aria-pressed={id === x.id} onClick={() => setId(x.id)}>
            <b>{x.t}</b>
            <span>{x.sub}</span>
          </button>
        ))}
      </div>
      <ol className="lc-stages" aria-label={`${b.t}에 들어가는 단계`}>
        {stages.map((s, i) => (
          <li key={s.id} className={on.has(s.id) ? "on" : "off"}>
            <span className="n">{i + 1}</span>
            <span className="t">{s.t}</span>
            <span className="st">{on.has(s.id) ? "셈" : "뺌"}</span>
          </li>
        ))}
      </ol>
      <div className="lc-sum" aria-live="polite">
        <p>
          <b>{b.t}</b> — 기준 단위: <b>{b.fu}</b>
        </p>
        <p className="d">{b.d}</p>
      </div>
    </div>
  );
}

export function GateFig() {
  const x0 = 170;
  const W = 330;
  const max = 15;
  const sx = (v: number) => x0 + (v / max) * W;
  return (
    <svg viewBox="0 0 560 196" className="lc-gate" role="img" aria-labelledby="lc-gate-t">
      <title id="lc-gate-t">
        공장 안 정제 단계의 온실가스, 양극재 1 킬로그램당. 광산 원료 정제 14.5, 다 쓴 배터리 재활용 6.1, 공정 스크랩 재활용 2.8 킬로그램 이산화탄소 환산. 운송은 광산 정광 3.68,
        전기차 팩 0.073.
      </title>
      {[0, 5, 10, 15].map((v) => (
        <g key={v}>
          <line x1={sx(v)} y1={14} x2={sx(v)} y2={150} className="lc-grid" />
          <text x={sx(v)} y={168} textAnchor="middle" className="lb">
            {v}
          </text>
        </g>
      ))}
      <text x={x0 + W} y={186} textAnchor="end" className="lb">
        kg CO₂e / 양극재 1 kg
      </text>
      {gate.map((g, i) => {
        const y = 22 + i * 44;
        return (
          <g key={g.k}>
            <text x={x0 - 12} y={y + 12} textAnchor="end" className="lb strong">
              {g.k}
            </text>
            <text x={x0 - 12} y={y + 27} textAnchor="end" className="lb">
              {g.note}
            </text>
            <rect x={x0} y={y} width={(g.v / max) * W} height={22} rx={4} className={`lc-bar ${g.tone}`} />
            <text x={sx(g.v) + 8} y={y + 16} className="lb strong">
              {g.v}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export function CutTable() {
  return (
    <div className="lc-cut">
      <table className="rc-table">
        <caption className="sr-only">광산 원료 정제 대비 재활용 원료 정제에서 줄어든 비율 (공장 안 기준)</caption>
        <thead>
          <tr>
            <th scope="col">영향</th>
            <th scope="col">다 쓴 배터리</th>
            <th scope="col">공정 스크랩</th>
          </tr>
        </thead>
        <tbody>
          {cuts.map((c) => (
            <tr key={c.k}>
              <th scope="row">{c.k}</th>
              <td>
                <span className="bar" style={{ width: `${c.bat}%` }} aria-hidden="true" />
                <b>−{c.bat}%</b>
              </td>
              <td>
                <span className="bar s" style={{ width: `${c.scrap}%` }} aria-hidden="true" />
                <b>−{c.scrap}%</b>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function AllocPicker() {
  const [id, setId] = useState("cut");
  const a = allocs.find((x) => x.id === id)!;
  return (
    <div className="lc-al">
      <div className="lc-btns three" role="group" aria-label="재활용을 적는 방식">
        {allocs.map((x) => (
          <button key={x.id} type="button" aria-pressed={id === x.id} onClick={() => setId(x.id)}>
            <b>{x.t}</b>
            <span>{x.sub}</span>
          </button>
        ))}
      </div>
      <div className="lc-books">
        <div className="lc-book">
          <p className="h">첫 번째 배터리의 장부</p>
          <ul>
            {a.first.map((t) => (
              <li key={t} className={t.includes("(−)") ? "minus" : t.includes("재생원료") ? "rec" : t.includes("재활용 공정") ? "proc" : undefined}>
                {t}
              </li>
            ))}
          </ul>
        </div>
        <div className="lc-book">
          <p className="h">재생원료를 받는 다음 배터리의 장부</p>
          {a.second.length ? (
            <ul>
              {a.second.map((t) => (
                <li key={t} className={t.includes("재생원료") ? "rec" : t.includes("재활용 공정") ? "proc" : undefined}>
                  {t}
                </li>
              ))}
            </ul>
          ) : (
            <p className="none">같은 재활용이 이미 첫 장부에 두 번 들어감</p>
          )}
        </div>
      </div>
      <div className="lc-sum" aria-live="polite">
        <p>
          <b>{a.t}</b>
          {a.risk && <span className="risk">{a.risk}</span>}
        </p>
        <p className="d">{a.d}</p>
      </div>
    </div>
  );
}
