/* 첫 화면 배경판 — 밝은 청백색 스튜디오, 궤도 고리, 떠도는 금속 입자 (코드로 직접 그림)
   셀 본체는 Blender로 직접 렌더한 21700 절개 셀 이미지(.hx-cell, public/hero)이고,
   고리의 앞쪽 반은 셀 위에 겹치는 HeroRingFront가 그린다.
   움직임은 거의 느껴지지 않을 정도로: 느린 줌인 · 흐르는 반사광 · 입자 부유 */

const particles = [
  { x: 1015, y: 300, r: 9, c: "#2BB594" },
  { x: 1330, y: 250, r: 7, c: "#E0527E" },
  { x: 1390, y: 420, r: 11, c: "#2BB594" },
  { x: 1020, y: 700, r: 10, c: "#E0527E" },
  { x: 1300, y: 760, r: 8, c: "#F2B8C6" },
  { x: 1420, y: 640, r: 7, c: "#2BB594" },
  { x: 990, y: 520, r: 6, c: "#F2B8C6" },
];
const lithium = [
  { x: 1360, y: 540, s: 13 },
  { x: 1040, y: 420, s: 11 },
];

/* 궤도 고리 — 뒤쪽 반은 배경판에, 앞쪽 반은 셀 위 덮개판(HeroRingFront)에 그린다 */
const RING = { cx: 1150, cy: 510, rx: 560, ry: 104, transform: "rotate(-9 1150 510)" };

export default function HeroPlate() {
  return (
    <div className="hx-bg" aria-hidden="true">
      <svg viewBox="0 0 1920 1080" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id="hxSky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#F4F7FB" />
            <stop offset=".55" stopColor="#E6EDF6" />
            <stop offset="1" stopColor="#D8E2EE" />
          </linearGradient>
          <radialGradient id="hxGlow" cx=".53" cy=".42" r=".45">
            <stop offset="0" stopColor="#fff" stopOpacity=".95" />
            <stop offset="1" stopColor="#fff" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="hxRing" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#fff" stopOpacity="0" />
            <stop offset=".3" stopColor="#fff" stopOpacity=".95" />
            <stop offset=".55" stopColor="#9fbde0" stopOpacity=".55" />
            <stop offset=".8" stopColor="#fff" stopOpacity=".9" />
            <stop offset="1" stopColor="#fff" stopOpacity="0" />
          </linearGradient>
          <filter id="hxBlur" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="34" />
          </filter>
          <filter id="hxSoft" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="6" />
          </filter>
        </defs>

        <g className="hx-bg-push">
          <rect width="1920" height="1080" fill="url(#hxSky)" />
          <rect width="1920" height="1080" fill="url(#hxGlow)" />

          {/* 바닥 그림자와 흐르는 반사광(caustics) */}
          <ellipse cx="1000" cy="905" rx="430" ry="46" fill="#284878" opacity=".10" filter="url(#hxBlur)" />
          <g className="hx-caustic" filter="url(#hxBlur)">
            <ellipse cx="880" cy="880" rx="190" ry="40" fill="#8fd6c4" opacity=".35" />
            <ellipse cx="1130" cy="870" rx="160" ry="34" fill="#f3a9bd" opacity=".30" />
            <ellipse cx="1010" cy="900" rx="120" ry="26" fill="#ffffff" opacity=".9" />
          </g>

          {/* 셀 주위를 떠도는 금속 입자 (Ni · Co/Mn · Li) — 셀 이미지는 HTML 층(.hx-cell)에 따로 놓인다 */}
          {particles.map((p, i) => (
            <circle
              key={i}
              className="hx-float"
              cx={p.x}
              cy={p.y}
              r={p.r}
              fill={p.c}
              opacity=".7"
              style={{ animationDuration: `${9 + (i % 4) * 2.5}s`, animationDelay: `${-i * 1.3}s` }}
            />
          ))}
          {lithium.map((l, i) => (
            <rect
              key={i}
              className="hx-float"
              x={l.x}
              y={l.y}
              width={l.s}
              height={l.s}
              rx="2"
              fill="#fff"
              stroke="#9fb2cc"
              strokeWidth="1.5"
              style={{ animationDuration: `${11 + i * 3}s`, animationDelay: `${-i * 2}s` }}
            />
          ))}

          {/* 셀을 관통하는 순환 고리 */}
          <g className="hx-ring-wrap">
            <ellipse {...RING} fill="none" stroke="url(#hxRing)" strokeWidth="7" />
            <ellipse
              className="hx-ring-shine"
              {...RING}
              fill="none"
              stroke="#fff"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray="160 2100"
            />
          </g>
        </g>
      </svg>
    </div>
  );
}

/** 셀 이미지 위에 겹쳐 고리의 앞쪽 반만 그린다 (배경판과 같은 좌표·같은 줌) */
export function HeroRingFront() {
  return (
    <div className="hx-fg" aria-hidden="true">
      <svg viewBox="0 0 1920 1080" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id="hxRingF" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#fff" stopOpacity="0" />
            <stop offset=".3" stopColor="#fff" stopOpacity=".95" />
            <stop offset=".55" stopColor="#9fbde0" stopOpacity=".55" />
            <stop offset=".8" stopColor="#fff" stopOpacity=".9" />
            <stop offset="1" stopColor="#fff" stopOpacity="0" />
          </linearGradient>
          <clipPath id="hxRingFrontClip">
            <rect x="0" y={RING.cy} width="1920" height="700" transform={RING.transform} />
          </clipPath>
        </defs>
        <g className="hx-bg-push">
          <g className="hx-ring-wrap" clipPath="url(#hxRingFrontClip)">
            <ellipse {...RING} fill="none" stroke="url(#hxRingF)" strokeWidth="7" />
            <ellipse className="hx-ring-shine" {...RING} fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeDasharray="160 2100" />
          </g>
        </g>
      </svg>
    </div>
  );
}
