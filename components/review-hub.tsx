"use client";

import { useMemo, useState } from "react";
import { allRichVocabulary, levelOrder } from "@/lib/curriculum";
import type { LevelId } from "@/lib/types";
import { SpeakButton } from "./speak-button";
import { useProgress, vocabularyKey } from "./progress-provider";

export function ReviewHub() {
  const progress = useProgress();
  const [level, setLevel] = useState<LevelId>("A1");
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const today = new Date().toISOString().slice(0, 10);

  const cards = useMemo(() => {
    const items = allRichVocabulary.filter((item) => item.level === level);
    return items
      .map((item) => ({ item, state: progress.review[vocabularyKey(item.level, item.de)] }))
      .sort((a, b) => {
        const aDue = !a.state || a.state.due <= today ? 0 : 1;
        const bDue = !b.state || b.state.due <= today ? 0 : 1;
        if (aDue !== bDue) return aDue - bDue;
        return (a.state?.strength ?? -1) - (b.state?.strength ?? -1);
      });
  }, [level, progress.review, today]);

  const current = cards[index % Math.max(cards.length, 1)];

  function rate(rating: "again" | "hard" | "good" | "easy") {
    if (!current) return;
    progress.rateVocabulary(vocabularyKey(current.item.level, current.item.de), rating);
    setIndex((value) => (value + 1) % cards.length);
    setRevealed(false);
  }

  return (
    <div className="review-hub">
      <div className="practice-toolbar card">
        <div>
          <span className="eyebrow">SPACED REVIEW</span>
          <strong>Recall first, rate second.</strong>
        </div>
        <div className="segmented">{levelOrder.map((item) => <button key={item} type="button" className={level === item ? "active" : ""} onClick={() => { setLevel(item); setIndex(0); setRevealed(false); }}>{item}</button>)}</div>
      </div>

      {current && (
        <section className="review-card card">
          <div className="review-card-meta">
            <span className={"mini-level level-" + current.item.level.toLowerCase()}>{current.item.level}</span>
            <span>strength {current.state?.strength ?? 0}/8</span>
            <span>{current.state ? "next: " + current.state.due : "new"}</span>
          </div>
          <small>{current.item.partOfSpeech}{current.item.article ? " · " + current.item.article : ""}</small>
          <strong>{revealed ? current.item.en : current.item.de}</strong>
          <SpeakButton text={current.item.de} />
          <p>{revealed ? current.item.contextExample : "Try to produce the meaning and one sentence before revealing."}</p>
          {revealed && current.item.chunks.length > 0 && <div className="chunk-row">{current.item.chunks.map((chunk) => <span key={chunk}>{chunk}</span>)}</div>}
          {!revealed ? (
            <button type="button" className="button primary" onClick={() => setRevealed(true)}>Reveal after recall</button>
          ) : (
            <div className="review-ratings">
              <button type="button" onClick={() => rate("again")}>Again</button>
              <button type="button" onClick={() => rate("hard")}>Hard</button>
              <button type="button" onClick={() => rate("good")}>Good</button>
              <button type="button" onClick={() => rate("easy")}>Easy</button>
            </div>
          )}
          <small>{index + 1} / {cards.length} · unseen and due items are prioritised</small>
        </section>
      )}
    </div>
  );
}
