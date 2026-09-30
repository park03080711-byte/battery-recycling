/* 사이트 소개 — 요약 아이콘 · 네 층위 적층 · 읽는 법 아이콘 (모두 코드로 그린 등각 도식) */
import { Box, EDGE, makeIso, ramp, type Ramp } from "../rc/Iso";
import { layers } from "@/data/layers";

const tone = (hex: string, soft: string): Ramp => [soft, hex + "99", hex];

/** 문헌 = 네 묶음으로 쌓인 책 더미 */
export function IconBooks() {
  const iso = makeIso(6, 44, 78);
  const f: Ramp[] = [ramp.blue, ramp.navy, ramp.teal, ramp.amber];
  return (
    <svg viewBox="0 0 136 96" className="rc-kpi-ico" aria-hidden="true">
      {f.map((c, i) => (
        <Box key={i} iso={iso} x={0} y={0} z={i * 1.3} w={7} d={3.6} h={1.1} fill={c} />
      ))}
    </svg>
  );
}

/** 14 주제 · 4 층위 = 층위 색으로 쌓은 네 판 */
export function IconLayers4() {
  const iso = makeIso(6, 52, 70);
  return (
    <svg viewBox="0 0 136 96" className="rc-kpi-ico" aria-hidden="true">
      {[...layers].reverse().map((l, i) => (
        <Box key={l.id} iso={iso} x={0} y={0} z={i * 1.6} w={6} d={4} h={1} fill={tone(l.color, l.colorSoft)} />
      ))}
    </svg>
  );
}

/** 개편 8 / 14 = 14칸 중 채운 칸 */
export function IconGrid({ done, total }: { done: number; total: number }) {
  const iso = makeIso(5.2, 58, 40);
  const cells = Array.from({ length: total }, (_, k) => k);
  return (
    <svg viewBox="0 0 136 96" className="rc-kpi-ico" aria-hidden="true">
      {cells.map((k) => {
        const i = k % 5;
        const j = Math.floor(k / 5);
        return <Box key={k} iso={iso} x={i * 2.1} y={j * 2.1} w={1.8} d={1.8} h={k < done ? 1.6 : 0.3} fill={k < done ? ramp.teal : ramp.base} />;
      })}
    </svg>
  );
}

/** 네 층위를 위에서부터 A(경로) → D(설계) 순으로 쌓은 판. 오른쪽 목록과 순서가 같다 */
export function LayerStack() {
  const iso = makeIso(13, 118, 118);
  return (
    <svg viewBox="0 0 236 190" className="ab-stack" aria-hidden="true">
      {[...layers].reverse().map((l, i) => (
        <g key={l.id}>
          <Box iso={iso} x={0} y={0} z={i * 2.2} w={7} d={5} h={1.2} fill={tone(l.color, l.colorSoft)} stroke={EDGE} sw={0.6} />
        </g>
      ))}
    </svg>
  );
}

/** 읽는 법 아이콘 — 번호 핀 · 재생 · 인용 번호 */
export function HowIcon({ k }: { k: "pin" | "play" | "cite" }) {
  if (k === "pin")
    return (
      <svg viewBox="0 0 64 64" className="ab-how-ico" aria-hidden="true">
        <circle cx="32" cy="26" r="16" fill="#fff" stroke="#3B5BDB" strokeWidth="3" />
        <text x="32" y="32" textAnchor="middle" className="ab-how-t">2</text>
        <path d="M28 42 L32 54 L36 42" fill="#3B5BDB" />
      </svg>
    );
  if (k === "play")
    return (
      <svg viewBox="0 0 64 64" className="ab-how-ico" aria-hidden="true">
        <rect x="6" y="18" width="52" height="28" rx="8" fill="#3B5BDB" />
        <path d="M26 24 L40 32 L26 40 Z" fill="#fff" />
        <path d="M6 56 H58" stroke="#39C6B6" strokeWidth="3" strokeDasharray="5 4" />
      </svg>
    );
  return (
    <svg viewBox="0 0 64 64" className="ab-how-ico" aria-hidden="true">
      <rect x="8" y="20" width="26" height="20" rx="5" fill="#EEF2FF" stroke="#3B5BDB" strokeWidth="2" />
      <text x="21" y="34" textAnchor="middle" className="ab-how-s">62</text>
      <path d="M38 30 H52" stroke="#3B5BDB" strokeWidth="3" />
      <path d="M48 25 L55 30 L48 35" fill="none" stroke="#3B5BDB" strokeWidth="3" />
    </svg>
  );
}
