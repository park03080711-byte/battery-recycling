/* 08 부산물 회수 — CO₂ 상평형 개념도 (임계점 31 ℃ · 7.4 MPa만 실제 값, 나머지 축과 곡선 모양은 개념) */

export function PhaseFig() {
  // 좌표: x 온도(오른쪽이 높음), y 압력(위가 높음). 임계점 C = (196, 70).
  return (
    <svg viewBox="0 0 320 210" className="bp-phase" role="img" aria-labelledby="bp-phase-t">
      <title id="bp-phase-t">CO₂ 상평형 개념도. 온도와 압력이 임계점(31 ℃, 7.4 MPa)을 넘으면 액체와 기체의 구분이 없는 초임계 유체가 된다. 초임계 CO₂는 액체처럼 물질을 녹이고 기체처럼 퍼지며, 압력을 낮추면 기체로 날아간다. 임계점 외의 축과 곡선 모양은 개념.</title>
      <rect x="196" y="22" width="112" height="48" className="bp-phase-sc" />
      <line x1="40" y1="180" x2="310" y2="180" className="ax" />
      <line x1="40" y1="180" x2="40" y2="16" className="ax" />
      <text x="36" y="12" className="lb">압력</text>
      <text x="310" y="198" textAnchor="end" className="lb">온도 →</text>
      {/* 고체-액체 경계, 증기압 곡선, 승화 곡선 */}
      <path d="M92 150 L 78 22" className="bp-phase-line" />
      <path d="M92 150 C 130 130, 170 100, 196 70" className="bp-phase-line" />
      <path d="M44 178 C 62 170, 80 160, 92 150" className="bp-phase-line" />
      <line x1="196" y1="70" x2="196" y2="22" className="bp-phase-dash" />
      <line x1="196" y1="70" x2="308" y2="70" className="bp-phase-dash" />
      <circle cx="196" cy="70" r="4.5" className="bp-phase-cp" />
      <text x="52" y="100" className="lb strong">고체</text>
      <text x="120" y="64" className="lb strong">액체</text>
      <text x="200" y="150" className="lb strong">기체</text>
      <text x="252" y="44" textAnchor="middle" className="lb sc">초임계 유체</text>
      <text x="202" y="86" className="lb cp">임계점 31 ℃ · 7.4 MPa</text>
    </svg>
  );
}
