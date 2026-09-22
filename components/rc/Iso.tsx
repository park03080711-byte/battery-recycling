/* 아이소메트릭(등각) SVG 도식 — 30° 축 하나, 빛 방향 하나(윗면 밝음 · 왼면 중간 · 오른면 어두움).
   깊이는 면의 명도 단계로만 만든다. 좌표는 (x, y, z) 단위 공간, 화면 투영은 makeIso로.
   모든 도식은 코드로 직접 그렸다. */
import type { ReactNode } from "react";

const C = Math.cos(Math.PI / 6);
const S = 0.5;
type Pt = [number, number];

export function makeIso(u: number, ox: number, oy: number) {
  const P = (x: number, y: number, z = 0): Pt => [ox + (x - y) * C * u, oy + (x + y) * S * u - z * u];
  const pts = (a: Pt[]) => a.map((p) => p.map((v) => v.toFixed(1)).join(",")).join(" ");
  return { P, pts, u };
}
type Iso = ReturnType<typeof makeIso>;
export type Ramp = [string, string, string]; // 윗면 · 왼면 · 오른면

export const ramp = {
  base: ["#FFFFFF", "#E6EBF3", "#CDD5E3"] as Ramp,
  ghost: ["#F3F7FF", "#E9EEF7", "#DDE3EE"] as Ramp,
  blue: ["#C9D5FE", "#8FA6FC", "#5B7CFA"] as Ramp,
  teal: ["#C4F0EA", "#7FDCD1", "#39C6B6"] as Ramp,
  amber: ["#FCE6B8", "#F7CF80", "#F3B64A"] as Ramp,
  navy: ["#46527A", "#2B3656", "#172033"] as Ramp,
};
export const EDGE = "rgba(23,32,51,.22)";

export function shade(hex: string, k: number) {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.round(((n >> 16) & 255) * k);
  const g = Math.round(((n >> 8) & 255) * k);
  const b = Math.round((n & 255) * k);
  return `rgb(${r},${g},${b})`;
}
export const metalRamp = (hex: string): Ramp => [hex, shade(hex, 0.88), shade(hex, 0.74)];

export function Box({
  iso,
  x,
  y,
  z = 0,
  w,
  d,
  h,
  fill = ramp.base,
  stroke = EDGE,
  sw = 0.8,
  dash,
  children,
}: {
  iso: Iso;
  x: number;
  y: number;
  z?: number;
  w: number;
  d: number;
  h: number;
  fill?: Ramp;
  stroke?: string;
  sw?: number;
  dash?: string;
  children?: ReactNode;
}) {
  const { P, pts } = iso;
  const top = [P(x, y, z + h), P(x + w, y, z + h), P(x + w, y + d, z + h), P(x, y + d, z + h)];
  const right = [P(x + w, y, z), P(x + w, y + d, z), P(x + w, y + d, z + h), P(x + w, y, z + h)];
  const left = [P(x, y + d, z), P(x + w, y + d, z), P(x + w, y + d, z + h), P(x, y + d, z + h)];
  return (
    <g strokeLinejoin="round" strokeDasharray={dash}>
      <polygon points={pts(left)} fill={fill[1]} stroke={stroke} strokeWidth={sw} />
      <polygon points={pts(right)} fill={fill[2]} stroke={stroke} strokeWidth={sw} />
      <polygon points={pts(top)} fill={fill[0]} stroke={stroke} strokeWidth={sw} />
      {children}
    </g>
  );
}

/** 바닥 그림자(계단식 3단) — 입체가 바닥에서 떠 있는 정도를 명도로만 표현 */
function Shadow({ iso, x, y, w, d, k = 1 }: { iso: Iso; x: number; y: number; w: number; d: number; k?: number }) {
  const { P, pts } = iso;
  return (
    <g>
      {[0.9, 0.55, 0.25].map((g, i) => {
        const e = (i + 1) * 0.9 * k;
        const q = [P(x + e * 0.3, y + e, 0), P(x + w + e, y + e * 0.3, 0), P(x + w + e, y + d + e, 0), P(x + e * 0.3, y + d + e, 0)];
        return <polygon key={i} points={pts(q)} fill={`rgba(23,32,51,${0.05 * g})`} />;
      })}
    </g>
  );
}

/* ── 요약 카드 아이콘: 숫자의 뜻을 그대로 그린다 ── */

/** 95% = 20칸 중 19칸 */
export function IconRecovery() {
  const iso = makeIso(5, 66, 12);
  const cells: ReactNode[] = [];
  for (let i = 0; i < 5; i++)
    for (let j = 0; j < 4; j++) {
      const k = i * 4 + j;
      const empty = k === 19;
      cells.push(
        <Box key={k} iso={iso} x={i * 3.2} y={j * 3.2} w={2.6} d={2.6} h={empty ? 0.3 : 2.4} fill={empty ? ramp.ghost : ramp.blue} dash={empty ? "2 2" : undefined} stroke={empty ? "#8A93A6" : EDGE} />
      );
    }
  // 뒤에서 앞 순서로 그리기 (x+y 작은 것 먼저)
  const order = cells.map((c, k) => ({ c, s: Math.floor(k / 4) + (k % 4) })).sort((a, b) => a.s - b.s);
  return (
    <svg viewBox="0 0 136 96" className="rc-kpi-ico" aria-hidden="true">
      <Shadow iso={iso} x={0} y={0} w={15.4} d={12.2} />
      {order.map((o) => o.c)}
    </svg>
  );
}

/** 50% = 리튬 기둥의 절반 */
export function IconLithium() {
  const iso = makeIso(6.6, 68, 50);
  return (
    <svg viewBox="0 0 136 96" className="rc-kpi-ico" aria-hidden="true">
      <Shadow iso={iso} x={0} y={0} w={6} d={6} k={1.2} />
      <Box iso={iso} x={0} y={0} w={6} d={6} h={3.2} fill={ramp.blue} />
      <Box iso={iso} x={0} y={0} z={3.2} w={6} d={6} h={3.2} fill={ramp.ghost} stroke="#8A93A6" dash="3 2.5" />
      <text x={iso.P(3, 3, 6.4)[0]} y={iso.P(3, 3, 6.4)[1] + 4} textAnchor="middle" className="rc-ico-li">
        Li
      </text>
    </svg>
  );
}

/** 9종 중 4종 = 3×3 타일 중 넷이 솟음 */
export function IconNine() {
  const iso = makeIso(6, 68, 22);
  const up = new Set([0, 1, 3, 4]);
  const tiles = Array.from({ length: 9 }, (_, k) => ({ k, i: Math.floor(k / 3), j: k % 3 })).sort((a, b) => a.i + a.j - (b.i + b.j));
  return (
    <svg viewBox="0 0 136 96" className="rc-kpi-ico" aria-hidden="true">
      <Shadow iso={iso} x={0} y={0} w={11} d={11} />
      {tiles.map(({ k, i, j }) => (
        <Box key={k} iso={iso} x={i * 3.8} y={j * 3.8} w={3.2} d={3.2} h={up.has(k) ? 3 : 0.5} fill={up.has(k) ? ramp.blue : ramp.base} />
      ))}
    </svg>
  );
}

/* ── 검증 깊이 범례: 근거 수준 네 가지를 기둥 높이로 ── */
export function DepthPillars() {
  const iso = makeIso(6, 40, 47);
  const cols: { h: number; f: Ramp }[] = [
    { h: 6, f: ramp.blue },
    { h: 4.5, f: ramp.navy },
    { h: 3, f: ramp.amber },
    { h: 1.5, f: ramp.base },
  ];
  return (
    <svg viewBox="0 0 140 110" className="rc-depth-ico" aria-hidden="true">
      <Box iso={iso} x={-0.8} y={-0.8} w={16.6} d={4.6} h={0.4} fill={ramp.ghost} />
      {cols.map((c, i) => (
        <Box key={i} iso={iso} x={i * 4} y={0} z={0.4} w={3} d={3} h={c.h} fill={c.f} />
      ))}
    </svg>
  );
}

/* ── 산출물 적층: 네 결정을 층으로 쌓은 제품 스택 ── */
export function ProductStackArt({ items, on }: { items: { f: string; fill: string }[]; on: number | null }) {
  const iso = makeIso(8.4, 92, 120);
  return (
    <svg viewBox="0 0 184 200" className="rc-stack-art" aria-hidden="true">
      <Shadow iso={iso} x={0} y={0} w={9} d={9} k={1.4} />
      {items
        .map((p, i) => ({ p, i }))
        .map(({ p, i }) => {
          const z = i * 3.2 + (on !== null && i > on ? 1.8 : 0);
          return (
            <g key={p.f} className="rc-stack-layer" style={{ opacity: on === null || on === i ? 1 : 0.55 }}>
              <Box iso={iso} x={0} y={0} z={z} w={9} d={9} h={1.3} fill={metalRamp(p.fill)} stroke={on === i ? "#172033" : EDGE} sw={on === i ? 1.3 : 0.8} />
            </g>
          );
        })}
    </svg>
  );
}
