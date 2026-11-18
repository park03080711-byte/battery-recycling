"use client";

import { LV_NAME } from "../useWidth";
import type { Sim } from "./engine";

/* PC 관제 화면 — ESP32가 1초마다 보낸 기록을 PC가 받은 대로 보여 준다.
   Wi-Fi가 끊기면 PC는 '마지막으로 받은 상태'에 멈춰 있고, 다시 연결되면 밀린 기록이 한꺼번에 들어온다. */
const C = { ontime: "#3b5bdb", late: "#9c36b5", wait: "#c3c8d2", lost: "#d03b3b" };

export function PcPanel({ s }: { s: Sim }) {
  const c = s.comm;
  const t = s.t;
  const pc = c.pc;
  const stale = pc ? t - pc.t : null;
  const ontime = s.packets.filter((p) => !p.lost && !p.late && p.arrive !== null && p.arrive <= t).length;
  const late = c.recv - ontime;
  const status = s.bootFail ? { k: "off", text: "ESP32 꺼짐" } : c.link ? { k: "on", text: "연결됨" } : c.ap ? { k: "retry", text: "다시 연결하는 중 (10초마다 시도)" } : { k: "off", text: "Wi-Fi 끊김" };
  const blocks = s.packets.slice(-240);
  return (
    <section className="rc-panel sim-pc" aria-label="PC 관제 화면">
      <div className="sim-pc-h">
        <b>PC 관제 화면</b>
        <small className="lab-mono">UDP 5005</small>
        <span className={`sim-pc-st ${status.k}`}>
          <i aria-hidden="true" />
          {status.text}
        </span>
        {c.backlog > 0 && <span className="sim-pc-buf">ESP32 버퍼에 밀린 기록 {c.backlog}개</span>}
      </div>
      <div className="sim-pc-now">
        <div>
          <span className="k">PC가 보는 상태</span>
          {pc ? (
            <span className="v">
              <span className="lab-pill" data-lv={pc.level}>
                {LV_NAME[pc.level]}
              </span>
              <b>{pc.dT === null ? "—" : `ΔT ${pc.dT.toFixed(2)} °C`}</b>
              <small>히터 {pc.heat ? "켜짐" : "꺼짐"}</small>
            </span>
          ) : (
            <span className="v">
              <small>아직 받은 기록 없음</small>
            </span>
          )}
        </div>
        <div className={stale !== null && stale > 3 ? "stale" : ""}>
          <span className="k">마지막 수신</span>
          <span className="v">
            <b>{stale === null ? "—" : `${stale.toFixed(1)}초 전`}</b>
            {stale !== null && stale > 3 && <small>지금 화면은 오래된 정보예요</small>}
          </span>
        </div>
        <div>
          <span className="k">실제 ESP32</span>
          <span className="v">
            <span className="lab-pill" data-lv={s.level}>
              {s.bootFail ? "꺼짐" : LV_NAME[s.level]}
            </span>
            <small>히터 {s.power ? "켜짐" : "꺼짐"}</small>
          </span>
        </div>
      </div>
      <div className="sim-pc-strip" role="img" aria-label={`기록 ${c.made}개 중 바로 도착 ${ontime}, 늦게 도착 ${late}, 대기 ${c.pending + c.backlog}, 잃음 ${c.lost}`}>
        {blocks.map((p) => {
          const col = p.lost ? C.lost : p.arrive !== null && p.arrive <= t ? (p.late ? C.late : C.ontime) : C.wait;
          return <i key={p.seq} style={{ background: col }} />;
        })}
        {blocks.length === 0 && <span className="sim-pc-empty">실행하면 1초마다 기록 한 칸씩 쌓여요.</span>}
      </div>
      <ul className="sim-pc-key">
        <li>
          <i style={{ background: C.ontime }} />
          바로 도착 <b>{ontime}</b>
        </li>
        <li>
          <i style={{ background: C.late }} />
          쌓였다가 늦게 도착 <b>{late}</b>
        </li>
        <li>
          <i style={{ background: C.wait }} />
          아직 못 받음 <b>{c.pending}</b>
        </li>
        <li>
          <i style={{ background: C.lost }} />
          잃음 <b>{c.lost}</b>
        </li>
        <li className="m">
          만든 기록 <b>{c.made}</b>
        </li>
        <li className="m">
          왕복 지연 중앙값 <b>{c.rttMed === null ? "—" : `${Math.round(c.rttMed)} ms`}</b>
        </li>
        {c.catchUp !== null && (
          <li className="m">
            다시 연결 뒤 모두 도착 <b>{c.catchUp.toFixed(1)}초</b>
          </li>
        )}
      </ul>
    </section>
  );
}
