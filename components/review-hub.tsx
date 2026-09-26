"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { allRichVocabulary, levelOrder } from "@/lib/curriculum";
import type { LevelId } from "@/lib/types";
import { SpeakButton } from "./speak-button";
import { useProgress, vocabularyKey } from "./progress-provider";

type ViewMode = "DUE" | LevelId;

export function ReviewHub() {
  const progress = useProgress();
  const [level, setLevel] = useState<ViewMode>("DUE");
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const today = new Date().toISOString().slice(0, 10);

  // Compute due counts per level
  const dueCounts = useMemo(() => {
    const counts: Record<string, number> = { DUE: 0 };
    for (const lvl of levelOrder) {
      counts[lvl] = 0;
    }
    for (const item of allRichVocabulary) {
      const state = progress.review[vocabularyKey(item.level, item.de)];
      if (state && state.due <= today) {
        counts[item.level] = (counts[item.level] || 0) + 1;
        counts.DUE += 1;
      }
    }
    return counts;
  }, [progress.review, today]);

  const cards = useMemo(() => {
    const items =
      level === "DUE"
        ? allRichVocabulary.filter((item) => {
            const state = progress.review[vocabularyKey(item.level, item.de)];
            return state && state.due <= today;
          })
        : allRichVocabulary.filter((item) => item.level === level);

    return items
      .map((item) => ({ item, state: progress.review[vocabularyKey(item.level, item.de)] }))
      .sort((a, b) => {
        const aDue = !a.state || a.state.due <= today ? 0 : 1;
        const bDue = !b.state || b.state.due <= today ? 0 : 1;
        if (aDue !== bDue) return aDue - bDue;
        return (a.state?.strength ?? -1) - (b.state?.strength ?? -1);
      });
  }, [level, progress.review, today]);

  const current = cards.length > 0 ? cards[index % cards.length] : undefined;

  function rate(rating: "again" | "hard" | "good" | "easy") {
    if (!current) return;
    progress.rateVocabulary(vocabularyKey(current.item.level, current.item.de), rating);
    if (cards.length <= 1) {
      setIndex(0);
    } else {
      setIndex((value) => (value + 1) % cards.length);
    }
    setRevealed(false);
  }

  // Keyboard navigation
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Don't intercept if typing in an input
      if (["INPUT", "TEXTAREA", "SELECT"].includes((e.target as HTMLElement)?.tagName)) return;

      if (!revealed) {
        if (e.code === "Space" || e.key === "Enter") {
          e.preventDefault();
          setRevealed(true);
        }
      } else {
        if (e.key === "1") {
          e.preventDefault();
          rate("again");
        } else if (e.key === "2") {
          e.preventDefault();
          rate("hard");
        } else if (e.key === "3") {
          e.preventDefault();
          rate("good");
        } else if (e.key === "4") {
          e.preventDefault();
          rate("easy");
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [revealed, current, cards.length]);

  return (
    <div className="review-hub">
      <div className="practice-toolbar card">
        <div>
          <span className="eyebrow">SPACED REVIEW</span>
          <strong>Recall first, rate second.</strong>
        </div>
        <div className="segmented">
          <button
            type="button"
            className={level === "DUE" ? "active" : ""}
            onClick={() => { setLevel("DUE"); setIndex(0); setRevealed(false); }}
          >
            All Due ({dueCounts.DUE})
          </button>
          {levelOrder.map((item) => (
            <button
              key={item}
              type="button"
              className={level === item ? "active" : ""}
              onClick={() => { setLevel(item); setIndex(0); setRevealed(false); }}
            >
              {item} {dueCounts[item] > 0 && <span className="badge-count">({dueCounts[item]})</span>}
            </button>
          ))}
        </div>
      </div>

      {cards.length === 0 && level === "DUE" ? (
        <section className="review-card card review-empty-card">
          <div className="finish-mark">✓</div>
          <span className="eyebrow">QUEUE CLEAR</span>
          <h2>All due vocabulary reviewed!</h2>
          <p>You have completed all scheduled spaced reviews for today. Choose a specific CEFR level above to preview or refresh more words.</p>
          <div className="finish-actions" style={{ marginTop: 16 }}>
            <button type="button" className="button primary" onClick={() => { setLevel("A1"); setIndex(0); }}>Review A1 Vocabulary</button>
            <Link href="/" className="button secondary">Return to Today</Link>
          </div>
        </section>
      ) : current ? (
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
          {revealed && current.item.chunks.length > 0 && (
            <div className="chunk-row">
              {current.item.chunks.map((chunk) => <span key={chunk}>{chunk}</span>)}
            </div>
          )}
          {!revealed ? (
            <div className="review-reveal-row">
              <button type="button" className="button primary large" onClick={() => setRevealed(true)}>
                Reveal after recall <kbd className="shortcut-key">Space</kbd>
              </button>
            </div>
          ) : (
            <div className="review-ratings">
              <button type="button" onClick={() => rate("again")}>
                <span>Again</span> <kbd className="shortcut-key">1</kbd>
              </button>
              <button type="button" onClick={() => rate("hard")}>
                <span>Hard</span> <kbd className="shortcut-key">2</kbd>
              </button>
              <button type="button" onClick={() => rate("good")}>
                <span>Good</span> <kbd className="shortcut-key">3</kbd>
              </button>
              <button type="button" onClick={() => rate("easy")}>
                <span>Easy</span> <kbd className="shortcut-key">4</kbd>
              </button>
            </div>
          )}
          <small>{index + 1} / {cards.length} · unseen and due items are prioritised</small>
        </section>
      ) : null}
    </div>
  );
}
