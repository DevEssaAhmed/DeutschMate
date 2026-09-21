"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { GrammarTopic, LevelId } from "@/lib/types";
import { levelOrder } from "@/lib/curriculum";
import { SpeakButton } from "./speak-button";

type Item = GrammarTopic & { level: LevelId };

export function GrammarExplorer({ items }: { items: Item[] }) {
  const [query, setQuery] = useState("");
  const [level, setLevel] = useState<"ALL" | LevelId>("ALL");

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return items.filter((item) => {
      const levelMatch = level === "ALL" || item.level === level;
      const text = [item.name, item.explanation, ...item.examples].join(" ").toLowerCase();
      return levelMatch && (!needle || text.includes(needle));
    });
  }, [items, level, query]);

  return (
    <div>
      <div className="filter-bar card">
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search grammar topics, rules or examples…" aria-label="Search grammar" />
        <div className="segmented">
          <button type="button" className={level === "ALL" ? "active" : ""} onClick={() => setLevel("ALL")}>All</button>
          {levelOrder.map((id) => <button type="button" className={level === id ? "active" : ""} onClick={() => setLevel(id)} key={id}>{id}</button>)}
        </div>
      </div>

      <div className="grammar-course-grid">
        {visible.map((item, index) => (
          <article className="grammar-chapter card" key={item.level + item.name + index}>
            <header><span className={"mini-level level-" + item.level.toLowerCase()}>{item.level}</span><span className="eyebrow">EXPLICIT GRAMMAR</span></header>
            <h2>{item.name}</h2>
            <p>{item.explanation}</p>
            <div className="example-list">
              {item.examples.map((example) => <div className="example-row" key={example}><code>{example}</code><SpeakButton text={example} compact /></div>)}
            </div>
            <div className="grammar-practice-box">
              <strong>Controlled → production</strong>
              <p>1. Change the subject or time expression in one example. 2. Produce a new sentence from your own context. 3. Check verb position, case and endings.</p>
            </div>
            <Link className="text-link" href="/tutor">Ask the tutor about this structure →</Link>
          </article>
        ))}
      </div>
    </div>
  );
}
