"use client";

import { useEffect, useState } from "react";
import { HeroArt } from "../Art";

const slides = [
  {
    title: ["버려진 배터리를", "다시 자원으로"],
    en: "Finite Batteries, Infinite Resources",
    desc: "수명을 다한 리튬이온전지가 다시 쓰이기까지, 국내외 문헌 35편으로 따라가는 폐배터리의 두 번째 삶.",
  },
  {
    title: ["하나의 배터리,", "열네 갈래의 길"],
    en: "14 Topics on Battery Afterlife",
    desc: "처리 경로 4 · 지원 기술 6 · 평가 3 · 설계 1. 무엇을 하고, 무엇이 필요하며, 어떻게 판단하고, 애초에 어떻게 만들 것인가.",
  },
  {
    title: ["폐배터리는", "도시광산이다"],
    en: "The Urban Mine of Strategic Minerals",
    desc: "천연 광석보다 높은 농도의 니켈 · 코발트 · 리튬. 2030년 국내 배출 전망 10만 7,500개.",
  },
];

const DURATION = 6500;

export default function Hero() {
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) setPaused(true);
  }, []);

  useEffect(() => {
    if (paused) return;
    const t = setTimeout(() => setIdx((i) => (i + 1) % slides.length), DURATION);
    return () => clearTimeout(t);
  }, [idx, paused]);

  return (
    <section className="fp-section hero" id="s-intro" data-dark="true" aria-roledescription="carousel" aria-label="메인 비주얼">
      {slides.map((s, i) => {
        const Heading = i === 0 ? "h1" : "h2";
        return (
          <div key={i} className={`hero-slide${i === idx ? " active" : ""}`} aria-hidden={i !== idx}>
            <div className="hero-art">
              <HeroArt variant={i as 0 | 1 | 2} />
            </div>
            <div className="hero-shade" />
            <div className="hero-copy">
              <Heading className="reveal">
                {s.title[0]}
                <br />
                {s.title[1]}
              </Heading>
              <p className="en reveal d1">{s.en}</p>
              <p className="desc reveal d2">{s.desc}</p>
            </div>
          </div>
        );
      })}

      <div className="hero-pager" style={{ ["--dur" as string]: `${DURATION}ms` }}>
        {slides.map((_, i) => (
          <button
            key={i}
            className={i === idx ? "active" : ""}
            onClick={() => setIdx(i)}
            aria-label={`${i + 1}번째 슬라이드`}
            aria-current={i === idx}
            style={paused ? { ["--dur" as string]: "0s" } : undefined}
          >
            {String(i + 1).padStart(2, "0")}
            <b key={`${idx}-${paused}`} />
          </button>
        ))}
        <button className="pause" onClick={() => setPaused((p) => !p)} aria-label={paused ? "자동 재생" : "일시 정지"}>
          {paused ? (
            <svg width="10" height="12" viewBox="0 0 10 12" fill="currentColor" aria-hidden="true"><path d="M0 0l10 6-10 6z" /></svg>
          ) : (
            <svg width="10" height="12" viewBox="0 0 10 12" fill="currentColor" aria-hidden="true"><path d="M0 0h3v12H0zM7 0h3v12H7z" /></svg>
          )}
        </button>
      </div>

      <div className="scroll-cue" aria-hidden="true">
        <i />
        SCROLL
      </div>
    </section>
  );
}
