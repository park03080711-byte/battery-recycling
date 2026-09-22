"use client";

import Link from "next/link";
import { useState } from "react";
import { Box, EDGE, makeIso, ramp, type Ramp } from "./Iso";
import { Cite } from "./Cite";
import { tiers } from "./tiers";

/* ── 잔존용량 세 갈래: 계단 도식 + 경로 목록 (목록을 가리키면 해당 층이 드러남) ── */
export function TierStair({ active, fig = "그림 1" }: { active: number; fig?: string }) {
  const [on, setOn] = useState<number | null>(null);
  const iso = makeIso(8, 60, 120);
  const hs = [6, 4, 2];
  const f = (i: number): Ramp => (i === active ? ramp.blue : on === i ? ramp.teal : ramp.base);
  return (
    <figure className="rc-panel rm-tier">
      <svg viewBox="0 0 200 200" className="rm-tier-art" role="img" aria-labelledby="tier-t">
        <title id="tier-t">{`잔존용량에 따른 세 갈래 계단. 가장 높은 층이 재제조(80% 이상), 가운데가 재사용(60~80%), 가장 낮은 층이 재활용(60% 미만). 이 페이지는 ${tiers[active].title}입니다.`}</title>
        <Box iso={iso} x={-0.6} y={-0.6} w={14.2} d={6.2} h={0.5} fill={ramp.ghost} />
        {[0, 1, 2].map((i) => (
          <Box key={i} iso={iso} x={i * 4.4} y={0} z={0.5} w={4.2} d={5} h={hs[i] + (on === i ? 0.5 : 0)} fill={f(i)} stroke={i === active || on === i ? "#172033" : EDGE} sw={i === active || on === i ? 1.1 : 0.8} />
        ))}
        {[0, 1, 2].map((i) => {
          const p = iso.P(i * 4.4 + 2.1, 2.5, 0.5 + hs[i] + (on === i ? 0.5 : 0));
          return (
            <text key={i} x={p[0]} y={p[1] + 4} textAnchor="middle" className="rm-tier-n">
              {tiers[i].no}
            </text>
          );
        })}
      </svg>
      <ol className="rm-tier-list">
        {tiers.map((t, i) => (
          <li key={t.key} className={i === active ? "cur" : undefined}>
            {i === active ? (
              <div className="rm-tier-row" aria-current="page">
                <span className="soh">{t.soh}</span>
                <b>
                  {t.no} {t.title} <em>이 페이지</em>
                </b>
                <span className="out">{t.out}</span>
              </div>
            ) : (
              <Link href={`/topics/${t.slug}`} className="rm-tier-row" onMouseEnter={() => setOn(i)} onMouseLeave={() => setOn(null)} onFocus={() => setOn(i)} onBlur={() => setOn(null)}>
                <span className="soh">{t.soh}</span>
                <b>
                  {t.no} {t.title} <span aria-hidden="true">→</span>
                </b>
                <span className="out">{t.out}</span>
              </Link>
            )}
          </li>
        ))}
      </ol>
      <figcaption>
        {fig}. 잔존용량(SOH)에 따른 처리 경로. 구분값은 일반적 기준이며 사업자와 용도에 따라 달라질 수 있습니다. <Cite src={["R"]} />
      </figcaption>
    </figure>
  );
}

