import type { Metadata } from "next";
import Link from "next/link";
import { layers } from "@/data/layers";
import { topicBySlug, topics, topicsByLayer } from "@/data/topics";
import { refBreakdown, refTotal } from "@/data/references";
import SubVisual from "@/components/sub/SubVisual";
import Footer from "@/components/Footer";
import { LevelTag } from "@/components/rc/Cite";
import { DepthPillars } from "@/components/rc/Iso";
import { depthLegend } from "@/components/rc/sources";
import { HowIcon, IconBooks, IconGrid, IconLayers4, LayerStack } from "@/components/about/Art";
import { fixes, howto, making, revamped, rules } from "@/components/about/data";

export const metadata: Metadata = { title: "사이트 소개" };

const done = revamped.length;

export default function AboutPage() {
  const kpis = [
    { icon: <IconBooks />, v: `${refTotal}`, u: "편", h: "하나씩 확인한 학술 문헌", d: refBreakdown() },
    { icon: <IconLayers4 />, v: "14", u: "주제", h: "네 층위로 나눈 활용방안", d: "처리 경로 · 지원 기술 · 평가 · 설계" },
    { icon: <IconGrid done={done} total={topics.length} />, v: `${done}`, u: `/ ${topics.length}`, h: "새로 만든 주제 페이지", d: "지도 · 공정 재생 · 보강 문헌 (2026년 9월)" },
  ];
  return (
    <div style={{ ["--layer" as string]: "#0b3f8c", ["--layer-soft" as string]: "#e6eefa" }}>
      <main id="main">
        <SubVisual
          layer="neutral"
          seed={12}
          en="ABOUT"
          big="사이트 소개"
          crumbs={[
            {
              label: "사이트 소개",
              options: [
                { href: "/about", label: "사이트 소개", current: true },
                { href: "/topics", label: "주제 한눈에" },
                { href: "/references", label: "참고문헌" },
              ],
            },
          ]}
        />
        <div className="rc ab">
          <div className="rc-wrap">
            <div className="rc-hero ab-hero">
              <div className="rc-title">
                <h1>왜 14개의 주제인가</h1>
                <p className="rc-tag">리사이클링 공정 하나만 보면 놓치는 것들</p>
              </div>
              <p className="rc-lead">
                전기차가 늘면서 수명을 다한 배터리를 어떻게 처리할지가 급한 문제가 됐습니다. 이 사이트는 폐배터리 리사이클링 기술 조사 보고서를 웹으로 다시 짠 것입니다. 국내
                습식제련 공정을 기준으로 상용 기술과 연구 단계 대안을 비교하고, 활용방안 전체를 14개 주제로 정리했습니다.
              </p>
            </div>

            <h2 className="sr-only">요약 — 숫자로 본 이 사이트</h2>
            <ul className="rc-kpis ab-kpis">
              {kpis.map((k) => (
                <li key={k.h} className="rc-kpi">
                  <div className="rc-kpi-in">
                    {k.icon}
                    <p className="v">
                      {k.v}
                      <small>{k.u}</small>
                    </p>
                    <h3>{k.h}</h3>
                    <p className="d">{k.d}</p>
                  </div>
                </li>
              ))}
            </ul>

            {/* ── 1 네 개의 질문 ── */}
            <section id="ab-frame" className="rc-sec" aria-labelledby="h-frame">
              <h2 id="h-frame" className="rc-h2">
                <span>1</span>네 개의 질문
              </h2>
              <p>
                폐배터리 활용은 리사이클링 공정만으로 끝나지 않습니다. 무엇을 할지(경로), 무엇이 있어야 가능한지(지원 기술), 좋은지 어떻게 판단할지(평가), 애초에 어떻게 만들지(설계)
                — 네 질문으로 조사 범위를 나누면 주제 14개가 나옵니다.
              </p>
              <div className="rc-panel ab-frame">
                <LayerStack />
                <ol className="ab-layers">
                  {layers.map((l) => (
                    <li key={l.id} style={{ ["--c" as string]: l.color, ["--cs" as string]: l.colorSoft }}>
                      <p className="h">
                        <b>{l.no}</b>
                        {l.title}
                        <span>{l.question}</span>
                      </p>
                      <ul className="ab-chips">
                        {topicsByLayer(l.id).map((t) => (
                          <li key={t.slug}>
                            <Link href={`/topics/${t.slug}`}>
                              <em>{t.no}</em>
                              {t.title}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </li>
                  ))}
                </ol>
              </div>
            </section>

            {/* ── 2 읽는 법 ── */}
            <section id="ab-how" className="rc-sec" aria-labelledby="h-how">
              <h2 id="h-how" className="rc-h2">
                <span>2</span>이 사이트를 읽는 법
              </h2>
              <p>새로 만든 주제 페이지는 모두 같은 틀입니다. 맨 위 숫자 세 개로 요점을 잡고, 지도로 공정을 따라간 뒤, 본문에서 근거를 확인하면 됩니다.</p>
              <ol className="ab-how">
                {howto.map((h, i) => (
                  <li key={h.k} className="rc-panel">
                    <HowIcon k={h.k} />
                    <p className="t">
                      <b>{i + 1}</b>
                      {h.t}
                    </p>
                    <p className="d">{h.d}</p>
                  </li>
                ))}
              </ol>
            </section>

            {/* ── 3 근거를 다루는 원칙 ── */}
            <section id="ab-rules" className="rc-sec" aria-labelledby="h-rules">
              <h2 id="h-rules" className="rc-h2">
                <span>3</span>근거를 다루는 원칙
              </h2>
              <p>
                국내 리사이클링 기업의 공정 자료를 단계별로 나눠 학술 문헌과 대조했고, EU 배터리 규정과 국내 사용후배터리법, 세 처리 경로(재제조 · 재사용 · 재활용)의 갈림 기준,
                상용 · 준상용 기술 4종과 연구 단계 기술 5종을 함께 정리했습니다. 이때 지킨 원칙은 넷입니다.
              </p>
              <ul className="ab-rules">
                {rules.map((r) => (
                  <li key={r.t} className="rc-panel">
                    <p className="t">{r.t}</p>
                    <p className="d">{r.d}</p>
                  </li>
                ))}
              </ul>
              <div className="rc-depth ab-depth">
                <DepthPillars />
                <div>
                  <p className="rc-depth-h">
                    근거 수준 <span>기둥이 높을수록 외부 검증을 더 거친 자료</span>
                  </p>
                  <dl>
                    {depthLegend.map((d) => (
                      <div key={d.level}>
                        <dt>
                          <LevelTag level={d.level} />
                        </dt>
                        <dd>{d.what}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              </div>
              <h3 className="ab-h3">바로잡은 기록</h3>
              <ol className="ab-fixes">
                {fixes.map((f) => (
                  <li key={f.t}>
                    <span className="when">{f.when}</span>
                    <div>
                      <p className="t">
                        <Link href={`/topics/${f.slug}`}>
                          {f.no} {topicBySlug(f.slug)?.title}
                        </Link>{" "}
                        — {f.t}
                      </p>
                      <p className="d">{f.d}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </section>

            {/* ── 4 만든 방법과 개편 현황 ── */}
            <section id="ab-make" className="rc-sec" aria-labelledby="h-make">
              <h2 id="h-make" className="rc-h2">
                <span>4</span>만든 방법과 개편 현황
              </h2>
              <ul className="ab-make">
                {making.map((m) => (
                  <li key={m.t} className="rc-panel">
                    <p className="t">{m.t}</p>
                    <p className="d">{m.d}</p>
                  </li>
                ))}
              </ul>
              <h3 className="ab-h3">
                주제 페이지 개편 <span>{done} / {topics.length} 완료</span>
              </h3>
              <ul className="ab-grid">
                {revamped.map((r) => {
                  const t = topicBySlug(r.slug)!;
                  return (
                    <li key={r.slug}>
                      <Link href={`/topics/${t.slug}`}>
                        <span className="thumb">
                          <img src={`/about/${r.thumb}.webp`} alt="" width={560} height={330} loading="lazy" decoding="async" />
                        </span>
                        <span className="cap">
                          <em>{t.no}</em>
                          <strong>{t.title}</strong>
                          <small>{r.added ? `${r.scene} · 문헌 ${r.added[1] - r.added[0] + 1}편 보강` : r.scene}</small>
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
              <p className="ab-soon">
                <b>다음 차례</b>
                {topics
                  .filter((t) => !revamped.some((r) => r.slug === t.slug))
                  .map((t) => (
                    <Link key={t.slug} href={`/topics/${t.slug}`}>
                      <em>{t.no}</em>
                      {t.title}
                    </Link>
                  ))}
              </p>
            </section>

            {/* ── 5 색 이야기 ── */}
            <section id="ab-color" className="rc-sec" aria-labelledby="h-color">
              <h2 id="h-color" className="rc-h2">
                <span>5</span>색과 그림에 관하여
              </h2>
              <p>
                처리 경로의 에메랄드는 황산니켈 결정, 평가의 로즈는 황산코발트 결정의 실제 색에서 가져왔습니다. 습식제련의 최종 산출물이 금속마다 다른 색을 띤다는 사실을 사이트의 색
                체계로 옮긴 것입니다. 웹에서 찾은 사진은 대부분 기업 · 언론사 저작물이라 쓰지 않았고, 모든 그림과 도식을 코드로 직접 만들었습니다.
              </p>
              <ul className="ab-swatch">
                {layers.map((l) => (
                  <li key={l.id}>
                    <i style={{ background: l.color }} aria-hidden="true" />
                    <p>
                      <b>
                        {l.no}. {l.title}
                      </b>
                      <span>{l.material}</span>
                    </p>
                  </li>
                ))}
              </ul>
              <aside className="rc-note" aria-label="고지">
                <h3>고지</h3>
                <p>
                  이 사이트는 학생 과제물이며 비영리 교육 목적으로 만들었습니다. 언급한 기업과 관련이 없으며, 기업명은 사실을 서술하는 데만 썼습니다. 기업 발표 수치는 자체 발표
                  기준이고, 정책 수치는 인용 시점에 따라 달라질 수 있습니다.
                </p>
              </aside>
            </section>
            <div style={{ height: 96 }} />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
