"use client";

import { useMemo, useState } from "react";
import type { LevelId, RichVocabularyItem } from "@/lib/types";
import { levelOrder } from "@/lib/curriculum";
import { SpeakButton } from "./speak-button";
import { useProgress, vocabularyKey } from "./progress-provider";

export function VocabularyExplorer({ items }: { items: RichVocabularyItem[] }) {
  const [query, setQuery] = useState("");
  const [level, setLevel] = useState<"ALL" | LevelId>("ALL");
  const progress = useProgress();

  const visible = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase("de-DE");
    return items.filter((item) => {
      const levelMatch = level === "ALL" || item.level === level;
      const text = [item.de, item.en, item.lemma, item.partOfSpeech, ...item.chunks].join(" ").toLocaleLowerCase("de-DE");
      return levelMatch && (!needle || text.includes(needle));
    });
  }, [items, level, query]);

  return (
    <div>
      <div className="filter-bar card">
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search German, English, lemma or chunk…" aria-label="Search vocabulary" />
        <div className="segmented">
          <button type="button" className={level === "ALL" ? "active" : ""} onClick={() => setLevel("ALL")}>All</button>
          {levelOrder.map((id) => <button type="button" className={level === id ? "active" : ""} onClick={() => setLevel(id)} key={id}>{id}</button>)}
        </div>
      </div>
      <p className="result-count">{visible.length} entries · articles are shown where present in the source vocabulary; DeutschMate does not invent missing plural forms.</p>
      <div className="rich-dictionary-grid">
        {visible.map((item) => {
          const state = progress.review[vocabularyKey(item.level, item.de)];
          return (
            <article className="dictionary-rich-card card" key={item.level + ":" + item.de}>
              <div className="dictionary-rich-head">
                <span className={"mini-level level-" + item.level.toLowerCase()}>{item.level}</span>
                <SpeakButton text={item.de} compact />
              </div>
              <h3>{item.de}</h3>
              <p>{item.en}</p>
              <dl>
                <div><dt>Lemma</dt><dd>{item.lemma}</dd></div>
                <div><dt>Type</dt><dd>{item.partOfSpeech}</dd></div>
                {item.article && <div><dt>Article</dt><dd>{item.article}</dd></div>}
                <div><dt>Review strength</dt><dd>{state?.strength ?? 0}/8</dd></div>
              </dl>
              {item.chunks.length > 0 && <div className="chunk-row">{item.chunks.map((chunk) => <span key={chunk}>{chunk}</span>)}</div>}
              <small>{item.contextExample}</small>
            </article>
          );
        })}
      </div>
    </div>
  );
}
