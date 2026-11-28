import type { Metadata } from "next";
import Link from "next/link";
import { readFileSync } from "node:fs";
import path from "node:path";
import Footer from "@/components/Footer";
import { ControlRoom } from "@/components/lab/control/ControlRoom";
import { buildRun, parseCsv, reach, RULE } from "@/components/lab/control/engine";
import { PRESETS } from "@/components/lab/control/presets";
import "../lab.css";
import "./control.css";

export const metadata: Metadata = {
  title: "관제실",
  description: "LAB 01 통신 실험 기록이나 LAB 02 가상 실험 결과를 PC가 받은 순서 그대로 틀어, ESP32의 판정 · 차단과 Wi-Fi 끊김을 관제 화면에서 지켜봅니다.",
  openGraph: {
    type: "website",
    locale: "ko_KR",
    siteName: "RE:CELL 14",
    title: "관제실 | RE:CELL 14 실험실",
    description: "히터가 켜지고 주의 → 경고 → 위험 · 차단, 그리고 Wi-Fi가 끊겼다 밀린 기록이 한꺼번에 들어오는 장면을 실측 기록 그대로 재생합니다.",
  },
  twitter: { card: "summary_large_image" },
};

/* 빌드 때 한 번 읽어 숫자 묶음으로 넘긴다 (화면에서 CSV를 다시 받지 않음) */
const rows = parseCsv(readFileSync(path.join(process.cwd(), "public/lab/comm_run1.csv"), "utf8"));
const run = buildRun(rows);
const steps = reach(run);
const at = (k: string) => steps.find((s) => s.k === k);
const sec = (k: string) => {
  const s = at(k);
  return s ? (s.ev.es - s.from.es).toFixed(1) : "—";
};
const gapS = run.gap ? Math.round(run.gap.to - run.gap.from) : 0;
const wifiLate = run.late.find((l) => l.kind === "wifi")?.n ?? 0;
const resent = run.pkts.filter((p) => p.tx > 1).length;
const dups = run.pkts.filter((p) => p.dup).length;

export default function ControlRoomPage() {
  return (
    <div className="rc lab">
      <main id="main">
        <header className="rc-head cr-head">
          <div className="rc-wrap">
            <nav className="rc-crumb" aria-label="현재 위치">
              <ol>
                <li>
                  <Link href="/">홈</Link>
                </li>
                <li>
                  <Link href="/lab">실험실</Link>
                </li>
                <li aria-current="page">관제실</li>
              </ol>
            </nav>
            <div className="rc-hero">
              <div className="rc-title">
                <p className="rc-meta">
                  <span className="rc-chip">
                    <b>LAB 03</b> 실측 기록 재생
                  </span>
                  <span className="rc-meta-sub">
                    실측 기록 {run.total}개 · 끊김 {gapS}초 · 모의 시나리오 {PRESETS.length}가지
                  </span>
                </p>
                <h1>관제실</h1>
                <p className="rc-tag">장치가 보낸 기록을 관제 화면에서 받아 본다</p>
              </div>
              <div className="rc-hero-side">
              <p className="rc-lead">
                <Link href="/lab/ess-monitoring">LAB 01</Link> 통신 실험 기록을 PC가 받은 순서 그대로 다시 틉니다. 히터가 켜지고 주의 → 경고 → 위험 · 차단으로 가는 과정과, Wi-Fi가 끊겼다가 밀린 기록이 한꺼번에 들어오는 장면을
                볼 수 있어요. <Link href="/lab/virtual-esp32">LAB 02</Link> 가상 실험 결과도 같은 화면에서 틀어 실측으로 못 해 본 경우를 확인할 수 있어요.
              </p>
              </div>
            </div>
          </div>
        </header>

        <div className="rc-wrap cr-wrap">
          <ControlRoom rows={rows} />
        </div>

        <div className="rc-wrap cr-below">
          <section className="rc-sec" aria-labelledby="h-read">
            <h2 id="h-read" className="rc-h2">
              <span>1</span>화면 읽는 법
              <em className="lab-h2sub">값 · 시계 · 통신을 한 화면에</em>
            </h2>
            <ol className="cr-how">
              <li>
                <b>설비 계통도 · 신호 경로</b>
                <span>
                  계통도는 함체 안 부품(셀 · 센서 · 션트 · 릴레이)과 ESP32 → PC → 관제실을 한 장에 그려요. 평소에는 잉크색이고, 이상이 생긴 부품만 단계 색으로 바뀌어요. 키트 센서는 모의 실험에서 꽂았을 때만 나타나요. ESP32는 1초마다 기록 한 개를 UDP로 보내고, PC가 받은 순번마다 확인(ACK)을 돌려줘요. 1초 안에 확인이 없으면 다시 보내요. 이번 기록에서 재전송으로 도착한 것이 {resent}개, 두 번 와서 버린 것이 {dups}개예요.
                </span>
              </li>
              <li>
                <b>판정은 장치가</b>
                <span>
                  단계와 차단은 PC가 아니라 ESP32가 정해요. 관제실은 받은 결과를 보여 줄 뿐이고, 통신이 끊겨도 판정 · 차단은 장치 안에서 계속 돌아요. 이번 기록에서는 히터를 켜고 주의까지 {sec("주의")}초, 경고까지 {sec("경고")}초, 위험 · 차단까지{" "}
                  {sec("위험 · 차단")}초 걸렸어요.
                </span>
              </li>
              <li>
                <b>시계가 두 개</b>
                <span>
                  재생은 PC가 받은 시각으로 흘러가고, 그래프 가로축은 ESP32가 잰 시각이에요. 수신 프로그램을 켜기 전에 쌓인 기록 {run.boot?.n ?? 0}개는 첫 2.6초 만에 들어오고, Wi-Fi가 {gapS}초 끊긴 동안 쌓인 {wifiLate}개는 다시 연결되자마자
                  한꺼번에 들어와요. 그래서 그래프가 순간적으로 확 늘어나요.
                </span>
              </li>
            </ol>
          </section>

          <section className="rc-sec" aria-labelledby="h-rule">
            <h2 id="h-rule" className="rc-h2">
              <span>2</span>판정 기준
              <em className="lab-h2sub">펌웨어 ess_stage3 그대로</em>
            </h2>
            <div className="rc-table-wrap rc-panel">
              <table className="rc-table cr-rules">
                <thead>
                  <tr>
                    <th scope="col">항목</th>
                    <th scope="col">주의</th>
                    <th scope="col">경고</th>
                    <th scope="col">위험</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <th scope="row">온도차 ΔT</th>
                    <td>≥ {RULE.dt[0].toFixed(1)} °C</td>
                    <td>≥ {RULE.dt[1].toFixed(1)} °C</td>
                    <td>≥ {RULE.dt[2].toFixed(1)} °C · 히터 차단</td>
                  </tr>
                  <tr>
                    <th scope="row">상승 속도</th>
                    <td>
                      ≥ {RULE.slope} °C/s, {RULE.slopeHoldS}초
                    </td>
                    <td>
                      ΔT ≥ 2 °C에서 위험까지 {RULE.etaS}초 미만 예측
                    </td>
                    <td>—</td>
                  </tr>
                  <tr>
                    <th scope="row">전류</th>
                    <td>≥ {RULE.mA[0]} mA</td>
                    <td>≥ {RULE.mA[1]} mA</td>
                    <td>≥ {RULE.mA[2]} mA</td>
                  </tr>
                  <tr>
                    <th scope="row">전압 (5 V 버스)</th>
                    <td>&lt; {(RULE.mV.caution / 1000).toFixed(2)} V</td>
                    <td>
                      &lt; {(RULE.mV.warnLow / 1000).toFixed(2)} V 또는 &gt; {(RULE.mV.warnHigh / 1000).toFixed(2)} V
                    </td>
                    <td>—</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="lab-small">
              올릴 때는 1초 연속, 내릴 때는 5초 연속 확인하고 한 단계씩만 내려요. 내려갈 때는 기준보다 {RULE.hyst} °C 더 내려가야 해요. 위험지수는 온도차 {Math.round(RULE.weights.T * 100)} · 상승 속도 {Math.round(RULE.weights.S * 100)} · 전류{" "}
              {Math.round(RULE.weights.I * 100)} · 전압 {Math.round(RULE.weights.V * 100)}의 가중합(AHP)이에요.
            </p>
          </section>

          <section className="rc-sec" aria-labelledby="h-limit">
            <h2 id="h-limit" className="rc-h2">
              <span>3</span>한계
            </h2>
            <ul className="lab-limits">
              <li>
                <b>실시간이 아니라 재생</b>
                <span>지금 장치와 연결된 화면이 아니에요. 실측은 2026년 11월 14일에 PC가 받은 기록을, 모의는 가상 장치가 계산한 결과를 받은 순서와 간격 그대로 트는 것이에요.</span>
              </li>
              <li>
                <b>모의 실험은 모형</b>
                <span>LAB 01 실측으로 맞춘 가상 장치라 비슷하게 움직이지만 실제 기록은 아니에요. 화면 위 이름표가 ‘LAB 02 모의’로 바뀌고, 범례도 ‘모의’로 표시돼요.</span>
              </li>
              <li>
                <b>통신 실험은 1회</b>
                <span>끊김도 한 번(약 {gapS}초)뿐이에요. 버퍼를 넘쳐 오래된 기록이 버려지는 경우는 실측하지 않았고, 모의 실험의 ‘버퍼 10개’ 시나리오로만 보여 줘요.</span>
              </li>
              <li>
                <b>버퍼 개수는 추정</b>
                <span>끊긴 동안 ESP32 버퍼에 쌓인 수는 기록이 없어서, 1초에 1개씩 쌓인다고 보고 끊긴 시간으로 셈해요.</span>
              </li>
              <li>
                <b>알림은 이 탭이 열려 있을 때만</b>
                <span>서버에서 보내는 푸시가 아니라 브라우저 안 알림이에요. 탭을 닫으면 오지 않고, 휴대폰 브라우저는 페이지 알림을 막는 경우가 많아요.</span>
              </li>
            </ul>
            <div className="sf-links">
              <Link className="sf-link" href="/lab/ess-monitoring">
                <b>LAB 01</b>
                <span>
                  <strong>ESS 상태진단 실험</strong>이 화면이 재생하는 원래 실측 기록
                </span>
              </Link>
              <Link className="sf-link" href="/lab/virtual-esp32">
                <b>LAB 02</b>
                <span>
                  <strong>가상 ESP32 실험대</strong>부품 · 환경을 바꿔 판정을 직접 돌려 보기
                </span>
              </Link>
              <Link className="sf-link" href="/topics/safety">
                <b>06</b>
                <span>
                  <strong>안전 관리</strong>열폭주가 번지는 과정
                </span>
              </Link>
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
