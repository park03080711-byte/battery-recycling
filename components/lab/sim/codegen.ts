/* 설정(부품 · 핀 · 규칙 카드)에 맞춰 바뀌는 판정 코드 — 읽기용 뼈대.
   LAB 01 ess_stage3.ino의 judge() 구조를 그대로 따른다. 업로드용 전체 스케치는 아님. */
import { CARDS, PARTS, type CardId, type PartId } from "./catalog";

export type CodeLine = { text: string; changed?: boolean; dim?: boolean };

const f = (v: number) => {
  const s = Number.isInteger(v) ? v.toFixed(1) : String(+v.toFixed(3));
  return `${s}f`;
};

export function genCode(present: PartId[], pins: Record<string, number>, cards: Record<CardId, boolean>, params: Record<string, number>): CodeLine[] {
  const has = (p: PartId) => present.includes(p);
  const on = (id: CardId) => cards[id] && CARDS.find((c) => c.id === id)!.needs.every(has);
  const def = (k: string) => {
    const [cid, pk] = k.split(".");
    return CARDS.find((c) => c.id === cid)!.params.find((p) => p.key === pk)!.def;
  };
  const P = (k: string) => params[k];
  const ch = (...keys: string[]) => keys.some((k) => Math.abs(P(k) - def(k)) > 1e-9);
  const L: CodeLine[] = [];
  const add = (text: string, changed = false, dim = false) => L.push({ text, changed, dim });

  add("// ── 핀 (부품 · 핀 탭에서 고른 대로) ──", false, true);
  const names: Record<string, string> = {
    "ds.DQ": "PIN_DS18B20",
    "ntc.S": "PIN_NTC",
    "shunt.A": "PIN_SHUNT",
    "div.M": "PIN_BUS",
    "relay.IN": "PIN_RELAY",
    "rgb.R": "PIN_LED_R",
    "rgb.G": "PIN_LED_G",
    "rgb.B": "PIN_LED_B",
    "dtmod.DO": "PIN_TEMP_SW",
    "dht.DATA": "PIN_DHT11",
    "accel.X": "PIN_ACC_X",
    "accel.Y": "PIN_ACC_Y",
    "accel.Z": "PIN_ACC_Z",
    "tilt.S": "PIN_TILT",
    "vib.S": "PIN_VIB",
    "reed.S": "PIN_DOOR",
    "pir.OUT": "PIN_PIR",
    "photo.S": "PIN_FAN_PULSE",
    "btn.S": "PIN_BUTTON",
    "buzz.S": "PIN_BUZZER",
  };
  for (const p of PARTS) {
    if (!has(p.id)) continue;
    for (const r of p.pins) {
      const k = `${p.id}.${r.key}`;
      add(`constexpr uint8_t ${names[k].padEnd(13)} = ${pins[k]};`, pins[k] !== r.def);
    }
  }
  const missing = PARTS.filter((p) => !has(p.id));
  if (missing.length) add(`// 빠진 부품: ${missing.map((p) => p.name).join(", ")}`, true, true);

  add("");
  add("// ── 판정 기준 (규칙 카드) ──", false, true);
  if (on("dt")) add(`constexpr float DT_CAUTION = ${f(P("dt.c"))}, DT_WARNING = ${f(P("dt.w"))}, DT_DANGER = ${f(P("dt.d"))};  // °C`, ch("dt.c", "dt.w", "dt.d"));
  else if (on("eta")) add(`constexpr float DT_CAUTION = ${f(P("dt.c"))}, DT_DANGER = ${f(P("dt.d"))};  // 예측에 씀`, ch("dt.c", "dt.d"));
  if (on("slope")) add(`constexpr float SLOPE_EARLY = ${f(P("slope.s"))};  constexpr uint32_t SLOPE_HOLD_MS = ${Math.round(P("slope.h") * 1000)};`, ch("slope.s", "slope.h"));
  if (on("eta")) add(`constexpr float ETA_WARNING_S = ${f(P("eta.e"))};`, ch("eta.e"));
  if (on("cur")) add(`constexpr float I_CAUTION = ${f(P("cur.c"))}, I_WARNING = ${f(P("cur.w"))}, I_DANGER = ${f(P("cur.d"))};  // mA`, ch("cur.c", "cur.w", "cur.d"));
  if (on("volt")) add(`constexpr float V_CAUTION_LOW = ${Math.round(P("volt.c") * 1000)}, V_WARNING_LOW = ${Math.round(P("volt.w") * 1000)}, V_WARNING_HIGH = ${Math.round(P("volt.h") * 1000)};  // mV`, ch("volt.c", "volt.w", "volt.h"));
  if (on("dtsw")) add(`// 온도 스위치 동작 온도 ${P("dtsw.t")} °C — 코드가 아니라 모듈의 가변저항으로 맞춤`, ch("dtsw.t"), true);
  if (on("fan")) add(`constexpr uint32_t FAN_TIMEOUT_MS = ${Math.round(P("fan.s") * 1000)};  // 펄스가 이만큼 없으면 팬 멈춤`, ch("fan.s"));
  if (on("shock")) add(`constexpr float SHOCK_G = ${f(P("shock.g"))};`, ch("shock.g"));
  if (on("tiltA")) add(`constexpr float TILT_DEG = ${f(P("tiltA.a"))};`, ch("tiltA.a"));
  if (on("person")) add(`constexpr uint32_t PIR_IGNORE_MS = ${Math.round(P("person.i") * 1000)};  // 켠 뒤 헛신호 무시`, ch("person.i"));
  if (on("heatcheck")) add(`constexpr uint32_t HEATCHECK_MS = ${Math.round(P("heatcheck.t") * 1000)};  constexpr float HEATCHECK_MIN_DT = ${f(P("heatcheck.m"))};`, ch("heatcheck.t", "heatcheck.m"));

  add("");
  if (has("ds")) {
    if (has("ntc")) {
      add("// ΔT = (셀 − 주변) − 켤 때 잰 두 센서 차이", false, true);
      add("st.dT = (st.dsC - st.ntcC) - tempOffsetC;");
    } else if (has("dht")) {
      add("// NTC 대신 DHT11을 주변 온도로 (1 °C 단위라 ΔT가 계단처럼 움직임)", true, true);
      add("st.dT = (st.dsC - st.dhtC) - tempOffsetC;", true);
    } else {
      add("// 주변 센서 없음 → ΔT = 셀 − 켤 때 셀 온도 (방이 더워져도 오름!)", true, true);
      add("st.dT = st.dsC - bootDsC;", true);
    }
    add("");
  }
  add("Level judge(uint32_t now) {");
  add("  Level cand = LV_NORMAL;");
  if (on("fault")) add('  if (st.sensorFault) raise(LV_WARNING, "센서 고장");');
  if (on("heatcheck")) {
    add("  // 조합 카드: 전류는 흐르는데 온도가 안 오르면 → 센서가 셀을 못 느낌", true, true);
    add("  if (heatingFor(now) >= HEATCHECK_MS && st.dT < HEATCHECK_MIN_DT) {", true);
    add('    suspect = true; raise(LV_WARNING, "센서 접촉 의심");', true);
    add("  }", true);
  }
  const temp = on("dt") || on("slope") || on("eta");
  if (temp) {
    add("  if (!st.sensorFault) {");
    if (on("dt")) {
      add("    Level lt = levelFromTemp(st.dT, st.level);  // 내려갈 때 0.3 °C 여유");
      add('    if (lt == LV_DANGER)  raise(LV_DANGER,  "온도차 위험 기준 초과");');
      add('    if (lt == LV_WARNING) raise(LV_WARNING, "온도차 경고 기준 초과");');
      add('    if (lt == LV_CAUTION) raise(LV_CAUTION, "온도차 주의 기준 초과");');
    }
    if (on("slope")) {
      add("    if (st.slope >= SLOPE_EARLY) { if (!slopeAboveSince) slopeAboveSince = now; } else slopeAboveSince = 0;");
      add('    if (slopeAboveSince && now - slopeAboveSince >= SLOPE_HOLD_MS) raise(LV_CAUTION, "상승률 지속");');
    }
    if (on("eta")) add('    if (!isnan(st.etaS) && st.etaS < ETA_WARNING_S && st.dT >= DT_CAUTION) raise(LV_WARNING, "위험 예측");');
    add("  }");
  } else if (has("ds")) add("  // 온도 규칙이 모두 꺼져 있음 — 셀 온도를 재기만 하고 판정에는 안 씀", true, true);
  if (on("cur")) {
    add('  if (st.currentMa >= I_DANGER)       raise(LV_DANGER,  "과전류 위험");');
    add('  else if (st.currentMa >= I_WARNING) raise(LV_WARNING, "과전류 경고");');
    add('  else if (st.currentMa >= I_CAUTION) raise(LV_CAUTION, "과전류 주의");');
  }
  if (on("volt")) {
    add('  if (st.busMv < V_WARNING_LOW || st.busMv > V_WARNING_HIGH) raise(LV_WARNING, "전압 이상");');
    add('  else if (st.busMv < V_CAUTION_LOW) raise(LV_CAUTION, "저전압 주의");');
  }
  if (on("dtsw")) add('  if (digitalRead(PIN_TEMP_SW) == LOW) raise(LV_DANGER, "온도 스위치 동작");  // 비교기 출력: 넘으면 LOW', true);
  const site = (["fan", "shock", "tiltA", "tiltSw", "door", "person"] as CardId[]).filter(on);
  if (site.length || on("vib")) add("  // 현장 카드: 충전을 멈출 이유 (halt)", true, true);
  if (on("fan")) add('  if (now - lastFanPulse > FAN_TIMEOUT_MS) halt = "냉각팬 멈춤";  // 펄스는 인터럽트로 셈', true);
  if (on("shock")) add('  if (fabsf(accMagG() - 1.0f) >= SHOCK_G) shockUntil = now + 30000;\n  if (now < shockUntil) halt = "충격 감지";', true);
  if (on("tiltA")) add('  if (tiltDeg() >= TILT_DEG) halt = "기울어짐";  // atan2(√(x²+y²), z)', true);
  if (on("tiltSw")) add('  if (heldFor(PIN_TILT, 1000)) halt = "기울기 스위치";', true);
  if (on("door")) add('  if (digitalRead(PIN_DOOR) == HIGH) { halt = "정비 중 — 문 열림"; maint = true; }  // 자석이 멀어지면 열림', true);
  if (on("person")) add('  if (now > PIR_IGNORE_MS && digitalRead(PIN_PIR) == HIGH) { if (!halt) halt = "정비 중 — 사람 접근"; maint = true; }', true);
  if (site.length) add("  if (halt) raise(maint ? LV_CAUTION : LV_WARNING, halt);", true);
  if (on("vib")) add('  if (now < vibUntil) raise(LV_CAUTION, "진동 감지");  // 세기를 몰라 주의만', true);
  add("  return cand;");
  add("}");
  add("");
  add("// 위험이면 차단 · 잠금 ('x'로 해제하기 전까지 다시 켜지 않음)", false, true);
  if (has("relay")) {
    add("if (to == LV_DANGER) { setHeater(false); tripped = true; }");
    add("if (halt) setHeater(false);  // 정비 · 충격 · 팬: 충전만 멈춤 (잠그지는 않음)", false, false);
  }
  else add("// 릴레이 없음 → 위험을 알아도 히터를 끊을 방법이 없음", true, true);
  add("");
  add("// ── 관제 전송 (1초마다 PC로) ──", false, true);
  if (cards.buffer) {
    add(`constexpr uint16_t RING_N = ${P("buffer.n")};  // 끊긴 동안 쌓아 둘 기록 수 (1초에 1개 → ${Math.round(P("buffer.n") / 6) / 10}분)`, ch("buffer.n"));
    add(`// 다시 연결되면 0.1초마다 ${P("buffer.b")}개씩 재전송 (초당 ${P("buffer.b") * 10}개)`, ch("buffer.b"), true);
  } else add("// 버퍼 없음 → Wi-Fi가 끊긴 동안 만든 기록은 그대로 버려짐", true, true);
  if (has("buzz")) add("digitalWrite(PIN_BUZZER, st.level >= LV_WARNING && blinkPhase(st.level));  // 경고 느리게 · 위험 빠르게", true);
  if (has("btn")) add("if (pressed(PIN_BUTTON)) handleLine(\"x\");  // 현장 버튼 = 시리얼 x", true);
  return L;
}
