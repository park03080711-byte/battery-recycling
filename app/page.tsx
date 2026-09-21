import Link from "next/link";
import { layers } from "@/data/layers";
import { topicsByLayer } from "@/data/topics";
import Fullpage from "@/components/home/Fullpage";
import Hero from "@/components/home/Hero";
import TopicGrid from "@/components/home/TopicGrid";
import Footer from "@/components/Footer";
import { PanelArt, ReportBg, WhyArt } from "@/components/Art";
import { ReportIcon } from "@/components/Icons";

const sections = [
  { id: "s-intro", label: "INTRO" },
  { id: "s-layers", label: "LAYERS" },
  { id: "s-topics", label: "TOPICS" },
  { id: "s-why", label: "WHY NOW" },
  { id: "s-report", label: "ARCHIVE" },
];

export default function Home() {
  return (
    <Fullpage items={sections}>
      <Hero />

      {/* 네 층위 — 호버 시 확장되는 패널 */}
      <section className="fp-section" id="s-layers" data-dark="true" aria-label="네 가지 층위">
        <div className="panels">
          {layers.map((l) => (
            <article className="panel" key={l.id}>
              <div className="panel-bg">
                <PanelArt layer={l.id} />
              </div>
              <div className="panel-body">
                <div className="panel-range">{l.range}</div>
                <h2 className="panel-title">{l.title}</h2>
                <div className="en">{l.en}</div>
                <div className="panel-more">
                  <div>
                    <p>
                      <b>{l.question}.</b> {l.description}
                    </p>
                    <ul>
                      {topicsByLayer(l.id).map((t) => (
                        <li key={t.slug}>
                          <Link href={`/topics/${t.slug}`}>
                            {t.no} {t.title}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* 14개 주제 카드 */}
      <section className="fp-section sec-topics" id="s-topics" aria-labelledby="topics-title">
        <div className="container">
          <div className="sec-head">
            <span className="eyebrow">TOPICS</span>
            <h2 id="topics-title">열네 개의 주제</h2>
            <p>카드를 누르면 주제별 상세 페이지로 이동합니다.</p>
          </div>
          <TopicGrid />
        </div>
      </section>

      {/* 왜 지금인가 */}
      <section className="fp-section sec-why" id="s-why" aria-labelledby="why-title">
        <div className="why-copy">
          <span className="eyebrow">WHY NOW</span>
          <h2 id="why-title">
            규제가 수요를 만들고,
            <br />
            수요가 기술을 끌어낸다
          </h2>
          <p>
            폐배터리 재활용은 환경 보호라는 명분만으로 움직이는 분야가 아닙니다. 전기차 배터리의 교체 주기가 돌아오고, EU는 재생원료 사용을 시장 진입
            요건으로 바꿨습니다.
          </p>
          <div className="why-stats">
            <div>
              <b>107,500개</b>
              <span>2030년 국내 사용후 배터리 배출 전망</span>
              <small>2023년 약 2,355개 · 환경 당국 추정</small>
            </div>
            <div>
              <b>리튬 50%</b>
              <span>EU 폐배터리 리튬 추출률 목표</span>
              <small>2027년 · EU 배터리 규정</small>
            </div>
            <div>
              <b>95%+</b>
              <span>습식제련 금속 회수율</span>
              <small>국내 기업 자체 발표 기준</small>
            </div>
            <div>
              <b>9 → 4</b>
              <span>재활용 공정 분류 중 상용화</span>
              <small>상용·준상용 4 · 이론·연구 5</small>
            </div>
          </div>
        </div>
        <div className="why-art">
          <WhyArt />
        </div>
      </section>

      {/* 자료실 */}
      <section className="fp-section sec-report" id="s-report" aria-labelledby="report-title">
        <div className="report-bg">
          <ReportBg />
        </div>
        <div className="report-inner">
          <span className="eyebrow">ARCHIVE</span>
          <h2 id="report-title">
            모든 수치에는
            <br />
            출처가 있습니다
          </h2>
          <div className="report-cards">
            <div className="report-card">
              <div className="ic">
                <ReportIcon kind="topics" />
              </div>
              <h3>주제 한눈에</h3>
              <p>
                네 층위로 묶은
                <br />
                14개 주제의 전체 지도
              </p>
              <Link className="btn-line" href="/topics">
                자세히보기
              </Link>
            </div>
            <div className="report-card">
              <div className="ic">
                <ReportIcon kind="report" />
              </div>
              <h3>사이트 소개</h3>
              <p>
                조사 배경과 범위,
                <br />
                주제 분류의 기준
              </p>
              <Link className="btn-line" href="/about">
                자세히보기
              </Link>
            </div>
            <div className="report-card">
              <div className="ic">
                <ReportIcon kind="refs" />
              </div>
              <h3>참고문헌</h3>
              <p>
                DOI · PMID · KCI로
                <br />
                개별 검증한 35편
              </p>
              <Link className="btn-line" href="/references">
                자세히보기
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer snap />
    </Fullpage>
  );
}
