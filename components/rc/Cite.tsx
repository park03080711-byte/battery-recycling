import { refById } from "@/data/references";
import { extraSources, levelLabel, type Level, type Src } from "./sources";

const srcTitle = (s: Src) => (typeof s === "number" ? refById(s).title : extraSources[s].title);
const srcLabel = (s: Src) => (typeof s === "number" ? String(s) : extraSources[s].label);

/** 본문 속 출처 번호 — 누르면 아래 근거 문헌 목록의 해당 항목으로 이동 */
export function Cite({ src }: { src: Src[] }) {
  return (
    <span className="rc-cite">
      {src.map((s) => (
        <a key={String(s)} href={`#ref-${s}`} aria-label={`출처 ${srcLabel(s)}: ${srcTitle(s)}`} title={srcTitle(s)}>
          {srcLabel(s)}
        </a>
      ))}
    </span>
  );
}

/** 근거 수준 표시 — 색만이 아니라 모양(●■▲◆)과 글자로 구분 */
export function LevelTag({ level }: { level: Level }) {
  return (
    <span className={`rc-level lv-${level}`}>
      <i aria-hidden="true" />
      {levelLabel[level]}
    </span>
  );
}
