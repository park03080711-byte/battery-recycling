import Footer from "@/components/Footer";
import { IconLithium, IconNine, IconRecovery } from "./Iso";
import { Cite, LevelTag } from "./Cite";
import { ProcessTable, ProductStack, RcToc, TempBars } from "./Interactive";
import { SystemMap, type MapStep } from "./SystemMap";
import { NextNav, RefsSection, TopicHead, type Kpi } from "./kit";
import { collectCited } from "./sources";
import { facts, feas, hubSteps, processes, temps, toc } from "./data";
import plant from "./plant.json";
import motion from "./motion.json";

const kpiIcon = [<IconRecovery key="a" />, <IconLithium key="b" />, <IconNine key="c" />];
const kpis: Kpi[] = facts.map((f, i) => ({ ...f, icon: kpiIcon[i] }));
const steps: MapStep[] = hubSteps.map((s) => ({ ...s, g: s.side === "hub" ? 1 : 0 }));

/* 이 페이지에서 인용한 출처 전부 — 본문 인용과 목록이 어긋나지 않게 데이터에서 모은다 */
const { papers: citedPapers, other: citedOther } = collectCited(
  [2, 4, 5, 8, 9, 11, 19, 14, 15, "C1", "P1", "R"],
  facts.flatMap((f) => f.src),
  temps.flatMap((t) => t.src),
  processes.flatMap((p) => p.src),
  feas.flatMap((f) => f.src)
);

export default function RecyclingPage() {
  return (
    <div className="rc">
      <main id="main">
        <TopicHead
          slug="recycling"
          sub="네 갈래 활용 방안 중 하나"
          papers={citedPapers.length}
          kpis={kpis}
          lead="잔존용량 60% 미만의 배터리를 부수고 녹여 리튬 · 니켈 · 코발트 · 망간을 원소 단위로 회수합니다. 지금 산업의 표준은 습식제련이고, 연구 중인 대안은 공정 전체보다 특정 단계를 바꾸는 쪽에서 설득력을 얻고 있습니다."
        />

        <div className="rc-wrap rc-body">
          <RcToc items={toc} />

          <div className="rc-main">
            {/* ── 1 기준 공정 ── */}
            <section id="rc-hub" className="rc-sec" aria-labelledby="h-hub">
              <h2 id="h-hub" className="rc-h2">
                <span>1</span>기준 공정 — Hub &amp; Spoke 습식제련
              </h2>
              <p>
                국내 최대 리사이클링 기업의 공정은 지리적으로 떨어진 두 단계로 나뉩니다. 해외 각지의 전처리 거점(Spoke)이 부피와 위험을 줄이고, 국내 거점(Hub)이 화학적
                정제를 맡습니다. 이 공정은 정부 출연연구기관(KIGAM)과 공동 개발됐습니다. <Cite src={[14]} />
              </p>
              <SystemMap
                steps={steps}
                groups={[
                  { label: "전처리 · 해외", tag: "전처리 · 해외 Spoke" },
                  { label: "후처리 · 국내", tag: "후처리 · 국내 Hub" },
                ]}
                mid="블랙매스 이송"
                overlays={[
                  { at: "zs", kind: "zone", badge: "Spoke", text: "해외 전처리 거점" },
                  { at: "zh", kind: "zone", badge: "Hub", text: "국내 후처리 거점", g: 1 },
                  { at: "tr", kind: "flow", text: "블랙매스로 줄여 이송" },
                ]}
                plant={plant}
                img="/rc/plant"
                mask="/rc/mask_"
                motion={motion}
                motionSrc="/rc/plant"
                title="공정 지도"
                sub="Hub & Spoke 습식제련 · 7단계"
                keys={[
                  { k: "g0", label: "해외 전처리 거점" },
                  { k: "g1", label: "국내 후처리 거점" },
                  { k: "flow", label: "물질 흐름" },
                ]}
                capId="map-cap"
                caption={
                  <>
                    그림 1. 전처리는 해외 각지, 화학 정제는 국내에서. &lsquo;공정 재생&rsquo;을 누르면 해외 거점의 세 단계를 지난 뒤 트럭이 블랙매스를 싣고 국내 거점까지 달리고, 국내에서는 용액이 배관을 따라 침출 → 정제 → 용매추출(망간 → 코발트 → 니켈) → 결정화로 흐릅니다. 무겁고 화재 위험이 큰 팩은 현지에서 분말(블랙매스)로 바꾼 뒤에만 이동합니다. 장면은 이 사이트가 Blender로
                    직접 모델링 · 렌더한 설명용 도식이며 실제 설비 배치와는 다릅니다. 공정 설명은 기업 공개 자료를 학술 문헌과 교차 확인했습니다. <Cite src={["C1", 14, 15]} />
                  </>
                }
              />
              <p>
                황산 기반 침출은 습식 경로 가운데 상업적으로 확립된 유일한 방식으로 평가됩니다. <Cite src={[1]} /> 결과물은 금속마다 색이 다른 황산염 결정이고, 이 사이트의
                금속 색도 이 결정의 실제 색에서 가져왔습니다.
              </p>
              <ProductStack />
            </section>

            {/* ── 2 건식 vs 습식 ── */}
            <section id="rc-lithium" className="rc-sec" aria-labelledby="h-li">
              <h2 id="h-li" className="rc-h2">
                <span>2</span>무게로 가를까, 화학으로 가를까
              </h2>
              <p>
                건식제련은 배터리를 통째로 녹여 밀도 차이로 금속을 가릅니다. 아래층에 코발트 · 니켈 · 구리 합금이, 위층에 슬래그가 뜨는데 이때 리튬 · 알루미늄 · 망간이
                슬래그로 빠집니다. 습식제련은 녹인 뒤 화학적 성질로 가르기 때문에 느리고 단계가 많은 대신 리튬까지 건질 수 있습니다. 서로 다른 기관의 리뷰들이 같은
                진단을 내립니다. <Cite src={[2, 4]} />
              </p>

              <figure className="rc-panel rc-fork">
                <p className="rc-fig-h">리튬은 어디로 가는가</p>
                <div className="lane">
                  <p className="lane-h">
                    건식제련 <span>1,400℃ 이상</span>
                  </p>
                  <ol>
                    <li>팩 · 모듈째 투입</li>
                    <li>용융 · 유기물 연소</li>
                    <li className="split">
                      <span className="ok">
                        합금 <b>Co · Ni · Cu</b> <em>→ 습식 정제가 더 필요</em>
                      </span>
                      <span className="lost">
                        슬래그 <b>Al · Mn</b> <i className="li-mark lost">Li</i> <em>회수 어려움</em>
                      </span>
                    </li>
                  </ol>
                </div>
                <div className="lane hydro">
                  <p className="lane-h">
                    습식제련 <span>80℃ 안팎</span>
                  </p>
                  <ol>
                    <li>블랙매스</li>
                    <li>침출 · 정제</li>
                    <li className="split">
                      <span className="ok">
                        황산염 <b>Ni · Co · Mn</b>
                      </span>
                      <span className="ok">
                        리튬염 <i className="li-mark">Li</i> <em>회수</em>
                      </span>
                    </li>
                  </ol>
                </div>
                <figcaption>그림 5. 리튬은 색이 아니라 네모 표시로 추적합니다. 점선 네모는 회수되지 않는 흐름입니다.</figcaption>
              </figure>

              <TempBars />

              <aside className="rc-note" aria-label="규제 측면">
                <h3>리튬 회수가 왜 중요한가</h3>
                <p>
                  EU는 2027년까지 폐배터리 리튬의 50%를 추출하도록 요구하고, 2031년부터 신품에 리튬 재생원료 6%를 넣도록 합니다. 리튬을 회수하지 못하는 공정은
                  규제에 대응할 수 없습니다. <Cite src={["P1"]} />
                </p>
              </aside>
            </section>

            {/* ── 3 공정 9종 ── */}
            <section id="rc-nine" className="rc-sec" aria-labelledby="h-nine">
              <h2 id="h-nine" className="rc-h2">
                <span>3</span>재활용 공정 9종
              </h2>
              <p>
                직접재생은 분해해서 원료를 되찾는 대신 분해하지 않고 고칩니다. 충방전으로 빠져나간 리튬의 빈자리만 다시 채우므로 결정 구조가 한 번도 해체되지 않습니다.
                <Cite src={[8, 9, 19]} /> 바이오리칭은 황을 먹고 황산을 내놓는 세균에게 산 생산을 맡깁니다. 가장 낮은 온도, 가장 적은 화학물질 구매, 가장 긴 시간이
                특징입니다. <Cite src={[11]} />
              </p>
              <ProcessTable />
            </section>

            {/* ── 4 이론적 대안 ── */}
            <section id="rc-feas" className="rc-sec" aria-labelledby="h-feas">
              <h2 id="h-feas" className="rc-h2">
                <span>4</span>이론적 대안은 어디까지 왔나
              </h2>
              <p>
                다섯 대안 중 어느 것도 습식제련을 통째로 대체할 근거는 부족합니다. 반면 특정 단계를 떼어 내 바꾸는 방향으로는 설득력이 있습니다. 기계화학은 침출 단계를,
                초임계 CO₂는 열처리로 하던 전해액 처리를 대신할 수 있습니다.
              </p>
              <figure className="rc-panel">
                <div className="rc-table-wrap" tabIndex={0} role="region" aria-label="이론적 대안의 실현 가능성 표">
                  <table className="rc-table rc-feas">
                    <caption className="sr-only">이론적 대안 여섯 가지의 실현 가능성 — 조사자 판단</caption>
                    <thead>
                      <tr>
                        <th scope="col">접근</th>
                        <th scope="col">실현 가능성</th>
                        <th scope="col">현실적 위치</th>
                        <th scope="col">문헌</th>
                      </tr>
                    </thead>
                    <tbody>
                      {feas.map((r) => (
                        <tr key={r.n}>
                          <th scope="row">{r.n}</th>
                          <td>
                            <span className="meter" role="img" aria-label={`4단계 중 ${r.g}단계, ${r.gl}`}>
                              {[1, 2, 3, 4].map((i) => (
                                <i key={i} className={i <= r.g ? "on" : ""} />
                              ))}
                            </span>
                            <b className="gl">{r.gl}</b>
                          </td>
                          <td>
                            <b>{r.role}</b>
                            <span className="why">{r.why}</span>
                          </td>
                          <td>
                            <Cite src={r.src} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <figcaption>
                  그림 6. <LevelTag level="judgement" /> 등급은 문헌 서술을 근거로 한 조사자 판단이며 표준 기술성숙도(TRL) 평가가 아닙니다. 인용된 성능 수치 대부분은 단일 조성
                  시료의 실험실 값입니다. <Cite src={["R"]} />
                </figcaption>
              </figure>
            </section>

            <RefsSection
              papers={citedPapers}
              other={citedOther}
              note={<>바뀐 점 — 기존 페이지의 &ldquo;세계 상위 양산 업체 5곳 중 4곳이 습식 채택&rdquo;은 출처 문헌을 확인할 수 없어 이 판에서 뺐습니다.</>}
            />
            <NextNav slug="recycling" />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
