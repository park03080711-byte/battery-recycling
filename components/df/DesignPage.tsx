import Link from "next/link";
import Footer from "@/components/Footer";
import { Cite } from "../rc/Cite";
import { RcToc } from "../rc/Interactive";
import { SystemMap } from "../rc/SystemMap";
import { NextNav, RefsSection, TopicHead, type Kpi } from "../rc/kit";
import { collectCited } from "../rc/sources";
import { facts, joins, rules, stepSrc, steps, toc } from "./data";
import { IconAuto, IconCost, IconScrews } from "./Icons";
import { AutoFig, JoinPicker, PackFig } from "./Parts";
import plant from "./map.json";
import motion from "./motion.json";

const icons = [<IconScrews key="a" />, <IconCost key="b" />, <IconAuto key="c" />];
const kpis: Kpi[] = facts.map((f, i) => ({ ...f, icon: icons[i] }));

const { papers, other } = collectCited(
  facts.flatMap((f) => f.src),
  joins.flatMap((j) => j.src),
  stepSrc,
  rules.flatMap((r) => r.src),
  [104, 105, 26, 64, 77, 78, 19, 35, 98, "P7"]
);

export default function DesignPage() {
  return (
    <div className="rc">
      <main id="main">
        <TopicHead
          slug="design-for-disassembly"
          sub="체결 방식 · 팩 구조 · 해체 정보"
          papers={papers.length}
          kpis={kpis}
          asOf="2026년 11월"
          lead="앞의 열세 주제는 이미 만들어진 배터리를 어떻게 처리할지 다룹니다. 이 주제는 순서를 뒤집습니다. 나사 · 접착제 · 용접처럼 배터리를 만들 때 고른 방식이 다 쓴 뒤 몇 분 만에 뜯기느냐, 통째로 파쇄되느냐를 이미 정해 두기 때문입니다."
        />

        <div className="rc-wrap rc-body">
          <RcToc items={toc} />

          <div className="rc-main">
            {/* ── 1 왜 설계인가 ── */}
            <section id="df-why" className="rc-sec" aria-labelledby="h-why">
              <h2 id="h-why" className="rc-h2">
                <span>1</span>왜 설계인가 — 뜯는 시간은 만들 때 정해진다
              </h2>
              <p>
                팩을 셀까지 뜯는 과정에서 가장 오래 걸리는 일은 클립 · 나사 · 용접 · 접착제 같은 체결을 푸는 것입니다. <Cite src={[103]} /> 재활용은 흔히 맨 끝의 일로 여겨지지만, 연구자들은
                배터리를 설계할 때부터 재활용을 생각해야 한다고 봅니다. <Cite src={[101]} /> 국내 연구도 설계로 정해진 구조와 특성이 재제조가 얼마나 쉽고, 돈이 되고, 환경에 이로운지를 가르는
                핵심 요인이라고 짚었습니다. <Cite src={[104]} /> 체결 방식을 눌러 보세요.
              </p>
              <figure className="rc-panel sc-chain-fig" aria-labelledby="df-join-cap">
                <JoinPicker />
                <figcaption id="df-join-cap">
                  그림 1. 작업 시간은 사람이 손으로 뜯을 때를 가정한 연구의 값이고, 접착된 셀을 떼는 시간은 다른 연구의 추정입니다. 실제 시간은 팩과 도구에 따라 다릅니다.{" "}
                  <Cite src={[102, 103, 101]} />
                </figcaption>
              </figure>
            </section>

            {/* ── 2 두 팩 나란히 뜯기 ── */}
            <section id="df-map" className="rc-sec" aria-labelledby="h-map">
              <h2 id="h-map" className="rc-h2">
                <span>2</span>두 팩 나란히 뜯기 — 같은 크기, 다른 설계
              </h2>
              <p>
                크기가 같은 두 팩을 나란히 놓고 뜯었습니다. 왼쪽은 볼트 · 나사 · 배선 · 접착제 · 용접이 많은 팩, 오른쪽은 클립 · 띠 · 버스바 묶음 하나로 고정하고 큰 셀을 바로 담은 팩입니다. 두 팩
                모두 설명을 위한 개념 도식이며, 단계마다의 숫자는 아래 연구가 실제 팩을 따져 계산한 값입니다. <Cite src={stepSrc} />
              </p>
              <SystemMap
                steps={steps}
                groups={[
                  { label: "뜯기 어려운 팩", tag: "개념" },
                  { label: "뜯기 쉬운 팩", tag: "개념" },
                ]}
                mid="같은 크기의 팩을"
                overlays={[
                  { at: "zh", text: "볼트 · 나사 · 접착제 · 용접", kind: "zone", badge: "파쇄" },
                  { at: "ze", text: "클립 · 띠 · 버스바 한 묶음", kind: "zone", badge: "셀 그대로" },
                ]}
                plant={plant}
                motion={motion}
                motionSrc="/df/map"
                img="/df/map"
                mask="/df/mask_"
                title="두 팩 나란히 뜯기"
                sub="뚜껑 · 모듈 · 셀 — 뜯기 어려운 팩과 쉬운 팩"
                keys={[
                  { k: "g0", label: "뜯기 어려운 팩" },
                  { k: "g1", label: "뜯기 쉬운 팩" },
                  { k: "flow", label: "뜯는 순서" },
                ]}
                capId="map-cap"
                caption={
                  <>
                    그림 2. 번호를 누르면 그 단계만 밝아지고 아래에 그 단계의 숫자가 뜹니다. &lsquo;공정 재생&rsquo;을 누르면 왼쪽 팩의 볼트와 나사가 하나씩 풀리고 셀이 파쇄기로 들어간 뒤,
                    오른쪽 팩이 클립 · 걸쇠 몇 개만 풀고 셀을 그대로 선반에 내놓습니다. 팩 옆의 막대는 단계마다 걸린 시간을 쌓은 것으로, 높이는 실제 팩 연구의 셀까지 뜯는 비용 차이(약 4배)를
                    본뜬 개념입니다. 장면과 움직임은 이 사이트가 Blender로 직접 만든 설명용 도식입니다. <Cite src={stepSrc} />
                  </>
                }
              />
            </section>

            {/* ── 3 실제 팩 여섯 ── */}
            <section id="df-real" className="rc-sec" aria-labelledby="h-real">
              <h2 id="h-real" className="rc-h2">
                <span>3</span>실제 팩 여섯을 뜯어 보니
              </h2>
              <p>
                영국 연구진은 실제 전기차 팩 여섯의 구조를 따져, 사람이 손으로 뜯을 때의 시간과 비용을 영국 인건비(시간당 24.88달러)로 계산했습니다. 모듈까지 뜯는 비용은 15~32달러로 비슷하지만,
                셀까지 가면 47달러에서 194달러로 크게 갈립니다. <Cite src={[102]} />
              </p>
              <figure className="rc-panel df-pack-fig" aria-labelledby="df-pack-cap">
                <p className="rc-fig-h">팩 하나를 사람이 뜯는 비용 (달러)</p>
                <PackFig />
                <figcaption id="df-pack-cap">
                  그림 3. Lander 외(2023)의 계산. 조에 · 모델 3는 셀이 용접되거나 구조용 접착제로 굳어 있어 셀까지의 비용을 계산하지 않았습니다. 셀까지 뜯는 비용이 낮은 두 팩은 모듈이 적거나(BAIC
                  5개) 없습니다(BYD 한). <Cite src={[102]} />
                </figcaption>
              </figure>
              <p className="tr-note-line">
                모델 3 팩은 전기 연결을 팩 한쪽 끝의 버스바 묶음에 모아 두었지만, 셀을 구조용 접착제로 굳혀 셀까지 뜯는 비용은 계산되지 않았습니다. 접착된 셀은 떼는 데 최대 2시간과 용제가 들 수
                있어 대개 파쇄됩니다. <Cite src={[102, 103]} />
              </p>
            </section>

            {/* ── 4 로봇이 뜯으려면 ── */}
            <section id="df-auto" className="rc-sec" aria-labelledby="h-auto">
              <h2 id="h-auto" className="rc-h2">
                <span>4</span>로봇이 뜯으려면 — 자동화도 설계를 탄다
              </h2>
              <p>
                같은 연구는 사람 대신 로봇이 함께 뜯으면 분해 시간을 최대 78%, 완전히 자동화하면 10%를 더 줄여 인건비를 반자동에서 76~87%, 완전 자동에서 97% 줄일 수 있다고 계산했습니다. 영국에서 2040년
                한 해 최대 1억 9천만 달러를 아낄 수 있다는 추정입니다. <Cite src={[102]} />
              </p>
              <figure className="rc-panel df-auto-fig" aria-labelledby="df-auto-cap">
                <p className="rc-fig-h">같은 조건에서 한 해에 뜯을 수 있는 팩 (개)</p>
                <AutoFig />
                <figcaption id="df-auto-cap">
                  그림 4. Lander 외(2023)의 계산. 자동화의 이득은 팩 설계가 단순하고 해체 순서가 알려져 있을 때 커집니다. <Cite src={[102]} />
                </figcaption>
              </figure>
              <div className="sf-cards">
                <aside className="rc-note" aria-label="로봇 해체">
                  <h3>로봇이 잘하는 일, 사람이 잘하는 일</h3>
                  <p>
                    팩 하나의 해체 순서를 46단계로 나눠 본 연구는 나사 풀기는 대부분 자동화할 만하지만 들어 올리기는 사람이 맡는 편이 낫다고 봤습니다. 모듈을 셀로 나누는 로봇 셀 시제품도 연구되고
                    있습니다(07 자동화 해체). <Cite src={[64, 26]} />
                  </p>
                </aside>
                <aside className="rc-note" aria-label="파쇄냐 분리냐">
                  <h3>뜯지 못하면 파쇄로 간다</h3>
                  <p>
                    셀을 온전히 꺼내지 못하면 팩은 파쇄돼 여러 소재가 섞인 블랙매스가 됩니다. 소재를 깨끗이 나눌수록 되찾은 원료의 값이 커지고, 활물질을 그대로 되살리는 직접재생(03 재활용)의 길도
                    열립니다. <Cite src={[101, 19]} />
                  </p>
                </aside>
              </div>
            </section>

            {/* ── 5 설계 지침과 정보 ── */}
            <section id="df-rule" className="rc-sec" aria-labelledby="h-rule">
              <h2 id="h-rule" className="rc-h2">
                <span>5</span>설계 지침과 해체 정보
              </h2>
              <p>연구들이 내놓은 지침을 팩 · 셀 · 소재로 나눠 정리했습니다. <Cite src={[103, 101]} /></p>
              <ul className="df-rules" aria-label="분해를 고려한 설계 지침">
                {rules.map((r) => (
                  <li key={r.id} className={`r-${r.id}`}>
                    <h3>{r.t}</h3>
                    <ul>
                      {r.items.map((it) => (
                        <li key={it}>{it}</li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ul>
              <div className="sf-cards">
                <aside className="rc-note" aria-label="해체 정보">
                  <h3>EU는 해체 정보를 여권에 담게 했다</h3>
                  <p>
                    EU 배터리 규정 부속서 XIII은 배터리 여권에 분해도, 해체 순서, 체결 방식의 종류와 수, 필요한 도구, 주의 사항, 셀의 수와 배치 같은 해체 정보를 담게 했습니다. 이 정보는 정당한
                    이해관계가 있는 사람과 집행위원회만 볼 수 있습니다(09 이력관리). <Cite src={["P7"]} />
                  </p>
                </aside>
                <aside className="rc-note" aria-label="화학 표시">
                  <h3>무엇이 들었는지 몰라 분석부터</h3>
                  <p>
                    지금 대부분의 팩에는 셀의 화학을 알려 주는 표시가 없습니다. <Cite src={[101]} /> 그래서 재활용 현장에서는 셀의 화학을 따로 분석해 가려내는 방법이 연구되고 있습니다.{" "}
                    <Cite src={[77, 78]} />
                  </p>
                </aside>
              </div>
              <p className="tr-note-line">
                국내에서는 사용후 배터리의 데이터가 쌓여 처음부터 깨끗한 설계로 이어져야 재사용과 재활용이 원활해진다는 연구가 나왔습니다. <Cite src={[105]} />
              </p>
            </section>

            {/* ── 6 남은 과제 ── */}
            <section id="df-next" className="rc-sec" aria-labelledby="h-next">
              <h2 id="h-next" className="rc-h2">
                <span>6</span>남은 과제
              </h2>
              <div className="sf-cards">
                <aside className="rc-note" aria-label="맞바꿈">
                  <h3>뜯기 쉬움과 맞바꾸는 것</h3>
                  <p>
                    접착제와 용접에도 저마다 쓰는 이유가 있어 한꺼번에 뺄 수는 없습니다. 연구들이 &lsquo;없애라&rsquo;가 아니라 &lsquo;되도록 덜 쓰라&rsquo;, &lsquo;종류를 줄이라&rsquo;고 권하는
                    까닭입니다. 뜯기 쉬운 설계가 성능 · 안전 · 값과 어떻게 맞설지는 팩마다 따로 따져야 합니다. <Cite src={[103]} />
                  </p>
                </aside>
                <aside className="rc-note" aria-label="시간">
                  <h3>지금 만든 배터리는 십여 년 뒤에 돌아온다</h3>
                  <p>
                    전기차 배터리를 평균 10년쯤 쓴다고 보면(13 공급망), 오늘 바꾼 설계의 효과는 그만큼 뒤에 나타나므로 일찍 시작할수록 좋습니다. 트릴레마 논문도 새 공정보다 분해를 고려한 설계와 제품 여권을 해법으로
                    들었습니다. <Cite src={[98, 35]} />
                  </p>
                </aside>
              </div>
              <div className="sf-links">
                <Link href="/topics/automated-disassembly" className="sf-link">
                  <b>07</b>
                  <span>
                    <strong>자동화 해체</strong>로봇이 팩을 뜯는다
                  </span>
                </Link>
                <Link href="/topics/traceability" className="sf-link">
                  <b>09</b>
                  <span>
                    <strong>이력관리</strong>배터리 여권 · 화학 식별
                  </span>
                </Link>
                <Link href="/topics/recycling" className="sf-link">
                  <b>03</b>
                  <span>
                    <strong>재활용</strong>파쇄 · 직접재생
                  </span>
                </Link>
              </div>
            </section>

            <RefsSection
              papers={papers}
              other={other}
              note={<>보강 — 101~105번 문헌은 2026년 11월 이 페이지를 개편하며 추가했습니다. 104~105번은 국내 연구입니다.</>}
            />
            <NextNav slug="design-for-disassembly" />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
