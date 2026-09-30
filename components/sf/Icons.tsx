/* 06 안전 관리 — 요약 카드 아이콘 (숫자의 뜻을 그대로 그린다) */
import { Box, makeIso, ramp, type Ramp } from "../rc/Iso";

const warm: Ramp = ["#FFE7C2", "#FBC67A", "#F29A3A"];

/** 0.6 V 반등 = 낮은 기둥 위에 다시 올라선 주황 층 */
export function IconRebound() {
  const iso = makeIso(6, 50, 80);
  return (
    <svg viewBox="0 15 136 96" className="rc-kpi-ico" aria-hidden="true">
      <Box iso={iso} x={0} y={0} w={2.6} d={2.6} h={7.4} fill={ramp.ghost} />
      <Box iso={iso} x={3.8} y={0} w={2.6} d={2.6} h={2.2} fill={ramp.base} />
      <Box iso={iso} x={3.8} y={0} z={2.2} w={2.6} d={2.6} h={1.6} fill={warm} />
    </svg>
  );
}

/** HF = 셀 위로 피어오르는 가스 기둥 */
export function IconGas() {
  const iso = makeIso(6, 52, 74);
  return (
    <svg viewBox="0 2.4 136 96" className="rc-kpi-ico" aria-hidden="true">
      <Box iso={iso} x={0} y={0} w={3.4} d={3.4} h={4.2} fill={warm} />
      {[0, 1, 2].map((k) => {
        const p = iso.P(0.9 + k * 0.8, 1.7, 4.4);
        return <path key={k} d={`M${p[0]} ${p[1]} c -5 -8, 5 -13, 0 -22`} fill="none" stroke="#8A93A6" strokeWidth="2.4" strokeLinecap="round" />;
      })}
    </svg>
  );
}

/** 3년 = 세 번 다시 확인하는 표시 세 칸 */
export function IconCheck3() {
  const iso = makeIso(6, 44, 70);
  return (
    <svg viewBox="0 11 136 96" className="rc-kpi-ico" aria-hidden="true">
      <Box iso={iso} x={0} y={0} w={8} d={3} h={0.4} fill={ramp.ghost} />
      {[0, 1, 2].map((k) => (
        <Box key={k} iso={iso} x={0.4 + k * 2.6} y={0.5} z={0.4} w={2} d={2} h={1 + k * 1.1} fill={ramp.teal} />
      ))}
    </svg>
  );
}
