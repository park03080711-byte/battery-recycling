/* 실험실 페이지의 정적 그림 — 아이소메트릭 장치도 · 요약 카드 아이콘.
   사이트 공통 체계(components/rc/Iso: 30° 축 하나, 윗면 밝음 · 왼면 중간 · 오른면 어두움)를 그대로 쓴다. */
import type { ReactNode } from "react";
import { Box, EDGE, makeIso, metalRamp, ramp, type Ramp } from "../rc/Iso";

const INK = "#172033";
const SIG = "#3b5bdb";
const TEAL = "#1a9e90";
const chip: Ramp = ["#3A3F4B", "#262A33", "#15181E"];
const heat: Ramp = ["#FBE3BE", "#F2C27E", "#E3A452"];
const led: Ramp = ["#7CF09A", "#2FBF57", "#1F9D45"];
const shunt: Ramp = ["#AFC0FD", "#7D95F8", "#5B7CFA"];

/* 부품 번호 — 그림의 표식과 아래 범례가 같은 번호를 쓴다 */
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

export function RigIso() {
  const iso = makeIso(26, 262, 104);
  const { P, pts } = iso;
  const line = (a: [number, number][], z = 0.02) => a.map(([x, y], i) => `${i ? "L" : "M"}${P(x, y, z).map((v) => v.toFixed(1)).join(",")}`).join("");
  const mark = (n: number, x: number, y: number, z: number, lift = 1.3) => {
    const [ax, ay] = P(x, y, z);
    const [bx, by] = P(x, y, z + lift);
    return (
      <g key={`m${n}`} className="lab-iso-mark">
        <line x1={ax} y1={ay} x2={bx} y2={by + 14} stroke={INK} strokeWidth={1.2} />
        <circle cx={bx} cy={by} r={15} />
        <text x={bx} y={by + 6} textAnchor="middle">
          {n}
        </text>
      </g>
    );
  };
  const waves = [6.1, 6.8].map((x, i) => {
    const [sx, sy] = P(x, 2, 1.0);
    return <path key={i} d={`M${sx},${sy} q-6,-10 0,-20 q6,-10 0,-20`} fill="none" stroke="#e3873a" strokeWidth={2} strokeLinecap="round" opacity={0.75} />;
  });
  const [gx, gy] = P(6.3, 2, 0);

  return (
    <svg viewBox="24 52 566 384" className="lab-iso" role="img" aria-labelledby="iso-t iso-d">
      <title id="iso-t">실험 장치 아이소메트릭 그림</title>
      <desc id="iso-d">
        판 위에 ESP32, 릴레이, 220옴 히터 저항, DS18B20, NTC, 22옴 션트, 10킬로옴 분압 저항, RGB LED가 놓여 있다. 굵은 선은 ESP32의 5V가 릴레이,
        히터, 션트를 지나 접지로 가는 전력 경로이고, 파란 선은 센서 신호가 ESP32로 가는 길, 점선은 릴레이 제어선, ESP32 모듈 위의 청록 물결은 PC로 가는 무선 통신이다.
      </desc>
      <defs>
        <marker id="iso-a-b" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
          <path d="M0,0 L10,5 L0,10 z" fill={SIG} />
        </marker>
        <marker id="iso-a-k" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
          <path d="M0,0 L10,5 L0,10 z" fill={INK} />
        </marker>
        <radialGradient id="iso-glow">
          <stop offset="0" stopColor="#f6a54a" stopOpacity="0.55" />
          <stop offset="1" stopColor="#f6a54a" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* 판 */}
      <Box iso={iso} x={0} y={0} z={-0.5} w={13.4} d={10} h={0.5} fill={ramp.base} />
      <polygon points={pts([P(0.4, 0.4), P(13, 0.4), P(13, 5.2), P(0.4, 5.2)])} fill="#F6F8FC" stroke="#DDE3EE" strokeDasharray="4 4" />
      <ellipse cx={gx} cy={gy} rx={70} ry={36} fill="url(#iso-glow)" />

      {/* 선: 전력(굵은 잉크) · 제어(점선) · 신호(파랑) */}
      <g fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path d={line([[2.6, 6], [2.6, 3]])} stroke={INK} strokeWidth={3.2} />
        <path d={line([[3.2, 2], [5, 2]])} stroke={INK} strokeWidth={3.2} />
        <path d={line([[7.6, 2], [9, 2]])} stroke={INK} strokeWidth={3.2} />
        <path d={line([[10.4, 2], [11.9, 2]])} stroke={INK} strokeWidth={3.2} markerEnd="url(#iso-a-k)" />
        <path d={line([[1.5, 6], [1.5, 3.1]])} stroke={INK} strokeWidth={1.6} strokeDasharray="5 4" markerEnd="url(#iso-a-k)" />
        <path d={line([[5.6, 3.0], [5.6, 5.9]])} stroke={SIG} strokeWidth={2} markerEnd="url(#iso-a-b)" />
        <path d={line([[3.9, 4.8], [3.9, 5.9]])} stroke={SIG} strokeWidth={2} markerEnd="url(#iso-a-b)" />
        <path d={line([[8.3, 2], [8.3, 5.9]])} stroke={SIG} strokeWidth={2} markerEnd="url(#iso-a-b)" />
        <path d={line([[9.75, 4.8], [9.75, 5.9]])} stroke={SIG} strokeWidth={2} markerEnd="url(#iso-a-b)" />
        <path d={line([[10, 6.5], [12.2, 6.5], [12.2, 4.5]])} stroke={INK} strokeWidth={1.6} markerEnd="url(#iso-a-k)" />
      </g>
      {(() => {
        const [x, y] = P(8.3, 2, 0.02);
        return <circle cx={x} cy={y} r={4.5} fill={INK} />;
      })()}

      {/* 부품 (뒤 → 앞) */}
      <Box iso={iso} x={1} y={1} w={2.2} d={2} h={1.6} fill={ramp.blue} />
      <Box iso={iso} x={5} y={1.6} w={2.6} d={0.8} h={0.8} fill={heat} />
      <Box iso={iso} x={9} y={1.75} w={1.4} d={0.5} h={0.5} fill={shunt} />
      <Box iso={iso} x={11.9} y={1.6} w={0.8} d={0.8} h={0.2} fill={ramp.navy} />
      <Box iso={iso} x={5.2} y={2.4} w={0.8} d={0.6} h={1.0} fill={chip} />
      <Box iso={iso} x={3.6} y={4.2} w={0.6} d={0.6} h={0.5} fill={ramp.teal} />
      <Box iso={iso} x={9.2} y={4.2} w={0.4} d={0.6} h={0.5} fill={ramp.base} />
      <Box iso={iso} x={9.9} y={4.2} w={0.4} d={0.6} h={0.5} fill={ramp.base} />
      <Box iso={iso} x={11.8} y={3.6} w={0.8} d={0.8} h={0.7} fill={led} />
      {waves}
      <Box iso={iso} x={1} y={6} w={9} d={3} h={0.6} fill={ramp.navy} />
      <Box iso={iso} x={2} y={6.6} z={0.6} w={2.6} d={1.8} h={0.3} fill={metalRamp("#D7DCE6")} />
      {Array.from({ length: 12 }, (_, i) => (
        <Box key={i} iso={iso} x={1.4 + i * 0.7} y={8.55} z={0.6} w={0.35} d={0.3} h={0.2} fill={chip} stroke="none" />
      ))}
      

      {/* 무선: ESP32 모듈에서 PC로 */}
      {(() => {
        const [cx, cy] = P(3.3, 7.5, 0.9);
        return (
          <g fill="none" stroke={TEAL} strokeWidth={2.4} strokeLinecap="round">
            {[10, 18, 26].map((r, i) => (
              <path key={r} d={`M${cx - r * 0.8},${cy - 10 - r * 0.55} A${r},${r} 0 0 1 ${cx + r * 0.8},${cy - 10 - r * 0.55}`} opacity={1 - i * 0.25} />
            ))}
            <circle cx={cx} cy={cy - 8} r={3} fill={TEAL} stroke="none" />
          </g>
        );
      })()}

      {/* 번호 표식 */}
      {mark(2, 2.1, 2, 1.6)}
      {mark(3, 7.3, 2, 0.8, 2.2)}
      {mark(4, 5.6, 2.7, 1.0, 2.2)}
      {mark(5, 3.9, 4.5, 0.5)}
      {mark(6, 9.7, 2, 0.5)}
      {mark(7, 9.75, 4.5, 0.5)}
      {mark(1, 7.6, 7.5, 0.6, 1.4)}
      {mark(8, 12.2, 4.0, 0.7)}
      {mark(9, 3.3, 7.5, 0.9, 2.9)}

      {/* 글자 표식 */}
      {(() => {
        const [x, y] = P(8.3, 2, 0);
        return (
          <text x={x + 10} y={y + 18} className="lab-iso-lbl">
            A
          </text>
        );
      })()}
      {(() => {
        const [x, y] = P(12.3, 2, 0.2);
        return (
          <text x={x + 12} y={y + 4} className="lab-iso-lbl">
            GND
          </text>
        );
      })()}
    </svg>
  );
}

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
