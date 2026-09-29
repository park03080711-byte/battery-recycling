/* 06 안전 관리 — 열폭주 개념도 · 전압 반등 개념도 (수치는 논문 서술을 옮긴 것만, 나머지는 개념) */
import { Box, EDGE, makeIso, ramp, type Ramp } from "../rc/Iso";

const hot: Ramp = ["#FFD9B0", "#FF9F5A", "#E4572E"];
const warm: Ramp = ["#FFF1D6", "#FBD38D", "#F3B64A"];

/** 열폭주가 번지는 순서 — 셀 셋: 과열 → 가스 · 열 → 옆 셀 */
export function RunawayFig() {
  const iso = makeIso(10, 64, 112);
  const cells: { x: number; f: Ramp; label: string }[] = [
    { x: 0, f: hot, label: "① 한 셀이 과열" },
    { x: 4.2, f: warm, label: "② 열 · 가스가 옆으로" },
    { x: 8.4, f: ramp.base, label: "③ 막지 못하면 번짐" },
  ];
  return (
    <svg viewBox="0 0 250 216" className="sf-run" role="img" aria-labelledby="sf-run-t">
      <title id="sf-run-t">열폭주 개념도. 왼쪽 셀이 과열되어 열과 가스를 내뿜고, 가운데 셀이 달아오르며, 막지 못하면 오른쪽 셀까지 번진다. 수치가 없는 개념 그림.</title>
      <Box iso={iso} x={-0.6} y={-0.6} w={13.4} d={4.4} h={0.4} fill={ramp.ghost} />
      {cells.map((c, i) => (
        <Box key={i} iso={iso} x={c.x} y={0} z={0.4} w={3.2} d={3.2} h={7} fill={c.f} stroke={EDGE} sw={0.8} />
      ))}
      {/* 가스 · 열: 첫 셀 위로 솟는 줄 */}
      {[0, 1, 2].map((k) => {
        const p = iso.P(0.8 + k * 0.8, 1.6, 7.6);
        return <path key={k} d={`M${p[0]} ${p[1]} c -6 -10, 6 -16, 0 -28`} className="sf-run-gas" />;
      })}
      {/* 옆으로 번지는 화살표 */}
      {[0, 1].map((k) => {
        const a = iso.P(3.3 + k * 4.2, 1.6, 4.4);
        const b = iso.P(4.1 + k * 4.2, 1.6, 4.4);
        return <path key={k} d={`M${a[0]} ${a[1]} L${b[0]} ${b[1]}`} className={`sf-run-arrow${k ? " faint" : ""}`} markerEnd="url(#sf-arrow)" />;
      })}
      <defs>
        <marker id="sf-arrow" viewBox="0 0 8 8" refX="6" refY="4" markerWidth="6" markerHeight="6" orient="auto">
          <path d="M0 0 L8 4 L0 8 z" fill="#C2410C" />
        </marker>
      </defs>
      {cells.map((c, i) => {
        const p = iso.P(c.x + 1.6, 1.6, 7.4);
        return (
          <g key={i}>
            <circle cx={p[0]} cy={p[1] - 4} r="9" className="sf-run-n" />
            <text x={p[0]} y={p[1]} textAnchor="middle" className="sf-run-nt">
              {i + 1}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export function RunawayLegend() {
  return (
    <ol className="sf-run-legend">
      <li>
        <b>1</b>한 셀이 과열 — 안에서 열을 내는 반응이 스스로 빨라짐
      </li>
      <li>
        <b>2</b>뜨거운 가스 · 열이 옆 셀로
      </li>
      <li>
        <b>3</b>막지 못하면 옆 셀도 열폭주 — 셀 사이 간격 · 차단재가 이를 늦춤
      </li>
    </ol>
  );
}

/** 셀 안에서 스스로 커지는 고리 — 음극 에틸렌 ↔ 양극 산소 [60] */
export function LoopFig() {
  return (
    <svg viewBox="0 0 280 150" className="sf-loop" role="img" aria-labelledby="sf-loop-t">
      <title id="sf-loop-t">자기 증폭 고리. 흑연 음극에서 나온 에틸렌 가스가 니켈이 많은 양극으로 가 산소 방출을 일으키고, 그 산소가 다시 에틸렌 생성을 부추겨 온도가 빠르게 오른다.</title>
      <rect x="10" y="44" width="92" height="60" rx="10" className="sf-loop-box an" />
      <text x="56" y="70" textAnchor="middle" className="sf-loop-h">흑연 음극</text>
      <text x="56" y="88" textAnchor="middle" className="sf-loop-s">에틸렌 발생</text>
      <rect x="178" y="44" width="92" height="60" rx="10" className="sf-loop-box ca" />
      <text x="224" y="70" textAnchor="middle" className="sf-loop-h">니켈 많은 양극</text>
      <text x="224" y="88" textAnchor="middle" className="sf-loop-s">산소 방출</text>
      <path d="M104 56 C 130 26, 150 26, 176 56" className="sf-loop-a" markerEnd="url(#sf-la)" />
      <path d="M176 92 C 150 122, 130 122, 104 92" className="sf-loop-a" markerEnd="url(#sf-la)" />
      <text x="140" y="24" textAnchor="middle" className="sf-loop-s">에틸렌이 양극으로</text>
      <text x="140" y="136" textAnchor="middle" className="sf-loop-s">산소가 더 많은 에틸렌을</text>
      <defs>
        <marker id="sf-la" viewBox="0 0 8 8" refX="6" refY="4" markerWidth="7" markerHeight="7" orient="auto">
          <path d="M0 0 L8 4 L0 8 z" fill="#C2410C" />
        </marker>
      </defs>
    </svg>
  );
}

/** 전압 반등 개념도 — 방전 중(회로 안) 내려갔다가, 꺼내 두면 다시 오름 [57] */
export function ReboundFig() {
  // 좌표: x 0~320 (시간), y 전압 (위가 높음). 2.0 V 기준선과 +0.6 V만 논문 서술을 옮긴 값.
  return (
    <svg viewBox="0 0 320 190" className="sf-reb" role="img" aria-labelledby="sf-reb-t">
      <title id="sf-reb-t">전압 반등 개념도. 소금물 속에서 방전하는 동안 전압이 2.0 V 기준선 아래로 내려가지만, 꺼내어 두면 약 0.6 V 다시 올라 기준선을 넘는다. 기준선 외의 축 값은 개념.</title>
      <rect x="34" y="34" width="150" height="126" className="sf-reb-zone" />
      <line x1="34" y1="160" x2="310" y2="160" className="ax" />
      <line x1="34" y1="160" x2="34" y2="28" className="ax" />
      <text x="30" y="24" className="lb">전압</text>
      <text x="310" y="178" textAnchor="end" className="lb">시간 →</text>
      <text x="109" y="50" textAnchor="middle" className="lb">소금물 속 (방전 중)</text>
      <text x="247" y="50" textAnchor="middle" className="lb">꺼내어 둠</text>
      <line x1="34" y1="114" x2="310" y2="114" className="sf-reb-target" />
      <text x="40" y="130" className="lb strong">2.0 V — 파쇄 전 목표(예)</text>
      <path d="M36 62 C 80 76, 120 104, 184 124" className="sf-reb-down" />
      <path d="M184 124 C 196 96, 222 86, 306 82" className="sf-reb-up" />
      <circle cx="184" cy="124" r="4" className="sf-reb-pt" />
      <text x="190" y="146" className="lb">회로에서 잰 값</text>
      <path d="M292 122 L292 90" className="sf-reb-gap" markerEnd="url(#sf-rg)" />
      <text x="286" y="108" textAnchor="end" className="lb strong">약 +0.6 V</text>
      <defs>
        <marker id="sf-rg" viewBox="0 0 8 8" refX="4" refY="4" markerWidth="7" markerHeight="7" orient="auto">
          <path d="M0 0 L8 4 L0 8 z" fill="#C2410C" />
        </marker>
      </defs>
    </svg>
  );
}
