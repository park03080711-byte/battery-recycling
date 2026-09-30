/* 08 부산물 회수 — 요약 카드 아이콘 (숫자의 뜻을 그대로 그린다) */
import { Box, EDGE, makeIso, ramp, type Ramp } from "../rc/Iso";

const amber: Ramp = ["#FCE6B8", "#F7CF80", "#F3B64A"];
const white: Ramp = ["#FFFFFF", "#EEF1F6", "#DDE3EE"];
const graphite: Ramp = ["#6B7280", "#4A505C", "#343A46"];

/** 89.1% = 통에 거의 다 찬 호박색 전해액 */
export function IconDrum() {
  const iso = makeIso(6, 60, 76);
  return (
    <svg viewBox="0 8 136 96" className="rc-kpi-ico" aria-hidden="true">
      <Box iso={iso} x={0} y={0} w={4} d={4} h={0.9} fill={amber} />
      <Box iso={iso} x={0} y={0} z={0.9} w={4} d={4} h={6.2} fill={amber} />
      <Box iso={iso} x={0} y={0} z={7.1} w={4} d={4} h={0.9} fill={ramp.ghost} />
    </svg>
  );
}

/** 99.82% = 쟁반 위에 쌓인 흰 탄산리튬 */
export function IconPile() {
  const iso = makeIso(6, 52, 70);
  return (
    <svg viewBox="0 11 136 96" className="rc-kpi-ico" aria-hidden="true">
      <Box iso={iso} x={0} y={0} w={7} d={4} h={0.5} fill={ramp.navy} />
      <Box iso={iso} x={1} y={0.8} z={0.5} w={5} d={2.4} h={1.4} fill={white} stroke={EDGE} sw={0.8} />
      <Box iso={iso} x={2} y={1.3} z={1.9} w={3} d={1.4} h={1.2} fill={white} stroke={EDGE} sw={0.8} />
    </svg>
  );
}

/** 387 mAh/g = 층층이 쌓인 흑연, 맨 위는 되살아난 청록 */
export function IconLayers() {
  const iso = makeIso(6, 50, 74);
  return (
    <svg viewBox="0 12 136 96" className="rc-kpi-ico" aria-hidden="true">
      {[0, 1, 2, 3].map((k) => (
        <Box key={k} iso={iso} x={0} y={0} z={k * 1.5} w={6} d={4} h={1} fill={k === 3 ? ramp.teal : graphite} />
      ))}
    </svg>
  );
}
