/* 가상 실험 설정 ↔ 주소(#c=…) — LAB 02 실험대와 LAB 03 관제실이 함께 쓴다.
   기본값과 다른 것만 담으므로 링크가 짧고, 같은 설정이면 결과도 같다(잡음 고정). */
import { CARDS, ENVS, GPIOS, PARTS, defaultCards, defaultFlags, defaultParams, defaultPins, type CardId, type EnvId, type Flags, type PartId } from "./catalog";
import { SEED, defaultPresent, type Config } from "./engine";

/* ── 설정 ↔ 주소 ── */
export type Shared = { env?: EnvId; variant?: string; present?: PartId[]; pins?: Record<string, number>; cards?: Partial<Record<CardId, boolean>>; params?: Record<string, number>; flags?: Partial<Flags> };
export function encodeCfg(cfg: Config) {
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
export function decodeCfg(hash: string): Shared | null {
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
export function describe(cfg: Config) {
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

/* 주소에서 읽은 설정을 기본값 위에 얹어 완전한 설정으로 */
export function fullCfg(d: Shared = {}): Config {
  return {
    env: d.env ?? "heat",
    variant: d.variant ?? "cut",
    present: d.present ?? defaultPresent(),
    pins: { ...defaultPins(), ...(d.pins ?? {}) },
    cards: { ...defaultCards(), ...(d.cards ?? {}) },
    params: { ...defaultParams(), ...(d.params ?? {}) },
    flags: { ...defaultFlags(), ...(d.flags ?? {}) },
    seed: SEED,
  };
}
