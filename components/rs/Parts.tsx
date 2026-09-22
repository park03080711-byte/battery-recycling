"use client";

import { useState } from "react";
import { Box, makeIso, ramp } from "../rc/Iso";
import { Cite } from "../rc/Cite";
import { lca } from "./data";

/* ── 환경 이득의 문턱: 새 배터리 100개 중 몇 개를 대신해야 하나 ── */
export function ThresholdGrid() {
  const [k, setK] = useState(0);
  const cur = lca[k];
  const iso = makeIso(6.2, 150, 34);
  const cells = Array.from({ length: 100 }, (_, n) => ({ n, i: Math.floor(n / 10), j: n % 10 })).sort((a, b) => a.i + a.j - (b.i + b.j));
  return (
    <figure className="rc-panel rs-th">
      <div className="rs-th-top">
        <p className="rc-fig-h">새 배터리 100개를 만드는 영향 가운데, 재사용 배터리가 내는 몫</p>
        <div className="rc-filter" role="group" aria-label="영향 범주 고르기">
          {lca.map((c, i) => (
            <button key={c.key} type="button" aria-pressed={k === i} onClick={() => setK(i)}>
              {c.name}
            </button>
          ))}
        </div>
      </div>
      <div className="rs-th-body">
        <svg viewBox="80 10 140 102" className="rs-th-art" role="img" aria-labelledby="th-t">
          <title id="th-t">{`${cur.name}: 100칸 가운데 ${cur.v}칸이 솟아 있습니다. ${cur.note}`}</title>
          {cells.map(({ n, i, j }) => {
            const on = i * 10 + j < cur.v;
            return <Box key={n} iso={iso} x={i * 1.15} y={j * 1.15} w={0.95} d={0.95} h={on ? 2.2 : 0.35} fill={on ? ramp.blue : ramp.base} sw={0.5} />;
          })}
        </svg>
        <div className="rs-th-read" aria-live="polite">
          <p className="v">
            {cur.v}
            <small>%</small>
          </p>
          <p className="th-nm">{cur.name}</p>
          <p className="th-note">{cur.note}</p>
          <p className="th-how">
            대신하는 정도는 두 가지로 정해집니다. <b>기술</b> — 남은 용량이 새 용도에 충분한가, <b>시장</b> — 싸서가 아니라 필요해서 사는가.
          </p>
        </div>
      </div>
      <figcaption>
        그림 4. 솟은 칸 하나는 새 배터리 제조 영향의 1%입니다. 노르웨이의 두 재사용 기업(팩째 · 모듈 단위) 자료로 18개 영향 범주를 평가한 결과 중 셋입니다.{" "}
        <Cite src={[42]} />
      </figcaption>
    </figure>
  );
}
