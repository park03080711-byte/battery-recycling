/* ─────────────────────────────────────────────
   LAB 02 가상 실험 → LAB 03 관제실 기록
   가상 ESP32를 끝까지 돌린 뒤, PC로 보낸 패킷(1초마다)을 도착 시각 순으로 늘어놓는다.
   패킷에 없는 값(상승 속도 · 예측 · 전류 · 전압 · 차단)은 같은 시각의 측정 표본에서,
   위험지수는 펌웨어 식으로 다시 계산한다(가상 장치는 위험지수를 기록하지 않음).
   ───────────────────────────────────────────── */
import { ENVS } from "../sim/catalog";
import { Sim, type Config } from "../sim/engine";
import { decodeCfg, describe, encodeCfg, fullCfg } from "../sim/share";
import { PRESETS } from "./presets";
import { riskParts, type Row, type Source } from "./engine";

/* 시나리오 · 주소 → 설정 */
export const presetCfg = (id: string) => fullCfg(PRESETS.find((p) => p.id === id)?.shared ?? {});
export function presetOf(cfg: Config): string | null {
  const code = encodeCfg(cfg);
  return PRESETS.find((p) => encodeCfg(fullCfg(p.shared)) === code)?.id ?? null;
}
/* LAB 02와 같은 주소 형식: 기본 설정이면 #sim, 아니면 #c=… */
export const hashOf = (cfg: Config) => {
  const c = encodeCfg(cfg);
  return c ? `#c=${c}` : "#sim";
};
export function cfgFromHash(hash: string): Config | null {
  if (hash === "#sim") return fullCfg();
  const d = decodeCfg(hash);
  return d ? fullCfg(d) : null;
}

export function envName(cfg: Config) {
  const e = ENVS.find((x) => x.id === cfg.env) ?? ENVS[0];
  const v = e.variants?.find((x) => x.id === cfg.variant);
  return e.name + (v ? ` (${v.name})` : "");
}

export function simRows(cfg: Config): { rows: Row[]; source: Source; duration: number } {
  const s = new Sim(cfg).runAll();
  const at = new Map(s.samples.map((x) => [x.t.toFixed(1), x]));
  const rows: Row[] = [];
  for (const p of s.packets) {
    if (p.lost || p.arrive === null || p.sent === null) continue;
    const x = at.get(p.t.toFixed(1));
    const dT = p.dT != null ? Math.round(p.dT * 100) / 100 : NaN;
    const mA = x?.cur != null ? Math.round(x.cur * 10) / 10 : NaN;
    const mV = x?.volt != null ? Math.round(x.volt * 1000) : NaN;
    const slope = Math.round((x?.slope ?? 0) * 10000) / 10000;
    const risk = Math.round(riskParts({ dT, slope, mA, mV }).reduce((a, b) => a + b.v, 0));
    rows.push([
      Math.round(p.arrive * 1000) / 1000, p.t, p.seq, mV, mA, dT, slope, x?.eta != null && x.eta > 0 ? Math.round(x.eta) : -1, risk,
      p.level, p.heat ? 1 : 0, x?.trip ? 1 : 0, p.late ? 2 : 1, Math.round((p.arrive - p.sent) * 2000), 0, x?.fault || p.dT === null ? 1 : 0,
    ]);
  }
  rows.sort((a, b) => a[0] - b[0]);
  const name = envName(cfg);
  const change = describe(cfg);
  return {
    rows,
    duration: s.env.duration,
    source: {
      kind: "sim",
      src: `LAB 02 모의 · ${name}`,
      title: `LAB 02 모의 실험 · ${name}`,
      note: change === "기본 설정" ? "기본 부품 · 기본 판정 규칙" : change,
      ring: cfg.cards.buffer ? cfg.params["buffer.n"] : 0,
    },
  };
}
