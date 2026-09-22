import type { Metadata } from "next";
import { refGroups, references } from "@/data/references";
import SubVisual from "@/components/sub/SubVisual";
import RefList from "@/components/sub/RefList";
import Footer from "@/components/Footer";

export const metadata: Metadata = { title: "참고문헌" };

const policy = [
  ["EU 배터리 규정", "재생원료 의무 사용 비율, 금속 추출률, 재활용 효율 목표, 탄소발자국 신고, 공급망 실사, 배터리 여권", "KOTRA 해설자료 및 언론 보도"],
  ["사용후배터리법", "2026년 5월 국무회의 의결, 공포 후 1년 시행 · 전주기 이력관리, 재생원료 인증제, 탈거 전 성능평가", "정부 발표 및 언론 보도"],
  ["재생원료 인증 시범사업", "2026년 6월, 재활용 기업 6곳 · 한국환경공단 협약", "정부 부처 발표"],
  ["발생량 전망", "2023년 2,355개 → 2030년 10만 7,500개", "환경 당국 추정치"],
  ["세계 시장", "2040년 전기차 폐차 4,227만 대, 시장 2,000억 달러 이상", "정부 정책자료 인용 추산치"],
];

export default function ReferencesPage() {
  return (
    <>
      <main id="main">
      <SubVisual
        layer="neutral"
        seed={77}
        en="REFERENCES"
        big="참고문헌"
        crumbs={[
          {
            label: "참고문헌",
            options: [
              { href: "/about", label: "사이트 소개" },
              { href: "/topics", label: "주제 한눈에" },
              { href: "/references", label: "참고문헌", current: true },
            ],
          },
          { label: "분류 선택", options: refGroups.map((g) => ({ href: `/references#${g.id}`, label: g.title })) },
        ]}
      />
      <div className="container">
        <header className="page-title">
          <h1>검증된 문헌 49편</h1>
          <p className="tagline">DOI · PMID · PMCID 또는 KCI 등재번호를 개별 조회해 서지사항을 대조했습니다.</p>
        </header>

        <div className="intro-box ref-stats">
          {refGroups.map((g) => (
            <a key={g.id} href={`#${g.id}`} style={{ display: "block" }}>
              <b style={{ display: "block", fontSize: "var(--fs-2xl)", color: "var(--blue)", fontWeight: 800, lineHeight: 1.2 }}>
                {references.filter((r) => r.group === g.id).length}
              </b>
              <span style={{ fontSize: "var(--fs-sm)", fontWeight: 600 }}>{g.title}</span>
            </a>
          ))}
        </div>

        {refGroups.map((g) => (
          <section key={g.id} id={g.id} className="ref-group" style={{ scrollMarginTop: 120 }}>
            <h2>
              {g.title} <span style={{ color: "var(--muted)", fontWeight: 600, fontSize: "var(--fs-sm)" }}>{references.filter((r) => r.group === g.id).length}편</span>
            </h2>
            <RefList refs={references.filter((r) => r.group === g.id)} />
          </section>
        ))}

        <section className="ref-group">
          <h2>정책 자료</h2>
          <p style={{ margin: "16px 0", fontSize: "var(--fs-sm)", color: "var(--muted)" }}>
            아래 자료는 학술 문헌이 아니라 공공기관 발표와 언론 보도입니다. 제도는 개정될 수 있으므로 인용 시점의 최신 내용을 다시 확인해야 합니다.
          </p>
          <div className="table-wrap" tabIndex={0} role="region" aria-label="표">
            <table>
              <thead>
                <tr>
                  <th scope="col">구분</th>
                  <th scope="col">내용</th>
                  <th scope="col">출처 성격</th>
                </tr>
              </thead>
              <tbody>
                {policy.map((p) => (
                  <tr key={p[0]}>
                    {p.map((c, i) => (
                      <td key={i} style={i === 0 ? { fontWeight: 700, color: "var(--ink)", whiteSpace: "nowrap" } : undefined}>
                        {c}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="ref-group">
          <h2>검증 방법과 한계</h2>
          <ul className="bullets" style={{ marginTop: 16, fontSize: "var(--fs-sm)" }}>
            <li>49편 전부 실존 확인, 서지 오류 0건. 36~41번은 재제조, 42~44번은 재사용, 45~49번은 업사이클링 페이지 보강 때(2026년 9월) 추가했습니다. 다만 재사용 · 재제조 문헌 1편([23])은 동료심사를 거치지 않은 프리프린트입니다.</li>
            <li>국제 저널 다수는 전문 접근이 제공되지 않아 요약 내용은 초록 수준에 근거합니다. 상세 실험 조건과 그래프 수치는 원문 확인이 필요합니다.</li>
            <li>신기술 성능 수치는 대부분 단일 조성의 정제된 시료에서 얻은 실험실 값입니다. 실현 가능성 등급은 문헌 서술에 근거한 판단이며 TRL 평가가 아닙니다.</li>
            <li>기업 공정 설명은 기업이 공개한 정보이며, 회수율 95%와 CO₂ 70% 절감은 기업 자체 발표 기준입니다.</li>
            <li>[15]의 공저자 표기가 출처마다 &quot;김중&quot;과 &quot;김범중&quot;으로 엇갈리며, KCI BibTeX 원본 기준으로 김범중이 맞습니다.</li>
          </ul>
        </section>
        <div style={{ height: 96 }} />
      </div>
      </main>
      <Footer />
    </>
  );
}
