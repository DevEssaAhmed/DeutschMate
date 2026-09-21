"use client";

import { useMemo, useState } from "react";
import type { LevelId, RichVocabularyItem } from "@/lib/types";
import { levelOrder } from "@/lib/curriculum";
import { SpeakButton } from "./speak-button";
import { useProgress, vocabularyKey } from "./progress-provider";

type DeepDive = { key: string; loading: boolean; text?: string; error?: string } | null;

export function VocabularyExplorer({ items }: { items: RichVocabularyItem[] }) {
  const [query, setQuery] = useState("");
  const [level, setLevel] = useState<"ALL" | LevelId>("ALL");
  const [deepDive, setDeepDive] = useState<DeepDive>(null);
  const progress = useProgress();

  const visible = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase("de-DE");
    return items.filter((item) => {
      const levelMatch = level === "ALL" || item.level === level;
      const text = [item.de, item.en, item.lemma, item.partOfSpeech, ...item.chunks].join(" ").toLocaleLowerCase("de-DE");
      return levelMatch && (!needle || text.includes(needle));
    });
  }, [items, level, query]);

  async function loadDeepDive(item: RichVocabularyItem) {
    const key = item.level + ":" + item.de;
    if (deepDive?.key === key && deepDive.text) { setDeepDive(null); return; }
    setDeepDive({ key, loading: true });
    try {
      const context = [
        "Known meaning: " + item.en,
        "Part of speech: " + item.partOfSpeech,
        item.article ? "Known article: " + item.article : "",
        item.contextExample ? "Course context: " + item.contextExample : "",
        item.chunks.length ? "Existing chunks: " + item.chunks.join(" | ") : "",
      ].filter(Boolean).join("\n");
      const response = await fetch("/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "vocabulary_deep_dive", level: item.level, text: item.de, context }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Vocabulary analysis failed.");
      setDeepDive({ key, loading: false, text: data.reply });
    } catch (err) {
      setDeepDive({ key, loading: false, error: err instanceof Error ? err.message : "Vocabulary analysis failed." });
    }
  }

  return (
    <div>
      <div className="filter-bar card">
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search German, English, lemma or chunk…" aria-label="Search vocabulary" />
        <div className="segmented">
          <button type="button" className={level === "ALL" ? "active" : ""} onClick={() => setLevel("ALL")}>All</button>
          {levelOrder.map((id) => <button type="button" className={level === id ? "active" : ""} onClick={() => setLevel(id)} key={id}>{id}</button>)}
        </div>
      </div>
      <p className="result-count">{visible.length} entries · static entries never invent missing morphology; use Deep dive for plural forms, word families, register and collocations.</p>
      <div className="rich-dictionary-grid">
        {visible.map((item) => {
          const state = progress.review[vocabularyKey(item.level, item.de)];
          const itemKey = item.level + ":" + item.de;
          const active = deepDive?.key === itemKey;
          return (
            <article className={"dictionary-rich-card card " + (active ? "expanded" : "")} key={itemKey}>
              <div className="dictionary-rich-head"><span className={"mini-level level-" + item.level.toLowerCase()}>{item.level}</span><SpeakButton text={item.de} compact /></div>
              <h3>{item.de}</h3><p>{item.en}</p>
              <dl>
                <div><dt>Lemma</dt><dd>{item.lemma}</dd></div>
                <div><dt>Type</dt><dd>{item.partOfSpeech}</dd></div>
                {item.article && <div><dt>Article</dt><dd>{item.article}</dd></div>}
                <div><dt>Review strength</dt><dd>{state?.strength ?? 0}/8</dd></div>
              </dl>
              {item.chunks.length > 0 && <div className="chunk-row">{item.chunks.map((chunk) => <span key={chunk}>{chunk}</span>)}</div>}
              <small>{item.contextExample}</small>
              <button type="button" className="text-button vocab-deep-button" onClick={() => void loadDeepDive(item)} disabled={active && deepDive.loading}>
                {active && deepDive.loading ? "Building lexical entry…" : active && deepDive.text ? "Hide deep dive" : "Deep dive: plural · collocations · word family →"}
              </button>
              {active && (deepDive.text || deepDive.error) && <div className="vocab-deep-panel" aria-live="polite">{deepDive.error ? <p className="ai-error">{deepDive.error}</p> : <pre>{deepDive.text}</pre>}</div>}
            </article>
          );
        })}
      </div>
    </div>
  );
}
