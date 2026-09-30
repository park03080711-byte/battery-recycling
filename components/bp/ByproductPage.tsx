import Link from "next/link";
import Footer from "@/components/Footer";
import { Cite } from "../rc/Cite";
import { RcToc } from "../rc/Interactive";
import { SystemMap } from "../rc/SystemMap";
import { NextNav, RefsSection, TopicHead, type Kpi } from "../rc/kit";
import { collectCited } from "../rc/sources";
import { facts, lost, stepSrc, steps, toc, uses } from "./data";
import { IconDrum, IconLayers, IconPile } from "./Icons";
import { PhaseFig } from "./Parts";
import line from "./line.json";
import motion from "./motion.json";

const icons = [<IconDrum key="a" />, <IconPile key="b" />, <IconLayers key="c" />];
const kpis: Kpi[] = facts.map((f, i) => ({ ...f, icon: icons[i] }));

const { papers, other } = collectCited(
  facts.flatMap((f) => f.src),
  stepSrc,
  lost.flatMap((l) => l.src),
  uses.flatMap((u) => u.src),
  [17, 30, 31, 69, 71, 72]
);

export default function ByproductPage() {
  return (
    <div className="rc">
      <main id="main">
        <TopicHead
          slug="byproduct-recovery"
          sub="버려지던 전해액과 흑연"
          papers={papers.length}
          kpis={kpis}
          lead="지금의 재활용은 리튬 · 니켈 · 코발트 같은 금속에 집중합니다. 전해액은 안전을 위해 날려 버리고, 흑연과 바인더도 대부분 태우거나 남깁니다. 이 페이지는 그 부산물을 공정 순서대로 하나씩 건지는 방법 — 특히 CO₂를 쓰는 방법과 흑연을 되살리는 방법을 다룹니다."
        />

        <div className="rc-wrap rc-body">
          <RcToc items={toc} />

          <div className="rc-main">
            {/* ── 1 무엇이 버려지나 ── */}
            <section id="bp-lost" className="rc-sec" aria-labelledby="h-lost">
              <h2 id="h-lost" className="rc-h2">
                <span>1</span>지금 무엇이 버려지는가
              </h2>
              <p>금속이 아닌 재료들의 지금 처지입니다. 포일은 비교적 잘 모이지만, 나머지 셋은 지금 공정에서 대부분 회수되지 않습니다.</p>
              <ul className="bp-lost">
                {lost.map((l) => (
                  <li key={l.what} className={`rc-panel ${l.tone}`}>
                    <span className="bp-tag">{l.tone === "ok" ? "회수" : "버려짐"}</span>
                    <p className="t">{l.what}</p>
                    <p className="now">{l.now}</p>
                    <p className="d">
                      {l.why} <Cite src={l.src} />
                    </p>
                  </li>
                ))}
              </ul>
            </section>

            {/* ── 2 부산물 회수 라인 ── */}
            <section id="bp-map" className="rc-sec" aria-labelledby="h-map">
              <h2 id="h-map" className="rc-h2">
                <span>2</span>부산물 회수 라인 — 공정 순서대로 건지기
              </h2>
              <p>
                전해액은 셀을 부수기 전에, 포일은 부순 직후에, 리튬 · 금속 · 흑연은 블랙파우더에서 차례로 건집니다. 연구에 나온 방법들을 한 줄로 이어 본 도식입니다. <Cite src={stepSrc} />
              </p>
              <SystemMap
                steps={steps}
                groups={[
                  { label: "전처리에서 건지기", tag: "전해액 · 포일" },
                  { label: "블랙파우더에서 차례로", tag: "리튬 · 금속 · 흑연" },
                ]}
                mid="블랙파우더가 된 뒤"
                plant={line}
                motion={motion}
                motionSrc="/bp/line"
                img="/bp/line"
                mask="/bp/mask_"
                title="부산물 회수 라인 지도"
                sub="전해액 · 파쇄 선별 · 리튬 먼저 · 금속 침출 · 흑연 재생"
                keys={[
                  { k: "g0", label: "전처리" },
                  { k: "g1", label: "블랙파우더" },
                  { k: "flow", label: "재료의 이동" },
                ]}
                capId="line-cap"
                caption={
                  <>
                    그림 1. 번호를 누르면 그 단계만 밝아지고 아래에 무엇이 들어가 무엇이 나오는지가 뜹니다. &lsquo;공정 재생&rsquo;을 누르면 CO₂(파랑)가 전해액을 뽑아 호박색 통에 모으고,
                    포일 조각과 검은 가루가 갈라지며, 흰 탄산리튬 · 금속 용액 · 재생 흑연이 차례로 나옵니다. 장면과 움직임은 이 사이트가 Blender로 직접 만든 설명용 도식이며 실제 설비
                    배치와 다릅니다. <Cite src={stepSrc} />
                  </>
                }
              />
            </section>

            {/* ── 3 초임계 CO₂ ── */}
            <section id="bp-co2" className="rc-sec" aria-labelledby="h-co2">
              <h2 id="h-co2" className="rc-h2">
                <span>3</span>초임계 CO₂ — 디카페인 커피의 원리를 배터리에
              </h2>
              <p>
                CO₂는 31 ℃ · 7.4 MPa를 넘으면 액체처럼 물질을 녹이면서 기체처럼 퍼지는 초임계 유체가 됩니다. 압력만 낮추면 기체로 날아가 뽑아낸 물질에 남지 않습니다. 커피에서
                카페인을 빼는 데 오래 써 온 기술입니다. <Cite src={[30]} />
              </p>
              <figure className="rc-panel bp-phase-fig" aria-labelledby="bp-phase-cap">
                <PhaseFig />
                <figcaption id="bp-phase-cap">그림 2. CO₂ 상평형 개념도. 임계점(31 ℃ · 7.4 MPa)만 실제 값이고, 축과 곡선 모양은 개념입니다.</figcaption>
              </figure>
              <p className="bp-lead2">같은 CO₂라도 무엇을 뽑느냐에 따라 조건과 성숙도가 크게 다릅니다.</p>
              <ul className="bp-uses">
                {uses.map((u) => (
                  <li key={u.k} className="rc-panel">
                    <span className="bp-stage">{u.stage}</span>
                    <p className="k">{u.k}</p>
                    <p className="t">{u.t}</p>
                    <p className="d">
                      {u.d} <Cite src={u.src} />
                    </p>
                  </li>
                ))}
              </ul>
            </section>

            {/* ── 4 흑연 되살리기 ── */}
            <section id="bp-gr" className="rc-sec" aria-labelledby="h-gr">
              <h2 id="h-gr" className="rc-h2">
                <span>4</span>흑연 되살리기
              </h2>
              <p>
                흑연은 높은 온도로 구워 만드는 재료라 새로 만드는 데 에너지와 비용이 많이 듭니다. 폐배터리 흑연을 바로 다시 쓰지 못하는 이유는 남은 금속과 유기물 때문입니다.
                <Cite src={[71]} />
              </p>
              <ol className="rc-panel bp-grsteps">
                <li>
                  <b>1</b>
                  <div>
                    <p className="t">금속 먼저</p>
                    <p className="d">리튬 · 니켈 · 코발트를 먼저 뽑습니다. 기존 금속 재활용 공정에 이어 붙일 수 있다는 뜻입니다.</p>
                  </div>
                </li>
                <li>
                  <b>2</b>
                  <div>
                    <p className="t">산으로 씻기</p>
                    <p className="d">남은 알루미늄 · 구리 같은 금속을 산으로 녹여 없앱니다.</p>
                  </div>
                </li>
                <li>
                  <b>3</b>
                  <div>
                    <p className="t">낮은 온도 열분해</p>
                    <p className="d">바인더(PVDF)를 분해해 없앱니다. 이때 나오는 불소 가스는 배기 처리해야 합니다.</p>
                  </div>
                </li>
              </ol>
              <p className="bp-note-line">
                이렇게 되살린 흑연의 첫 충전 용량은 387 mAh/g로 상용 배터리급 흑연과 비슷했습니다. <Cite src={[71]} /> 흑연을 음극 재료로 한 번 더 바꿔 쓰는 방법은{" "}
                <Link href="/topics/upcycling">04 업사이클링</Link>에, 불소 가스의 위험은 <Link href="/topics/safety">06 안전 관리</Link>에 있습니다. <Cite src={[61]} />
              </p>
            </section>

            {/* ── 5 국내 연구와 과제 ── */}
            <section id="bp-next" className="rc-sec" aria-labelledby="h-next">
              <h2 id="h-next" className="rc-h2">
                <span>5</span>국내 연구와 남은 과제
              </h2>
              <div className="sf-cards">
                <aside className="rc-note" aria-label="국내 연구">
                  <h3>국내 연구</h3>
                  <p>
                    대진대 연구진은 폐 리튬이온전지 전해액 재활용 기술을 분석했습니다. <Cite src={[17]} /> 세종대 연구진은 재활용 전처리를 방전 · 해체 · 분쇄 · 분급 · 분리 · 용해 ·
                    열처리로 나눠 정리한 리뷰를 냈습니다. 부산물이 어느 단계에서 갈리는지 보는 지도가 됩니다. <Cite src={[72]} />
                  </p>
                </aside>
                <aside className="rc-note" aria-label="남은 과제">
                  <h3>규모를 키우는 일</h3>
                  <p>
                    전해액 추출은 아직 실험실 규모라 연구진 스스로 큰 공정에서 다시 검증해야 한다고 했습니다. <Cite src={[69]} /> 리튬을 먼저 뽑는 COOL 공정은 파일럿까지 와서 산업
                    적용을 내다보고 있습니다. <Cite src={[31]} />
                  </p>
                </aside>
              </div>
              <div className="sf-links">
                <Link href="/topics/recycling" className="sf-link">
                  <b>03</b>
                  <span>
                    <strong>재활용</strong>금속을 뽑는 본 공정
                  </span>
                </Link>
                <Link href="/topics/upcycling" className="sf-link">
                  <b>04</b>
                  <span>
                    <strong>업사이클링</strong>흑연을 더 값진 재료로
                  </span>
                </Link>
                <Link href="/topics/safety" className="sf-link">
                  <b>06</b>
                  <span>
                    <strong>안전 관리</strong>전해액 · 불소 가스의 위험
                  </span>
                </Link>
              </div>
            </section>

            <RefsSection papers={papers} other={other} note={<>보강 — 69~72번 문헌은 2026년 9월 이 페이지를 개편하며 추가했습니다. 72번은 국내 연구입니다.</>} />
            <NextNav slug="byproduct-recovery" />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
