"use client";

import Link from "next/link";
import { useState } from "react";
import { layers, layerById, type LayerId } from "@/data/layers";
import { topics } from "@/data/topics";
import { TopicIcon } from "../Icons";

export default function TopicGrid() {
  const [filter, setFilter] = useState<LayerId | "all">("all");

  return (
    <>
      <div className="topic-filter" role="group" aria-label="층위별 보기">
        <button aria-pressed={filter === "all"} onClick={() => setFilter("all")}>
          전체 14
        </button>
        {layers.map((l) => (
          <button key={l.id} aria-pressed={filter === l.id} onClick={() => setFilter(l.id)}>
            {l.title} {l.range.replace(/ /g, "")}
          </button>
        ))}
      </div>
      <ul className="topic-grid">
        {topics.map((t) => {
          const l = layerById(t.layer);
          return (
            <li key={t.slug} hidden={filter !== "all" && filter !== t.layer} className="topic-card" style={{ ["--layer" as string]: l.color }}>
              <Link href={`/topics/${t.slug}`} style={{ position: "absolute", inset: 0, zIndex: 1 }} aria-label={`${t.no} ${t.title} 자세히 보기`} />
              <div>
                <span className="no">{t.no}</span>
                <span className="tag">{l.title}</span>
              </div>
              <h3>{t.title}</h3>
              <p>{t.tagline}</p>
              <div className="icon">
                <TopicIcon slug={t.slug} size={48} />
              </div>
              <span className="plus" aria-hidden="true">+</span>
            </li>
          );
        })}
      </ul>
    </>
  );
}
