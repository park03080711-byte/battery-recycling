/* 01 재제조 — 요약 카드 아이콘 · 점검 관문 도식 (숫자의 뜻을 그대로 그린다) */
import type { ReactNode } from "react";
import { Box, EDGE, makeIso, ramp } from "../rc/Iso";

/** 80% 이상 = 세 층 계단의 맨 위 */
export function IconTier() {
  const iso = makeIso(6, 60, 58);
  const hs = [5, 3.4, 1.8];
  return (
    <svg viewBox="0 0 136 96" className="rc-kpi-ico" aria-hidden="true">
      {[2, 1, 0].map((i) => (
        <Box key={i} iso={iso} x={i * 3.4} y={0} w={3.2} d={4} h={hs[i]} fill={i === 0 ? ramp.blue : ramp.base} />
      ))}
    </svg>
  );
}

/** 89% = 셀 열 개 중 아홉 꼴로 다시 쓸 수 있음 */
export function IconCells() {
  const iso = makeIso(5.2, 54, 40);
  const cells: ReactNode[] = [];
  for (let i = 0; i < 5; i++)
    for (let j = 0; j < 2; j++) {
      const bad = i === 4 && j === 1;
      cells.push(<Box key={`${i}-${j}`} iso={iso} x={i * 2.4} y={j * 2.4} w={1.8} d={1.8} h={bad ? 1.2 : 5} fill={bad ? ramp.amber : ramp.blue} stroke={EDGE} />);
    }
  const order = cells.map((c, k) => ({ c, s: Math.floor(k / 2) + (k % 2) })).sort((a, b) => a.s - b.s);
  return (
    <svg viewBox="0 0 136 96" className="rc-kpi-ico" aria-hidden="true">
      {order.map((o) => o.c)}
    </svg>
  );
}

/** 22단계 = 끝이 먼 계단 (뒤로 올라가는 22칸) */
export function IconSteps() {
  const iso = makeIso(3.1, 20, 86);
  return (
    <svg viewBox="0 0 136 96" className="rc-kpi-ico" aria-hidden="true">
      {Array.from({ length: 22 }, (_, k) => 21 - k).map((i) => (
        <Box key={i} iso={iso} x={0} y={-i * 1.35} w={3.2} d={1.35} h={0.6 + i * 0.55} fill={i === 21 ? ramp.blue : ramp.base} sw={0.5} />
      ))}
    </svg>
  );
}

/** 3단계 점검 — 팩이 지나는 관문 셋 */
export function GatesArt() {
  const iso = makeIso(7, 50, 38);
  const gate = (x: number, k: number) => (
    <g key={k}>
      <Box iso={iso} x={x} y={0} w={0.6} d={0.6} h={5} fill={ramp.base} />
      <Box iso={iso} x={x} y={5} w={0.6} d={0.6} h={5} fill={ramp.base} />
      <Box iso={iso} x={x} y={0} z={5} w={0.6} d={5.6} h={0.7} fill={k === 1 ? ramp.amber : ramp.blue} />
    </g>
  );
  return (
    <svg viewBox="0 0 200 140" className="rm-gates-art" aria-hidden="true">
      <Box iso={iso} x={-1} y={-0.5} w={23} d={6.6} h={0.2} fill={ramp.ghost} />
      {[0, 1, 2, 3, 4, 5, 6].map((i) => (
        <Box key={`d${i}`} iso={iso} x={i * 3.2} y={2.7} z={0.2} w={1.6} d={0.2} h={0.02} fill={ramp.teal} stroke="none" />
      ))}
      {gate(2, 0)}
      {gate(9, 1)}
      {gate(16, 2)}
      <Box iso={iso} x={18.6} y={1.4} z={0.2} w={3} d={2.8} h={0.9} fill={ramp.navy} />
    </svg>
  );
}
