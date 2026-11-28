"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { CrChart } from "./CrChart";
import { buildRun, explain, LV, mmss, mmssd, reach, riskParts, RULE, viewAt, type Lv, type Row } from "./engine";

const SPEEDS = [1, 10, 30] as const;
type Speed = (typeof SPEEDS)[number];
type Perm = "na" | "default" | "granted" | "denied";

/* 단계 아이콘: 색만이 아니라 모양으로도 구분 (정상 ○ · 주의 ▲ · 경고 ▲! · 위험 ⯃) */
function LvIcon({ lv }: { lv: Lv }) {
  if (lv === 0)
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" strokeWidth="3" />
      </svg>
    );
  if (lv === 1)
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 3l9.5 17h-19z" fill="currentColor" />
      </svg>
    );
  if (lv === 2)
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 3l9.5 17h-19z" fill="currentColor" />
        <path d="M12 9.5v4.5" stroke="var(--cr-cut)" strokeWidth="2.4" strokeLinecap="round" />
        <circle cx="12" cy="17" r="1.3" fill="var(--cr-cut)" />
      </svg>
    );
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M8 2.5h8l5.5 5.5v8L16 21.5H8L2.5 16V8z" fill="currentColor" />
      <path d="M8 12h8" stroke="var(--cr-cut)" strokeWidth="2.6" strokeLinecap="round" />
    </svg>
  );
}

const TERM_LV = ["NORM", "CAUT", "WARN", "DANG"];

/* 브라우저 알림 권한 (허용 · 거부가 바뀌면 다시 읽음) */
const readPerm = (): Perm => (typeof window !== "undefined" && "Notification" in window ? (Notification.permission as Perm) : "na");
function subscribePerm(cb: () => void) {
  let st: PermissionStatus | null = null;
  navigator.permissions
    ?.query({ name: "notifications" as PermissionName })
    .then((s) => {
      st = s;
      s.addEventListener("change", cb);
    })
    .catch(() => {});
  return () => st?.removeEventListener("change", cb);
}

export function ControlRoom({ rows }: { rows: Row[] }) {
  const run = useMemo(() => buildRun(rows), [rows]);
  const span = run.span;
  const [T, setT] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [started, setStarted] = useState(false);
  const [speed, setSpeed] = useState<Speed>(10);
  const [notifOn, setNotifOn] = useState(false);
  const [say, setSay] = useState("");
  const tRef = useRef(0);
  const speedRef = useRef<Speed>(10);

  const view = useMemo(() => viewAt(run, T, 7), [run, T]);
  const { last, cut } = view;
  const lv: Lv = last ? last.lv : 0;

  /* 재생 시계: 0.1초마다 실제 흐른 시간 × 배속만큼 T를 민다.
     (탭이 뒤로 가도 interval은 느리게나마 돌아서 시간은 계속 흐른다 → 알림 가능) */
  useEffect(() => {
    if (!playing) return;
    let prev = performance.now();
    const id = window.setInterval(() => {
      const now = performance.now();
      const next = Math.min(span, tRef.current + ((now - prev) / 1000) * speedRef.current);
      prev = now;
      tRef.current = next;
      setT(next);
      if (next >= span) setPlaying(false);
    }, 100);
    return () => window.clearInterval(id);
  }, [playing, span]);

  const seek = useCallback((t: number, play?: boolean) => {
    const v = Math.max(0, Math.min(span, t));
    tRef.current = v;
    setT(v);
    setStarted(true);
    if (play !== undefined) setPlaying(play);
  }, [span]);

  const toggle = () => {
    setStarted(true);
    if (!playing && tRef.current >= span - 0.05) seek(0);
    setPlaying((p) => !p);
  };

  /* 알림: 허용한 사람만, 이 탭을 보고 있지 않을 때, 위험 단계 · 통신 끊김만 */
  const perm = useSyncExternalStore(subscribePerm, readPerm, () => "na" as Perm);
  const askNotify = async () => {
    if (perm === "granted") return setNotifOn((v) => !v);
    if (perm !== "default") return;
    try {
      setNotifOn((await Notification.requestPermission()) === "granted");
    } catch {
      setNotifOn(false);
    }
  };

  const prevLv = useRef<Lv>(0);
  const prevCut = useRef(false);
  useEffect(() => {
    const lvUp = lv !== prevLv.current;
    const cutChg = cut !== prevCut.current;
    const wasLv = prevLv.current;
    prevLv.current = lv;
    prevCut.current = cut;
    if (!playing || (!lvUp && !cutChg)) return;
    let msg = "";
    if (cutChg) msg = cut ? "통신 끊김. 마지막으로 받은 상태를 보여 줍니다." : "다시 연결됨. 밀린 기록이 들어옵니다.";
    if (lvUp && last) msg = `${LV[lv]} 단계. ${explain(run, last).title}.` + (msg ? ` ${msg}` : "");
    setSay(msg);
    const notify = (title: string, body: string) => {
      if (!notifOn || document.visibilityState === "visible") return;
      try {
        new Notification(title, { body, tag: "re-cell-control-room" });
      } catch {
        /* 휴대폰 브라우저는 페이지에서 바로 알림을 못 띄움 — 화면 안 경보로 충분 */
      }
    };
    if (lvUp && lv === 3 && wasLv < 3 && last) notify("관제실 · 위험 단계", `ΔT ${last.dT.toFixed(2)} °C · 히터 자동 차단`);
    if (cutChg && cut) notify("관제실 · 통신 끊김", "ESP32는 판정과 차단을 계속합니다. 기록은 다시 연결되면 들어옵니다.");
  }, [lv, cut, playing, last, notifOn, run]);

  const jumps = [
    run.marks.heatOn && { k: "heat", t: "히터 켜짐", at: run.marks.heatOn.pc - 4, tick: run.marks.heatOn.pc },
    run.marks.trip && { k: "trip", t: "차단", at: run.marks.trip.pc - 8, tick: run.marks.trip.pc },
    run.gap && { k: "cut", t: "끊김", at: run.gap.from - 2, tick: run.gap.from },
  ].filter(Boolean) as { k: string; t: string; at: number; tick: number }[];

  // ── 값 ──
  const r = last;
  const why = r ? explain(run, r) : { title: "수신 대기", detail: "아직 받은 기록이 없습니다" };
  const parts = r ? riskParts(r) : [];
  const rtt = !cut && r ? view.arrivals[view.arrivals.length - 1]?.rtt ?? r.rtt : null;
  const gapS = Math.round(view.gap);
  const burst = view.burst > 3;
  const reached = reach(run);
  const REACH_MAX = 130;
  const log = [...view.events].sort((a, b) => a.es - b.es).slice(-5).reverse();
  const etaWarn = r && r.eta > 0 && r.eta < RULE.etaS;

  return (
    <section className="cr" aria-label="관제 화면">
      <div className={`cr-console${started ? "" : " is-idle"}`} data-lv={lv} data-cut={cut || undefined}>
        <div className="cr-body" inert={!started}>
        <div className="cr-bar">
          <span className="cr-name">관제 화면</span>
          <span className="cr-src">comm_run1 · 2026-11-14</span>
          <span className="cr-clock">
            PC 수신 <b>{mmss(T)}</b>
            <i aria-hidden="true">·</i>
            장치 <b>{mmss(view.esNow)}</b>
          </span>
          {perm !== "na" && (
            <button
              type="button"
              className="cr-notify"
              onClick={askNotify}
              disabled={perm === "denied"}
              aria-pressed={perm === "granted" ? notifOn : undefined}
              title={perm === "denied" ? "브라우저 설정에서 이 사이트 알림을 허용해야 해요" : "이 탭을 보고 있지 않을 때 위험 단계 · 통신 끊김만 알려요"}
            >
              <svg viewBox="0 0 16 16" aria-hidden="true">
                <path d="M8 1.8a4 4 0 0 0-4 4v2.6L2.6 11h10.8L12 8.4V5.8a4 4 0 0 0-4-4zM6.4 12.6a1.6 1.6 0 0 0 3.2 0" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
              </svg>
              {perm === "denied" ? "알림 막힘" : perm === "granted" ? (notifOn ? "알림 켜짐" : "알림 꺼짐") : "알림 받기"}
            </button>
          )}
          <span className={`cr-pill${cut ? " bad" : ""}`}>
            <i aria-hidden="true" />
            {!view.n ? "연결 대기" : cut ? `통신 끊김 ${gapS} s` : burst ? "밀린 기록 수신 중" : rtt ? `연결됨 · ${rtt} ms` : "연결됨"}
          </span>
        </div>

        {cut && (
          <div className="cr-alert" role="status">
            <b>마지막 수신 {gapS}초 전.</b> 아래 값은 마지막으로 받은 상태예요. 장치는 판정 · 차단을 계속하고, 기록은 다시 연결되면 들어옵니다.
          </div>
        )}

        {/* 신호 경로 */}
        <div className="cr-path">
          <p className="cr-path-h">SIGNAL PATH · 1 s 주기</p>
          <ol>
            <li className="cr-node">
              <b>ESP32</b>
              <span>측정 · 판정 · 차단</span>
              <code>{r ? `seq #${r.seq} · ${mmssd(r.es)}` : "—"}</code>
            </li>
            <li className={`cr-link${cut ? " bad" : burst ? " burst" : ""}`}>
              <span>{cut ? `Wi-Fi 끊김 · ${gapS} s` : burst ? `밀린 기록 한꺼번에 · 초당 ${view.burst}개` : "UDP 패킷 → ← ACK"}</span>
              <code>
                버퍼 {cut ? `약 ${view.pending}` : 0} / {RULE.ring} · 재전송 {view.resent}
              </code>
            </li>
            <li className="cr-node">
              <b>PC 수신</b>
              <span>pc_receiver.py</span>
              <code>{cut ? `마지막 수신 ${gapS} s 전` : rtt !== null && view.n ? `왕복 ${rtt} ms · 중복 ${view.dups}` : "대기"}</code>
            </li>
            <li className="cr-link short">
              <span>화면 갱신</span>
              <code>0.1 s</code>
            </li>
            <li className="cr-node is-here">
              <b>관제실</b>
              <span>이 화면</span>
              <code>
                받은 기록 {view.seen.length} / {run.total}
              </code>
            </li>
          </ol>
        </div>

        <div className="cr-grid">
          <div className={`cr-tile cr-lvl l${lv}`}>
            <p className="cr-k">
              현재 단계{cut ? " · 마지막 수신" : ""}
              <span>LV {lv}</span>
            </p>
            <p className="cr-badge">
              <LvIcon lv={lv} />
              {LV[lv]}
            </p>
            <p className="cr-reason">
              {why.title}
              <small>{why.detail}</small>
            </p>
            <ol className="cr-ladder" aria-label="단계">
              {LV.map((n, i) => (
                <li key={n} className={i <= lv ? `on l${lv}` : ""} aria-current={i === lv ? "step" : undefined}>
                  {n}
                </li>
              ))}
            </ol>
          </div>

          <div className="cr-tile">
            <p className="cr-k">
              셀 − 주변 ΔT<span>DS18B20 − NTC</span>
            </p>
            <p className="cr-v">
              {r ? r.dT.toFixed(2) : "—"}
              <small>°C</small>
            </p>
            <p className="cr-s">{r ? `${r.slope >= 0 ? "▲" : "▼"} ${Math.abs(r.slope).toFixed(4)} °C/s` : " "}</p>
          </div>

          <div className={`cr-tile${etaWarn && r && r.dT >= RULE.dt[0] ? " hot" : ""}`}>
            <p className="cr-k">
              4 °C 도달 예측<span>(4 − ΔT) ÷ 기울기</span>
            </p>
            <p className="cr-v">
              {r && r.eta > 0 ? r.eta : "—"}
              <small>{r && r.eta > 0 ? "s" : ""}</small>
            </p>
            <p className="cr-s">
              {!r ? " " : r.eta > 0 ? (etaWarn ? (r.dT >= RULE.dt[0] ? "30 s 미만 · 경고 조건" : "ΔT 2 °C 미만이라 예측 경고 쉼") : "경고 기준 30 s 미만") : r.trip ? "차단 뒤 식는 중" : "오르지 않음"}
            </p>
          </div>

          <div className="cr-tile">
            <p className="cr-k">
              히터 · 릴레이<span>GPIO 22</span>
            </p>
            <p className={`cr-heat${r?.heat ? "" : " off"}${r?.trip ? " trip" : ""}`}>
              <i aria-hidden="true" />
              {!r ? "—" : r.heat ? "켜짐" : r.trip ? "차단" : "꺼짐"}
            </p>
            <p className="cr-s">{r ? `${r.mA.toFixed(1)} mA · ${(r.mV / 1000).toFixed(2)} V` : " "}</p>
          </div>

          <div className="cr-tile cr-risk">
            <p className="cr-k">
              위험지수<span>AHP 0 ~ 100</span>
            </p>
            <p className="cr-v">
              {r ? r.risk : "—"}
              <small>/ 100</small>
            </p>
            <ul className="cr-contrib" aria-label="항목별 기여 (기록값으로 다시 계산)">
              {(parts.length ? parts : riskParts({ dT: 0, slope: 0, mA: 0, mV: RULE.mV.nominal })).map((p) => (
                <li key={p.k}>
                  <span>{p.k}</span>
                  <b>
                    <i style={{ width: `${(p.v / p.max) * 100}%` }} />
                  </b>
                  <em>{Math.round(p.v)}</em>
                </li>
              ))}
            </ul>
          </div>

          <div className="cr-tile cr-reach">
            <p className="cr-k">
              히터 켠 뒤 단계 도달<span>장치 시각 차이</span>
            </p>
            {run.marks.heatOn && run.marks.heatOn.pc <= T ? (
              <>
                <div className="cr-reach-track" aria-hidden="true">
                  <span className="cr-reach-rail" />
                  <span className="cr-reach-0">ON</span>
                  {reached
                    .filter((x) => x.lv > 0)
                    .map((x) => {
                      const s = x.ev.es - x.from.es;
                      const on = x.ev.pc <= T;
                      return (
                        <span key={x.k} className={`cr-reach-mk l${x.lv}${on ? " on" : ""}`} style={{ left: `${(s / REACH_MAX) * 100}%` }}>
                          <em>{on ? `+${s.toFixed(1)} s` : ""}</em>
                        </span>
                      );
                    })}
                  {last && !last.trip && <span className="cr-reach-now" style={{ left: `${Math.min(100, ((last.es - run.marks.heatOn.es) / REACH_MAX) * 100)}%` }} />}
                </div>
                <dl className="cr-reach-list">
                  {reached.map((x) => {
                    const on = x.ev.pc <= T;
                    return (
                      <div key={x.k} className={on ? `on l${x.lv}` : ""}>
                        <dt>{x.k}</dt>
                        <dd>{on ? `${x.lv === 0 ? "차단 뒤 " : ""}+${(x.ev.es - x.from.es).toFixed(1)} s` : "—"}</dd>
                      </div>
                    );
                  })}
                </dl>
              </>
            ) : (
              <p className="cr-s cr-empty">히터가 켜지면 단계마다 걸린 시간을 잽니다.</p>
            )}
          </div>

          <div className="cr-tile cr-chart">
            <p className="cr-k">
              온도차 ΔT · 장치 시각<span>격자 20 s · 0.5 °C</span>
            </p>
            <CrChart run={run} view={view} />
          </div>

          <div className="cr-side">
            <div className="cr-tile">
              <p className="cr-k">
                경보 기록<span>최근 5건</span>
              </p>
              {log.length ? (
                <ul className="cr-log">
                  {log.map((e) => {
                    const lateE = e.pc - (e.es - run.offset) > 3 && e.kind !== "boot" && e.kind !== "back" && e.kind !== "cut";
                    const tag = e.kind === "cut" || e.kind === "back" || e.kind === "boot" ? "통신" : e.kind.startsWith("heat") ? "히터" : LV[e.lv ?? 0];
                    const cls = e.kind === "cut" || e.kind === "back" || e.kind === "boot" || e.kind.startsWith("heat") ? "tc" : `t${e.lv}`;
                    return (
                      <li key={`${e.kind}${e.es}`}>
                        <time>{mmss(e.es)}</time>
                        <span className={`cr-t ${cls}`}>{tag}</span>
                        <p>
                          {e.title}
                          {lateE && <em className="cr-late-tag">늦게 받음</em>}
                          {e.detail && <small>{e.detail}</small>}
                        </p>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="cr-s cr-empty">아직 사건이 없습니다.</p>
              )}
            </div>
            <div className="cr-term" role="log" aria-label="수신 패킷 (최근 7개)">
              <p className="cr-term-h">
                <span>수신 패킷</span>
                <span>
                  {view.seen.length} / {run.total}
                </span>
              </p>
              {view.arrivals.map((p) => (
                <div key={p.i} className="cr-row">
                  <span className="d">{mmssd(p.es)}</span> #{String(p.seq).padStart(3, "0")} <span className="w">ΔT</span>{" "}
                  <span className={`l${p.lv}`}>{p.dT.toFixed(2).padStart(5, " ")}</span> <span className={p.lv ? `l${p.lv}` : "ok"}>{TERM_LV[p.lv]}</span>{" "}
                  <span className="d">
                    {p.dup ? "dup" : `${p.rtt}ms`}
                    {p.tx > 1 ? ` tx${p.tx}` : ""}
                  </span>
                </div>
              ))}
              {cut && <div className="cr-row l1">-- {gapS} s 동안 수신 없음 · 재연결 대기 --</div>}
              <div className="cr-row cr-cur" aria-hidden="true" />
            </div>
          </div>
        </div>

        {/* 재생 막대 */}
        <div className="cr-play">
          <button type="button" className="cr-btn" onClick={toggle} aria-label={playing ? "일시정지" : T >= span - 0.05 ? "처음부터 다시" : "재생"}>
            {playing ? (
              <svg viewBox="0 0 16 16" aria-hidden="true">
                <rect x="3" y="2" width="3.5" height="12" />
                <rect x="9.5" y="2" width="3.5" height="12" />
              </svg>
            ) : (
              <svg viewBox="0 0 16 16" aria-hidden="true">
                <path d="M4 2l10 6-10 6z" />
              </svg>
            )}
          </button>
          <div className="cr-speed" role="group" aria-label="재생 배속">
            {SPEEDS.map((s) => (
              <button key={s} type="button" aria-pressed={speed === s} onClick={() => {
                speedRef.current = s;
                setSpeed(s);
              }}>
                ×{s}
              </button>
            ))}
          </div>
          <div className="cr-track">
            <div className="cr-ticks">
              {jumps.map((j) => (
                <button key={j.k} type="button" style={{ left: `${(j.tick / span) * 100}%` }} onClick={() => seek(j.at, true)} aria-label={`${j.t} 직전으로 이동`}>
                  {j.t}
                </button>
              ))}
            </div>
            <input
              type="range"
              min={0}
              max={span}
              step={0.1}
              value={T}
              onChange={(e) => seek(Number(e.target.value))}
              aria-label="재생 위치 (PC 수신 시각)"
              aria-valuetext={`PC 수신 ${mmss(T)}, 장치 시각 ${mmss(view.esNow)}`}
              style={{ "--p": `${(T / span) * 100}%` } as React.CSSProperties}
            />
          </div>
          <span className="cr-time">
            {mmss(T)} / {mmss(span)}
          </span>
        </div>
        </div>

        {!started && (
          <div className="cr-start">
            <div className="cr-start-card">
              <p className="cr-start-k">기록 재생 대기</p>
              <p className="cr-start-t">
                2026-11-14 통신 실험 · 받은 시간 {Math.floor(span / 60)}분 {Math.round(span % 60)}초 · 기록 {run.total}개
              </p>
              <button type="button" className="cr-start-go" onClick={() => seek(0, true)}>
                <svg viewBox="0 0 16 16" aria-hidden="true">
                  <path d="M4 2l10 6-10 6z" />
                </svg>
                재생 시작
                <small>×10 · 약 {Math.round(span / 10)}초</small>
              </button>
              <div className="cr-start-jumps">
                <span>바로 보기</span>
                {jumps.map((j) => (
                  <button key={j.k} type="button" onClick={() => seek(j.at, true)}>
                    {j.k === "heat" ? "히터 켜는 순간" : j.k === "trip" ? "위험 · 차단" : "Wi-Fi 끊김"}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
      <p className="sr-only" aria-live="polite">
        {say}
      </p>
    </section>
  );
}
