"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ANAT_IMG, RATIO, partById, parts, type Part } from "@/data/anatomy";
import { topicBySlug } from "@/data/topics";

type Mode = "overview" | "entering" | "detail" | "returning";

const src = (name: string) => `${ANAT_IMG}/${name}-1920.webp`;
const srcSet = (name: string) => `${ANAT_IMG}/${name}-1200.webp 1200w, ${ANAT_IMG}/${name}-1920.webp 1920w`;
const SIZES = "(max-width: 900px) 100vw, 72vw";
const T_ENTER = 820;
const T_EXIT = 640;

function reduced() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function preload(name: string) {
  const i = new Image();
  i.sizes = SIZES;
  i.srcset = srcSet(name);
}

/** 겹쳐 놓은 렌더 이미지 스테이지 — 닫힌 팩, 열린 팩, 부위별 투시(마스크) */
function Stage({
  hover,
  lidOpen,
  hotspot,
}: {
  hover: string | null;
  lidOpen: boolean;
  hotspot: (p: Part) => React.ReactNode;
}) {
  return (
    <div className={`anat-ov${hover ? " is-hover" : ""}`}>
      <img className="anat-img anat-base" src={src("pack_closed")} srcSet={srcSet("pack_closed")} sizes={SIZES} width={RATIO.w} height={RATIO.h} alt="" decoding="async" />
      <img
        className={`anat-img anat-open${lidOpen ? " is-on" : ""}`}
        src={src("pack_open")}
        srcSet={srcSet("pack_open")}
        sizes={SIZES}
        width={RATIO.w}
        height={RATIO.h}
        alt=""
        decoding="async"
      />
      {parts.map((p) => (
        <div key={p.id} className={`anat-xray${hover === p.id ? " is-on" : ""}`} aria-hidden="true">
          <div className="anat-xray-mask" style={{ maskImage: `url(${ANAT_IMG}/mask_${p.id}.png)`, WebkitMaskImage: `url(${ANAT_IMG}/mask_${p.id}.png)` }}>
            <img className="anat-img" src={src("pack_open")} srcSet={srcSet("pack_open")} sizes={SIZES} alt="" decoding="async" />
          </div>
        </div>
      ))}
      <div className="anat-hots">{parts.map(hotspot)}</div>
    </div>
  );
}

function HotInner({ p }: { p: Part }) {
  return (
    <>
      <span className="anat-hot-ring" aria-hidden="true" />
      <span className="anat-hot-dot" aria-hidden="true">
        {p.no}
      </span>
      <span className="anat-hot-tag" aria-hidden="true">
        {p.label}
      </span>
    </>
  );
}

/* ───────────── 메인 페이지 미리보기 ───────────── */
export function AnatomyPreview() {
  const [hover, setHover] = useState<string | null>(null);
  useEffect(() => {
    // 전용 페이지 첫 화면을 미리 받아 둔다
    const t = setTimeout(() => preload("pack_open"), 1500);
    return () => clearTimeout(t);
  }, []);
  return (
    <div className="anat-stage is-preview" style={{ aspectRatio: `${RATIO.w} / ${RATIO.h}` }}>
      <Stage
        hover={hover}
        lidOpen={false}
        hotspot={(p) => (
          <Link
            key={p.id}
            href={`/anatomy?part=${p.id}`}
            className={`anat-hot${hover === p.id ? " is-active" : ""}${p.hot[0] > 62 ? " tag-left" : ""}`}
            style={{ left: `${p.hot[0]}%`, top: `${p.hot[1]}%` }}
            onMouseEnter={() => setHover(p.id)}
            onMouseLeave={() => setHover(null)}
            onFocus={() => setHover(p.id)}
            onBlur={() => setHover(null)}
            aria-label={`${p.no} ${p.label} — 해부도에서 자세히 보기`}
          >
            <HotInner p={p} />
          </Link>
        )}
      />
    </div>
  );
}

/* ───────────── 전용 페이지: 전체 → 투시 → 확대 → 상세 ───────────── */
export default function Anatomy() {
  const [hover, setHover] = useState<string | null>(null);
  const [active, setActive] = useState<Part | null>(null);
  const [mode, setMode] = useState<Mode>("overview");
  const [lidOpen, setLidOpen] = useState(false);
  const [note, setNote] = useState<number | null>(null);
  const pushed = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const headRef = useRef<HTMLHeadingElement>(null);
  const lastHot = useRef<string | null>(null);
  const modeRef = useRef<Mode>("overview");
  const refocus = useRef(false);
  modeRef.current = mode;

  // 복귀가 끝나 inert 가 풀린 뒤 원래 핫스팟으로 포커스를 돌려준다
  useEffect(() => {
    if (mode !== "overview" || !refocus.current) return;
    refocus.current = false;
    const id = lastHot.current;
    if (id) document.querySelector<HTMLElement>(`[data-hot="${id}"]`)?.focus({ preventScroll: true });
  }, [mode]);

  const clear = () => timer.current && clearTimeout(timer.current);

  const runEnter = useCallback((p: Part) => {
    clear();
    preload(p.detail.img);
    lastHot.current = p.id;
    setHover(null);
    setNote(null);
    setActive(p);
    setMode("entering");
    timer.current = setTimeout(
      () => {
        setMode("detail");
        headRef.current?.focus({ preventScroll: true });
      },
      reduced() ? 0 : T_ENTER
    );
  }, []);

  const runExit = useCallback(() => {
    clear();
    setMode("returning");
    setNote(null);
    timer.current = setTimeout(
      () => {
        refocus.current = true;
        setMode("overview");
        setActive(null);
      },
      reduced() ? 0 : T_EXIT
    );
  }, []);

  const enter = (p: Part) => {
    if (modeRef.current === "entering" || modeRef.current === "returning") return;
    const url = `${location.pathname}?part=${p.id}`;
    if (active) history.replaceState({ part: p.id }, "", url);
    else {
      history.pushState({ part: p.id }, "", url);
      pushed.current = true;
    }
    if (active) {
      // 상세에서 다른 부위로 곧장 이동 — 짧은 교차 전환
      setActive(p);
      setNote(null);
      lastHot.current = p.id;
      headRef.current?.focus({ preventScroll: true });
      return;
    }
    runEnter(p);
  };

  const exit = () => {
    if (pushed.current) {
      pushed.current = false;
      history.back(); // popstate에서 runExit
    } else {
      history.replaceState(null, "", location.pathname);
      runExit();
    }
  };

  // 주소의 ?part= 로 바로 열기 + 뒤로/앞으로 가기
  useEffect(() => {
    const p = partById(new URLSearchParams(location.search).get("part"));
    if (p) runEnter(p);
    const onPop = () => {
      const q = partById(new URLSearchParams(location.search).get("part"));
      if (q) runEnter(q);
      else if (modeRef.current !== "overview") runExit();
    };
    window.addEventListener("popstate", onPop);
    return () => {
      window.removeEventListener("popstate", onPop);
      clear();
    };
  }, [runEnter, runExit]);

  // Esc 로 복귀
  useEffect(() => {
    if (mode !== "detail") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") exit();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const zoomed = mode === "entering" || mode === "detail";
  const showDetail = active && mode !== "overview";
  const idx = active ? parts.findIndex((p) => p.id === active.id) : -1;
  const origin = active ? `${active.hot[0]}% ${active.hot[1]}%` : "50% 50%";

  return (
    <div className={`anat is-${mode}`}>
      <div
        className={`anat-stage${zoomed ? " is-zoomed" : ""}`}
        style={{ aspectRatio: `${RATIO.w} / ${RATIO.h}`, ["--origin" as string]: origin }}
      >
        <div className="anat-ov-wrap" aria-hidden={showDetail ? true : undefined} inert={showDetail ? true : undefined}>
          <Stage
            hover={hover}
            lidOpen={lidOpen}
            hotspot={(p) => (
              <button
                key={p.id}
                type="button"
                data-hot={p.id}
                className={`anat-hot${hover === p.id ? " is-active" : ""}${p.hot[0] > 62 ? " tag-left" : ""}`}
                style={{ left: `${p.hot[0]}%`, top: `${p.hot[1]}%` }}
                onMouseEnter={() => {
                  setHover(p.id);
                  preload(p.detail.img);
                }}
                onMouseLeave={() => setHover(null)}
                onFocus={() => setHover(p.id)}
                onBlur={() => setHover(null)}
                onClick={() => enter(p)}
                aria-label={`${p.no} ${p.label} 자세히 보기`}
              >
                <HotInner p={p} />
              </button>
            )}
          />
        </div>

        {active && (
          <div className={`anat-detail${mode === "detail" ? " is-in" : ""}`} aria-hidden="true">
            <img
              key={active.id}
              className="anat-img"
              src={src(active.detail.img)}
              srcSet={srcSet(active.detail.img)}
              sizes={SIZES}
              width={RATIO.w}
              height={RATIO.h}
              alt=""
              decoding="async"
            />
            <div className="anat-marks">
              {active.detail.notes.map((n, i) => (
                <span
                  key={active.id + i}
                  className={`anat-mark${note === i ? " is-on" : ""}${n.at[0] > 64 ? " tag-left" : ""}`}
                  style={{ left: `${n.at[0]}%`, top: `${n.at[1]}%`, ["--i" as string]: i }}
                >
                  <i>{i + 1}</i>
                  <b>{n.title}</b>
                </span>
              ))}
            </div>
          </div>
        )}

        {!showDetail && (
          <button type="button" className="anat-lid" aria-pressed={lidOpen} onClick={() => setLidOpen((v) => !v)}>
            <span aria-hidden="true" className="anat-lid-ic" />
            {lidOpen ? "덮개 닫기" : "덮개 열어 보기"}
          </button>
        )}
      </div>

      <aside className="anat-panel" aria-label="부위 설명">
        {!showDetail ? (
          <div className="anat-list">
            <p className="anat-hint">
              <span className="only-hover">번호에 마우스를 올리면 덮개 아래가 비쳐 보이고, 누르면 확대해 들어갑니다.</span>
              <span className="only-touch">번호를 누르면 그 부위로 확대해 들어갑니다. 덮개를 열어 속을 먼저 볼 수도 있습니다.</span>
            </p>
            <ol>
              {parts.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    className={hover === p.id ? "is-active" : ""}
                    onMouseEnter={() => setHover(p.id)}
                    onMouseLeave={() => setHover(null)}
                    onFocus={() => setHover(p.id)}
                    onBlur={() => setHover(null)}
                    onClick={() => enter(p)}
                  >
                    <em>{p.no}</em>
                    <span>
                      <b>{p.label}</b>
                      <small>{p.summary}</small>
                    </span>
                  </button>
                </li>
              ))}
            </ol>
          </div>
        ) : (
          <div className={`anat-info${mode === "detail" ? " is-in" : ""}`} key={active!.id}>
            <button type="button" className="anat-back" onClick={exit}>
              <span aria-hidden="true">←</span> 전체 보기 <kbd>Esc</kbd>
            </button>
            <span className="anat-en">
              {active!.no} · {active!.en}
            </span>
            <h2 ref={headRef} tabIndex={-1}>
              {active!.detail.title}
            </h2>
            <p className="anat-lead">{active!.detail.lead}</p>
            <ol className="anat-notes">
              {active!.detail.notes.map((n, i) => (
                <li key={i} onMouseEnter={() => setNote(i)} onMouseLeave={() => setNote(null)} className={note === i ? "is-on" : ""}>
                  <i aria-hidden="true">{i + 1}</i>
                  <div>
                    <b>{n.title}</b>
                    <p>{n.text}</p>
                  </div>
                </li>
              ))}
            </ol>
            <div className="anat-topics">
              <span>관련 주제</span>
              {active!.detail.topics.map((s) => {
                const t = topicBySlug(s);
                return t ? (
                  <Link key={s} href={`/topics/${s}`}>
                    {t.no} {t.title}
                  </Link>
                ) : null;
              })}
            </div>
            <div className="anat-pager">
              <button type="button" onClick={() => enter(parts[(idx + parts.length - 1) % parts.length])}>
                ← {parts[(idx + parts.length - 1) % parts.length].label}
              </button>
              <button type="button" onClick={() => enter(parts[(idx + 1) % parts.length])}>
                {parts[(idx + 1) % parts.length].label} →
              </button>
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}
