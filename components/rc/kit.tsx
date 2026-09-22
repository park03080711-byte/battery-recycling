/* 주제 페이지 공통 틀 (아이소메트릭 체계) — 머리 · 요약 카드 · 근거 수준 범례 · 근거 문헌 · 이어 읽기.
   03 재활용에서 만든 구성을 14개 주제가 같이 쓰도록 떼어 냈다. */
import Link from "next/link";
import type { ReactNode } from "react";
import { refById } from "@/data/references";
import { topicBySlug, topics } from "@/data/topics";
import { layerById } from "@/data/layers";
import { DepthPillars } from "./Iso";
import { Cite, LevelTag } from "./Cite";
import { depthLegend, extraSources, type Extra, type Level, type Src } from "./sources";

export type Kpi = { value: string; unit?: string; label: string; detail: string; level: Level; src: Src[]; icon: ReactNode };

export function topicNav(slug: string) {
  const t = topicBySlug(slug)!;
  const idx = topics.findIndex((x) => x.slug === slug);
  return { t, layer: layerById(t.layer), prev: topics[(idx - 1 + topics.length) % topics.length], next: topics[(idx + 1) % topics.length] };
}

export function TopicHead({ slug, sub, lead, papers, kpis }: { slug: string; sub: string; lead: ReactNode; papers: number; kpis: Kpi[] }) {
  const { t, layer, prev, next } = topicNav(slug);
  return (
    <header className="rc-head">
      <div className="rc-wrap">
        <nav className="rc-crumb" aria-label="현재 위치">
          <ol>
            <li>
              <Link href="/">홈</Link>
            </li>
            <li>
              <Link href="/topics">주제 한눈에</Link>
            </li>
            <li>
              <Link href="/topics#paths">{layer.title}</Link>
            </li>
            <li aria-current="page">
              {t.no} {t.title}
            </li>
          </ol>
          <div className="rc-crumb-pn">
            <Link href={`/topics/${prev.slug}`} aria-label={`이전 주제: ${prev.no} ${prev.title}`}>
              ← {prev.no}
            </Link>
            <Link href={`/topics/${next.slug}`} aria-label={`다음 주제: ${next.no} ${next.title}`}>
              {next.no} →
            </Link>
          </div>
        </nav>

        <div className="rc-hero">
          <div className="rc-title">
            <p className="rc-meta">
              <span className="rc-chip">
                <b>{t.no}</b> {layer.title}
              </span>
              <span className="rc-meta-sub">{sub}</span>
            </p>
            <h1>{t.title}</h1>
            <p className="rc-tag">{t.tagline}</p>
          </div>
          <div className="rc-hero-side">
            <p className="rc-lead">{lead}</p>
            <dl className="rc-facts-inline">
              <div>
                <dt>조사 비중</dt>
                <dd>{t.coverage}</dd>
              </div>
              <div>
                <dt>인용 문헌</dt>
                <dd>{papers}편 + 정책 · 기타 자료</dd>
              </div>
              <div>
                <dt>기준 시점</dt>
                <dd>2026년 9월</dd>
              </div>
            </dl>
          </div>
        </div>

        <section id="rc-summary" className="rc-summary" aria-labelledby="h-sum">
          <h2 id="h-sum" className="sr-only">
            요약 — 숫자 세 개와 그 근거
          </h2>
          <ul className="rc-kpis">
            {kpis.map((f) => (
              <li key={f.label} className="rc-kpi">
                <div className="rc-kpi-in">
                  {f.icon}
                  <p className="v">
                    {f.value}
                    {f.unit && <small>{f.unit}</small>}
                  </p>
                  <h3>{f.label}</h3>
                  <p className="d">
                    {f.detail} <Cite src={f.src} />
                  </p>
                  <LevelTag level={f.level} />
                </div>
              </li>
            ))}
          </ul>
          <div className="rc-depth">
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
        </section>
      </div>
    </header>
  );
}

export function RefsSection({ papers, other, note }: { papers: number[]; other: Extra[]; note?: ReactNode }) {
  return (
    <section id="rc-refs" className="rc-sec rc-refs" aria-labelledby="h-refs">
      <h2 id="h-refs" className="rc-h2">
        <span>※</span>이 페이지의 근거
      </h2>
      <p className="rc-refs-note">본문의 번호를 누르면 여기로 옵니다. 학술 문헌은 DOI · PMID로 실존과 서지를 확인했습니다.</p>
      <h3>학술 문헌 {papers.length}편</h3>
      <ol className="rc-reflist">
        {papers.map((id) => {
          const r = refById(id);
          return (
            <li key={id} id={`ref-${id}`}>
              <span className="n">{id}</span>
              <div>
                <b>{r.title}</b>
                <span>
                  {r.authors} · {r.venue}
                  {r.affiliation ? ` · ${r.affiliation}` : ""}
                </span>
                {r.doi && (
                  <a href={`https://doi.org/${r.doi}`} target="_blank" rel="noopener noreferrer">
                    doi:{r.doi}
                    <span className="sr-only"> (새 창)</span>
                  </a>
                )}
                {r.extra && <em>{r.extra}</em>}
              </div>
            </li>
          );
        })}
      </ol>
      {other.length > 0 && (
        <>
          <h3>그 밖의 자료</h3>
          <ol className="rc-reflist other">
            {other.map((k) => (
              <li key={k} id={`ref-${k}`}>
                <span className="n">{extraSources[k].label}</span>
                <div>
                  <b>{extraSources[k].title}</b>
                  <span>{extraSources[k].note}</span>
                </div>
              </li>
            ))}
          </ol>
        </>
      )}
      <p className="rc-refs-note">
        {note}
        {note ? " " : ""}전체 목록은 <Link href="/references">참고문헌</Link> 페이지에 있습니다.
      </p>
    </section>
  );
}

export function NextNav({ slug }: { slug: string }) {
  const { t, prev, next } = topicNav(slug);
  return (
    <nav className="rc-next" aria-labelledby="h-next">
      <h2 id="h-next" className="rc-h2">
        <span>→</span>이어 읽기
      </h2>
      <ul>
        {t.related.map((s) => {
          const r = topicBySlug(s)!;
          return (
            <li key={s}>
              <Link href={`/topics/${s}`}>
                <span className="n">{r.no}</span>
                <b>{r.title}</b>
                <span>{r.tagline}</span>
                <span className="go" aria-hidden="true">
                  →
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
      <div className="rc-pager">
        <Link href={`/topics/${prev.slug}`}>
          <small>이전 주제</small>
          <b>
            {prev.no} {prev.title}
          </b>
        </Link>
        <Link href={`/topics/${next.slug}`}>
          <small>다음 주제</small>
          <b>
            {next.no} {next.title}
          </b>
        </Link>
      </div>
    </nav>
  );
}
