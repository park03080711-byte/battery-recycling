"use client";

import { useState } from "react";
import { Box, EDGE, makeIso, ramp, type Ramp } from "../rc/Iso";
import { Cite } from "../rc/Cite";
import { depths, socBefore } from "./data";

/* ── 셀밸런싱 설명용 예시: 직렬 셀 8개의 충전 상태 ── */
export function BalanceDemo() {
  const [after, setAfter] = useState(false);
  const avg = Math.round(socBefore.reduce((a, b) => a + b, 0) / socBefore.length);
  const soc = after ? socBefore.map(() => avg) : socBefore;
  const max = Math.max(...soc);
  const min = Math.min(...soc);
  const usable = 100 - (max - min);
  const W = 560,
    H = 250,
    x0 = 44,
    y0 = 20,
    ph = 180,
    bw = 40,
    gap = (W - x0 - 20 - bw * 8) / 7;
  const y = (v: number) => y0 + ph - (v / 100) * ph;
  return (
    <figure className="rc-panel rm-bal">
      <div className="rm-bal-top">
        <p className="rc-fig-h">직렬로 묶인 셀 8개의 충전 상태 — 설명용 예시</p>
        <div className="rc-filter" role="group" aria-label="보기 바꾸기">
          <button type="button" aria-pressed={!after} onClick={() => setAfter(false)}>
            밸런싱 전
          </button>
          <button type="button" aria-pressed={after} onClick={() => setAfter(true)}>
            밸런싱 후
          </button>
        </div>
      </div>
      <div className="rm-bal-body">
        <svg viewBox={`0 0 ${W} ${H}`} className="rm-bal-chart" role="img" aria-labelledby="bal-t">
          <title id="bal-t">
            {after ? `밸런싱 후 셀 8개가 모두 ${avg}%로 같아 쓸 수 있는 폭이 100%입니다.` : `밸런싱 전 셀 충전 상태가 ${min}%에서 ${max}%까지 흩어져 쓸 수 있는 폭이 ${usable}%로 줄어듭니다.`}
          </title>
          {[0, 25, 50, 75, 100].map((v) => (
            <g key={v}>
              <line x1={x0} x2={W - 16} y1={y(v)} y2={y(v)} className={v === 0 ? "ax" : "grid"} />
              <text x={x0 - 8} y={y(v) + 4} textAnchor="end" className="tick">
                {v}
              </text>
            </g>
          ))}
          {soc.map((v, i) => {
            const bx = x0 + 10 + i * (bw + gap);
            const kind = !after && v === max ? "hi" : !after && v === min ? "lo" : "";
            return (
              <g key={i} className={`bar ${kind}`}>
                <title>{`셀 ${i + 1}: ${v}%`}</title>
                <rect x={bx} y={y(v)} width={bw} height={y(0) - y(v)} rx="4" />
                <text x={bx + bw / 2} y={y(v) - 6} textAnchor="middle" className="val">
                  {v}
                </text>
                <text x={bx + bw / 2} y={y(0) + 16} textAnchor="middle" className="tick">
                  {i + 1}
                </text>
              </g>
            );
          })}
          <text x={x0} y={H - 2} className="tick">
            셀 번호 · 충전 상태(%)
          </text>
        </svg>
        <dl className="rm-bal-read">
          <div>
            <dt>가장 먼저 차는 셀</dt>
            <dd>
              <i className="hi" aria-hidden="true" /> {max}%
            </dd>
          </div>
          <div>
            <dt>가장 먼저 비는 셀</dt>
            <dd>
              <i className="lo" aria-hidden="true" /> {min}%
            </dd>
          </div>
          <div className="big">
            <dt>팩이 쓸 수 있는 폭</dt>
            <dd>{usable}%</dd>
          </div>
        </dl>
      </div>
      <figcaption>
        그림 3. 직렬 팩은 충전할 때 가장 먼저 차는 셀에서, 방전할 때 가장 먼저 비는 셀에서 멈춥니다. 교체한 모듈(셀 4 · 5)의 충전 상태가 나머지와 다르면 그만큼 쓸 수 있는 폭이
        줄어듭니다. 막대 값은 원리를 보이기 위한 가상의 예시이며 실측값이 아닙니다.
      </figcaption>
    </figure>
  );
}

/* ── 해체 깊이: 팩 · 모듈 · 셀 ── */
export function DepthExplorer() {
  const [k, setK] = useState(1);
  const d = depths[k];
  const iso = makeIso(11, 130, 92);
  return (
    <figure className="rc-panel rm-depth">
      <div className="rc-filter" role="group" aria-label="해체 깊이 고르기">
        {depths.map((x, i) => (
          <button key={x.key} type="button" aria-pressed={k === i} onClick={() => setK(i)}>
            {x.name}
          </button>
        ))}
      </div>
      <div className="rm-depth-body">
        <svg viewBox="0 0 300 210" className="rm-depth-art" aria-hidden="true">
          <Box iso={iso} x={0} y={0} w={8} d={5} h={1.2} fill={k === 0 ? ramp.blue : ramp.navy} />
          {[0, 1, 3, 4, 5, 6, 7, 2].map((n) => {
            const i = n % 4,
              j = Math.floor(n / 4);
            const sel = i === 2 && j === 0;
            if (sel && k === 2) {
              // 셀 단위: 들어 올린 모듈을 셀 여섯 개로 보여 주고, 그중 하나만 더 들어 올림
              return (
                <g key={n}>
                  {Array.from({ length: 6 }, (_, c) => (
                    <Box key={c} iso={iso} x={0.4 + i * 1.85 + c * 0.27} y={0.4 + j * 2.2} z={3.4 + (c === 3 ? 1.6 : 0)} w={0.24} d={2} h={1.1} fill={c === 3 ? ramp.blue : ramp.base} sw={0.6} />
                  ))}
                </g>
              );
            }
            return (
              <Box key={n} iso={iso} x={0.4 + i * 1.85} y={0.4 + j * 2.2} z={1.2 + (sel && k === 1 ? 2.2 : 0)} w={1.6} d={2} h={0.9} fill={k === 0 ? ramp.blue : sel && k === 1 ? ramp.blue : ramp.base} />
            );
          })}
        </svg>
        <div className="rm-depth-text" aria-live="polite">
          <h3>{d.name}</h3>
          <p>{d.what}</p>
          <p className="now">
            <span>현재</span> {d.now}
          </p>
          {d.hard !== "—" && (
            <p className="hard">
              <span>걸림돌</span> {d.hard} <Cite src={d.src} />
            </p>
          )}
        </div>
      </div>
      <figcaption>그림 4. 해체 깊이가 깊을수록 남은 가치를 더 살리지만 품이 커집니다. 파란색이 교체하는 단위입니다.</figcaption>
    </figure>
  );
}
