"use client";

import { useMemo, useState } from "react";
import type { LevelId } from "@/lib/types";
import { SpeakButton } from "./speak-button";

type Item = { name: string; explanation: string; examples: string[]; level: LevelId; unit: string; unitId: number };

export function GrammarExplorer({ items }: { items: Item[] }) {
  const [query, setQuery] = useState("");
  const [level, setLevel] = useState<"ALL" | LevelId>("ALL");
  const visible = useMemo(() => items.filter((item) => {
    const q = query.trim().toLowerCase();
    return (level === "ALL" || item.level === level) && (!q || `${item.name} ${item.explanation} ${item.examples.join(" ")}`.toLowerCase().includes(q));
  }), [items, query, level]);

  return (
    <div>
      <div className="filter-bar card">
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search grammar topics…" aria-label="Search grammar" />
        <div className="segmented">{(["ALL","A1","A2","B1","B2","C1"] as const).map((id) => <button type="button" className={level === id ? "active" : ""} onClick={() => setLevel(id)} key={id} aria-pressed={level === id}>{id === "ALL" ? "All" : id}</button>)}</div>
      </div>
      {visible.length === 0 && <p className="result-count">No grammar topics match your current search and level filter.</p>}
      <div className="grammar-reference-grid">
        {visible.map((item, index) => <article className="grammar-card card" key={`${item.unitId}-${item.name}-${index}`}><div className="grammar-label"><span className={`mini-level level-${item.level.toLowerCase()}`}>{item.level}</span><small>{item.unit}</small></div><h3>{item.name}</h3><p>{item.explanation}</p><div className="example-list">{item.examples.map((example) => <div className="example-row" key={example}><code>{example}</code><SpeakButton text={example} compact /></div>)}</div></article>)}
      </div>
    </div>
  );
}
