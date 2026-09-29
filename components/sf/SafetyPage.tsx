import Link from "next/link";
import Footer from "@/components/Footer";
import { Cite } from "../rc/Cite";
import { RcToc } from "../rc/Interactive";
import { SystemMap } from "../rc/SystemMap";
import { NextNav, RefsSection, TopicHead, type Kpi } from "../rc/kit";
import { collectCited } from "../rc/sources";
import { facts, rules, saltIssues, stepSrc, steps, toc } from "./data";
import { IconGas, IconRebound, IconCheck3 } from "./Icons";
import { LoopFig, ReboundFig, RunawayFig, RunawayLegend } from "./Parts";
import depot from "./depot.json";
import motion from "./motion.json";

const icons = [<IconRebound key="a" />, <IconGas key="b" />, <IconCheck3 key="c" />];
const kpis: Kpi[] = facts.map((f, i) => ({ ...f, icon: icons[i] }));

const { papers, other } = collectCited(facts.flatMap((f) => f.src), stepSrc, ["R", "P3", "P4", "P5", "P6", 14, 26, 55, 56, 57, 58, 59, 60, 61]);

export default function SafetyPage() {
  return (
    <div className="rc">
      <main id="main">
        <TopicHead
          slug="safety"
          sub="모든 공정은 방전에서 시작한다"
          papers={papers.length}
          kpis={kpis}
          lead="폐배터리는 비어 보여도 전기와 불붙는 전해액을 품고 있습니다. 그래서 재제조 · 재사용 · 재활용 어느 길이든 첫 단계는 위험을 없애는 일입니다. 격리하고, 방전하고, 전압이 되살아나지 않는지 확인한 뒤, 번지지 않게 보관하고 규정대로 옮깁니다."
        />

        <div className="rc-wrap rc-body">
          <RcToc items={toc} />

          <div className="rc-main">
            {/* ── 1 왜 위험한가 ── */}
            <section id="sf-why" className="rc-sec" aria-labelledby="h-why">
              <h2 id="h-why" className="rc-h2">
                <span>1</span>왜 위험한가 — 열폭주
              </h2>
              <p>
                셀 하나가 과열되면 안에서 열을 내는 반응이 스스로 빨라지는 열폭주가 일어나고, 열과 가스가 옆 셀로 번집니다. 남은 전기가 있는 채로 해체 · 파쇄하다 단락이 나면
                이 연쇄가 시작될 수 있습니다. <Cite src={["R"]} />
              </p>
              <figure className="rc-panel sf-why" aria-labelledby="sf-why-cap">
                <div className="sf-why-grid">
                  <div>
                    <p className="sf-fig-h">셀에서 셀로</p>
                    <RunawayFig />
                    <RunawayLegend />
                  </div>
                  <div>
                    <p className="sf-fig-h">셀 안에서 스스로 커지는 고리</p>
                    <LoopFig />
                    <p className="sf-fig-note">
                      서울대 · 포항공대 · 삼성SDI 연구진은 흑연 음극에서 나온 에틸렌이 니켈 많은 양극의 산소 방출을 부르고, 그 산소가 다시 에틸렌을 늘리는 고리가 온도를 빠르게
                      끌어올린다고 밝혔습니다. 음극에 알루미나를 입혀 이 고리를 끊었습니다. <Cite src={[60]} />
                    </p>
                  </div>
                </div>
                <figcaption id="sf-why-cap">그림 1. 열폭주 개념도(왼쪽)와 셀 안의 자기 증폭 고리(오른쪽). 수치가 없는 개념 그림입니다.</figcaption>
              </figure>
              <div className="sf-cards">
                <aside className="rc-note" aria-label="독성 가스">
                  <h3>불보다 가스가 더 위험할 수 있다</h3>
                  <p>
                    상용 배터리 7종을 태운 시험에서 불화수소가 공칭 에너지 1 Wh당 20~200 mg 나왔고, 일부에서는 옥시불화인도 15~22 mg/Wh 나왔습니다. <Cite src={[58]} />
                  </p>
                </aside>
                <aside className="rc-note" aria-label="재사용 모듈 시험">
                  <h3>재사용 모듈이 불붙으면</h3>
                  <p>
                    독일 연방재료시험연구원(BAM)이 재사용(두 번째 삶) 모듈(2.65 · 6.85 kWh)로 열폭주를 일으키자 최대 5 m의 불기둥과 30 m 넘게 튄 파편이 관측됐습니다. 연구진은 독성 가스로
                    불화수소와 함께 일산화탄소를 꼭 봐야 한다고 했습니다. ESS로 쓰는 <Link href="/topics/reuse">02 재사용</Link>과 이어지는 이야기입니다. <Cite src={[59]} />
                  </p>
                </aside>
              </div>
            </section>

            {/* ── 2 안전 동선 지도 ── */}
            <section id="sf-map" className="rc-sec" aria-labelledby="h-map">
              <h2 id="h-map" className="rc-h2">
                <span>2</span>안전 동선 — 들어와서 나갈 때까지
              </h2>
              <p>
                손상 팩을 먼저 걸러 내고, 방전하고, 전압이 되살아나지 않는지 확인한 뒤, 번지지 않게 나눠 보관하고 규정대로 포장해 내보냅니다. <Cite src={stepSrc} />
              </p>
              <SystemMap
                steps={steps}
                groups={[
                  { label: "안전화", tag: "격리 · 방전 · 확인" },
                  { label: "보관 · 운송", tag: "나눠 두고 규정대로" },
                ]}
                mid="안전해진 뒤"
                plant={depot}
                motion={motion}
                motionSrc="/sf/site"
                img="/sf/site"
                mask="/sf/mask_"
                title="안전 동선 지도"
                sub="입고 · 격리 · 방전 · 반등 확인 · 보관 · 운송"
                keys={[
                  { k: "g0", label: "안전화" },
                  { k: "g1", label: "보관 · 운송" },
                  { k: "flow", label: "배터리의 이동" },
                ]}
                capId="site-cap"
                caption={
                  <>
                    그림 2. 번호를 누르면 그 단계만 밝아지고 아래에 무엇이 들어가 무엇이 나오는지가 뜹니다. &lsquo;공정 재생&rsquo;을 누르면 손상 팩이 주황 점선을 따라 격리함으로 빠지고,
                    나머지가 방전 · 확인 · 보관 · 포장을 차례로 지납니다. 장면과 움직임은 이 사이트가 Blender로 직접 만든 설명용 도식이며 실제 시설 배치와 다릅니다. <Cite src={stepSrc} />
                  </>
                }
              />
            </section>

            {/* ── 3 방전과 반등 ── */}
            <section id="sf-salt" className="rc-sec" aria-labelledby="h-salt">
              <h2 id="h-salt" className="rc-h2">
                <span>3</span>방전 — 0 V가 끝이 아니다
              </h2>
              <p>
                소금물에 담가 남은 전기를 빼는 방법은 간단하고 싸서 널리 언급되지만, 실제로 얼마나 잘 되는지는 연구마다 따져 보고 있습니다. 쟁점은 셋입니다.
              </p>
              <ul className="rc-panel sf-issues">
                {saltIssues.map((s, i) => (
                  <li key={s.t}>
                    <b>{i + 1}</b>
                    <div>
                      <p className="t">{s.t}</p>
                      <p className="d">
                        {s.d} <Cite src={s.src} />
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
              <figure className="rc-panel sf-reb-fig" aria-labelledby="sf-reb-cap">
                <p className="sf-fig-h">꺼내 두면 전압이 되살아난다</p>
                <ReboundFig />
                <figcaption id="sf-reb-cap">
                  그림 3. 전압 반등 개념도. &lsquo;약 0.6 V&rsquo;와 &lsquo;2.0 V&rsquo;는 알토대 연구의 서술을 옮긴 값이고, 곡선 모양과 나머지 축은 개념입니다. 이 연구에서 2.0 V 근처까지
                  내리는 데 900시간 가까이 걸린 경우도 있었습니다. <Cite src={[57]} />
                </figcaption>
              </figure>
            </section>

            {/* ── 4 운송 · 보관 규칙 ── */}
            <section id="sf-rules" className="rc-sec" aria-labelledby="h-rules">
              <h2 id="h-rules" className="rc-h2">
                <span>4</span>운송 · 보관 규칙
              </h2>
              <p>
                리튬 배터리는 위험물로 옮기고, 재사용 제품은 법에 따라 거듭 검사합니다. 국제 규정 · 국내 법 · 정부 방안은 근거 수준이 달라 따로 표시했습니다.
              </p>
              <ul className="sf-rules">
                {rules.map((r) => (
                  <li key={r.k} className="rc-panel">
                    <span className="k">{r.k}</span>
                    <p className="t">{r.t}</p>
                    <p className="d">
                      {r.d} <Cite src={r.src} />
                    </p>
                  </li>
                ))}
              </ul>
            </section>

            {/* ── 5 작업자와 다음 단계 ── */}
            <section id="sf-people" className="rc-sec" aria-labelledby="h-people">
              <h2 id="h-people" className="rc-h2">
                <span>5</span>작업자를 지키는 일
              </h2>
              <p>
                팩 해체는 아직 대부분 사람 손으로 이루어져, 작업자가 감전과 유해 물질에 노출됩니다. 로봇 해체 셀 같은 자동화 연구가 이 위험을 줄이려 합니다. <Cite src={[14, 26]} />
              </p>
              <aside className="rc-note" aria-label="열처리의 불소 가스">
                <h3>열처리에서 나오는 불소 가스</h3>
                <p>
                  양극 바인더(PVDF)는 양이 적지만, 열처리로 분해될 때 불화수소를 비롯한 여러 불소 가스를 냅니다. 재활용의 열처리 단계에서 배기 처리가 필요한 이유입니다. <Cite src={[61]} />
                </p>
              </aside>
              <div className="sf-links">
                <Link href="/topics/recycling" className="sf-link">
                  <b>03</b>
                  <span>
                    <strong>재활용</strong>방전 · 열처리 · 분말로 바꿔 옮기는 Hub &amp; Spoke
                  </span>
                </Link>
                <Link href="/topics/soh-diagnosis" className="sf-link">
                  <b>05</b>
                  <span>
                    <strong>잔존수명 진단</strong>떼어 내기 전 성능 · 안전 평가
                  </span>
                </Link>
                <Link href="/topics/automated-disassembly" className="sf-link">
                  <b>07</b>
                  <span>
                    <strong>자동화 해체</strong>사람 대신 로봇이 위험한 해체를
                  </span>
                </Link>
              </div>
            </section>

            <RefsSection papers={papers} other={other} note={<>보강 — 55~61번 문헌은 2026년 9월 이 페이지를 개편하며 추가했습니다. 60번은 국내 연구입니다.</>} />
            <NextNav slug="safety" />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
