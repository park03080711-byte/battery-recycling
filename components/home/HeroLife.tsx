"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

/* 첫 화면 가운데의 "배터리의 일생" 반복 영상 (15초 · 무음).
   영상은 Blender로 직접 모델링 · 렌더한 것(tools/hero/life.py)이고, 배경이 비쳐야 해서
   한 파일 안에 위쪽 절반 = 색, 아래쪽 절반 = 투명도를 쌓아 두고 WebGL로 합쳐 그린다.
   - 화면에 보일 때만 재생, 움직임 줄이기 · 데이터 절약 설정이면 정지 그림(첫 장면)만
   - 일시정지 단추, 단계 칩(누르면 그 단계를 다루는 주제 페이지로 이동) */

export type LifeStep = { at: number; label: string; href: string; to: string };

const DUR = 15;
const VS =
  "attribute vec2 p;varying vec2 v;void main(){v=p*.5+.5;gl_Position=vec4(p,0.,1.);}";
const FS =
  "precision mediump float;uniform sampler2D t;uniform float e;varying vec2 v;" +
  "void main(){vec3 c=texture2D(t,vec2(v.x,.5+e+v.y*(.5-2.*e))).rgb;" +
  "float a=texture2D(t,vec2(v.x,e+v.y*(.5-2.*e))).g;a=clamp((a-.04)/.92,0.,1.);" +
  "gl_FragColor=vec4(min(c,vec3(a)),a);}";

export default function HeroLife({ steps }: { steps: LifeStep[] }) {
  const boxRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stage, setStage] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [live, setLive] = useState(false);
  const st = useRef({
    gl: null as WebGLRenderingContext | null,
    dead: false,
    userPaused: false,
    visible: false,
    stage: 0,
    raf: 0,
  });

  const draw = useCallback(() => {
    const s = st.current;
    const v = videoRef.current;
    const box = boxRef.current;
    if (!s.gl || !v || v.readyState < 2) return;
    const gl = s.gl;
    try {
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, v);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    } catch {
      return;
    }
    setLive(true);
    const t = v.currentTime % DUR;
    let i = 0;
    while (i + 1 < steps.length && t >= steps[i + 1].at) i++;
    const end = i + 1 < steps.length ? steps[i + 1].at : DUR;
    box?.style.setProperty(
      "--p",
      String(Math.min(1, Math.max(0, (t - steps[i].at) / (end - steps[i].at)))),
    );
    if (i !== s.stage) {
      s.stage = i;
      setStage(i);
    }
  }, [steps]);

  const initGl = useCallback(() => {
    const s = st.current;
    if (s.gl || s.dead) return !!s.gl;
    const c = canvasRef.current;
    const gl = c?.getContext("webgl", {
      premultipliedAlpha: true,
      antialias: false,
      preserveDrawingBuffer: true,
    }) as WebGLRenderingContext | null;
    if (!c || !gl) {
      s.dead = true;
      return false;
    }
    const sh = (type: number, src: string) => {
      const o = gl.createShader(type)!;
      gl.shaderSource(o, src);
      gl.compileShader(o);
      return o;
    };
    const pr = gl.createProgram()!;
    gl.attachShader(pr, sh(gl.VERTEX_SHADER, VS));
    gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, FS));
    gl.linkProgram(pr);
    if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) {
      s.dead = true;
      return false;
    }
    gl.useProgram(pr);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
      gl.STATIC_DRAW,
    );
    const loc = gl.getAttribLocation(pr, "p");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    gl.bindTexture(gl.TEXTURE_2D, gl.createTexture());
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.uniform1f(gl.getUniformLocation(pr, "e"), 1 / (c.height * 2));
    gl.viewport(0, 0, c.width, c.height);
    c.addEventListener("webglcontextlost", (e) => {
      e.preventDefault();
      s.gl = null;
      s.dead = true;
      setLive(false);
      videoRef.current?.pause();
    });
    s.gl = gl;
    return true;
  }, []);

  const play = useCallback(() => {
    const v = videoRef.current;
    if (!v || (boxRef.current?.clientHeight ?? 0) < 40 || !initGl()) return; // 자리가 없으면(아주 작은 화면) 재생하지 않는다
    v.play().catch(() => setPlaying(false));
  }, [initGl]);

  useEffect(() => {
    const v = videoRef.current;
    const box = boxRef.current;
    if (!v || !box) return;
    const s = st.current;
    const nav = navigator as Navigator & {
      connection?: { saveData?: boolean };
    };
    const auto =
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches &&
      !nav.connection?.saveData;

    type VFC = HTMLVideoElement & {
      requestVideoFrameCallback?: (cb: () => void) => number;
    };
    const vv = v as VFC;
    let alive = true;
    const tick = () => {
      if (!alive) return;
      draw();
      if (vv.requestVideoFrameCallback) vv.requestVideoFrameCallback(tick);
      else if (!v.paused) s.raf = requestAnimationFrame(tick);
    };
    const onPlaying = () => {
      setPlaying(true);
      if (!vv.requestVideoFrameCallback) {
        cancelAnimationFrame(s.raf);
        s.raf = requestAnimationFrame(tick);
      }
    };
    const onPause = () => setPlaying(false);
    if (vv.requestVideoFrameCallback) vv.requestVideoFrameCallback(tick);
    v.addEventListener("playing", onPlaying);
    v.addEventListener("pause", onPause);

    const io = new IntersectionObserver(
      ([en]) => {
        s.visible = en.isIntersecting;
        if (en.isIntersecting) {
          if (auto && !s.userPaused) play();
        } else if (!v.paused) v.pause();
      },
      { threshold: 0.2 },
    );
    io.observe(box);
    return () => {
      alive = false;
      io.disconnect();
      cancelAnimationFrame(s.raf);
      v.removeEventListener("playing", onPlaying);
      v.removeEventListener("pause", onPause);
      v.pause();
    };
  }, [draw, play]);

  const toggle = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      st.current.userPaused = false;
      play();
    } else {
      st.current.userPaused = true;
      v.pause();
    }
  };

  return (
    <div className="hx-cell hx-life" ref={boxRef}>
      <div className="hx-life-in">
        <div
          className="hx-life-stage"
          role="img"
          aria-label="배터리의 일생을 보여 주는 15초 영상. 새 셀이 모듈과 팩으로 조립되어 전기차에 실리고, 성능이 떨어지면 떼어 내 진단한 뒤 쓸 만한 모듈은 에너지저장장치로 다시 쓰고, 나머지는 해체 · 파쇄해 니켈 · 코발트 · 망간 · 리튬 소재로 회수되어 다시 새 셀이 됩니다."
        >
          <picture data-live={live ? "" : undefined}>
            <source
              type="image/avif"
              srcSet="/hero/life-480.avif 480w, /hero/life-960.avif 960w"
              sizes="(max-aspect-ratio: 87/80) 40vw, 34vw"
            />
            <img
              src="/hero/life-960.webp"
              srcSet="/hero/life-480.webp 480w, /hero/life-960.webp 960w"
              sizes="(max-aspect-ratio: 87/80) 40vw, 34vw"
              width={960}
              height={960}
              alt=""
              decoding="async"
              fetchPriority="high"
            />
          </picture>
          <canvas
            ref={canvasRef}
            width={540}
            height={540}
            data-live={live ? "" : undefined}
            aria-hidden="true"
          />
          <video
            ref={videoRef}
            muted
            playsInline
            loop
            preload="none"
            tabIndex={-1}
            aria-hidden="true"
          >
            <source src="/hero/life.mp4" type="video/mp4" />
          </video>
        </div>
        <div className="hx-life-bar">
          <button
            type="button"
            className="hx-life-btn"
            onClick={toggle}
            aria-label={playing ? "영상 일시정지" : "영상 재생"}
          >
            <svg viewBox="0 0 14 14" aria-hidden="true">
              {playing ? (
                <path d="M3.4 2.2h2.5v9.6H3.4zM8.1 2.2h2.5v9.6H8.1z" />
              ) : (
                <path d="M4 1.9v10.2L12 7z" />
              )}
            </svg>
          </button>
          <ol className="hx-life-steps" aria-label="배터리의 일생 여섯 단계">
            {steps.map((s, i) => (
              <li
                key={s.href}
                data-on={i === stage ? "" : undefined}
                data-done={i < stage ? "" : undefined}
              >
                <Link
                  href={s.href}
                  aria-label={`${i + 1}단계 ${s.label} — ${s.to} 보기`}
                  aria-current={i === stage ? "step" : undefined}
                >
                  <span className="hx-ls-n" aria-hidden="true">
                    {i + 1}
                  </span>
                  <span className="hx-ls-t" aria-hidden="true">
                    {s.label}
                  </span>
                  <i aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}
