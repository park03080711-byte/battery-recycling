/* 05 잔존수명 진단 — 요약 카드 아이콘 (숫자의 뜻을 그대로 그린다) */
import { Box, makeIso, ramp } from "../rc/Iso";

/** 70% 이상 단축 = 긴 기둥(완전 측정) 옆의 짧은 기둥(펄스) */
export function IconPulse() {
  const iso = makeIso(6, 50, 80);
  return (
    <svg viewBox="0 0 136 96" className="rc-kpi-ico" aria-hidden="true">
      <Box iso={iso} x={0} y={0} w={2.6} d={2.6} h={8} fill={ramp.base} />
      <Box iso={iso} x={3.8} y={0} w={2.6} d={2.6} h={2.4} fill={ramp.teal} />
    </svg>
  );
}

/** 80 · 60 = 세 층 계단 */
export function IconTiers() {
  const iso = makeIso(6, 44, 84);
  return (
    <svg viewBox="0 0 136 96" className="rc-kpi-ico" aria-hidden="true">
      <Box iso={iso} x={0} y={0} w={2.4} d={3} h={6} fill={ramp.blue} />
      <Box iso={iso} x={2.7} y={0} w={2.4} d={3} h={4} fill={ramp.teal} />
      <Box iso={iso} x={5.4} y={0} w={2.4} d={3} h={2} fill={ramp.amber} />
    </svg>
  );
}

/** 2027.5 = 법 문서 판 위에 도장 */
export function IconLaw() {
  const iso = makeIso(6, 58, 62);
  return (
    <svg viewBox="0 0 136 96" className="rc-kpi-ico" aria-hidden="true">
      <Box iso={iso} x={0} y={0} w={6.4} d={4.6} h={0.35} fill={ramp.ghost} />
      <Box iso={iso} x={0.4} y={0.4} z={0.35} w={5.6} d={3.8} h={0.2} fill={ramp.base} />
      <Box iso={iso} x={3.6} y={1.4} z={0.55} w={1.6} d={1.6} h={2.2} fill={ramp.navy} />
      <Box iso={iso} x={3.3} y={1.1} z={2.75} w={2.2} d={2.2} h={0.5} fill={ramp.blue} />
    </svg>
  );
}
