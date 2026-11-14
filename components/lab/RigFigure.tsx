"use client";

import { useEffect, useRef, useState } from "react";
import { rigMarks } from "@/data/lab/rigMarks";
import { rigParts } from "./Art";
import type { RigHandle } from "./rig3d/scene";

/* 그림 1 — 실험 장치 3D.
   처음에는 같은 3D 장면을 미리 찍어 둔 이미지를 보여 주고, "3D로 돌려 보기"를 누를 때만 Three.js를 불러온다. */
type Mark = { n: number; x: number; y: number; hidden?: boolean };

export function RigFigure() {
  const [mode, setMode] = useState<"still" | "loading" | "3d" | "error">("still");
  const [active, setActive] = useState<number | null>(null);
  const [marks, setMarks] = useState<Mark[]>(rigMarks);
  const [flow, setFlow] = useState(true);
  const canvas = useRef<HTMLCanvasElement>(null);
  const rig = useRef<RigHandle | null>(null);

  useEffect(() => () => rig.current?.dispose(), []);
  useEffect(() => rig.current?.highlight(active), [active]);

  const start = async () => {
    if (mode === "3d" || mode === "loading") return;
    setMode("loading");
    try {
      const gl = document.createElement("canvas").getContext("webgl2");
      if (!gl) throw new Error("no webgl");
      const { createRig } = await import("./rig3d/scene");
      const el = canvas.current!;
      const h = createRig(el);
      rig.current = h;
      h.setFlow(flow);
      h.highlight(active);
      h.onPick((n) => setActive(n));
      let last = "";
      h.onFrame(() => {
        const m = h.marks();
        const key = m.map((p) => `${p.x.toFixed(3)},${p.y.toFixed(3)}`).join("|");
        if (key !== last) {
          last = key;
          setMarks(m);
        }
      });
      if (process.env.NODE_ENV !== "production") (window as unknown as { __rigShot?: () => unknown }).__rigShot = () => ({ img: h.snapshot(1600, 1000), marks: h.marks() });
      setMode("3d");
    } catch {
      setMode("error");
    }
  };
  const stop = () => {
    rig.current?.dispose();
    rig.current = null;
    setMarks(rigMarks);
    setMode("still");
  };

  const cur = active === null ? null : rigParts.find((p) => p.n === active)!;
  const curMark = active === null ? null : marks.find((m) => m.n === active);

  return (
    <>
      <div className={`lab-rig3d is-${mode}`}>
        <img src="/lab/rig3d.webp" width={1600} height={1000} alt="" className="r3-still" decoding="async" />
        <canvas ref={canvas} className="r3-gl" aria-label="실험 장치 3D 장면. 끌어서 돌리고, 휠이나 두 손가락으로 확대할 수 있습니다. 부품을 누르면 이름이 나옵니다." />
        <div className="r3-marks">
          {marks.map((m) =>
            m.hidden ? null : (
              <button
                key={m.n}
                type="button"
                className="r3-mk"
                style={{ left: `${m.x * 100}%`, top: `${m.y * 100}%` }}
                aria-pressed={active === m.n}
                aria-label={`${m.n}. ${rigParts.find((p) => p.n === m.n)?.name}`}
                onClick={() => setActive(active === m.n ? null : m.n)}
              >
                {m.n}
              </button>
            )
          )}
          {cur && curMark && !curMark.hidden && (
            <div className={`r3-tip${curMark.x > 0.66 ? " left" : ""}`} style={{ left: `${curMark.x * 100}%`, top: `${curMark.y * 100}%` }} role="status">
              <b>{cur.name}</b>
              <span>{cur.is}</span>
              <small className="lab-mono">{cur.pin}</small>
            </div>
          )}
        </div>
        <div className="r3-bar">
          {mode === "3d" ? (
            <>
              <button type="button" className="lab-btn" onClick={() => rig.current?.reset()}>
                처음 시점
              </button>
              <button
                type="button"
                className="lab-btn"
                aria-pressed={flow}
                onClick={() => {
                  setFlow(!flow);
                  rig.current?.setFlow(!flow);
                }}
              >
                전류 흐름 {flow ? "끄기" : "켜기"}
              </button>
              <button type="button" className="lab-btn" onClick={stop}>
                3D 끄기
              </button>
              <span className="r3-hint">끌어서 돌리기 · 휠 / 두 손가락으로 확대</span>
            </>
          ) : (
            <button type="button" className="lab-btn primary" onClick={start} disabled={mode === "loading"}>
              {mode === "loading" ? "불러오는 중…" : mode === "error" ? "이 기기에서는 3D를 열 수 없습니다" : "3D로 돌려 보기"}
            </button>
          )}
        </div>
      </div>
      <ol className="lab-parts">
        {rigParts.map((r) => (
          <li key={r.n}>
            <button
              type="button"
              aria-pressed={active === r.n}
              onMouseEnter={() => setActive(r.n)}
              onFocus={() => setActive(r.n)}
              onClick={() => setActive(active === r.n ? null : r.n)}
            >
              <b>{r.n}</b>
              <span className="t">
                <strong>{r.name}</strong>
                <span>{r.is}</span>
                <small className="lab-mono">{r.pin}</small>
              </span>
            </button>
          </li>
        ))}
      </ol>
    </>
  );
}
