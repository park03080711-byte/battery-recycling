import Link from "next/link";
import Footer from "@/components/Footer";
import { Cite } from "../rc/Cite";
import { RcToc } from "../rc/Interactive";
import { SystemMap } from "../rc/SystemMap";
import { NextNav, RefsSection, TopicHead, type Kpi } from "../rc/kit";
import { collectCited } from "../rc/sources";
import { cats, facts, gaps, probes, stepSrc, steps, timeline, toc } from "./data";
import { IconInspect, IconPassport, IconThree } from "./Icons";
import { PassportViewer, SohFig } from "./Parts";
import plant from "./map.json";
import motion from "./motion.json";

const icons = [<IconPassport key="a" />, <IconThree key="b" />, <IconInspect key="c" />];
const kpis: Kpi[] = facts.map((f, i) => ({ ...f, icon: icons[i] }));

const { papers, other } = collectCited(
  facts.flatMap((f) => f.src),
  gaps.flatMap((g) => g.src),
  stepSrc,
  probes.flatMap((p) => p.src),
  timeline.flatMap((t) => t.src),
  [35, 73, 74, 75, 79, "P8"]
);

export default function TraceabilityPage() {
  return (
    <div className="rc">
      <main id="main">
        <TopicHead
          slug="traceability"
          sub="배터리 여권 · 전주기 이력"
          papers={papers.length}
          kpis={kpis}
          asOf="2026년 11월"
          lead="배터리는 한 번 팔리면 여러 손을 거칩니다. 만든 회사, 차를 산 사람, 정비소, 재사용 업체, 재활용 공장. 이력관리는 그동안 생긴 기록을 배터리 한 개의 식별번호에 묶어, 다음 사람이 처음부터 다시 재지 않아도 되게 하는 장치입니다. EU는 이것을 '배터리 여권'이라 부르고, 한국은 차량 등록부터 이력을 쌓기 시작했습니다."
        />

        <div className="rc-wrap rc-body">
          <RcToc items={toc} />

          <div className="rc-main">
            {/* ── 1 기록이 없으면 ── */}
            <section id="tr-why" className="rc-sec" aria-labelledby="h-why">
              <h2 id="h-why" className="rc-h2">
                <span>1</span>기록이 없으면 생기는 일
              </h2>
              <p>이력이 끊기면 배터리를 받는 쪽마다 같은 질문을 다시 해야 합니다. 이 배터리는 무엇으로 만들었고, 얼마나 썼고, 앞으로 얼마나 더 쓸 수 있나.</p>
              <ul className="tr-gaps">
                {gaps.map((g) => (
                  <li key={g.who} className="rc-panel">
                    <span className="tr-who">{g.who}</span>
                    <p className="t">{g.t}</p>
                    <p className="d">
                      {g.d} <Cite src={g.src} />
                    </p>
                  </li>
                ))}
              </ul>
            </section>

            {/* ── 2 기록이 모이는 길 ── */}
            <section id="tr-map" className="rc-sec" aria-labelledby="h-map">
              <h2 id="h-map" className="rc-h2">
                <span>2</span>기록이 모이는 길 — 배터리 한 개의 일생
              </h2>
              <p>
                배터리가 장소를 옮길 때마다 그 자리에서 기록이 생기고, 같은 식별번호 아래로 모입니다. 재사용으로 가면 기록이 새 여권으로 이어지고, 재활용으로 가면 여권은 끝나지만 회수한 원료의
                기록이 새 배터리로 넘어갑니다. <Cite src={stepSrc} />
              </p>
              <SystemMap
                steps={steps}
                groups={[
                  { label: "기록이 쌓이는 동안", tag: "제조 · 사용" },
                  { label: "다음 삶으로 넘길 때", tag: "재사용 · 재활용" },
                ]}
                mid="갈림점"
                overlays={[
                  { at: "zh", text: "배터리 여권 서버", kind: "zone", badge: "여권" },
                  { at: "zl", text: "재생원료 기록 → 새 셀", kind: "flow" },
                ]}
                plant={plant}
                motion={motion}
                motionSrc="/tr/map"
                img="/tr/map"
                mask="/tr/mask_"
                title="기록이 모이는 길"
                sub="제조 · 차량 등록 · 운행 · 평가 · 재사용 · 재활용"
                keys={[
                  { k: "g0", label: "기록이 쌓이는 동안" },
                  { k: "g1", label: "다음 삶으로" },
                  { k: "flow", label: "배터리의 이동" },
                ]}
                capId="map-cap"
                caption={
                  <>
                    그림 1. 번호를 누르면 그 장소만 밝아지고 아래에 무엇이 기록되는지가 뜹니다. &lsquo;공정 재생&rsquo;을 누르면 장소마다 기록이 생겨 기둥을 타고 올라가고(파란 점선은 데이터
                    선), 가운데 뒤 서버 위에 그 단계의 &lsquo;여권 한 장&rsquo;이 쌓입니다. 재활용 뒤에는 분홍 길을 따라 재생원료 기록이 다시 ① 제조로 돌아갑니다. 장면과 움직임은 이 사이트가
                    Blender로 직접 만든 설명용 도식이며 실제 시스템 구성과 다릅니다. <Cite src={stepSrc} />
                  </>
                }
              />
            </section>

            {/* ── 3 여권 안에는 ── */}
            <section id="tr-inside" className="rc-sec" aria-labelledby="h-inside">
              <h2 id="h-inside" className="rc-h2">
                <span>3</span>여권 안에는 무엇이 — 누가 어디까지 보나
              </h2>
              <p>
                연구자들은 배터리 여권에 담길 정보를 네 갈래로 묶었습니다. <Cite src={[73]} />
              </p>
              <ul className="tr-cats">
                {cats.map((c) => (
                  <li key={c.k} className={`tone-${c.tone}`}>
                    <b>{c.k}</b>
                    <div>
                      <p className="t">{c.t}</p>
                      <p className="d">{c.d}</p>
                    </div>
                  </li>
                ))}
              </ul>
              <p className="tr-lead2">
                EU 규정은 실제 여권을 네 칸으로 나누고, 칸마다 볼 수 있는 사람을 정했습니다. 버튼을 눌러 보는 사람을 바꿔 보세요. <Cite src={["P7"]} />
              </p>
              <figure className="rc-panel tr-pv-fig" aria-labelledby="tr-pv-cap">
                <PassportViewer />
                <figcaption id="tr-pv-cap">
                  그림 2. EU 배터리 규정 제77조 2항 · 부속서 XIII을 정리. 1~3칸은 같은 모델이면 같은 내용이고, 4칸은 배터리 한 개마다 다른 기록입니다. 항목은 줄여 적었습니다.{" "}
                  <Cite src={["P7"]} />
                </figcaption>
              </figure>

              <h3 className="tr-h3">SOH 한 번이 아니라 세 번</h3>
              <p>
                4칸의 SOH가 중요한 이유는 재사용의 값이 &lsquo;지금 상태&rsquo;보다 &lsquo;앞으로 얼마나 더 쓰나&rsquo;에 달려 있기 때문입니다. 오늘 잰 SOH가 같아도 천천히 줄어드는
                배터리와 갑자기 꺾이는 배터리는 남은 수명이 다릅니다(05 잔존수명 진단의 무릎점). 그래서 연구진은 일생 동안 SOH를 적어도 세 번 재서 남기자고 제안했습니다. <Cite src={[74]} />
              </p>
              <figure className="rc-panel tr-soh-fig" aria-labelledby="tr-soh-cap">
                <SohFig />
                <figcaption id="tr-soh-cap">그림 3. 같은 오늘, 다른 내일 — 개념도. 곡선 모양과 축은 개념이며 숫자를 뜻하지 않습니다.</figcaption>
              </figure>
              <p className="tr-note-line">
                재는 정확도도 문제입니다. 미국 캘리포니아는 2026년까지 SOH를 ±5%p 안으로 맞게 보고하게 했는데, 같은 연구진의 계산에서는 SOH에 5%p 오차가 있으면 한 노화 곡선 예에서 95%
                신뢰 수준으로 말할 수 있는 남은 수명이 7.2년에서 1.6년으로 줄었습니다. <Cite src={[74]} />
              </p>
            </section>

            {/* ── 4 기록이 없을 때 ── */}
            <section id="tr-probe" className="rc-sec" aria-labelledby="h-probe">
              <h2 id="h-probe" className="rc-h2">
                <span>4</span>기록이 없을 때 — 재서 알아내기
              </h2>
              <p>
                지금 재활용 공장에 들어오는 배터리 대부분은 여권이 없습니다. 그래서 조성을 재서 알아내는 방법이 함께 연구되고 있습니다. 여권이 자리 잡으면 이런 측정은 기록을 확인하는 정도로
                줄어들 수 있습니다.
              </p>
              <ul className="tr-probes">
                {probes.map((p) => (
                  <li key={p.k} className="rc-panel">
                    <p className="k">{p.k}</p>
                    <p className="how">{p.how}</p>
                    <p className="d">
                      {p.d} <Cite src={p.src} />
                    </p>
                    <dl>
                      <div className="good">
                        <dt>잘 되는 것</dt>
                        <dd>{p.good}</dd>
                      </div>
                      <div className="limit">
                        <dt>한계</dt>
                        <dd>{p.limit}</dd>
                      </div>
                    </dl>
                  </li>
                ))}
              </ul>
            </section>

            {/* ── 5 EU와 한국 ── */}
            <section id="tr-rules" className="rc-sec" aria-labelledby="h-rules">
              <h2 id="h-rules" className="rc-h2">
                <span>5</span>EU와 한국 — 날짜로 보기
              </h2>
              <p>
                한국은 차량 쪽에서, EU는 배터리 시장 쪽에서 기록을 쌓기 시작했습니다. 국내 연구진은 EU 규정의 의무(탄소발자국 · 실사 · 여권 등)를 정리하며, EU에 배터리를 수출하는 국내
                기업이 미리 대비해야 한다고 짚었습니다. <Cite src={[79]} />
              </p>
              <ol className="rc-panel tr-time">
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
              <p className="tr-note-line">
                국내에서는 부처마다 따로 쌓는 기록을 하나로 잇는 &lsquo;배터리 거래 · 이력 관리 플랫폼&rsquo;을 만들기로 했습니다(2026년 8월 발표, 계획 단계). <Cite src={["P8"]} /> 제도는 하위
                법령에서 세부가 정해지고 바뀔 수 있으니, 인용할 때는 최신 내용을 다시 확인해야 합니다.
              </p>
            </section>

            {/* ── 6 남은 과제 ── */}
            <section id="tr-next" className="rc-sec" aria-labelledby="h-next">
              <h2 id="h-next" className="rc-h2">
                <span>6</span>남은 과제
              </h2>
              <div className="sf-cards">
                <aside className="rc-note" aria-label="재사용 자료의 벽">
                  <h3>재활용 자료는 쉽고, 재사용 자료는 어렵다</h3>
                  <p>
                    업계 관계자 35명을 인터뷰한 연구에서, 재활용에 필요한 자료(조성 등)는 내놓기 쉽지만 재사용에 필요한 자료(사용 이력 · 상태)는 구하기 어렵고 영업비밀 문제가 걸린다는 답이
                    나왔습니다. 연구진은 지금 규정이 재활용 쪽으로 기운 면이 있다고 지적했습니다. <Cite src={[75]} />
                  </p>
                </aside>
                <aside className="rc-note" aria-label="화학으로 풀 수 없는 문제">
                  <h3>화학으로 풀 수 없는 문제의 해법</h3>
                  <p>
                    실험실의 고순도 회수와 수익을 내는 공장 사이의 간극을 다룬 논문은, 원료 조성이 제각각인 문제는 새 공정이 아니라 조성 정보를 따라다니게 하는 디지털 여권과 분해를 고려한
                    설계로 풀어야 한다고 봤습니다. <Cite src={[35]} />
                  </p>
                </aside>
              </div>
              <div className="sf-links">
                <Link href="/topics/soh-diagnosis" className="sf-link">
                  <b>05</b>
                  <span>
                    <strong>잔존수명 진단</strong>기록이 없을 때 재는 법, 무릎점
                  </span>
                </Link>
                <Link href="/topics/certification" className="sf-link">
                  <b>10</b>
                  <span>
                    <strong>재생원료 인증</strong>재생원료 비율을 누가 확인하나
                  </span>
                </Link>
                <Link href="/topics/design-for-disassembly" className="sf-link">
                  <b>14</b>
                  <span>
                    <strong>분해를 고려한 설계</strong>여권의 해체 정보가 쓰이는 곳
                  </span>
                </Link>
              </div>
            </section>

            <RefsSection papers={papers} other={other} note={<>보강 — 73~80번 문헌은 2026년 11월 이 페이지를 개편하며 추가했습니다. 79 · 80번은 국내 연구입니다.</>} />
            <NextNav slug="traceability" />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
