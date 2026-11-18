"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import type { RigHandle } from "../rig3d/scene";
import { PARTS, type PartId } from "./catalog";
import type { Led, Site } from "./engine";

/* 가상 실험대의 3D 장면 — LAB 01과 같은 장면에, 고른 부품만 보이고
   히터 달아오름 · LED · 전류 흐름이 계산 결과를 따라간다. */
export type StageState = { present: PartId[]; level: number; led: Led; heat: number; flow: boolean; cut: boolean; site: Site };

const LED_HEX: Record<Led["color"], number | null> = { g: 0x2fdc5a, y: 0xffd23a, r: 0xff3b30, b: 0x3b82ff, off: null };
const LED_CSS: Record<Led["color"], string> = { g: "#2fdc5a", y: "#ffd23a", r: "#ff3b30", b: "#3b82ff", off: "transparent" };
const NAMES: Record<number, string> = {
  1: "ESP32 — 판단 · 차단 · 전송",
  3: "220 Ω 저항 — 데워지는 셀",
  9: "Wi-Fi — PC로 기록 전송",
  ...Object.fromEntries(PARTS.map((p) => [p.rig, `${p.name} — ${p.role}`])),
};

export function SimStage({ state, children }: { state: StageState; children?: ReactNode }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const box = useRef<HTMLDivElement>(null);
  const rig = useRef<RigHandle | null>(null);
  const [mode, setMode] = useState<"still" | "loading" | "3d" | "error">("still");
  const [picked, setPicked] = useState<number | null>(null);
  const st = useRef(state);
  st.current = state;

  const apply = () => {
    const h = rig.current;
    if (!h) return;
    const s = st.current;
    for (const p of PARTS) h.setPresent(p.rig, s.present.includes(p.id));
    h.setCut(s.cut);
    h.setHeat(s.heat);
    h.setFlow(s.flow);
    h.setLevel(Math.min(3, Math.max(0, s.level)) as 0 | 1 | 2 | 3);
    h.setLed({ color: LED_HEX[s.led.color], blink: s.led.blink });
    h.setWifi(s.site.wifi);
    h.setKit({ fanOn: s.site.fanOn, door: s.site.door, tilt: s.site.tilt, shock: s.site.shock, beep: s.site.beep, dtmodOn: s.site.dtmodOn, pirOut: s.site.pirOut });
  };

  const start = async () => {
    if (rig.current || mode === "loading") return;
    setMode("loading");
    try {
      if (!document.createElement("canvas").getContext("webgl2")) throw new Error("no webgl");
      const { createRig } = await import("../rig3d/scene");
      const h = createRig(canvas.current!, { kit: true });
      rig.current = h;
      h.onPick((n) => {
        setPicked(n);
        h.highlight(n);
      });
      apply();
      setMode("3d");
    } catch {
      setMode("error");
    }
  };

  // 넓은 화면에서는 보이면 바로 3D를 켠다. 휴대폰은 단추로.
  useEffect(() => {
    const el = box.current;
    if (!el || !window.matchMedia("(min-width: 721px)").matches) return;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        io.disconnect();
        void start();
      }
    });
    io.observe(el);
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => () => rig.current?.dispose(), []);
  useEffect(apply);

  return (
    <div ref={box} className={`sim-stage is-${mode}`}>
      <img src="/lab/sim-still.webp" width={1600} height={1000} alt="" className="r3-still" decoding="async" />
      {mode !== "3d" && <span className="sim-still-led" style={{ background: LED_CSS[state.led.color], boxShadow: state.led.color === "off" ? "none" : `0 0 18px 6px ${LED_CSS[state.led.color]}` }} aria-hidden="true" />}
      <canvas ref={canvas} className="r3-gl" aria-label="가상 실험대 3D 장면. 끌어서 돌리고, 휠이나 두 손가락으로 확대할 수 있습니다. 부품을 누르면 이름이 나옵니다." />
      {children}
      <div className="sim-stage-foot">
        {mode === "3d" ? (
          <>
            {picked !== null && <span className="sim-picked">{NAMES[picked]}</span>}
            <button type="button" className="lab-btn sm" onClick={() => rig.current?.reset()}>
              처음 시점
            </button>
          </>
        ) : (
          <button type="button" className="lab-btn sm primary" onClick={start} disabled={mode === "loading" || mode === "error"}>
            {mode === "loading" ? "불러오는 중…" : mode === "error" ? "이 기기에서는 3D를 열 수 없어요" : "3D로 보기"}
          </button>
        )}
      </div>
    </div>
  );
}
