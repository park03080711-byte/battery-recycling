import Link from "next/link";
import Footer from "@/components/Footer";
import { topicBySlug } from "@/data/topics";
import { Cite, LevelTag } from "../rc/Cite";
import { RcToc } from "../rc/Interactive";
import { SystemMap } from "../rc/SystemMap";
import { NextNav, RefsSection, TopicHead, type Kpi } from "../rc/kit";
import { collectCited } from "../rc/sources";
import { econ, facts, stepSrc, steps, toc, tiers } from "./data";
import { GatesArt, IconCells, IconSteps, IconTier } from "./Icons";
import { BalanceDemo, DepthExplorer } from "./Parts";
import { TierStair } from "../rc/Tiers";
import shop from "./shop.json";
import motion from "./motion.json";

const icons = [<IconTier key="a" />, <IconCells key="b" />, <IconSteps key="c" />];
const kpis: Kpi[] = facts.map((f, i) => ({ ...f, icon: icons[i] }));

const { papers, other } = collectCited(facts.flatMap((f) => f.src), stepSrc, ["R", "P2", 23, 26, 36, 37, 38, 39, 40, 41]);

function Pct({ v }: { v: number }) {
  // 팩 통째 교체를 0으로 둔 차이(%) — 한 축, 0 기준 양옆
  const w = Math.abs(v) * 7;
  return (
    <span className="rm-econ-bar">
      <span className="axis" aria-hidden="true" />
      <i className={v < 0 ? "neg" : "pos"} style={{ width: `${w}%`, [v < 0 ? "right" : "left"]: "50%" }} aria-hidden="true" />
      <b style={{ [v < 0 ? "right" : "left"]: `calc(50% + ${w}% + 6px)` }}>
        {v > 0 ? "+" : ""}
        {v}%
      </b>
    </span>
  );
}

export default function RemanPage() {
  const soh = topicBySlug("soh-diagnosis")!;
  const dis = topicBySlug("automated-disassembly")!;
  return (
    <div className="rc">
      <main id="main">
        <TopicHead
          slug="remanufacturing"
          sub="세 갈래 처리 경로 중 첫 번째"
          papers={papers.length}
          kpis={kpis}
          lead="잔존용량이 80% 이상 남은 배터리를 열어 지친 부분만 바꾸고, 다시 조립해 본래 성능으로 되돌리는 경로입니다. 다시 자동차에 실리기 때문에 세 경로 가운데 안전 기준이 가장 높고, 얼마나 깊이 뜯어 무엇을 바꾸느냐가 품과 가치를 가릅니다."
        />

        <div className="rc-wrap rc-body">
          <RcToc items={toc} />

          <div className="rc-main">
            {/* ── 1 세 갈래 ── */}
            <section id="rm-branch" className="rc-sec" aria-labelledby="h-branch">
              <h2 id="h-branch" className="rc-h2">
                <span>1</span>세 갈래 중 맨 위
              </h2>
              <p>
                전기차에서 떼어 낸 배터리는 곧바로 분해되지 않습니다. 남은 성능, 즉 잔존용량에 따라 갈 길이 정해지고, 재제조는 그중 성능이 가장 많이 남은 배터리가 가는
                길입니다. 세 경로는 결과물뿐 아니라 근거 법령과 소관 부처도 서로 다릅니다. <Cite src={["R"]} />
              </p>
              <TierStair active={0} />
              <figure className="rc-panel">
                <div className="rc-table-wrap" tabIndex={0} role="region" aria-label="세 처리 경로 비교표">
                  <table className="rc-table">
                    <caption className="sr-only">세 처리 경로의 잔존용량 기준, 산출물, 근거 법령, 소관 부처</caption>
                    <thead>
                      <tr>
                        <th scope="col">경로</th>
                        <th scope="col">잔존용량</th>
                        <th scope="col">산출물</th>
                        <th scope="col">근거 법령 · 소관</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tiers.map((t, i) => (
                        <tr key={t.key} className={i === 0 ? "rm-cur" : undefined}>
                          <th scope="row">
                            {t.no} {t.title}
                          </th>
                          <td>{t.soh}</td>
                          <td>{t.out}</td>
                          <td>
                            {t.law}
                            <small>{t.who}</small>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <figcaption>
                  표 1. <LevelTag level="policy" /> 법령 구분은 바탕 보고서의 정리이며, 제도는 개정될 수 있어 인용할 때 다시 확인해야 합니다. <Cite src={["R"]} />
                </figcaption>
              </figure>
              <aside className="rc-note" aria-label="용어 주의">
                <h3>용어 주의 — 문헌마다 &lsquo;재제조&rsquo;의 뜻이 다릅니다</h3>
                <p>
                  이 페이지의 재제조는 팩을 고쳐 본래 성능으로 되돌리는 일입니다. 그런데 일부 문헌은 회수한 원료로 새 셀을 만드는 일도 재제조라고 부릅니다. 그런 연구에서
                  보고한 에너지 8.55% · 온실가스 6.62% 감소 같은 수치는 이 페이지의 재제조와 다른 대상을 잰 것이라 섞어 인용하면 안 됩니다. <Cite src={[41]} />
                </p>
              </aside>
            </section>

            {/* ── 2 공정 지도 ── */}
            <section id="rm-map" className="rc-sec" aria-labelledby="h-map">
              <h2 id="h-map" className="rc-h2">
                <span>2</span>어떻게 되살리는가
              </h2>
              <p>
                차에서 내린 팩은 네 단계를 거쳐 다시 차로 돌아갑니다. 앞의 두 단계는 무엇이 지쳤는지 가려 바꾸는 일이고, 뒤의 두 단계는 바꾼 팩을 하나의 팩으로 다시 맞추고
                확인하는 일입니다. 교체 기준은 &ldquo;가장 작은 불량 단위만 바꾼다&rdquo;입니다. <Cite src={[37]} />
              </p>
              <SystemMap
                steps={steps}
                groups={[
                  { label: "분해 · 판정", tag: "분해 · 판정" },
                  { label: "복원 · 검증", tag: "복원 · 검증" },
                ]}
                mid="교체 완료"
                overlays={[
                  { at: "cin", kind: "flow", text: "입고 — 전기차에서 떼어 낸 팩" },
                  { at: "cout", kind: "flow", text: "출고 — 다시 전기차로" },
                ]}
                plant={shop}
                img="/rm/shop"
                mask="/rm/mask_"
                motion={motion}
                motionSrc="/rm/shop"
                title="재제조 작업장"
                sub="팩 하나가 차로 돌아가기까지 · 4단계"
                keys={[
                  { k: "g0", label: "분해 · 판정" },
                  { k: "g1", label: "복원 · 검증" },
                  { k: "flow", label: "팩의 이동" },
                ]}
                capId="shop-cap"
                caption={
                  <>
                    그림 2. &lsquo;공정 재생&rsquo;을 누르면 팩이 바닥 흐름선을 따라 이동하며 단계마다 설비가 움직입니다 — ① 진단 막대가 모듈을 훑고 지친 모듈을 찾아냄, ② 호이스트가 지친 모듈을 빼고 새 모듈을 끼움, ③ 케이블로 충방전하며 상태등이 맞춰짐, ④ 검사를 통과하면 초록 불. 호박색은 교체 대상으로 판정된 모듈, 연파랑은 등급을 맞춘 교체 모듈입니다. 빼낸 모듈은 상태에 따라 재사용이나 재활용으로 넘어갑니다. 장면은 이 사이트가
                    Blender로 직접 모델링 · 렌더한 설명용 도식이며 실제 작업장 배치와 다릅니다. <Cite src={[38, 37, "P2"]} />
                  </>
                }
              />
            </section>

            {/* ── 3 셀밸런싱 ── */}
            <section id="rm-balance" className="rc-sec" aria-labelledby="h-bal">
              <h2 id="h-bal" className="rc-h2">
                <span>3</span>바꾼 다음에는 맞춰야 한다
              </h2>
              <p>
                팩이 멈출 때도 대부분의 셀은 아직 쓸 만합니다. 직렬로 묶인 셀들이 온도 차이와 부하 차이로 서로 다르게 늙기 때문입니다. <Cite src={[36]} /> 그래서 지친 부분을
                바꾼 뒤에는 새로 넣은 것과 남은 것의 충전 상태를 맞춰야 팩 전체가 제 용량을 냅니다. 아래 예시에서 버튼을 눌러 전후를 비교해 보세요.
              </p>
              <BalanceDemo />
            </section>

            {/* ── 4 해체 깊이 ── */}
            <section id="rm-depth" className="rc-sec" aria-labelledby="h-depth">
              <h2 id="h-depth" className="rc-h2">
                <span>4</span>어디까지 뜯어야 하나
              </h2>
              <p>
                남은 가치를 가장 많이 살리려면 셀 단위까지 뜯어야 한다는 것이 연구의 결론입니다. <Cite src={[36]} /> 하지만 지금 산업 현장의 해체는 모듈 단위에서 멈춥니다. 셀이
                바닥에 충전재로 굳혀지고 면 전체가 접착되어 있으며 접점이 점용접된 팩에서는, 셀을 꺼내려면 앵글 그라인더 같은 파괴적 도구가 필요했습니다.{" "}
                <Cite src={[37]} />
              </p>
              <DepthExplorer />
              <figure className="rc-panel rm-steps">
                <p className="rc-fig-h">해체에 든 단계 수 — 같은 연구, 두 차종</p>
                <ul className="rm-steps-list">
                  <li>
                    <span className="nm">
                      PHEV 팩 <small>해체 순서</small>
                    </span>
                    <span className="track" aria-hidden="true">
                      <i style={{ width: `${(22 / 22) * 100}%` }} />
                    </span>
                    <b>22단계</b>
                  </li>
                  <li>
                    <span className="nm">
                      BEV 소형차 팩 <small>모듈에 닿기까지</small>
                    </span>
                    <span className="track" aria-hidden="true">
                      <i style={{ width: `${(10 / 22) * 100}%` }} />
                    </span>
                    <b>10단계</b>
                  </li>
                </ul>
                <figcaption>
                  그림 5. 두 팩의 셈 기준(해체 순서 전체 / 모듈에 닿기까지)이 달라 단순 비교는 어렵지만, 설계에 따라 품이 크게 달라진다는 점은 분명합니다. 한쪽은 용접 · 접착, 다른 쪽은
                  리벳으로 고정된 금속 틀이었습니다. <Cite src={[37]} />
                </figcaption>
              </figure>
            </section>

            {/* ── 5 경제성 ── */}
            <section id="rm-econ" className="rc-sec" aria-labelledby="h-econ">
              <h2 id="h-econ" className="rc-h2">
                <span>5</span>셀만 바꾸면 늘 이득일까
              </h2>
              <p>
                꼭 그렇지는 않습니다. 셀 교체와 팩 통째 교체를 비교한 모델 시뮬레이션에서, 잔존용량 80%를 교체 시점으로 잡으면 셀 교체가 약 6% 저렴했지만 70%로 잡으면 오히려
                2% 비쌌습니다. 수명(충방전 횟수)은 두 경우 모두 1~3% 늘어나는 데 그쳤습니다. 이득을 보려면 셀마다 상태를 따로 읽는 배터리 관리 시스템과, 교체할 셀에 쉽게 닿는
                팩 설계가 먼저라는 것이 연구의 결론입니다. <Cite src={[39]} />
              </p>
              <figure className="rc-panel rm-econ">
                <p className="rc-fig-h">팩 통째 교체와 비교한 셀 교체의 차이 (0 = 팩 통째 교체)</p>
                <div className="rm-econ-grid">
                  <div className="rm-econ-head" aria-hidden="true">
                    <span />
                    <span>비용</span>
                    <span>수명</span>
                  </div>
                  {econ.map((e) => (
                    <div key={e.case} className="rm-econ-row">
                      <span className="nm">{e.case}</span>
                      <span className="cell" aria-label={`비용 ${e.cost > 0 ? "+" : ""}${e.cost}%`}>
                        <Pct v={e.cost} />
                      </span>
                      <span className="cell" aria-label={`수명 +${e.cycles}%`}>
                        <Pct v={e.cycles} />
                      </span>
                    </div>
                  ))}
                </div>
                <figcaption>
                  그림 6. <LevelTag level="paper" /> 한 연구의 모델 시뮬레이션 결과이며 실제 사업 데이터가 아닙니다. 비용은 낮을수록, 수명은 높을수록 유리합니다.{" "}
                  <Cite src={[39]} />
                </figcaption>
              </figure>
            </section>

            {/* ── 6 점검과 이력 ── */}
            <section id="rm-check" className="rc-sec" aria-labelledby="h-check">
              <h2 id="h-check" className="rc-h2">
                <span>6</span>폐기물이 아니라 제품으로
              </h2>
              <p>
                탈거 전 상세 성능평가에서 재제조 · 재사용 기준을 충족한 배터리는 떼어 낸 시점부터 폐기물이 아닌 제품으로 인정되고 순환자원으로 지정됩니다. 품질을 믿을 수 있도록
                세 번의 점검이 함께 도입됩니다. <Cite src={["R"]} />
              </p>
              <figure className="rc-panel rm-gates">
                <GatesArt />
                <ol className="rm-gates-list">
                  <li>
                    <b>1</b>
                    <div>
                      <h3>성능평가</h3>
                      <p>탈거 전에 등급을 나눠 재제조 · 재사용 · 재활용 중 어디로 갈지 정합니다.</p>
                    </div>
                  </li>
                  <li>
                    <b>2</b>
                    <div>
                      <h3>유통 전 안전검사</h3>
                      <p>다시 팔리기 전에 안전성을 확인합니다.</p>
                    </div>
                  </li>
                  <li>
                    <b>3</b>
                    <div>
                      <h3>사후 검사</h3>
                      <p>유통된 뒤에도 품질을 다시 확인합니다.</p>
                    </div>
                  </li>
                </ol>
                <figcaption>
                  그림 7. 3단계 점검 체계. <Cite src={["R"]} />
                </figcaption>
              </figure>
              <aside className="rc-note" aria-label="배터리 이력 관리">
                <h3>배터리에도 번호판이 생겼다</h3>
                <p>
                  2025년 2월 개정 자동차관리법이 시행되면서 전기차 배터리 안전성은 제조사 자체 인증 대신 정부가 직접 인증합니다. 배터리마다 식별번호가 자동차등록원부에 올라가고,
                  배터리를 바꾸면 교환된 배터리의 번호를 변경 등록합니다. 재제조 팩이 차로 돌아갈 때도 이 기록이 따라갑니다. <Cite src={["P2"]} />
                </p>
              </aside>
            </section>

            {/* ── 병목 ── */}
            <section className="rc-sec" aria-labelledby="h-neck">
              <h2 id="h-neck" className="rc-h2">
                <span>!</span>막히는 곳은 두 군데
              </h2>
              <ul className="rm-necks">
                <li>
                  <Link href={`/topics/${soh.slug}`}>
                    <span className="n">{soh.no}</span>
                    <b>빠르고 정확한 상태 진단</b>
                    <span>
                      은퇴 배터리는 측정 데이터가 드물고 사용 이력이 불완전하며 조성도 제각각입니다. 정밀 진단은 오래 걸려 대량 선별 현장에 쓰기 어렵습니다.
                    </span>
                    <span className="go">
                      {soh.no} {soh.title}로 →
                    </span>
                  </Link>
                </li>
                <li>
                  <Link href={`/topics/${dis.slug}`}>
                    <span className="n">{dis.no}</span>
                    <b>안전하고 빠른 해체</b>
                    <span>팩 해체는 대부분 사람 손으로 이뤄지고 감전 위험이 있습니다. 팩마다 설계가 달라 표준화도 어렵습니다. 로봇 해체 셀 시제품이 제안됐습니다.</span>
                    <span className="go">
                      {dis.no} {dis.title}로 →
                    </span>
                  </Link>
                </li>
              </ul>
              <p className="rm-necks-src">
                근거 <Cite src={[23, 26]} /> · 23번은 동료심사 전 프리프린트입니다.
              </p>
            </section>

            <RefsSection
              papers={papers}
              other={other}
              note={<>보강 — 36~41번 문헌과 국토교통부 자료는 2026년 9월 이 페이지를 개편하며 추가했습니다.</>}
            />
            <NextNav slug="remanufacturing" />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
