"use client";

import { useEffect, useMemo, useState } from "react";
import { ProductStackArt } from "./Iso";
import { Cite } from "./Cite";
import { processes, products, temps, toc, type Stage } from "./data";

/* ── 옆 목차: 지금 읽는 부분을 표시 (IntersectionObserver + aria-current) ── */
export function RcToc() {
  const [cur, setCur] = useState(toc[0].id);
  useEffect(() => {
    const els = toc.map((t) => document.getElementById(t.id)).filter(Boolean) as HTMLElement[];
    const io = new IntersectionObserver(
      (es) => es.forEach((e) => e.isIntersecting && setCur(e.target.id)),
      { rootMargin: "-40% 0px -55% 0px" }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
  return (
    <nav className="rc-toc" aria-label="이 페이지 목차">
      <p className="rc-toc-h">이 페이지</p>
      <ol>
        {toc.map((t, i) => (
          <li key={t.id}>
            <a href={`#${t.id}`} aria-current={cur === t.id ? "true" : undefined}>
              <span aria-hidden="true">{i === 0 ? "—" : i === toc.length - 1 ? "※" : i}</span>
              {t.label}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}

/* ── 산출물 적층: 목록을 고르면 해당 층이 드러난다 (가리키는 영역은 움직이지 않음) ── */
export function ProductStack() {
  const [on, setOn] = useState<number | null>(null);
  return (
    <figure className="rc-panel rc-stack">
      <ProductStackArt items={products} on={on} />
      <ol className="rc-stack-list" reversed>
        {[...products].reverse().map((p) => {
          const i = products.indexOf(p);
          return (
            <li key={p.f} onMouseEnter={() => setOn(i)} onMouseLeave={() => setOn(null)}>
              <i style={{ background: p.fill, borderColor: p.stroke }} aria-hidden="true" />
              <div>
                <b>{p.n}</b> <span className="f">{p.f}</span>
                <span className="u">{p.use}</span>
              </div>
            </li>
          );
        })}
      </ol>
      <figcaption>그림 2. 습식제련의 최종 산출물 네 가지. 층의 색은 각 결정의 실제 색이고, 이 사이트의 금속 색도 여기서 가져왔습니다.</figcaption>
    </figure>
  );
}

/* ── 공정별 운전 온도: 같은 선형 축 위 막대 ── */
export function TempBars() {
  const [sel, setSel] = useState("pyro");
  const cur = temps.find((t) => t.key === sel)!;
  return (
    <figure className="rc-panel">
      <p className="rc-fig-h">공정별 운전 온도 — 같은 축(0~1,400℃, 선형)</p>
      <ul className="rc-temp">
        {temps.map((t) => (
          <li key={t.key}>
            <button type="button" aria-pressed={sel === t.key} onClick={() => setSel(t.key)}>
              <span className="nm">{t.label}</span>
              <span className="track" aria-hidden="true">
                <i style={{ width: `${Math.max((t.v / 1400) * 100, 1.2)}%` }} />
              </span>
              <span className="val">{t.t}</span>
            </button>
          </li>
        ))}
      </ul>
      <div className="rc-temp-detail" aria-live="polite">
        <b>
          {cur.label} · {cur.t}
        </b>{" "}
        {cur.why} <Cite src={cur.src} />
      </div>
      <figcaption>그림 3. 막대를 누르면 그 온도여야 하는 이유가 나옵니다. 1,400℃는 80℃의 17.5배입니다. 온도는 바탕 보고서의 정리값입니다.</figcaption>
    </figure>
  );
}

/* ── 공정 9종 색인표 + 단계 필터 ── */
const filters: { key: "all" | "com" | "res"; label: string; test: (s: Stage) => boolean }[] = [
  { key: "all", label: "전체", test: () => true },
  { key: "com", label: "상용 · 준상용", test: (s) => s !== "연구" },
  { key: "res", label: "연구 단계", test: (s) => s === "연구" },
];

export function ProcessTable() {
  const [f, setF] = useState<(typeof filters)[number]["key"]>("all");
  const rows = useMemo(() => processes.filter((p) => filters.find((x) => x.key === f)!.test(p.stage)), [f]);
  return (
    <figure className="rc-panel">
      <div className="rc-filter" role="group" aria-label="단계로 거르기">
        {filters.map((x) => (
          <button key={x.key} type="button" aria-pressed={f === x.key} onClick={() => setF(x.key)}>
            {x.label}
            <span>{processes.filter((p) => x.test(p.stage)).length}</span>
          </button>
        ))}
      </div>
      <div className="rc-table-wrap" tabIndex={0} role="region" aria-label="재활용 공정 9종 표">
        <table className="rc-table">
          <caption className="sr-only">재활용 공정 {rows.length}종 — 단계, 원리, 세부 변형 수, 대표 문헌</caption>
          <thead>
            <tr>
              <th scope="col">단계</th>
              <th scope="col">공정</th>
              <th scope="col">원리</th>
              <th scope="col" className="num">
                변형
              </th>
              <th scope="col">문헌</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => (
              <tr key={p.name} className={p.stage === "연구" ? "is-res" : undefined}>
                <td>
                  <span className={`rc-stage st-${p.stage === "연구" ? "r" : "c"}`}>{p.stage}</span>
                </td>
                <th scope="row">
                  {p.name}
                  <small>{p.en}</small>
                </th>
                <td>{p.how}</td>
                <td className="num">{p.v}</td>
                <td>
                  <Cite src={p.src} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <figcaption>그림 4. 세부 변형을 모두 세면 14가지입니다. 건식 + 습식 결합 공정을 따로 세면 10가지가 됩니다. 분류는 이 사이트의 정리입니다.</figcaption>
    </figure>
  );
}
