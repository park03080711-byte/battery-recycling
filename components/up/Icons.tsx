/* 04 업사이클링 — 요약 카드 아이콘 · 경로 비교 아이콘 (숫자의 뜻을 그대로 그린다) */
import { Box, makeIso, metalRamp, ramp } from "../rc/Iso";

/** ≈1,170 mAh/g = 폐PET + 폐양극으로 지은 전극 시트 */
export function IconMOF() {
  const iso = makeIso(6, 58, 58);
  return (
    <svg viewBox="0 0 136 96" className="rc-kpi-ico" aria-hidden="true">
      <Box iso={iso} x={0} y={0} w={7} d={4.4} h={0.35} fill={metalRamp("#D9895B")} />
      <Box iso={iso} x={0.3} y={0.3} z={0.35} w={6.4} d={3.8} h={0.3} fill={metalRamp("#C23D69")} />
      {[0, 1, 2].map((i) =>
        [0, 1].map((j) => <Box key={`${i}${j}`} iso={iso} x={1 + i * 2} y={0.9 + j * 1.6} z={0.65} w={0.7} d={0.7} h={0.7} fill={ramp.ghost} sw={0.5} />),
      )}
    </svg>
  );
}

/** 1,000 vs 281 사이클 = 두 기둥 */
export function IconCycles() {
  const iso = makeIso(6, 50, 80);
  return (
    <svg viewBox="0 0 136 96" className="rc-kpi-ico" aria-hidden="true">
      <Box iso={iso} x={0} y={0} w={2.6} d={2.6} h={2.2} fill={ramp.base} />
      <Box iso={iso} x={3.8} y={0} w={2.6} d={2.6} h={7.8} fill={ramp.blue} />
    </svg>
  );
}

/** 129.6 vs 13~17 $/kg = 낮은 판과 높은 기둥 */
export function IconValue() {
  const iso = makeIso(6, 50, 80);
  return (
    <svg viewBox="0 0 136 96" className="rc-kpi-ico" aria-hidden="true">
      <Box iso={iso} x={0} y={0} w={2.6} d={2.6} h={0.9} fill={ramp.navy} />
      <Box iso={iso} x={3.8} y={0} w={2.6} d={2.6} h={8.2} fill={metalRamp("#2BB594")} />
    </svg>
  );
}

/* ── 경로 비교(고리 vs 갈래)용 작은 아이콘 ── */
export function PathPack() {
  const iso = makeIso(5.4, 52, 52);
  return (
    <svg viewBox="30 35 56 50" className="up-path-ico" aria-hidden="true">
      <Box iso={iso} x={0} y={0} w={6} d={3.4} h={1.1} fill={ramp.navy} />
      {[0, 1, 2].map((i) => (
        <Box key={i} iso={iso} x={0.4 + i * 1.9} y={0.4} z={1.1} w={1.6} d={2.6} h={0.7} fill={i === 1 ? metalRamp("#F3B64A") : ramp.base} sw={0.5} />
      ))}
    </svg>
  );
}
export function PathElements() {
  const iso = makeIso(5.4, 52, 54);
  const xs: [number, string][] = [
    [0, "#2BB594"],
    [1.9, "#C23D69"],
    [3.8, "#F2BFCB"],
    [5.7, "#FAFAFA"],
  ];
  return (
    <svg viewBox="35 38 56 50" className="up-path-ico" aria-hidden="true">
      {xs.map(([x, c]) => (
        <Box key={c} iso={iso} x={x} y={0.6} w={1.4} d={1.4} h={1.4} fill={metalRamp(c)} sw={0.5} />
      ))}
    </svg>
  );
}
export function PathNewCell() {
  const iso = makeIso(5.4, 52, 52);
  return (
    <svg viewBox="30 35 56 50" className="up-path-ico" aria-hidden="true">
      <Box iso={iso} x={0} y={0} w={6} d={3.4} h={1.1} fill={ramp.navy} />
      {[0, 1, 2].map((i) => (
        <Box key={i} iso={iso} x={0.4 + i * 1.9} y={0.4} z={1.1} w={1.6} d={2.6} h={0.7} fill={ramp.blue} sw={0.5} />
      ))}
    </svg>
  );
}
export function PathMaterial() {
  const iso = makeIso(5.4, 52, 54);
  return (
    <svg viewBox="34 40 56 50" className="up-path-ico" aria-hidden="true">
      <Box iso={iso} x={0} y={0} w={3} d={3} h={0.5} fill={ramp.base} />
      <Box iso={iso} x={0.5} y={0.5} z={0.5} w={2} d={2} h={0.6} fill={metalRamp("#2BB594")} sw={0.5} />
      <Box iso={iso} x={4} y={0} w={3.2} d={2.4} h={0.3} fill={metalRamp("#D9895B")} />
      <Box iso={iso} x={4.2} y={0.2} z={0.3} w={2.8} d={2} h={0.25} fill={metalRamp("#C23D69")} sw={0.5} />
    </svg>
  );
}
export function PathDevice() {
  const iso = makeIso(5.4, 52, 58);
  return (
    <svg viewBox="24 37 56 50" className="up-path-ico" aria-hidden="true">
      <Box iso={iso} x={0} y={0} w={2} d={2} h={3.2} fill={metalRamp("#F2BFCB")} sw={0.5} />
      <Box iso={iso} x={0} y={2.6} w={2} d={2} h={3.2} fill={metalRamp("#7FDCD1")} sw={0.5} />
      <Box iso={iso} x={3.2} y={0.8} w={2.6} d={3} h={2.2} fill={ramp.navy} />
    </svg>
  );
}
