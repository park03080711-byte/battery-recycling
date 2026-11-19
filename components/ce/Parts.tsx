"use client";

/* 10 재생원료 인증 — 그림 두 개
   1) LedgerViewer: 같은 공장, 네 가지 장부 (칸 수는 예시 — 넣은 원료 10칸 중 3칸이 재생원료라고 할 때)
   2) TargetsFig: EU 최소 재생원료 비율(제8조)과 한 연구의 2031년 추정 범위 */
import { useState } from "react";
import { models, targets } from "./data";

const N = 10;
const R = 3; // 예시: 넣은 원료 10칸 중 재생원료 3칸

type Cell = "rec" | "vir" | "part" | "claim";
function outCells(id: string): Cell[] {
  if (id === "seg") return [...Array(R).fill("rec"), ...Array(N - R).fill("vir")];
  if (id === "blend") return Array(N).fill("part");
  if (id === "mass") return [...Array(R).fill("rec"), ...Array(N - R).fill("vir")];
  return [...Array(R).fill("claim"), ...Array(N - R).fill("vir")];
}
function inCells(id: string): Cell[] {
  if (id === "book") return Array(N).fill("vir");
  return [...Array(R).fill("rec"), ...Array(N - R).fill("vir")];
}

const SUM: Record<string, string> = {
  seg: "재생원료 3칸은 처음부터 끝까지 따로 흘러, 나온 제품 3칸이 실제로 재생원료로 만들어졌습니다.",
  blend: "모든 제품에 같은 비율(10칸 중 3칸 몫)의 재생원료가 들어 있다고 봅니다.",
  mass: "탱크 안에서는 섞였지만, 넣은 재생원료 3칸만큼을 제품 3칸에 장부상 배정했습니다. 총량은 넘지 않습니다.",
  book: "이 공장은 재생원료를 넣지 않았는데, 다른 곳에서 산 증서 3장으로 제품 3칸을 '재생'이라 부릅니다.",
};

function Cells({ cells, x, y, label }: { cells: Cell[]; x: number; y: number; label: string }) {
  return (
    <g>
      <text x={x} y={y - 10} className="lb strong">
        {label}
      </text>
      {cells.map((c, i) => {
        const cx = x + (i % 5) * 26;
        const cy = y + Math.floor(i / 5) * 26;
        return (
          <g key={i}>
            <rect x={cx} y={cy} width={22} height={22} rx={4} className={`ce-c ${c === "part" ? "vir" : c}`} />
            {c === "part" && <rect x={cx} y={cy + 22 - 6.6} width={22} height={6.6} rx={1.5} className="ce-c rec" />}
            {c === "claim" && <path d={`M${cx + 6} ${cy + 11} l4 4 l7 -8`} className="ce-tick" />}
          </g>
        );
      })}
    </g>
  );
}

export function LedgerViewer() {
  const [id, setId] = useState<string>("mass");
  const m = models.find((x) => x.id === id)!;
  const split = id === "seg";
  return (
    <div className="ce-lv">
      <div className="ce-lv-btns" role="group" aria-label="장부를 쓰는 방식">
        {models.map((x) => (
          <button key={x.id} type="button" aria-pressed={id === x.id} onClick={() => setId(x.id)}>
            <b>{x.t}</b>
            <span>{x.short}</span>
          </button>
        ))}
      </div>
      <svg viewBox="0 0 560 170" className="ce-lv-svg" role="img" aria-labelledby="ce-lv-t">
        <title id="ce-lv-t">{`${m.t}: ${SUM[id]}`}</title>
        <Cells cells={inCells(id)} x={14} y={56} label="넣은 원료" />
        {/* 탱크 */}
        <g>
          <path d="M160 82 H196" className="ce-arrow" />
          {split ? (
            <>
              <rect x={206} y={40} width={58} height={92} rx={10} className="ce-tank rec" />
              <rect x={272} y={40} width={58} height={92} rx={10} className="ce-tank" />
            </>
          ) : (
            <rect x={206} y={40} width={124} height={92} rx={12} className={`ce-tank ${id === "book" ? "" : "mix"}`} />
          )}
          <text x={268} y={152} textAnchor="middle" className="lb">
            {split ? "따로 처리" : "한 탱크"}
          </text>
          <path d="M340 82 H376" className="ce-arrow" />
        </g>
        <Cells cells={outCells(id)} x={392} y={56} label="나온 제품" />
        {id === "book" && (
          <g>
            <rect x={392} y={128} width={150} height={26} rx={6} className="ce-cert" />
            <text x={467} y={145} textAnchor="middle" className="lb strong">
              산 증서 3장
            </text>
          </g>
        )}
        {id === "mass" && (
          <text x={392} y={146} className="lb rec">
            장부상 배정 3칸 (≤ 넣은 3칸)
          </text>
        )}
      </svg>
      <ul className="ce-lv-key" aria-label="칸 색">
        <li>
          <i className="rec" />
          재생원료
        </li>
        <li>
          <i className="vir" />
          광물 원료
        </li>
        <li>
          <i className="claim" />
          증서로만 &lsquo;재생&rsquo;
        </li>
      </ul>
      <div className="ce-lv-sum" aria-live="polite">
        <p>
          <b>{m.t}</b> — {SUM[id]}
        </p>
        <p className="d">{m.d}</p>
        <p className={`eu tone-${m.tone}`}>
          <span>EU</span>
          {m.eu}
        </p>
      </div>
    </div>
  );
}

/* EU 최소 비율 — 2031 · 2036 막대 + Zhou 외(2024) 2031 추정 범위 (리튬 · 니켈) */
const EST: Record<string, [number, number]> = { Li: [6.4, 12.1], Ni: [7.1, 14.0] };
export function TargetsFig() {
  const x0 = 96;
  const W = 420;
  const sx = (v: number) => x0 + (v / 100) * W;
  return (
    <svg viewBox="0 0 560 250" className="ce-tg" role="img" aria-labelledby="ce-tg-t">
      <title id="ce-tg-t">
        EU 배터리 규정의 최소 재생원료 비율. 2031년 코발트 16, 리튬 6, 니켈 6, 납 85퍼센트. 2036년 코발트 26, 리튬 12, 니켈 15, 납 85퍼센트. 한 연구의 2031년 추정 가능 범위는 리튬 6.4에서
        12.1, 니켈 7.1에서 14.0퍼센트.
      </title>
      {[0, 25, 50, 75, 100].map((v) => (
        <g key={v}>
          <line x1={sx(v)} y1={22} x2={sx(v)} y2={214} className="ce-tg-grid" />
          <text x={sx(v)} y={232} textAnchor="middle" className="lb">
            {v}%
          </text>
        </g>
      ))}
      {targets.map((t, i) => {
        const y = 30 + i * 48;
        const est = EST[t.sym];
        return (
          <g key={t.sym}>
            <text x={x0 - 12} y={y + 18} textAnchor="end" className="lb strong">
              {t.m} {t.sym}
            </text>
            <rect x={x0} y={y} width={(t.y31 / 100) * W} height={14} rx={3} fill={t.col} opacity={0.55} />
            <rect x={x0} y={y + 18} width={(t.y36 / 100) * W} height={14} rx={3} fill={t.col} />
            <text x={Math.max(sx(t.y31), est ? sx(est[1]) : 0) + 6} y={y + 11} className="lb">
              2031 · {t.y31}%
            </text>
            <text x={sx(t.y36) + 6} y={y + 29} className="lb strong">
              2036 · {t.y36}%
            </text>
            {est && (
              <g>
                <line x1={sx(est[0])} x2={sx(est[1])} y1={y + 7} y2={y + 7} className="ce-tg-est" />
                <line x1={sx(est[0])} x2={sx(est[0])} y1={y + 2} y2={y + 12} className="ce-tg-est" />
                <line x1={sx(est[1])} x2={sx(est[1])} y1={y + 2} y2={y + 12} className="ce-tg-est" />
              </g>
            )}
          </g>
        );
      })}
    </svg>
  );
}
