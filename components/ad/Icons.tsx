/* 07 자동화 해체 — 요약 카드 아이콘 (숫자의 뜻을 그대로 그린다) */
import { Box, makeIso, ramp } from "../rc/Iso";

/** 57% = 열 칸 중 여섯 칸 가까이 채운 막대 (청록 57 · 연청록 24 · 빈칸 19) */
export function IconShare() {
  const iso = makeIso(6, 30, 58);
  const parts: [number, typeof ramp.teal][] = [
    [5.7, ramp.teal],
    [2.4, ["#E3F7F4", "#BFEDE7", "#8EDDD3"]],
    [1.9, ramp.ghost],
  ];
  let x = 0;
  return (
    <svg viewBox="0 0 136 96" className="rc-kpi-ico" aria-hidden="true">
      {parts.map(([w, f], i) => {
        const b = <Box key={i} iso={iso} x={x} y={0} w={w} d={2.2} h={2.2} fill={f} />;
        x += w;
        return b;
      })}
    </svg>
  );
}

/** 약 2배 = 사람 기둥(높음 · 시간이 오래)과 로봇 기둥(절반) */
export function IconTwice() {
  const iso = makeIso(6, 52, 78);
  return (
    <svg viewBox="0 0 136 96" className="rc-kpi-ico" aria-hidden="true">
      <Box iso={iso} x={0} y={0} w={2.6} d={2.6} h={7.6} fill={ramp.ghost} />
      <Box iso={iso} x={3.8} y={0} w={2.6} d={2.6} h={3.8} fill={ramp.blue} />
    </svg>
  );
}

/** 46단계 = 한 단씩 올라가는 계단 */
export function IconSteps() {
  const iso = makeIso(5.6, 34, 70);
  return (
    <svg viewBox="0 0 136 96" className="rc-kpi-ico" aria-hidden="true">
      {[0, 1, 2, 3, 4, 5].map((k) => (
        <Box key={k} iso={iso} x={k * 1.6} y={0} w={1.6} d={2.6} h={0.9 + k * 1.05} fill={k === 5 ? ramp.teal : ramp.base} />
      ))}
    </svg>
  );
}
