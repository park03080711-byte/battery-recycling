import type { Reference } from "@/data/references";

export default function RefList({ refs }: { refs: Reference[] }) {
  return (
    <ol className="ref-list">
      {refs.map((r) => (
        <li key={r.id} className="ref-item" id={`ref-${r.id}`}>
          <span className="rid">[{r.id}]</span>
          <div>
            <div className="rt">{r.title}</div>
            <div className="rm">
              {r.authors} · {r.venue}
              {r.affiliation ? ` · ${r.affiliation}` : ""}
            </div>
            <div className="rm">
              {r.doi && (
                <a className="doi" href={`https://doi.org/${r.doi}`} target="_blank" rel="noopener noreferrer">
                  doi:{r.doi}
                </a>
              )}
              {r.pmid && <> · PMID {r.pmid}</>}
              {r.extra && <> · {r.extra}</>}
            </div>
          </div>
        </li>
      ))}
    </ol>
  );
}
