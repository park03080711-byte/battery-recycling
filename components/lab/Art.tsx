/* 실험실 페이지의 정적 그림 — 부품 번호 목록 · 요약 카드 아이콘.
   아이콘은 사이트 공통 체계(components/rc/Iso: 30° 축 하나, 윗면 밝음 · 왼면 중간 · 오른면 어두움)를 그대로 쓴다. */
import type { ReactNode } from "react";
import { Box, EDGE, makeIso, ramp } from "../rc/Iso";

const INK = "#172033";

/* 부품 번호 — 그림 1(3D)의 표식과 아래 목록이 같은 번호를 쓴다 */
export const rigParts = [
  { n: 1, name: "ESP32", is: "BMS 제어기", pin: "판단 · 차단 · 전송" },
  { n: 2, name: "릴레이", is: "차단기(접촉기)", pin: "GPIO22" },
  { n: 3, name: "220 Ω 저항", is: "데워지는 셀", pin: "릴레이 NO 쪽" },
  { n: 4, name: "DS18B20", is: "셀 표면 온도", pin: "GPIO13" },
  { n: 5, name: "NTC 10 kΩ", is: "주변 온도", pin: "GPIO36" },
  { n: 6, name: "22 Ω 션트", is: "전류 센서", pin: "GPIO32" },
  { n: 7, name: "10 kΩ + 10 kΩ", is: "버스 전압 분압", pin: "GPIO33" },
  { n: 8, name: "RGB LED", is: "상태 표시등", pin: "GPIO25 · 26 · 27" },
  { n: 9, name: "PC (Wi-Fi)", is: "관제 서버 · 기록", pin: "UDP 5005" },
];

/* ── 요약 카드 아이콘 (아이소메트릭) ── */
function Ico({ vb, children }: { vb: string; children: ReactNode }) {
  return (
    <svg viewBox={vb} className="rc-kpi-ico" aria-hidden="true">
      {children}
    </svg>
  );
}

/** 오르는 온도 — 계단처럼 솟는 기둥, 셋째에서 노랑 경보 */
export function IcoEarly() {
  const iso = makeIso(6, 50, 40);
  const hs = [1.2, 2.2, 3.4, 4.8];
  const top = iso.P(9.6, 1.5, 4.8 + 1.4);
  return (
    <Ico vb="0 0 150 106">
      <Box iso={iso} x={-0.6} y={-0.6} w={13} d={4.2} h={0.4} fill={ramp.ghost} />
      {hs.map((h, i) => (
        <Box key={i} iso={iso} x={i * 3.2} y={0} z={0.4} w={2.4} d={3} h={h} fill={i >= 2 ? ramp.amber : ramp.blue} />
      ))}
      <circle cx={top[0]} cy={top[1] - 8} r={10} fill="#F3B64A" stroke="#fff" strokeWidth={2.5} />
      <text x={top[0]} y={top[1] - 3.5} textAnchor="middle" fontSize={13} fontWeight={800} fill={INK}>
        !
      </text>
    </Ico>
  );
}

/** 차단 — 릴레이 블록과 열린 스위치 */
export function IcoTrip() {
  const iso = makeIso(6.4, 60, 34);
  const [ax, ay] = iso.P(9.2, 2.5, 3.1);
  return (
    <Ico vb="0 0 150 106">
      <Box iso={iso} x={-0.6} y={-0.6} w={14} d={6.4} h={0.4} fill={ramp.ghost} />
      <Box iso={iso} x={0.6} y={0.6} z={0.4} w={6} d={4.4} h={3.4} fill={ramp.blue} />
      <Box iso={iso} x={8.2} y={1.8} z={0.4} w={1.2} d={1.4} h={2.6} fill={ramp.navy} />
      <Box iso={iso} x={11.4} y={1.8} z={0.4} w={1.2} d={1.4} h={2.6} fill={ramp.navy} />
      <line x1={ax} y1={ay} x2={ax + 22} y2={ay - 22} stroke="#d03b3b" strokeWidth={4} strokeLinecap="round" />
      <circle cx={ax} cy={ay} r={4} fill="#d03b3b" stroke="#fff" strokeWidth={1.5} />
    </Ico>
  );
}

/** 모두 도착 — 줄지어 들어가는 패킷, 하나는 버퍼에서 뒤늦게 */
export function IcoDeliver() {
  const iso = makeIso(5.6, 46, 36);
  return (
    <Ico vb="0 0 150 106">
      <Box iso={iso} x={-0.4} y={-0.4} w={18} d={4.6} h={0.4} fill={ramp.ghost} />
      <Box iso={iso} x={12.6} y={0} z={0.4} w={4.6} d={3.8} h={1.2} fill={ramp.teal} />
      {[0, 2.6, 5.2, 7.8].map((x, i) => (
        <Box key={x} iso={iso} x={x} y={0.8} z={0.4 + (i === 0 ? 2.2 : 0)} w={1.9} d={1.9} h={1.9} fill={i === 0 ? ramp.ghost : ramp.blue} dash={i === 0 ? "2.5 2" : undefined} stroke={i === 0 ? "#8A93A6" : EDGE} />
      ))}
      <Box iso={iso} x={13.6} y={0.9} z={1.6} w={1.9} d={1.9} h={1.9} fill={ramp.blue} />
    </Ico>
  );
}
