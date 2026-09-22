import type { Metadata } from "next";
import Link from "next/link";
import { layers } from "@/data/layers";
import SubVisual from "@/components/sub/SubVisual";
import Footer from "@/components/Footer";

export const metadata: Metadata = { title: "사이트 소개" };

export default function AboutPage() {
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
      <div className="container">
        <header className="page-title">
          <h1>왜 14개의 주제인가</h1>
          <p className="tagline">리사이클링 공정 하나만 보면 놓치는 것들</p>
        </header>

        <section className="intro-box">
          <p className="lead">
            전기차 보급이 빠르게 확대되면서 수명을 다한 리튬이온전지의 처리가 시급한 과제로 떠올랐습니다. 이 사이트는 폐배터리 리사이클링 기술을 조사한 보고서를
            웹으로 다시 구성한 것으로, 국내 습식제련 공정을 기준점으로 삼아 상용 기술과 연구 단계 대안을 비교하고 활용방안 전체를 14개 주제로 정리했습니다.
          </p>
          <ul className="facts">
            <li className="fact" style={{ gridTemplateColumns: "1fr" }}>
              <div>
                <b>44편</b>
                <span>검증된 학술 문헌</span>
                <small>국제 13 · 국내 9 · 재사용·재제조 13 · 신기술 9</small>
              </div>
            </li>
            <li className="fact" style={{ gridTemplateColumns: "1fr" }}>
              <div>
                <b>4 층위 · 14 주제</b>
                <span>경로 · 지원 기술 · 평가 · 설계</span>
              </div>
            </li>
            <li className="fact" style={{ gridTemplateColumns: "1fr" }}>
              <div>
                <b>9 공정</b>
                <span>재활용 하위 분류</span>
                <small>상용·준상용 4 · 이론·연구 5</small>
              </div>
            </li>
          </ul>
        </section>

        <section className="content-sec" id="frame">
          <div className="side">
            <div className="label">FRAMEWORK</div>
            <h2>네 개의 질문</h2>
          </div>
          <div className="content-body">
            <p>
              폐배터리 활용방안은 리사이클링 공정만으로 이루어지지 않습니다. 무엇을 할 것인가(경로), 무엇이 있어야 가능한가(지원 기술), 좋은지 어떻게 판단하는가(평가),
              애초에 어떻게 만들 것인가(설계)라는 네 층위가 있고, 이 틀로 조사 범위를 정리하면 연구 주제 14개가 나옵니다.
            </p>
            <div className="table-wrap" tabIndex={0} role="region" aria-label="표">
              <table>
                <thead>
                  <tr>
                    <th scope="col">층위</th>
                    <th scope="col">질문</th>
                    <th scope="col">주제</th>
                  </tr>
                </thead>
                <tbody>
                  {layers.map((l) => (
                    <tr key={l.id}>
                      <td style={{ fontWeight: 700, color: l.color, whiteSpace: "nowrap" }}>
                        {l.no}. {l.title}
                      </td>
                      <td>{l.question}</td>
                      <td>
                        <Link href={`/topics#${l.id}`} style={{ color: "var(--blue)", textDecoration: "underline" }}>
                          {l.range}
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section className="content-sec" id="method">
          <div className="side">
            <div className="label">METHOD</div>
            <h2>조사 범위와 방법</h2>
          </div>
          <div className="content-body">
            <ul className="bullets">
              <li>국내 리사이클링 기업의 공정 설명 자료를 단계별로 분석하고 학술 문헌과 교차 검증</li>
              <li>EU 배터리 규정과 국내 사용후배터리법 등 정책 · 시장 환경 정리</li>
              <li>사용후 배터리의 세 처리 경로(재제조 · 재사용 · 재활용)와 분기 기준 정리</li>
              <li>상용 · 준상용 기술 4종과 이론 · 연구 단계 기술 5종의 원리, 선례, 실현 가능성 평가</li>
              <li>인용한 모든 문헌의 DOI · PMID · KCI 등재번호를 개별 조회해 실존 여부와 서지사항 검증</li>
            </ul>
          </div>
        </section>

        <section className="content-sec" id="design">
          <div className="side">
            <div className="label">DESIGN NOTE</div>
            <h2>색과 그림에 관하여</h2>
          </div>
          <div className="content-body">
            <p>
              처리 경로의 에메랄드는 황산니켈 결정, 평가의 로즈는 황산코발트 결정의 실제 색에서 가져왔습니다. 습식제련의 최종 산출물이 금속마다 다른 색을 띤다는 사실을
              사이트의 색 체계로 옮긴 것입니다.
            </p>
            <p>
              사이트의 모든 일러스트와 도식은 코드로 직접 제작했습니다. 웹에서 찾은 사진은 대부분 기업 · 언론사 저작물이라 사용하지 않았고, 사실감보다 원리 설명이
              중요한 자리에는 도식을 썼습니다.
            </p>
            <aside className="note">
              <h3>고지</h3>
              <p>
                본 사이트는 학생 과제물이며 비영리 교육 목적으로 제작했습니다. 언급된 기업과 관련이 없으며, 기업명은 사실 서술 목적으로만 사용했습니다. 기업 발표 수치는 자체
                발표 기준이고, 정책 수치는 인용 시점에 따라 달라질 수 있습니다.
              </p>
            </aside>
          </div>
        </section>
        <div style={{ height: 120 }} />
      </div>
      </main>
      <Footer />
    </div>
  );
}
