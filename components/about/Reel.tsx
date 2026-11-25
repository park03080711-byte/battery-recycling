"use client";

/* 소개 페이지 — 14개 지도 몽타주 영상 (tools/reel: 각 주제의 '공정 재생'을 5배속으로 찍어 이은 28초, 소리 없음)
   화면에 보일 때만 받아서 재생하고, 벗어나면 멈춘다. 동작 줄이기 · 데이터 절약에서는 포스터만 보이고 재생 버튼으로 볼 수 있다.
   아래 칩을 누르면 그 주제 구간으로 옮긴다. */
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { topicBySlug } from "@/data/topics";
import reel from "./reel.json";

const CH = reel.chapters.map((c) => ({ ...c, t: topicBySlug(c.slug)! }));

export function Reel() {
  const v = useRef<HTMLVideoElement>(null);
  const [now, setNow] = useState(0);
  const [playing, setPlaying] = useState(false);
  const cur = CH.reduce((a, c, i) => (now >= c.s - 0.05 ? i : a), 0);
  const c = CH[cur];

  useEffect(() => {
    const el = v.current;
    if (!el) return;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches || (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData;
    if (still) return;
    let user = false; /* 사용자가 직접 멈추면 다시 보일 때 저절로 틀지 않는다 */
    const onPause = () => {
      if (document.visibilityState === "visible" && el.dataset.auto !== "1") user = true;
      el.dataset.auto = "";
    };
    el.addEventListener("pause", onPause);
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          if (!user) el.play().catch(() => {});
        } else if (!el.paused) {
          el.dataset.auto = "1";
          el.pause();
        }
      },
      { threshold: 0.35 }
    );
    io.observe(el);
    return () => {
      io.disconnect();
      el.removeEventListener("pause", onPause);
    };
  }, []);

  const seek = (s: number) => {
    const el = v.current;
    if (!el) return;
    if (el.readyState >= 1) el.currentTime = s;
    else el.addEventListener("loadedmetadata", () => (el.currentTime = s), { once: true });
    setNow(s);
    el.play().catch(() => {});
  };
  const toggle = () => {
    const el = v.current;
    if (!el) return;
    if (el.paused) el.play().catch(() => {});
    else el.pause();
  };

  return (
    <figure className="rc-panel ab-reel" aria-labelledby="ab-reel-cap">
      <div className="ab-reel-frame">
        <video
          ref={v}
          muted
          loop
          playsInline
          preload="none"
          poster="/about/reel-poster.webp"
          width={reel.w}
          height={reel.h}
          aria-label="14개 주제 지도의 공정 재생을 차례로 이어 보여 주는 28초 영상(소리 없음). 재제조 작업장부터 분해를 고려한 설계까지, 주제마다 단계 번호가 차례로 밝아지고 흐름선을 따라 빛 점이 움직입니다."
          onTimeUpdate={(e) => setNow(e.currentTarget.currentTime)}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
        >
          <source src="/about/reel.mp4" type="video/mp4" />
        </video>
        <p className="ab-reel-now" aria-hidden="true">
          <em>{c.t.no}</em>
          {c.t.title}
        </p>
        <button type="button" className="ab-reel-btn" onClick={toggle} aria-label={playing ? "영상 일시정지" : "영상 재생"}>
          <svg viewBox="0 0 14 14" aria-hidden="true">
            {playing ? <path d="M3.4 2.2h2.5v9.6H3.4zM8.1 2.2h2.5v9.6H8.1z" /> : <path d="M4 1.9v10.2L12 7z" />}
          </svg>
        </button>
      </div>
      <div className="ab-reel-bar">
        <div className="ab-reel-chips" role="group" aria-label="주제 구간으로 옮기기">
          {CH.map((x, i) => (
            <button key={x.slug} type="button" aria-current={cur === i ? "true" : undefined} onClick={() => seek(x.s + 0.01)} aria-label={`${x.t.no} ${x.t.title}`}>
              <b>{x.t.no}</b>
              <span>{x.t.title}</span>
            </button>
          ))}
        </div>
        <Link href={`/topics/${c.slug}`} className="ab-reel-go">
          {c.t.no} {c.t.title} 페이지로 <span aria-hidden="true">→</span>
        </Link>
      </div>
      <figcaption id="ab-reel-cap">
        영상 1. 14개 주제 지도의 &lsquo;공정 재생&rsquo;을 실제 사이트 화면 그대로 5배속으로 찍어 이었습니다(28초, 소리 없음). 번호를 누르면 그 주제 구간으로 옮겨 갑니다.
      </figcaption>
    </figure>
  );
}
