import Footer from "@/components/Footer";
import { Cite, LevelTag } from "../rc/Cite";
import { RcToc } from "../rc/Interactive";
import { SystemMap } from "../rc/SystemMap";
import { TierStair } from "../rc/Tiers";
import { NextNav, RefsSection, TopicHead, type Kpi } from "../rc/kit";
import { collectCited } from "../rc/sources";
import { Box, makeIso, ramp } from "../rc/Iso";
import { facts, lives, stepSrc, steps, toc } from "./data";
import { IconCarbon, IconGrid16, IconTierMid, LifeESS, LifeEV, LifeRecycle } from "./Icons";
import { ThresholdGrid } from "./Parts";
import yard from "./yard.json";

const icons = [<IconTierMid key="a" />, <IconGrid16 key="b" />, <IconCarbon key="c" />];
const kpis: Kpi[] = facts.map((f, i) => ({ ...f, icon: icons[i] }));
const lifeIcons = [<LifeEV key="a" />, <LifeESS key="b" />, <LifeRecycle key="c" />];

const { papers, other } = collectCited(facts.flatMap((f) => f.src), stepSrc, ["R", 23, 24, 25, 42, 43, 44]);

/* 차와 ESS — 같은 배터리, 다른 요구 */
function DemandArt({ kind }: { kind: "car" | "ess" }) {
  const iso = makeIso(7, 70, 64);
  return (
    <svg viewBox="0 0 150 100" className="rs-demand-art" aria-hidden="true">
      {kind === "car" ? (
        <>
          <Box iso={iso} x={0} y={0} w={8} d={3.4} h={1.5} fill={ramp.blue} />
          <Box iso={iso} x={1.6} y={0.3} z={1.5} w={4} d={2.8} h={1.2} fill={ramp.navy} />
          {[0, 1, 2].map((i) => (
            <Box key={i} iso={iso} x={-2.6 - i * 1.1} y={1.5} z={0.6} w={0.7} d={0.25} h={0.08} fill={ramp.teal} stroke="none" />
          ))}
        </>
      ) : (
        <>
          <Box iso={iso} x={0} y={0} w={7} d={3.4} h={3.4} fill={ramp.base} />
          <Box iso={iso} x={0} y={0} z={3.4} w={7} d={3.4} h={0.3} fill={ramp.blue} />
          <Box iso={iso} x={-1.8} y={0.8} w={1.1} d={1.8} h={0.2} fill={ramp.ghost} />
        </>
      )}
    </svg>
  );
}

export default function ReusePage() {
  return (
    <div className="rc">
      <main id="main">
        <TopicHead
          slug="reuse"
          sub="세 갈래 처리 경로 중 두 번째"
          papers={papers.length}
          kpis={kpis}
          lead="자동차에 쓰기엔 부족해진 배터리를 에너지저장장치(ESS)처럼 성능 요구가 낮은 곳으로 옮겨 남은 수명을 마저 쓰는 경로입니다. 배터리를 만드는 데 이미 들어간 에너지를 더 오래 쓰는 셈이지만, 환경 이득과 경제성 모두 조건이 맞아야 생깁니다."
        />

        <div className="rc-wrap rc-body">
          <RcToc items={toc} />

          <div className="rc-main">
            {/* ── 1 세 갈래 ── */}
            <section id="rs-branch" className="rc-sec" aria-labelledby="h-branch">
              <h2 id="h-branch" className="rc-h2">
                <span>1</span>세 갈래 중 가운데
              </h2>
              <p>
                잔존용량이 60~80% 남은 배터리가 재사용으로 갑니다. 다시 차에 싣기엔 부족하고, 바로 녹이기엔 아직 쓸 만한 구간입니다. 소관은 환경부이고, 근거 법은 신설
                예정인 친환경산업법입니다. <Cite src={["R"]} />
              </p>
              <TierStair active={1} />
            </section>

            {/* ── 2 왜 가능한가 ── */}
            <section id="rs-why" className="rc-sec" aria-labelledby="h-why">
              <h2 id="h-why" className="rc-h2">
                <span>2</span>성능 요구의 차이가 기회를 만든다
              </h2>
              <p>
                같은 배터리라도 어디에 쓰느냐에 따라 &lsquo;충분하다&rsquo;의 기준이 다릅니다. 자동차는 급가속과 급충전을 견뎌야 하지만, 한곳에 고정된 ESS는 그렇지
                않습니다. 이 차이가 재사용을 가능하게 합니다. <Cite src={["R"]} />
              </p>
              <figure className="rc-panel rs-demand">
                <div className="rs-demand-card">
                  <DemandArt kind="car" />
                  <h3>
                    전기차 <span>첫 번째 삶</span>
                  </h3>
                  <ul>
                    <li>급가속을 견뎌야 함</li>
                    <li>급충전을 견뎌야 함</li>
                    <li>잔존용량이 줄면 차에서 내림</li>
                  </ul>
                </div>
                <p className="rs-demand-vs" aria-hidden="true">
                  같은 배터리
                  <br />
                  <span className="sep"> · </span>
                  다른 기준
                </p>
                <div className="rs-demand-card ess">
                  <DemandArt kind="ess" />
                  <h3>
                    ESS <span>두 번째 삶</span>
                  </h3>
                  <ul>
                    <li>한곳에 고정되어 급가속이 없음</li>
                    <li>급충전을 견딜 필요가 없음</li>
                    <li>부족해진 배터리로도 충분한 경우가 많음</li>
                  </ul>
                </div>
                <figcaption>
                  그림 2. 요구 조건의 차이. <Cite src={["R"]} />
                </figcaption>
              </figure>
            </section>

            {/* ── 3 두 번째 삶 지도 ── */}
            <section id="rs-map" className="rc-sec" aria-labelledby="h-map">
              <h2 id="h-map" className="rc-h2">
                <span>3</span>두 번째 삶은 어디로 가나
              </h2>
              <p>
                떼어 낸 팩은 등급을 판정받고, 새 용도에 맞게 다시 포장된 뒤 여러 곳으로 흩어집니다. 대표적인 활용처는 ESS · UPS · 태양광 가로등 · 골프카 · 전기이륜차 ·
                전동휠체어입니다. <Cite src={["R"]} />
              </p>
              <SystemMap
                steps={steps}
                groups={[
                  { label: "준비", tag: "준비 · 판정" },
                  { label: "활용처", tag: "두 번째 삶 · 활용처" },
                ]}
                mid="용도별로"
                overlays={[
                  { at: "cin", kind: "flow", text: "입고 — 전기차에서 떼어 낸 팩" },
                  { at: "d1b", kind: "flow", text: "충전소 · 가정에도 ESS" },
                ]}
                plant={yard}
                img="/rs/yard"
                mask="/rs/mask_"
                title="두 번째 삶 지도"
                sub="판정 · 재포장 · 네 갈래 활용처"
                keys={[
                  { k: "g0", label: "준비" },
                  { k: "g1", label: "활용처" },
                  { k: "flow", label: "배터리의 이동" },
                ]}
                capId="yard-cap"
                caption={
                  <>
                    그림 3. ESS를 고르면 전력망용(지붕에 태양광을 얹은 컨테이너)과 함께 가정용(벽걸이 배터리) · 충전소용(배터리 캐비닛)도 밝아집니다. 장면은 이 사이트가 Blender로 직접
                    모델링 · 렌더한 설명용 도식이며 실제 배치와 다릅니다. <Cite src={[23, 42, 25, "R"]} />
                  </>
                }
              />
            </section>

            {/* ── 4 환경 이득의 문턱 ── */}
            <section id="rs-lca" className="rc-sec" aria-labelledby="h-lca">
              <h2 id="h-lca" className="rc-h2">
                <span>4</span>환경 이득에는 문턱이 있다
              </h2>
              <p>
                재사용도 공짜는 아닙니다. 판정하고 다시 포장하고 운반하는 데 영향이 생깁니다. 그래서 재사용 배터리가 누군가의 새 배터리 구매를 실제로 대신할 때에만 이득이
                납니다. 노르웨이 연구는 그 문턱을 영향 범주별로 계산했습니다. <Cite src={[42]} />
              </p>
              <ThresholdGrid />
              <p>
                재사용과 재활용을 전과정평가로 직접 비교한 최근 연구는, 기존 연구들이 뭉뚱그려 다루던 용도 전환과 그 준비 과정을 단계별로 나눠 계산했습니다. 문턱을
                정확히 알려면 준비 과정의 영향부터 제대로 재야 한다는 뜻입니다. <Cite src={[24]} />
              </p>
            </section>

            {/* ── 5 시간 순서 ── */}
            <section id="rs-time" className="rc-sec" aria-labelledby="h-time">
              <h2 id="h-time" className="rc-h2">
                <span>5</span>경쟁이 아니라 시간 순서
              </h2>
              <p>
                재사용이 끝나면 결국 재활용으로 갑니다. 두 경로는 하나를 고르는 문제가 아니라 차례의 문제입니다. <Cite src={["R"]} />
              </p>
              <figure className="rc-panel rs-life">
                <ol className="rs-life-list">
                  {lives.map((l, i) => (
                    <li key={l.key} className={i === 1 ? "cur" : undefined}>
                      {lifeIcons[i]}
                      <p className="lf-step">
                        <b>{l.name}</b> {l.where}
                      </p>
                      <p className="lf-soh">잔존용량 {l.soh}</p>
                      <p className="lf-txt">{l.text}</p>
                    </li>
                  ))}
                </ol>
                <figcaption>
                  그림 5. 잔존용량 구간은 일반적 기준입니다. <Cite src={["R"]} />
                </figcaption>
              </figure>
              <div className="rs-life-notes">
                <aside className="rc-note" aria-label="두 번째 삶의 탄소 효과">
                  <h3>한 번 더 쓰면 탄소가 줄어든다</h3>
                  <p>
                    미국의 2020~2050년을 계산한 모델에서, 재활용 전에 두 번째 삶을 거치면 전기차 배터리의 전과정 탄소발자국이 2~17% 줄었습니다. 새 배터리용 원료를 덜 캐기
                    때문입니다. <Cite src={[43]} />
                  </p>
                </aside>
                <aside className="rc-note" aria-label="늦어지는 금속 회수">
                  <h3>대신 금속 회수는 늦어진다</h3>
                  <p>
                    성능이 떨어진 배터리로 같은 전력을 저장하려면 셀이 더 많이 필요하고 효율도 낮습니다. 재사용 기간만큼 금속 회수가 늦어지므로, 원료 공급이 급할 때는 곧바로
                    재활용하는 편이 나을 수 있습니다. <Cite src={["R"]} />
                  </p>
                </aside>
                <aside className="rc-note" aria-label="사용 단계의 전기">
                  <h3>어떤 전기로 채우느냐도 중요하다</h3>
                  <p>
                    중국을 대상으로 두 번째 사용까지 포함해 평가한 연구에서는, 화석연료 비중이 높은 전력 때문에 첫 번째와 두 번째 사용 단계가 환경 영향의 대부분을
                    차지했습니다. 깨끗한 전력의 비중을 늘리는 것이 중요하다는 것이 연구의 결론입니다. <Cite src={[44]} />
                  </p>
                </aside>
              </div>
            </section>

            {/* ── 6 경제성 조건 ── */}
            <section id="rs-econ" className="rc-sec" aria-labelledby="h-econ">
              <h2 id="h-econ" className="rc-h2">
                <span>6</span>경제성은 조건부다
              </h2>
              <p>
                가정용 · 전력망용 · 충전소용 재사용을 종합 검토한 연구의 결론은 &ldquo;조건에 따라 다르다&rdquo;입니다. 재사용은 기술의 문제라기보다 시장 조건의 문제에
                가깝습니다. <Cite src={[25]} />
              </p>
              <figure className="rc-panel rs-cond">
                <ul className="rs-cond-list">
                  <li>
                    <b>전기요금</b>
                    <span>싸게 모아 비싸게 쓰는 차이가 클수록 저장의 값이 커집니다. 요금 구조가 결과를 좌우합니다.</span>
                    <Cite src={[25]} />
                  </li>
                  <li>
                    <b>새 배터리 가격</b>
                    <span>새 배터리가 싸질수록 재사용의 경제적 가치는 줄어듭니다. 보조금 · 인센티브로 메울 수 있다는 분석이 있습니다.</span>
                    <Cite src={[25, 43]} />
                  </li>
                  <li>
                    <b>사용 방식</b>
                    <span>가정용, 전력망용, 충전소용 가운데 어느 쪽이냐에 따라 편익이 달라집니다.</span>
                    <Cite src={[25]} />
                  </li>
                  <li>
                    <b>사는 이유</b>
                    <span>싸서 사는 것이 아니라 필요해서 사야 새 배터리 구매를 실제로 대신하고, 그래야 환경 이득도 생깁니다.</span>
                    <Cite src={[42]} />
                  </li>
                </ul>
                <figcaption>
                  그림 6. <LevelTag level="paper" /> 조건별 방향은 각 문헌의 서술을 옮긴 것이며, 수치로 된 경제성 계산은 이 페이지에서 새로 하지 않았습니다. &lsquo;싸게 모아
                  비싸게 쓴다&rsquo;는 전기요금 조건을 풀어 쓴 이 사이트의 설명입니다.
                </figcaption>
              </figure>
            </section>

            <RefsSection papers={papers} other={other} note={<>보강 — 42~44번 문헌은 2026년 9월 이 페이지를 개편하며 추가했습니다.</>} />
            <NextNav slug="reuse" />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
