/* 직접 제작한 SVG 일러스트 — 외부 사진 없이 모든 비주얼을 코드로 생성 */
import type { LayerId } from "@/data/layers";

function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

const METALS = [
  { c: "#2BB594", label: "Ni" },
  { c: "#E0527E", label: "Co" },
  { c: "#F2B8C6", label: "Mn" },
  { c: "#FFFFFF", label: "Li" },
];

/* ───────── Hero 1: 배터리 팩에서 금속 입자가 흘러나오는 장면 ───────── */
function HeroPack() {
  const r = rng(7);
  const particles = Array.from({ length: 70 }, (_, i) => {
    const m = METALS[i % 4];
    const x = 1000 + r() * 600;
    const y = 140 + r() * 640;
    return { x, y, m, s: 3 + r() * 7, d: (r() * 6).toFixed(2), dur: (6 + r() * 6).toFixed(2), sq: m.label === "Li" };
  });
  return (
    <svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <linearGradient id="h1bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#041b3f" />
          <stop offset="0.6" stopColor="#0b3f8c" />
          <stop offset="1" stopColor="#1f6fb5" />
        </linearGradient>
        <radialGradient id="h1glow" cx="0.72" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#7fd4ff" stopOpacity="0.45" />
          <stop offset="1" stopColor="#7fd4ff" stopOpacity="0" />
        </radialGradient>
        <pattern id="h1grid" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M40 0H0v40" fill="none" stroke="#fff" strokeOpacity="0.05" />
        </pattern>
      </defs>
      <rect width="1600" height="900" fill="url(#h1bg)" />
      <rect width="1600" height="900" fill="url(#h1grid)" />
      <rect width="1600" height="900" fill="url(#h1glow)" />
      {/* 배터리 팩 */}
      <g transform="translate(1030 250) rotate(-8)" stroke="#fff" strokeOpacity="0.55" fill="none" strokeWidth="2">
        <rect x="0" y="0" width="420" height="260" rx="16" />
        <rect x="420" y="90" width="26" height="80" rx="6" />
        {Array.from({ length: 6 }, (_, i) => (
          <rect key={i} x={24 + i * 66} y="24" width="52" height="212" rx="6" strokeOpacity={0.3 + (i % 3) * 0.12} />
        ))}
        <path d="M200 70l-30 60h40l-30 60" stroke="#F5C400" strokeOpacity="0.9" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      </g>
      {/* 흐르는 금속 입자 */}
      <g className="drift">
        {particles.map((p, i) =>
          p.sq ? (
            <rect key={i} x={p.x} y={p.y} width={p.s * 1.6} height={p.s * 1.6} fill={p.m.c} opacity="0.85" style={{ animation: `floatY ${p.dur}s ease-in-out ${p.d}s infinite alternate` }} />
          ) : (
            <circle key={i} cx={p.x} cy={p.y} r={p.s} fill={p.m.c} opacity="0.8" style={{ animation: `floatY ${p.dur}s ease-in-out ${p.d}s infinite alternate` }} />
          )
        )}
      </g>
      <style>{`@keyframes floatY{from{transform:translate(0,0)}to{transform:translate(-40px,-26px)}}`}</style>
    </svg>
  );
}

/* ───────── Hero 2: 한 점에서 14갈래로 뻗는 경로 ───────── */
function HeroBranches() {
  const origin = { x: 1560, y: 450 };
  const colors = ["#2BB594", "#2BB594", "#2BB594", "#2BB594", "#7FB2FF", "#7FB2FF", "#7FB2FF", "#7FB2FF", "#7FB2FF", "#7FB2FF", "#F08BAA", "#F08BAA", "#F08BAA", "#E6C27A"];
  const lines = colors.map((c, i) => {
    const t = i / 13;
    const ey = 110 + t * 680;
    const ex = 820 + Math.sin(t * Math.PI) * 140;
    const c1x = 1300;
    const c2x = 1060;
    return { c, d: `M${origin.x} ${origin.y} C ${c1x} ${origin.y}, ${c2x} ${ey}, ${ex} ${ey}`, ex, ey, n: String(i + 1).padStart(2, "0") };
  });
  return (
    <svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <linearGradient id="h2bg" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#03152f" />
          <stop offset="1" stopColor="#0a2d63" />
        </linearGradient>
      </defs>
      <rect width="1600" height="900" fill="url(#h2bg)" />
      {lines.map((l, i) => (
        <g key={i}>
          <path d={l.d} fill="none" stroke={l.c} strokeOpacity="0.55" strokeWidth="2" strokeDasharray="1400" strokeDashoffset="1400" style={{ animation: `draw 2.4s cubic-bezier(.22,1,.36,1) ${0.1 + i * 0.08}s forwards` }} />
          <circle cx={l.ex} cy={l.ey} r="15" fill="#03152f" stroke={l.c} strokeWidth="2" opacity="0" style={{ animation: `pop .6s ease ${1.2 + i * 0.08}s forwards` }} />
          <text x={l.ex} y={l.ey + 4} textAnchor="middle" fontSize="11" fontWeight="700" fill="#fff" opacity="0" style={{ animation: `pop .6s ease ${1.2 + i * 0.08}s forwards` }}>
            {l.n}
          </text>
        </g>
      ))}
      <circle cx={origin.x} cy={origin.y} r="10" fill="#F5C400" />
      <style>{`@keyframes draw{to{stroke-dashoffset:0}}@keyframes pop{to{opacity:1}}`}</style>
    </svg>
  );
}

/* ───────── Hero 3: 배터리 셀로 쌓은 도시광산 ───────── */
function HeroUrbanMine() {
  const r = rng(21);
  const cols = 34;
  const buildings = Array.from({ length: cols }, (_, i) => {
    const h = 120 + r() * 360 * (0.5 + i / cols);
    return { x: i * 48, h, w: 40, lit: Array.from({ length: Math.floor(h / 26) }, () => r() > 0.62) };
  });
  return (
    <svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <linearGradient id="h3bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#051d45" />
          <stop offset="0.7" stopColor="#12467f" />
          <stop offset="1" stopColor="#2d6aa8" />
        </linearGradient>
      </defs>
      <rect width="1600" height="900" fill="url(#h3bg)" />
      <g transform="translate(0 900) scale(1 -1)">
        {buildings.map((b, i) => (
          <g key={i} transform={`translate(${b.x} 0)`}>
            <rect width={b.w} height={b.h} fill="#0a2a57" opacity="0.9" />
            <rect x={b.w / 2 - 7} y={b.h} width="14" height="8" fill="#0a2a57" />
            {b.lit.map((on, j) =>
              on ? <rect key={j} x="8" y={12 + j * 26} width={b.w - 16} height="14" rx="2" fill={j % 5 === 0 ? "#F5C400" : j % 3 === 0 ? "#2BB594" : "#E0527E"} opacity="0.75" /> : null
            )}
          </g>
        ))}
      </g>
    </svg>
  );
}

export function HeroArt({ variant }: { variant: 0 | 1 | 2 }) {
  if (variant === 1) return <HeroBranches />;
  if (variant === 2) return <HeroUrbanMine />;
  return <HeroPack />;
}

/* ───────── Layer panels ───────── */
const layerGrad: Record<LayerId, [string, string]> = {
  paths: ["#0b4f40", "#1a8a70"],
  support: ["#0a2d6b", "#2a63c4"],
  evaluation: ["#6e1b38", "#c24a72"],
  design: ["#4f3c17", "#a88445"],
};

export function PanelArt({ layer }: { layer: LayerId }) {
  const [a, b] = layerGrad[layer];
  const id = `pg-${layer}`;
  return (
    <svg viewBox="0 0 400 900" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0.4" y2="1">
          <stop offset="0" stopColor={b} />
          <stop offset="1" stopColor={a} />
        </linearGradient>
      </defs>
      <rect width="400" height="900" fill={`url(#${id})`} />
      <g fill="none" stroke="#fff" strokeOpacity="0.28" strokeWidth="2">
        {layer === "paths" && (
          <>
            <path d="M200 900 V520" />
            <path d="M200 520 C200 400 90 380 80 250" />
            <path d="M200 520 C200 380 170 330 160 170" />
            <path d="M200 520 C200 380 240 330 250 190" />
            <path d="M200 520 C210 400 320 380 330 260" strokeDasharray="8 8" />
            {[[80, 250, "01"], [160, 170, "02"], [250, 190, "03"], [330, 260, "04"]].map(([x, y, n]) => (
              <g key={n as string}>
                <circle cx={x as number} cy={y as number} r="26" fill="#fff" fillOpacity="0.1" />
                <text x={x as number} y={(y as number) + 6} textAnchor="middle" fill="#fff" fillOpacity="0.8" stroke="none" fontSize="16" fontWeight="700">{n as string}</text>
              </g>
            ))}
          </>
        )}
        {layer === "support" && (
          <>
            {Array.from({ length: 6 }, (_, i) => {
              const cx = 90 + (i % 2) * 200 + (Math.floor(i / 2) % 2) * 20;
              const cy = 120 + Math.floor(i / 2) * 140;
              return (
                <g key={i}>
                  <circle cx={cx} cy={cy} r="48" />
                  <circle cx={cx} cy={cy} r="10" fill="#fff" fillOpacity="0.2" />
                  <text x={cx} y={cy + 72} textAnchor="middle" fill="#fff" fillOpacity="0.7" stroke="none" fontSize="14" fontWeight="700">{String(i + 5).padStart(2, "0")}</text>
                </g>
              );
            })}
            <path d="M90 150 H290 M110 310 H310 M90 470 H290" strokeDasharray="4 6" />
          </>
        )}
        {layer === "evaluation" && (
          <>
            <path d="M60 620 V160 M60 620 H360" />
            <path d="M80 560 C140 520 170 440 220 420 S320 260 350 200" strokeWidth="3" />
            <rect x="90" y="480" width="40" height="140" fill="#fff" fillOpacity="0.12" />
            <rect x="170" y="420" width="40" height="200" fill="#fff" fillOpacity="0.12" />
            <rect x="250" y="340" width="40" height="280" fill="#fff" fillOpacity="0.12" />
            <circle cx="350" cy="200" r="10" fill="#F5C400" stroke="none" />
          </>
        )}
        {layer === "design" && (
          <>
            {Array.from({ length: 12 }, (_, i) => (
              <path key={`h${i}`} d={`M0 ${80 + i * 50} H400`} strokeOpacity="0.12" />
            ))}
            {Array.from({ length: 9 }, (_, i) => (
              <path key={`v${i}`} d={`M${i * 50} 0 V900`} strokeOpacity="0.12" />
            ))}
            <rect x="90" y="200" width="220" height="320" rx="10" strokeDasharray="10 8" />
            <rect x="160" y="178" width="80" height="22" rx="4" />
            <path d="M110 280 H290 M110 360 H290 M110 440 H290" />
            <path d="M200 200 V520" strokeDasharray="2 6" />
            <circle cx="320" cy="560" r="12" fill="#F5C400" stroke="none" />
          </>
        )}
      </g>
    </svg>
  );
}

/* ───────── Sub page visual ───────── */
export function SubVisualArt({ layer, seed = 1 }: { layer: LayerId | "neutral"; seed?: number }) {
  const [a, b] = layer === "neutral" ? ["#041b3f", "#0b3f8c"] : layerGrad[layer];
  const r = rng(seed * 97 + 3);
  const dots = Array.from({ length: 28 }, () => ({ x: 900 + r() * 700, y: r() * 420, s: 2 + r() * 6, o: 0.15 + r() * 0.45 }));
  const id = `sv-${layer}-${seed}`;
  return (
    <svg viewBox="0 0 1600 420" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="0.6">
          <stop offset="0" stopColor={a} />
          <stop offset="1" stopColor={b} />
        </linearGradient>
        <pattern id={`${id}-g`} width="32" height="32" patternUnits="userSpaceOnUse">
          <path d="M32 0H0v32" fill="none" stroke="#fff" strokeOpacity="0.06" />
        </pattern>
      </defs>
      <rect width="1600" height="420" fill={`url(#${id})`} />
      <rect width="1600" height="420" fill={`url(#${id}-g)`} />
      <g fill="none" stroke="#fff" strokeOpacity="0.16" strokeWidth="2">
        <circle cx="1320" cy="190" r="220" />
        <circle cx="1320" cy="190" r="150" strokeDasharray="6 10" />
        <circle cx="1320" cy="190" r="80" />
      </g>
      {dots.map((d, i) => (
        <circle key={i} cx={d.x} cy={d.y} r={d.s} fill={i % 4 === 0 ? "#F5C400" : "#fff"} opacity={d.o} />
      ))}
    </svg>
  );
}

/* ───────── Why-now section art: 발생량 막대 ───────── */
export function WhyArt() {
  const bars = [
    { y: "2023", v: 2355 },
    { y: "2030", v: 107500 },
  ];
  const r = rng(5);
  const cells = Array.from({ length: 46 }, (_, i) => ({ col: i % 8, row: Math.floor(i / 8), on: r() > 0.08 }));
  return (
    <svg viewBox="0 0 800 900" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <linearGradient id="wbg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#e6eefa" />
          <stop offset="1" stopColor="#c9dbf5" />
        </linearGradient>
      </defs>
      <rect width="800" height="900" fill="url(#wbg)" />
      {/* 2030년: 셀 격자로 표현한 대량 배출 */}
      <g transform="translate(330 230)">
        {cells.map((c, i) => (
          <g key={i} transform={`translate(${c.col * 44} ${c.row * 70})`}>
            <rect width="32" height="54" rx="5" fill="#0b3f8c" opacity={0.9 - c.row * 0.08} />
            <rect x="11" y="-5" width="10" height="5" rx="1" fill="#0b3f8c" opacity="0.6" />
          </g>
        ))}
      </g>
      {/* 2023년: 셀 하나 */}
      <g transform="translate(147 610)">
        <rect width="32" height="54" rx="5" fill="#F5C400" />
        <rect x="11" y="-5" width="10" height="5" rx="1" fill="#F5C400" />
      </g>
      <text x="163" y="700" textAnchor="middle" fontSize="16" fontWeight="700" fill="#07275a">{bars[0].y}</text>
      <text x="163" y="722" textAnchor="middle" fontSize="13" fill="#07275a" opacity="0.7">2,355개</text>
      <text x="480" y="700" textAnchor="middle" fontSize="16" fontWeight="700" fill="#07275a">{bars[1].y}</text>
      <text x="480" y="722" textAnchor="middle" fontSize="13" fill="#07275a" opacity="0.7">107,500개 (전망)</text>
      <text x="200" y="860" fontSize="12" fill="#07275a" opacity="0.6">* 셀 한 칸 = 약 2,355개 (2023년 연간 배출량). 2030년은 약 46칸 · 환경 당국 추정치</text>
    </svg>
  );
}

export function ReportBg() {
  return (
    <svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <linearGradient id="rbg" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.5" stopColor="#f4f7fb" />
          <stop offset="1" stopColor="#dbe6f5" />
        </linearGradient>
      </defs>
      <rect width="1600" height="900" fill="url(#rbg)" />
      <g transform="translate(1050 140)" fill="none" stroke="#0b3f8c" strokeOpacity="0.25" strokeWidth="2">
        <rect x="0" y="0" width="360" height="480" rx="10" fill="#fff" fillOpacity="0.7" />
        <rect x="40" y="-30" width="360" height="480" rx="10" fill="#fff" fillOpacity="0.8" />
        <path d="M80 30h240M80 70h240M80 110h160" />
        <path d="M80 170h280v180H80z" />
        <path d="M100 330l60-60 50 30 80-100 50 40" strokeWidth="3" stroke="#0b3f8c" strokeOpacity="0.45" />
        <circle cx="340" cy="240" r="9" fill="#F5C400" stroke="none" />
        <path d="M80 390h240M80 420h200" />
      </g>
    </svg>
  );
}
