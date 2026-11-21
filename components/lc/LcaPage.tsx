import Link from "next/link";
import Footer from "@/components/Footer";
import { Cite } from "../rc/Cite";
import { RcToc } from "../rc/Interactive";
import { SystemMap } from "../rc/SystemMap";
import { NextNav, RefsSection, TopicHead, type Kpi } from "../rc/kit";
import { collectCited } from "../rc/sources";
import { allocSrc, facts, phaseSrc, phases, routes, stepSrc, steps, timeline, toc } from "./data";
import { IconCut, IconFive, IconThird } from "./Icons";
import { AllocPicker, BoundaryPicker, CutTable, GateFig } from "./Parts";
import plant from "./map.json";
import motion from "./motion.json";

const icons = [<IconCut key="a" />, <IconFive key="b" />, <IconThird key="c" />];
const kpis: Kpi[] = facts.map((f, i) => ({ ...f, icon: icons[i] }));

const { papers, other } = collectCited(
  facts.flatMap((f) => f.src),
  phaseSrc,
  stepSrc,
  routes.flatMap((r) => r.src),
  allocSrc,
  timeline.flatMap((t) => t.src),
  [24, 44, 89, "P7"]
);

export default function LcaPage() {
  return (
    <div className="rc">
      <main id="main">
        <TopicHead
          slug="lca"
          sub="탄소발자국 · 공급망 비교"
          papers={papers.length}
          kpis={kpis}
          asOf="2026년 11월"
          lead="재활용이 '친환경'인지는 느낌이 아니라 계산으로 답합니다. 전과정평가는 같은 물건 하나를 만들고 쓰고 버리는 동안 들어간 자원과 나온 배출을 모두 더하는 방법입니다. 이 계산은 무엇을 기준으로, 어디까지, 어떤 전기로 셌는지에 따라 답이 크게 달라집니다. 그래서 숫자와 함께 그 전제를 읽어야 합니다."
        />

        <div className="rc-wrap rc-body">
          <RcToc items={toc} />

          <div className="rc-main">
            {/* ── 1 무엇을, 어디까지 재나 ── */}
            <section id="lc-what" className="rc-sec" aria-labelledby="h-what">
              <h2 id="h-what" className="rc-h2">
                <span>1</span>무엇을, 어디까지 재나
              </h2>
              <p>
                전과정평가는 국제 표준이 정한 네 단계를 거칩니다. 가장 먼저 정하는 것이 비교의 기준(기능 단위)과 셀 범위(경계)입니다. <Cite src={phaseSrc} />
              </p>
              <ol className="lc-phases">
                {phases.map((p) => (
                  <li key={p.k}>
                    <b>{p.k}</b>
                    <div>
                      <p className="t">{p.t}</p>
                      <p className="d">{p.d}</p>
                    </div>
                  </li>
                ))}
              </ol>
              <p className="tr-lead2">
                경계를 바꾸면 세는 단계와 기준 단위가 함께 바뀝니다. 버튼을 눌러 보세요. <Cite src={[86, "P7"]} />
              </p>
              <figure className="rc-panel lc-bd-fig" aria-labelledby="lc-bd-cap">
                <BoundaryPicker />
                <figcaption id="lc-bd-cap">
                  그림 1. 같은 배터리 원료라도 경계와 기준 단위가 다르면 숫자를 바로 비교할 수 없습니다. EU 탄소발자국의 경계는 규정 부속서 II를 정리했습니다. <Cite src={[86, "P7", 44]} />
                </figcaption>
              </figure>
            </section>

            {/* ── 2 두 갈래 공급망 ── */}
            <section id="lc-map" className="rc-sec" aria-labelledby="h-map">
              <h2 id="h-map" className="rc-h2">
                <span>2</span>두 갈래 공급망 — 같은 양극재, 다른 길
              </h2>
              <p>
                같은 양극재 1 kg을 광산에서 캐 온 원료로 만들 때와 다 쓴 배터리에서 되살린 원료로 만들 때를 나란히 놓았습니다. 실제 재활용 공장의 운영 자료로 두 길을 비교한 연구를
                따랐습니다. <Cite src={stepSrc} />
              </p>
              <SystemMap
                steps={steps}
                groups={[
                  { label: "광산에서 오는 원료", tag: "기존 공급망" },
                  { label: "폐배터리에서 오는 원료", tag: "순환 공급망" },
                ]}
                mid="같은 공장"
                overlays={[
                  { at: "zh", text: "양극재 공장 — 두 길의 합", kind: "zone", badge: "1 kg" },
                  { at: "zr", text: "수거 → 재활용 (+ 전력)", kind: "flow" },
                ]}
                plant={plant}
                motion={motion}
                motionSrc="/lc/map"
                img="/lc/map"
                mask="/lc/mask_"
                title="두 갈래 공급망"
                sub="광산 · 제련 · 운송 · 수거 · 재활용 · 전력"
                keys={[
                  { k: "g0", label: "광산에서 오는 원료" },
                  { k: "g1", label: "폐배터리에서 오는 원료" },
                  { k: "flow", label: "원료 · 전기의 이동" },
                ]}
                capId="map-cap"
                caption={
                  <>
                    그림 2. 번호를 누르면 그 단계만 밝아지고 아래에 그 단계의 몫이 뜹니다. &lsquo;공정 재생&rsquo;을 누르면 뒤쪽 길과 앞쪽 길을 차례로 지나며 단계마다 옆 유리
                    &lsquo;탄소 기둥&rsquo;이 차오르고, 양극재 공장 지붕 위 큰 기둥(왼쪽 광산 길 · 오른쪽 재활용 길)에 그 몫이 쌓입니다. 마지막 ⑥은 같은 공장도 전기에 따라 기둥 높이가 바뀐다는
                    것을 괄호로 표시합니다. 기둥 높이는 개념이며 실제 수치는 아래 그림 3에 있습니다. 장면과 움직임은 이 사이트가 Blender로 직접 만든 설명용 도식입니다.{" "}
                    <Cite src={stepSrc} />
                  </>
                }
              />
            </section>

            {/* ── 3 숫자로 보기 ── */}
            <section id="lc-num" className="rc-sec" aria-labelledby="h-num">
              <h2 id="h-num" className="rc-h2">
                <span>3</span>숫자로 보기 — 공장 안에서 이미 절반 아래
              </h2>
              <p>
                비교 기준은 니켈 · 코발트 · 알루미늄 양극재(NCA) 1 kg입니다. 공장 안 정제 단계만 따져도 재활용 원료가 광산 원료의 절반 아래였고, 배터리 공장에서 나온 공정 스크랩은 더
                낮았습니다. <Cite src={[86]} />
              </p>
              <figure className="rc-panel lc-gate-fig" aria-labelledby="lc-gate-cap">
                <GateFig />
                <CutTable />
                <figcaption id="lc-gate-cap">
                  그림 3. 위: 공장 안 정제 단계의 온실가스(양극재 1 kg당 kg CO₂e). 아래: 광산 원료 정제 대비 줄어든 비율. 미국 한 재활용 기업의 실제 운영 자료와 그 지역 전력으로 계산한 값이라
                  다른 공장 · 다른 전력에서는 달라집니다. <Cite src={[86]} />
                </figcaption>
              </figure>
              <div className="sf-cards">
                <aside className="rc-note" aria-label="운송의 차이">
                  <h3>멀리 옮기는 것도 몫이 크다</h3>
                  <p>
                    광산 정광을 옮기는 데 양극재 1 kg당 3.68 kg CO₂e가 나온 반면, 전기차 팩을 근처 공장으로 옮기는 데는 0.073 kg CO₂e였습니다. 캐내고 옮기는 앞 단계가 광산 길에서는 최대 30%,
                    재활용 길에서는 4% 미만이었습니다. <Cite src={[86]} />
                  </p>
                </aside>
                <aside className="rc-note" aria-label="전력의 차이">
                  <h3>재활용 공장의 숫자는 전기가 정한다</h3>
                  <p>
                    재활용의 영향은 대부분 공장이 쓰는 전기에서 나왔습니다. 어떤 지역 전력을 쓰느냐에 따라 온실가스가 최대 5배까지 달라졌으니, 재활용 공장을 어디에 세우고 어떤 전기를 받느냐가 공정
                    선택만큼 중요합니다. <Cite src={[86]} />
                  </p>
                </aside>
              </div>
            </section>

            {/* ── 4 경로마다 다르다 ── */}
            <section id="lc-route" className="rc-sec" aria-labelledby="h-route">
              <h2 id="h-route" className="rc-h2">
                <span>4</span>경로마다 다르다 — 무엇을 되살리느냐
              </h2>
              <p>재활용이라고 다 같은 결과가 나오지는 않습니다. 원소 단위로 되돌리느냐, 양극재의 결정 구조를 그대로 살리느냐가 에너지와 배출을 가릅니다.</p>
              <ul className="lc-routes">
                {routes.map((r) => (
                  <li key={r.k} className="rc-panel">
                    <p className="t">{r.k}</p>
                    <p className="d">
                      {r.d} <Cite src={r.src} />
                    </p>
                  </li>
                ))}
              </ul>
              <p className="tr-note-line">
                재사용까지 넣으면 계산은 더 복잡해집니다. 재사용과 재활용을 같은 전과정평가로 비교한 최근 연구는 용도 전환과 그 준비 과정을 단계별로 나눠 따졌습니다(02 재사용).{" "}
                <Cite src={[24]} />
              </p>
            </section>

            {/* ── 5 같은 재료, 다른 답 ── */}
            <section id="lc-method" className="rc-sec" aria-labelledby="h-method">
              <h2 id="h-method" className="rc-h2">
                <span>5</span>같은 재료, 다른 답 — 재활용을 누구 장부에 적나
              </h2>
              <p>
                재활용은 한 배터리의 끝이자 다음 배터리의 시작이라, 그 부담과 이득을 어느 쪽에 적을지 정해야 합니다(할당). 배터리 전과정평가 25편을 살펴본 연구에서 19편은 &lsquo;아낀
                만큼 빼기&rsquo;, 6편은 &lsquo;끊어 세기&rsquo;를 썼고, 거의 3분의 1은 둘을 섞었습니다. 17편은 수거 단계를 아예 빼고 계산했습니다. <Cite src={[88]} />
              </p>
              <figure className="rc-panel lc-al-fig" aria-labelledby="lc-al-cap">
                <AllocPicker />
                <figcaption id="lc-al-cap">
                  그림 4. 재활용을 적는 세 가지 방식 — 개념도. 칸은 장부에 적히는 항목이며 크기나 수치를 뜻하지 않습니다. <Cite src={allocSrc} />
                </figcaption>
              </figure>
              <p className="tr-note-line">
                원료 단계에서도 같은 일이 생깁니다. 리튬 · 니켈 · 코발트 · 구리 업계의 전과정평가 지침을 비교한 연구에서는, 한 광석에서 여러 금속이 함께 나올 때 영향을 나누는 방식만 달라도
                코발트 1 kg당 기후영향이 최대 5배까지 벌어졌습니다. 연구진은 배터리용 EU 지침에 맞춰 업계가 방식을 맞춰야 하고, 그 전까지는 방법을 투명하게 밝혀야 한다고 봤습니다.{" "}
                <Cite src={[89]} />
              </p>
            </section>

            {/* ── 6 EU 탄소발자국 ── */}
            <section id="lc-rules" className="rc-sec" aria-labelledby="h-rules">
              <h2 id="h-rules" className="rc-h2">
                <span>6</span>EU 탄소발자국 — 계산법을 기다리는 중
              </h2>
              <p>
                EU 배터리 규정은 전기차 배터리부터 전과정 탄소발자국을 신고하게 했습니다. 기준 단위는 배터리가 일생 동안 내놓는 전기 1 kWh이고, 사용 단계는 빼고 셉니다. 신고는 집행위원회가
                계산 · 검증법을 위임 법령으로 정해 시행한 뒤 12개월이 지나야 시작됩니다. <Cite src={["P7"]} />
              </p>
              <ol className="rc-panel tr-time lc-time">
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
                한국 배터리를 EU에 팔려면 이 계산을 공장별 실제 자료로 해야 합니다. 규정은 양극 · 음극 · 전해액 · 분리막 · 셀 케이스의 활동 자료를 특정 공장의 특정 모델 기준으로 쓰게 했고,
                재료 구성이나 전력 구성이 바뀌면 다시 계산하게 했습니다. <Cite src={["P7"]} /> 제도는 위임 법령에서 세부가 정해지고 바뀔 수 있으니 인용할 때 최신 내용을 다시 확인해야 합니다.
              </p>
            </section>

            {/* ── 7 남은 과제 ── */}
            <section id="lc-next" className="rc-sec" aria-labelledby="h-next">
              <h2 id="h-next" className="rc-h2">
                <span>7</span>남은 과제
              </h2>
              <div className="sf-cards">
                <aside className="rc-note" aria-label="국내 자료">
                  <h3>국내 공정의 목록 자료</h3>
                  <p>
                    국내 리뷰들은 국내 재활용 공정의 전과정평가 연구가 적고, 계산에 넣을 국내 목록(LCI) 자료와 시나리오를 만드는 일이 과제라고 짚었습니다. 해외 공장 숫자를 그대로 가져오면 전력
                    구성 · 운송 거리가 달라 맞지 않습니다. <Cite src={[90, 91, 86]} />
                  </p>
                </aside>
                <aside className="rc-note" aria-label="숫자를 읽는 법">
                  <h3>숫자를 읽을 때 물어볼 것</h3>
                  <p>
                    무엇 1단위 기준인가(양극재 1 kg인가, 배터리 1 kWh인가). 어디까지 셌나(공장 안인가, 광산부터인가). 어떤 전기를 썼나. 재활용을 누구 장부에 적었나. 이 네 가지가 다르면 두 숫자는
                    비교할 수 없습니다. <Cite src={[86, 88, "P11"]} />
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
                <Link href="/topics/reuse" className="sf-link">
                  <b>02</b>
                  <span>
                    <strong>재사용</strong>환경 이득의 문턱
                  </span>
                </Link>
                <Link href="/topics/techno-economic" className="sf-link">
                  <b>12</b>
                  <span>
                    <strong>경제성 평가</strong>환경과 비용을 함께
                  </span>
                </Link>
              </div>
            </section>

            <RefsSection papers={papers} other={other} note={<>보강 — 86~91번 문헌은 2026년 11월 이 페이지를 개편하며 추가했습니다. 90 · 91번은 국내 연구입니다.</>} />
            <NextNav slug="lca" />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
