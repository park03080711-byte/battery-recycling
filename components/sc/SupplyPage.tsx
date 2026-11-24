import Link from "next/link";
import Footer from "@/components/Footer";
import { Cite } from "../rc/Cite";
import { RcToc } from "../rc/Interactive";
import { SystemMap } from "../rc/SystemMap";
import { NextNav, RefsSection, TopicHead, type Kpi } from "../rc/kit";
import { collectCited } from "../rc/sources";
import { chain, cut2050, facts, recovered, share, stepSrc, steps, targets, toc } from "./data";
import { IconFill, IconTen, IconTop } from "./Icons";
import { ChainPicker, RangeFig, TargetPicker } from "./Parts";
import plant from "./map.json";
import motion from "./motion.json";

const icons = [<IconTop key="a" />, <IconFill key="b" />, <IconTen key="c" />];
const kpis: Kpi[] = facts.map((f, i) => ({ ...f, icon: icons[i] }));

const { papers, other } = collectCited(
  facts.flatMap((f) => f.src),
  chain.flatMap((c) => c.src),
  stepSrc,
  targets.flatMap((t) => t.src),
  [96, 97, 98, 81, 82, "P14", "P17"]
);

export default function SupplyPage() {
  return (
    <div className="rc">
      <main id="main">
        <TopicHead
          slug="supply-chain"
          sub="정제 쏠림 · 도시광산 · 원료 확보"
          papers={papers.length}
          kpis={kpis}
          asOf="2026년 11월"
          lead="배터리를 아무리 잘 만들어도 원료가 끊기면 공장은 멈춥니다. 리튬 · 니켈 · 코발트는 몇몇 나라에서 캐고, 그보다 더 적은 나라에서 정제됩니다. 다 쓴 배터리에서 원료를 되찾는 '도시광산'은 이 쏠림을 덜어 줄 방법이지만, 얼마나 채울 수 있는지는 배터리가 언제, 얼마나 돌아오느냐에 달려 있습니다."
        />

        <div className="rc-wrap rc-body">
          <RcToc items={toc} />

          <div className="rc-main">
            {/* ── 1 왜 공급망인가 ── */}
            <section id="sc-why" className="rc-sec" aria-labelledby="h-why">
              <h2 id="h-why" className="rc-h2">
                <span>1</span>왜 공급망인가 — 어느 칸이 약한가
              </h2>
              <p>
                배터리 원료는 캐고, 정제하고, 소재로 만들고, 셀로 조립한 뒤, 다 쓰면 다시 되찾는 다섯 칸을 지납니다. 칸마다 몰린 정도와 한국의 강약이 다릅니다. 칸을 눌러 보세요.{" "}
                <Cite src={[99, "P14"]} />
              </p>
              <figure className="rc-panel sc-chain-fig" aria-labelledby="sc-chain-cap">
                <ChainPicker />
                <figcaption id="sc-chain-cap">
                  그림 1. 칸 아래 글은 한국의 사정입니다. 정제 쏠림과 재활용 설비 집중은 국제에너지기구 2026년 전망, 한국의 강약은 한국지질자원연구원 연구를 따랐습니다.{" "}
                  <Cite src={[99, "P14", 100, 98]} />
                </figcaption>
              </figure>
              <p className="tr-note-line">
                수요는 빠르게 늘어납니다. 니켈 · 코발트 · 망간 배터리가 주류로 남는다면 2020년부터 2050년까지 리튬 수요는 18~20배, 코발트는 17~19배, 니켈은 28~31배로 늘 수 있다는
                계산이 있습니다. 다만 전기차 보급 속도와 배터리 화학에 따라 불확실성이 큽니다. <Cite src={[96]} />
              </p>
            </section>

            {/* ── 2 섬을 도는 원료 ── */}
            <section id="sc-map" className="rc-sec" aria-labelledby="h-map">
              <h2 id="h-map" className="rc-h2">
                <span>2</span>섬을 도는 원료 — 바다 건너와 도시광산
              </h2>
              <p>
                원료가 광산 섬에서 정제 섬을 거쳐 바다를 건너 한국 섬의 배터리 공장에 닿고, 다 쓴 배터리가 다시 공장으로 돌아오는 길을 그렸습니다. 단계마다의 숫자는 아래 연구와 공공 자료가
                계산하거나 집계한 값입니다. <Cite src={stepSrc} />
              </p>
              <SystemMap
                steps={steps}
                groups={[
                  { label: "바다 건너에서 오는 원료", tag: "수입 원료" },
                  { label: "도시광산 고리", tag: "재생원료" },
                ]}
                mid="다 쓰면"
                overlays={[
                  { at: "zr", text: "정제 섬 — 공장이 한곳에 몰림", kind: "zone", badge: "72%" },
                  { at: "zo", text: "다른 나라 정제", kind: "flow" },
                  { at: "zk", text: "한국 섬 — 도시광산 고리", kind: "zone", badge: "11%" },
                ]}
                plant={plant}
                motion={motion}
                motionSrc="/sc/map"
                img="/sc/map"
                mask="/sc/mask_"
                title="섬을 도는 원료"
                sub="광산 · 정제 · 운송 · 배터리 공장 · 수거 · 재활용"
                keys={[
                  { k: "g0", label: "바다 건너에서 오는 원료" },
                  { k: "g1", label: "도시광산 고리" },
                  { k: "flow", label: "원료 · 배터리의 이동" },
                ]}
                capId="map-cap"
                caption={
                  <>
                    그림 2. 번호를 누르면 그 단계만 밝아지고 아래에 그 단계의 숫자가 뜹니다. &lsquo;공정 재생&rsquo;을 누르면 원료가 광산 섬 → 정제 섬 → 바다 → 한국 섬으로 온 뒤, 한국 섬 안에서
                    공장 → 수거 → 재활용 → 공장으로 한 바퀴 돕니다. 정제 섬의 공장 수는 쏠림을 보여 주는 개념이고, 재활용 공장 옆 통의 눈금은 2030년 국내 사용후 배터리가 국내 전처리 용량의
                    11%를 채운다는 추정을 그린 것입니다. 섬의 배치는 실제 지리와 다릅니다. 장면과 움직임은 이 사이트가 Blender로 직접 만든 설명용 도식입니다. <Cite src={stepSrc} />
                  </>
                }
              />
            </section>

            {/* ── 3 도시광산은 얼마나 ── */}
            <section id="sc-urban" className="rc-sec" aria-labelledby="h-urban">
              <h2 id="h-urban" className="rc-h2">
                <span>3</span>도시광산은 얼마나 채우나
              </h2>
              <p>
                다 쓴 배터리를 &lsquo;도시광산&rsquo;이라 부르지만, 이 광산은 전기차가 평균 10년쯤 달린 뒤에야 열립니다. 그래서 재생원료의 몫은 처음엔 작고 시간이 갈수록 커집니다.{" "}
                <Cite src={[98, 96]} />
              </p>
              <div className="sc-two">
                <figure className="rc-panel sc-range-fig" aria-labelledby="sc-kr-cap">
                  <p className="rc-fig-h">국내 수요 가운데 국내 재생원료가 채우는 몫</p>
                  <RangeFig rows={share.map((s) => ({ k: s.y, lo: s.lo, hi: s.hi }))} max={40} title="국내 수요 중 국내 재생원료 몫" unit="%" tone="kr" />
                  <figcaption id="sc-kr-cap">
                    그림 3. 한국지질자원연구원의 추정. 평균 10년 쓰고 배출된다고 가정했습니다. 2045년에는 사용후 배터리가 연 81만 개로 늘어 되찾은 원료로 배터리 100만 대분을 만들 수 있다고
                    봤습니다. <Cite src={[98]} />
                  </figcaption>
                </figure>
                <figure className="rc-panel sc-range-fig" aria-labelledby="sc-w-cap">
                  <p className="rc-fig-h">2050년까지 세계 누적 수요를 재활용이 줄일 수 있는 최대 몫</p>
                  <RangeFig rows={cut2050} max={50} title="2050년까지 누적 수요 감소 최대치" unit="%" tone="world" />
                  <figcaption id="sc-w-cap">
                    그림 4. 레이던대 · 아르곤 국립연구소 연구진의 계산(&lsquo;최선의 경우&rsquo;). 이번 10년에는 재활용이 줄이는 몫이 10% 아래지만 2040~2050년에는 20~71%까지 커질 수
                    있다고 봤습니다. <Cite src={[96]} />
                  </figcaption>
                </figure>
              </div>
              <ul className="sc-rec" aria-label="2045년 국내 사용후 배터리에서 되찾는 양">
                {recovered.map((r) => (
                  <li key={r.k} className={`m-${r.m}`}>
                    <b>{r.v}</b>만 톤<span>{r.k}</span>
                  </li>
                ))}
              </ul>
              <p className="tr-note-line">
                위는 2045년 국내 사용후 배터리에서 되찾을 수 있는 양의 추정입니다. <Cite src={[98]} /> 세계로 보면 국제에너지기구는 재활용 규모를 키우면 2040년까지 새로 열어야 할 광산을
                5~30% 줄일 수 있고, 2050년에는 구리 · 코발트 35%, 리튬 20% 넘게, 니켈 15%까지 줄일 수 있다고 전망했습니다. <Cite src={["P14"]} />
              </p>
              <div className="sf-cards">
                <aside className="rc-note" aria-label="재사용과의 관계">
                  <h3>재사용은 재활용을 늦춘다</h3>
                  <p>
                    배터리를 에너지저장장치로 한 번 더 쓰면 그만큼 원료가 늦게 돌아옵니다. 재사용의 이득과 원료가 돌아오는 속도를 함께 따져야 합니다(02 재사용). <Cite src={[96]} />
                  </p>
                </aside>
                <aside className="rc-note" aria-label="화학 바꾸기">
                  <h3>화학을 바꾸면 부담이 옮겨 간다</h3>
                  <p>
                    EU의 코발트 흐름을 따진 연구는 코발트를 덜 쓰는 새 배터리가 의존도를 가장 크게 줄이지만 니켈 수요를 늘릴 수 있어, 효율적인 재활용과 함께 가야 한다고 결론 내렸습니다.{" "}
                    <Cite src={[97]} />
                  </p>
                </aside>
              </div>
            </section>

            {/* ── 4 원료를 두고 다툼 ── */}
            <section id="sc-trade" className="rc-sec" aria-labelledby="h-trade">
              <h2 id="h-trade" className="rc-h2">
                <span>4</span>원료를 두고 다툼 — 설비는 있는데 배터리가 모자란다
              </h2>
              <p>
                국내 사용후 배터리 배출은 2023년 2,355개에서 2025년 8,321개로 늘었고 2030년 10만 7,500개로 전망됩니다. <Cite src={["P17"]} /> 그런데 재활용 기업들의 설비 계획과
                견주면 2030년 국내 배출량은 국내 전처리 용량의 11%에 그칩니다. 연구는 원료 확보 차원에서 폐배터리 수출입 관리가 중요하다고 짚었습니다. <Cite src={[98]} />
              </p>
              <div className="sf-cards">
                <aside className="rc-note" aria-label="재활용 설비 집중">
                  <h3>재활용 설비도 한 나라에</h3>
                  <p>
                    세계 배터리 재활용 설비는 크게 늘었지만 전처리 용량의 4분의 3 이상, 금속 회수 용량의 90%가 중국에 있습니다. 주요 에너지 광물의 평균 재활용률은 지금 약 10%에서 2040년
                    20% 가까이로 오를 것으로 전망됩니다. <Cite src={["P14"]} />
                  </p>
                </aside>
                <aside className="rc-note" aria-label="통제">
                  <h3>정제품이 통상 무기가 되다</h3>
                  <p>
                    2025년 10월 양극재 · 전구체 · 흑연 음극재와 배터리 제조 장비에 수출 통제가 발표됐습니다. 국제에너지기구는 2025년을 쏠린 공급망의 경제적 위험이 실제로 드러난 해로
                    평가했습니다. <Cite src={["P14"]} />
                  </p>
                </aside>
              </div>
              <p className="tr-note-line">
                EU 연구들도 같은 고민을 보였습니다. 역내 재생원료 목표를 채우려면 다 쓴 배터리만이 아니라 공정 스크랩과 역내 양극재 생산 능력이 뒷받침돼야 한다는 계산입니다(10 재생원료
                인증). <Cite src={[81, 82]} />
              </p>
            </section>

            {/* ── 5 각국의 목표 ── */}
            <section id="sc-policy" className="rc-sec" aria-labelledby="h-policy">
              <h2 id="h-policy" className="rc-h2">
                <span>5</span>각국의 목표 — 의존도는 낮추고, 되찾기는 늘리고
              </h2>
              <p>한국과 EU 모두 &lsquo;한 나라에 기대는 몫을 줄이고 재활용으로 되찾는 몫을 늘린다&rsquo;는 같은 방향의 숫자를 내걸었습니다. 버튼으로 바꿔 보세요.</p>
              <figure className="rc-panel sc-tg-fig" aria-labelledby="sc-tg-cap">
                <TargetPicker />
                <figcaption id="sc-tg-cap">
                  그림 5. 정부 계획 · 법령 원문에서 옮긴 목표입니다. 목표는 계획이며 달성 여부는 별개입니다. <Cite src={["P16", "P3", "P15", "P7"]} />
                </figcaption>
              </figure>
            </section>

            {/* ── 6 남은 과제 ── */}
            <section id="sc-next" className="rc-sec" aria-labelledby="h-next">
              <h2 id="h-next" className="rc-h2">
                <span>6</span>남은 과제
              </h2>
              <div className="sf-cards">
                <aside className="rc-note" aria-label="앞단">
                  <h3>재활용만으로는 못 채운다</h3>
                  <p>
                    2050년까지 재활용이 줄이는 몫은 최선이어도 리튬 20~23%, 코발트 26~44%, 니켈 22~38%입니다. 나머지는 여전히 광산과 정제에서 와야 하므로 탐사 · 비축 · 공급처 다변화가
                    함께 가야 합니다. <Cite src={[96, 99, "P16"]} />
                  </p>
                </aside>
                <aside className="rc-note" aria-label="고리를 닫으려면">
                  <h3>고리를 닫으려면 기록과 값이 필요하다</h3>
                  <p>
                    돌아오는 배터리를 놓치지 않으려면 이력 기록(09)과 재생원료 인증(10)이, 되찾은 원료가 팔리려면 경제성(12)이 받쳐 줘야 합니다. 정부의 재자원화 추진방향도 이력관리 · 인증 ·
                    사용후배터리법을 함께 내세웠습니다. <Cite src={["P16", "P3"]} />
                  </p>
                </aside>
              </div>
              <div className="sf-links">
                <Link href="/topics/certification" className="sf-link">
                  <b>10</b>
                  <span>
                    <strong>재생원료 인증</strong>재생원료 함유율 목표
                  </span>
                </Link>
                <Link href="/topics/techno-economic" className="sf-link">
                  <b>12</b>
                  <span>
                    <strong>기술경제성 분석</strong>남는 장사인가
                  </span>
                </Link>
                <Link href="/topics/design-for-disassembly" className="sf-link">
                  <b>14</b>
                  <span>
                    <strong>분해를 고려한 설계</strong>되찾기 쉽게 처음부터
                  </span>
                </Link>
              </div>
            </section>

            <RefsSection
              papers={papers}
              other={other}
              note={<>보강 — 96~100번 문헌은 2026년 11월 이 페이지를 개편하며 추가했습니다. 98~100번은 국내 연구이며, 100번은 DOI가 없어 KCI 등재 번호로 확인했습니다.</>}
            />
            <NextNav slug="supply-chain" />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
