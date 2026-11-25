"use client";

/* 소개 페이지 — 영상 1. 14개 주제 지도의 '공정 재생'을 사이트 화면 그대로 찍은 주제별 영상 (tools/reel, 1.5배속, 소리 없음)
   저절로 재생하지 않는다. 번호로 주제를 고르면 그 주제의 첫 화면(포스터)만 보이고, '공정 재생'을 누르면 그 한 편을 받아 한 번 재생한다.
   화면 밖으로 나가면 멈춘다. */
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { topicBySlug } from "@/data/topics";
import reel from "./reel.json";

const CL = reel.clips.map((c) => ({ ...c, t: topicBySlug(c.slug)! }));
const PLAY = <path d="M4 1.9v10.2L12 7z" />;
const PAUSE = <path d="M3.4 2.2h2.5v9.6H3.4zM8.1 2.2h2.5v9.6H8.1z" />;
const AGAIN = <path d="M7 2.2a4.8 4.8 0 1 1-4.5 3.1l1.5.6A3.2 3.2 0 1 0 7 3.8v1.8L4.2 3 7 .4z" />;

export function Reel() {
  const v = useRef<HTMLVideoElement>(null);
  const [sel, setSel] = useState(0);
  const [st, setSt] = useState<"idle" | "play" | "pause" | "done">("idle");
  const c = CL[sel];
  const nx = CL[(sel + 1) % CL.length];

  /* 화면 밖으로 나가면 멈춤 */
  useEffect(() => {
    const el = v.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting && !el.paused) el.pause();
    }, { threshold: 0.2 });
    io.observe(el);
    return () => io.disconnect();
  }, [c.slug]);

  const pick = (i: number) => {
    const el = v.current;
    if (el && !el.paused) el.pause();
    setSel(i);
    setSt("idle");
  };
  const toggle = () => {
    const el = v.current;
    if (!el) return;
    if (st === "play") el.pause();
    else {
      if (st === "done") el.currentTime = 0;
      el.play().catch(() => {});
    }
  };
  const label = st === "play" ? "일시정지" : st === "pause" ? "이어 보기" : st === "done" ? "다시 재생" : "공정 재생";

  return (
    <figure className="rc-panel ab-reel" aria-labelledby="ab-reel-cap">
      <div className="ab-reel-chips" role="group" aria-label="영상으로 볼 주제 고르기">
        {CL.map((x, i) => (
          <button key={x.slug} type="button" aria-pressed={sel === i} onClick={() => pick(i)} aria-label={`${x.t.no} ${x.t.title}`}>
            <b>{x.t.no}</b>
            <span>{x.t.title}</span>
          </button>
        ))}
      </div>
      <div className="ab-reel-frame" data-st={st}>
        <video
          key={c.slug}
          ref={v}
          muted
          playsInline
          preload="none"
          poster={`/about/reel/${c.slug}.webp`}
          width={reel.w}
          height={reel.h}
          aria-label={`${c.t.no} ${c.t.title} 지도의 공정 재생 영상(${Math.round(c.dur)}초, 소리 없음). 단계 번호가 차례로 밝아지고 흐름선을 따라 빛 점이 움직입니다.`}
          onPlay={() => setSt("play")}
          onPause={(e) => setSt(e.currentTarget.ended ? "done" : "pause")}
          onEnded={() => setSt("done")}
        >
          <source src={`/about/reel/${c.slug}.mp4`} type="video/mp4" />
        </video>
        <p className="ab-reel-now" aria-hidden="true">
          <em>{c.t.no}</em>
          {c.t.title}
        </p>
        {st !== "play" && (
          <button type="button" className="ab-reel-big" onClick={toggle} tabIndex={-1} aria-hidden="true">
            <svg viewBox="0 0 14 14">{st === "done" ? AGAIN : PLAY}</svg>
            {label}
          </button>
        )}
      </div>
      <div className="ab-reel-bar">
        <button type="button" className="ab-reel-btn" onClick={toggle} data-st={st}>
          <svg viewBox="0 0 14 14" aria-hidden="true">
            {st === "play" ? PAUSE : st === "done" ? AGAIN : PLAY}
          </svg>
          {label}
          <span className="sr-only"> — {c.t.title}</span>
        </button>
        <span className="ab-reel-len">{Math.round(c.dur)}초</span>
        <span className="ab-reel-sp" />
        <button type="button" className="ab-reel-next" onClick={() => pick((sel + 1) % CL.length)}>
          다음 주제 · {nx.t.no} {nx.t.title} <span aria-hidden="true">→</span>
        </button>
        <Link href={`/topics/${c.slug}`} className="ab-reel-go">
          {c.t.no} {c.t.title} 페이지로 <span aria-hidden="true">→</span>
        </Link>
      </div>
      <figcaption id="ab-reel-cap">
        영상 1. 14개 주제 지도의 &lsquo;공정 재생&rsquo;을 실제 사이트 화면 그대로 {reel.speed}배속으로 찍었습니다(소리 없음). 번호로 주제를 고르고 &lsquo;공정 재생&rsquo;을 누르면 그 주제만 한 번
        재생됩니다.
      </figcaption>
    </figure>
  );
}
