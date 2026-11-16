import type { Metadata } from "next";
import Link from "next/link";
import Footer from "@/components/Footer";
import "./lab.css";

export const metadata: Metadata = {
  title: "실험실",
  description: "조사한 기술을 작은 장치로 직접 재 본 실측 기록과 모의실험을 모았습니다.",
  openGraph: {
    type: "website",
    locale: "ko_KR",
    siteName: "RE:CELL 14",
    title: "실험실 | RE:CELL 14",
    description: "조사한 기술을 작은 장치로 직접 재 본 실측 기록과 모의실험을 모았습니다.",
  },
  twitter: { card: "summary_large_image" },
};

export default function LabHub() {
  return (
    <div className="rc lab">
      <main id="main">
        <header className="rc-head">
          <div className="rc-wrap">
            <nav className="rc-crumb" aria-label="현재 위치">
              <ol>
                <li>
                  <Link href="/">홈</Link>
                </li>
                <li aria-current="page">실험실</li>
              </ol>
            </nav>
            <div className="rc-hero">
              <div className="rc-title">
                <p className="rc-meta">
                  <span className="rc-chip">
                    <b>LAB</b> 직접 재 본 기록
                  </span>
                </p>
                <h1>실험실</h1>
                <p className="rc-tag">읽은 것을 손으로 확인하는 곳</p>
              </div>
              <div className="rc-hero-side">
                <p className="rc-lead">
                  문헌으로 조사한 기술 가운데 작은 장치로 확인할 수 있는 것을 골라 직접 실험했습니다. 실측 기록은 원자료와 함께 올리고, 조건이 어긋난 회차와 한계도 그대로 적습니다.
                </p>
              </div>
            </div>
          </div>
        </header>

        <div className="rc-wrap lab-hub">
          <ul className="lab-hub-list">
            <li>
              <Link href="/lab/ess-monitoring" className="lab-hub-card has-thumb">
                <img className="lab-hub-thumb" src="/lab/ess-run-poster.webp" width={720} height={1280} alt="" decoding="async" />
                <span className="lab-hub-no">LAB 01</span>
                <span className="lab-tag">
                  <i aria-hidden="true" />
                  실측 · 2026년 11월
                </span>
                <b>ESS 상태진단 실험</b>
                <span>저항을 데워 셀 과열을 흉내 내고, ESP32가 이를 감지 · 예측해 경보하고 스스로 전원을 끊는지 재 봤습니다.</span>
                <dl className="lab-hub-nums">
                  <div>
                    <dt>첫 경보</dt>
                    <dd>11초</dd>
                  </div>
                  <div>
                    <dt>자동 차단</dt>
                    <dd>65초</dd>
                  </div>
                  <div>
                    <dt>패킷 전달</dt>
                    <dd>616/616</dd>
                  </div>
                </dl>
                <span className="go" aria-hidden="true">
                  기록 보기 →
                </span>
              </Link>
            </li>
            <li>
              <Link href="/lab/virtual-esp32" className="lab-hub-card">
                <span className="lab-hub-no">LAB 02</span>
                <span className="lab-tag">
                  <i aria-hidden="true" />
                  모의실험 · 1차 공개
                </span>
                <b>가상 ESP32 실험대</b>
                <span>LAB 01 실측으로 맞춘 가상 장치예요. 부품을 빼고, 핀을 바꾸고, 방을 데우고, 센서를 고장 내 보며 판정을 직접 돌려 볼 수 있어요.</span>
                <dl className="lab-hub-nums">
                  <div>
                    <dt>부품</dt>
                    <dd>6종</dd>
                  </div>
                  <div>
                    <dt>환경</dt>
                    <dd>3가지</dd>
                  </div>
                  <div>
                    <dt>규칙 카드</dt>
                    <dd>7장</dd>
                  </div>
                </dl>
                <span className="go" aria-hidden="true">
                  실험대 열기 →
                </span>
              </Link>
            </li>
          </ul>
        </div>
      </main>
      <Footer />
    </div>
  );
}
