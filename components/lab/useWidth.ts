"use client";

import { useEffect, useRef, useState } from "react";

/* 그래프를 실제 화면 폭(px)으로 그리기 위한 측정 훅.
   viewBox로 줄이면 휴대폰에서 글자가 6px까지 작아지므로, 폭을 재서 좌표를 직접 계산한다. */
export function useWidth<T extends HTMLElement>(fallback = 720) {
  const ref = useRef<T>(null);
  const [w, setW] = useState(fallback);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setW(Math.max(280, Math.round(e.contentRect.width))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, w] as const;
}

/* 보기 좋은 눈금 값 */
export function ticks(min: number, max: number, step: number) {
  const out: number[] = [];
  for (let v = Math.ceil(min / step) * step; v <= max + 1e-9; v += step) out.push(Math.round(v * 1000) / 1000);
  return out;
}

export const LV_NAME = ["정상", "주의", "경고", "위험"] as const;
