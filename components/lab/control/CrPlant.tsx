"use client";

import { useWidth } from "../useWidth";
import { LV, RULE, fin, mmss, mmssd, reasonFor, type Lv, type Pkt, type Run, type View } from "./engine";

/* ─────────────────────────────────────────────
   설비 계통도 — 함체 안 부품과 ESP32 → PC → 관제실을 한 장의 도면으로.
   평소에는 잉크색, 이상이 생긴 부품만 단계 색 (색 + 글자로 함께 표시).
   키트 센서는 꽂혀 있을 때만 그린다.
   ───────────────────────────────────────────── */

type Part = "cell" | "ds" | "ntc" | "shunt" | "bus" | "relay" | "dht" | "sonar" | "accel" | "reed" | "pir";

/* 지금 이상인 부품과 그 단계: 값 기준 + 가상 장치가 단계를 올린 사유 */
export function alarms(run: Run, r: Pkt | null) {
  const a: Partial<Record<Part, Lv>> = {};
  if (!r) return a;
  const set = (k: Part, l: Lv) => {
    if (l > (a[k] ?? 0)) a[k] = l;
  };
  if (fin(r.dT) && !r.fault) set("cell", r.dT >= RULE.dt[2] ? 3 : r.dT >= RULE.dt[1] ? 2 : r.dT >= RULE.dt[0] ? 1 : 0);
  if (r.fault) set("ds", 2);
  if (fin(r.mA)) set("shunt", r.mA >= RULE.mA[2] ? 3 : r.mA >= RULE.mA[1] ? 2 : r.mA >= RULE.mA[0] ? 1 : 0);
  if (fin(r.mV)) set("bus", r.mV < RULE.mV.warnLow || r.mV > RULE.mV.warnHigh ? 2 : r.mV < RULE.mV.caution ? 1 : 0);
  if (r.trip) set("relay", 3);
  const why = reasonFor(run, r) ?? "";
  const by: [RegExp, Part][] = [
    [/결로|습도/, "dht"],
    [/누수|물/, "sonar"],
    [/기울|충격|진동/, "accel"],
    [/문|정비/, "reed"],
    [/사람/, "pir"],
    [/과전류/, "shunt"],
    [/전압/, "bus"],
    [/온도차|상승|예측|스위치/, "cell"],
    [/센서/, "ds"],
  ];
  for (const [re, k] of by) if (re.test(why)) set(k, r.lv);
  return a;
}

const v1 = (v: number | null | undefined, d = 1) => (v === null || v === undefined || !fin(v) ? "—" : v.toFixed(d));

export function CrPlant({ run, view, extra }: { run: Run; view: View; extra?: React.ReactNode }) {
  const [ref, w] = useWidth<HTMLDivElement>(900);
  const r = view.last;
  const al = alarms(run, r);
  const has = (id: string) => run.source.sensors.includes(id);
  const site = r?.site;
  const cls = (k: Part, base = "") => `${base} ${al[k] ? `pl-a l${al[k]}` : ""}`.trim();
  const relayState = !r ? "—" : r.heat ? "켜짐" : r.trip ? "차단" : r.fault ? "정지" : view.events.some((e) => e.kind === "heat-off") ? "정지" : "꺼짐";
  const ring = run.source.ring;
  const cut = view.cut;
  const burst = view.burst > 3;
  const gapS = Math.round(view.gap);
  const rtt = !cut && r ? view.arrivals[view.arrivals.length - 1]?.rtt ?? r.rtt : null;
  const doorOpen = has("reed") && !!site?.door;
  const kitN = run.source.sensors.length;

  const label = r
    ? `설비 계통도. 셀 온도차 ${fin(r.dT) && !r.fault ? r.dT.toFixed(2) + "도" : "값 없음"}, 전류 ${v1(r.mA)} 밀리암페어, 릴레이 ${relayState}, ${cut ? `통신 끊김 ${gapS}초` : "통신 연결"}.`
    : "설비 계통도. 아직 받은 기록이 없습니다.";

  // 폭을 재는 바깥 상자는 항상 같은 요소로 둔다 (좁은 ↔ 넓은 전환 뒤에도 계속 잼)
  if (w < 640)
    return (
      <div ref={ref} className="pl-wrap">
        <PlantNarrow run={run} view={view} al={al} relayState={relayState} label={label} />
        {extra}
      </div>
    );

  // 넓은 화면: 900 × 300 도면을 실제 폭으로 (글자는 0.8배 아래로 줄지 않음)
  const water = Math.max(0, Math.min(1, (site?.floor ?? 0) / 20));
  return (
    <div ref={ref} className="pl-wrap">
      <div className="pl-box">
      <svg viewBox="0 0 900 300" role="img" aria-label={label} className="pl">
        <defs>
          <pattern id="pl-water" width="6" height="6" patternUnits="userSpaceOnUse">
            <path d="M0 3q1.5-2 3 0t3 0" className="pl-wave" />
          </pattern>
          <marker id="pl-arr" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto">
            <path d="M0 0l8 4-8 4z" className="pl-arrhead" />
          </marker>
        </defs>

        {/* 함체 (문 자리는 비워 둠) */}
        <text x="14" y="17" className="pl-h">
          ESS 함체 · 축소 모형
        </text>
        <path d="M560 110V26H12V288H560V200" className="pl-enc" />
        {has("reed") ? (
          <g className={cls("reed")}>
            <path d={doorOpen ? "M560 110L598 192" : "M560 110V200"} className="pl-door" />
            <circle cx="560" cy="110" r="3" className="pl-dot" />
            <text x={doorOpen ? 572 : 568} y={doorOpen ? 222 : 160} className="pl-s">
              {doorOpen ? "문 열림" : "문 닫힘"}
            </text>
            <text x={doorOpen ? 572 : 568} y={doorOpen ? 236 : 174} className="pl-s dim">
              리드 스위치
            </text>
          </g>
        ) : (
          <path d="M560 110V200" className="pl-enc" />
        )}

        {/* 5 V 버스 · 릴레이 · 셀 · 션트 · GND */}
        <g className={cls("bus")}>
          <circle cx="40" cy="58" r="4" className="pl-term" />
          <text x="34" y="44" className="pl-t">
            5 V 버스
          </text>
          <text x="92" y="44" className="pl-v">
            {fin(r?.mV ?? NaN) ? `${(r!.mV / 1000).toFixed(2)} V` : "— V"}
          </text>
          <text x="34" y="80" className="pl-s dim">
            분압 → GPIO33
          </text>
        </g>
        <path d="M44 58H150M200 58H300V94" className="pl-wire" />
        <g className={cls("relay", "pl-relay")}>
          <circle cx="150" cy="58" r="3" className="pl-dot" />
          <circle cx="200" cy="58" r="3" className="pl-dot" />
          <path d={r?.heat ? "M150 58L200 58" : "M150 58L194 36"} className="pl-blade" />
          <rect x="160" y="70" width="30" height="16" className="pl-coil" />
          <text x="175" y="82" textAnchor="middle" className="pl-s">
            RLY
          </text>
          <text x="175" y="104" textAnchor="middle" className="pl-t">
            릴레이 · {relayState}
          </text>
          <text x="175" y="118" textAnchor="middle" className="pl-s dim">
            GPIO22
          </text>
        </g>

        <g className={cls("cell", "pl-cell")}>
          <rect x="290" y="94" width="20" height="6" className="pl-nub" />
          <rect x="250" y="100" width="100" height="100" rx="6" className="pl-cellbody" />
          <text x="300" y="120" textAnchor="middle" className="pl-t">
            셀
          </text>
          <text x="300" y="152" textAnchor="middle" className="pl-big">
            {r && fin(r.dT) && !r.fault ? r.dT.toFixed(2) : "—"}
          </text>
          <text x="300" y="168" textAnchor="middle" className="pl-s">
            ΔT °C
          </text>
          <path d="M276 186l4-6 4 6 4-6 4 6 4-6 4 6 4-6 4 6 4-6 4 6" className={`pl-heater${r?.heat ? " on" : ""}`} />
          <text x="300" y="197" textAnchor="middle" className="pl-s dim">
            히터 220 Ω
          </text>
        </g>
        <g className={cls("ds")}>
          <rect x="350" y="143" width="20" height="14" rx="3" className="pl-probe" />
          <path d="M360 157V166" className="pl-lead" />
          <text x="356" y="180" className="pl-t">
            DS18B20
          </text>
          <text x="356" y="194" className="pl-s">
            {r?.fault ? "고장 · 값 멈춤" : "셀 표면"}
          </text>
          <text x="356" y="207" className="pl-s dim">
            GPIO13
          </text>
        </g>
        <g className={cls("ntc")}>
          <rect x="70" y="160" width="32" height="16" className="pl-ntc" />
          <path d="M66 182L106 154" className="pl-ntcline" />
          <text x="62" y="198" className="pl-t">
            NTC · 주변 공기
          </text>
          <text x="62" y="212" className="pl-s dim">
            GPIO36 · ΔT = DS − NTC
          </text>
        </g>
        <path d="M300 200V212M300 236V262M40 262H330" className="pl-wire" />
        <g className={cls("shunt")}>
          <path d="M300 212l7 3-14 4 14 4-14 4 14 4-7 2" className="pl-zig" />
          <text x="314" y="218" className="pl-t">
            션트 22 Ω
          </text>
          <text x="314" y="233" className="pl-v">
            {v1(r?.mA)} mA
          </text>
          <text x="314" y="247" className="pl-s dim">
            GPIO32
          </text>
        </g>
        <text x="40" y="278" className="pl-s dim">
          GND
        </text>

        {/* 키트 센서 (있을 때만) — 오른쪽 한 줄에 위에서부터 */}
        {!kitN && (
          <g>
            <text x="428" y="132" className="pl-s dim">
              키트 센서 없음
            </text>
            <text x="428" y="146" className="pl-s dim">
              LAB 01 기본 6종
            </text>
          </g>
        )}
        {has("dht") && (
          <g className={cls("dht")}>
            <rect x="426" y="62" width="30" height="28" rx="2" className="pl-chip" />
            <path d="M431 70h20M431 76h20M431 82h20" className="pl-grille" />
            <text x="464" y="72" className="pl-t">
              DHT11 공기
            </text>
            <text x="464" y="87" className="pl-v">
              {v1(site?.airT, 0)} °C · {v1(site?.rh, 0)} %
            </text>
            <text x="464" y="101" className="pl-s">
              이슬점 {v1(site?.dew)} °C
            </text>
          </g>
        )}
        {has("accel") && (
          <g className={cls("accel")}>
            <rect x="428" y="120" width="26" height="26" className="pl-chip" />
            <path d={`M441 133l${(13 * Math.sin(((site?.tilt ?? 0) * Math.PI) / 180)).toFixed(1)} ${(-13 * Math.cos(((site?.tilt ?? 0) * Math.PI) / 180)).toFixed(1)}`} className="pl-needle" />
            <text x="464" y="130" className="pl-t">
              가속도
            </text>
            <text x="464" y="145" className="pl-v">
              {v1(site?.tilt, 0)}° · {v1(site?.shock, 1)} g
            </text>
          </g>
        )}
        {has("pir") && (
          <g className={cls("pir")}>
            <path d="M427 192a14 14 0 0 1 28 0z" className={`pl-pir${site?.person ? " on" : ""}`} />
            <text x="464" y="178" className="pl-t">
              인체감지
            </text>
            <text x="464" y="192" className="pl-s">
              {site?.person ? "사람 있음" : "사람 없음"}
            </text>
          </g>
        )}
        {has("sonar") && (
          <g className={cls("sonar")}>
            <circle cx="434" cy="212" r="6" className="pl-chip" />
            <circle cx="450" cy="212" r="6" className="pl-chip" />
            <path d="M442 220V234" className="pl-lead dash" />
            <rect x="424" y={262 - 24 * water} width="60" height={24 * water} fill="url(#pl-water)" className="pl-waterfill" />
            <path d="M424 238V262H484V238" className="pl-tray" />
            <path d={`M424 ${262 - 24 * 0.25}H484`} className="pl-thr" />
            <text x="492" y="222" className="pl-t">
              초음파
            </text>
            <text x="492" y="237" className="pl-v">
              물 {v1(site?.floor)} mm
            </text>
            <text x="492" y="251" className="pl-s dim">
              기준 5 mm
            </text>
          </g>
        )}

        {/* 신호선 → ESP32 */}
        <path d="M560 250H604V188H620" className="pl-harness" />
        <text x="566" y="266" className="pl-s dim">
          신호선 {5 + kitN}
        </text>

        <g className={`pl-esp${r ? ` lv${r.lv}` : ""}`}>
          <rect x="620" y="96" width="100" height="112" rx="4" className="pl-board" />
          {[0, 1, 2, 3, 4, 5, 6].map((i) => (
            <path key={i} d={`M${628 + i * 13} 96v-5M${628 + i * 13} 208v5`} className="pl-pin" />
          ))}
          <text x="632" y="120" className="pl-t">
            ESP32
          </text>
          <text x="632" y="135" className="pl-s">
            측정 · 판정 · 차단
          </text>
          <circle cx="704" cy="114" r="6" className={`pl-led l${r?.lv ?? 0}`} />
          <text x="632" y="166" className="pl-v">
            {r ? `#${r.seq}` : "—"}
          </text>
          <text x="632" y="182" className="pl-s">
            {r ? mmssd(r.es) : "—"}
          </text>
          <text x="632" y="198" className="pl-s dim">
            {r ? LV[r.lv] : ""}
          </text>
        </g>

        {/* ESP32 → PC (Wi-Fi) */}
        <g className={`pl-link${cut ? " bad" : burst ? " burst" : ""}`}>
          <path d="M720 124H788" markerEnd="url(#pl-arr)" className="pl-linkline" />
          <text x="754" y="114" textAnchor="middle" className="pl-s">
            {cut ? `끊김 ${gapS} s` : burst ? `초당 ${view.burst}개` : "UDP · ACK"}
          </text>
          <text x="754" y="142" textAnchor="middle" className="pl-s dim">
            {ring ? `버퍼 ${cut ? `약 ${view.pending}` : 0}/${ring}` : "버퍼 없음"}
          </text>
        </g>
        <g className="pl-node">
          <rect x="792" y="98" width="100" height="54" rx="3" className="pl-boxr" />
          <text x="802" y="118" className="pl-t">
            PC 수신
          </text>
          <text x="802" y="134" className={`pl-s${!cut && !burst && view.missing ? " bad" : ""}`}>
            {cut ? `${gapS} s 전 마지막` : !burst && view.missing ? `빠진 순번 ${view.missing}` : rtt !== null && view.n ? `왕복 ${rtt} ms` : "대기"}
          </text>
          <text x="802" y="146" className="pl-s dim">
            재전송 {view.resent} · 중복 {view.dups}
          </text>
        </g>
        <path d="M842 152V178" markerEnd="url(#pl-arr)" className="pl-linkline" />
        <g className="pl-node here">
          <rect x="792" y="182" width="100" height="54" rx="3" className="pl-boxr" />
          <text x="802" y="202" className="pl-t">
            관제실
          </text>
          <text x="802" y="218" className="pl-v">
            {view.seen.length} / {run.total}
          </text>
          <text x="802" y="230" className="pl-s dim">
            {mmss(view.esNow)} 장치 시각
          </text>
        </g>
      </svg>
      </div>
    </div>
  );
}

/* 좁은 화면: 도면 대신 부품 칩 목록 + 세로 신호 경로 */
function PlantNarrow({
  run, view, al, relayState, label,
}: {
  run: Run;
  view: View;
  al: Partial<Record<Part, Lv>>;
  relayState: string;
  label: string;
}) {
  const r = view.last;
  const site = r?.site;
  const has = (id: string) => run.source.sensors.includes(id);
  const chip = (k: Part, name: string, val: string, sub?: string) => (
    <li key={k} className={al[k] ? `pl-a l${al[k]}` : undefined}>
      <b>{name}</b>
      <span className="v">{val}</span>
      {sub && <span className="s">{sub}</span>}
      {al[k] ? <em>{LV[al[k]!]}</em> : null}
    </li>
  );
  return (
    <div className="pl-box narrow" role="group" aria-label={label}>
      <p className="pl-nh">ESS 함체 · 부품</p>
      <ul className="pl-chips">
        {chip("cell", "셀 ΔT", r && fin(r.dT) && !r.fault ? `${r.dT.toFixed(2)} °C` : "—", r?.heat ? "히터 켜짐" : "히터 꺼짐")}
        {chip("ds", "DS18B20", r?.fault ? "고장" : "정상", "셀 표면 · GPIO13")}
        {chip("shunt", "전류", `${v1(r?.mA)} mA`, "션트 · GPIO32")}
        {chip("bus", "5 V 버스", r && fin(r.mV) ? `${(r.mV / 1000).toFixed(2)} V` : "—", "GPIO33")}
        {chip("relay", "릴레이", relayState, "GPIO22")}
        {has("dht") && chip("dht", "DHT11", `${v1(site?.airT, 0)} °C · ${v1(site?.rh, 0)} %`, `이슬점 ${v1(site?.dew)} °C`)}
        {has("sonar") && chip("sonar", "바닥 물", `${v1(site?.floor)} mm`, "초음파 · 기준 5 mm")}
        {has("accel") && chip("accel", "기울기", `${v1(site?.tilt, 0)}° · ${v1(site?.shock, 1)} g`, "가속도")}
        {has("reed") && chip("reed", "문", site?.door ? "열림" : "닫힘", "리드 스위치")}
        {has("pir") && chip("pir", "사람", site?.person ? "있음" : "없음", "인체감지")}
      </ul>
    </div>
  );
}
