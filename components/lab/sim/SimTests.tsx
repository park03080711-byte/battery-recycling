"use client";

import { useState } from "react";
import { ENVS, EXPECT_LABEL, PARTS, type Env } from "./catalog";
import { SEED, Sim, type Config, type Score } from "./engine";

/* 시험 도구
   ① 종합 시험: 지금 설정을 모든 환경(센서 이상은 두 가지)에 돌려 한 표로
   ② 반복 시험: 지금 환경을 잡음만 바꿔 50번 — 운이 아니라 실력인지 */

type Row = { env: Env; variant?: { id: string; name: string }; score: Score };
const N = 50;
const OK = new Set<Score["verdict"]>(["pass"]);
const MID = new Set<Score["verdict"]>(["partial", "late"]);
const VERDICT_KO: Record<Score["verdict"], string> = { pass: "통과", partial: "부분 통과", late: "늦음", miss: "놓침", false: "잘못된 경보", boot: "부팅 실패", idle: "시작 못 함" };

/** 환경마다 가장 중요한 시각 하나 */
function keyTime(env: Env, sc: Score): { label: string; v: number | null; unit: string } {
  if (env.expect === "quiet") return { label: "잘못된 경보", v: sc.falseAlarms, unit: "번" };
  if (env.expect === "trip" || env.expect === "keep") return { label: "히터 켠 뒤 차단", v: sc.cut, unit: "s" };
  return { label: `${env.eventLabel} 뒤 정지`, v: sc.react, unit: "s" };
}
const fmtKey = (k: ReturnType<typeof keyTime>) => (k.v === null ? "없음" : k.unit === "번" ? `${k.v}번` : `${k.v.toFixed(1)} s`);

export function SimTests({ cfg }: { cfg: Config }) {
  const [all, setAll] = useState<{ key: string; rows: Row[] } | null>(null);
  const [rep, setRep] = useState<{ key: string; env: Env; variant?: string; scores: Score[] } | null>(null);
  const [busy, setBusy] = useState<"all" | "rep" | null>(null);
  const key = JSON.stringify(cfg);

  const runAll = () => {
    setBusy("all");
    setTimeout(() => {
      const rows: Row[] = [];
      for (const env of ENVS) {
        const vs = env.variants ?? [undefined];
        for (const v of vs) rows.push({ env, variant: v, score: new Sim({ ...cfg, env: env.id, variant: v?.id, seed: SEED }).runAll().score() });
      }
      setAll({ key, rows });
      setBusy(null);
    }, 30);
  };
  const runRep = () => {
    setBusy("rep");
    setTimeout(() => {
      const scores: Score[] = [];
      for (let sd = 1; sd <= N; sd++) scores.push(new Sim({ ...cfg, seed: sd }).runAll().score());
      setRep({ key, env: ENVS.find((e) => e.id === cfg.env)!, variant: cfg.variant, scores });
      setBusy(null);
    }, 30);
  };

  const allNow = all && all.key === key ? all : null;
  const repNow = rep && rep.key === key ? rep : null;
  const envNow = ENVS.find((e) => e.id === cfg.env)!;
  const parts = cfg.present.length;
  const pins = PARTS.filter((p) => cfg.present.includes(p.id)).reduce((a, p) => a + p.pins.length, 0);

  return (
    <section className="rc-panel sim-tests" aria-labelledby="sim-tests-h">
      <div className="sim-tests-h">
        <h3 id="sim-tests-h">시험 도구</h3>
        <p>지금 설정(부품 {parts}종 · 핀 {pins}개)을 한꺼번에 시험해요.</p>
        <div className="sim-tests-btns">
          <button type="button" className="lab-btn" onClick={runAll} disabled={busy !== null}>
            {busy === "all" ? "시험 중…" : "모든 환경 시험"}
          </button>
          <button type="button" className="lab-btn" onClick={runRep} disabled={busy !== null}>
            {busy === "rep" ? "시험 중…" : `이 환경 ${N}번 반복`}
          </button>
        </div>
      </div>

      {all && !allNow && <p className="sim-tests-old">설정이 바뀌었어요. 다시 시험하면 새 설정으로 계산해요.</p>}
      {allNow && <AllTable rows={allNow.rows} parts={parts} pins={pins} />}

      {rep && !repNow && !allNow && <p className="sim-tests-old">설정이 바뀌었어요. 다시 시험하면 새 설정으로 계산해요.</p>}
      {repNow && <RepeatView env={repNow.env} variant={repNow.variant} scores={repNow.scores} />}

      {!allNow && !repNow && (
        <p className="sim-tests-empty">
          <b>모든 환경 시험</b>은 한 환경에만 맞춘 설정이 다른 환경에서 문제를 일으키는지 보여 줘요. <b>{N}번 반복</b>은 잡음만 바꿔 {envNow.name} 환경을 다시 돌려, 한 번 통과한 게 운이었는지 확인해요.
        </p>
      )}
    </section>
  );
}

function AllTable({ rows, parts, pins }: { rows: Row[]; parts: number; pins: number }) {
  const pass = rows.filter((r) => OK.has(r.score.verdict)).length;
  const mid = rows.filter((r) => MID.has(r.score.verdict)).length;
  const fail = rows.length - pass - mid;
  return (
    <div className="sim-all">
      <div className="sim-all-sum">
        <p>
          <b>
            {rows.length}가지 중 {pass}가지 통과
          </b>
          <span>
            부분 · 늦음 {mid} · 실패 {fail} · 부품 {parts}종 · 핀 {pins}개
          </span>
        </p>
        <div className="sim-all-bar" role="img" aria-label={`통과 ${pass}, 부분 ${mid}, 실패 ${fail}`}>
          {rows.map((r, i) => (
            <i key={i} className={`v-${r.score.verdict}`} title={`${r.env.name}${r.variant ? ` (${r.variant.name})` : ""}: ${r.score.title}`} />
          ))}
        </div>
      </div>
      <div className="rc-table-wrap">
        <table className="rc-table">
          <thead>
            <tr>
              <th scope="col">환경</th>
              <th scope="col">정답</th>
              <th scope="col">결과</th>
              <th scope="col">핵심 시각</th>
              <th scope="col">실제 셀 최고</th>
              <th scope="col">PC 기록</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => {
              const k = keyTime(r.env, r.score);
              return (
                <tr key={i}>
                  <th scope="row">
                    {r.env.name}
                    {r.variant && <small> · {r.variant.name}</small>}
                  </th>
                  <td>{EXPECT_LABEL[r.env.expect]}</td>
                  <td>
                    <span className={`sim-res v-${r.score.verdict}`} title={r.score.detail}>
                      {r.score.title}
                    </span>
                  </td>
                  <td>
                    <small>{k.label}</small> {fmtKey(k)}
                  </td>
                  <td>+{r.score.peakTruth.toFixed(2)} °C</td>
                  <td>
                    {r.score.comm.recv}/{r.score.comm.made}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function RepeatView({ env, variant, scores }: { env: Env; variant?: string; scores: Score[] }) {
  const n = scores.length;
  const counts = new Map<Score["verdict"], number>();
  scores.forEach((s) => counts.set(s.verdict, (counts.get(s.verdict) ?? 0) + 1));
  const pass = counts.get("pass") ?? 0;
  const ks = scores.map((s) => keyTime(env, s));
  const vals = ks.map((k) => k.v).filter((v): v is number => v !== null).sort((a, b) => a - b);
  const fa = scores.map((s) => s.firstAlarm).filter((v): v is number => v !== null).sort((a, b) => a - b);
  const med = (a: number[]) => (a.length ? a[Math.floor(a.length / 2)] : null);
  const unit = ks[0]?.unit ?? "s";
  const lo = vals.length ? vals[0] : 0,
    hi = vals.length ? vals[vals.length - 1] : 1;
  const span = Math.max(hi - lo, unit === "번" ? 1 : 2);
  const x0 = unit === "번" ? 0 : Math.floor(lo - span * 0.1),
    x1 = Math.ceil(hi + span * 0.1);
  const vName = env.variants?.find((v) => v.id === variant)?.name;
  return (
    <div className="sim-rep">
      <div className="sim-rep-big">
        <b>{Math.round((pass / n) * 100)}%</b>
        <span>
          통과율 · {env.name}
          {vName ? ` (${vName})` : ""} · 잡음 {n}가지
        </span>
      </div>
      <ul className="sim-rep-counts">
        {[...counts.entries()]
          .sort((a, b) => b[1] - a[1])
          .map(([v, c]) => (
            <li key={v}>
              <span className={`sim-res v-${v}`}>{VERDICT_KO[v]}</span> <b>{c}</b>번
            </li>
          ))}
      </ul>
      <div className="sim-rep-dist">
        <p>
          <b>{ks[0]?.label}</b>
          {vals.length ? (
            <span>
              {" "}
              {unit === "번" ? `${lo}~${hi}번` : `${lo.toFixed(1)}~${hi.toFixed(1)} s`} · 가운데값 {unit === "번" ? `${med(vals)}번` : `${med(vals)!.toFixed(1)} s`}
              {vals.length < n && ` · ${n - vals.length}번은 없음`}
            </span>
          ) : (
            <span> 한 번도 없음</span>
          )}
        </p>
        {vals.length > 0 && <DotPlot vals={vals} x0={x0} x1={x1} med={med(vals)!} step={unit === "번" ? 1 : 0.5} />}
        {vals.length > 0 && (
          <div className="sim-rep-axis">
            <span>{unit === "번" ? x0 : x0.toFixed(0)}</span>
            <span>{unit === "번" ? `${x1}번` : `${x1.toFixed(0)} s`}</span>
          </div>
        )}
        {fa.length > 0 && env.expect !== "quiet" && (
          <p className="sim-rep-fa">
            첫 경보 {fa[0].toFixed(1)}~{fa[fa.length - 1].toFixed(1)} s (가운데 {med(fa)!.toFixed(1)} s)
          </p>
        )}
      </div>
      <p className="sim-note">점 하나가 실행 한 번이에요. 기준값을 낮추면 점들이 왼쪽(빨리)으로 가지만, 방 온도 같은 환경에서 잘못된 경보가 늘 수 있어요 — 모든 환경 시험과 같이 보세요.</p>
    </div>
  );
}

/** 점 그림: 같은 값은 위로 쌓는다 (점 하나 = 실행 한 번) */
function DotPlot({ vals, x0, x1, med, step }: { vals: number[]; x0: number; x1: number; med: number; step: number }) {
  const bins = new Map<number, number>();
  vals.forEach((v) => {
    const k = Math.round(v / step) * step;
    bins.set(k, (bins.get(k) ?? 0) + 1);
  });
  const maxN = Math.max(...bins.values());
  const D = 8;
  const pct = (v: number) => ((v - x0) / Math.max(1e-9, x1 - x0)) * 100;
  return (
    <div className="sim-dots" style={{ height: maxN * (D + 2) + 6 }} role="img" aria-label={`실행 ${vals.length}번의 값 분포, 가운데값 ${med}`}>
      <span className="sim-dots-med" style={{ left: `${pct(med)}%` }} aria-hidden="true" />
      {[...bins.entries()].flatMap(([k, n]) =>
        Array.from({ length: n }, (_, i) => <i key={`${k}-${i}`} style={{ left: `${pct(k)}%`, bottom: 3 + i * (D + 2) }} />)
      )}
    </div>
  );
}
