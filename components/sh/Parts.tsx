"use client";

import Link from "next/link";
import { useId, useRef, useState, type ComponentProps } from "react";
import { Cite } from "../rc/Cite";
import { SystemMap } from "../rc/SystemMap";
import { methods } from "./data";

/* ── 진단 라인 지도 + 잔존용량 슬라이더: 값을 움직이면 지도에서 해당 출구가 밝아진다 ── */
const tiers = [
  { id: "d3", lo: 0, hi: 60, name: "재활용", no: "03", href: "/topics/recycling", cls: "t-rc", what: "안전하게 방전한 뒤 분해해 리튬 · 니켈 · 코발트를 회수합니다." },
  { id: "d2", lo: 60, hi: 80, name: "재사용", no: "02", href: "/topics/reuse", cls: "t-rs", what: "ESS · UPS처럼 성능 요구가 낮은 곳에서 두 번째 삶을 삽니다." },
  { id: "d1", lo: 80, hi: 101, name: "재제조", no: "01", href: "/topics/remanufacturing", cls: "t-rm", what: "지친 모듈만 바꿔 다시 전기차에 넣습니다." },
];
const tierOf = (v: number) => tiers.find((t) => v >= t.lo && v < t.hi) ?? tiers[0];

export function SohMap(props: Omit<ComponentProps<typeof SystemMap>, "select">) {
  const [soh, setSoh] = useState(72);
  const [select, setSelect] = useState<{ id: string; n: number } | undefined>(undefined);
  const n = useRef(0);
  const id = useId();
  const t = tierOf(soh);
  const change = (v: number) => {
    const next = tierOf(v);
    setSoh(v);
    if (next.id !== t.id || !select) setSelect({ id: next.id, n: ++n.current });
  };
  return (
    <>
      <SystemMap {...props} select={select} />
      <figure className="rc-panel sh-gate" aria-labelledby={`${id}-cap`}>
        <div className="sh-gate-in">
          <label htmlFor={`${id}-r`} className="sh-gate-l">
            잔존용량(SOH)을 움직여 보세요
          </label>
          <output htmlFor={`${id}-r`} className={`sh-gate-v ${t.cls}`}>
            <b>{soh}%</b> → {t.name}
          </output>
        </div>
        <div className="sh-gate-track">
          <div className="sh-gate-bands" aria-hidden="true">
            <span className="t-rc">재활용</span>
            <span className="t-rs">재사용</span>
            <span className="t-rm">재제조</span>
          </div>
          <input
            id={`${id}-r`}
            type="range"
            min={30}
            max={100}
            step={1}
            value={soh}
            onChange={(e) => change(Number(e.target.value))}
            aria-valuetext={`잔존용량 ${soh}%, ${t.name} 쪽`}
          />
          <div className="sh-gate-ticks" aria-hidden="true">
            <span style={{ left: `${((60 - 30) / 70) * 100}%` }}>60</span>
            <span style={{ left: `${((80 - 30) / 70) * 100}%` }}>80</span>
          </div>
        </div>
        <p className="sh-gate-what">
          {t.what}{" "}
          <Link href={t.href}>
            {t.no} {t.name} 보기 →
          </Link>
        </p>
        <figcaption id={`${id}-cap`}>
          그림 3. 기준값은 설명을 위한 일반적 예시이며 법에 정한 값이 아닙니다. 실제로는 사업자 · 용도 · 안전 점검 결과에 따라 다르고, 안전 점검을 통과하지 못한 팩은 잔존용량과
          상관없이 재활용으로 갑니다. <Cite src={["R"]} />
        </figcaption>
      </figure>
    </>
  );
}

/* ── 빠름 vs 정확함: 방법별 카드 + 시험 시간 막대(논문이 밝힌 것만) ── */
export function SpeedCards() {
  return (
    <figure className="rc-panel sh-speed" aria-labelledby="sh-speed-cap">
      <ul className="sh-speed-list">
        {methods.map((m) => (
          <li key={m.key} className={`sh-m sh-m-${m.key}`}>
            <p className="sh-m-h">{m.name}</p>
            <div className="sh-m-time">
              <span className="sh-m-k">시험 시간</span>
              {m.timePct !== undefined ? (
                <span className="sh-m-bar" role="img" aria-label={`완전 측정 대비 ${m.key === "full" ? "기준 100%" : `${m.timePct}% 이하`}`}>
                  <i style={{ width: `${m.timePct}%` }} />
                </span>
              ) : null}
              <span className="sh-m-v">{m.time}</span>
            </div>
            <dl>
              <div>
                <dt>정확도</dt>
                <dd>{m.err}</dd>
              </div>
              <div>
                <dt>시험 대상</dt>
                <dd>{m.sample}</dd>
              </div>
            </dl>
            <p className="sh-m-note">
              {m.note} <Cite src={m.src} />
            </p>
          </li>
        ))}
      </ul>
      <figcaption id="sh-speed-cap">
        그림 4. 각 값은 서로 다른 연구 · 배터리 · 조건에서 얻은 것이라 직접 비교할 수 없습니다. 막대는 시험 시간을 밝힌 연구의 값만 그렸습니다(완전 용량 측정 = 100). 23번은 동료심사 전
        프리프린트입니다.
      </figcaption>
    </figure>
  );
}

/* ── 무릎점 개념도 (수치 없음) ── */
export function KneeFig() {
  return (
    <svg viewBox="0 0 240 132" className="sh-knee" role="img" aria-labelledby="sh-knee-t">
      <title id="sh-knee-t">무릎점 개념도. 잔존용량이 사용 횟수에 따라 천천히 줄다가 무릎점을 지나면 급격히 떨어진다. 실제 수치가 아닌 개념 그림.</title>
      <line x1="28" y1="112" x2="228" y2="112" className="ax" />
      <line x1="28" y1="112" x2="28" y2="10" className="ax" />
      <text x="228" y="126" textAnchor="end" className="lb">사용 (충방전 횟수)</text>
      <text x="32" y="12" className="lb">잔존용량</text>
      <path d="M28 20 C 80 26, 120 32, 150 40 C 172 47, 186 64, 212 104" className="curve" />
      <circle cx="152" cy="41" r="5" className="kp" />
      <text x="140" y="30" textAnchor="end" className="lb strong">무릎점</text>
      <text x="80" y="46" textAnchor="middle" className="lb soft">천천히 줄어듦</text>
      <text x="196" y="66" className="lb soft">급격히</text>
    </svg>
  );
}
