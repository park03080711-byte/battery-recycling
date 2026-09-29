/* 07 자동화 해체 — 폭발 위험 구역 개념도 · 자동화 비율 막대 · 절단 시간 막대 (수치는 논문 서술을 옮긴 것만) */
import { Box, EDGE, makeIso, ramp } from "../rc/Iso";

/** 폭발 위험 구역 — 가스가 나올 수 있는 곳을 중심으로 반경 1 m 구(Zone 2) [66] */
export function AtexFig() {
  const iso = makeIso(34, 75, 74);
  const c = iso.P(1.5, 0.9, 0.5); // 방출 지점: 팩 윗면 가운데
  const r = iso.u * 1.6; // 반경 1 m를 1.6 단위로 그림 (팩 크기는 개념)
  const e = [c[0] + r * Math.cos(Math.PI / 6), c[1] - r * Math.sin(Math.PI / 6)]; // 반지름 끝 (오른쪽 위, 팩 밖)
  return (
    <svg viewBox="0 0 200 170" className="ad-atex" role="img" aria-labelledby="ad-atex-t">
      <title id="ad-atex-t">폭발 위험 구역 개념도. 팩에서 가스가 나올 수 있는 지점을 중심으로 반경 1 m의 공 모양 구역(Zone 2)을 정하고, 그 안에서 쓰는 로봇 공구는 폭발 위험 구역용 인증을 갖춰야 한다. 팩 크기는 개념.</title>
      <Box iso={iso} x={0} y={0} w={3} d={1.8} h={0.5} fill={ramp.navy} stroke={EDGE} sw={0.6} />
      <circle cx={c[0]} cy={c[1]} r={r} className="ad-atex-zone" />
      <ellipse cx={c[0]} cy={c[1]} rx={r} ry={r * 0.5} className="ad-atex-eq" />
      <line x1={c[0]} y1={c[1]} x2={e[0]} y2={e[1]} className="ad-atex-r" />
      <circle cx={c[0]} cy={c[1]} r="4" className="ad-atex-src" />
      <text x={e[0] + 5} y={e[1] - 3} className="ad-atex-l">1 m</text>
      <text x={c[0]} y={c[1] - r - 7} textAnchor="middle" className="ad-atex-l strong">Zone 2</text>
    </svg>
  );
}

/** 팩→모듈 해체 작업의 자동화 가능성 — 57 · 24 · 나머지 [62] */
export function ShareBar() {
  const parts = [
    { k: "a", v: 57, t: "곧바로 자동화", d: "로봇이 혼자 할 수 있는 작업" },
    { k: "b", v: 24, t: "사람이 조금 거들면", d: "최소한의 사람 개입이 필요한 작업" },
    { k: "c", v: 19, t: "나머지", d: "100에서 두 값을 뺀 몫 — 아직 사람이 맡는 작업" },
  ];
  return (
    <div className="ad-share">
      <div className="ad-share-bar" role="img" aria-label="팩에서 모듈까지 해체 작업 중 57%는 곧바로 자동화, 24%는 사람이 조금 거들면 자동화, 나머지 19%">
        {parts.map((p) => (
          <span key={p.k} className={`ad-share-${p.k}`} style={{ width: `${p.v}%` }}>
            {p.v}%
          </span>
        ))}
      </div>
      <ul className="ad-share-key">
        {parts.map((p) => (
          <li key={p.k}>
            <i className={`ad-share-${p.k}`} aria-hidden="true" />
            <b>
              {p.t} {p.v}%
            </b>
            <span>{p.d}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** 모듈 케이스 절단 시간 — 기술자 220초, 로봇은 108초 빠름 [63] */
export function CutBars() {
  const rows = [
    { t: "재활용 공장 기술자", v: 220, cls: "h" },
    { t: "로봇 (절단 휠)", v: 220 - 108, cls: "r" },
  ];
  return (
    <div className="ad-cut" role="img" aria-label="모듈 케이스 절단 시간. 기술자 220초, 로봇은 이보다 108초 빠른 약 112초">
      {rows.map((r) => (
        <div key={r.cls} className="ad-cut-row">
          <span className="ad-cut-t">{r.t}</span>
          <span className="ad-cut-track">
            <span className={`ad-cut-bar ${r.cls}`} style={{ width: `${(r.v / 220) * 100}%` }} />
          </span>
          <span className="ad-cut-v">{r.cls === "h" ? "220초" : "약 112초"}</span>
        </div>
      ))}
    </div>
  );
}
