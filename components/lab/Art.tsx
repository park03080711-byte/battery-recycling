/* 실험실 페이지의 정적 그림 — 장치 배선 블록도 · 요약 카드 아이콘. 모두 직접 그린 SVG */

const INK = "#172033";
const SUB = "#5e6678";
const SIG = "#3b5bdb";

function Box({ x, y, w, h, title, sub, tone = "#fff", strong = false }: { x: number; y: number; w: number; h: number; title: string; sub?: string; tone?: string; strong?: boolean }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={8} fill={tone} stroke={strong ? INK : "#c3c8d2"} strokeWidth={strong ? 1.6 : 1.2} />
      <text x={x + w / 2} y={y + (sub ? h / 2 - 3 : h / 2 + 5)} textAnchor="middle" fontSize={14} fontWeight={800} fill={INK}>
        {title}
      </text>
      {sub && (
        <text x={x + w / 2} y={y + h / 2 + 15} textAnchor="middle" fontSize={12} fill={SUB}>
          {sub}
        </text>
      )}
    </g>
  );
}

/* 장치 블록도: 위 줄은 전력 경로(굵은 선), 아래는 측정 신호(파란 선)와 제어(점선) */
export function RigDiagram() {
  return (
    <svg viewBox="0 0 900 420" className="lab-rig" role="img" aria-labelledby="rig-t rig-d">
      <title id="rig-t">실험 장치 블록도</title>
      <desc id="rig-d">
        ESP32의 5V가 릴레이, 220옴 히터 저항, 22옴 션트 저항을 차례로 지나 접지로 흐른다. 히터에 붙인 DS18B20이 셀 표면 온도를, 떨어진 NTC가 주변 온도를, 션트 위
        전압이 전류를, 10k 두 개의 분압이 버스 전압을 ESP32에 알린다. ESP32는 릴레이를 끊고 RGB LED로 상태를 보이며 Wi-Fi로 PC에 기록을 보낸다.
      </desc>
      <defs>
        <marker id="rig-arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M0,0 L10,5 L0,10 z" fill={SIG} />
        </marker>
        <marker id="rig-arr-k" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M0,0 L10,5 L0,10 z" fill={INK} />
        </marker>
      </defs>

      {/* 구역 이름 */}
      <text x={20} y={26} fontSize={12} fontWeight={800} fill={SUB} letterSpacing="0.08em">
        전력 경로 — 셀이 데워지는 상황을 흉내
      </text>

      {/* 전력 경로 */}
      <line x1={110} y1={80} x2={150} y2={80} stroke={INK} strokeWidth={3} />
      <line x1={270} y1={80} x2={310} y2={80} stroke={INK} strokeWidth={3} />
      <line x1={450} y1={80} x2={530} y2={80} stroke={INK} strokeWidth={3} />
      <line x1={640} y1={80} x2={680} y2={80} stroke={INK} strokeWidth={3} markerEnd="url(#rig-arr-k)" />
      <circle cx={490} cy={80} r={6} fill={INK} />
      <text x={490} y={64} textAnchor="middle" fontSize={12} fontWeight={800} fill={INK}>
        A
      </text>
      <Box x={20} y={52} w={90} h={56} title="5V0" sub="USB 전원" />
      <Box x={150} y={52} w={120} h={56} title="릴레이" sub="히터 ON / 차단" />
      <Box x={310} y={46} w={140} h={68} title="220 Ω 저항" sub="= 셀 (히터)" tone="#fff4e0" strong />
      <Box x={530} y={52} w={110} h={56} title="22 Ω 션트" sub="전류 측정용" />
      <Box x={680} y={52} w={80} h={56} title="GND" />
      <text x={380} y={38} textAnchor="middle" fontSize={12} fill={SUB}>
        약 19.6 mA · 실측 약 210 Ω
      </text>

      {/* 센서 */}
      <Box x={310} y={160} w={140} h={60} title="DS18B20" sub="셀 표면 온도" tone="#eef2ff" />
      <line x1={380} y1={114} x2={380} y2={160} stroke={SIG} strokeWidth={1.5} strokeDasharray="3 3" />
      <text x={388} y={146} fontSize={11} fill={SIG}>
        저항에 기대 놓음
      </text>
      <Box x={150} y={160} w={120} h={60} title="NTC" sub="주변 온도" tone="#eef2ff" />
      <Box x={530} y={160} w={110} h={60} title="10k + 10k" sub="버스 전압 분압" tone="#eef2ff" />
      <line x1={490} y1={86} x2={490} y2={300} stroke={SIG} strokeWidth={1.5} markerEnd="url(#rig-arr)" />
      <text x={498} y={146} fontSize={11} fill={SIG}>
        A점 전압 ÷ 22 Ω = 전류
      </text>

      {/* ESP32 */}
      <rect x={150} y={300} width={490} height={92} rx={10} fill={INK} />
      <text x={170} y={330} fontSize={15} fontWeight={800} fill="#fff">
        ESP32
      </text>
      <text x={170} y={352} fontSize={12} fill="#c9d3ea">
        0.5초마다 측정 → 걸러내기 → 4단계 판정 · 4 °C 도달 예측
      </text>
      <text x={170} y={372} fontSize={12} fill="#c9d3ea">
        위험이면 즉시 릴레이 차단 (다시 켜기 전까지 잠금)
      </text>
      {/* 센서 → ESP32 */}
      <line x1={210} y1={220} x2={210} y2={300} stroke={SIG} strokeWidth={1.5} markerEnd="url(#rig-arr)" />
      <text x={216} y={284} fontSize={11} fill={SIG}>
        GPIO36
      </text>
      <line x1={380} y1={220} x2={380} y2={300} stroke={SIG} strokeWidth={1.5} markerEnd="url(#rig-arr)" />
      <text x={386} y={284} fontSize={11} fill={SIG}>
        GPIO13
      </text>
      <text x={498} y={284} fontSize={11} fill={SIG}>
        GPIO32
      </text>
      <line x1={585} y1={220} x2={585} y2={300} stroke={SIG} strokeWidth={1.5} markerEnd="url(#rig-arr)" />
      <text x={591} y={284} fontSize={11} fill={SIG}>
        GPIO33
      </text>
      {/* 제어 */}
      <path d="M150,346 H120 V136 H210 V110" fill="none" stroke={INK} strokeWidth={1.5} strokeDasharray="6 4" markerEnd="url(#rig-arr-k)" />
      <text x={112} y={290} fontSize={11} fill={INK} transform="rotate(-90 112 290)">
        GPIO22 제어
      </text>

      {/* 출력 */}
      <line x1={640} y1={326} x2={700} y2={326} stroke={INK} strokeWidth={1.5} markerEnd="url(#rig-arr-k)" />
      <line x1={640} y1={366} x2={700} y2={366} stroke={INK} strokeWidth={1.5} markerEnd="url(#rig-arr-k)" />
      <g>
        <rect x={700} y={304} width={180} height={42} rx={8} fill="#fff" stroke="#c3c8d2" />
        <circle cx={722} cy={325} r={7} fill="#2fdc5a" />
        <circle cx={740} cy={325} r={7} fill="#ffd23a" />
        <circle cx={758} cy={325} r={7} fill="#ff3b30" />
        <text x={774} y={330} fontSize={13} fontWeight={800} fill={INK}>
          RGB LED
        </text>
      </g>
      <g>
        <rect x={700} y={350} width={180} height={42} rx={8} fill="#fff" stroke="#c3c8d2" />
        <text x={714} y={376} fontSize={13} fontWeight={800} fill={INK}>
          Wi-Fi → PC 기록
        </text>
      </g>
    </svg>
  );
}

/* 요약 카드 아이콘 (rc-kpi-ico 136×96) */
export function IcoBell() {
  return (
    <svg className="rc-kpi-ico" viewBox="0 0 136 96" aria-hidden="true">
      <path d="M8 78 H128" stroke="#c3c8d2" strokeWidth={1.5} />
      <path d="M14 74 C40 72 52 60 64 46 S92 18 120 14" fill="none" stroke="#5b7cfa" strokeWidth={3} strokeLinecap="round" />
      <path d="M8 44 H128" stroke="#f3b64a" strokeWidth={2} strokeDasharray="5 4" />
      <circle cx={52} cy={57} r={7} fill="#f3b64a" stroke="#fff" strokeWidth={2.5} />
      <text x={64} y={86} fontSize={11} fontWeight={800} fill="#5e6678">
        먼저 알림
      </text>
    </svg>
  );
}
export function IcoRelay() {
  return (
    <svg className="rc-kpi-ico" viewBox="0 0 136 96" aria-hidden="true">
      <rect x={30} y={30} width={56} height={40} rx={6} fill="#5b7cfa" />
      <path d="M30 30 L42 18 H98 L86 30 Z" fill="#8ea2fb" />
      <path d="M86 30 L98 18 V58 L86 70 Z" fill="#3d58c9" />
      <path d="M8 50 H30 M98 44 H112" stroke="#172033" strokeWidth={3} />
      <path d="M112 44 L124 34" stroke="#d03b3b" strokeWidth={3} strokeLinecap="round" />
      <circle cx={112} cy={44} r={3.5} fill="#172033" />
      <text x={36} y={88} fontSize={11} fontWeight={800} fill="#5e6678">
        자동 차단
      </text>
    </svg>
  );
}
export function IcoPackets() {
  return (
    <svg className="rc-kpi-ico" viewBox="0 0 136 96" aria-hidden="true">
      {[0, 1, 2, 3, 4].map((i) => (
        <g key={i} transform={`translate(${10 + i * 22} ${40 - (i % 2) * 6})`}>
          <path d="M0 8 L9 3 L18 8 L9 13 Z" fill="#8ea2fb" />
          <path d="M0 8 V20 L9 25 V13 Z" fill="#5b7cfa" />
          <path d="M18 8 V20 L9 25 V13 Z" fill="#3d58c9" />
        </g>
      ))}
      <path d="M8 74 H128" stroke="#39c6b6" strokeWidth={3} strokeLinecap="round" />
      <path d="M118 66 L128 74 L118 82" fill="none" stroke="#39c6b6" strokeWidth={3} strokeLinecap="round" />
      <text x={10} y={92} fontSize={11} fontWeight={800} fill="#5e6678">
        빠짐없이 전달
      </text>
    </svg>
  );
}
