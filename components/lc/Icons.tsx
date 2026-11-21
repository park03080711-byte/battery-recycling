/* 11 전과정평가 — 요약 카드 아이콘 (숫자의 뜻을 그대로 그린다) */
import { Box, makeIso, ramp } from "../rc/Iso";

/** 58% 이상 = 광산 원료 기둥(남색)과 그보다 절반 아래인 재활용 원료 기둥(청록) */
export function IconCut() {
  const iso = makeIso(7, 58, 52);
  return (
    <svg viewBox="0 0 136 96" className="rc-kpi-ico" aria-hidden="true">
      <Box iso={iso} x={0} y={0} w={8} d={3.4} h={0.3} fill={ramp.ghost} />
      <Box iso={iso} x={0.8} y={0.8} z={0.3} w={2.2} d={1.8} h={7.2} fill={ramp.navy} />
      <Box iso={iso} x={4.6} y={0.8} z={0.3} w={2.2} d={1.8} h={3.0} fill={ramp.teal} />
    </svg>
  );
}

/** 5배 = 같은 공장, 전기만 다를 때 기둥 높이 다섯 칸 대 한 칸 */
export function IconFive() {
  const iso = makeIso(7, 56, 50);
  return (
    <svg viewBox="0 0 136 96" className="rc-kpi-ico" aria-hidden="true">
      <Box iso={iso} x={0} y={0} w={8} d={3.4} h={0.3} fill={ramp.ghost} />
      {[0, 1, 2, 3, 4].map((k) => (
        <Box key={k} iso={iso} x={0.8} y={0.8} z={0.3 + k * 1.45} w={2.2} d={1.8} h={1.3} fill={ramp.amber} />
      ))}
      <Box iso={iso} x={4.6} y={0.8} z={0.3} w={2.2} d={1.8} h={1.3} fill={ramp.blue} />
    </svg>
  );
}

/** 1/3 = 판 세 장 가운데 한 장이 겹쳐 두 번 쌓임 */
export function IconThird() {
  const iso = makeIso(7, 50, 30);
  return (
    <svg viewBox="0 0 136 96" className="rc-kpi-ico" aria-hidden="true">
      <Box iso={iso} x={0} y={0} w={9} d={4} h={0.3} fill={ramp.ghost} />
      {[0, 1, 2].map((k) => (
        <Box key={k} iso={iso} x={0.6 + k * 2.8} y={0.8} z={0.3} w={2.3} d={2.4} h={1.0} fill={k === 2 ? ramp.amber : ramp.base} />
      ))}
      <Box iso={iso} x={6.2} y={0.8} z={1.3} w={2.3} d={2.4} h={1.0} fill={ramp.amber} />
    </svg>
  );
}
