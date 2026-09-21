"use client";

import { useMemo, useState } from "react";
import type { LevelId } from "@/lib/types";
import { SpeakButton } from "./speak-button";

type Item = { de: string; en: string; level: LevelId; unit: string; unitId: number };

export function VocabularyExplorer({ items }: { items: Item[] }) {
  const [query, setQuery] = useState("");
  const [level, setLevel] = useState<"ALL" | LevelId>("ALL");
  const visible = useMemo(() => items.filter((item) => {
    const matchLevel = level === "ALL" || item.level === level;
    const q = query.trim().toLowerCase();
    return matchLevel && (!q || `${item.de} ${item.en} ${item.unit}`.toLowerCase().includes(q));
  }), [items, query, level]);

  return (
    <div>
      <div className="filter-bar card">
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search German, English or unit…" aria-label="Search vocabulary" />
        <div className="segmented">{(["ALL","A1","A2","B1","B2","C1"] as const).map((id) => <button type="button" className={level === id ? "active" : ""} onClick={() => setLevel(id)} key={id} aria-pressed={level === id}>{id === "ALL" ? "All" : id}</button>)}</div>
      </div>
      <p className="result-count">Showing {visible.length} of {items.length} vocabulary items</p>
      {visible.length === 0 && <p className="result-count">No vocabulary items match your current search and level filter.</p>}
      <div className="dictionary-grid">
        {visible.map((item, index) => <article className="dictionary-row card" key={`${item.unitId}-${item.de}-${index}`}><div className={`mini-level level-${item.level.toLowerCase()}`}>{item.level}</div><div><strong>{item.de}</strong><span>{item.en}</span><small>{item.unit}</small></div><SpeakButton text={item.de} compact /></article>)}
      </div>
    </div>
  );
}
