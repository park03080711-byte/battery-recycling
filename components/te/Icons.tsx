/* 12 기술경제성 분석 — 요약 카드 아이콘 (숫자의 뜻을 그대로 그린다) */
import { Box, makeIso, metalRamp, ramp } from "../rc/Iso";

const coral = metalRamp("#E0715A");

/** −21 ~ +22 = 바닥 판 아래로 내려간 손해 기둥(산호)과 위로 올라간 이익 기둥(청록) */
export function IconRange() {
  const iso = makeIso(7, 58, 44);
  return (
    <svg viewBox="0 0 136 96" className="rc-kpi-ico" aria-hidden="true">
      <Box iso={iso} x={0.8} y={0.8} z={-3.2} w={2.2} d={1.8} h={3.2} fill={coral} />
      <Box iso={iso} x={0} y={0} w={8} d={3.4} h={0.3} fill={ramp.ghost} />
      <Box iso={iso} x={4.6} y={0.8} z={0.3} w={2.2} d={1.8} h={3.3} fill={ramp.teal} />
    </svg>
  );
}

/** 16배 = 시급 동전 한 장 대 열여섯 장 */
export function IconWage() {
  const iso = makeIso(7, 56, 54);
  return (
    <svg viewBox="0 0 136 96" className="rc-kpi-ico" aria-hidden="true">
      <Box iso={iso} x={0} y={0} w={8} d={3.4} h={0.3} fill={ramp.ghost} />
      <Box iso={iso} x={0.8} y={0.8} z={0.3} w={2.2} d={1.8} h={0.42} fill={ramp.amber} />
      {Array.from({ length: 16 }, (_, k) => (
        <Box key={k} iso={iso} x={4.6} y={0.8} z={0.3 + k * 0.42} w={2.2} d={1.8} h={0.42} fill={ramp.amber} sw={0.5} />
      ))}
    </svg>
  );
}

/** 1.06 = 비용 기둥(산호)과 거의 같은 높이의 수익 기둥(청록) — 꼭대기 한 칸만 더 */
export function IconBC() {
  const iso = makeIso(7, 58, 52);
  return (
    <svg viewBox="0 0 136 96" className="rc-kpi-ico" aria-hidden="true">
      <Box iso={iso} x={0} y={0} w={8} d={3.4} h={0.3} fill={ramp.ghost} />
      <Box iso={iso} x={0.8} y={0.8} z={0.3} w={2.2} d={1.8} h={5.0} fill={coral} />
      <Box iso={iso} x={4.6} y={0.8} z={0.3} w={2.2} d={1.8} h={5.0} fill={ramp.teal} />
      <Box iso={iso} x={4.6} y={0.8} z={5.3} w={2.2} d={1.8} h={0.3} fill={ramp.amber} />
    </svg>
  );
}
