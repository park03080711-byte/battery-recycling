"use client";

import { Fragment, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { LV_NAME } from "../useWidth";
import { ADC1, ADC2, CARDS, ENVS, EXPECT_LABEL, FLASH, GPIOS, INPUT_ONLY, PARTS, LATER, autoPins, cardUsable, defaultCards, defaultFlags, defaultParams, defaultPins, type CardId, type EnvId, type Flags, type PartId, type PinIssue } from "./catalog";
import { SEED, Sim, defaultPresent, allParts, type Config, type Score } from "./engine";
import { PcPanel } from "./PcPanel";
import { SimTests } from "./SimTests";
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
  const [flags, setFlags] = useState<Flags>(defaultFlags);
  const [speed, setSpeed] = useState(5);
  const [playing, setPlaying] = useState(false);
  const [tab, setTab] = useState<Tab>("env");
  const [runs, setRuns] = useState<RunRec[]>([]);
  const [, bump] = useReducer((x: number) => x + 1, 0);

  const cfg: Config = useMemo(() => ({ env, variant, present, pins, cards, params, flags, seed: SEED }), [env, variant, present, pins, cards, params, flags]);
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

  /* ── 설정 공유 링크: 기본과 다른 것만 주소(#c=…)에 담는다 ── */
  const [fromLink, setFromLink] = useState(false);
  const [copied, setCopied] = useState<"" | "ok" | "manual">("");
  const loaded = useRef(false);
  useEffect(() => {
    const d = decodeCfg(window.location.hash);
    if (d) {
      if (d.env) setEnv(d.env);
      if (d.variant) setVariant(d.variant);
      if (d.present) setPresent(d.present);
      if (d.pins) setPins((c) => ({ ...c, ...d.pins }));
      if (d.cards) setCards((c) => ({ ...c, ...d.cards }));
      if (d.params) setParams((c) => ({ ...c, ...d.params }));
      if (d.flags) setFlags((c) => ({ ...c, ...d.flags }));
      setFromLink(true);
    }
    loaded.current = true;
  }, []);
  useEffect(() => {
    if (!loaded.current) return;
    const code = encodeCfg(cfg);
    const url = window.location.pathname + window.location.search + (code ? `#c=${code}` : "");
    try {
      window.history.replaceState(window.history.state, "", url);
    } catch {
      /* 주소를 못 바꿔도 실험대는 그대로 */
    }
  }, [cfg]);
  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied("ok");
    } catch {
      setCopied("manual");
    }
    setTimeout(() => setCopied(""), 4000);
  };
  const resetAll = () => {
    setEnv("heat");
    setVariant("cut");
    setPresent(defaultPresent());
    setPins(defaultPins());
    setCards(defaultCards());
    setParams(defaultParams());
    setFlags(defaultFlags());
    setFromLink(false);
  };
  const isDefault = encodeCfg(cfg) === "";

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
  const cmd = (c: "h" | "o" | "x" | "b") => {
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
    site: s.site,
    ok: present.filter((p) => s.ok(p)),
    tft: has("tft")
      ? {
          ok: s.ok("tft") && !s.bootFail,
          level: s.level,
          dT: has("ds") && !s.fault && cur?.dT !== null && cur?.dT !== undefined ? cur.dT : null,
          fault: s.fault || s.suspect,
          reason: s.halt ?? (s.level > 0 ? s.reason : ""),
          maint: s.maint,
          cur: has("shunt") ? s.curMa : null,
          volt: has("div") ? s.busV : null,
          heat: s.power,
          tripped: s.tripped,
          wifi: s.site.wifi,
          t: s.t,
        }
      : null,
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
              {has("btn") && (
                <button type="button" className="lab-btn sm" onClick={() => cmd("b")} disabled={s.bootFail || !s.tripped || !s.ok("btn")} title="장치 앞의 푸시 버튼">
                  ● 현장 버튼
                </button>
              )}
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
              <dd>
                {!has("shunt") ? "센서 없음" : s.power && s.ok("shunt") && s.curMa === 0 ? "< 7" : fmt(s.curMa, 1)}
                <small>{has("shunt") ? (s.power && s.ok("shunt") && s.curMa === 0 ? " mA 0점 아래" : " mA") : ""}</small>
              </dd>
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
          <KitStrip s={s} has={has} />
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
            {tab === "parts" && <PartsPane present={present} setPresent={setPresent} pins={pins} setPins={setPins} issues={s.issues} flags={flags} setFlags={setFlags} />}
            {tab === "rules" && <RulesPane present={present} cards={cards} setCards={setCards} params={params} setParams={setParams} />}
            {tab === "code" && <CodePane present={present} pins={pins} cards={cards} params={params} />}
          </div>
          <div className="sim-side-foot">
            {fromLink && <span className="sim-from-link">공유받은 설정으로 열었어요</span>}
            {copied === "manual" && <input className="sim-link-box" readOnly value={typeof window === "undefined" ? "" : window.location.href} onFocus={(e) => e.currentTarget.select()} autoFocus aria-label="이 설정의 주소 — 직접 복사하세요" />}
            <button type="button" className="lab-btn sm" onClick={copyLink}>
              {copied === "ok" ? "복사했어요" : "설정 링크 복사"}
            </button>
            <button type="button" className="lab-btn sm" onClick={resetAll} disabled={isDefault}>
              기본 설정으로
            </button>
          </div>
        </div>
      </div>

      <div className="sim-mid">
        <figure className="rc-panel sim-chart">
          <SimChart samples={s.samples} duration={envObj.duration} th={dtOn ? { c: params["dt.c"], w: params["dt.w"], d: params["dt.d"] } : null} events={s.events} event={envObj.event !== undefined ? { t: envObj.event, label: envObj.eventLabel ?? "" } : null} />
          <figcaption>
            파란 선은 ESP32가 센서로 읽어 계산한 ΔT, 검은 점선은 모의실험만 아는 실제 셀 온도예요. 둘이 벌어지면 센서가 셀을 제대로 못 느끼는 거예요. 위 색 띠는 판정 단계, × 는 히터를 끊은 순간.
          </figcaption>
        </figure>
        <Serial lines={s.log} />
      </div>

      <PcPanel s={s} />

      <section className="sim-result" aria-labelledby="sim-result-h">
        <h3 id="sim-result-h" className="sr-only">
          성적표
        </h3>
        {score ? (
          <ScoreCard score={score} expect={EXPECT_LABEL[envObj.expect]} kind={envObj.expect} fromHeater={envObj.heaterAt !== null} lab01={env === "heat" || env === "sensor"} eventLabel={envObj.event !== undefined && envObj.heaterAt !== null ? envObj.eventLabel ?? "사건" : null} />
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

      <SimTests cfg={cfg} />
    </div>
  );
}

/* ── 설정 ↔ 주소 ── */
type Shared = { env?: EnvId; variant?: string; present?: PartId[]; pins?: Record<string, number>; cards?: Partial<Record<CardId, boolean>>; params?: Record<string, number>; flags?: Partial<Flags> };
function encodeCfg(cfg: Config) {
  const d: Record<string, unknown> = {};
  if (cfg.env !== "heat") d.e = cfg.env;
  if (cfg.env === "sensor" && cfg.variant !== "cut") d.v = cfg.variant;
  const dp = defaultPresent();
  if (cfg.present.length !== dp.length || cfg.present.some((p) => !dp.includes(p))) d.p = PARTS.filter((p) => cfg.present.includes(p.id)).map((p) => p.id);
  const pins0 = defaultPins(),
    cards0 = defaultCards(),
    par0 = defaultParams();
  const pin = Object.fromEntries(Object.entries(cfg.pins).filter(([k, v]) => v !== pins0[k]));
  const c = Object.fromEntries(Object.entries(cfg.cards).filter(([k, v]) => v !== cards0[k as CardId]).map(([k, v]) => [k, v ? 1 : 0]));
  const q = Object.fromEntries(Object.entries(cfg.params).filter(([k, v]) => Math.abs(v - par0[k]) > 1e-9));
  if (Object.keys(pin).length) d.g = pin;
  if (Object.keys(c).length) d.c = c;
  if (Object.keys(q).length) d.q = q;
  const f0 = defaultFlags();
  const fl = Object.fromEntries(Object.entries(cfg.flags ?? f0).filter(([k, v]) => v !== f0[k as keyof Flags]).map(([k, v]) => [k, v ? 1 : 0]));
  if (Object.keys(fl).length) d.f = fl;
  if (!Object.keys(d).length) return "";
  const b = btoa(unescape(encodeURIComponent(JSON.stringify(d))));
  return b.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function decodeCfg(hash: string): Shared | null {
  const m = /^#c=([A-Za-z0-9_-]+)$/.exec(hash);
  if (!m) return null;
  try {
    const raw = JSON.parse(decodeURIComponent(escape(atob(m[1].replace(/-/g, "+").replace(/_/g, "/")))));
    const out: Shared = {};
    if (ENVS.some((e) => e.id === raw.e)) out.env = raw.e;
    if (raw.v === "cut" || raw.v === "contact") out.variant = raw.v;
    if (Array.isArray(raw.p)) out.present = PARTS.filter((p) => raw.p.includes(p.id)).map((p) => p.id);
    const pins0 = defaultPins(),
      par0 = defaultParams();
    if (raw.g && typeof raw.g === "object") out.pins = Object.fromEntries(Object.entries(raw.g).filter(([k, v]) => k in pins0 && GPIOS.includes(Number(v))).map(([k, v]) => [k, Number(v)]));
    if (raw.c && typeof raw.c === "object") out.cards = Object.fromEntries(Object.entries(raw.c).filter(([k]) => CARDS.some((c) => c.id === k)).map(([k, v]) => [k, !!v]));
    if (raw.q && typeof raw.q === "object")
      out.params = Object.fromEntries(
        Object.entries(raw.q)
          .filter(([k, v]) => k in par0 && Number.isFinite(Number(v)))
          .map(([k, v]) => {
            const [cid, pk] = k.split(".");
            const pd = CARDS.find((c) => c.id === cid)!.params.find((p) => p.key === pk)!;
            return [k, Math.min(pd.max, Math.max(pd.min, Number(v)))];
          })
      );
    if (raw.f && typeof raw.f === "object") out.flags = Object.fromEntries(Object.entries(raw.f).filter(([k]) => k in defaultFlags()).map(([k, v]) => [k, !!v]));
    return out;
  } catch {
    return null;
  }
}

/* ── 설정 요약 (비교표용) ── */
function describe(cfg: Config) {
  const out: string[] = [];
  const dp = defaultPins(),
    dc = defaultCards(),
    dpar = defaultParams();
  for (const p of PARTS) if (p.group === "core" && !cfg.present.includes(p.id)) out.push(`${p.name} 뺌`);
  const kit = PARTS.filter((p) => p.group !== "core" && cfg.present.includes(p.id));
  if (kit.length >= 4) out.push(`+키트 ${kit.length}종`);
  else kit.forEach((p) => out.push(`+${p.name}`));
  for (const [k, v] of Object.entries(cfg.pins)) {
    const [pid] = k.split(".");
    if (v !== dp[k] && cfg.present.includes(pid as PartId)) out.push(`${PARTS.find((p) => p.id === pid)!.name} → GPIO${v}`);
  }
  for (const c of CARDS) if (cfg.cards[c.id] !== dc[c.id] && c.needs.every((n) => cfg.present.includes(n))) out.push(`${c.name} ${cfg.cards[c.id] ? "켬" : "끔"}`);
  for (const c of CARDS)
    for (const p of c.params) {
      const k = `${c.id}.${p.key}`;
      if (Math.abs(cfg.params[k] - dpar[k]) > 1e-9 && cfg.cards[c.id]) out.push(`${c.name} ${p.label} ${dpar[k]}→${cfg.params[k]} ${p.unit}`);
    }
  if (cfg.flags && !cfg.flags.echoDiv && cfg.present.includes("sonar")) out.push("Echo 분압 없음");
  return out.length ? out.join(", ") : "기본 설정";
}

/* ── 1 환경 ── */
function EnvPane({ env, setEnv, variant, setVariant }: { env: EnvId; setEnv: (e: EnvId) => void; variant: string; setVariant: (v: string) => void }) {
  return (
    <div className="sim-envs">
      <p className="sim-hint">어떤 상황에서 시험할지 고르세요. 바꾸면 처음부터 다시 시작해요.</p>
      {ENVS.map((e, i) => (
        <Fragment key={e.id}>
        {(i === 0 || ENVS[i - 1].group !== e.group) && <p className="sim-group-h">{{ temp: "온도 — LAB 01 실측 부품으로", site: "현장 — 키트 부품이 필요해요", comm: "관제 통신 — LAB 01 통신 실험 기반" }[e.group]}</p>}
        <div className={`sim-env${env === e.id ? " on" : ""}`}>
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
        </Fragment>
      ))}
      <div className="sim-soon">
        <b>2차에서 더할 것</b>
        <ul>
          {LATER.map((n) => (
            <li key={n}>{n}</li>
          ))}
        </ul>
      </div>
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
  flags,
  setFlags,
}: {
  present: PartId[];
  setPresent: (f: (p: PartId[]) => PartId[]) => void;
  pins: Record<string, number>;
  setPins: (f: (p: Record<string, number>) => Record<string, number>) => void;
  issues: PinIssue[];
  flags: Flags;
  setFlags: (f: (p: Flags) => Flags) => void;
}) {
  const [auto, setAuto] = useState<{ text: string; short: boolean } | null>(null);
  const name = (id: PartId) => PARTS.find((p) => p.id === id)!.name;
  const runAuto = () => {
    const r = autoPins(new Set(present), pins);
    setPins(() => r.pins);
    const moved = r.moved.map((m) => `${name(m.part)}${PARTS.find((p) => p.id === m.part)!.pins.length > 1 ? ` ${m.pin}` : ""} ${m.from}→${m.to}`);
    const text = !r.moved.length && !r.short.length ? "옮길 핀이 없어요. 지금 배정에 겹치거나 맞지 않는 핀이 없어요." : `${moved.length ? `핀 ${moved.length}개를 옮겼어요: ${moved.join(", ")}.` : ""}${r.short.length ? ` 핀이 ${r.short.length}개 모자라요 (${[...new Set(r.short.map((x) => name(x.part)))].join(", ")}). 부품을 빼거나, 시리얼 모니터를 포기하고 TX · RX(1 · 3)를 직접 고르세요.` : ""}`;
    setAuto({ text: text.trim(), short: r.short.length > 0 });
  };
  const adcUsed = new Map<number, string>();
  for (const p of PARTS) if (present.includes(p.id)) for (const r of p.pins) if (r.kind === "adc") adcUsed.set(pins[`${p.id}.${r.key}`], p.name);
  const CLEAN = GPIOS.filter((g) => !FLASH.includes(g) && ![0, 1, 2, 3, 5, 12, 15].includes(g));
  const usedPins = PARTS.filter((p) => present.includes(p.id)).flatMap((p) => p.pins.map((r) => pins[`${p.id}.${r.key}`]));
  const cleanUsed = usedPins.filter((g) => CLEAN.includes(g)).length;
  return (
    <div className="sim-parts">
      <p className="sim-hint">꽂을 부품을 고르고 핀을 정하세요. 핀은 실제 ESP32 제약으로 검사해요. 3D 배선은 기본 핀 기준으로 보여요.</p>
      <div className="sim-quick" role="group" aria-label="빠르게 고르기">
        <button type="button" className="lab-btn sm" onClick={() => setPresent(() => defaultPresent())}>
          실측 6종만
        </button>
        <button type="button" className="lab-btn sm" onClick={() => setPresent(() => allParts())}>
          {PARTS.length}종 모두
        </button>
        <button type="button" className="lab-btn sm" onClick={runAuto}>
          빈 핀으로 자동 배정
        </button>
        <span className="sim-pinbudget">
          <span>
            쓸 만한 핀 <b>{cleanUsed}</b> / {CLEAN.length}
          </span>
          <small>부팅 · 플래시 · 시리얼 핀 제외</small>
        </span>
      </div>
      {auto && (
        <p className={`sim-auto${auto.short ? " short" : ""}`} role="status">
          {auto.text}
          <button type="button" className="sim-link" onClick={() => setAuto(null)}>
            닫기
          </button>
        </p>
      )}
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
        {PARTS.map((p, idx) => {
          const on = present.includes(p.id);
          const mine = issues.filter((i) => i.part === p.id);
          return (
            <Fragment key={p.id}>
            {(idx === 0 || PARTS[idx - 1].group !== p.group) && <li className="sim-group-h">{{ core: "LAB 01 실측 부품", kit: "키트 부품 — 빵빵한 아두이노 센서 키트에서", screen: "화면 — LAB 01 점검 1에서 쓴 3.5인치 TFT" }[p.group]}</li>}
            <li className={on ? "on" : ""}>
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
              {on && p.id === "sonar" && (
                <label className="sim-flag">
                  <input type="checkbox" checked={flags.echoDiv} onChange={(e) => setFlags((f) => ({ ...f, echoDiv: e.target.checked }))} />
                  <span>Echo 분압 (10 kΩ : 20 kΩ — 5 V → 약 3.3 V)</span>
                </label>
              )}
              {on && p.id === "tft" && (
                <div className="sim-preset" role="group" aria-label="화면 설정 파일">
                  <span>설정 파일</span>
                  <button type="button" aria-pressed={pins["tft.MOSI"] === 13} onClick={() => setPins((c) => ({ ...c, "tft.MOSI": 13 }))}>
                    고치기 전 <small>MOSI → GPIO13 (LAB 01 점검 1)</small>
                  </button>
                  <button type="button" aria-pressed={pins["tft.MOSI"] === 23} onClick={() => setPins((c) => ({ ...c, "tft.MOSI": 23 }))}>
                    고친 뒤 <small>MOSI → GPIO23</small>
                  </button>
                </div>
              )}
              {on &&
                mine.map((i, n) => (
                  <p key={n} className={`sim-issue ${i.sev}`}>
                    <b>{i.sev === "err" ? (i.bootFail ? "부팅 실패" : "동작 안 함") : i.sev === "warn" ? "주의" : "참고"}</b> {i.msg}
                  </p>
                ))}
              {on && <p className="sim-pnote">{p.note}</p>}
              {!on && <p className="sim-pnote off">{p.group === "core" ? "빠짐" : "안 꽂음"} — {p.off}</p>}
            </li>
            </Fragment>
          );
        })}
      </ul>
      <p className="sim-pnote">키트에서 뺀 것: 조이스틱 · 불꽃 감지(LAB 01에서 3165 mV에 고정돼 뺌), 포토인터럽트(돌릴 냉각팬이 실습키트에 없음), 심박 · 레이저 · 트래킹 등 ESS 감시와 관계없는 부품.</p>
    </div>
  );
}

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
      {CARDS.map((c, idx) => {
        const missing = c.needs.filter((n) => !present.includes(n));
        const has = (n: PartId) => present.includes(n);
        const usable = cardUsable(c, has);
        const anyMissing = c.any && !c.any.some(has) ? c.any : null;
        const on = cards[c.id] && usable;
        const changed = c.params.some((p) => Math.abs(params[`${c.id}.${p.key}`] - dpar[`${c.id}.${p.key}`]) > 1e-9);
        return (
          <Fragment key={c.id}>
          {(idx === 0 || CARDS[idx - 1].group !== c.group) && <p className="sim-group-h">{{ temp: "온도", elec: "전기", site: "현장 (키트 부품)", comm: "관제 통신" }[c.group]}</p>}
          <div className={`sim-card${on ? " on" : ""}${usable ? "" : " na"}${c.combo ? " combo" : ""}`}>
            <div className="sim-card-h">
              <button type="button" className="sim-switch" role="switch" aria-checked={on} aria-label={`${c.name} 켜기`} disabled={!usable} onClick={() => setCards((cur) => ({ ...cur, [c.id]: !cur[c.id] }))}>
                <i />
              </button>
              <b>{c.name}</b>
              {c.combo && <span className="sim-tag combo">조합</span>}
              <span className="sim-out">→ {c.out}</span>
            </div>
            <p className="sim-card-t">{c.text}</p>
            {!usable && (
              <p className="sim-card-need">
                필요한 부품: {[...missing.map((n) => PARTS.find((p) => p.id === n)!.name), ...(anyMissing ? [anyMissing.map((n) => PARTS.find((p) => p.id === n)!.name).join(" 또는 ")] : [])].join(", ")}
              </p>
            )}
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
          </Fragment>
        );
      })}
      <div className="sim-fixed">
        <b>늘 켜져 있는 규칙</b>
        <ul>
          <li>위험이면 히터 차단 · 잠금 — 사람이 확인하고 <kbd>x</kbd>로 풀기 전까지 다시 켜지 않음</li>
          <li>단계는 두 번 연속(1초)이면 올리고, 열 번 연속(5초)이면 내림 · 내릴 때 0.3 °C 여유</li>
          <li>셀 60 °C 초과 또는 히터 10분 연속이면 무조건 정지</li>
          <li>현장 카드(충격 · 기울기 · 결로 · 누수 · 정비)는 충전만 멈추고 잠그지 않음 — 원인이 풀리면 <kbd>h</kbd>로 다시 켬</li>
          <li>버저가 있으면 경고에서 느리게, 위험에서 빠르게 울림 · 버튼이 있으면 현장에서 <kbd>x</kbd>와 같은 차단 해제</li>
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

/* ── 키트 부품 신호 ── */
function KitStrip({ s, has }: { s: Sim; has: (p: PartId) => boolean }) {
  const st = s.site;
  const items: { id: PartId; label: string; val: string; alert: boolean }[] = [];
  const add = (id: PartId, label: string, val: string, alert: boolean) => {
    if (has(id)) items.push({ id, label, val: s.ok(id) ? val : id === "tft" ? "안 켜짐 (핀 오류)" : "핀 오류", alert: s.ok(id) ? alert : true });
  };
  add("dtmod", "온도 스위치", st.dtmodOn ? "동작" : "꺼짐", st.dtmodOn);
  add("dht", "DHT11", st.dhtT === null ? "읽는 중" : `${st.dhtT} °C · ${st.dhtRH} % · 이슬점 ${st.dew?.toFixed(1) ?? "—"} °C`, s.halt === "결로 위험");
  add("sonar", "바닥 물 (초음파)", st.floorMm === null ? "재는 중" : `${Math.max(0, st.floorMm).toFixed(1)} mm`, s.halt === "바닥 누수");
  add("accel", "가속도", `${st.tilt.toFixed(0)}° · 충격 ${st.shock.toFixed(1)} g`, st.tilt >= 5 || st.shock >= 0.3);
  add("tilt", "기울기 스위치", st.tilt > 25 ? "기울어짐" : "수평", st.tilt > 25);
  add("vib", "진동 스위치", st.shock > 0.5 ? "흔들림" : "조용", st.shock > 0.5);
  add("reed", "함체 문", st.door ? "열림" : "닫힘", st.door);
  add("pir", "인체감지", st.pirOut ? "감지" : "없음", st.pirOut);
  add("buzz", "버저", st.beep === "none" ? "조용" : st.beep === "fast" ? "삐삐삐" : "삐—", st.beep !== "none");
  add("tft", "화면", s.bootFail ? "꺼짐" : "표시 중", false);
  if (!items.length) return null;
  return (
    <ul className="sim-kit" aria-label="키트 부품 신호">
      {items.map((i) => (
        <li key={i.id} className={i.alert ? "alert" : ""}>
          <span>{i.label}</span>
          <b>{i.val}</b>
        </li>
      ))}
    </ul>
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
const VMARK: Record<Score["verdict"], string> = { pass: "✓", partial: "◐", late: "!", miss: "✕", false: "!", boot: "✕", idle: "–" };
function ScoreCard({ score, expect, kind, fromHeater, lab01, eventLabel }: { score: Score; expect: string; kind: string; fromHeater: boolean; lab01: boolean; eventLabel: string | null }) {
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
        {eventLabel ? (
          <div>
            <dt>{eventLabel} 뒤 정지</dt>
            <dd>{score.react === null ? "없음" : `${score.react.toFixed(1)} s`}</dd>
          </div>
        ) : (
          <div>
            <dt>히터 차단</dt>
            <dd>{score.cut === null ? "없음" : `${score.cut.toFixed(1)} s`}</dd>
          </div>
        )}
        {kind === "dew" && (
          <div>
            <dt>물 맺히기 전</dt>
            <dd>{score.dewLead === null ? "—" : score.dewLead >= 0 ? `${score.dewLead.toFixed(0)} s 전` : `${(-score.dewLead).toFixed(0)} s 늦음`}</dd>
          </div>
        )}
        {kind === "leak" && (
          <div>
            <dt>멈출 때 물</dt>
            <dd>{score.waterAt === null ? "—" : `${score.waterAt.toFixed(1)} mm`}</dd>
          </div>
        )}
        {kind !== "dew" && kind !== "leak" && (
          <div>
            <dt>실제 셀 최고</dt>
            <dd>+{score.peakTruth.toFixed(2)} °C</dd>
          </div>
        )}
        <div>
          <dt>잘못된 경보</dt>
          <dd>{score.falseAlarms}번</dd>
        </div>
        <div>
          <dt>PC 기록 도착</dt>
          <dd>
            {score.comm.recv} / {score.comm.made}
          </dd>
        </div>
        <div>
          <dt>부품 · 핀</dt>
          <dd>
            {score.parts}종 · {score.pinsUsed}핀
          </dd>
        </div>
      </dl>
      <p className="sim-note">{!fromHeater ? "시각은 시작부터 셉니다." : lab01 ? "시각은 히터를 켠 때부터 셉니다. LAB 01 실측: 첫 경보 11초 · 차단 65초." : "시각은 히터(충전)를 켠 때부터 셉니다."}</p>
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
      <div className="rc-table-wrap" tabIndex={0} role="region" aria-label="최근 실행 비교표">
        <table className="rc-table">
          <thead>
            <tr>
              <th scope="col">#</th>
              <th scope="col">환경</th>
              <th scope="col">바꾼 것</th>
              <th scope="col">결과</th>
              <th scope="col">첫 경보</th>
              <th scope="col">차단 · 정지</th>
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
                <td>{r.score.react !== null ? `사건 뒤 ${r.score.react.toFixed(1)} s` : r.score.cut === null ? "—" : `${r.score.cut.toFixed(1)} s`}</td>
                <td>+{r.score.peakTruth.toFixed(2)} °C</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
