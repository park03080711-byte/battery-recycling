"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { Cite } from "./Cite";
import { hubSteps } from "./data";
import plant from "./plant.json";

/* 공정 지도 — Blender로 직접 렌더한 등각 장면 위에 단계 번호를 얹는다.
   고르면: 해당 설비만 밝히고(마스크) 그쪽으로 확대, 아래 설명판이 바뀐다.
   좁은 화면에서는 늘 골라 둔 설비 쪽을 확대해 보여 준다. */

const IMG = "/rc";
const SRCSET = `${IMG}/plant-1600.webp 1600w, ${IMG}/plant-2800.webp 2800w`;
const SIZES = "(max-width: 720px) 260vw, min(1180px, 100vw)";
const R = plant.w / plant.h;
const pts = plant.pts as unknown as Record<string, [number, number]>;
const ZOOM = 1.75;

type View = { s: number; x: number; y: number };

export function SystemMap() {
  const [act, setAct] = useState(hubSteps[0].id);
  const [hover, setHover] = useState<string | null>(null);
  const [focus, setFocus] = useState(false);
  const [box, setBox] = useState({ w: 0, h: 0, narrow: false });
  const stage = useRef<HTMLDivElement>(null);
  const idx = hubSteps.findIndex((s) => s.id === act);
  const cur = hubSteps[idx];

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
  const view: View = (() => {
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

  const pick = useCallback((id: string, zoom = true) => {
    setAct(id);
    if (zoom) setFocus(true);
  }, []);

  useEffect(() => {
    if (!focus) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setFocus(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [focus]);

  const lit = hover ?? (zoomed ? act : null);
  const spoke = hubSteps.filter((s) => s.side === "spoke");
  const hub = hubSteps.filter((s) => s.side === "hub");
  const railBtn = (s: (typeof hubSteps)[number]) => {
    const n = hubSteps.indexOf(s) + 1;
    return (
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
          <b>{n}</b>
          <span>{s.short}</span>
        </button>
      </li>
    );
  };

  return (
    <figure className="rc-map" aria-labelledby="map-cap">
      <div className="rc-map-bar">
        <p className="rc-map-title">
          공정 지도 <span>Hub &amp; Spoke 습식제련 · 7단계</span>
        </p>
        <ul className="rc-map-key" aria-label="지도 표시">
          <li>
            <i className="k-pre" aria-hidden="true" />
            해외 전처리 거점
          </li>
          <li>
            <i className="k-post" aria-hidden="true" />
            국내 후처리 거점
          </li>
          <li>
            <i className="k-flow" aria-hidden="true" />
            물질 흐름
          </li>
        </ul>
        {focus && !box.narrow && (
          <button type="button" className="rc-map-reset" onClick={() => setFocus(false)}>
            전체 보기 <kbd>Esc</kbd>
          </button>
        )}
      </div>

      <div className={`rc-map-stage${lit ? " is-lit" : ""}${zoomed ? " is-zoom" : ""}`} ref={stage}>
        <div
          className="rc-map-canvas"
          style={{
            transform: `translate(${view.x}px, ${view.y}px) scale(${view.s})`,
            ["--inv" as string]: 1 / view.s,
          }}
        >
          <img className="rc-map-img" src={`${IMG}/plant-1600.webp`} srcSet={SRCSET} sizes={SIZES} width={plant.w} height={plant.h} alt="" decoding="async" />
          {hubSteps.map((s) => (
            <div key={s.id} className={`rc-map-lit${lit === s.id ? " on" : ""}`} aria-hidden="true">
              <div className="rc-map-mask" style={{ maskImage: `url(${IMG}/mask_${s.id}.png)`, WebkitMaskImage: `url(${IMG}/mask_${s.id}.png)` }}>
                <img className="rc-map-img" src={`${IMG}/plant-1600.webp`} srcSet={SRCSET} sizes={SIZES} alt="" decoding="async" />
              </div>
            </div>
          ))}
          <p className="rc-map-zone z-spoke" aria-hidden="true" style={{ left: `${pts.zs[0]}%`, top: `${pts.zs[1]}%` }}>
            <b>Spoke</b> 해외 전처리 거점
          </p>
          <p className="rc-map-zone z-hub" aria-hidden="true" style={{ left: `${pts.zh[0]}%`, top: `${pts.zh[1]}%` }}>
            <b>Hub</b> 국내 후처리 거점
          </p>
          <p className="rc-map-tr" aria-hidden="true" style={{ left: `${pts.tr[0]}%`, top: `${pts.tr[1]}%` }}>
            블랙매스로 줄여 이송
          </p>
          {hubSteps.map((s, i) => (
            <button
              key={s.id}
              type="button"
              tabIndex={-1}
              aria-hidden="true"
              className={`rc-hot${act === s.id ? " on" : ""}${s.side === "hub" ? " hub" : ""}`}
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
        <div className="rc-rail" role="group" aria-label="공정 단계 고르기">
          <div className="rc-rail-g">
            <p className="rc-rail-h">
              <i className="k-pre" aria-hidden="true" /> 전처리 · 해외
            </p>
            <ol>{spoke.map(railBtn)}</ol>
          </div>
          <p className="rc-rail-mid" aria-hidden="true">
            <span>블랙매스 이송</span>
          </p>
          <div className="rc-rail-g">
            <p className="rc-rail-h">
              <i className="k-post" aria-hidden="true" /> 후처리 · 국내
            </p>
            <ol start={4}>{hub.map(railBtn)}</ol>
          </div>
        </div>

        <div className="rc-map-detail" aria-live="polite">
          <div className="rc-map-text">
            <p className="rc-map-step">
              <span className={cur.side === "hub" ? "t-post" : "t-pre"}>{cur.side === "hub" ? "후처리 · 국내 Hub" : "전처리 · 해외 Spoke"}</span>
              <span>
                {idx + 1} / {hubSteps.length}단계
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
            <button type="button" disabled={idx === 0} onClick={() => pick(hubSteps[idx - 1].id)}>
              ← 이전 단계
            </button>
            <button type="button" disabled={idx === hubSteps.length - 1} onClick={() => pick(hubSteps[idx + 1].id)}>
              다음 단계 →
            </button>
          </div>
        </div>
      </div>

      <figcaption id="map-cap">
        그림 1. 전처리는 해외 각지, 화학 정제는 국내에서. 무겁고 화재 위험이 큰 팩은 현지에서 분말(블랙매스)로 바꾼 뒤에만 이동합니다. 장면은 이 사이트가 Blender로 직접
        모델링 · 렌더한 설명용 도식이며 실제 설비 배치와는 다릅니다. 공정 설명은 기업 공개 자료를 학술 문헌과 교차 확인했습니다. <Cite src={["C1", 14, 15]} />
      </figcaption>
    </figure>
  );
}
