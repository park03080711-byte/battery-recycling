"use client";

import { useEffect, useMemo, useRef, useState, type PointerEvent } from "react";
import { stage2 } from "@/data/lab/essData";
import { LV_NAME, ticks, useWidth } from "./useWidth";

/* 2단계 판정 실험(재실험) 재생.
   기록은 1초 간격 CSV 그대로이며, 시간축은 히터를 켠 순간(기록 20.7 s)을 0으로 옮겼다. */
const T0 = stage2[0][0];
const rows = stage2.map((r) => ({
  t: Math.round((r[0] - T0) * 10) / 10,
  v: r[1],
  i: r[2],
  ds: r[3],
  ntc: r[4],
  dT: r[5],
  slope: r[6],
  eta: r[7],
  risk: r[8],
  lv: r[9],
  heater: r[10],
  trip: r[11],
}));
const TEND = rows[rows.length - 1].t;
const EVENTS = [
  { t: 0, lv: 0, h: "히터 켬", d: "릴레이 ON, 전류 19.6 mA로 오름" },
  ...[1, 2, 3].map((lv) => {
    const r = rows.find((x) => x.lv >= lv)!;
    return { t: r.t, lv, h: LV_NAME[lv], d: reason(r) };
  }),
];

function reason(r: (typeof rows)[number]) {
  if (r.lv === 3) return r.dT >= 4 ? `ΔT ${r.dT.toFixed(2)} °C ≥ 4 → 히터 차단 · 잠금` : "차단 뒤 잠금 유지 — 사람이 다시 켜기 전까지 위험";
  if (r.lv === 2) return r.dT >= 3 ? `ΔT ${r.dT.toFixed(2)} °C ≥ 3` : `4 °C까지 예상 ${r.eta ?? "—"} s < 30 s → 예측 경고`;
  if (r.lv === 1) return r.dT >= 2 ? `ΔT ${r.dT.toFixed(2)} °C ≥ 2` : `상승 속도 ${r.slope.toFixed(3)} °C/s ≥ 0.03 → 조기 경보`;
  return "기준 이하";
}

const LED = ["#2fdc5a", "#ffd23a", "#ff3b30", "#ff3b30"];

export function TripReplay() {
  const [ref, w] = useWidth<HTMLDivElement>();
  const [t, setT] = useState(TEND);
  const [play, setPlay] = useState(false);
  const [speed, setSpeed] = useState(4);
  const raf = useRef(0);
  const last = useRef(0);
  const box = useRef<HTMLElement>(null);

  // 화면에 처음 들어오면 한 번 처음부터 재생 (움직임 줄이기 설정이면 건너뜀)
  useEffect(() => {
    const el = box.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        io.disconnect();
        setT(0);
        setPlay(true);
      },
      { threshold: 0.5 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!play) return;
    last.current = performance.now();
    const step = (now: number) => {
      const dt = ((now - last.current) / 1000) * speed;
      last.current = now;
      setT((x) => {
        const n = x + dt;
        if (n >= TEND) {
          setPlay(false);
          return TEND;
        }
        return n;
      });
      raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf.current);
  }, [play, speed]);

  const k = useMemo(() => {
    let j = 0;
    for (let n = 0; n < rows.length; n++) if (rows[n].t <= t + 1e-6) j = n;
    return j;
  }, [t]);
  const r = rows[k];

  const narrow = w < 560;
  const H = narrow ? 240 : 290;
  const m = { l: 40, r: 14, t: 18, b: 38 };
  const pw = w - m.l - m.r;
  const ph = H - m.t - m.b;
  const X = (s: number) => m.l + (s / TEND) * pw;
  const Y = (v: number) => m.t + ph - (Math.max(-0.2, v) / 4.6) * ph;
  const full = rows.map((p, n) => `${n ? "L" : "M"}${X(p.t).toFixed(1)},${Y(p.dT).toFixed(1)}`).join("");
  const done = rows
    .slice(0, k + 1)
    .map((p, n) => `${n ? "L" : "M"}${X(p.t).toFixed(1)},${Y(p.dT).toFixed(1)}`)
    .join("");

  const scrub = (e: PointerEvent<SVGRectElement>) => {
    if (e.type === "pointermove" && e.buttons === 0) return;
    const b = e.currentTarget.getBoundingClientRect();
    setPlay(false);
    setT(Math.max(0, Math.min(TEND, ((e.clientX - b.left) / pw) * TEND)));
  };

  const start = () => {
    if (t >= TEND - 0.01) setT(0);
    setPlay((p) => !p || t >= TEND - 0.01);
  };

  return (
    <figure ref={box} className="rc-panel lab-replay" aria-labelledby="lab-replay-cap">
      <div className="lab-replay-bar">
        <button type="button" className="lab-btn primary" onClick={start} aria-pressed={play}>
          {play ? "일시정지" : t >= TEND - 0.01 ? "처음부터 재생" : "재생"}
        </button>
        <div className="lab-seg" role="group" aria-label="재생 속도">
          {[1, 4, 10].map((s) => (
            <button key={s} type="button" aria-pressed={speed === s} onClick={() => setSpeed(s)}>
              {s}×
            </button>
          ))}
        </div>
        <label className="lab-range">
          <span className="sr-only">재생 위치 (초)</span>
          <input
            type="range"
            min={0}
            max={TEND}
            step={0.1}
            value={t}
            onChange={(e) => {
              setPlay(false);
              setT(Number(e.target.value));
            }}
          />
        </label>
        <output className="lab-clock" aria-live="off">
          {t.toFixed(1)} s
        </output>
      </div>

      <div className="lab-replay-grid">
        <div ref={ref} className="lab-plot">
          <svg width={w} height={H} role="img" aria-label="히터를 켠 뒤 ΔT 변화와 판정 단계. 11초 주의, 27초 경고, 65초 위험 판정과 함께 히터가 꺼졌다.">
            {/* 단계 띠: 각 기록 구간을 그때의 판정 색으로 */}
            {rows.slice(0, -1).map((p, n) => (
              <rect key={n} x={X(p.t)} y={m.t} width={Math.max(0, X(rows[n + 1].t) - X(p.t)) + 0.5} height={ph} fill={`var(--lv${p.lv}-bg)`} opacity={n < k ? 1 : 0.35} />
            ))}
            {ticks(0, 4, 1).map((v) => (
              <g key={v}>
                <line x1={m.l} x2={m.l + pw} y1={Y(v)} y2={Y(v)} className="lab-grid" />
                <text x={m.l - 8} y={Y(v) + 4} textAnchor="end" className="lab-tick">
                  {v}
                </text>
              </g>
            ))}
            {ticks(0, 70, narrow ? 20 : 10).map((s) => (
              <text key={s} x={X(s)} y={m.t + ph + 18} textAnchor="middle" className="lab-tick">
                {s}
              </text>
            ))}
            <text x={m.l + pw} y={H - 4} textAnchor="end" className="lab-ax">
              히터 켠 뒤 (s)
            </text>
            <text x={m.l - 32} y={m.t - 6} className="lab-ax">
              ΔT °C
            </text>
            {[2, 3, 4].map((v) => (
              <line key={v} x1={m.l} x2={m.l + pw} y1={Y(v)} y2={Y(v)} stroke={`var(--lv${v - 1})`} strokeWidth={1.5} strokeDasharray="5 4" />
            ))}
            {EVENTS.slice(1).map((e) => (
              <g key={e.lv}>
                <line x1={X(e.t)} x2={X(e.t)} y1={m.t} y2={m.t + ph} stroke="var(--rc-text)" strokeOpacity={0.35} />
                <text x={X(e.t) + (e.t > TEND * 0.8 ? -4 : 4)} y={m.t + 14} textAnchor={e.t > TEND * 0.8 ? "end" : "start"} className="lab-evt">
                  {LV_NAME[e.lv]} {Math.round(e.t)}s
                </text>
              </g>
            ))}
            <path d={full} fill="none" stroke="var(--rc-text)" strokeOpacity={0.18} strokeWidth={2} />
            <path d={done} fill="none" stroke="var(--ism-color-foreground)" strokeWidth={2} strokeLinejoin="round" />
            <line x1={X(t)} x2={X(t)} y1={m.t} y2={m.t + ph} className="lab-cross" />
            <circle cx={X(r.t)} cy={Y(r.dT)} r={5} fill="var(--ism-color-foreground)" stroke="#fff" strokeWidth={2} />
            <rect
              x={m.l}
              y={m.t}
              width={pw}
              height={ph}
              fill="transparent"
              style={{ cursor: "ew-resize", touchAction: "pan-y" }}
              onPointerDown={scrub}
              onPointerMove={scrub}
            />
          </svg>
        </div>

        <div className="lab-board" aria-live="polite">
          <div className="lab-board-top">
            <span className={`lab-led${r.lv === 3 ? " blink" : ""}`} style={{ ["--led" as string]: LED[r.lv] }} aria-hidden="true" />
            <div>
              <p className="lab-lv" data-lv={r.lv}>
                {LV_NAME[r.lv]}
              </p>
              <p className="lab-why">{reason(r)}</p>
            </div>
          </div>
          <dl className="lab-read">
            <div>
              <dt>ΔT</dt>
              <dd>
                {r.dT.toFixed(2)} <small>°C</small>
              </dd>
            </div>
            <div>
              <dt>상승 속도</dt>
              <dd>
                {r.slope.toFixed(3)} <small>°C/s</small>
              </dd>
            </div>
            <div>
              <dt>4 °C까지 예상</dt>
              <dd>{r.eta === null ? "—" : <>{r.eta} <small>s</small></>}</dd>
            </div>
            <div>
              <dt>전류</dt>
              <dd>
                {r.i.toFixed(1)} <small>mA</small>
              </dd>
            </div>
            <div>
              <dt>버스 전압</dt>
              <dd>
                {r.v.toFixed(2)} <small>V</small>
              </dd>
            </div>
            <div>
              <dt>릴레이</dt>
              <dd className={r.trip ? "trip" : ""}>{r.trip ? "차단 · 잠금" : r.heater ? "ON" : "OFF"}</dd>
            </div>
          </dl>
        </div>
      </div>

      <ol className="lab-events">
        {EVENTS.map((e) => (
          <li key={e.h}>
            <button
              type="button"
              aria-current={k === rows.findIndex((x) => x.t === e.t) ? "true" : undefined}
              onClick={() => {
                setPlay(false);
                setT(e.t);
              }}
            >
              <span className="lab-pill" data-lv={e.lv}>
                {e.h}
              </span>
              <b>{e.t.toFixed(1)} s</b>
              <span>{e.d}</span>
            </button>
          </li>
        ))}
      </ol>
      <figcaption id="lab-replay-cap">
        그림 5. 2단계 판정 실험(재실험)의 실측 기록 재생. 그래프를 끌거나 아래 사건을 누르면 그 순간의 판정 · LED · 릴레이 상태가 옆(좁은 화면에서는 아래)에 뜹니다. 기록은 1초 간격이며 판정 자체는 0.5초마다
        했습니다. 위험 판정 뒤 ΔT가 내려가는 것은 히터가 꺼진 데다 주변 온도 센서(NTC) 값이 갑자기 1.7 °C 오른 탓이며, 이 오름은 아직 원인을 밝히지 못했습니다(6절).
      </figcaption>
    </figure>
  );
}

/* ── 실험 영상 + 장면 바로가기 ── */
const CHAPTERS = [
  { s: 0, lv: 0, h: "정상", d: "초록 LED" },
  { s: 1.5, lv: 1, h: "주의", d: "노랑으로 바뀜" },
  { s: 9.5, lv: 2, h: "경고", d: "빨강 켜짐" },
  { s: 41.8, lv: 3, h: "위험 · 차단", d: "빨강 빠른 깜빡임, 릴레이 딸깍" },
];
export function RunVideo() {
  const v = useRef<HTMLVideoElement>(null);
  const [now, setNow] = useState(0);
  const cur = CHAPTERS.reduce((a, c, i) => (now >= c.s - 0.05 ? i : a), 0);
  return (
    <figure className="rc-panel lab-video" aria-labelledby="lab-video-cap">
      <div className="lab-video-grid">
        <video
          ref={v}
          src="/lab/ess-run.mp4"
          poster="/lab/ess-run-poster.webp"
          controls
          playsInline
          preload="metadata"
          width={720}
          height={1280}
          onTimeUpdate={(e) => setNow(e.currentTarget.currentTime)}
        />
        <div>
          <p className="lab-fig-h">장면 바로가기</p>
          <ol className="lab-chapters">
            {CHAPTERS.map((c, i) => (
              <li key={c.h}>
                <button
                  type="button"
                  aria-current={cur === i ? "true" : undefined}
                  onClick={() => {
                    const el = v.current;
                    if (!el) return;
                    el.currentTime = c.s;
                    el.play().catch(() => {});
                  }}
                >
                  <b>
                    0:{c.s < 10 ? "0" : ""}
                    {c.s.toFixed(1)}
                  </b>
                  <span className="lab-pill" data-lv={c.lv}>
                    {c.h}
                  </span>
                  <span>{c.d}</span>
                </button>
              </li>
            ))}
          </ol>
          <p className="lab-small">
            소리를 켜면 41.8초에 릴레이가 끊어지는 &lsquo;딸깍&rsquo; 소리가 들립니다. 영상은 그림 5와 다른 회차를 찍은 것이라 단계가 바뀌는 시각이 다릅니다.
          </p>
        </div>
      </div>
      <figcaption id="lab-video-cap">그림 6. 실험 장치 실제 동작 영상 (45초, 소리 있음). 시각은 영상 안의 시간입니다.</figcaption>
    </figure>
  );
}

/* ── 머리 부분 영상: 소리 없이 반복, 지금 단계를 위에 겹쳐 보인다 ── */
export function HeroVideo() {
  const v = useRef<HTMLVideoElement>(null);
  const [now, setNow] = useState(0);
  const [dur, setDur] = useState(44.9);
  const cur = CHAPTERS.reduce((a, c, i) => (now >= c.s - 0.05 ? i : a), 0);
  useEffect(() => {
    const el = v.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) el.pause();
  }, []);
  return (
    <figure className="lab-hero-vid">
      <div className="frame">
        <video
          ref={v}
          src="/lab/ess-run.mp4"
          poster="/lab/ess-run-poster.webp"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          width={720}
          height={1280}
          aria-label="실험 장치 실제 동작 영상. LED가 초록에서 노랑, 빨강으로 바뀌고 마지막에 빨강으로 깜빡이며 릴레이가 끊긴다."
          onTimeUpdate={(e) => setNow(e.currentTarget.currentTime)}
          onLoadedMetadata={(e) => setDur(e.currentTarget.duration || 44.9)}
        />
        <span className="lab-pill lab-hero-lv" data-lv={CHAPTERS[cur].lv} aria-hidden="true">
          {CHAPTERS[cur].h}
        </span>
        <div className="lab-hero-bar" aria-hidden="true">
          <i style={{ width: `${(now / dur) * 100}%` }} />
          {CHAPTERS.slice(1).map((c) => (
            <b key={c.s} style={{ left: `${(c.s / dur) * 100}%` }} data-lv={c.lv} />
          ))}
        </div>
      </div>
      <figcaption>
        실제 동작 45초 · 소리 없이 반복
        <a href="#lab-trip">소리와 함께 보기 ↓</a>
      </figcaption>
    </figure>
  );
}
