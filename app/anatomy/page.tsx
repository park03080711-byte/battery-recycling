import type { Metadata } from "next";
import Link from "next/link";
import Anatomy from "@/components/anatomy/Anatomy";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "배터리팩 해부도",
  description: "파우치형 셀 배터리팩을 셀 · 모듈 · BMS · 트레이와 냉각판으로 나눠 들여다보는 인터랙티브 해부도.",
};

export default function AnatomyPage() {
  return (
    <main id="main" className="anat-page">
      <section className="anat-dark anat-top" aria-labelledby="anat-title">
        <div className="anat-wrap">
          <header className="anat-head">
            <div>
              <span className="eyebrow">ANATOMY · 배터리팩 해부도</span>
              <h1 id="anat-title">배터리팩 한 대를 열어 보면</h1>
            </div>
            <p>
              전기차 바닥에 깔리는 배터리팩은 셀 → 모듈 → 팩 순서로 쌓아 만듭니다. 어느 층에서 무엇을 떼어 내느냐가 재제조·재사용·재활용의 갈림길이
              됩니다.
            </p>
          </header>
          <Anatomy />
          <p className="anat-note-foot">
            이미지는 이 사이트에서 Blender로 직접 모델링·렌더링한 예시 팩(파우치형 NCM, 96직렬 2병렬, 모듈 8개 자리)으로, 특정 제조사 제품이 아닙니다. 셀
            분해도의 층 두께와 간격은 이해를 돕기 위해 과장했습니다.
          </p>
        </div>
      </section>

      <section className="anat-more" aria-labelledby="anat-more-title">
        <div className="container">
          <h2 id="anat-more-title">왜 구조를 알아야 할까</h2>
          <p>
            팩마다 구조와 접합 방식이 달라 해체는 지금도 사람 손에 크게 의존합니다. 어디가 볼트이고 어디가 용접·접착인지, 어떤 데이터가 BMS에 남는지를
            알아야 재제조로 보낼지, 셀 단위로 재활용할지를 판단할 수 있습니다.
          </p>
          <div className="grid">
            <Link href="/topics/automated-disassembly">
              <b>07 자동화 해체</b>
              <span>제각각인 팩을 로봇이 분해하려면 무엇이 필요한가</span>
            </Link>
            <Link href="/topics/traceability">
              <b>09 이력관리</b>
              <span>BMS 기록과 배터리 여권이 잇는 제조부터 폐기까지</span>
            </Link>
            <Link href="/topics/design-for-disassembly">
              <b>14 분해를 고려한 설계</b>
              <span>처음부터 뜯기 쉽게 만드는 설계 원칙</span>
            </Link>
          </div>
        </div>
      </section>
      <Footer />
    </main>
  );
}
