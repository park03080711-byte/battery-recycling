"use client";

import { useState } from "react";
import { Box, makeIso, metalRamp, ramp } from "../rc/Iso";
import { Cite } from "../rc/Cite";
import { value } from "./data";

/* ── 누가 값을 더 쳐주나: 폐 LiCoO₂ 1 kg당 수익 (논문 추정) ── */
export function ValueBars() {
  const [k, setK] = useState(1);
  const iso = makeIso(7, 118, 190);
  const H = (v: number) => (v / 129.6) * 20; // 129.6 $ = 20칸 높이
  const cur = value[k];
  return (
    <figure className="rc-panel up-val">
      <div className="up-val-top">
        <p className="rc-fig-h">폐 LiCoO₂ 1 kg으로 얻는 수익 (논문의 전과정평가 추정)</p>
        <div className="rc-filter" role="group" aria-label="경로 고르기">
          {value.map((c, i) => (
            <button key={c.key} type="button" aria-pressed={k === i} onClick={() => setK(i)}>
              {c.name}
            </button>
          ))}
        </div>
      </div>
      <div className="up-val-body">
        <svg viewBox="92 60 82 176" className="up-val-art" role="img" aria-labelledby="val-t">
          <title id="val-t">{`기존 재활용은 kg당 13~17달러, 광열 촉매로 쓰는 업사이클링은 kg당 129.6달러로 추정됩니다. 지금 고른 것: ${cur.name}.`}</title>
          {/* 재활용: 13 (진한 부분) + 17까지의 범위 (점선) */}
          <Box iso={iso} x={0} y={0} w={3} d={3} h={H(13)} fill={k === 0 ? ramp.blue : ramp.base} />
          <Box iso={iso} x={0} y={0} z={H(13)} w={3} d={3} h={H(17) - H(13)} fill={ramp.ghost} stroke="#8A93A6" dash="2 2" />
          <Box iso={iso} x={5} y={0} w={3} d={3} h={H(129.6)} fill={k === 1 ? metalRamp("#2BB594") : ramp.base} />
        </svg>
        <div className="up-val-read" aria-live="polite">
          <p className="v">
            {cur.lo === cur.hi ? cur.lo : `${cur.lo}~${cur.hi}`}
            <small> $/kg</small>
          </p>
          <p className="uv-nm">{cur.name}</p>
          <p className="uv-note">{cur.note}</p>
          <p className="uv-how">
            대략 <b>{Math.round(129.6 / 17)}~{Math.round(129.6 / 13)}배</b> 차이입니다. 다만 실험실 결과를 바탕으로 한 추정이고, 촉매 시장이 이만큼의 폐배터리를 받아 줄 수 있는지는 따로 따져야 합니다.
          </p>
        </div>
      </div>
      <figcaption>
        그림 4. 기둥 높이는 수익에 비례합니다. 재활용 기둥의 점선 부분은 13~17달러의 범위입니다. 두 값 모두 한 논문의 추정이며 이 사이트가 새로 계산한 값이 아닙니다.{" "}
        <Cite src={[47]} />
      </figcaption>
    </figure>
  );
}

/* ── 병목은 시장: 반응 · 성능 · 시장 세 계단 ── */
const ready = [
  {
    key: "hc",
    name: "PET 유래 하드카본",
    where: "나트륨이온전지 음극",
    steps: [true, true, true],
    note: "나트륨이온전지 음극에서 400 mAh/g 이상, 초기 쿨롱 효율 80% 이상으로 상용 하드카본에 근접했습니다. 나트륨이온전지 시장이 실제로 열리고 있어 상용 문턱에 섰습니다.",
  },
  {
    key: "mof",
    name: "CoTPA 전극",
    where: "듀얼이온 배터리",
    steps: [true, true, false],
    note: "반응은 작동하고 성능도 나옵니다(≈1,170 mAh/g). 하지만 이 전극이 향하는 듀얼이온 배터리는 아직 상용화되지 않아, 만들어도 쓸 곳이 없습니다.",
  },
];
const stepNames = ["반응이 작동한다", "성능이 나온다", "쓸 시장이 있다"];

export function ReadyStair() {
  const [k, setK] = useState(1);
  const cur = ready[k];
  const iso = makeIso(7, 60, 120);
  return (
    <figure className="rc-panel up-ready">
      <div className="up-val-top">
        <p className="rc-fig-h">업사이클링 소재가 실제로 쓰이기까지의 세 계단</p>
        <div className="rc-filter" role="group" aria-label="소재 고르기">
          {ready.map((c, i) => (
            <button key={c.key} type="button" aria-pressed={k === i} onClick={() => setK(i)}>
              {c.name}
            </button>
          ))}
        </div>
      </div>
      <div className="up-ready-body">
        <svg viewBox="40 103 81 63" className="up-ready-art" role="img" aria-labelledby="ready-t">
          <title id="ready-t">{`${cur.name}: ${stepNames.map((s, i) => `${s} ${cur.steps[i] ? "예" : "아니오"}`).join(", ")}`}</title>
          {[0, 1, 2].map((i) => (
            <Box
              key={i}
              iso={iso}
              x={i * 3.4}
              y={0}
              w={2.6}
              d={2.6}
              h={1.6 + i * 1.8}
              fill={cur.steps[i] ? (i === 2 ? metalRamp("#2BB594") : ramp.blue) : ramp.ghost}
              stroke={cur.steps[i] ? undefined : "#8A93A6"}
              dash={cur.steps[i] ? undefined : "3 3"}
            />
          ))}
        </svg>
        <div className="up-ready-read" aria-live="polite">
          <ol className="up-ready-list">
            {stepNames.map((s, i) => (
              <li key={s} className={cur.steps[i] ? "ok" : "no"}>
                <span aria-hidden="true">{cur.steps[i] ? "✓" : "—"}</span>
                {s}
                <span className="sr-only">{cur.steps[i] ? " — 예" : " — 아직 아님"}</span>
              </li>
            ))}
          </ol>
          <p className="ur-where">
            <b>{cur.name}</b> → {cur.where}
          </p>
          <p className="ur-note">{cur.note}</p>
        </div>
      </div>
      <figcaption>
        그림 6. 계단 높이는 순서를 나타낼 뿐 수치가 아닙니다. 하드카본 수치는 바탕 보고서, CoTPA 수치는 원 논문에서 옮겼습니다. <Cite src={["R", 34]} />
      </figcaption>
    </figure>
  );
}
