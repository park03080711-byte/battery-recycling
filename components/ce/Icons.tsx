/* 10 재생원료 인증 — 요약 카드 아이콘 (숫자의 뜻을 그대로 그린다) */
import { Box, makeIso, metalRamp, ramp } from "../rc/Iso";

/** 8종 = 뚜껑 색이 다른 통 여덟 개 (원료 종류) */
const LIDS = ["#C9D5FE", "#8FA6FC", "#2BB594", "#C23D69", "#F2BFCB", "#3A4150", "#6E8F86", "#2E3B5C"];
export function IconEight() {
  const iso = makeIso(10, 50.6, 30);
  return (
    <svg viewBox="0 0 136 96" className="rc-kpi-ico" aria-hidden="true">
      <Box iso={iso} x={0} y={0} w={8} d={4} h={0.3} fill={ramp.ghost} />
      {/* 뒤쪽 줄(j=0)부터 그려야 앞이 뒤를 가린다 */}
      {[0, 1].flatMap((j) =>
        [0, 1, 2, 3].map((i) => {
          const c = LIDS[j * 4 + i];
          return (
            <g key={`${i}-${j}`}>
              <Box iso={iso} x={0.45 + i * 1.9} y={0.45 + j * 1.9} z={0.3} w={1.2} d={1.2} h={1.15} fill={ramp.base} />
              <Box iso={iso} x={0.45 + i * 1.9} y={0.45 + j * 1.9} z={1.45} w={1.2} d={1.2} h={0.22} fill={metalRamp(c)} />
            </g>
          );
        })
      )}
    </svg>
  );
}

/** 12개월 = 저울판 위 열두 칸 (한 공장 · 한 기간의 장부) */
export function IconTwelve() {
  const iso = makeIso(9, 56, 34);
  return (
    <svg viewBox="0 0 136 96" className="rc-kpi-ico" aria-hidden="true">
      <Box iso={iso} x={0} y={0} w={9} d={4.6} h={0.45} fill={metalRamp("#AEB8C9")} />
      {[0, 1].flatMap((j) =>
        [0, 1, 2, 3, 4, 5].map((i) => (
          <Box key={`${i}-${j}`} iso={iso} x={0.5 + i * 1.38} y={0.6 + j * 1.9} z={0.45} w={1.05} d={1.5} h={0.9 + ((i + j * 6) % 3) * 0.18} fill={(i + j) % 3 === 0 ? ramp.teal : ramp.blue} />
        ))
      )}
    </svg>
  );
}

/** 69/108 = 108칸 가운데 69칸이 모자람(호박색) */
export function IconScenarios() {
  const iso = makeIso(7.6, 60, 22);
  const n = 12;
  const m = 9;
  const s = 0.75;
  return (
    <svg viewBox="0 0 136 96" className="rc-kpi-ico" aria-hidden="true">
      {Array.from({ length: m }).flatMap((_, j) =>
        Array.from({ length: n }).map((__, i) => {
          const k = j * n + i;
          return <Box key={k} iso={iso} x={i * s} y={j * s} w={s * 0.86} d={s * 0.86} h={0.28} fill={k < 69 ? ramp.amber : ramp.teal} sw={0.4} />;
        })
      )}
    </svg>
  );
}
