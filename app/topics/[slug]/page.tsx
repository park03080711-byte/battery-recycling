import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { layers, layerById } from "@/data/layers";
import { topics, topicBySlug, type Block } from "@/data/topics";
import { refById } from "@/data/references";
import SubVisual from "@/components/sub/SubVisual";
import Toc from "@/components/sub/Toc";
import Viz from "@/components/sub/Viz";
import RefList from "@/components/sub/RefList";
import Footer from "@/components/Footer";
import { FactIcon, TopicIcon } from "@/components/Icons";

type Params = { slug: string };

export function generateStaticParams(): Params[] {
  return topics.map((t) => ({ slug: t.slug }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const t = topicBySlug(slug);
  if (!t) return {};
  return { title: `${t.no}. ${t.title}`, description: t.lead };
}

function RenderBlock({ b, slug }: { b: Block; slug: string }) {
  switch (b.type) {
    case "p":
      return <p>{b.text}</p>;
    case "list":
      return (
        <ul className="bullets">
          {b.items.map((it) => (
            <li key={it}>{it}</li>
          ))}
        </ul>
      );
    case "note":
      return (
        <aside className="note">
          <h3>{b.title}</h3>
          <p>{b.text}</p>
        </aside>
      );
    case "steps":
      return (
        <ol className="steps">
          {b.items.map((s) => (
            <li className="step" key={s.title}>
              <h3>{s.title}</h3>
              <p>{s.desc}</p>
            </li>
          ))}
        </ol>
      );
    case "table":
      return (
        <div className="table-wrap" tabIndex={0} role="region" aria-label={b.caption ?? `표: ${b.head.join(", ")}`}>
          <table>
            {b.caption && <caption>{b.caption}</caption>}
            <thead>
              <tr>
                {b.head.map((h) => (
                  <th key={h} scope="col">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {b.rows.map((r, i) => (
                <tr key={i}>
                  {r.map((c, j) => (
                    <td key={j}>{c}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    case "viz":
      return <Viz name={b.name} current={slug} />;
  }
}

export default async function TopicPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const t = topicBySlug(slug);
  if (!t) notFound();

  const layer = layerById(t.layer);
  const idx = topics.findIndex((x) => x.slug === t.slug);
  const prev = topics[(idx - 1 + topics.length) % topics.length];
  const next = topics[(idx + 1) % topics.length];
  const refs = t.refs.map(refById).sort((a, b) => a.id - b.id);
  const tocItems = t.sections.map((s, i) => ({ id: `sec-${i + 1}`, label: s.heading }));

  const style = { ["--layer" as string]: layer.color, ["--layer-soft" as string]: layer.colorSoft };

  return (
    <div style={style}>
      <main id="main">
      <SubVisual
        layer={t.layer}
        seed={idx + 1}
        en={`${layer.no}. ${layer.en}`}
        big={layer.title}
        crumbs={[
          {
            label: layer.title,
            options: layers.map((l) => ({
              href: `/topics/${topics.find((x) => x.layer === l.id)!.slug}`,
              label: `${l.no}. ${l.title}`,
              current: l.id === t.layer,
            })),
          },
          {
            label: `${t.no} ${t.title}`,
            options: topics.map((x) => ({ href: `/topics/${x.slug}`, label: `${x.no} ${x.title}`, current: x.slug === t.slug })),
          },
        ]}
      />

        <div className="container">
          <header className="page-title">
            <span className="no">{t.no}</span>
            <h1>{t.title}</h1>
            <p className="tagline">
              {t.en} — {t.tagline}
            </p>
          </header>

          <section className="intro-box" aria-label="요약">
            <div>
              <div style={{ color: layer.color, marginBottom: 16 }}>
                <TopicIcon slug={t.slug} size={72} />
              </div>
              <p className="lead">{t.lead}</p>
              <div className="coverage">
                조사 보고서 내 비중 <b>{t.coverage}</b>
              </div>
            </div>
            <ul className="facts">
              {t.facts.map((f, i) => (
                <li className="fact" key={f.label}>
                  <div className="fact-ic">
                    <FactIcon kind={i} />
                  </div>
                  <div>
                    <b>{f.value}</b>
                    <span>{f.label}</span>
                    {f.note && <small>{f.note}</small>}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <Toc items={tocItems} />

        <div className="container">
          {t.sections.map((s, i) => (
            <section className="content-sec" id={`sec-${i + 1}`} key={s.heading} aria-labelledby={`h-${i + 1}`}>
              <div className="side">
                <div className="label">{s.label}</div>
                <h2 id={`h-${i + 1}`}>{s.heading}</h2>
                <span className="idx" aria-hidden="true" data-n={String(i + 1).padStart(2, "0")} />
              </div>
              <div className="content-body">
                {s.blocks.map((b, j) => (
                  <RenderBlock key={j} b={b} slug={t.slug} />
                ))}
              </div>
            </section>
          ))}
        </div>

        <section className="refs-sec" aria-labelledby="refs-title">
          <div className="container">
            <h2 id="refs-title">이 주제의 근거 문헌</h2>
            <RefList refs={refs} />
            <p style={{ marginTop: 16, fontSize: "var(--fs-xs)", color: "var(--muted)" }}>
              정책 수치는 공공기관 발표와 언론 보도에 근거합니다. 전체 목록은 <Link href="/references" style={{ color: "var(--blue)", textDecoration: "underline" }}>참고문헌</Link> 페이지에 있습니다.
            </p>
          </div>
        </section>

        <section className="related container" aria-labelledby="rel-title">
          <h2 id="rel-title">함께 보면 좋은 주제</h2>
          <ul className="topic-grid" style={{ marginBottom: 48 }}>
            {t.related.map((rs) => {
              const r = topicBySlug(rs)!;
              const rl = layerById(r.layer);
              return (
                <li key={r.slug} className="topic-card" style={{ ["--layer" as string]: rl.color, minHeight: 200 }}>
                  <Link href={`/topics/${r.slug}`} style={{ position: "absolute", inset: 0, zIndex: 1 }} aria-label={`${r.no} ${r.title}`} />
                  <div>
                    <span className="no">{r.no}</span>
                    <span className="tag">{rl.title}</span>
                  </div>
                  <h3>{r.title}</h3>
                  <p>{r.tagline}</p>
                  <span className="plus" aria-hidden="true">+</span>
                </li>
              );
            })}
          </ul>
          <nav className="pager" aria-label="이전 · 다음 주제">
            <Link href={`/topics/${prev.slug}`}>
              <small>← PREV</small>
              <b>
                {prev.no} {prev.title}
              </b>
            </Link>
            <Link href={`/topics/${next.slug}`}>
              <small>NEXT →</small>
              <b>
                {next.no} {next.title}
              </b>
            </Link>
          </nav>
        </section>
      </main>
      <Footer />
    </div>
  );
}
