/* 14 분해를 고려한 설계 — 요약 카드 아이콘 (숫자의 뜻을 그대로 그린다) */
import { Box, makeIso, ramp } from "../rc/Iso";

/** 1,810개 = 판 위에 촘촘히 박힌 나사(호박색 점 격자) */
export function IconScrews() {
  const iso = makeIso(7, 58, 50);
  const dots = [];
  for (let i = 0; i < 6; i++) for (let j = 0; j < 3; j++) dots.push([0.7 + i * 1.1, 0.5 + j * 0.9]);
  return (
    <svg viewBox="0 0 136 96" className="rc-kpi-ico" aria-hidden="true">
      <Box iso={iso} x={0} y={0} w={8} d={3.4} h={0.3} fill={ramp.ghost} />
      <Box iso={iso} x={0.3} y={0.2} z={0.3} w={7.4} d={3.0} h={1.2} fill={ramp.navy} />
      {dots.map(([x, y]) => (
        <Box key={`${x}-${y}`} iso={iso} x={x} y={y} z={1.5} w={0.42} d={0.42} h={0.22} fill={ramp.amber} />
      ))}
    </svg>
  );
}

/** 194 → 47 = 높은 기둥(어려운 팩)과 그 4분의 1 높이의 청록 기둥(쉬운 팩) */
export function IconCost() {
  const iso = makeIso(7, 58, 50);
  return (
    <svg viewBox="0 0 136 96" className="rc-kpi-ico" aria-hidden="true">
      <Box iso={iso} x={0} y={0} w={8} d={3.4} h={0.3} fill={ramp.ghost} />
      <Box iso={iso} x={0.8} y={0.8} z={0.3} w={2.2} d={1.8} h={6.4} fill={ramp.amber} />
      <Box iso={iso} x={4.6} y={0.8} z={0.3} w={2.2} d={1.8} h={1.6} fill={ramp.teal} />
    </svg>
  );
}

/** 78% = 사람 손 시간(옅은 점선 기둥) 가운데 남는 22%만 진한 칸 */
export function IconAuto() {
  const iso = makeIso(7, 58, 50);
  return (
    <svg viewBox="0 0 136 96" className="rc-kpi-ico" aria-hidden="true">
      <Box iso={iso} x={0} y={0} w={8} d={3.4} h={0.3} fill={ramp.ghost} />
      <Box iso={iso} x={2.4} y={0.6} z={0.3} w={3.2} d={2.2} h={1.4} fill={ramp.blue} />
      <Box iso={iso} x={2.4} y={0.6} z={1.7} w={3.2} d={2.2} h={5.0} fill={ramp.ghost} dash="3 2" />
    </svg>
  );
}
