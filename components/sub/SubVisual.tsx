"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { SubVisualArt } from "../Art";
import { Chevron, HomeIcon } from "../Icons";
import type { LayerId } from "@/data/layers";

export interface Crumb {
  label: string;
  options: { href: string; label: string; current?: boolean }[];
}

function Drop({ crumb }: { crumb: Crumb }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("click", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("click", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, []);
  return (
    <div className="bc-drop" ref={ref}>
      <button aria-expanded={open} aria-haspopup="true" onClick={() => setOpen((v) => !v)}>
        <span>{crumb.label}</span>
        <Chevron />
      </button>
      {open && (
        <ul>
          {crumb.options.map((o) => (
            <li key={o.href}>
              <Link href={o.href} aria-current={o.current ? "page" : undefined} onClick={() => setOpen(false)}>
                {o.label}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function SubVisual({
  layer,
  seed,
  en,
  big,
  crumbs,
}: {
  layer: LayerId | "neutral";
  seed?: number;
  en: string;
  big: string;
  crumbs: Crumb[];
}) {
  return (
    <div className="sub-visual">
      <div className="sub-visual-art">
        <SubVisualArt layer={layer} seed={seed} />
      </div>
      <div className="sub-visual-copy">
        <div className="en">{en}</div>
        <div className="big">{big}</div>
      </div>
      <nav className="breadcrumb" aria-label="현재 위치">
        <div className="breadcrumb-inner">
          <Link href="/" className="bc-home" aria-label="홈">
            <HomeIcon />
          </Link>
          {crumbs.map((c, i) => (
            <Drop key={i} crumb={c} />
          ))}
        </div>
      </nav>
    </div>
  );
}
