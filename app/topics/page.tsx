import type { Metadata } from "next";
import Link from "next/link";
import { layers } from "@/data/layers";
import { topics, topicsByLayer } from "@/data/topics";
import SubVisual from "@/components/sub/SubVisual";
import Footer from "@/components/Footer";
import { TopicIcon } from "@/components/Icons";

export const metadata: Metadata = { title: "14개 주제 한눈에" };

export default function TopicsPage() {
  return (
    <>
      <SubVisual
        layer="neutral"
        seed={40}
        en="TOPIC MAP"
        big="주제 한눈에"
        crumbs={[
          {
            label: "주제 한눈에",
            options: [
              { href: "/about", label: "사이트 소개" },
              { href: "/topics", label: "주제 한눈에", current: true },
              { href: "/references", label: "참고문헌" },
            ],
          },
          { label: "층위 선택", options: layers.map((l) => ({ href: `/topics#${l.id}`, label: `${l.no}. ${l.title} (${l.range})` })) },
        ]}
      />
      <main id="main" className="container">
        <header className="page-title">
          <h1>네 개의 질문, 열네 개의 주제</h1>
          <p className="tagline">폐배터리 활용방안은 리사이클링 공정만으로 이루어지지 않습니다.</p>
        </header>

        {layers.map((l) => (
          <section key={l.id} id={l.id} className="layer-block" style={{ ["--layer" as string]: l.color }} aria-labelledby={`lh-${l.id}`}>
            <div className="layer-head">
              <div>
                <div className="code">
                  {l.no} · {l.en} · {l.range}
                </div>
                <h2 id={`lh-${l.id}`}>{l.title}</h2>
              </div>
              <div>
                <p className="q">{l.question}</p>
                <p>{l.description}</p>
              </div>
            </div>
            <ul className="topic-grid">
              {topicsByLayer(l.id).map((t) => (
                <li key={t.slug} className="topic-card">
                  <Link href={`/topics/${t.slug}`} style={{ position: "absolute", inset: 0, zIndex: 1 }} aria-label={`${t.no} ${t.title}`} />
                  <div>
                    <span className="no">{t.no}</span>
                    <span className="tag">{t.en}</span>
                  </div>
                  <h3>{t.title}</h3>
                  <p>{t.tagline}</p>
                  <div className="icon">
                    <TopicIcon slug={t.slug} size={48} />
                  </div>
                  <span className="plus" aria-hidden="true">+</span>
                </li>
              ))}
            </ul>
          </section>
        ))}

        <section className="layer-block" aria-labelledby="cov-title">
          <div className="layer-head">
            <div>
              <div className="code" style={{ color: "var(--blue)" }}>COVERAGE</div>
              <h2 id="cov-title">조사의 깊이</h2>
            </div>
            <p>
              14개 주제가 모두 같은 깊이로 조사된 것은 아닙니다. 조사 보고서가 본격적으로 다룬 주제와, 언급 수준에 머물러 주제를 확장한다면 우선 검토할 후보를 구분해
              표시했습니다.
            </p>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th scope="col">비중</th>
                  <th scope="col">주제</th>
                </tr>
              </thead>
              <tbody>
                {(["심층 분석", "개괄", "병목으로 다룸", "확장 후보"] as const).map((c) => (
                  <tr key={c}>
                    <td style={{ fontWeight: 700, color: "var(--ink)", whiteSpace: "nowrap" }}>{c}</td>
                    <td>
                      {topics
                        .filter((t) => t.coverage === c)
                        .map((t, i, arr) => (
                          <span key={t.slug}>
                            <Link href={`/topics/${t.slug}`} style={{ color: "var(--blue)" }}>
                              {t.no} {t.title}
                            </Link>
                            {i < arr.length - 1 ? " · " : ""}
                          </span>
                        ))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
        <div style={{ height: 96 }} />
      </main>
      <Footer />
    </>
  );
}
