/* 02 재사용 — 요약 카드 아이콘 · 시간 순서 아이콘 (숫자의 뜻을 그대로 그린다) */
import type { ReactNode } from "react";
import { Box, makeIso, metalRamp, ramp } from "../rc/Iso";

/** 60~80% = 세 층 계단의 가운데 */
export function IconTierMid() {
  const iso = makeIso(6, 60, 58);
  const hs = [5, 3.4, 1.8];
  return (
    <svg viewBox="0 0 136 96" className="rc-kpi-ico" aria-hidden="true">
      {[0, 1, 2].map((i) => (
        <Box key={i} iso={iso} x={i * 3.4} y={0} w={3.2} d={4} h={hs[i]} fill={i === 1 ? ramp.blue : ramp.base} />
      ))}
    </svg>
  );
}

/** 16% = 100칸 중 16칸 */
export function IconGrid16() {
  const iso = makeIso(4.2, 66, 12);
  const tiles: ReactNode[] = [];
  const cells = Array.from({ length: 100 }, (_, k) => ({ k, i: Math.floor(k / 10), j: k % 10 })).sort((a, b) => a.i + a.j - (b.i + b.j));
  for (const { k, i, j } of cells) {
    const on = i < 2 && j < 8; // 16칸
    tiles.push(<Box key={k} iso={iso} x={i * 1.1} y={j * 1.1} w={0.9} d={0.9} h={on ? 1.6 : 0.3} fill={on ? ramp.blue : ramp.base} sw={0.4} />);
  }
  return (
    <svg viewBox="0 0 136 96" className="rc-kpi-ico" aria-hidden="true">
      {tiles}
    </svg>
  );
}

/** 2~17% = 줄어드는 탄소 기둥 (재활용만 · 재사용을 거침) */
export function IconCarbon() {
  const iso = makeIso(6, 56, 72);
  return (
    <svg viewBox="0 0 136 96" className="rc-kpi-ico" aria-hidden="true">
      <Box iso={iso} x={0} y={0} w={3} d={3} h={7} fill={ramp.navy} />
      <Box iso={iso} x={4.4} y={0} w={3} d={3} h={5.9} fill={ramp.blue} />
      <Box iso={iso} x={4.4} y={0} z={5.9} w={3} d={3} h={1.1} fill={ramp.ghost} stroke="#8A93A6" dash="2 2" />
    </svg>
  );
}

/* ── 시간 순서 아이콘 ── */
export function LifeEV() {
  const iso = makeIso(6, 60, 58);
  return (
    <svg viewBox="0 0 120 90" className="rs-life-ico" aria-hidden="true">
      <Box iso={iso} x={0} y={0} w={7} d={3.2} h={1.4} fill={ramp.blue} />
      <Box iso={iso} x={1.4} y={0.3} z={1.4} w={3.6} d={2.6} h={1.1} fill={ramp.navy} />
      <Box iso={iso} x={0.6} y={0.6} z={-0.2} w={5.8} d={2} h={0.25} fill={ramp.amber} />
    </svg>
  );
}
export function LifeESS() {
  const iso = makeIso(6, 60, 62);
  return (
    <svg viewBox="0 0 120 90" className="rs-life-ico" aria-hidden="true">
      <Box iso={iso} x={0} y={0} w={6} d={3} h={3.4} fill={ramp.base} />
      <Box iso={iso} x={0} y={0} z={3.4} w={6} d={3} h={0.3} fill={ramp.blue} />
      <Box iso={iso} x={1} y={0.4} z={3.7} w={4} d={2.2} h={0.15} fill={["#2E4BC6", "#2B3F9E", "#22337F"]} />
    </svg>
  );
}
export function LifeRecycle() {
  const iso = makeIso(6, 60, 62);
  const xs: [number, string][] = [
    [0, "#2BB594"],
    [2.2, "#C23D69"],
    [4.4, "#F2BFCB"],
  ];
  return (
    <svg viewBox="0 0 120 90" className="rs-life-ico" aria-hidden="true">
      <Box iso={iso} x={-0.4} y={-0.4} w={7} d={3} h={0.4} fill={ramp.base} />
      {xs.map(([x, c]) => (
        <Box key={c} iso={iso} x={x} y={0.4} z={0.4} w={1.6} d={1.6} h={1.6} fill={metalRamp(c)} />
      ))}
    </svg>
  );
}
