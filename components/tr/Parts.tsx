"use client";

/* 09 이력관리 — 그림 두 개
   1) SohFig: 같은 오늘, 다른 내일 (개념도 — 축 눈금과 곡선 모양은 개념, 숫자 없음)
   2) PassportViewer: 누가 여권의 어디까지 볼 수 있나 (EU 배터리 규정 제77조 2항 · 부속서 XIII) */
import { useState } from "react";

export function SohFig() {
  // x: 시간(왼쪽 → 오른쪽), y: SOH(위가 높음). 오늘 = x 150. 문턱선 y 150.
  const A = "M40 40 C 90 52, 130 66, 150 74 S 250 112, 300 138";
  const B = "M40 40 C 90 50, 130 64, 150 74 C 170 82, 186 104, 204 150";
  return (
    <svg viewBox="0 0 330 200" className="tr-soh" role="img" aria-labelledby="tr-soh-t">
      <title id="tr-soh-t">
        개념도. 오늘 잰 SOH 한 점이 같아도, 그 뒤 천천히 줄어드는 배터리와 갑자기 꺾이는 배터리는 남은 수명이 크게 다르다. 지나온 기록이 세 점 이상 있으면 어느 쪽 곡선인지 가늠할 수 있다.
      </title>
      <line x1="34" y1="180" x2="318" y2="180" className="ax" />
      <line x1="34" y1="180" x2="34" y2="20" className="ax" />
      <text x="30" y="14" className="lb">SOH</text>
      <text x="318" y="196" textAnchor="end" className="lb">시간 →</text>
      <line x1="34" y1="150" x2="318" y2="150" className="tr-soh-th" />
      <text x="40" y="145" className="lb th">
        더 쓰기 어려운 선
      </text>
      <path d={A} className="tr-soh-a" />
      <path d={B} className="tr-soh-b" />
      {/* 지나온 기록 세 점 (B 곡선 위) */}
      {[
        [70, 45],
        [104, 56],
        [134, 67],
      ].map(([x, y]) => (
        <circle key={x} cx={x} cy={y} r="4" className="tr-soh-rec" />
      ))}
      <line x1="150" y1="20" x2="150" y2="180" className="tr-soh-now" />
      <circle cx="150" cy="74" r="6" className="tr-soh-pt" />
      <text x="156" y="30" className="lb strong">
        오늘 잰 SOH
      </text>
      <text x="316" y="96" textAnchor="end" className="lb a">
        천천히 줄어듦 → 남은 수명 김
      </text>
      <text x="212" y="166" className="lb b">
        갑자기 꺾임 → 짧음
      </text>
      <text x="62" y="32" className="lb rec">
        지나온 기록
      </text>
    </svg>
  );
}

const ROLES = [
  { id: "pub", label: "누구나", sub: "QR 코드를 찍은 사람", open: ["p1"] },
  { id: "int", label: "해체 · 재사용 · 재활용 업체", sub: "정당한 이해관계가 있는 사람", open: ["p1", "p2", "p4"] },
  { id: "auth", label: "감독 기관", sub: "인증기관 · 시장감시당국 · EU 집행위원회", open: ["p1", "p2", "p3"] },
] as const;

const PARTS = [
  {
    id: "p1",
    unit: "모델 단위",
    t: "공개 정보",
    items: ["조성(화학) · 유해물질 · 핵심원료", "탄소발자국 · 책임 있는 원료 조달", "재생원료 · 재생에너지 비율", "정격 용량 · 전압 · 출력 · 예상 수명(사이클) · 보증 기간"],
  },
  {
    id: "p2",
    unit: "모델 단위",
    t: "해체 · 수리용 정보",
    items: ["양극 · 음극 · 전해액의 상세 조성", "부품 번호 · 교체 부품 연락처", "분해도 · 분해 순서 · 체결 방식 · 필요한 공구 · 셀 수와 배치", "안전 조치"],
  },
  { id: "p3", unit: "모델 단위", t: "규정 이행 확인용", items: ["규정을 지켰음을 보여 주는 시험 보고서"] },
  {
    id: "p4",
    unit: "이 배터리 한 개",
    t: "개별 배터리 기록",
    items: ["출시 때와 상태가 바뀔 때의 성능 · 내구성 값", "SOH(잔존용량)", "상태 — 원래 · 용도 변경 · 재사용 · 재제조 · 폐기", "충방전 횟수 · 사고 같은 사건 · 온도와 충전 상태의 주기 기록"],
  },
] as const;

export function PassportViewer() {
  const [role, setRole] = useState<(typeof ROLES)[number]["id"]>("pub");
  const r = ROLES.find((x) => x.id === role)!;
  const open = new Set<string>(r.open);
  return (
    <div className="tr-pv">
      <div className="tr-pv-roles" role="group" aria-label="누구의 눈으로 볼까">
        {ROLES.map((x) => (
          <button key={x.id} type="button" aria-pressed={role === x.id} onClick={() => setRole(x.id)}>
            <b>{x.label}</b>
            <span>{x.sub}</span>
          </button>
        ))}
      </div>
      <p className="tr-pv-sum" aria-live="polite">
        <b>{r.label}</b>에게는 네 칸 가운데 <b>{r.open.length}칸</b>이 열립니다.
      </p>
      <ol className="tr-pv-card">
        {PARTS.map((p, i) => {
          const on = open.has(p.id);
          return (
            <li key={p.id} className={on ? "on" : "off"}>
              <p className="h">
                <span className="n">{i + 1}</span>
                <span className="t">{p.t}</span>
                <span className="u">{p.unit}</span>
                <span className="st">{on ? "열림" : "잠김"}</span>
              </p>
              {on ? (
                <ul>
                  {p.items.map((it) => (
                    <li key={it}>{it}</li>
                  ))}
                </ul>
              ) : (
                <p className="lock">이 사람에게는 보이지 않습니다</p>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
