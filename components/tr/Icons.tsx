/* 09 이력관리 — 요약 카드 아이콘 (숫자의 뜻을 그대로 그린다) */
import { Box, EDGE, makeIso, ramp } from "../rc/Iso";

const QR = [
  [1, 1, 1, 0, 1, 0, 1, 1, 1],
  [1, 1, 1, 0, 0, 1, 1, 1, 1],
  [1, 1, 1, 0, 1, 0, 1, 1, 1],
  [0, 0, 0, 1, 1, 0, 0, 0, 0],
  [1, 0, 1, 1, 0, 1, 1, 0, 1],
  [0, 1, 0, 0, 1, 1, 0, 1, 0],
  [1, 1, 1, 0, 0, 1, 0, 1, 1],
  [1, 1, 1, 0, 1, 0, 1, 0, 0],
  [1, 1, 1, 0, 1, 1, 0, 1, 1],
];

/** 2027.2 = 식별 무늬(QR)가 붙은 팩 — 여권은 이 무늬로 연다 */
export function IconPassport() {
  const iso = makeIso(6, 62, 40);
  const { P, pts } = iso;
  const z = 1.6 + 0.12;
  const c = 3.2 / 9;
  return (
    <svg viewBox="0 8 136 96" className="rc-kpi-ico" aria-hidden="true">
      <Box iso={iso} x={0} y={0} w={7} d={5} h={1.6} fill={ramp.navy} />
      <Box iso={iso} x={2.4} y={0.9} z={1.6} w={3.6} d={3.6} h={0.12} fill={ramp.base} />
      {QR.flatMap((row, i) =>
        row.map((b, j) =>
          b ? (
            <polygon
              key={`${i}-${j}`}
              points={pts([P(2.6 + i * c, 1.1 + j * c, z), P(2.6 + (i + 1) * c, 1.1 + j * c, z), P(2.6 + (i + 1) * c, 1.1 + (j + 1) * c, z), P(2.6 + i * c, 1.1 + (j + 1) * c, z)])}
              fill="#1F2A44"
            />
          ) : null
        )
      )}
      <Box iso={iso} x={0.5} y={1.2} z={1.6} w={1.2} d={2.6} h={0.5} fill={ramp.amber} />
    </svg>
  );
}

/** 3번 = 시간에 따라 낮아지는 SOH 기록 세 개 */
export function IconThree() {
  const iso = makeIso(6, 40, 78);
  const h = [6.2, 5.1, 3.8];
  return (
    <svg viewBox="-7.5 33.5 136 96" className="rc-kpi-ico" aria-hidden="true">
      <Box iso={iso} x={0} y={0} w={11} d={3} h={0.4} fill={ramp.ghost} />
      {h.map((v, k) => (
        <Box key={k} iso={iso} x={0.8 + k * 3.6} y={0.6} z={0.4} w={2.2} d={1.8} h={v} fill={k === 2 ? ramp.amber : ramp.teal} />
      ))}
    </svg>
  );
}

/** 2.24%p = 검사대 화면에 예측(선)과 실제(막대)가 거의 겹침 */
export function IconInspect() {
  const iso = makeIso(6, 44, 80);
  const { P, pts } = iso;
  // 세운 화면의 왼쪽 면(y = d)에 막대 · 선을 그린다
  const face = (x0: number, x1: number, z0: number, z1: number) => pts([P(x0, 1, z0), P(x1, 1, z0), P(x1, 1, z1), P(x0, 1, z1)]);
  const bars = [5.2, 4.5, 3.6, 2.9];
  return (
    <svg viewBox="2 28.5 136 96" className="rc-kpi-ico" aria-hidden="true">
      <Box iso={iso} x={0} y={-2} w={10} d={4} h={0.5} fill={ramp.base} />
      <Box iso={iso} x={0.5} y={0} z={0.5} w={9} d={1} h={7} fill={ramp.base} />
      <polygon points={face(1.1, 8.9, 1.0, 7.0)} fill="#2B3656" stroke={EDGE} strokeWidth={0.6} />
      {bars.map((b, k) => (
        <polygon key={k} points={face(1.7 + k * 1.8, 2.9 + k * 1.8, 1.4, 1.4 + b)} fill={k === 3 ? "#F3B64A" : "#39C6B6"} />
      ))}
      <polyline points={[0, 1, 2, 3].map((k) => P(2.3 + k * 1.8, 1, 1.4 + bars[k] + 0.25).map((v) => v.toFixed(1)).join(",")).join(" ")} fill="none" stroke="#C9D6FF" strokeWidth={1.6} strokeLinejoin="round" />
    </svg>
  );
}
