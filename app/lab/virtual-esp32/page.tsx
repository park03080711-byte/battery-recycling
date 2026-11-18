import type { Metadata } from "next";
import Link from "next/link";
import Footer from "@/components/Footer";
import { SimLab } from "@/components/lab/sim/SimLab";
import { SimValidation } from "@/components/lab/sim/SimValidation";
import { MODEL } from "@/components/lab/sim/engine";
import "../lab.css";
import "../sim.css";

export const metadata: Metadata = {
  title: "가상 ESP32 실험대",
  description: "LAB 01 실측으로 맞춘 가상 ESP32에서 부품과 핀, 환경, 판정 규칙을 바꿔 가며 셀 과열 감지 · 차단을 직접 돌려 봅니다.",
  openGraph: {
    type: "website",
    locale: "ko_KR",
    siteName: "RE:CELL 14",
    title: "가상 ESP32 실험대 | RE:CELL 14 실험실",
    description: "부품을 빼고, 핀을 바꾸고, 방을 데우고, 센서를 고장 내 보세요. 실측으로 맞춘 가상 ESP32가 판정하고 성적표를 냅니다.",
  },
  twitter: { card: "summary_large_image" },
};

export default function VirtualEspPage() {
  return (
    <div className="rc lab">
      <main id="main">
        <header className="rc-head sim-head">
          <div className="rc-wrap">
            <nav className="rc-crumb" aria-label="현재 위치">
              <ol>
                <li>
                  <Link href="/">홈</Link>
                </li>
                <li>
                  <Link href="/lab">실험실</Link>
                </li>
                <li aria-current="page">가상 ESP32</li>
              </ol>
            </nav>
            <div className="rc-title sim-title">
              <p className="rc-meta">
                <span className="rc-chip">
                  <b>LAB 02</b> 모의실험
                </span>
                <span className="rc-meta-sub">부품 16종 · 환경 8가지 · 규칙 카드 16장 · 시험 도구</span>
              </p>
              <h1>가상 ESP32 실험대</h1>
              <p className="rc-tag">부품을 바꿔 꽂고, 환경을 바꾸고, 판정을 직접 돌려 본다</p>
              <p className="rc-lead">
                <Link href="/lab/ess-monitoring">LAB 01</Link>에서 잰 값으로 맞춘 가상 장치예요. 센서를 빼거나 핀을 잘못 꽂거나 방을 데워 보면서, 어떤 조합이 셀을 제때 지키고 어떤 조합이 놓치거나 잘못 울리는지 성적표로
                확인해 보세요.
              </p>
              <ol className="sim-steps" aria-label="하는 순서">
                <li>
                  <b>1</b> 환경 고르기
                </li>
                <li>
                  <b>2</b> 부품 · 핀 정하기
                </li>
                <li>
                  <b>3</b> 판정 규칙 손보기
                </li>
                <li>
                  <b>4</b> 실행 → 성적표
                </li>
              </ol>
            </div>
          </div>
        </header>

        <section className="rc-wrap sim-wrap" aria-label="가상 실험대">
          <SimLab />
        </section>

        <div className="rc-wrap sim-below">
          <section className="rc-sec" aria-labelledby="h-how">
            <h2 id="h-how" className="rc-h2">
              <span>1</span>어떻게 계산하나
              <em className="lab-h2sub">세상 · 센서 · 펌웨어를 따로</em>
            </h2>
            <ol className="sim-layers">
              <li>
                <b>환경 모델</b>
                <span>
                  방 온도, 셀 온도, 전류, 전압의 실제 값. 셀은 히터를 켜면 최종 +{MODEL.K} °C까지 시간상수 {MODEL.tauHeat}초로 오르고, 끄면 {MODEL.tauCool}초로 식어요. 모두 LAB 01 기록에서
                  맞춘 값이에요.
                </span>
              </li>
              <li>
                <b>센서 모델</b>
                <span>
                  같은 실제 값을 센서마다 다르게 읽어요. DS18B20은 0.125 °C 단위, NTC는 아날로그 잡음, 션트는 0점 근처를 0으로. 접촉 불량이면 셀 온도를 {Math.round(MODEL.contactGain * 100)}
                  %만, {MODEL.contactTau}초 늦게 느껴요(LAB 01 발열 2회와 비슷). 키트 부품은 데이터시트대로: DHT11은 1초에 한 번 1 °C 단위, 온도 스위치는 {MODEL.tauMod}초 늦게, 인체감지는 켠 직후 헛신호.
                </span>
              </li>
              <li>
                <b>가상 펌웨어</b>
                <span>LAB 01 펌웨어의 판정 부분을 그대로 옮겼어요. 0.5초마다 측정 → 평활 → ΔT · 기울기 · 예측 → 4단계 판정 → LED · 릴레이. 시리얼 모니터의 글도 같은 형식이에요.</span>
              </li>
              <li>
                <b>관제 통신</b>
                <span>
                  1초마다 PC로 기록을 보내고, 끊기면 버퍼에 쌓았다가 0.1초마다 5개씩 다시 보내요(LAB 01 펌웨어). 지연은 LAB 01 통신 실험에서 연결이 이어져 있던 동안 잰 왕복 지연 435개(99 %가 87 ms 이내, 가장 늦은 것 336 ms)에서 뽑아요. 실측에서 밀린 기록 131개가 2.6초 만에 모두 도착했는데, 같은
                  속도(초당 50개)예요.
                </span>
              </li>
            </ol>
            <div className="sim-evkey">
              <span className="sim-ev ev-실측">실측</span>
              <span>LAB 01에서 직접 잰 값으로 맞춘 부품</span>
              <span className="sim-ev ev-데이터시트">데이터시트</span>
              <span>제조사 자료 기반 (1-2에서 키트 부품과 함께)</span>
              <span className="sim-ev ev-가정">가정</span>
              <span>근거가 약해 가정한 값 (쓰면 그렇다고 표시)</span>
            </div>
          </section>

          <section className="rc-sec" aria-labelledby="h-valid">
            <h2 id="h-valid" className="rc-h2">
              <span>2</span>얼마나 맞나
              <em className="lab-h2sub">기본 환경 vs 실측</em>
            </h2>
            <p>기본 환경(셀 내부 발열)을 아무것도 바꾸지 않고 돌린 결과를 LAB 01 판정 실험 2회차와 겹쳐 봤어요.</p>
            <figure className="rc-panel">
              <SimValidation />
            </figure>
          </section>

          <section className="rc-sec" aria-labelledby="h-limit">
            <h2 id="h-limit" className="rc-h2">
              <span>3</span>한계
            </h2>
            <ul className="lab-limits">
              <li>
                <b>축소 모형의 열</b>
                <span>실제 리튬이온 셀이 아니라 220 Ω 저항이 6 °C쯤 데워지는 모형이에요. 열폭주처럼 급격한 변화는 담지 않았어요.</span>
              </li>
              <li>
                <b>환경은 단순화 · 일부 가정</b>
                <span>사건은 정해진 시각에 일정하게 일어나요. 팬이 멈추면 셀이 {MODEL.fanLoss}배 더 데워진다는 값과 충격 · 단락의 크기는 실측이 아니라 가정이에요.</span>
              </li>
              <li>
                <b>3D 배선은 기본 핀</b>
                <span>핀을 바꿔도 3D의 선은 기본 배선 그대로예요. 키트 부품은 신호선만 그렸고 전원선(3.3 V · GND)은 생략했어요. 바뀐 핀은 코드 탭과 검사 결과로 확인하세요.</span>
              </li>
              <li>
                <b>잡음은 고정</b>
                <span>공정하게 비교하도록 매번 같은 잡음을 써요. 실제로는 실행마다 몇 초씩 달라질 수 있어요.</span>
              </li>
            </ul>
            <div className="sf-links sim-links">
              <Link className="sf-link" href="/lab/ess-monitoring">
                <b>LAB 01</b>
                <span>
                  <strong>ESS 상태진단 실험</strong>이 모의실험의 바탕이 된 실측 기록
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
