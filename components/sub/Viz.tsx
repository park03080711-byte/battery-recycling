"use client";

import Link from "next/link";
import { useState } from "react";
import type { VizName } from "@/data/topics";

/* ── 잔존용량에 따른 경로 분기 ── */
function Soh({ current }: { current: string }) {
  const segs = [
    { slug: "recycling", label: "재활용", from: 0, to: 60, color: "#5b6572", desc: "파·분쇄 후 유가금속 추출 · 폐기물관리법 · 환경부" },
    { slug: "reuse", label: "재사용", from: 60, to: 80, color: "#137563", desc: "ESS · UPS 등 다른 제품으로 · 친환경산업법(신설 예정)" },
    { slug: "remanufacturing", label: "재제조", from: 80, to: 100, color: "#0b4f40", desc: "본래 성능으로 복원해 다시 전기차로 · 자동차관리법" },
  ];
  const isPath = segs.some((s) => s.slug === current);
  return (
    <figure className="viz">
      <figcaption className="viz-title">잔존용량(SOH)에 따른 처리 경로 분기</figcaption>
      <div className="soh-bar" role="img" aria-label="잔존용량 60% 미만 재활용, 60~80% 재사용, 80% 이상 재제조">
        {segs.map((s) => (
          <div key={s.slug} className={isPath && s.slug !== current ? "dim" : ""} style={{ width: `${s.to - s.from}%`, background: s.color }}>
            {s.label}
          </div>
        ))}
      </div>
      <div className="soh-scale" aria-hidden="true">
        {[0, 60, 80, 100].map((v) => (
          <span key={v} style={{ left: `${v}%`, transform: v === 0 ? "none" : v === 100 ? "translateX(-100%)" : undefined }}>
            {v}%
          </span>
        ))}
      </div>
      <div className="soh-legend">
        {[...segs].reverse().map((s) => (
          <Link key={s.slug} href={`/topics/${s.slug}`} className={s.slug === current ? "current" : ""}>
            <b>
              {s.label} <small style={{ color: "var(--muted)", fontWeight: 600 }}>{s.from === 80 ? "80% 이상" : s.from === 60 ? "60~80%" : "60% 미만"}</small>
            </b>
            <span>{s.desc}</span>
          </Link>
        ))}
      </div>
      <p className="viz-cap">구분값은 일반적 기준이며 사업자와 용도에 따라 달라질 수 있습니다. 세 경로는 소관 부처와 근거 법령이 각각 다릅니다.</p>
    </figure>
  );
}

/* ── 온도 축 (시각화 2) ── */
const temps = [
  { key: "bio", label: "바이오리칭", t: "30~45℃", v: 45, pos: "up", why: "미생물이 살 수 있는 온도여야 합니다. 45℃는 황 산화 세균의 생존 한계에 가깝고, 그 대가로 수일에서 수십 일이 걸립니다." },
  { key: "hydro", label: "습식제련", t: "80℃ 안팎", v: 80, pos: "down", why: "황산과 과산화수소로 금속을 녹입니다. Yang 외(2019)는 80℃에서 30분이라는 비교적 온건한 조건으로 침출을 최적화했습니다." },
  { key: "molten", label: "용융염 (저온형)", t: "150℃", v: 150, pos: "up2", why: "염화알루미늄산염 용융염으로 융점을 낮춰 150℃에서 전해합니다. 원형인 알루미늄 제련은 약 950℃입니다." },
  { key: "direct", label: "직접재생 소성", t: "700~900℃", v: 800, pos: "down", why: "리튬을 채운 뒤 결정 구조를 정돈하는 열처리입니다. 건식보다는 낮지만 습식보다는 훨씬 높습니다." },
  { key: "pyro", label: "건식제련", t: "1,400℃ 이상", v: 1400, pos: "up", why: "배터리를 통째로 녹여 밀도 차이로 가릅니다. 유기물은 연소하고, 가벼운 리튬은 슬래그로 빠져나갑니다." },
];

function Temperature() {
  const [sel, setSel] = useState("pyro");
  const cur = temps.find((t) => t.key === sel)!;
  const max = 1400;
  return (
    <figure className="viz">
      <figcaption className="viz-title">공정별 운전 온도 — 같은 축 위에 올리면</figcaption>
      <div className="temp-axis">
        {temps.map((t) => (
          <div key={t.key} className={`temp-mark ${t.pos === "down" ? "down" : "up"}`} style={{ left: `${(t.v / max) * 100}%` }}>
            <span
              className="tl"
              style={{
                ...(t.pos === "up2" ? { bottom: 64 } : {}),
                ...(t.v <= 45 ? { left: 0, transform: "none", textAlign: "left" } : {}),
                ...(t.v >= 1400 ? { left: "auto", right: 0, transform: "none", textAlign: "right" } : {}),
              }}
            >
              {t.label}
              <small>{t.t}</small>
            </span>
            <button aria-pressed={sel === t.key} onClick={() => setSel(t.key)} aria-label={`${t.label} ${t.t} 설명 보기`} />
          </div>
        ))}
      </div>
      <div className="temp-ticks" aria-hidden="true">
        <span>0℃</span>
        <span>350℃</span>
        <span>700℃</span>
        <span>1,050℃</span>
        <span>1,400℃</span>
      </div>
      <div className="temp-detail" aria-live="polite">
        <b>
          {cur.label} · {cur.t}
        </b>
        <br />
        {cur.why}
      </div>
      <p className="viz-cap">점을 누르면 그 온도여야 하는 이유가 나옵니다. 1,400℃와 80℃는 17.5배 차이입니다. 축은 선형 눈금입니다.</p>
    </figure>
  );
}

/* ── 공정 9종 ── */
const procs = [
  { k: "상용", name: "건식제련", en: "Pyrometallurgy", d: "고온 용융 · 밀도 분리. 리튬 손실", v: 1, commercial: true },
  { k: "상용", name: "습식제련", en: "Hydrometallurgy", d: "산 침출 · 용매추출 · 결정화. 현재 표준", v: 2, commercial: true },
  { k: "준상용", name: "직접재생", en: "Direct Recycling", d: "결정 구조 보존 · 재리튬화", v: 3, commercial: true },
  { k: "준상용", name: "바이오리칭", en: "Bioleaching", d: "미생물이 만든 황산으로 침출", v: 2, commercial: true },
  { k: "연구", name: "용융염 전기환원", en: "Molten Salt", d: "알루미늄 제련 원리 · 전자를 환원제로", v: 1 },
  { k: "연구", name: "기계화학", en: "Mechanochemistry", d: "볼밀 충격으로 고체 상태 반응", v: 1 },
  { k: "연구", name: "초임계 CO₂", en: "Supercritical CO₂", d: "전해액 회수 / 금속 추출 보조", v: 1 },
  { k: "연구", name: "분자 인식 포획", en: "Molecular Recognition", d: "MOF 기공으로 Ni만 골라 잡기", v: 1 },
  { k: "연구", name: "폐기물 업사이클링", en: "Waste Upcycling", d: "원소 회수 없이 새 소재로", v: 2 },
];

function Processes() {
  return (
    <figure className="viz">
      <figcaption className="viz-title">리사이클링 공정의 9가지 분류</figcaption>
      <div className="proc-grid">
        {procs.map((p) => (
          <div key={p.name} className={`proc${p.commercial ? "" : " research"}`}>
            <span className="pk">
              {p.k} · {p.en}
            </span>
            <b>{p.name}</b>
            <p>{p.d}</p>
            <span className="var">변형 {p.v}</span>
          </div>
        ))}
      </div>
      <div className="proc-legend">
        <span>
          <i />
          상용 · 준상용
        </span>
        <span>
          <i className="d" />
          이론 · 연구 단계
        </span>
      </div>
      <p className="viz-cap">세부 변형을 모두 세면 14가지입니다. 흔히 쓰이는 건식+습식 결합 공정을 독립 공정으로 보면 10가지가 됩니다.</p>
    </figure>
  );
}

/* ── 산출물 4종 (실제 결정 색) ── */
function Crystal({ fill, stroke }: { fill: string; stroke: string }) {
  return (
    <svg viewBox="0 0 100 100" width="70%" aria-hidden="true">
      <path d="M50 8l28 18v40L50 92 22 66V26z" fill={fill} stroke={stroke} strokeWidth="2" />
      <path d="M50 8v36M22 26l28 18 28-18M50 44v48" fill="none" stroke={stroke} strokeWidth="1.5" strokeOpacity="0.6" />
      <path d="M30 32l12 7v18" fill="none" stroke="#fff" strokeOpacity="0.55" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

function Products() {
  const items = [
    { n: "황산니켈", f: "NiSO₄", fill: "#2BB594", stroke: "#0b5c49", bg: "#e3f4ee", use: "고용량 NCM·NCA 전구체" },
    { n: "황산코발트", f: "CoSO₄", fill: "#C23D69", stroke: "#7a1f3f", bg: "#f8e4eb", use: "수명 · 구조 안정성" },
    { n: "황산망간", f: "MnSO₄", fill: "#F2BFCB", stroke: "#b77384", bg: "#fbf0f3", use: "열적 안정성" },
    { n: "탄산 · 수산화리튬", f: "Li₂CO₃ / LiOH", fill: "#FAFAFA", stroke: "#8a9199", bg: "#eef0f2", use: "양극재 합성용 리튬 소스" },
  ];
  return (
    <figure className="viz">
      <figcaption className="viz-title">습식제련의 최종 산출물 — 금속마다 다른 결정 색</figcaption>
      <div className="products">
        {items.map((it) => (
          <div className="product" key={it.n}>
            <div className="crystal" style={{ background: it.bg }}>
              <Crystal fill={it.fill} stroke={it.stroke} />
            </div>
            <b>
              {it.n} <span style={{ display: "inline", fontWeight: 600 }}>{it.f}</span>
            </b>
            <span>{it.use}</span>
          </div>
        ))}
      </div>
      <p className="viz-cap">이 사이트의 주제 색(에메랄드 · 로즈)은 이 결정들의 실제 색에서 가져왔습니다.</p>
    </figure>
  );
}

/* ── EU 재생원료 의무 비율 ── */
function Eu() {
  const rows = [
    { m: "코발트", a: 16, b: 26 },
    { m: "니켈", a: 6, b: 15 },
    { m: "리튬", a: 6, b: 12 },
    { m: "납", a: 85, b: 85 },
  ];
  return (
    <figure className="viz">
      <figcaption className="viz-title">EU 배터리 규정 — 신품 배터리의 재생원료 의무 사용 비율</figcaption>
      <div className="bars">
        {rows.map((r) => (
          <div className="bar-row" key={r.m}>
            <span>{r.m}</span>
            <div className="bar-track">
              <div className="bar" aria-label={`2031년 ${r.a}%`}>
                <i style={{ width: `${r.a}%`, background: "#7fa4dc" }} />
                <em className="out" style={r.a < 12 ? { left: `calc(${r.a}% + 8px)` } : undefined}>
                  {r.a}%
                </em>
              </div>
              <div className="bar" aria-label={`2036년 ${r.b}%`}>
                <i style={{ width: `${r.b}%`, background: "#0b3f8c" }} />
                <em className={r.b < 12 ? "out" : ""} style={r.b < 12 ? { left: `calc(${r.b}% + 8px)` } : undefined}>
                  {r.b}%
                </em>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="bar-key">
        <span>
          <i style={{ background: "#7fa4dc" }} />
          2031년
        </span>
        <span>
          <i style={{ background: "#0b3f8c" }} />
          2036년 (상향)
        </span>
      </div>
      <p className="viz-cap">
        이와 별도로 폐배터리 금속 추출률 목표(2027년 리튬 50%, 코발트 · 구리 · 납 · 니켈 각 90%)가 있습니다. 출처: KOTRA 해설자료 및 언론 보도.
      </p>
    </figure>
  );
}

/* ── 발생량 전망 ── */
function Growth() {
  const data = [
    { y: "2023", v: 2355, est: false },
    { y: "2030", v: 107500, est: true },
  ];
  const max = 107500;
  return (
    <figure className="viz">
      <figcaption className="viz-title">국내 사용후 배터리 배출량 전망 (개)</figcaption>
      <div className="growth" role="img" aria-label="2023년 약 2,355개에서 2030년 10만 7,500개로 증가 전망">
        {data.map((d) => (
          <div key={d.y} className={`col${d.est ? " est" : ""}`}>
            <b>{d.v.toLocaleString("ko-KR")}</b>
            <i style={{ height: `${Math.max((d.v / max) * 100, 1.2)}%` }} />
            <span>
              {d.y}
              {d.est ? " (전망)" : ""}
            </span>
          </div>
        ))}
      </div>
      <p className="viz-cap" style={{ marginTop: 36 }}>
        막대 높이는 실제 비율 그대로입니다. 2023년 막대가 거의 보이지 않는다는 점이 곧 정보입니다. 집계 기준에 따라 2024년 3,001개 등 다른 값이 제시되기도 합니다. 출처: 환경
        당국 추정치.
      </p>
    </figure>
  );
}

/* ── 실현 가능성 ── */
function Feasibility() {
  const rows = [
    { n: "기계화학", g: 4, gl: "상", pos: "습식제련의 전처리로 결합 · 리튬 선택 회수에서 확실한 우위" },
    { n: "초임계 CO₂ (전해액)", g: 4, gl: "상", pos: "전처리 단계 신설 · 파일럿 실증 완료" },
    { n: "용융염 전기환원", g: 3, gl: "중상", pos: "폐수 규제가 강한 지역의 대안 · 에너지 약 20%↓" },
    { n: "초임계 CO₂ (금속)", g: 2, gl: "중", pos: "보류 · 회수 60%대, 산이 여전히 필요" },
    { n: "분자 인식 포획", g: 1, gl: "하", pos: "최종 정제 보조 · 선택성만 우위, 기술적으로 미해결" },
    { n: "폐기물 업사이클링", g: 1, gl: "하", pos: "LFP 등 저가치 영역 · 기술은 작동하나 시장 부재" },
  ];
  return (
    <figure className="viz">
      <figcaption className="viz-title">이론적 대안의 실현 가능성 종합 판정</figcaption>
      <div className="feas">
        {rows.map((r) => (
          <div className="feas-row" key={r.n}>
            <b>{r.n}</b>
            <div className="feas-meter" role="img" aria-label={`실현 가능성 ${r.gl}`}>
              {[1, 2, 3, 4].map((i) => (
                <i key={i} className={i <= r.g ? "on" : ""} />
              ))}
            </div>
            <span>
              <strong style={{ color: "var(--ink)" }}>{r.gl}</strong> · {r.pos}
            </span>
          </div>
        ))}
      </div>
    </figure>
  );
}

/* ── Hub & Spoke ── */
function HubSpoke() {
  return (
    <figure className="viz">
      <figcaption className="viz-title">Hub & Spoke 공정 흐름 — 국내 기업 습식제련 모델</figcaption>
      <div className="hs">
        <div className="hs-box">
          <h3>
            전처리<small>Spoke · 해외 리사이클링 파크</small>
          </h3>
          <ol>
            <li><span><b>안전 방전 · 모듈 해체</b>알루미늄 · 구리 스크랩 1차 회수</span></li>
            <li><span><b>열처리 (탈바인더)</b>전해액 휘발, 바인더 분해</span></li>
            <li><span><b>다단 파쇄 · 물리적 선별</b>자력 · 비중 선별 → 블랙파우더</span></li>
          </ol>
        </div>
        <div className="hs-arrow">
          <svg width="40" height="24" viewBox="0 0 40 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M2 12h34M28 4l8 8-8 8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          블랙파우더
          <br />
          이송
        </div>
        <div className="hs-box hub">
          <h3>
            후처리<small>Hub · 국내 하이드로 센터</small>
          </h3>
          <ol>
            <li><span><b>침출</b>황산 + 과산화수소(환원제)로 용해</span></li>
            <li><span><b>불순물 정제</b>pH 조절로 Fe · Al · Ca 침전 제거</span></li>
            <li><span><b>용매추출</b>Mn → Co → Ni 순차 분리, 순도 결정</span></li>
            <li><span><b>결정화</b>증발 · 농축으로 고순도 결정 석출</span></li>
          </ol>
        </div>
      </div>
      <p className="viz-cap">공정 설명은 기업 공개 자료와 학술 문헌(유경근, 2023 등)을 교차 검증한 내용입니다. 정부 출연연구기관(KIGAM)과 공동 개발된 공정입니다.</p>
    </figure>
  );
}

export default function Viz({ name, current }: { name: VizName; current: string }) {
  switch (name) {
    case "soh":
      return <Soh current={current} />;
    case "temperature":
      return <Temperature />;
    case "processes":
      return <Processes />;
    case "products":
      return <Products />;
    case "eu":
      return <Eu />;
    case "growth":
      return <Growth />;
    case "feasibility":
      return <Feasibility />;
    case "hubspoke":
      return <HubSpoke />;
  }
}
