/* 첫 화면 배경 — 코드로 직접 그린 유리 배터리 셀 (외부 영상·사진 없음)
   밝은 청백색 스튜디오 배경 위에 투명한 원통형 셀과 궤도 고리, 셀 안을 떠도는 금속 입자.
   움직임은 거의 느껴지지 않을 정도로: 느린 줌인 · 흐르는 반사광 · 입자 부유 */

const particles = [
  { x: 905, y: 640, r: 13, c: "#2BB594" },
  { x: 1060, y: 560, r: 10, c: "#E0527E" },
  { x: 960, y: 470, r: 8, c: "#F2B8C6" },
  { x: 1095, y: 700, r: 12, c: "#2BB594" },
  { x: 880, y: 380, r: 9, c: "#E0527E" },
  { x: 1010, y: 330, r: 7, c: "#2BB594" },
  { x: 1120, y: 420, r: 9, c: "#F2B8C6" },
  { x: 940, y: 740, r: 8, c: "#E0527E" },
  { x: 1045, y: 790, r: 10, c: "#2BB594" },
];
const lithium = [
  { x: 990, y: 600, s: 16 },
  { x: 900, y: 520, s: 12 },
  { x: 1080, y: 470, s: 13 },
];

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
          <linearGradient id="hxGlass" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#fff" stopOpacity=".70" />
            <stop offset=".12" stopColor="#fff" stopOpacity=".18" />
            <stop offset=".42" stopColor="#cfe0f3" stopOpacity=".10" />
            <stop offset=".72" stopColor="#fff" stopOpacity=".30" />
            <stop offset=".88" stopColor="#b9cde6" stopOpacity=".16" />
            <stop offset="1" stopColor="#fff" stopOpacity=".62" />
          </linearGradient>
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
          <clipPath id="hxCellClip">
            <rect x="830" y="200" width="340" height="600" rx="40" />
          </clipPath>
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

          {/* 유리 셀 */}
          <g transform="rotate(-14 1000 500)">
            <g clipPath="url(#hxCellClip)">
              <rect x="830" y="200" width="340" height="600" fill="url(#hxGlass)" />
              {particles.map((p, i) => (
                <circle
                  key={i}
                  className="hx-float"
                  cx={p.x}
                  cy={p.y}
                  r={p.r}
                  fill={p.c}
                  opacity=".78"
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
              <rect x="858" y="222" width="22" height="556" rx="11" fill="#fff" opacity=".7" filter="url(#hxSoft)" />
              <rect x="1128" y="240" width="10" height="520" rx="5" fill="#fff" opacity=".55" filter="url(#hxSoft)" />
            </g>
            <rect x="830" y="200" width="340" height="600" rx="40" fill="none" stroke="#fff" strokeOpacity=".85" strokeWidth="2" />
            <rect x="830" y="200" width="340" height="600" rx="40" fill="none" stroke="#7f9cc2" strokeOpacity=".22" strokeWidth="1" />
            {/* 양극 단자 */}
            <rect x="950" y="168" width="100" height="36" rx="10" fill="#fff" fillOpacity=".55" stroke="#fff" strokeWidth="2" />
            <rect x="950" y="168" width="100" height="36" rx="10" fill="none" stroke="#7f9cc2" strokeOpacity=".25" />
            {/* 셀 띠 (라벨 자리) */}
            <rect x="830" y="560" width="340" height="3" fill="#fff" opacity=".8" />
            <rect x="830" y="600" width="340" height="1.5" fill="#fff" opacity=".6" />
          </g>

          {/* 셀을 관통하는 순환 고리 */}
          <g className="hx-ring-wrap">
            <ellipse cx="1000" cy="520" rx="600" ry="112" transform="rotate(-9 1000 520)" fill="none" stroke="url(#hxRing)" strokeWidth="7" />
            <ellipse
              className="hx-ring-shine"
              cx="1000"
              cy="520"
              rx="600"
              ry="112"
              transform="rotate(-9 1000 520)"
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
