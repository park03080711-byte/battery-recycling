import Link from "next/link";
import Footer from "@/components/Footer";
import { Cite } from "../rc/Cite";
import { RcToc } from "../rc/Interactive";
import { SystemMap } from "../rc/SystemMap";
import { NextNav, RefsSection, TopicHead, type Kpi } from "../rc/kit";
import { collectCited } from "../rc/sources";
import { facts, hard, roles, stepSrc, steps, toc } from "./data";
import { IconShare, IconSteps, IconTwice } from "./Icons";
import { AtexFig, CutBars, ShareBar } from "./Parts";
import cell from "./cell.json";
import motion from "./motion.json";

const icons = [<IconShare key="a" />, <IconTwice key="b" />, <IconSteps key="c" />];
const kpis: Kpi[] = facts.map((f, i) => ({ ...f, icon: icons[i] }));

const { papers, other } = collectCited(
  facts.flatMap((f) => f.src),
  stepSrc,
  hard.flatMap((h) => h.src),
  roles.flatMap((r) => r.src),
  ["C2", 26, 36, 40, 62, 68]
);

export default function DisassemblyPage() {
  return (
    <div className="rc">
      <main id="main">
        <TopicHead
          slug="automated-disassembly"
          sub="사람 손에서 로봇 팔로"
          papers={papers.length}
          kpis={kpis}
          lead="배터리 팩 해체는 지금도 대부분 사람 손으로 합니다. 위험하고, 팩마다 설계가 달라 한 가지 절차로 처리할 수 없기 때문입니다. 연구들의 결론은 로봇이 전부 맡는 것이 아니라, 로봇은 반복 · 위험 작업을, 사람은 판단 · 섬세한 작업을 나눠 맡는 협업입니다."
        />

        <div className="rc-wrap rc-body">
          <RcToc items={toc} />

          <div className="rc-main">
            {/* ── 1 왜 어려운가 ── */}
            <section id="ad-why" className="rc-sec" aria-labelledby="h-why">
              <h2 id="h-why" className="rc-h2">
                <span>1</span>왜 로봇에게 어려운가
              </h2>
              <p>
                자동차 공장은 같은 차를 수만 대 조립하지만, 해체 공장에는 차종 · 연식 · 상태가 제각각인 팩이 들어옵니다. 여러 연구를 모은 문헌 검토는 어려움을 크게 셋으로
                봅니다. <Cite src={[67]} />
              </p>
              <ul className="rc-panel sf-issues">
                {hard.map((h, i) => (
                  <li key={h.t}>
                    <b>{i + 1}</b>
                    <div>
                      <p className="t">{h.t}</p>
                      <p className="d">
                        {h.d} <Cite src={h.src} />
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
              <figure className="rc-panel ad-atex-fig" aria-labelledby="ad-atex-cap">
                <div className="ad-atex-grid">
                  <AtexFig />
                  <p className="ad-atex-note">
                    이탈리아 국가연구위원회(CNR) 연구진은 피아트 500e 팩의 해체 셀을 설계하며 팩 주변을 먼저 폭발 위험 구역으로 나눴습니다. 가스가 나올 수 있는 곳을 중심으로 반경
                    1 m 구가 Zone 2였고, 그 안에서 쓰는 로봇 공구를 인증 제품으로 설계했습니다. <Cite src={[66]} />
                  </p>
                </div>
                <figcaption id="ad-atex-cap">그림 1. 폭발 위험 구역 개념도. &lsquo;반경 1 m · Zone 2&rsquo;는 논문 서술을 옮긴 값이고, 팩 크기와 모양은 개념입니다.</figcaption>
              </figure>
            </section>

            {/* ── 2 로봇 해체 셀 지도 ── */}
            <section id="ad-map" className="rc-sec" aria-labelledby="h-map">
              <h2 id="h-map" className="rc-h2">
                <span>2</span>로봇 해체 셀 — 팩에서 모듈까지
              </h2>
              <p>
                카메라로 보고, 로봇이 나사를 풀고, 사람이 커넥터를 떼고, 로봇이 모듈을 꺼내 나눕니다. 연구에 나온 셀들을 한 줄로 단순화한 도식입니다. <Cite src={stepSrc} />
              </p>
              <SystemMap
                steps={steps}
                groups={[
                  { label: "보고 풀기", tag: "로봇" },
                  { label: "떼고 꺼내기", tag: "사람 + 로봇" },
                ]}
                mid="뚜껑을 연 뒤"
                plant={cell}
                motion={motion}
                motionSrc="/ad/cell"
                img="/ad/cell"
                mask="/ad/mask_"
                title="로봇 해체 셀 지도"
                sub="비전 스캔 · 나사 풀기 · 사람 협업 · 모듈 꺼내기 · 분류"
                keys={[
                  { k: "g0", label: "로봇" },
                  { k: "g1", label: "사람 + 로봇" },
                  { k: "flow", label: "팩의 이동" },
                ]}
                capId="cell-cap"
                caption={
                  <>
                    그림 2. 번호를 누르면 그 단계만 밝아지고 아래에 무엇이 들어가 무엇이 나오는지가 뜹니다. &lsquo;공정 재생&rsquo;을 누르면 로봇 팔 A가 나사 여섯 개를 차례로 풀고,
                    사람이 작업하는 동안 상태등이 주황으로 바뀌며, 로봇 팔 B가 모듈을 집어 컨베이어로 옮깁니다. 팔은 관절 각도를 계산해 실제로 움직이지만, 장면과 속도는 이 사이트가
                    Blender로 직접 만든 설명용 도식이며 실제 설비와 다릅니다. <Cite src={stepSrc} />
                  </>
                }
              />
            </section>

            {/* ── 3 얼마나 자동화할까 ── */}
            <section id="ad-share" className="rc-sec" aria-labelledby="h-share">
              <h2 id="h-share" className="rc-h2">
                <span>3</span>얼마나 자동화할 수 있나
              </h2>
              <p>
                버밍엄대 연구진은 미쓰비시 아웃랜더 PHEV 팩을 팩에서 모듈까지 해체하는 작업을 하나하나 나눠, 로봇이 할 수 있는지를 따졌습니다. <Cite src={[62]} />
              </p>
              <figure className="rc-panel ad-share-fig" aria-labelledby="ad-share-cap">
                <p className="ad-fig-h">팩→모듈 해체 작업의 자동화 가능성</p>
                <ShareBar />
                <div className="ad-gain">
                  <div>
                    <b>+12.85%</b>
                    <span>연간 순수익</span>
                  </div>
                  <div>
                    <b>−43.75%</b>
                    <span>해체 비용</span>
                  </div>
                  <p>지금 기술로 할 수 있는 작업만 로봇에 맡기고 나머지는 사람과 나눠 할 때 계산한 값입니다. 복잡한 작업을 로봇이 해내는 일은 아직 풀리지 않은 과제로 남았습니다.</p>
                </div>
                <figcaption id="ad-share-cap">그림 3. 자동화 비율과 협업 시 경제성. 19%는 100에서 두 값을 뺀 몫입니다. <Cite src={[62]} /></figcaption>
              </figure>
              <div className="ad-speed">
                <div className="rc-panel">
                  <p className="ad-fig-h">자르기는 로봇이 빠르다</p>
                  <CutBars />
                  <p className="ad-speed-d">
                    모듈 케이스 절단은 로봇이 약 2배 빨랐지만, 부품을 집어 분류하는 일은 기술자가 18초 빠르고 더 정확했습니다. <Cite src={[63]} />
                  </p>
                </div>
                <aside className="rc-note" aria-label="로봇 네 대 셀의 시간">
                  <h3>로봇 네 대로도 사람보다 느렸다</h3>
                  <p>
                    버밍엄대의 로봇 네 대 셀은 PHEV 팩을 모듈까지 부수지 않고 해체했지만, 작업마다 걸린 시간은 모두 사람이 더 짧았습니다. 케이블 타이 · 배선 묶음 · 모듈 밑 냉각 패드가
                    로봇을 애먹인 예로 꼽혔습니다. <Cite src={[65]} />
                  </p>
                </aside>
              </div>
            </section>

            {/* ── 4 로봇과 사람 ── */}
            <section id="ad-roles" className="rc-sec" aria-labelledby="h-roles">
              <h2 id="h-roles" className="rc-h2">
                <span>4</span>로봇이 할 일, 사람이 할 일
              </h2>
              <p>
                연구들은 공통으로 완전 자동화보다 협업을 권합니다. 로봇은 위험하고 반복되는 일을, 사람은 판단이 필요하고 모양이 제각각인 일을 맡는 식입니다. <Cite src={[63, 66]} />
              </p>
              <div className="ad-roles">
                {(["robot", "human"] as const).map((who) => (
                  <div key={who} className={`rc-panel ad-role ${who}`}>
                    <p className="ad-role-h">{who === "robot" ? "로봇" : "사람"}</p>
                    <ul>
                      {roles
                        .filter((r) => r.who === who)
                        .map((r) => (
                          <li key={r.t}>
                            <p className="t">{r.t}</p>
                            <p className="d">
                              {r.d} <Cite src={r.src} />
                            </p>
                          </li>
                        ))}
                    </ul>
                  </div>
                ))}
              </div>
            </section>

            {/* ── 5 AI와 현장 ── */}
            <section id="ad-next" className="rc-sec" aria-labelledby="h-next">
              <h2 id="h-next" className="rc-h2">
                <span>5</span>AI와 현장
              </h2>
              <p>
                MIT 등의 연구진은 인공지능이 해체 전 과정에 도움이 될 수 있고, 특히 배터리 상태 예측 · 해체 순서 결정 · 부품 인식이 유망하다고 정리했습니다. 다만 지금 AI의 한계와 기계적 ·
                화학적 복잡성 때문에 완전한 자율 해체까지는 과제가 남았다고 봤습니다. <Cite src={[68]} />
              </p>
              <div className="sf-cards">
                <aside className="rc-note" aria-label="국내 기업 사례">
                  <h3>국내 기업의 모듈형 해체 로봇</h3>
                  <p>
                    국내 기업 THOTH(토트)의 DisMantleBot은 CES 2025 혁신상을 받았습니다. 회사는 배터리 등급에 따라 완전 · 부분 해체를 정하고, 팩을 모듈 · 셀 · 전극까지 나눈다고
                    소개합니다. 기업 발표이며 외부 검증 전입니다. <Cite src={["C2"]} />
                  </p>
                </aside>
                <aside className="rc-note" aria-label="셀까지">
                  <h3>모듈에서 셀까지</h3>
                  <p>
                    이 페이지의 셀은 팩→모듈까지입니다. 모듈을 다시 셀로 나누는 로봇 셀 시제품과, 셀 단위까지 해체해 재제조 · 용도 전환하는 공정도 연구되고 있습니다. <Cite src={[26, 36, 40]} />
                  </p>
                </aside>
              </div>
              <div className="sf-links">
                <Link href="/topics/remanufacturing" className="sf-link">
                  <b>01</b>
                  <span>
                    <strong>재제조</strong>온전히 꺼낸 모듈 · 셀을 다시 쓰는 길
                  </span>
                </Link>
                <Link href="/topics/safety" className="sf-link">
                  <b>06</b>
                  <span>
                    <strong>안전 관리</strong>해체 전에 방전 · 반등 확인
                  </span>
                </Link>
                <Link href="/topics/design-for-disassembly" className="sf-link">
                  <b>14</b>
                  <span>
                    <strong>분해를 고려한 설계</strong>처음부터 떼기 쉽게 만드는 근본 해법
                  </span>
                </Link>
              </div>
            </section>

            <RefsSection papers={papers} other={other} note={<>보강 — 62~68번 문헌은 2026년 9월 이 페이지를 개편하며 추가했습니다.</>} />
            <NextNav slug="automated-disassembly" />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
