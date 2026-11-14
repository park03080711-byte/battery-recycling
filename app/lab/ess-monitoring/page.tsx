import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import Footer from "@/components/Footer";
import { RcToc } from "@/components/rc/Interactive";
import { IcoDeliver, IcoEarly, IcoTrip } from "@/components/lab/Art";
import { RigFigure } from "@/components/lab/RigFigure";
import { CommChart, HeatChart, RttBars } from "@/components/lab/Charts";
import { HeroVideo, RunVideo, TripReplay } from "@/components/lab/Replay";
import "../lab.css";

export const metadata: Metadata = {
  title: "ESS 상태진단 실험",
  description: "ESP32와 저항 히터로 만든 축소 모형에서 셀 과열을 감지 · 예측하고 스스로 차단하는지 실측한 기록입니다.",
};

const toc = [
  { id: "rc-summary", label: "요약" },
  { id: "lab-setup", label: "실험 장치" },
  { id: "lab-rule", label: "판정 방법" },
  { id: "lab-heat", label: "발열 특성" },
  { id: "lab-trip", label: "판정 · 차단" },
  { id: "lab-comm", label: "통신" },
  { id: "lab-limit", label: "한계와 다음" },
  { id: "lab-files", label: "원자료" },
];

type Kpi = { value: string; unit: string; label: string; detail: ReactNode; run: string; icon: ReactNode };
const kpis: Kpi[] = [
  {
    value: "11",
    unit: "초",
    label: "히터를 켠 뒤 첫 경보까지",
    detail: "온도가 0.03 °C/s 넘는 속도로 10초 넘게 오르자 ‘주의’를 냈습니다. 위험 기준(ΔT 4 °C)에 닿기 54초 전입니다.",
    run: "판정 실험 2회차",
    icon: <IcoEarly />,
  },
  {
    value: "65",
    unit: "초",
    label: "위험 판정과 히터 자동 차단",
    detail: "ΔT 4.03 °C에서 위험으로 올리고 그 자리에서 릴레이를 끊었습니다. 그보다 앞선 27초에 ‘30초 안에 4 °C 도달’ 예측으로 경고를 냈습니다.",
    run: "판정 실험 2회차",
    icon: <IcoTrip />,
  },
  {
    value: "616",
    unit: "/ 616",
    label: "PC에 도착한 측정 패킷",
    detail: "Wi-Fi가 두 번 끊긴 동안 측정값을 버퍼에 담아 두었다가, 다시 연결되자 2.7초 안에 모두 보냈습니다. 평소 왕복 지연은 중앙값 12 ms입니다.",
    run: "통신 실험 1회",
    icon: <IcoDeliver />,
  },
];

/* 판정 사다리: 위에서부터 위험 → 정상. t = ΔT 기준, also = 같은 단계로 올리는 다른 조건 */
const ladder = [
  { lv: 3, name: "위험", t: "ΔT ≥ 4 °C", also: ["전류 ≥ 32 mA"], act: "빨강 깜빡임 · 히터 즉시 차단 · 잠금" },
  { lv: 2, name: "경고", t: "ΔT ≥ 3 °C", also: ["4 °C까지 30초 안에 닿을 것으로 예측 (ΔT ≥ 2 °C일 때)", "전류 ≥ 27 mA", "전압 < 4.0 V 또는 > 5.4 V"], act: "빨강" },
  { lv: 1, name: "주의", t: "ΔT ≥ 2 °C", also: ["0.03 °C/s 넘는 속도로 10초 넘게 상승", "전류 ≥ 23 mA", "전압 < 4.30 V"], act: "노랑" },
  { lv: 0, name: "정상", t: "ΔT < 2 °C", also: ["위 조건에 하나도 해당하지 않음"], act: "초록 · 히터 그대로" },
];

const heat = [
  { run: "1회", rise: "6.38", early: "0.069", tau: "61", cool: "219", reach: "30 · 39 · 52", note: "251초부터 DS18B20 신호 끊김" },
  { run: "2회", rise: "4.00", early: "0.037", tau: "97", cool: "361", reach: "56 · 98 · 174", note: "센서 접촉이 약했던 것으로 추정" },
  { run: "3회", rise: "5.37", early: "0.069", tau: "103", cool: "218", reach: "28 · 58 · 98", note: "" },
];

const files = [
  { f: "heat_cool_220ohm_run1.csv", h: "발열 1회", d: "180초 가열 + 120초 냉각, 1초 간격 (전류 · 전압 · 두 온도)" },
  { f: "heat_cool_220ohm_run2.csv", h: "발열 2회", d: "같은 조건" },
  { f: "heat_cool_220ohm_run3.csv", h: "발열 3회", d: "같은 조건" },
  { f: "heat_runs_summary.csv", h: "발열 요약", d: "회차별 상승량 · 시간상수 · 도달 시간과 평균 · 변동계수" },
  { f: "stage2_run1.csv", h: "판정 1회차", d: "센서를 늦게 붙인 회차 (그대로 공개)" },
  { f: "stage2_run2.csv", h: "판정 2회차", d: "그림 5의 원자료 — ΔT · 기울기 · 예측 · 단계 · 릴레이" },
  { f: "comm_run1.csv", h: "통신 실험", d: "PC 수신 기록 616개 + 중복 8개 (전송 횟수 · 왕복 지연 포함)" },
];

function LabHead() {
  return (
    <header className="rc-head">
      <div className="rc-wrap">
        <nav className="rc-crumb" aria-label="현재 위치">
          <ol>
            <li>
              <Link href="/">홈</Link>
            </li>
            <li>
              <Link href="/lab">실험실</Link>
            </li>
            <li aria-current="page">ESS 상태진단</li>
          </ol>
        </nav>

        <div className="rc-hero lab-hero">
          <div className="rc-title">
            <p className="rc-meta">
              <span className="rc-chip">
                <b>LAB 01</b> 실측 기록
              </span>
              <span className="rc-meta-sub">축소 모형 · 2026년 11월</span>
            </p>
            <h1>ESS 상태진단 실험</h1>
            <p className="rc-tag">데워지는 셀을 먼저 알아채고, 스스로 끊는다</p>
            <p className="rc-lead">
              재사용 배터리로 만든 ESS는 셀 하나의 과열이 화재로 번지기 전에 잡아내야 합니다. 실제 배터리 대신 저항을 데워 셀이 뜨거워지는 상황을 만들고, ESP32가 이를 감지 ·
              예측해 경보를 내고 전원을 끊는지 직접 재 봤습니다.
            </p>
            <dl className="rc-facts-inline">
              <div>
                <dt>장치</dt>
                <dd>ESP32 + 부품 6종</dd>
              </div>
              <div>
                <dt>실험 횟수</dt>
                <dd>발열 3 · 판정 2 · 통신 1</dd>
              </div>
              <div>
                <dt>기간</dt>
                <dd>2026년 11월</dd>
              </div>
            </dl>
          </div>
          <HeroVideo />
        </div>

        <section id="rc-summary" className="rc-summary" aria-labelledby="h-sum">
          <h2 id="h-sum" className="sr-only">
            요약 — 숫자 세 개
          </h2>
          <ul className="rc-kpis">
            {kpis.map((k) => (
              <li key={k.label} className="rc-kpi">
                <div className="rc-kpi-in">
                  {k.icon}
                  <p className="v">
                    {k.value}
                    <small>{k.unit}</small>
                  </p>
                  <h3>{k.label}</h3>
                  <p className="d">{k.detail}</p>
                  <span className="lab-tag">
                    <i aria-hidden="true" />
                    실측 · {k.run}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </header>
  );
}

export default function EssMonitoringPage() {
  return (
    <div className="rc lab">
      <main id="main">
        <LabHead />

        <div className="rc-wrap rc-body">
          <RcToc items={toc} />

          <div className="rc-main">
            {/* ── 1 장치 ── */}
            <section id="lab-setup" className="rc-sec" aria-labelledby="h-setup">
              <h2 id="h-setup" className="rc-h2">
                <span>1</span>실험 장치
                <em className="lab-h2sub">배터리 대신 저항을 데운다</em>
              </h2>
              <p>
                실제 배터리는 다루다 다칠 수 있어 쓰지 않았습니다. 대신 ESP32 보드의 5 V 전원으로 220 Ω 저항에 전류를 흘려 &lsquo;셀이 데워지는 상황&rsquo;을 만들었습니다. 감지 →
                예측 → 차단으로 이어지는 판단 순서는 실제 ESS와 같지만, 전류(약 20 mA)와 온도 변화(몇 °C)는 실제보다 훨씬 작은 축소 모형입니다.
              </p>
              <figure className="rc-panel lab-rig" aria-labelledby="lab-rig-cap">
                <RigFigure />
                <div className="lab-iso-key" aria-hidden="true">
                  <span>
                    <i className="dot" />
                    전류 흐름 (5 V → 릴레이 → 히터 → 션트 → 접지)
                  </span>
                  <span>
                    <i className="w" style={{ background: "#e53935" }} />5 V
                  </span>
                  <span>
                    <i className="w" style={{ background: "#fb8c00" }} />3.3 V
                  </span>
                  <span>
                    <i className="w" style={{ background: "#2b2f36" }} />
                    GND
                  </span>
                  <span>
                    <i className="w" style={{ background: "#1e88e5" }} />
                    그 밖의 색: 신호선
                  </span>
                </div>
                <figcaption id="lab-rig-cap">
                  그림 1. 실험 장치를 실제 부품 모양으로 옮긴 3D 그림. 선은 알아보기 쉽게 다시 정리했고, 점퍼선 색은 전원 · 접지 · 신호를 구분합니다. 번호나 아래 목록을 누르면 그 부품이
                  강조되고, &lsquo;3D로 돌려 보기&rsquo;를 누르면 직접 돌려 볼 수 있습니다. 실제 전류는 약 19.6 mA, 히터 저항은 약 210 Ω으로 쟀습니다.
                </figcaption>
              </figure>
              <figure className="rc-panel lab-photos" aria-labelledby="lab-photo-cap">
                <div>
                  <img src="/lab/rig.webp" width={1200} height={1600} alt="책상 위의 실험 장치. 왼쪽 아래 ESP32 보드에 점퍼선이 여럿 꽂혀 있고, 초록으로 켜진 RGB LED와 파란 릴레이 모듈, 오른쪽 뒤에 브레드보드가 있다." loading="lazy" decoding="async" />
                  <p>장치 전체 — 초록 LED가 켜진 정상 상태</p>
                </div>
                <div>
                  <img src="/lab/breadboard.webp" width={1200} height={1600} alt="브레드보드 확대. 베이지색 220옴 저항에 검은 반원형 DS18B20 센서 머리가 기대어 있고, 옆에 파란 22옴 저항, 오른쪽에 10킬로옴 저항 두 개가 꽂혀 있다." loading="lazy" decoding="async" />
                  <p>브레드보드 — 220 Ω 저항(베이지)에 DS18B20 머리를 기대 놓았습니다</p>
                </div>
                <figcaption id="lab-photo-cap">그림 2. 실제 장치 사진. 센서를 테이프 없이 기대만 놓아서 회차마다 닿는 정도가 조금씩 달랐습니다(3절).</figcaption>
              </figure>
            </section>

            {/* ── 2 판정 ── */}
            <section id="lab-rule" className="rc-sec" aria-labelledby="h-rule">
              <h2 id="h-rule" className="rc-h2">
                <span>2</span>판정 방법
                <em className="lab-h2sub">얼마나 뜨거운가보다 얼마나 빨리 오르나</em>
              </h2>
              <p>
                온도 그 자체 대신 &lsquo;셀이 주변보다 얼마나 더 뜨거운가&rsquo;를 봅니다. 방이 더워지거나 추워져도 셀과 주변이 같이 움직이므로 잘못 경보하지 않습니다. 여기에 오르는
                속도와 4 °C에 닿을 때까지 남은 시간을 더해, 뜨거워지기 전에 먼저 알립니다.
              </p>
              <div className="rc-panel lab-eq" role="group" aria-label="판정에 쓰는 두 식">
                <div>
                  <p className="lab-eq-h">셀이 주변보다 더 뜨거운 정도</p>
                  <p className="lab-math">
                    <var>ΔT</var> = (<var>T</var>
                    <sub>셀</sub> − <var>T</var>
                    <sub>주변</sub>) − <var>d</var>
                    <sub>0</sub>
                  </p>
                  <p className="lab-small">
                    <var>d</var>
                    <sub>0</sub> 는 켤 때 두 센서의 차이. 처음 몇 초의 값을 0으로 맞춥니다.
                  </p>
                </div>
                <div>
                  <p className="lab-eq-h">위험 기준까지 남은 시간</p>
                  <p className="lab-math">
                    <var>t</var>
                    <sub>도달</sub> = <span className="lab-frac"><span>4 °C − <var>ΔT</var></span><span>상승 속도</span></span>
                  </p>
                  <p className="lab-small">상승 속도는 최근 10초 기록에 그은 직선의 기울기(최소제곱)입니다.</p>
                </div>
              </div>
              <figure className="rc-panel lab-ladder-fig" aria-labelledby="lab-ladder-cap">
                <ol className="lab-ladder">
                  {ladder.map((l) => (
                    <li key={l.lv} data-lv={l.lv}>
                      <span className="tube" aria-hidden="true" />
                      <div className="lv">
                        <span className="lab-pill" data-lv={l.lv}>
                          {l.name}
                        </span>
                        <b>{l.t}</b>
                      </div>
                      <ul className="also">
                        {l.also.map((x) => (
                          <li key={x}>{l.lv === 0 ? x : <>또는 {x}</>}</li>
                        ))}
                      </ul>
                      <p className="act">{l.act}</p>
                    </li>
                  ))}
                </ol>
                <figcaption id="lab-ladder-cap">
                  그림 3. 네 단계와 올라가는 조건. 왼쪽 막대는 ΔT 눈금이고, 오른쪽 조건 가운데 하나라도 맞으면 그 단계로 올립니다. 속도 · 예측 조건 덕분에 온도가 기준선에 닿기 전에
                  경보가 나갑니다.
                </figcaption>
              </figure>
              <ul className="lab-rules">
                <li>
                  <b>흔들림 거르기</b>
                  <span>온도는 지수 평활(새 값 30 %), 전류 · 전압은 최근 5개 평균을 씁니다. 판정은 0.5초마다 합니다.</span>
                </li>
                <li>
                  <b>깜빡임 막기</b>
                  <span>올릴 때는 두 번 연속(0.5초), 내릴 때는 5초 연속에 0.3 °C 여유를 둡니다. 기준선 근처에서 단계가 오락가락하지 않게 하려는 것입니다.</span>
                </li>
                <li>
                  <b>위험은 잠근다</b>
                  <span>한 번 위험이 되면 사람이 확인하고 다시 켜기 전까지 히터를 켜지 않습니다. 셀 온도 60 °C 초과나 히터 10분 연속도 무조건 끊습니다.</span>
                </li>
              </ul>
            </section>

            {/* ── 3 발열 ── */}
            <section id="lab-heat" className="rc-sec" aria-labelledby="h-heat">
              <h2 id="h-heat" className="rc-h2">
                <span>3</span>발열 특성
                <em className="lab-h2sub">같은 조건으로 세 번</em>
              </h2>
              <p>
                기준을 정하기 전에, 히터를 180초 켜고 120초 식히는 실험을 같은 장치로 세 번 했습니다. 그림 위에 손가락이나 마우스를 올리면 그 시각의 회차별 값이 뜹니다.
              </p>
              <figure className="rc-panel" aria-labelledby="lab-heat-cap">
                <HeatChart />
                <figcaption id="lab-heat-cap">
                  그림 4. 셀 온도(DS18B20)의 시작 대비 상승량, 1초 간격 실측. 점선은 판정 기준과 같은 2 · 3 · 4 °C입니다. 1회는 251초부터 센서 신호가 끊겨 그 뒤가 비어
                  있습니다. 위 단추로 회차를 끄고 켤 수 있습니다.
                </figcaption>
              </figure>
              <div className="rc-table-wrap rc-panel">
                <table className="rc-table">
                  <caption className="lab-tcap">표 3. 회차별 발열 결과</caption>
                  <thead>
                    <tr>
                      <th scope="col">회차</th>
                      <th scope="col">180초 상승 (°C)</th>
                      <th scope="col">첫 30초 속도 (°C/s)</th>
                      <th scope="col">가열 시간상수 (s)</th>
                      <th scope="col">냉각 시간상수 (s)</th>
                      <th scope="col">2 · 3 · 4 °C 도달 (s)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {heat.map((h) => (
                      <tr key={h.run}>
                        <th scope="row">
                          {h.run}
                          {h.note && <small>{h.note}</small>}
                        </th>
                        <td>{h.rise}</td>
                        <td>{h.early}</td>
                        <td>{h.tau}</td>
                        <td>{h.cool}</td>
                        <td>{h.reach}</td>
                      </tr>
                    ))}
                    <tr className="lab-avg">
                      <th scope="row">평균</th>
                      <td>
                        5.25 <small>변동 22.8 %</small>
                      </td>
                      <td>
                        0.058 <small>변동 31.4 %</small>
                      </td>
                      <td>
                        87 <small>변동 26.3 %</small>
                      </td>
                      <td>266</td>
                      <td>—</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p>
                전기 쪽은 세 번 모두 거의 같았습니다. 전류는 평균 19.55 mA, 전압은 4.537 V로 변동이 0.2 %뿐입니다. 그런데 온도 상승은 4.0 ~ 6.4 °C로 23 % 가까이 흔들렸습니다. 히터가
                같으니 차이는 센서가 저항에 얼마나 잘 닿았느냐에서 왔을 가능성이 큽니다.
              </p>
              <p>
                그래서 정해진 온도만 기다리지 않고 오르는 속도와 도달 예측을 함께 쓰기로 했습니다. 접촉이 약해 느리게 오른 2회에서도 속도와 예측은 위험을 미리 가리킬 수 있습니다. 세
                회차를 1차 지연 모델로 맞추면 최종 상승은 약 6 °C, 시간상수는 평균 87초입니다.
              </p>
            </section>

            {/* ── 4 판정 · 차단 ── */}
            <section id="lab-trip" className="rc-sec" aria-labelledby="h-trip">
              <h2 id="h-trip" className="rc-h2">
                <span>4</span>판정 · 차단
                <em className="lab-h2sub">경보가 차례로 나고 스스로 끊었다</em>
              </h2>
              <p>
                판정 기능을 넣은 펌웨어를 올리고 히터를 켠 채 두었습니다. 사람이 손대지 않아도 주의 → 경고 → 위험 순서로 올라가고, 위험에서 스스로 전원을 끊는지가 관심사였습니다.
                재생을 누르면 기록이 4배속으로 흘러갑니다.
              </p>
              <TripReplay />
              <RunVideo />
              <aside className="rc-note" aria-label="1회차 기록">
                <h3>1회차는 센서를 늦게 붙였다</h3>
                <p>
                  첫 판정 실험은 센서를 저항에서 떼어 둔 채 시작했다가 도중에 붙였습니다. 온도가 한꺼번에 뛰어 주의를 건너뛰고 93.1초에 예측 경고로 바로 올라갔습니다. 판정이
                  틀렸다기보다 조건이 달랐던 것이라, 그림 5는 다시 한 2회차를 썼고 1회차 기록도 아래 원자료에 그대로 두었습니다. 이 회차에서는 기록 한 줄(순번 45)이 빠졌는데, 순번이
                  건너뛴 것으로 바로 찾아냈습니다.
                </p>
              </aside>
            </section>

            {/* ── 5 통신 ── */}
            <section id="lab-comm" className="rc-sec" aria-labelledby="h-comm">
              <h2 id="h-comm" className="rc-h2">
                <span>5</span>통신
                <em className="lab-h2sub">끊겨도 잃지 않는다</em>
              </h2>
              <p>
                다음으로 ESP32가 측정값을 Wi-Fi(휴대폰 핫스팟)로 PC에 보내게 했습니다. PC는 받을 때마다 &lsquo;받았다&rsquo;고 답하고, 1초 안에 답이 없으면 ESP32가 다시 보냅니다.
                연결이 끊기면 최대 600개(10분 분량)를 쌓아 두었다가 다시 이어지면 0.1초에 5개씩 몰아 보냅니다.
              </p>
              <dl className="lab-stats">
                <div>
                  <dt>최종 전달률</dt>
                  <dd>
                    100 <small>% · 616/616</small>
                  </dd>
                </div>
                <div>
                  <dt>한 번에 도착 (정상 구간)</dt>
                  <dd>
                    100 <small>% · 435/435</small>
                  </dd>
                </div>
                <div>
                  <dt>왕복 지연 중앙값</dt>
                  <dd>
                    12 <small>ms</small>
                  </dd>
                </div>
                <div>
                  <dt>끊김 뒤 몰아 보내기</dt>
                  <dd>
                    2.7 <small>s 이내 · 2회</small>
                  </dd>
                </div>
              </dl>
              <figure className="rc-panel" aria-labelledby="lab-comm-cap">
                <CommChart />
                <ol className="lab-callouts">
                  <li>
                    <b>1</b>
                    <span>
                      PC와 연결되기 전에 쌓인 0 ~ 130번(131개). 가장 오래 기다린 것은 130.7초였고, 연결되자 <strong>2.6초</strong> 만에 모두 보냈습니다.
                    </span>
                  </li>
                  <li>
                    <b>2</b>
                    <span>
                      실험 중 약 50초 끊긴 동안의 501 ~ 550번(50개). 다시 연결되고 <strong>2.7초</strong> 만에 모두 보냈습니다.
                    </span>
                  </li>
                </ol>
                <figcaption id="lab-comm-cap">
                  그림 7. 패킷마다 측정한 순간부터 PC에 닿기까지 걸린 시간(두 기기의 시계 차는 가장 빨리 온 패킷을 0으로 맞춰 없앴습니다). 대각선으로 내려오는 보라 점들은 끊긴 동안
                  쌓였다가 늦게 도착한 패킷이고, 빠진 순번은 없습니다.
                </figcaption>
              </figure>
              <figure className="rc-panel" aria-labelledby="lab-rtt-cap">
                <p className="lab-fig-h">정상 구간 왕복 지연 (ms) — 패킷 수</p>
                <RttBars />
                <figcaption id="lab-rtt-cap">
                  그림 8. 연결이 이어져 있던 435개의 왕복 지연. 대부분 20 ms 안에 답이 왔고(95 %가 34 ms 이내), 가장 늦은 것은 336 ms였습니다. 다시 보낸 13번과 중복 수신 8번은 모두 몰아 보내는 동안
                  생겼습니다.
                </figcaption>
              </figure>
              <p>이 통신 실험 중에도 판정은 그대로 동작해 히터를 켠 뒤 15초에 주의, 55초에 경고, 123초에 위험으로 올리고 히터를 끊었습니다.</p>
            </section>

            {/* ── 6 한계 ── */}
            <section id="lab-limit" className="rc-sec" aria-labelledby="h-limit">
              <h2 id="h-limit" className="rc-h2">
                <span>6</span>한계와 다음 단계
              </h2>
              <p>이 실험이 보여 준 것은 &lsquo;판단 순서가 실제 장치에서 제대로 돈다&rsquo;는 데까지입니다. 숫자를 읽을 때 다음을 함께 봐 주세요.</p>
              <ul className="lab-limits">
                <li>
                  <b>규모가 아주 작다</b>
                  <span>
                    전류 20 mA, 온도 상승 몇 °C의 모형입니다. 실제 셀은 수십 A가 흐르고 열폭주는 수백 °C로 번집니다. 2 · 3 · 4 °C 기준도 이 모형에 맞춘 값이라 실제 ESS에 그대로 쓸 수
                    없습니다.
                  </span>
                </li>
                <li>
                  <b>센서를 고정하지 않았다</b>
                  <span>DS18B20을 테이프 없이 기대 놓아 회차마다 닿는 정도가 달랐고, 발열 결과가 23 % 흔들린 주된 이유로 보입니다.</span>
                </li>
                <li>
                  <b>아주 작은 전압은 못 읽는다</b>
                  <span>ESP32의 아날로그 입력은 약 142 mV 아래를 구분하지 못해, 그 근처 값은 0으로 처리했습니다. 이 장치에서는 약 7 mA보다 작은 전류가 0으로 읽힙니다.</span>
                </li>
                <li>
                  <b>차단 직후 주변 온도가 튀었다</b>
                  <span>
                    2회차에서 히터를 끊은 뒤 3초 사이에 NTC 값이 1.7 °C 올랐습니다. 아직 원인을 밝히지 못했습니다. 다음에는 주변 온도가 초당 0.1 °C 넘게 바뀌면 그 값을 믿지 않고 직전
                    값을 쓰는 검사를 넣어 볼 계획입니다.
                  </span>
                </li>
                <li>
                  <b>반복이 적다</b>
                  <span>발열 3회, 판정 2회, 통신 1회입니다. 경향을 보기에는 충분하지만 통계적으로 단정하기에는 적습니다. 과전류(전류 기준) 경로는 아직 실제로 시험하지 않았습니다.</span>
                </li>
              </ul>
              <aside className="rc-note" aria-label="다음 단계">
                <h3>다음 — 모의실험</h3>
                <p>
                  여기서 잰 값(최종 상승 약 6 °C, 시간상수 87초, 판정 기준)을 그대로 넣은 가상 ESP32를 만들어, 센서 접촉이나 열 조건을 바꿔 가며 직접 판정을 돌려 볼 수 있게 할 예정입니다.
                </p>
              </aside>
              <div className="sf-links">
                <Link href="/topics/reuse" className="sf-link">
                  <b>02</b>
                  <span>
                    <strong>재사용</strong>폐배터리로 만든 ESS가 왜 감시를 필요로 하나
                  </span>
                </Link>
                <Link href="/topics/soh-diagnosis" className="sf-link">
                  <b>05</b>
                  <span>
                    <strong>잔존수명 진단</strong>셀 상태를 숫자로 읽는 방법
                  </span>
                </Link>
                <Link href="/topics/safety" className="sf-link">
                  <b>06</b>
                  <span>
                    <strong>안전 관리</strong>열폭주가 번지는 과정
                  </span>
                </Link>
              </div>
            </section>

            {/* ── 원자료 ── */}
            <section id="lab-files" className="rc-sec" aria-labelledby="h-files">
              <h2 id="h-files" className="rc-h2">
                <span>※</span>원자료 내려받기
              </h2>
              <p>그래프에 쓴 측정 기록을 손대지 않은 CSV로 올립니다. 1회차처럼 조건이 어긋난 기록도 빼지 않았습니다.</p>
              <details className="lab-files-wrap">
                <summary>CSV 7개 펼치기</summary>
              <ul className="lab-files">
                {files.map((f) => (
                  <li key={f.f}>
                    <a href={`/lab/${f.f}`} download>
                      <b>{f.h}</b>
                      <span className="lab-mono">{f.f}</span>
                      <span>{f.d}</span>
                    </a>
                  </li>
                ))}
              </ul>
              </details>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
