"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

interface Item {
  id: string;
  label: string;
}

/** CSS scroll-snap 기반 풀페이지 스크롤 + 우측 섹션 인디케이터 */
export default function Fullpage({ items, children }: { items: Item[]; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(items[0]?.id);
  const [dark, setDark] = useState(true);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const sections = Array.from(root.querySelectorAll<HTMLElement>(".fp-section"));
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            const el = e.target as HTMLElement;
            const isDark = el.dataset.dark === "true";
            if (el.id) setActive(el.id);
            setDark(isDark);
            window.dispatchEvent(new CustomEvent("fp:section", { detail: { dark: isDark } }));
          }
        });
      },
      { root, threshold: 0.55 }
    );
    sections.forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, []);

  const go = (id: string) => {
    const el = ref.current?.querySelector<HTMLElement>(`#${id}`);
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <>
      <div className="fp" ref={ref} id="main" tabIndex={-1}>
        {children}
      </div>
      <nav className={`fp-dots${dark ? " on-dark" : ""}`} aria-label="섹션 이동">
        {items.map((it) => (
          <a
            key={it.id}
            href={`#${it.id}`}
            className={active === it.id ? "active" : ""}
            onClick={(e) => {
              e.preventDefault();
              go(it.id);
            }}
          >
            <span>{it.label}</span>
            <i />
          </a>
        ))}
      </nav>
    </>
  );
}
