import Link from "next/link";
import { refById } from "@/data/references";
import { topicBySlug, topics } from "@/data/topics";
import { layerById } from "@/data/layers";
import Footer from "@/components/Footer";
import { DepthPillars, IconLithium, IconNine, IconRecovery } from "./Iso";
import { Cite, LevelTag } from "./Cite";
import { ProcessTable, ProductStack, RcToc, TempBars } from "./Interactive";
import { SystemMap } from "./SystemMap";
import { extraSources, facts, feas, processes, temps, type Level, type Src } from "./data";

const kpiIcon = [IconRecovery, IconLithium, IconNine];
const depth: { level: Level; what: string }[] = [
  { level: "paper", what: "동료심사를 거친 논문" },
  { level: "policy", what: "법령 · 공공기관 발표" },
  { level: "company", what: "기업 자체 발표 (외부 검증 전)" },
  { level: "judgement", what: "이 사이트의 정리 · 판단" },
];

/* 이 페이지에서 인용한 출처 전부 — 본문 인용과 목록이 어긋나지 않게 데이터에서 모은다 */
const inline: Src[] = [2, 4, 5, 8, 9, 11, 19, 14, 15, "C1", "P1", "R"];
const cited = Array.from(
  new Set<Src>([...inline, ...facts.flatMap((f) => f.src), ...temps.flatMap((t) => t.src), ...processes.flatMap((p) => p.src), ...feas.flatMap((f) => f.src)])
);
const citedPapers = (cited.filter((s) => typeof s === "number") as number[]).sort((a, b) => a - b);
const citedOther = cited.filter((s) => typeof s !== "number") as Exclude<Src, number>[];

export default function RecyclingPage() {
  const t = topicBySlug("recycling")!;
  const layer = layerById(t.layer);
  const idx = topics.findIndex((x) => x.slug === t.slug);
  const prev = topics[(idx - 1 + topics.length) % topics.length];
  const next = topics[(idx + 1) % topics.length];

  return (
    <div className="rc">
      <main id="main">
        {/* ── 머리 ── */}
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
                  <span className="rc-meta-sub">네 갈래 활용 방안 중 하나</span>
                </p>
                <h1>재활용</h1>
                <p className="rc-tag">배터리를 원소로 되돌리는 일</p>
              </div>
              <div className="rc-hero-side">
                <p className="rc-lead">
                  잔존용량 60% 미만의 배터리를 부수고 녹여 리튬 · 니켈 · 코발트 · 망간을 원소 단위로 회수합니다. 지금 산업의 표준은 습식제련이고, 연구 중인 대안은
                  공정 전체보다 특정 단계를 바꾸는 쪽에서 설득력을 얻고 있습니다.
                </p>
                <dl className="rc-facts-inline">
                  <div>
                    <dt>조사 비중</dt>
                    <dd>{t.coverage}</dd>
                  </div>
                  <div>
                    <dt>인용 문헌</dt>
                    <dd>{citedPapers.length}편 + 정책 · 기업 자료</dd>
                  </div>
                  <div>
                    <dt>기준 시점</dt>
                    <dd>2026년 9월</dd>
                  </div>
                </dl>
              </div>
            </div>

            {/* ── 요약: 숫자 세 개 (기능 카드) ── */}
            <section id="rc-summary" className="rc-summary" aria-labelledby="h-sum">
              <h2 id="h-sum" className="sr-only">
                요약 — 숫자 세 개와 그 근거
              </h2>
              <ul className="rc-kpis">
                {facts.map((f, i) => {
                  const Ico = kpiIcon[i];
                  return (
                    <li key={f.label} className="rc-kpi">
                      <div className="rc-kpi-in">
                        <Ico />
                        <p className="v">
                          {f.value}
                          <small>{f.unit}</small>
                        </p>
                        <h3>{f.label}</h3>
                        <p className="d">
                          {f.detail} <Cite src={f.src} />
                        </p>
                        <LevelTag level={f.level} />
                      </div>
                    </li>
                  );
                })}
              </ul>
              <div className="rc-depth">
                <DepthPillars />
                <div>
                  <p className="rc-depth-h">
                    근거 수준 <span>기둥이 높을수록 외부 검증을 더 거친 자료</span>
                  </p>
                  <dl>
                    {depth.map((d) => (
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

        <div className="rc-wrap rc-body">
          <RcToc />

          <div className="rc-main">
            {/* ── 1 기준 공정 ── */}
            <section id="rc-hub" className="rc-sec" aria-labelledby="h-hub">
              <h2 id="h-hub" className="rc-h2">
                <span>1</span>기준 공정 — Hub &amp; Spoke 습식제련
              </h2>
              <p>
                국내 최대 리사이클링 기업의 공정은 지리적으로 떨어진 두 단계로 나뉩니다. 해외 각지의 전처리 거점(Spoke)이 부피와 위험을 줄이고, 국내 거점(Hub)이 화학적
                정제를 맡습니다. 이 공정은 정부 출연연구기관(KIGAM)과 공동 개발됐습니다. <Cite src={[14]} />
              </p>
              <SystemMap />
              <p>
                황산 기반 침출은 습식 경로 가운데 상업적으로 확립된 유일한 방식으로 평가됩니다. <Cite src={[1]} /> 결과물은 금속마다 색이 다른 황산염 결정이고, 이 사이트의
                금속 색도 이 결정의 실제 색에서 가져왔습니다.
              </p>
              <ProductStack />
            </section>

            {/* ── 2 건식 vs 습식 ── */}
            <section id="rc-lithium" className="rc-sec" aria-labelledby="h-li">
              <h2 id="h-li" className="rc-h2">
                <span>2</span>무게로 가를까, 화학으로 가를까
              </h2>
              <p>
                건식제련은 배터리를 통째로 녹여 밀도 차이로 금속을 가릅니다. 아래층에 코발트 · 니켈 · 구리 합금이, 위층에 슬래그가 뜨는데 이때 리튬 · 알루미늄 · 망간이
                슬래그로 빠집니다. 습식제련은 녹인 뒤 화학적 성질로 가르기 때문에 느리고 단계가 많은 대신 리튬까지 건질 수 있습니다. 서로 다른 기관의 리뷰들이 같은
                진단을 내립니다. <Cite src={[2, 4]} />
              </p>

              <figure className="rc-panel rc-fork">
                <p className="rc-fig-h">리튬은 어디로 가는가</p>
                <div className="lane">
                  <p className="lane-h">
                    건식제련 <span>1,400℃ 이상</span>
                  </p>
                  <ol>
                    <li>팩 · 모듈째 투입</li>
                    <li>용융 · 유기물 연소</li>
                    <li className="split">
                      <span className="ok">
                        합금 <b>Co · Ni · Cu</b> <em>→ 습식 정제가 더 필요</em>
                      </span>
                      <span className="lost">
                        슬래그 <b>Al · Mn</b> <i className="li-mark lost">Li</i> <em>회수 어려움</em>
                      </span>
                    </li>
                  </ol>
                </div>
                <div className="lane hydro">
                  <p className="lane-h">
                    습식제련 <span>80℃ 안팎</span>
                  </p>
                  <ol>
                    <li>블랙매스</li>
                    <li>침출 · 정제</li>
                    <li className="split">
                      <span className="ok">
                        황산염 <b>Ni · Co · Mn</b>
                      </span>
                      <span className="ok">
                        리튬염 <i className="li-mark">Li</i> <em>회수</em>
                      </span>
                    </li>
                  </ol>
                </div>
                <figcaption>그림 5. 리튬은 색이 아니라 네모 표시로 추적합니다. 점선 네모는 회수되지 않는 흐름입니다.</figcaption>
              </figure>

              <TempBars />

              <aside className="rc-note" aria-label="규제 측면">
                <h3>리튬 회수가 왜 중요한가</h3>
                <p>
                  EU는 2027년까지 폐배터리 리튬의 50%를 추출하도록 요구하고, 2031년부터 신품에 리튬 재생원료 6%를 넣도록 합니다. 리튬을 회수하지 못하는 공정은
                  규제에 대응할 수 없습니다. <Cite src={["P1"]} />
                </p>
              </aside>
            </section>

            {/* ── 3 공정 9종 ── */}
            <section id="rc-nine" className="rc-sec" aria-labelledby="h-nine">
              <h2 id="h-nine" className="rc-h2">
                <span>3</span>재활용 공정 9종
              </h2>
              <p>
                직접재생은 분해해서 원료를 되찾는 대신 분해하지 않고 고칩니다. 충방전으로 빠져나간 리튬의 빈자리만 다시 채우므로 결정 구조가 한 번도 해체되지 않습니다.
                <Cite src={[8, 9, 19]} /> 바이오리칭은 황을 먹고 황산을 내놓는 세균에게 산 생산을 맡깁니다. 가장 낮은 온도, 가장 적은 화학물질 구매, 가장 긴 시간이
                특징입니다. <Cite src={[11]} />
              </p>
              <ProcessTable />
            </section>

            {/* ── 4 이론적 대안 ── */}
            <section id="rc-feas" className="rc-sec" aria-labelledby="h-feas">
              <h2 id="h-feas" className="rc-h2">
                <span>4</span>이론적 대안은 어디까지 왔나
              </h2>
              <p>
                다섯 대안 중 어느 것도 습식제련을 통째로 대체할 근거는 부족합니다. 반면 특정 단계를 떼어 내 바꾸는 방향으로는 설득력이 있습니다. 기계화학은 침출 단계를,
                초임계 CO₂는 열처리로 하던 전해액 처리를 대신할 수 있습니다.
              </p>
              <figure className="rc-panel">
                <div className="rc-table-wrap" tabIndex={0} role="region" aria-label="이론적 대안의 실현 가능성 표">
                  <table className="rc-table rc-feas">
                    <caption className="sr-only">이론적 대안 여섯 가지의 실현 가능성 — 조사자 판단</caption>
                    <thead>
                      <tr>
                        <th scope="col">접근</th>
                        <th scope="col">실현 가능성</th>
                        <th scope="col">현실적 위치</th>
                        <th scope="col">문헌</th>
                      </tr>
                    </thead>
                    <tbody>
                      {feas.map((r) => (
                        <tr key={r.n}>
                          <th scope="row">{r.n}</th>
                          <td>
                            <span className="meter" role="img" aria-label={`4단계 중 ${r.g}단계, ${r.gl}`}>
                              {[1, 2, 3, 4].map((i) => (
                                <i key={i} className={i <= r.g ? "on" : ""} />
                              ))}
                            </span>
                            <b className="gl">{r.gl}</b>
                          </td>
                          <td>
                            <b>{r.role}</b>
                            <span className="why">{r.why}</span>
                          </td>
                          <td>
                            <Cite src={r.src} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <figcaption>
                  그림 6. <LevelTag level="judgement" /> 등급은 문헌 서술을 근거로 한 조사자 판단이며 표준 기술성숙도(TRL) 평가가 아닙니다. 인용된 성능 수치 대부분은 단일 조성
                  시료의 실험실 값입니다. <Cite src={["R"]} />
                </figcaption>
              </figure>
            </section>

            {/* ── 근거 문헌 ── */}
            <section id="rc-refs" className="rc-sec rc-refs" aria-labelledby="h-refs">
              <h2 id="h-refs" className="rc-h2">
                <span>※</span>이 페이지의 근거
              </h2>
              <p className="rc-refs-note">본문의 번호를 누르면 여기로 옵니다. 학술 문헌은 DOI · PMID로 실존과 서지를 확인했습니다.</p>
              <h3>학술 문헌 {citedPapers.length}편</h3>
              <ol className="rc-reflist">
                {citedPapers.map((id) => {
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
              <h3>그 밖의 자료</h3>
              <ol className="rc-reflist other">
                {citedOther.map((k) => (
                  <li key={k} id={`ref-${k}`}>
                    <span className="n">{k === "P1" ? "정책" : k === "C1" ? "기업" : "보고서"}</span>
                    <div>
                      <b>{extraSources[k].title}</b>
                      <span>{extraSources[k].note}</span>
                    </div>
                  </li>
                ))}
              </ol>
              <p className="rc-refs-note">
                바뀐 점 — 기존 페이지의 &ldquo;세계 상위 양산 업체 5곳 중 4곳이 습식 채택&rdquo;은 출처 문헌을 확인할 수 없어 이 판에서 뺐습니다. 전체 목록은{" "}
                <Link href="/references">참고문헌</Link> 페이지에 있습니다.
              </p>
            </section>

            {/* ── 이어 읽기 ── */}
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
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
