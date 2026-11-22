import Link from "next/link";
import Footer from "@/components/Footer";
import { Cite } from "../rc/Cite";
import { RcToc } from "../rc/Interactive";
import { SystemMap } from "../rc/SystemMap";
import { NextNav, RefsSection, TopicHead, type Kpi } from "../rc/kit";
import { collectCited } from "../rc/sources";
import { facts, stepSrc, steps, studies, termSrc, terms, toc } from "./data";
import { IconBC, IconRange, IconWage } from "./Icons";
import { BreakEvenFig, DestPicker, StudyTable } from "./Parts";
import plant from "./map.json";
import motion from "./motion.json";

const icons = [<IconRange key="a" />, <IconWage key="b" />, <IconBC key="c" />];
const kpis: Kpi[] = facts.map((f, i) => ({ ...f, icon: icons[i] }));

const { papers, other } = collectCited(
  facts.flatMap((f) => f.src),
  termSrc,
  stepSrc,
  studies.map((s) => s.id),
  [35, 14, 9, 25]
);

export default function TeaPage() {
  return (
    <div className="rc">
      <main id="main">
        <TopicHead
          slug="techno-economic"
          sub="비용 · 수익 · 손익분기"
          papers={papers.length}
          kpis={kpis}
          asOf="2026년 11월"
          lead="실험실에서 99% 순도를 얻어도 공장이 돈을 벌지 못하면 그 기술은 쓰이지 않습니다. 기술경제성 분석은 배터리를 모아 오고, 뜯고, 갈고, 녹여 금속으로 파는 동안 드는 돈과 버는 돈을 견줘 남는 장사인지 따지는 방법입니다. 답은 어디서, 얼마나 많이, 어떤 배터리를 처리하느냐에 따라 손해에서 이익까지 뒤집힙니다."
        />

        <div className="rc-wrap rc-body">
          <RcToc items={toc} />

          <div className="rc-main">
            {/* ── 1 무엇을 따지나 ── */}
            <section id="te-what" className="rc-sec" aria-labelledby="h-what">
              <h2 id="h-what" className="rc-h2">
                <span>1</span>무엇을 따지나
              </h2>
              <p>
                기술경제성 분석은 공정을 단계별로 나눠 각 단계의 비용을 적고, 나오는 물건의 판매 수입과 견줍니다. 한 번 드는 돈과 해마다 드는 돈을 나눠 보고, 몇 가지 지표로 해볼 만한지
                판단합니다. <Cite src={termSrc} />
              </p>
              <ol className="lc-phases te-terms">
                {terms.map((p) => (
                  <li key={p.t}>
                    <b>{p.k}</b>
                    <div>
                      <p className="t">{p.t}</p>
                      <p className="d">{p.d}</p>
                    </div>
                  </li>
                ))}
              </ol>
              <p className="tr-note-line">
                2026년 한 논문은 수천 가지 배터리 종류, 요동치는 금속 가격, 나라마다 다른 규제가 맞물린 &lsquo;재활용 트릴레마&rsquo; 앞에서 실험실의 화학이 무너진다고 짚었습니다. 실제
                블랙매스는 여러 화학조성이 섞이고 구리 · 알루미늄 · 불소가 남아 있어 논문 속 정제된 시료와 다릅니다. <Cite src={[35]} />
              </p>
            </section>

            {/* ── 2 돈이 오가는 공장 ── */}
            <section id="te-map" className="rc-sec" aria-labelledby="h-map">
              <h2 id="h-map" className="rc-h2">
                <span>2</span>돈이 오가는 공장 — 단계마다 붙는 비용
              </h2>
              <p>
                다 쓴 팩 하나가 공장을 한 바퀴 도는 동안 어디서 돈이 들고 어디서 들어오는지 따라가 봅니다. 단계마다의 숫자는 아래 연구들이 실제로 계산하거나 측정한 값입니다.{" "}
                <Cite src={stepSrc} />
              </p>
              <SystemMap
                steps={steps}
                groups={[
                  { label: "비용이 붙는 단계", tag: "비용" },
                  { label: "수익과 판단", tag: "수익" },
                ]}
                mid="팔아서"
                overlays={[
                  { at: "zb", text: "저울 — 왼쪽 비용 · 오른쪽 수익", kind: "zone", badge: "B/C" },
                  { at: "zr", text: "먼 길 = 운송비", kind: "flow" },
                ]}
                plant={plant}
                motion={motion}
                motionSrc="/te/map"
                img="/te/map"
                mask="/te/mask_"
                title="돈이 오가는 공장"
                sub="운송 · 해체 · 블랙매스 · 정제 · 판매 · 손익"
                keys={[
                  { k: "g0", label: "비용이 붙는 단계" },
                  { k: "g1", label: "수익과 판단" },
                  { k: "flow", label: "배터리 · 금속의 이동" },
                ]}
                capId="map-cap"
                caption={
                  <>
                    그림 1. 번호를 누르면 그 단계만 밝아지고 아래에 그 단계의 숫자가 뜹니다. &lsquo;공정 재생&rsquo;을 누르면 팩이 길을 따라 공장을 돌며 단계마다 쟁반에 동전이 쌓이고(산호색 =
                    비용, 청록 = 수익), 마지막 ⑥에서 저울 왼쪽 접시에 비용, 오른쪽 접시에 수익이 모입니다. 동전 수와 저울의 기울기는 개념이며 실제 수치가 아닙니다. 장면과 움직임은 이 사이트가
                    Blender로 직접 만든 설명용 도식입니다. <Cite src={stepSrc} />
                  </>
                }
              />
            </section>

            {/* ── 3 어디서 하느냐 ── */}
            <section id="te-where" className="rc-sec" aria-labelledby="h-where">
              <h2 id="h-where" className="rc-h2">
                <span>3</span>어디서 하느냐 — 같은 배터리, 다른 계산
              </h2>
              <p>
                영국 연구진은 영국에서 모은 전기차 배터리 8,000톤(셀 기준)을 다섯 나라의 공장으로 보내 재활용하는 경우를 계산했습니다. 멀리 보낼수록 운송비가, 인건비가 비쌀수록 해체비가
                커졌습니다. 나라를 골라 보세요. <Cite src={[92]} />
              </p>
              <figure className="rc-panel te-dest-fig" aria-labelledby="te-dest-cap">
                <DestPicker />
                <figcaption id="te-dest-cap">
                  그림 2. 운송비는 영국 수거 지점에서 각 나라 공장까지의 실제 견적, 해체비는 각 나라 시급으로 계산한 값입니다. 막대 길이는 1 kWh당 달러에 비례합니다. 운임을 무엇으로
                  잡느냐에 따라 운송비 비중이 몇 %에서 70% 넘게까지 바뀐다는 점도 함께 보여 줍니다. <Cite src={[92]} />
                </figcaption>
              </figure>
              <div className="sf-cards">
                <aside className="rc-note" aria-label="가장 남는 곳">
                  <h3>가장 남는 곳은 인건비가 싼 곳</h3>
                  <p>
                    세 가지 방법 모두 재활용 비용이 중국에서 가장 낮았고, 순이익도 1 kWh당 최대 21.91달러로 가장 컸습니다. 인건비와 일반 경비가 낮기 때문입니다. <Cite src={[92]} />
                  </p>
                </aside>
                <aside className="rc-note" aria-label="가까이서 하기">
                  <h3>가까이서 하면 운송비가 70% 준다</h3>
                  <p>
                    영국 배터리를 중국에서 재활용하면 운송비가 1 kWh당 1.24달러, 영국 안에서 하면 0.39달러로 최대 70% 줄었습니다. 연구진은 나라 안 재활용 시설을 늘리고 쉽게 뜯기는 팩을
                    설계하는 것을 길로 제시했습니다. <Cite src={[92]} />
                  </p>
                </aside>
              </div>
            </section>

            {/* ── 4 규모와 배터리 종류 ── */}
            <section id="te-scale" className="rc-sec" aria-labelledby="h-scale">
              <h2 id="h-scale" className="rc-h2">
                <span>4</span>규모와 배터리 종류 — 많이, 비싼 금속을
              </h2>
              <p>
                공장은 일정량 이상을 처리해야 설비비를 감당합니다. 같은 연구에서 손익이 0이 되는 처리량은 방법마다 크게 달랐습니다. 직접재생은 연 3천 톤, 습식은 7천 톤만 넘으면 남았지만
                건식은 1만 7천 톤이 필요했습니다. 직접재생은 되찾는 물질이 많아 수입도 컸습니다. <Cite src={[92]} />
              </p>
              <figure className="rc-panel te-be-fig" aria-labelledby="te-be-cap">
                <BreakEvenFig />
                <figcaption id="te-be-cap">
                  그림 3. 손익분기 처리량(연간 톤). 영국에서 NCA 팩을 처리하는 경우입니다. 연구가 가정한 공장 규모(연 8천 톤)에서는 건식만 손익분기에 못 미칩니다. 이 문턱은 회수한 금속의
                  가격에 따라 크게 달라질 수 있습니다. <Cite src={[92]} />
                </figcaption>
              </figure>
              <div className="sf-cards">
                <aside className="rc-note" aria-label="코발트">
                  <h3>코발트가 많을수록 남는다</h3>
                  <p>
                    연구가 쓴 가격은 1 kg당 코발트 51.3달러, 니켈 11.3달러, 망간 3.1달러였습니다. 그래서 코발트가 많은 배터리일수록 수익이 컸고, NCA 팩이 가장 남았습니다. <Cite src={[92]} />
                  </p>
                </aside>
                <aside className="rc-note" aria-label="LFP">
                  <h3>LFP는 다른 전략이 필요하다</h3>
                  <p>
                    값비싼 금속이 없는 LFP 배터리는 기존 건식 · 습식 재활용으로는 적자가 나기 쉽고, 손익이 리튬 가격에 크게 흔들립니다. 비용을 줄이는 별도 전략이 필요하며, 양극재를 그대로
                    되살리는 직접재생이면 LFP 팩도 이익을 낼 수 있다는 계산이 있습니다. <Cite src={[13, 93, 92]} />
                  </p>
                </aside>
              </div>
              <p className="tr-note-line">
                리튬 값이 오르자 공정 순서도 바뀌었습니다. 국내 연구는 리튬 가격 급등 이후 새 공정이 니켈 · 코발트보다 리튬을 먼저 회수하는 순서로 바뀌었다고 정리했습니다. <Cite src={[14]} />{" "}
                직접재생에서는 보충용 리튬염이 주요 원가인데, 블랙파우더에 남은 리튬을 끌어 써 외부 리튬염을 넣지 않은 연구도 나왔습니다. <Cite src={[9]} />
              </p>
            </section>

            {/* ── 5 같은 질문, 다른 답 ── */}
            <section id="te-studies" className="rc-sec" aria-labelledby="h-studies">
              <h2 id="h-studies" className="rc-h2">
                <span>5</span>같은 질문, 다른 답 — 숫자보다 전제를 읽기
              </h2>
              <p>
                &lsquo;재활용은 돈이 되나&rsquo;라는 같은 질문에 네 편의 분석이 서로 다른 크기의 답을 냈습니다. 어디까지 셌는지, 실측인지 모델인지가 다르기 때문입니다.
              </p>
              <figure className="rc-panel te-st-fig" aria-labelledby="te-st-cap">
                <StudyTable />
                <figcaption id="te-st-cap">
                  그림 4. 네 편 모두 조건이 맞으면 남는다는 쪽이지만 단위가 kWh당 이익, kg당 이익, 수익률, 비율로 제각각이라 숫자를 바로 견줄 수 없습니다. <Cite src={[92, 93, 94, 95]} />
                </figcaption>
              </figure>
              <div className="sf-cards">
                <aside className="rc-note" aria-label="경계">
                  <h3>블랙매스까지인가, 금속까지인가</h3>
                  <p>
                    블랙매스 파일럿 연구는 갈고 거르는 앞단만 따졌기 때문에 녹이고 정제하는 비싼 뒷단이 빠져 있습니다. 앞단만 보면 거의 늘 남지만, 이 연구도 블랙매스 값(그 안에 든 금속값)과 원료
                    구입가를 손익을 흔드는 요인으로 따로 따졌습니다. <Cite src={[93]} />
                  </p>
                </aside>
                <aside className="rc-note" aria-label="모델">
                  <h3>시뮬레이션은 가정 위의 값</h3>
                  <p>
                    공정 시뮬레이션으로 그린 대형 공장은 투자금을 2년 안에 회수한다고 나왔지만, 다 쓴 배터리가 시간당 1,314 kg씩 늘 들어온다는 가정 위의 값입니다. 실측 연구는 공장
                    가동률과 원료 구입가를 손익을 흔드는 요인으로 꼽았습니다. <Cite src={[94, 93]} />
                  </p>
                </aside>
              </div>
              <p className="tr-note-line">
                재사용도 마찬가지입니다. 전기차 배터리를 다시 쓰는 경제성은 전기요금, 새 배터리 가격, 사용 방식에 따라 달라지는 조건부 결론이었습니다(02 재사용). <Cite src={[25]} />
              </p>
            </section>

            {/* ── 6 남은 과제 ── */}
            <section id="te-next" className="rc-sec" aria-labelledby="h-next">
              <h2 id="h-next" className="rc-h2">
                <span>6</span>남은 과제
              </h2>
              <div className="sf-cards">
                <aside className="rc-note" aria-label="국내 수요">
                  <h3>기술보다 물량</h3>
                  <p>
                    국내 분석은 재활용 사업의 경제성이 있고 기술도 일부 확보됐는데도 산업이 크지 않은 이유를 수요에서 찾았습니다. 연구는 리튬이차전지를 생산자책임재활용 의무 품목에 넣어 국내
                    물량을 늘리자고 제안했습니다. 이후 사용후 배터리를 따로 관리하는 법이 생긴 흐름은 10 재생원료 인증 · 13 공급망에서 다룹니다. <Cite src={[95]} />
                  </p>
                </aside>
                <aside className="rc-note" aria-label="숫자를 읽는 법">
                  <h3>숫자를 읽을 때 물어볼 것</h3>
                  <p>
                    어디까지 셌나(블랙매스까지인가, 금속까지인가). 다 쓴 배터리를 얼마에 샀다고 봤나. 금속 가격은 언제 기준인가. 공장 규모와 위치는 어디인가. 실측인가, 모델인가. 이 다섯 가지가
                    다르면 두 숫자는 비교할 수 없습니다. <Cite src={[92, 93, 94]} />
                  </p>
                </aside>
              </div>
              <div className="sf-links">
                <Link href="/topics/recycling" className="sf-link">
                  <b>03</b>
                  <span>
                    <strong>재활용</strong>건식 · 습식 · 직접재생 공정
                  </span>
                </Link>
                <Link href="/topics/lca" className="sf-link">
                  <b>11</b>
                  <span>
                    <strong>전과정평가</strong>환경 쪽 계산
                  </span>
                </Link>
                <Link href="/topics/supply-chain" className="sf-link">
                  <b>13</b>
                  <span>
                    <strong>공급망 · 자원안보</strong>물량과 정책
                  </span>
                </Link>
              </div>
            </section>

            <RefsSection
              papers={papers}
              other={other}
              note={<>보강 — 92~95번 문헌은 2026년 11월 이 페이지를 개편하며 추가했습니다. 95번은 국내 연구입니다.</>}
            />
            <NextNav slug="techno-economic" />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
