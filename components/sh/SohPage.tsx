import Link from "next/link";
import Footer from "@/components/Footer";
import { Cite } from "../rc/Cite";
import { RcToc } from "../rc/Interactive";
import { NextNav, RefsSection, TopicHead, type Kpi } from "../rc/kit";
import { collectCited } from "../rc/sources";
import { facts, glossary, law, reasons, stepSrc, steps, toc } from "./data";
import { IconLaw, IconPulse, IconTiers } from "./Icons";
import { KneeFig, SohMap, SpeedCards } from "./Parts";
import line from "./line.json";
import motion from "./motion.json";

const icons = [<IconPulse key="a" />, <IconTiers key="b" />, <IconLaw key="c" />];
const kpis: Kpi[] = facts.map((f, i) => ({ ...f, icon: icons[i] }));

const { papers, other } = collectCited(facts.flatMap((f) => f.src), stepSrc, ["R", "P3", 23, 38, 50, 51, 52, 53, 54]);

export default function SohPage() {
  return (
    <div className="rc">
      <main id="main">
        <TopicHead
          slug="soh-diagnosis"
          sub="세 갈래 길의 입구"
          papers={papers.length}
          kpis={kpis}
          lead="떼어 낸 배터리가 재제조 · 재사용 · 재활용 중 어디로 갈지는 남은 성능을 얼마나 빨리, 정확하게 재느냐에 달려 있습니다. 정밀한 시험은 이미 있지만 너무 느려서, 짧은 시험과 기계학습으로 대량 선별하는 방법이 연구되고 있습니다. 한국에서는 2027년 5월부터 탈거 전 성능평가가 법적 의무가 됩니다."
        />

        <div className="rc-wrap rc-body">
          <RcToc items={toc} />

          <div className="rc-main">
            {/* ── 1 왜 어려운가 ── */}
            <section id="sh-hard" className="rc-sec" aria-labelledby="h-hard">
              <h2 id="h-hard" className="rc-h2">
                <span>1</span>왜 어려운가
              </h2>
              <p>
                은퇴 배터리의 건강 상태를 매기기 어려운 이유를 한 리뷰는 네 가지로 정리합니다. 이 리뷰는 아직 동료심사 전 프리프린트입니다. <Cite src={[23]} />
              </p>
              <ol className="rc-panel sh-reasons">
                {reasons.map((r, i) => (
                  <li key={r.t}>
                    <b>{i + 1}</b>
                    <div>
                      <p className="t">{r.t}</p>
                      <p className="d">{r.d}</p>
                    </div>
                  </li>
                ))}
              </ol>
              <div className="sh-cards">
                <aside className="rc-note" aria-label="가장 약한 셀">
                  <h3>팩은 가장 약한 셀을 따라간다</h3>
                  <p>
                    직렬로 묶인 팩은 충전할 때 가장 먼저 차는 셀에서, 방전할 때 가장 먼저 비는 셀에서 멈춥니다. 팩 평균이 괜찮아도 셀 하나가 약하면 팩 전체가 그 셀에 묶이므로, 팩 값
                    하나로는 등급을 매길 수 없습니다. 지친 모듈만 골라 바꾸는 과정은 <Link href="/topics/remanufacturing">01 재제조</Link>에서 다룹니다. <Cite src={[38]} />
                  </p>
                </aside>
                <aside className="rc-note sh-knee-card" aria-label="무릎점">
                  <h3>무릎을 지났는가</h3>
                  <KneeFig />
                  <p>
                    용량은 한동안 천천히 줄다가 어느 지점부터 급격히 떨어집니다. 이 &lsquo;무릎&rsquo;의 원인과 정의는 한 리뷰가 정리했고, 서울대 · 현대차그룹 공동연구진은 서로 다른 충전
                    속도에서 잰 용량 차이의 분산 한 번으로 셀이 무릎 근처인지 가려 재사용과 재활용을 나누는 방법을 제시했습니다. <Cite src={[53, 54]} />
                  </p>
                </aside>
              </div>
            </section>

            {/* ── 2 진단 라인 지도 ── */}
            <section id="sh-map" className="rc-sec" aria-labelledby="h-map">
              <h2 id="h-map" className="rc-h2">
                <span>2</span>진단 라인 — 어디로 보낼지 정하는 곳
              </h2>
              <p>
                차에 달린 채로 먼저 평가하고, 떼어 낸 뒤 겉모습과 안전을 보고, 짧은 시험으로 모듈마다 상태를 재서 등급을 매깁니다. 등급에 따라 세 출구로 갈라집니다. <Cite src={stepSrc} />
              </p>
              <SohMap
                steps={steps}
                groups={[
                  { label: "진단", tag: "평가 · 점검 · 시험 · 판정" },
                  { label: "출구", tag: "세 갈래" },
                ]}
                mid="등급에 따라"
                plant={line}
                motion={motion}
                motionSrc="/sh/line"
                img="/sh/line"
                mask="/sh/mask_"
                title="진단 라인 지도"
                sub="탈거 전 평가 · 점검 · 빠른 진단 · 등급 판정 · 세 출구"
                keys={[
                  { k: "g0", label: "진단" },
                  { k: "g1", label: "출구" },
                  { k: "flow", label: "배터리의 이동" },
                ]}
                capId="line-cap"
                caption={
                  <>
                    그림 2. 번호를 누르면 그 단계만 밝아지고 아래에 무엇이 들어가 무엇이 나오는지가 뜹니다. &lsquo;공정 재생&rsquo;을 누르면 네 단계를 지난 뒤 세 출구를 한 갈래씩
                    차례로 지나갑니다. 장면과 움직임은 이 사이트가 Blender로 직접 만든 설명용 도식이며 실제 설비 배치와 다릅니다. <Cite src={stepSrc} />
                  </>
                }
              />
            </section>

            {/* ── 3 빠름 vs 정확함 ── */}
            <section id="sh-speed" className="rc-sec" aria-labelledby="h-speed">
              <h2 id="h-speed" className="rc-h2">
                <span>3</span>빠름 vs 정확함
              </h2>
              <p>
                완전 충방전 시험은 가장 정확하지만 오래 걸립니다. 그래서 짧은 펄스나 임피던스 측정으로 얻은 신호를 기계학습 모델에 넣어 잔존용량을 추정하고, 부족한 데이터는
                생성 모델로 채우는 연구가 이어지고 있습니다. <Cite src={[23, 50, 51, 52]} />
              </p>
              <SpeedCards />
            </section>

            {/* ── 4 제도가 된 기술 ── */}
            <section id="sh-law" className="rc-sec" aria-labelledby="h-law">
              <h2 id="h-law" className="rc-h2">
                <span>4</span>제도가 된 기술
              </h2>
              <p>
                2026년 5월 26일 공포된 「사용후 배터리의 관리 및 산업육성에 관한 법률」은 2027년 5월 27일 시행됩니다. 진단은 이 법의 3단계 점검 가운데 첫 단계입니다. 세부 기준은 하위
                법령에서 정해집니다. <Cite src={["P3"]} />
              </p>
              <figure className="rc-panel sh-law" aria-labelledby="sh-law-cap">
                <ol>
                  {law.map((l, i) => (
                    <li key={l.art} className={i === 0 ? "cur" : undefined}>
                      <span className="art">{l.art}</span>
                      <p className="t">
                        {l.t}
                        {i === 0 ? <em>이 페이지</em> : null}
                      </p>
                      <p className="d">
                        {l.who} · {l.when}
                      </p>
                    </li>
                  ))}
                </ol>
                <figcaption id="sh-law-cap">
                  그림 5. 법률 제21683호 제14~16조. 정부 발표에 따르면 탈거 전 평가에서 재제조 · 재사용 기준을 충족한 배터리는 떼어 낸 때부터 폐기물이 아닌 제품으로 인정됩니다.{" "}
                  <Cite src={["P3", "R"]} />
                </figcaption>
              </figure>
              <div className="sh-links">
                <Link href="/topics/safety" className="sh-link">
                  <b>06</b>
                  <span>
                    <strong>안전 관리</strong>유통 전 안전검사 · 정기 안전검사와 보관 · 운송 안전
                  </span>
                </Link>
                <Link href="/topics/traceability" className="sh-link">
                  <b>09</b>
                  <span>
                    <strong>이력관리</strong>진단 결과가 쌓이는 배터리 여권 · 전주기 이력관리
                  </span>
                </Link>
              </div>
            </section>

            {/* ── 5 용어 ── */}
            <section id="sh-terms" className="rc-sec" aria-labelledby="h-terms">
              <h2 id="h-terms" className="rc-h2">
                <span>5</span>용어
              </h2>
              <dl className="rc-panel sh-terms">
                {glossary.map((g) => (
                  <div key={g.t}>
                    <dt>{g.t}</dt>
                    <dd>{g.d}</dd>
                  </div>
                ))}
              </dl>
            </section>

            <RefsSection papers={papers} other={other} note={<>보강 — 50~54번 문헌은 2026년 9월 이 페이지를 개편하며 추가했습니다. 54번은 국내 연구입니다. 23번은 동료심사 전 프리프린트입니다.</>} />
            <NextNav slug="soh-diagnosis" />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
