"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { MapMotion, PlantData } from "./SystemMap";

/* 공정 재생 — 바닥 흐름선을 따라 빛이 이동하고(LED), 설비에 닿으면 그 설비의 동작 클립을 한 번 재생한다.
   움직임은 사용자가 버튼으로 켤 때만(opt-in), 일시정지 가능, '동작 줄이기' 환경에서는 이동 없이 단계만 넘긴다.
   매 프레임 갱신은 DOM에 직접 쓰고(React 상태는 단계가 바뀔 때만) 부드럽게 유지한다. */

export type PlayState = "idle" | "run" | "pause" | "done";
type Seg = { kind: "move"; r: number; from: number; to: number; dur: number } | { kind: "work"; r: number; id: string; at: number; dur: number; to?: number; carry?: number[]; fps?: number };

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

  const trails = useRef<(SVGPathElement | null)[]>([]);
  const dot = useRef<SVGCircleElement>(null);
  const canvases = useRef<Record<string, HTMLCanvasElement | null>>({});
  const sprites = useRef<Record<string, HTMLImageElement>>({});
  const frameNow = useRef<Record<string, number>>({});
  const t = useRef(0);
  const segNow = useRef(-1);
  const raf = useRef(0);
  const reduce = useRef(false);

  // 흐름선(경로 여러 개 가능 — 첫 경로는 입구부터, 나머지는 갈림점부터): 화면 좌표(원본 px) · 누적 길이
  const geo = useMemo(() => {
    if (!motion) return null;
    const routes = motion.routes ?? (motion.path && motion.stops ? [{ pts: motion.path, stops: motion.stops }] : []);
    return routes.map((rt) => {
      const P = rt.pts.map(([x, y]) => [(x / 100) * plant.w, (y / 100) * plant.h]);
      const cum = [0];
      for (let i = 1; i < P.length; i++) cum.push(cum[i - 1] + Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]));
      const d = "M" + P.map((p) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" L");
      return { P, cum, total: cum[cum.length - 1], d, stops: rt.stops };
    });
  }, [motion, plant.w, plant.h]);

  const at = useCallback(
    (r: number, len: number) => {
      const g = geo?.[r];
      if (!g) return [0, 0];
      const { P, cum } = g;
      let i = 1;
      while (i < cum.length - 1 && cum[i] < len) i++;
      const k = Math.min(1, Math.max(0, (len - cum[i - 1]) / (cum[i] - cum[i - 1] || 1)));
      return [P[i - 1][0] + (P[i][0] - P[i - 1][0]) * k, P[i - 1][1] + (P[i][1] - P[i - 1][1]) * k];
    },
    [geo]
  );

  // 단계에 딸린 클립들 (한 단계에 여러 곳이 움직일 수 있음)
  const clipsOf = useCallback((id: string) => Object.entries(motion?.clips ?? {}).filter(([k, c]) => (c.step ?? k) === id).map(([k]) => k), [motion]);

  // 시간표: 경로마다 (이동 → 설비 동작) × n, 마지막 멈춤점 뒤로 경로가 이어지면 끝까지 이동
  const buildSegs = useCallback((): Seg[] => {
    if (!motion || !geo) return [];
    const rm = reduce.current;
    const segs: Seg[] = [];
    geo.forEach((g, r) => {
      const list = Object.entries(g.stops).filter((e): e is [string, number] => typeof e[1] === "number").sort((a, b) => a[1] - b[1]);
      if (!list.length) return;
      let prev = g.cum[list[0][1]];
      if (r > 0) segs.push({ kind: "move", r, from: prev, to: prev, dur: rm ? 0.001 : 0.3 });
      for (const [id, idx] of list.slice(1)) {
        const b = g.cum[idx];
        segs.push({ kind: "move", r, from: prev, to: b, dur: rm ? 0.001 : Math.max(0.45, (b - prev) / SPEED) });
        prev = b;
        const cs = clipsOf(id);
        if (cs.length || order.includes(id)) {
          const n = Math.max(0, ...cs.map((k) => motion.clips[k].frames / motion.clips[k].fps));
          const w: Seg = { kind: "work", r, id, at: b, dur: rm ? RM_HOLD : cs.length ? n + HOLD : 1.2 };
          // 설비와 함께 이동(트럭 등): 동작하는 동안 빛 점이 다음 꼭짓점까지 따라감
          const car = cs.map((k) => motion.clips[k]).find((c) => c.carry);
          if (car && idx + 1 < g.cum.length) {
            w.to = g.cum[idx + 1];
            w.carry = car.carry;
            w.fps = car.fps;
            prev = w.to;
          }
          segs.push(w);
        }
      }
      if (prev < g.total - 1) segs.push({ kind: "move", r, from: prev, to: g.total, dur: rm ? 0.001 : Math.max(0.35, (g.total - prev) / SPEED) });
    });
    return segs;
  }, [motion, geo, order, clipsOf]);
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
    (r: number, len: number, show: boolean) => {
      const g = geo?.[r];
      if (!g) return;
      const el = trails.current[r];
      if (el) el.style.strokeDashoffset = String(g.total - len);
      if (dot.current) {
        const [x, y] = at(r, len);
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
            for (const k of clipsOf(s.id)) draw(k, (motion?.clips[k]?.frames ?? 1) - 1);
            setDone((d) => (d.includes(s.id) ? d : [...d, s.id]));
          } else paint(s.r, s.to, false);
          if (s.kind === "work" && s.to !== undefined) paint(s.r, s.to, false);
        }
        segNow.current = i;
        const s = list[i];
        if (s && s.kind === "work") {
          setRunAct(order.includes(s.id) ? s.id : null);
          onStep(s.id);
        } else if (s) setRunAct(null);
      }
      if (i >= list.length) {
        if (dot.current) dot.current.style.opacity = "0";
        setRunAct(null);
        setState("done");
        return;
      }
      const s = list[i];
      const lt = t.current - acc;
      if (s.kind === "move") {
        const x = s.dur < 0.01 ? 1 : easeInOut(Math.min(1, lt / s.dur));
        paint(s.r, s.from + (s.to - s.from) * x, true);
      } else {
        if (s.to !== undefined && s.carry && s.fps) {
          const [f0, f1] = s.carry;
          const x = reduce.current ? 1 : easeInOut(Math.min(1, Math.max(0, (lt * s.fps - f0) / (f1 - f0))));
          paint(s.r, s.at + (s.to - s.at) * x, true);
        } else paint(s.r, s.at, true);
        for (const k of clipsOf(s.id)) {
          const c = motion!.clips[k];
          draw(k, reduce.current ? c.frames - 1 : Math.floor(lt * c.fps));
        }
      }
      raf.current = requestAnimationFrame((n) => tick(n, now));
    },
    [draw, paint, motion, onStep, clipsOf, order]
  );

  const start = useCallback(() => {
    reduce.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    segs.current = buildSegs();
    t.current = 0;
    segNow.current = -1;
    setDone([]);
    geo?.forEach((_, r) => paint(r, 0, false));
    for (const id of Object.keys(motion?.clips ?? {})) {
      frameNow.current[id] = -1;
      draw(id, 0);
    }
    setState("run");
  }, [buildSegs, draw, paint, motion, geo]);

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

  return { state, runAct, done, ready, geo, trails, dot, canvases, toggle, pause, active: !!motion };
}
