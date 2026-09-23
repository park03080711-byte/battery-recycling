"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { MapMotion, PlantData } from "./SystemMap";

/* 공정 재생 — 바닥 흐름선을 따라 빛이 이동하고(LED), 설비에 닿으면 그 설비의 동작 클립을 한 번 재생한다.
   움직임은 사용자가 버튼으로 켤 때만(opt-in), 일시정지 가능, '동작 줄이기' 환경에서는 이동 없이 단계만 넘긴다.
   매 프레임 갱신은 DOM에 직접 쓰고(React 상태는 단계가 바뀔 때만) 부드럽게 유지한다. */

export type PlayState = "idle" | "run" | "pause" | "done";
type Seg = { kind: "move"; from: number; to: number; dur: number } | { kind: "work"; id: string; at: number; dur: number };

const SPEED = 1500; // 흐름선 이동 속도 (원본 2800폭 기준 px/초)
const HOLD = 0.6; // 동작이 끝난 뒤 머무는 시간 (초)
const RM_HOLD = 1.8; // 동작 줄이기: 단계마다 머무는 시간

const easeInOut = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);

export function useMapPlayer({
  motion,
  motionSrc,
  plant,
  order,
  onStep,
  visible,
}: {
  motion?: MapMotion;
  motionSrc?: string;
  plant: PlantData;
  order: string[]; // 단계 id 순서
  onStep: (id: string) => void;
  visible: boolean;
}) {
  const [state, setState] = useState<PlayState>("idle");
  const [runAct, setRunAct] = useState<string | null>(null);
  const [done, setDone] = useState<string[]>([]);
  const [ready, setReady] = useState<Record<string, boolean>>({});

  const trail = useRef<SVGPathElement>(null);
  const dot = useRef<SVGCircleElement>(null);
  const canvases = useRef<Record<string, HTMLCanvasElement | null>>({});
  const sprites = useRef<Record<string, HTMLImageElement>>({});
  const frameNow = useRef<Record<string, number>>({});
  const t = useRef(0);
  const segNow = useRef(-1);
  const raf = useRef(0);
  const reduce = useRef(false);

  // 흐름선: 화면 좌표(원본 px) · 누적 길이
  const geo = useMemo(() => {
    if (!motion) return null;
    const P = motion.path.map(([x, y]) => [(x / 100) * plant.w, (y / 100) * plant.h]);
    const cum = [0];
    for (let i = 1; i < P.length; i++) cum.push(cum[i - 1] + Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]));
    const d = "M" + P.map((p) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" L");
    return { P, cum, total: cum[cum.length - 1], d };
  }, [motion, plant.w, plant.h]);

  const at = useCallback(
    (len: number) => {
      if (!geo) return [0, 0];
      const { P, cum } = geo;
      let i = 1;
      while (i < cum.length - 1 && cum[i] < len) i++;
      const k = (len - cum[i - 1]) / (cum[i] - cum[i - 1] || 1);
      return [P[i - 1][0] + (P[i][0] - P[i - 1][0]) * Math.min(1, Math.max(0, k)), P[i - 1][1] + (P[i][1] - P[i - 1][1]) * Math.min(1, Math.max(0, k))];
    },
    [geo]
  );

  // 시간표: 입고 → (이동 → 설비 동작) × n → 출고
  const buildSegs = useCallback((): Seg[] => {
    if (!motion || !geo) return [];
    const rm = reduce.current;
    const seq = ["cin", ...order.filter((id) => id in motion.stops), "cout"].filter((id) => id in motion.stops);
    const segs: Seg[] = [];
    for (let i = 1; i < seq.length; i++) {
      const a = geo.cum[motion.stops[seq[i - 1]]];
      const b = geo.cum[motion.stops[seq[i]]];
      segs.push({ kind: "move", from: a, to: b, dur: rm ? 0.001 : Math.max(0.45, (b - a) / SPEED) });
      const c = motion.clips[seq[i]];
      if (c || order.includes(seq[i])) segs.push({ kind: "work", id: seq[i], at: b, dur: rm ? RM_HOLD : c ? c.frames / c.fps + HOLD : 1.2 });
    }
    return segs;
  }, [motion, geo, order]);
  const segs = useRef<Seg[]>([]);

  const draw = useCallback(
    (id: string, f: number) => {
      const c = motion?.clips[id];
      const cv = canvases.current[id];
      const img = sprites.current[id];
      if (!c || !cv || !img || !img.complete || !img.naturalWidth) return;
      const fr = Math.max(0, Math.min(c.frames - 1, f));
      if (frameNow.current[id] === fr && cv.dataset.drawn) return;
      const ctx = cv.getContext("2d");
      if (!ctx) return;
      ctx.clearRect(0, 0, c.fw, c.fh);
      ctx.drawImage(img, (fr % c.cols) * c.fw, Math.floor(fr / c.cols) * c.fh, c.fw, c.fh, 0, 0, c.fw, c.fh);
      frameNow.current[id] = fr;
      cv.dataset.drawn = "1";
    },
    [motion]
  );

  // 흐름선 · 빛 점 쓰기
  const paint = useCallback(
    (len: number, show: boolean) => {
      if (!geo) return;
      if (trail.current) trail.current.style.strokeDashoffset = String(geo.total - len);
      if (dot.current) {
        const [x, y] = at(len);
        dot.current.setAttribute("cx", x.toFixed(1));
        dot.current.setAttribute("cy", y.toFixed(1));
        dot.current.style.opacity = show ? "1" : "0";
      }
    },
    [geo, at]
  );

  // 스프라이트: 지도가 보일 즈음 불러와 첫 프레임을 그림
  useEffect(() => {
    if (!motion || !motionSrc || !visible) return;
    for (const id of Object.keys(motion.clips)) {
      if (sprites.current[id]) continue;
      const im = new Image();
      im.decoding = "async";
      im.onload = () => {
        draw(id, frameNow.current[id] ?? 0);
        setReady((r) => ({ ...r, [id]: true }));
      };
      im.src = `${motionSrc}-clip-${id}.webp`;
      sprites.current[id] = im;
    }
  }, [motion, motionSrc, visible, draw]);

  const tick = useCallback(
    (now: number, last: number) => {
      const dt = Math.min(0.1, (now - last) / 1000);
      t.current += dt;
      const list = segs.current;
      let acc = 0;
      let i = 0;
      while (i < list.length && acc + list[i].dur <= t.current) {
        acc += list[i].dur;
        i++;
      }
      // 지난 구간 마무리 (건너뛴 동작 클립은 마지막 프레임으로)
      if (i !== segNow.current) {
        for (let j = Math.max(0, segNow.current); j < i; j++) {
          const s = list[j];
          if (s.kind === "work") {
            draw(s.id, (motion?.clips[s.id]?.frames ?? 1) - 1);
            setDone((d) => (d.includes(s.id) ? d : [...d, s.id]));
          }
        }
        segNow.current = i;
        const s = list[i];
        if (s && s.kind === "work") {
          setRunAct(s.id);
          onStep(s.id);
        } else if (s) setRunAct(null);
      }
      if (i >= list.length) {
        paint(geo?.total ?? 0, false);
        setRunAct(null);
        setState("done");
        return;
      }
      const s = list[i];
      const lt = t.current - acc;
      if (s.kind === "move") {
        const x = s.dur < 0.01 ? 1 : easeInOut(Math.min(1, lt / s.dur));
        paint(s.from + (s.to - s.from) * x, true);
      } else {
        paint(s.at, true);
        const c = motion?.clips[s.id];
        if (c) draw(s.id, reduce.current ? c.frames - 1 : Math.floor(lt * c.fps));
      }
      raf.current = requestAnimationFrame((n) => tick(n, now));
    },
    [draw, paint, geo, motion, onStep]
  );

  const start = useCallback(() => {
    reduce.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    segs.current = buildSegs();
    t.current = 0;
    segNow.current = -1;
    setDone([]);
    paint(0, false);
    for (const id of Object.keys(motion?.clips ?? {})) {
      frameNow.current[id] = -1;
      draw(id, 0);
    }
    setState("run");
  }, [buildSegs, draw, paint, motion]);

  const pause = useCallback(() => setState((s) => (s === "run" ? "pause" : s)), []);

  const toggle = useCallback(() => {
    if (state === "run") pause();
    else if (state === "pause") setState("run");
    else start();
  }, [state, pause, start]);

  // 실행 루프
  useEffect(() => {
    if (state !== "run") return;
    const first = performance.now();
    raf.current = requestAnimationFrame((n) => tick(n, first));
    return () => cancelAnimationFrame(raf.current);
  }, [state, tick]);

  // 화면 밖으로 나가거나 탭을 가리면 멈춤
  useEffect(() => {
    if (!visible) pause();
  }, [visible, pause]);
  useEffect(() => {
    const f = () => document.hidden && pause();
    document.addEventListener("visibilitychange", f);
    return () => document.removeEventListener("visibilitychange", f);
  }, [pause]);

  return { state, runAct, done, ready, geo, trail, dot, canvases, toggle, pause, active: !!motion };
}
