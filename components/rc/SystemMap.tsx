"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";

/* 공정 지도 — Blender로 직접 렌더한 등각 장면 위에 단계 번호를 얹는다.
   고르면: 해당 설비만 밝히고(마스크) 그쪽으로 확대, 아래 설명판이 바뀐다.
   좁은 화면에서는 늘 골라 둔 설비 쪽을 확대해 보여 준다.
   주제마다 장면 · 단계 · 이름표만 바꿔 쓰는 공통 부품. */

export type MapStep = { id: string; g: number; title: string; short: string; detail: string; in: string; out: string };
export type MapGroup = { label: string; tag: string };
export type MapOverlay = { at: string; text: string; kind: "zone" | "flow"; badge?: string; g?: number };
export type PlantData = { w: number; h: number; pts: Record<string, number[]> };

type Props = {
  steps: MapStep[];
  groups: MapGroup[];
  mid?: string;
  overlays?: MapOverlay[];
  plant: PlantData;
  img: string; // 예: "/rc/plant" → -1600.webp, -2800.webp
  mask: string; // 예: "/rc/mask_" → {id}.png
  title: string;
  sub: string;
  keys: { k: "g0" | "g1" | "flow"; label: string }[];
  caption: ReactNode;
  capId: string;
};

const ZOOM = 1.75;
const keyCls = { g0: "k-pre", g1: "k-post", flow: "k-flow" } as const;

export function SystemMap({ steps, groups, mid, overlays = [], plant, img, mask, title, sub, keys, caption, capId }: Props) {
  const [act, setAct] = useState(steps[0].id);
  const [hover, setHover] = useState<string | null>(null);
  const [focus, setFocus] = useState(false);
  const [box, setBox] = useState({ w: 0, h: 0, narrow: false });
  const stage = useRef<HTMLDivElement>(null);
  const idx = steps.findIndex((s) => s.id === act);
  const cur = steps[idx];
  const R = plant.w / plant.h;
  const pts = plant.pts;
  const srcSet = `${img}-1600.webp 1600w, ${img}-2800.webp 2800w`;
  const sizes = "(max-width: 720px) 260vw, min(1180px, 100vw)";

  useLayoutEffect(() => {
    const el = stage.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => {
      const { width, height } = e.contentRect;
      setBox({ w: width, h: height, narrow: window.matchMedia("(max-width: 720px)").matches });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const zoomed = focus || box.narrow;

  // 확대 · 이동 값 계산 (px) — 가장자리가 비지 않도록 가둔다
  const view = (() => {
    const cw = box.w;
    const ch = box.w / R;
    if (!cw) return { s: 1, x: 0, y: 0 };
    if (!zoomed) return { s: 1, x: 0, y: (box.h - ch) / 2 };
    const [px, py] = pts[act];
    const s = box.narrow ? Math.max(box.h / ch, 1) * 1.08 : ZOOM;
    const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
    const x = clamp(box.w / 2 - (px / 100) * cw * s, box.w - cw * s, 0);
    const y = clamp(box.h * 0.46 - (py / 100) * ch * s, box.h - ch * s, 0);
    return { s, x, y };
  })();

  const pick = useCallback((id: string) => {
    setAct(id);
    setFocus(true);
  }, []);

  useEffect(() => {
    if (!focus) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setFocus(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [focus]);

  const lit = hover ?? (zoomed ? act : null);
  const railBtn = (s: MapStep) => (
    <li key={s.id}>
      <button
        type="button"
        aria-pressed={act === s.id}
        onClick={() => pick(s.id)}
        onMouseEnter={() => setHover(s.id)}
        onMouseLeave={() => setHover(null)}
        onFocus={() => setHover(s.id)}
        onBlur={() => setHover(null)}
      >
        <b>{steps.indexOf(s) + 1}</b>
        <span>{s.short}</span>
      </button>
    </li>
  );

  return (
    <figure className="rc-map" aria-labelledby={capId}>
      <div className="rc-map-bar">
        <p className="rc-map-title">
          {title} <span>{sub}</span>
        </p>
        <ul className="rc-map-key" aria-label="지도 표시">
          {keys.map((k) => (
            <li key={k.label}>
              <i className={keyCls[k.k]} aria-hidden="true" />
              {k.label}
            </li>
          ))}
        </ul>
        {focus && !box.narrow && (
          <button type="button" className="rc-map-reset" onClick={() => setFocus(false)}>
            전체 보기 <kbd>Esc</kbd>
          </button>
        )}
      </div>

      <div className={`rc-map-stage${lit ? " is-lit" : ""}${zoomed ? " is-zoom" : ""}`} ref={stage} style={{ ["--ar" as string]: `${plant.w} / ${plant.h}` }}>
        <div
          className="rc-map-canvas"
          style={{
            aspectRatio: `${plant.w} / ${plant.h}`,
            transform: `translate(${view.x}px, ${view.y}px) scale(${view.s})`,
            ["--inv" as string]: 1 / view.s,
          }}
        >
          <img className="rc-map-img" src={`${img}-1600.webp`} srcSet={srcSet} sizes={sizes} width={plant.w} height={plant.h} alt="" decoding="async" />
          {steps.map((s) => (
            <div key={s.id} className={`rc-map-lit${lit === s.id ? " on" : ""}`} aria-hidden="true">
              <div className="rc-map-mask" style={{ maskImage: `url(${mask}${s.id}.png)`, WebkitMaskImage: `url(${mask}${s.id}.png)` }}>
                <img className="rc-map-img" src={`${img}-1600.webp`} srcSet={srcSet} sizes={sizes} alt="" decoding="async" />
              </div>
            </div>
          ))}
          {overlays.map((o) =>
            o.kind === "zone" ? (
              <p key={o.at} className={`rc-map-zone${o.g ? " z-hub" : ""}`} aria-hidden="true" style={{ left: `${pts[o.at][0]}%`, top: `${pts[o.at][1]}%` }}>
                {o.badge && <b>{o.badge}</b>} {o.text}
              </p>
            ) : (
              <p key={o.at} className="rc-map-tr" aria-hidden="true" style={{ left: `${pts[o.at][0]}%`, top: `${pts[o.at][1]}%` }}>
                {o.text}
              </p>
            )
          )}
          {steps.map((s, i) => (
            <button
              key={s.id}
              type="button"
              tabIndex={-1}
              aria-hidden="true"
              className={`rc-hot${act === s.id ? " on" : ""}${s.g ? " hub" : ""}`}
              style={{ left: `${pts[s.id][0]}%`, top: `${pts[s.id][1]}%` }}
              onClick={() => pick(s.id)}
              onMouseEnter={() => setHover(s.id)}
              onMouseLeave={() => setHover(null)}
            >
              <span>{i + 1}</span>
              <em>{s.short}</em>
            </button>
          ))}
        </div>
      </div>

      <div className="rc-map-dock">
        <div className="rc-rail" role="group" aria-label="단계 고르기">
          {groups.map((g, gi) => {
            const list = steps.filter((s) => s.g === gi);
            return (
              <div key={g.label} className="rc-rail-wrap" style={{ flexGrow: list.length }}>
                {gi > 0 && mid && (
                  <p className="rc-rail-mid" aria-hidden="true">
                    <span>{mid}</span>
                  </p>
                )}
                <div className="rc-rail-g">
                  <p className="rc-rail-h">
                    <i className={gi ? "k-post" : "k-pre"} aria-hidden="true" /> {g.label}
                  </p>
                  <ol start={steps.indexOf(list[0]) + 1} className={gi ? "g1" : undefined}>
                    {list.map(railBtn)}
                  </ol>
                </div>
              </div>
            );
          })}
        </div>

        <div className="rc-map-detail" aria-live="polite">
          <div className="rc-map-text">
            <p className="rc-map-step">
              <span className={cur.g ? "t-post" : "t-pre"}>{groups[cur.g].tag}</span>
              <span>
                {idx + 1} / {steps.length}단계
              </span>
            </p>
            <h3>{cur.title}</h3>
            <p>{cur.detail}</p>
          </div>
          <dl className="rc-io">
            <div>
              <dt>들어가는 것</dt>
              <dd>{cur.in}</dd>
            </div>
            <div className="out">
              <dt>나오는 것</dt>
              <dd>{cur.out}</dd>
            </div>
          </dl>
          <div className="rc-map-nav">
            <button type="button" disabled={idx === 0} onClick={() => pick(steps[idx - 1].id)}>
              ← 이전 단계
            </button>
            <button type="button" disabled={idx === steps.length - 1} onClick={() => pick(steps[idx + 1].id)}>
              다음 단계 →
            </button>
          </div>
        </div>
      </div>

      <figcaption id={capId}>{caption}</figcaption>
    </figure>
  );
}
