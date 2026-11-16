"use client";

import { useEffect, useMemo, useReducer, useRef, useState } from "react";
import { LV_NAME } from "../useWidth";
import { ADC1, ADC2, CARDS, ENVS, EXPECT_LABEL, FLASH, GPIOS, INPUT_ONLY, PARTS, SOON, defaultCards, defaultParams, defaultPins, type CardId, type EnvId, type PartId, type PinIssue } from "./catalog";
import { Sim, defaultPresent, type Config, type Score } from "./engine";
import { genCode } from "./codegen";
import { SimStage } from "./SimStage";
import { SimChart } from "./SimChart";

type Tab = "env" | "parts" | "rules" | "code";
type RunRec = { id: number; env: string; change: string; score: Score };

const TABS: { id: Tab; n: number; label: string }[] = [
  { id: "env", n: 1, label: "환경" },
  { id: "parts", n: 2, label: "부품 · 핀" },
  { id: "rules", n: 3, label: "판정 규칙" },
  { id: "code", n: 4, label: "코드" },
];

const pinLabel = (g: number) => {
  const tags: string[] = [];
  if (ADC1.includes(g)) tags.push("ADC1");
  if (ADC2.includes(g)) tags.push("ADC2");
  if (INPUT_ONLY.includes(g)) tags.push("입력 전용");
  if (FLASH.includes(g)) tags.push("플래시");
  if (g === 1) tags.push("TX");
  if (g === 3) tags.push("RX");
  if ([0, 2, 5, 12, 15].includes(g)) tags.push("부팅 설정");
  return `GPIO${g}${tags.length ? ` · ${tags.join(" · ")}` : ""}`;
};

const fmt = (v: number | null | undefined, d = 1) => (v === null || v === undefined || Number.isNaN(v) ? "—" : v.toFixed(d));

export function SimLab() {
  const [env, setEnv] = useState<EnvId>("heat");
  const [variant, setVariant] = useState("cut");
  const [present, setPresent] = useState<PartId[]>(defaultPresent);
  const [pins, setPins] = useState<Record<string, number>>(defaultPins);
  const [cards, setCards] = useState<Record<CardId, boolean>>(defaultCards);
  const [params, setParams] = useState<Record<string, number>>(defaultParams);
  const [speed, setSpeed] = useState(5);
  const [playing, setPlaying] = useState(false);
  const [tab, setTab] = useState<Tab>("env");
  const [runs, setRuns] = useState<RunRec[]>([]);
  const [, bump] = useReducer((x: number) => x + 1, 0);

  const cfg: Config = useMemo(() => ({ env, variant, present, pins, cards, params, seed: 7 }), [env, variant, present, pins, cards, params]);
  const sim = useRef<Sim>(null as unknown as Sim);
  const recorded = useRef(false);
  const runId = useRef(0);
  if (!sim.current) sim.current = new Sim(cfg);

  const reset = (play = false) => {
    sim.current = new Sim(cfg);
    recorded.current = false;
    setPlaying(play);
    bump();
  };
  // 설정이 바뀌면 처음부터
  useEffect(() => {
    reset(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cfg]);

  const record = () => {
    if (recorded.current) return;
    recorded.current = true;
    const s = sim.current;
    const e = s.env;
    const rec: RunRec = { id: ++runId.current, env: e.name + (e.variants ? ` (${e.variants.find((v) => v.id === variant)?.name})` : ""), change: describe(cfg), score: s.score() };
    setRuns((r) => [...r, rec].slice(-3));
  };

  // 재생 루프
  useEffect(() => {
    if (!playing) return;
    let raf = 0,
      last = performance.now(),
      acc = 0;
    const loop = (now: number) => {
      acc += (Math.min(100, now - last) / 1000) * speed;
      last = now;
      const s = sim.current;
      while (acc >= 0.5 && !s.done) {
        s.step();
        acc -= 0.5;
      }
      bump();
      if (s.done) {
        setPlaying(false);
        record();
        return;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, speed]);

  const s = sim.current;
  const cur = s.samples[s.samples.length - 1];
  const has = (p: PartId) => present.includes(p);
  const envObj = ENVS.find((e) => e.id === env)!;
  const done = s.done;
  const score = done ? s.score() : null;
  const errs = s.issues.filter((i) => i.sev === "err").length;
  const dtOn = cards.dt && has("ds");

  const play = () => {
    if (done) {
      sim.current = new Sim(cfg);
      recorded.current = false;
      setPlaying(true);
      bump();
    } else setPlaying(!playing);
  };
  const skip = () => {
    setPlaying(false);
    sim.current.runAll();
    record();
    bump();
  };
  const cmd = (c: "h" | "o" | "x") => {
    sim.current.command(c);
    bump();
  };

  const stage = {
    present,
    level: s.level,
    led: s.led,
    heat: Math.max(0, Math.min(1, s.truth / 5)),
    flow: s.power,
    cut: env === "sensor" && variant === "cut" && s.t >= 45,
  };

  return (
    <div className="sim">
      <div className="sim-top">
        <div className="sim-left">
          <SimStage state={stage}>
            <div className="sim-hud-top">
              <span className="sim-chip">
                <b>{envObj.name}</b>
                <span className="lab-mono">
                  {s.t.toFixed(1)} / {envObj.duration} s
                </span>
              </span>
              <span className="lab-pill" data-lv={s.level}>
                {s.bootFail ? "꺼짐" : LV_NAME[s.level]}
                {s.tripped && " · 차단 잠금"}
              </span>
            </div>
          </SimStage>

          <div className="sim-ctrl" role="group" aria-label="실행">
            <button type="button" className="lab-btn primary" onClick={play}>
              {playing ? "❚❚ 멈춤" : done ? "↻ 다시 실행" : s.t > 0 ? "▶ 이어서" : "▶ 실행"}
            </button>
            <button type="button" className="lab-btn" onClick={() => reset(false)} disabled={s.t === 0}>
              처음부터
            </button>
            <button type="button" className="lab-btn" onClick={skip} disabled={done}>
              결과 바로 보기
            </button>
            <span className="lab-seg" role="group" aria-label="속도">
              {[1, 5, 20].map((v) => (
                <button key={v} type="button" aria-pressed={speed === v} onClick={() => setSpeed(v)}>
                  {v}×
                </button>
              ))}
            </span>
            <span className="sim-cmds" role="group" aria-label="시리얼 명령">
              <button type="button" className="lab-btn sm" onClick={() => cmd("h")} disabled={s.bootFail} title="시리얼 명령 h">
                <kbd>h</kbd> 히터 켜기
              </button>
              <button type="button" className="lab-btn sm" onClick={() => cmd("o")} disabled={s.bootFail} title="시리얼 명령 o">
                <kbd>o</kbd> 끄기
              </button>
              <button type="button" className="lab-btn sm" onClick={() => cmd("x")} disabled={s.bootFail || !s.tripped} title="시리얼 명령 x">
                <kbd>x</kbd> 차단 해제
              </button>
            </span>
          </div>

          <dl className="sim-hud">
            <div>
              <dt>ΔT</dt>
              <dd>{has("ds") ? (s.fault ? "nan" : fmt(cur?.dT, 2)) : "센서 없음"}<small>{has("ds") && !s.fault ? " °C" : ""}</small></dd>
            </div>
            <div>
              <dt>상승 속도</dt>
              <dd>{has("ds") && !s.fault ? fmt(s.slope, 3) : "—"}<small>{has("ds") && !s.fault ? " °C/s" : ""}</small></dd>
            </div>
            <div>
              <dt>위험까지</dt>
              <dd>{has("ds") && !s.fault && s.eta !== null ? fmt(s.eta, 0) : "—"}<small>{has("ds") && !s.fault && s.eta !== null ? " s" : ""}</small></dd>
            </div>
            <div>
              <dt>전류</dt>
              <dd>{has("shunt") ? fmt(s.curMa, 1) : "센서 없음"}<small>{has("shunt") ? " mA" : ""}</small></dd>
            </div>
            <div>
              <dt>전압</dt>
              <dd>{has("div") ? fmt(s.busV, 2) : "센서 없음"}<small>{has("div") ? " V" : ""}</small></dd>
            </div>
            <div>
              <dt>히터</dt>
              <dd className={s.power ? "on" : ""}>{s.power ? "켜짐" : "꺼짐"}</dd>
            </div>
            <div className="truth">
              <dt>실제 셀</dt>
              <dd>
                {s.truth >= 0 ? "+" : ""}
                {fmt(s.truth, 2)}
                <small> °C</small>
              </dd>
            </div>
          </dl>
        </div>

        <div className="sim-side">
          <div className="sim-tabs" role="tablist" aria-label="실험 설정">
            {TABS.map((t) => (
              <button key={t.id} type="button" role="tab" id={`sim-tab-${t.id}`} aria-selected={tab === t.id} aria-controls={`sim-pane-${t.id}`} onClick={() => setTab(t.id)}>
                <span className="n">{t.n}</span>
                {t.label}
                {t.id === "parts" && errs > 0 && <span className="sim-err-dot" aria-label={`문제 ${errs}개`}>{errs}</span>}
              </button>
            ))}
          </div>
          <div className="sim-pane" role="tabpanel" id={`sim-pane-${tab}`} aria-labelledby={`sim-tab-${tab}`}>
            {tab === "env" && <EnvPane env={env} setEnv={setEnv} variant={variant} setVariant={setVariant} />}
            {tab === "parts" && <PartsPane present={present} setPresent={setPresent} pins={pins} setPins={setPins} issues={s.issues} />}
            {tab === "rules" && <RulesPane present={present} cards={cards} setCards={setCards} params={params} setParams={setParams} />}
            {tab === "code" && <CodePane present={present} pins={pins} cards={cards} params={params} />}
          </div>
        </div>
      </div>

      <div className="sim-mid">
        <figure className="rc-panel sim-chart">
          <SimChart samples={s.samples} duration={envObj.duration} th={dtOn ? { c: params["dt.c"], w: params["dt.w"], d: params["dt.d"] } : null} events={s.events} />
          <figcaption>
            파란 선은 ESP32가 센서로 읽어 계산한 ΔT, 검은 점선은 모의실험만 아는 실제 셀 온도예요. 둘이 벌어지면 센서가 셀을 제대로 못 느끼는 거예요. 위 색 띠는 판정 단계, × 는 히터를 끊은 순간.
          </figcaption>
        </figure>
        <Serial lines={s.log} />
      </div>

      <section className="sim-result" aria-labelledby="sim-result-h">
        <h3 id="sim-result-h" className="sr-only">
          성적표
        </h3>
        {score ? (
          <ScoreCard score={score} expect={EXPECT_LABEL[envObj.expect]} fromHeater={envObj.heaterAt !== null} />
        ) : (
          <div className="rc-panel sim-score pending">
            <p className="sim-verdict">
              <span className="sim-vmark" aria-hidden="true">
                ?
              </span>
              <span>
                <b>실행하면 성적표가 나와요</b>
                <small>
                  이 환경의 정답: <strong>{EXPECT_LABEL[envObj.expect]}</strong> — {envObj.expectText}
                </small>
              </span>
            </p>
          </div>
        )}
        {runs.length > 0 && <Compare runs={runs} clear={() => setRuns([])} />}
      </section>
    </div>
  );
}

/* ── 설정 요약 (비교표용) ── */
function describe(cfg: Config) {
  const out: string[] = [];
  const dp = defaultPins(),
    dc = defaultCards(),
    dpar = defaultParams();
  for (const p of PARTS) if (!cfg.present.includes(p.id)) out.push(`${p.name} 뺌`);
  for (const [k, v] of Object.entries(cfg.pins)) {
    const [pid] = k.split(".");
    if (v !== dp[k] && cfg.present.includes(pid as PartId)) out.push(`${PARTS.find((p) => p.id === pid)!.name} → GPIO${v}`);
  }
  for (const c of CARDS) if (cfg.cards[c.id] !== dc[c.id]) out.push(`${c.name} ${cfg.cards[c.id] ? "켬" : "끔"}`);
  for (const c of CARDS)
    for (const p of c.params) {
      const k = `${c.id}.${p.key}`;
      if (Math.abs(cfg.params[k] - dpar[k]) > 1e-9 && cfg.cards[c.id]) out.push(`${c.name} ${p.label} ${dpar[k]}→${cfg.params[k]} ${p.unit}`);
    }
  return out.length ? out.join(", ") : "기본 설정";
}

/* ── 1 환경 ── */
function EnvPane({ env, setEnv, variant, setVariant }: { env: EnvId; setEnv: (e: EnvId) => void; variant: string; setVariant: (v: string) => void }) {
  return (
    <div className="sim-envs">
      <p className="sim-hint">어떤 상황에서 시험할지 고르세요. 바꾸면 처음부터 다시 시작해요.</p>
      {ENVS.map((e) => (
        <div key={e.id} className={`sim-env${env === e.id ? " on" : ""}`}>
          <button type="button" className="sim-env-btn" aria-pressed={env === e.id} onClick={() => setEnv(e.id)}>
            <span className="sim-env-h">
              <b>{e.name}</b>
              <span className="sim-tag">{e.tag}</span>
            </span>
            <span className="sim-env-story">{e.story}</span>
            <span className="sim-env-exp">
              정답 · <strong>{EXPECT_LABEL[e.expect]}</strong>
            </span>
          </button>
          {e.variants && env === e.id && (
            <div className="sim-variants" role="group" aria-label="고장 종류">
              {e.variants.map((v) => (
                <button key={v.id} type="button" aria-pressed={variant === v.id} onClick={() => setVariant(v.id)}>
                  <b>{v.name}</b>
                  <small>{v.text}</small>
                </button>
              ))}
            </div>
          )}
        </div>
      ))}
      <p className="sim-soon">1-2에서 더할 환경: 냉각팬 멈춤 · 과전류 · 충격 · 기울어짐 · 문 열림 · 사람 접근</p>
    </div>
  );
}

/* ── 2 부품 · 핀 ── */
function PartsPane({
  present,
  setPresent,
  pins,
  setPins,
  issues,
}: {
  present: PartId[];
  setPresent: (f: (p: PartId[]) => PartId[]) => void;
  pins: Record<string, number>;
  setPins: (f: (p: Record<string, number>) => Record<string, number>) => void;
  issues: PinIssue[];
}) {
  const adcUsed = new Map<number, string>();
  for (const p of PARTS) if (present.includes(p.id)) for (const r of p.pins) if (r.kind === "adc") adcUsed.set(pins[`${p.id}.${r.key}`], p.name);
  return (
    <div className="sim-parts">
      <p className="sim-hint">꽂을 부품을 고르고 핀을 정하세요. 핀은 실제 ESP32 제약으로 검사해요. 3D 배선은 기본 핀 기준으로 보여요.</p>
      <div className="sim-adc" aria-label="Wi-Fi를 켠 채 쓸 수 있는 아날로그 핀 (ADC1)">
        <span className="sim-adc-h">
          아날로그 핀 (ADC1) <b>{[...adcUsed.keys()].filter((g) => ADC1.includes(g)).length} / 6</b>
        </span>
        <ol>
          {ADC1.map((g) => (
            <li key={g} className={adcUsed.has(g) ? "used" : ""} title={adcUsed.get(g) ?? "비어 있음"}>
              <span className="lab-mono">{g}</span>
              <small>{adcUsed.get(g) ?? "비어 있음"}</small>
            </li>
          ))}
        </ol>
      </div>
      <ul className="sim-plist">
        {PARTS.map((p) => {
          const on = present.includes(p.id);
          const mine = issues.filter((i) => i.part === p.id);
          return (
            <li key={p.id} className={on ? "on" : ""}>
              <div className="sim-prow">
                <button
                  type="button"
                  className="sim-switch"
                  role="switch"
                  aria-checked={on}
                  aria-label={`${p.name} 꽂기`}
                  onClick={() => setPresent((cur) => (cur.includes(p.id) ? cur.filter((x) => x !== p.id) : [...cur, p.id]))}
                >
                  <i />
                </button>
                <span className="sim-pname">
                  <b>{p.name}</b>
                  <small>
                    {p.role} · 키트: {p.kit}
                  </small>
                </span>
                <span className={`sim-ev ev-${p.evidence}`}>{p.evidence}</span>
              </div>
              {on && (
                <div className="sim-pins">
                  {p.pins.map((r) => {
                    const k = `${p.id}.${r.key}`;
                    return (
                      <label key={k}>
                        <span>{r.label}</span>
                        <select value={pins[k]} onChange={(e) => setPins((cur) => ({ ...cur, [k]: Number(e.target.value) }))}>
                          {GPIOS.map((g) => (
                            <option key={g} value={g}>
                              {pinLabel(g)}
                              {g === r.def ? " (기본)" : ""}
                            </option>
                          ))}
                        </select>
                      </label>
                    );
                  })}
                </div>
              )}
              {on &&
                mine.map((i, n) => (
                  <p key={n} className={`sim-issue ${i.sev}`}>
                    <b>{i.sev === "err" ? (i.bootFail ? "부팅 실패" : "동작 안 함") : i.sev === "warn" ? "주의" : "참고"}</b> {i.msg}
                  </p>
                ))}
              {on && <p className="sim-pnote">{p.note}</p>}
              {!on && <p className="sim-pnote off">빠짐 — {offNote[p.id]}</p>}
            </li>
          );
        })}
      </ul>
      <div className="sim-soon">
        <b>1-2에서 더할 키트 부품</b>
        <ul>
          {SOON.map((n) => (
            <li key={n}>{n}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
const offNote: Record<PartId, string> = {
  ds: "셀 온도를 모르니 온도 규칙이 모두 멈춰요.",
  ntc: "주변 온도를 빼지 못해, 켤 때 셀 온도를 기준으로 삼아요. 방이 더워지면 셀이 데워진 것처럼 보여요.",
  shunt: "전류를 모르니 과전류와 ‘가열 대비 온도 확인’을 못 해요.",
  div: "버스 전압을 못 봐요.",
  relay: "히터가 전원에 바로 연결돼요. 위험을 알아도 끊을 방법이 없어요.",
  rgb: "현장에 상태가 안 보여요. 판정은 그대로 해요.",
};

/* ── 3 판정 규칙 ── */
function RulesPane({
  present,
  cards,
  setCards,
  params,
  setParams,
}: {
  present: PartId[];
  cards: Record<CardId, boolean>;
  setCards: (f: (c: Record<CardId, boolean>) => Record<CardId, boolean>) => void;
  params: Record<string, number>;
  setParams: (f: (p: Record<string, number>) => Record<string, number>) => void;
}) {
  const dpar = defaultParams();
  return (
    <div className="sim-rules">
      <p className="sim-hint">꽂은 부품에 맞는 카드만 쓸 수 있어요. 켜고 끄거나 기준값을 바꿔 보세요.</p>
      {CARDS.map((c) => {
        const missing = c.needs.filter((n) => !present.includes(n));
        const usable = missing.length === 0;
        const on = cards[c.id] && usable;
        const changed = c.params.some((p) => Math.abs(params[`${c.id}.${p.key}`] - dpar[`${c.id}.${p.key}`]) > 1e-9);
        return (
          <div key={c.id} className={`sim-card${on ? " on" : ""}${usable ? "" : " na"}${c.combo ? " combo" : ""}`}>
            <div className="sim-card-h">
              <button type="button" className="sim-switch" role="switch" aria-checked={on} aria-label={`${c.name} 켜기`} disabled={!usable} onClick={() => setCards((cur) => ({ ...cur, [c.id]: !cur[c.id] }))}>
                <i />
              </button>
              <b>{c.name}</b>
              {c.combo && <span className="sim-tag combo">조합</span>}
              <span className="sim-out">→ {c.out}</span>
            </div>
            <p className="sim-card-t">{c.text}</p>
            {!usable && <p className="sim-card-need">필요한 부품: {missing.map((n) => PARTS.find((p) => p.id === n)!.name).join(", ")}</p>}
            {usable && c.params.length > 0 && (
              <div className="sim-params">
                {c.params.map((p) => {
                  const k = `${c.id}.${p.key}`;
                  return (
                    <label key={k}>
                      <span>{p.label}</span>
                      <input
                        type="number"
                        inputMode="decimal"
                        min={p.min}
                        max={p.max}
                        step={p.step}
                        value={params[k]}
                        disabled={!on}
                        onChange={(e) => {
                          const v = Number(e.target.value);
                          if (Number.isFinite(v)) setParams((cur) => ({ ...cur, [k]: Math.min(p.max, Math.max(p.min, v)) }));
                        }}
                      />
                      <small>{p.unit}</small>
                    </label>
                  );
                })}
                {changed && (
                  <button type="button" className="sim-link" onClick={() => setParams((cur) => ({ ...cur, ...Object.fromEntries(c.params.map((p) => [`${c.id}.${p.key}`, p.def])) }))}>
                    기본값
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}
      <div className="sim-fixed">
        <b>늘 켜져 있는 규칙</b>
        <ul>
          <li>위험이면 히터 차단 · 잠금 — 사람이 확인하고 <kbd>x</kbd>로 풀기 전까지 다시 켜지 않음</li>
          <li>단계는 두 번 연속(1초)이면 올리고, 열 번 연속(5초)이면 내림 · 내릴 때 0.3 °C 여유</li>
          <li>셀 60 °C 초과 또는 히터 10분 연속이면 무조건 정지</li>
        </ul>
      </div>
    </div>
  );
}

/* ── 4 코드 ── */
function CodePane({ present, pins, cards, params }: { present: PartId[]; pins: Record<string, number>; cards: Record<CardId, boolean>; params: Record<string, number> }) {
  const lines = genCode(present, pins, cards, params);
  return (
    <div className="sim-code">
      <p className="sim-hint">
        지금 설정을 펌웨어로 옮기면 판정 부분이 이렇게 돼요. <mark>노란 줄</mark>은 기본에서 바뀐 곳이에요. 설명용 뼈대라 그대로 올리는 코드는 아니에요.
      </p>
      <pre className="lab-mono" aria-label="생성된 판정 코드">
        {lines.map((l, i) => (
          <span key={i} className={`${l.changed ? "chg" : ""}${l.dim ? " dim" : ""}`}>
            {l.text || " "}
            {"\n"}
          </span>
        ))}
      </pre>
    </div>
  );
}

/* ── 시리얼 모니터 ── */
function Serial({ lines }: { lines: string[] }) {
  const ref = useRef<HTMLPreElement>(null);
  const stick = useRef(true);
  useEffect(() => {
    const el = ref.current;
    if (el && stick.current) el.scrollTop = el.scrollHeight;
  }, [lines.length]);
  return (
    <div className="sim-serial">
      <p className="sim-serial-h">
        <span>시리얼 모니터</span>
        <small className="lab-mono">115200</small>
      </p>
      <pre
        ref={ref}
        className="lab-mono"
        tabIndex={0}
        aria-label="ESP32 시리얼 출력"
        aria-live="off"
        onScroll={(e) => {
          const el = e.currentTarget;
          stick.current = el.scrollHeight - el.scrollTop - el.clientHeight < 24;
        }}
      >
        {lines.map((l, i) => {
          const cls = /flash read err|ets_main|rst:0x/.test(l) || l.includes("→ 위험") ? "bad" : l.includes("→ 경고") || l.includes("히터 차단") || l.includes("센서 고장") ? "warn" : l.includes("→ 주의") ? "cau" : /^\s*[\d.]+s {2}#/.test(l) ? "" : "dim";
          return (
            <span key={i} className={cls}>
              {l}
              {"\n"}
            </span>
          );
        })}
        {lines.length === 0 && <span className="dim">실행하면 ESP32가 보내는 글이 여기에 나와요.</span>}
      </pre>
    </div>
  );
}

/* ── 성적표 ── */
const alarmText = (v: number | null, none: string) => (v === null ? none : v < 0 ? `켜기 ${(-v).toFixed(1)} s 전` : `${v.toFixed(1)} s`);
const VMARK: Record<Score["verdict"], string> = { pass: "✓", late: "!", miss: "✕", false: "!", boot: "✕", idle: "–" };
function ScoreCard({ score, expect, fromHeater }: { score: Score; expect: string; fromHeater: boolean }) {
  return (
    <div className={`rc-panel sim-score v-${score.verdict}`}>
      <p className="sim-verdict">
        <span className="sim-vmark" aria-hidden="true">
          {VMARK[score.verdict]}
        </span>
        <span>
          <b>{score.title}</b>
          <small>{score.detail}</small>
        </span>
      </p>
      <dl className="sim-metrics">
        <div>
          <dt>정답</dt>
          <dd>{expect}</dd>
        </div>
        <div>
          <dt>첫 경보</dt>
          <dd>{alarmText(score.firstAlarm, "없음")}</dd>
        </div>
        <div>
          <dt>히터 차단</dt>
          <dd>{score.cut === null ? "없음" : `${score.cut.toFixed(1)} s`}</dd>
        </div>
        <div>
          <dt>실제 셀 최고</dt>
          <dd>+{score.peakTruth.toFixed(2)} °C</dd>
        </div>
        <div>
          <dt>잘못된 경보</dt>
          <dd>{score.falseAlarms}번</dd>
        </div>
        <div>
          <dt>부품 · 핀</dt>
          <dd>
            {score.parts}종 · {score.pinsUsed}핀
          </dd>
        </div>
      </dl>
      <p className="sim-note">{fromHeater ? "시각은 히터를 켠 때부터 셉니다. LAB 01 실측: 첫 경보 11초 · 차단 65초." : "시각은 시작부터 셉니다."}</p>
    </div>
  );
}

function Compare({ runs, clear }: { runs: RunRec[]; clear: () => void }) {
  return (
    <div className="rc-panel sim-compare">
      <div className="sim-compare-h">
        <b>최근 실행 비교</b>
        <small>마지막 3번까지</small>
        <button type="button" className="sim-link" onClick={clear}>
          지우기
        </button>
      </div>
      <div className="rc-table-wrap">
        <table className="rc-table">
          <thead>
            <tr>
              <th scope="col">#</th>
              <th scope="col">환경</th>
              <th scope="col">바꾼 것</th>
              <th scope="col">결과</th>
              <th scope="col">첫 경보</th>
              <th scope="col">차단</th>
              <th scope="col">실제 최고</th>
            </tr>
          </thead>
          <tbody>
            {runs.map((r) => (
              <tr key={r.id}>
                <td>{r.id}</td>
                <td>{r.env}</td>
                <td className="chg">{r.change}</td>
                <td>
                  <span className={`sim-res v-${r.score.verdict}`}>{r.score.title}</span>
                </td>
                <td>{alarmText(r.score.firstAlarm, "—")}</td>
                <td>{r.score.cut === null ? "—" : `${r.score.cut.toFixed(1)} s`}</td>
                <td>+{r.score.peakTruth.toFixed(2)} °C</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
