import Link from "next/link";
import Footer from "@/components/Footer";
import { Cite } from "../rc/Cite";
import { RcToc } from "../rc/Interactive";
import { SystemMap } from "../rc/SystemMap";
import { NextNav, RefsSection, TopicHead, type Kpi } from "../rc/kit";
import { collectCited } from "../rc/sources";
import { facts, modelSrc, stepSrc, steps, studies, timeline, toc, why } from "./data";
import { IconEight, IconScenarios, IconTwelve } from "./Icons";
import { LedgerViewer, TargetsFig } from "./Parts";
import plant from "./map.json";
import motion from "./motion.json";

const icons = [<IconEight key="a" />, <IconTwelve key="b" />, <IconScenarios key="c" />];
const kpis: Kpi[] = facts.map((f, i) => ({ ...f, icon: icons[i] }));

const { papers, other } = collectCited(
  facts.flatMap((f) => f.src),
  why.flatMap((w) => w.src),
  stepSrc,
  modelSrc,
  studies.flatMap((s) => s.src),
  timeline.flatMap((t) => t.src),
  [79, 85, "P7"]
);

export default function CertificationPage() {
  return (
    <div className="rc">
      <main id="main">
        <TopicHead
          slug="certification"
          sub="재생원료 생산 · 사용 인증"
          papers={papers.length}
          kpis={kpis}
          asOf="2026년 11월"
          lead="폐배터리에서 되살린 니켈 · 코발트 · 리튬은 광산에서 온 것과 화학적으로 같습니다. 그래서 '재생원료'라는 말은 재서가 아니라 기록으로 증명해야 합니다. 재생원료 인증은 공장이 무엇을 얼마나 넣어 얼마나 만들었는지를 제3자가 확인해 주는 제도이고, EU가 새 배터리에 재생원료 최소 비율을 요구하면서 수출의 조건이 되고 있습니다."
        />

        <div className="rc-wrap rc-body">
          <RcToc items={toc} />

          <div className="rc-main">
            {/* ── 1 왜 인증이 필요한가 ── */}
            <section id="ce-why" className="rc-sec" aria-labelledby="h-why">
              <h2 id="h-why" className="rc-h2">
                <span>1</span>왜 인증이 필요한가 — 겉보기로는 같다
              </h2>
              <p>회수율이나 재생원료 비율이 기업 자체 발표로만 남으면, 사는 쪽도 규제하는 쪽도 그 숫자를 확인할 길이 없습니다. 인증은 이 숫자에 근거를 붙이는 일입니다.</p>
              <ul className="ce-why">
                {why.map((w) => (
                  <li key={w.k} className="rc-panel">
                    <span className="tr-who">{w.k}</span>
                    <p className="t">{w.t}</p>
                    <p className="d">
                      {w.d} <Cite src={w.src} />
                    </p>
                  </li>
                ))}
              </ul>
            </section>

            {/* ── 2 인증서가 나오는 공장 ── */}
            <section id="ce-map" className="rc-sec" aria-labelledby="h-map">
              <h2 id="h-map" className="rc-h2">
                <span>2</span>인증서가 나오는 공장 — 넣은 양 · 나온 양
              </h2>
              <p>
                국내 인증은 제품 한 통이 아니라 생산공정 단위로 합니다. 단계마다 저울이 잰 무게가 한 장부에 모이고, 그 장부를 심사해 인증서가 나옵니다. 인증서는 배터리를 만드는 쪽의
                &lsquo;함유율&rsquo; 인증과 EU 수출 서류로 이어집니다. <Cite src={stepSrc} />
              </p>
              <SystemMap
                steps={steps}
                groups={[
                  { label: "인증서가 나오기까지", tag: "재활용 공장" },
                  { label: "인증서를 쓰는 곳", tag: "국내 · 수출" },
                ]}
                mid="갈림점"
                overlays={[
                  { at: "zh", text: "투입 · 산출 기록판", kind: "zone", badge: "장부" },
                  { at: "zl", text: "사후관리 — 분기마다 서류 · 수시 현장", kind: "flow" },
                ]}
                plant={plant}
                motion={motion}
                motionSrc="/ce/map"
                img="/ce/map"
                mask="/ce/mask_"
                title="인증서가 나오는 공장"
                sub="입고 · 파쇄 · 정제 · 심사 · 소재 공장 · 수출"
                keys={[
                  { k: "g0", label: "인증서가 나오기까지" },
                  { k: "g1", label: "인증서를 쓰는 곳" },
                  { k: "flow", label: "원료의 이동" },
                ]}
                capId="map-cap"
                caption={
                  <>
                    그림 1. 번호를 누르면 그 단계만 밝아지고 아래에 무엇을 확인하는지가 뜹니다. &lsquo;공정 재생&rsquo;을 누르면 ①~③에서 저울이 무게를 재고 ④에서 서류 · 현장 · 심의를 거쳐
                    인증서에 도장이 찍힙니다. 기록은 기둥을 타고 가운데 뒤 기록판의 그 단계 줄에 막대로 그려지고(파란 점선은 데이터 선), 마지막에 분홍 길을 따라 사후관리가 공장으로
                    돌아갑니다. 막대 길이는 개념이며 실제 수치가 아닙니다. 장면과 움직임은 이 사이트가 Blender로 직접 만든 설명용 도식이며 실제 공장 · 제도 운영과 다릅니다.{" "}
                    <Cite src={stepSrc} />
                  </>
                }
              />
            </section>

            {/* ── 3 장부를 쓰는 방식 ── */}
            <section id="ce-ledger" className="rc-sec" aria-labelledby="h-ledger">
              <h2 id="h-ledger" className="rc-h2">
                <span>3</span>장부를 쓰는 방식 — 섞인 원료에 이름표 붙이기
              </h2>
              <p>
                재생원료와 광물 원료가 섞이는 공장에서 &lsquo;이 제품은 재생원료로 만들었다&rsquo;고 말하는 방법은 여럿입니다. EU 공동연구센터(JRC)는 이런 추적 방식들을 비교했고, 어느 하나가
                뚜렷이 낫지는 않다고 봤습니다. 집행위원회 초안은 그중 공장 단위 질량수지를 골랐습니다. 버튼을 눌러 방식을 바꿔 보세요. <Cite src={modelSrc} />
              </p>
              <figure className="rc-panel ce-lv-fig" aria-labelledby="ce-lv-cap">
                <LedgerViewer />
                <figcaption id="ce-lv-cap">
                  그림 2. 같은 공장, 네 가지 장부. 넣은 원료 10칸 가운데 3칸이 재생원료라고 할 때의 예시이며 칸 수는 실제 수치가 아닙니다. <Cite src={modelSrc} />
                </figcaption>
              </figure>
              <p className="tr-note-line">
                EU 초안은 EU 안에서 재활용 단계를 모두 거친 리튬 · 니켈 · 코발트에 2036년 말까지 1.3배 보정 계수를 주는 안을 담았습니다. 블랙매스만 EU에서 만들고 정제를 밖에서 하면 해당되지
                않습니다. 유럽 배터리 업계 단체는 이 계수로는 역내 재활용의 비용 불리를 메우기 어렵고, 끝나는 날짜를 고정해 둔 점이 문제라는 의견을 냈습니다. 확정 전이라 바뀔 수 있습니다.{" "}
                <Cite src={["P9"]} />
              </p>
            </section>

            {/* ── 4 EU 목표와 연구 ── */}
            <section id="ce-target" className="rc-sec" aria-labelledby="h-target">
              <h2 id="h-target" className="rc-h2">
                <span>4</span>EU 최소 비율 — 채울 수 있나
              </h2>
              <p>
                EU에서 팔리는 전기차 · 2 kWh 넘는 산업용 · 시동용 배터리는 2031년 8월부터 재생원료를 최소 비율 이상 넣어야 합니다. 재생원료는 배터리를 만들다 나온 폐기물(공정 스크랩)이나 다 쓴
                배터리에서 회수한 것을 모두 셉니다. <Cite src={["P7"]} />
              </p>
              <figure className="rc-panel ce-tg-fig" aria-labelledby="ce-tg-cap">
                <TargetsFig />
                <figcaption id="ce-tg-cap">
                  그림 3. 옅은 막대는 2031년, 짙은 막대는 2036년 최소 비율. 리튬 · 니켈 위의 가는 선은 한 연구가 108가지 시나리오로 계산한 2031년 재생원료 비율의 범위입니다(모두 목표 이상).{" "}
                  <Cite src={["P7", 81]} />
                </figcaption>
              </figure>
              <ul className="ce-studies">
                {studies.map((s) => (
                  <li key={s.k} className="rc-panel">
                    <p className="num">
                      <b>{s.num}</b>
                      <span>{s.numL}</span>
                    </p>
                    <p className="t">{s.k}</p>
                    <p className="who">{s.who}</p>
                    <p className="d">
                      {s.d} <Cite src={s.src} />
                    </p>
                  </li>
                ))}
              </ul>
            </section>

            {/* ── 5 한국과 EU ── */}
            <section id="ce-rules" className="rc-sec" aria-labelledby="h-rules">
              <h2 id="h-rules" className="rc-h2">
                <span>5</span>한국과 EU — 날짜로 보기
              </h2>
              <p>
                국내 법은 인증을 세 갈래로 나눴습니다. 재생원료가 배터리에서 나온 것임을 확인하는 <b>생산 인증</b>(기후에너지환경부), 그 원료로 만든 배터리의 <b>사용 여부 · 함유율 인증</b>
                (산업통상부), 만들거나 들여오는 배터리에 대한 <b>함유율 목표</b>(기후에너지환경부)입니다. <Cite src={["P3"]} /> 국내 연구진도 EU 규정에 대응하려면 이력관리와 함께 재생원료
                인증제를 갖춘 통합 법제가 필요하다고 제안했습니다. <Cite src={[85, 79]} />
              </p>
              <ol className="rc-panel tr-time ce-time">
                {timeline.map((t) => (
                  <li key={t.when + t.t} className={`w-${t.who}${t.done ? " done" : ""}`}>
                    <span className="when">{t.when}</span>
                    <span className="who">{t.who === "KR" ? "한국" : "EU"}</span>
                    <p className="t">{t.t}</p>
                    <p className="d">
                      {t.d} <Cite src={t.src} />
                    </p>
                  </li>
                ))}
              </ol>
              <p className="tr-note-line">제도는 하위 법령 · 운영지침과 EU 위임 법령에서 세부가 정해지고 바뀔 수 있으니, 인용할 때는 최신 내용을 다시 확인해야 합니다.</p>
            </section>

            {/* ── 6 남은 과제 ── */}
            <section id="ce-next" className="rc-sec" aria-labelledby="h-next">
              <h2 id="h-next" className="rc-h2">
                <span>6</span>남은 과제
              </h2>
              <div className="sf-cards">
                <aside className="rc-note" aria-label="섞임과 영업비밀">
                  <h3>섞인 원료를 입증하는 일, 공정을 보여 주는 일</h3>
                  <p>
                    정부는 시범사업 동안 기업과 실무작업반을 꾸려, 공정 안에서 원료가 섞일 때 이를 입증하기 어려운 점과 공정 자료를 내보일 때의 영업비밀 보호 문제를 모으기로 했습니다. 인증은
                    공장의 운영 자료를 보여 줘야 성립하기 때문입니다. <Cite src={["P10"]} />
                  </p>
                </aside>
                <aside className="rc-note" aria-label="목표와 순환의 충돌">
                  <h3>목표만 보면 놓치는 것</h3>
                  <p>
                    공정 스크랩도 재생원료로 세기 때문에, 스크랩을 줄이거나 배터리를 오래 · 다시 쓰려는 노력이 오히려 목표 달성을 어렵게 만들 수 있다는 지적이 있습니다. 연구진은 EU가 목표에
                    유연성을 두어야 한다고 봤습니다(02 재사용 · 01 재제조와 함께 볼 문제). <Cite src={[81, 82]} />
                  </p>
                </aside>
              </div>
              <div className="sf-links">
                <Link href="/topics/recycling" className="sf-link">
                  <b>03</b>
                  <span>
                    <strong>재활용</strong>파쇄 · 블랙매스 · 정제 공정
                  </span>
                </Link>
                <Link href="/topics/traceability" className="sf-link">
                  <b>09</b>
                  <span>
                    <strong>이력관리</strong>여권의 재생원료 칸
                  </span>
                </Link>
                <Link href="/topics/supply-chain" className="sf-link">
                  <b>13</b>
                  <span>
                    <strong>공급망</strong>원료가 어디로 흐르나
                  </span>
                </Link>
              </div>
            </section>

            <RefsSection papers={papers} other={other} note={<>보강 — 81~85번 문헌은 2026년 11월 이 페이지를 개편하며 추가했습니다. 85번은 국내 연구입니다.</>} />
            <NextNav slug="certification" />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
