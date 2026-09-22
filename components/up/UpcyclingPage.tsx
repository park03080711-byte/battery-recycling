import Link from "next/link";
import Footer from "@/components/Footer";
import { Cite } from "../rc/Cite";
import { RcToc } from "../rc/Interactive";
import { SystemMap } from "../rc/SystemMap";
import { NextNav, RefsSection, TopicHead, type Kpi } from "../rc/kit";
import { collectCited } from "../rc/sources";
import { facts, korea, stepSrc, steps, toc } from "./data";
import { IconCycles, IconMOF, IconValue, PathDevice, PathElements, PathMaterial, PathNewCell, PathPack } from "./Icons";
import { ReadyStair, ValueBars } from "./Parts";
import lab from "./lab.json";

const icons = [<IconMOF key="a" />, <IconCycles key="b" />, <IconValue key="c" />];
const kpis: Kpi[] = facts.map((f, i) => ({ ...f, icon: icons[i] }));

const { papers, other } = collectCited(facts.flatMap((f) => f.src), stepSrc, ["R", 20, 34, 45, 46, 47, 48, 49]);

const paths = [
  {
    key: "rc",
    name: "재활용",
    no: "03",
    href: "/topics/recycling",
    items: [
      { ico: <PathPack key="a" />, t: "폐배터리" },
      { ico: <PathElements key="b" />, t: "원소 (니켈 · 코발트 · 망간 · 리튬)" },
      { ico: <PathNewCell key="c" />, t: "다시 배터리 원료" },
    ],
    sum: "고리 — 원소로 녹였다가 배터리로 돌아옵니다.",
  },
  {
    key: "up",
    name: "업사이클링",
    no: "04",
    href: null,
    items: [
      { ico: <PathPack key="a" />, t: "폐배터리 (+ 폐PET · 철 케이스)" },
      { ico: <PathMaterial key="b" />, t: "새 소재 (촉매 · 전극)" },
      { ico: <PathDevice key="c" />, t: "다른 장치 (흐름전지 · 아연-공기 전지 등)" },
    ],
    sum: "갈래 — 원소로 녹이지 않고 곧바로 다른 쓰임으로 갑니다.",
  },
];

export default function UpcyclingPage() {
  return (
    <div className="rc">
      <main id="main">
        <TopicHead
          slug="upcycling"
          sub="처리 경로의 네 번째 갈래"
          papers={papers.length}
          kpis={kpis}
          lead="재제조 · 재사용 · 재활용은 모두 결국 배터리로 돌아오는 순환을 전제합니다. 업사이클링은 그 고리를 끊고, 폐배터리의 재료를 원소로 녹이지 않은 채 촉매나 전극 같은 다른 기능성 소재로 바꿉니다. 반응은 이미 작동하지만, 만든 소재를 쓸 시장이 있느냐가 관건입니다."
        />

        <div className="rc-wrap rc-body">
          <RcToc items={toc} />

          <div className="rc-main">
            {/* ── 1 고리를 끊는 경로 ── */}
            <section id="up-branch" className="rc-sec" aria-labelledby="h-branch">
              <h2 id="h-branch" className="rc-h2">
                <span>1</span>고리를 끊는 경로
              </h2>
              <p>
                재활용은 폐배터리를 개별 원소나 재생 활물질로 되돌려 다시 배터리 원료로 씁니다. 업사이클링은 금속을 회수하지 않고, 나눈 재료를 곧바로 다른 기능성 소재로
                다시 짓습니다. 그래서 재활용과 효율을 직접 비교하기보다 목표가 다른 경로로 보는 편이 정확합니다. <Cite src={["R"]} />
              </p>
              <figure className="rc-panel up-paths">
                {paths.map((p) => (
                  <div key={p.key} className={`up-path${p.key === "up" ? " cur" : ""}`}>
                    <p className="up-path-h">
                      <b>{p.no}</b> {p.name}
                      {p.key === "up" ? <span className="up-here">이 페이지</span> : null}
                    </p>
                    <ol>
                      {p.items.map((it) => (
                        <li key={it.t}>
                          {it.ico}
                          <span>{it.t}</span>
                        </li>
                      ))}
                    </ol>
                    <p className="up-path-sum">
                      {p.sum}
                      {p.href ? (
                        <>
                          {" "}
                          <Link href={p.href}>03 재활용 보기 →</Link>
                        </>
                      ) : null}
                    </p>
                  </div>
                ))}
                <figcaption>
                  그림 1. 같은 폐배터리에서 출발해 고리로 돌아오는 경로와 옆으로 갈라지는 경로. <Cite src={["R"]} />
                </figcaption>
              </figure>
            </section>

            {/* ── 2 업사이클링 지도 ── */}
            <section id="up-map" className="rc-sec" aria-labelledby="h-map">
              <h2 id="h-map" className="rc-h2">
                <span>2</span>무엇이 무엇으로 바뀌나
              </h2>
              <p>
                해체해 나눈 양극 분말 · 흑연 · 철 케이스가 다섯 갈래로 흩어집니다. 폐PET처럼 다른 폐기물과 짝을 이루는 경우도 있고, 거꾸로 배터리 재료가 플라스틱 재활용을
                돕는 경우도 있습니다. <Cite src={stepSrc} />
              </p>
              <SystemMap
                steps={steps}
                groups={[
                  { label: "준비", tag: "해체 · 선별" },
                  { label: "전환", tag: "다섯 갈래 전환" },
                ]}
                mid="재료별로"
                overlays={[{ at: "cin", kind: "flow", text: "입고 — 폐배터리 · 폐PET · 철 캔" }]}
                plant={lab}
                img="/up/lab"
                mask="/up/mask_"
                title="업사이클링 지도"
                sub="해체 · 선별 · 다섯 갈래 전환"
                keys={[
                  { k: "g0", label: "준비" },
                  { k: "g1", label: "전환" },
                  { k: "flow", label: "재료의 이동" },
                ]}
                capId="lab-cap"
                caption={
                  <>
                    그림 2. 번호를 누르면 그 전환만 밝아지고, 아래에 무엇이 들어가 무엇이 나오는지가 뜹니다. 장면은 이 사이트가 Blender로 직접 모델링 · 렌더한 설명용 도식이며, 각
                    설비는 논문 속 실험 장치를 단순화한 것입니다. <Cite src={stepSrc} />
                  </>
                }
              />
            </section>

            {/* ── 3 국내 연구 ── */}
            <section id="up-kr" className="rc-sec" aria-labelledby="h-kr">
              <h2 id="h-kr" className="rc-h2">
                <span>3</span>국내 연구 세 갈래
              </h2>
              <p>
                국내 연구진도 폐배터리 재료를 다른 에너지 장치로 곧바로 옮기는 연구를 내고 있습니다. 두 건은 흐름전지 쪽, 한 건은 음극 쪽입니다.
              </p>
              <figure className="rc-panel up-kr">
                <ul className="up-kr-list">
                  {korea.map((r) => (
                    <li key={r.id}>
                      <span className="up-kr-tag">{r.tag}</span>
                      <p className="up-kr-who">{r.who}</p>
                      <p className="up-kr-what">{r.what}</p>
                      <p className="up-kr-res">{r.result}</p>
                      <Cite src={[r.id]} />
                    </li>
                  ))}
                </ul>
                <figcaption>그림 3. 수치는 각 논문의 실험 조건에서 얻은 값이며, 서로 다른 장치라 직접 비교할 수 없습니다.</figcaption>
              </figure>
            </section>

            {/* ── 4 누가 값을 더 쳐주나 ── */}
            <section id="up-value" className="rc-sec" aria-labelledby="h-value">
              <h2 id="h-value" className="rc-h2">
                <span>4</span>누가 값을 더 쳐주나
              </h2>
              <p>
                업사이클링이 주목받는 이유는 가치입니다. 폐 LiCoO₂를 금속으로 녹여 파는 대신 촉매로 쓰면 얼마를 얻는지, 한 연구가 전과정평가로 추정했습니다. <Cite src={[47]} />
              </p>
              <ValueBars />
              <aside className="rc-note" aria-label="LFP에서 특히 의미가 있다">
                <h3>회수할 금속이 싼 배터리일수록</h3>
                <p>
                  LFP처럼 회수 금속의 가치가 낮아 습식제련이 적자를 보는 영역에서는 &lsquo;싸게 회수하기&rsquo;보다 &lsquo;다른 가치로 전환하기&rsquo;가 경제적 해법이 될 수
                  있습니다. 국내 연구에는 폐 LiFePO₄를 흐름전지 촉매로 쓴 사례도 있습니다. <Cite src={["R", 45]} />
                </p>
              </aside>
            </section>

            {/* ── 5 병목은 시장 ── */}
            <section id="up-gap" className="rc-sec" aria-labelledby="h-gap">
              <h2 id="h-gap" className="rc-h2">
                <span>5</span>병목은 기술이 아니라 시장
              </h2>
              <p>
                반응은 이미 작동하고 성능도 나옵니다. 부족한 것은 그 소재를 쓸 시장입니다. 그래서 업사이클링은 &lsquo;기술적으로 미해결&rsquo;이 아니라 &lsquo;기술적으로는
                작동하나 생태계가 없음&rsquo;으로 구분하는 편이 정확합니다. <Cite src={["R"]} />
              </p>
              <ReadyStair />
              <aside className="rc-note" aria-label="폐기물 둘을 섞는 어려움">
                <h3>폐기물 둘이면 변수도 둘</h3>
                <p>
                  지금까지의 선례는 대부분 &lsquo;폐기물 하나 + 순수 시약&rsquo;이었습니다. 폐배터리와 폐PET처럼 폐기물 둘을 서로의 시약으로 쓰면 조성의 들쭉날쭉함이 겹쳐,
                  변수를 통제하기가 배로 어려워집니다. <Cite src={["R"]} />
                </p>
              </aside>
            </section>

            <RefsSection papers={papers} other={other} note={<>보강 — 45~49번 문헌은 2026년 9월 이 페이지를 개편하며 추가했습니다. 45 · 46번은 국내 연구입니다.</>} />
            <NextNav slug="upcycling" />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
