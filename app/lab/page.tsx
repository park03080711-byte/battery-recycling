import type { Metadata } from "next";
import Link from "next/link";
import Footer from "@/components/Footer";
import "./lab.css";

export const metadata: Metadata = {
  title: "실험실",
  description: "조사한 기술을 작은 장치로 직접 재 본 실측 기록과 모의실험을 모았습니다.",
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
              <Link href="/lab/ess-monitoring" className="lab-hub-card">
                <span className="lab-hub-no">LAB 01</span>
                <span className="lab-tag">
                  <i aria-hidden="true" />
                  실측 · 2026년 11월
                </span>
                <b>ESS 상태진단 실험</b>
                <span>저항을 데워 셀 과열을 흉내 내고, ESP32가 이를 감지 · 예측해 경보하고 스스로 전원을 끊는지 재 봤습니다. 히터를 켠 뒤 11초에 첫 경보, 65초에 자동 차단.</span>
                <span className="go" aria-hidden="true">
                  기록 보기 →
                </span>
              </Link>
            </li>
            <li>
              <div className="lab-hub-card soon" aria-disabled="true">
                <span className="lab-hub-no">LAB 02</span>
                <span className="lab-tag soon">준비 중</span>
                <b>모의실험 — 가상 ESP32</b>
                <span>LAB 01에서 잰 발열 특성과 판정 기준을 넣은 가상 장치에서, 조건을 바꿔 가며 직접 판정을 돌려 볼 수 있게 만들고 있습니다.</span>
              </div>
            </li>
          </ul>
        </div>
      </main>
      <Footer />
    </div>
  );
}
