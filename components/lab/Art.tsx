/* 실험실 페이지의 정적 그림 — 부품 번호 목록 · 요약 카드 미니 그래프.
   요약 카드 그림은 실측 기록(data/lab/essData)으로 직접 그린다. */
import type { ReactNode } from "react";
import { stage2 } from "@/data/lab/essData";

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

/* ── 요약 카드용 작은 실측 그래프 (아이콘 대신) ──
   같은 크기(200×84) · 같은 축 굵기로, 숫자가 가리키는 순간을 실제 기록 위에 표시한다. */
const VW = 200,
  VH = 84;
const T0 = stage2[0][0];
const s2 = stage2.map((r) => ({ t: r[0] - T0, dT: r[5], lv: r[9] }));
const TEND = s2[s2.length - 1].t;
const vx = (t: number) => 6 + (t / TEND) * (VW - 12);
const vy = (d: number) => VH - 14 - (Math.max(0, d) / 4.6) * (VH - 26);
const LVC = ["#1f9d55", "#e0a100", "#e8703a", "#d03b3b"];
const LVB = ["#dff1e4", "#fbf0c9", "#fbdccb", "#f6c3c3"];
const linePts = (rows: typeof s2) => rows.map((r) => `${vx(r.t).toFixed(1)},${vy(r.dT).toFixed(1)}`).join(" ");

function Viz({ label, children }: { label: string; children: ReactNode }) {
  return (
    <svg viewBox={`0 0 ${VW} ${VH}`} className="lab-kpi-viz" role="img" aria-label={label}>
      <line x1={6} x2={VW - 6} y1={VH - 14} y2={VH - 14} stroke="#c3c8d2" strokeWidth={1} />
      {children}
    </svg>
  );
}

/** 11초: 오르기 시작한 곡선과 첫 경보 지점 */
export function VizFirstAlert() {
  const tA = s2.find((r) => r.lv >= 1)!;
  const before = s2.filter((r) => r.t <= tA.t);
  return (
    <Viz label="히터를 켠 뒤 ΔT 곡선. 11초에 주의 경보, 위험 기준 4도 점선은 아직 멀다.">
      <line x1={6} x2={VW - 6} y1={vy(4)} y2={vy(4)} stroke={LVC[3]} strokeWidth={1.2} strokeDasharray="4 3" />
      <text x={VW - 6} y={vy(4) - 4} textAnchor="end" className="lab-viz-t">
        위험 4 °C
      </text>
      <polyline points={linePts(s2)} fill="none" stroke="#c3c8d2" strokeWidth={1.6} />
      <polyline points={linePts(before)} fill="none" stroke="#3b5bdb" strokeWidth={2.2} strokeLinejoin="round" />
      <line x1={vx(tA.t)} x2={vx(tA.t)} y1={vy(tA.dT) - 4} y2={VH - 14} stroke={LVC[1]} strokeWidth={1.2} />
      <circle cx={vx(tA.t)} cy={vy(tA.dT)} r={5} fill={LVC[1]} stroke="#fff" strokeWidth={2} />
      <text x={vx(tA.t) + 8} y={vy(tA.dT) - 6} className="lab-viz-t strong">
        주의 {Math.round(tA.t)} s
      </text>
      <text x={6} y={VH - 2} className="lab-viz-t">
        히터 켬
      </text>
    </Viz>
  );
}

/** 65초: 단계 색 띠 위의 곡선과 차단 지점 */
export function VizTrip() {
  const tD = s2.find((r) => r.lv >= 3)!;
  return (
    <Viz label="정상, 주의, 경고, 위험 단계 색 띠 위로 ΔT가 오르고 65초 위험에서 히터가 차단된다.">
      {s2.slice(0, -1).map((r, i) => (
        <rect key={i} x={vx(r.t)} y={8} width={vx(s2[i + 1].t) - vx(r.t) + 0.4} height={VH - 22} fill={LVB[r.lv]} />
      ))}
      <polyline points={linePts(s2)} fill="none" stroke="#172033" strokeWidth={2} strokeLinejoin="round" />
      <line x1={vx(tD.t)} x2={vx(tD.t)} y1={8} y2={VH - 14} stroke={LVC[3]} strokeWidth={1.6} />
      <g transform={`translate(${vx(tD.t)} ${vy(tD.dT)})`}>
        <circle r={7} fill={LVC[3]} stroke="#fff" strokeWidth={2} />
        <path d="M-2.6,-2.6 L2.6,2.6 M2.6,-2.6 L-2.6,2.6" stroke="#fff" strokeWidth={1.8} strokeLinecap="round" />
      </g>
      <text x={vx(tD.t) - 10} y={20} textAnchor="end" className="lab-viz-t strong">
        차단 {Math.round(tD.t)} s
      </text>
      <text x={6} y={VH - 2} className="lab-viz-t">
        정상 → 주의 → 경고 → 위험
      </text>
    </Viz>
  );
}

/** 616/616: 순번 띠 — 끊겼던 두 구간도 모두 도착 */
export function VizDeliver() {
  const x = (s: number) => 6 + (s / 616) * (VW - 12);
  const gaps = [
    { a: 0, b: 131, n: 131 },
    { a: 501, b: 551, n: 50 },
  ];
  return (
    <Viz label="순번 0부터 615까지 616개가 모두 도착. 끊긴 동안 쌓인 131개와 50개도 다시 연결된 뒤 전달됐다.">
      {Array.from({ length: 62 }, (_, i) => (
        <rect key={i} x={x(i * 10) + 0.3} y={30} width={x(10) - x(0) - 0.9} height={26} rx={1} fill="#3b5bdb" />
      ))}
      {gaps.map((g) => (
        <g key={g.a}>
          <rect x={x(g.a)} y={30} width={x(g.b) - x(g.a)} height={26} fill="#9c36b5" opacity={0.9} />
          <path d={`M${x(g.a)},24 L${x(g.a)},20 L${x(g.b)},20 L${x(g.b)},24`} fill="none" stroke="#9c36b5" strokeWidth={1.2} />
          <text x={(x(g.a) + x(g.b)) / 2} y={15} textAnchor="middle" className="lab-viz-t" fill="#7c2593">
            끊김 {g.n}개
          </text>
        </g>
      ))}
      <text x={6} y={VH - 2} className="lab-viz-t">
        순번 0
      </text>
      <text x={VW - 6} y={VH - 2} textAnchor="end" className="lab-viz-t">
        615 · 빠짐 0
      </text>
    </Viz>
  );
}
