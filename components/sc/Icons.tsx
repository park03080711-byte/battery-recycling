/* 13 공급망 · 자원안보 — 요약 카드 아이콘 (숫자의 뜻을 그대로 그린다) */
import { Box, makeIso, ramp } from "../rc/Iso";

/** 72% = 정제 1위 나라 기둥(남색, 높이 72)과 나머지 나라를 합친 기둥(회색, 28) */
export function IconTop() {
  const iso = makeIso(7, 58, 50);
  return (
    <svg viewBox="0 0 136 96" className="rc-kpi-ico" aria-hidden="true">
      <Box iso={iso} x={0} y={0} w={8} d={3.4} h={0.3} fill={ramp.ghost} />
      <Box iso={iso} x={0.8} y={0.8} z={0.3} w={2.2} d={1.8} h={6.5} fill={ramp.navy} />
      <Box iso={iso} x={4.6} y={0.8} z={0.3} w={2.2} d={1.8} h={2.5} fill={ramp.base} />
    </svg>
  );
}

/** 11% = 빈 통(옅은 기둥) 바닥에 청록 한 칸만 참 */
export function IconFill() {
  const iso = makeIso(7, 58, 50);
  return (
    <svg viewBox="0 0 136 96" className="rc-kpi-ico" aria-hidden="true">
      <Box iso={iso} x={0} y={0} w={8} d={3.4} h={0.3} fill={ramp.ghost} />
      <Box iso={iso} x={2.4} y={0.6} z={0.3} w={3.2} d={2.2} h={0.75} fill={ramp.teal} />
      <Box iso={iso} x={2.4} y={0.6} z={1.05} w={3.2} d={2.2} h={6.0} fill={ramp.ghost} dash="3 2" />
    </svg>
  );
}

/** 2 → 20 = 얇은 판 하나와 그 열 배 높이의 청록 기둥 */
export function IconTen() {
  const iso = makeIso(7, 58, 50);
  return (
    <svg viewBox="0 0 136 96" className="rc-kpi-ico" aria-hidden="true">
      <Box iso={iso} x={0} y={0} w={8} d={3.4} h={0.3} fill={ramp.ghost} />
      <Box iso={iso} x={0.8} y={0.8} z={0.3} w={2.2} d={1.8} h={0.6} fill={ramp.teal} />
      <Box iso={iso} x={4.6} y={0.8} z={0.3} w={2.2} d={1.8} h={6.0} fill={ramp.teal} />
    </svg>
  );
}
