"use client";

import { useMemo, useState } from "react";
import type { LevelId, QuizQuestion } from "@/lib/types";
import { SpeakButton } from "./speak-button";
import { useProgress } from "./progress-provider";

type Vocab = { de: string; en: string; level: LevelId; unit: string; unitId: number };
type Question = QuizQuestion & { level: LevelId; unitId: number; unit: string };

type Mode = "flashcards" | "quiz";

function shuffled<T>(items: T[]) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function PracticeHub({ vocabulary, questions }: { vocabulary: Vocab[]; questions: Question[] }) {
  const [mode, setMode] = useState<Mode>("flashcards");
  const [level, setLevel] = useState<"ALL" | LevelId>("ALL");
  const [seed, setSeed] = useState(0);
  const [cardIndex, setCardIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const progress = useProgress();

  const cards = useMemo(() => shuffled(vocabulary.filter((item) => level === "ALL" || item.level === level)).slice(0, 30), [vocabulary, level, seed]);
  const quiz = useMemo(() => shuffled(questions.filter((item) => level === "ALL" || item.level === level)).slice(0, 12), [questions, level, seed]);
  const score = quiz.reduce((sum, q, index) => sum + (answers[index] === q.answer ? 1 : 0), 0);
  const card = cards[cardIndex % Math.max(cards.length, 1)];
  const hasCards = cards.length > 0;
  const hasQuiz = quiz.length > 0;

  function refresh() {
    setSeed((n) => n + 1);
    setCardIndex(0);
    setRevealed(false);
    setAnswers({});
    setSubmitted(false);
    progress.touchStudyDay();
  }

  return (
    <div className="practice-shell">
      <div className="practice-toolbar card">
        <div className="segmented large"><button type="button" className={mode === "flashcards" ? "active" : ""} onClick={() => setMode("flashcards")} aria-pressed={mode === "flashcards"}>Flashcards</button><button type="button" className={mode === "quiz" ? "active" : ""} onClick={() => setMode("quiz")} aria-pressed={mode === "quiz"}>Mixed quiz</button></div>
        <div className="segmented">{(["ALL","A1","A2","B1","B2","C1"] as const).map((id) => <button type="button" className={level === id ? "active" : ""} onClick={() => { setLevel(id); refresh(); }} key={id} aria-pressed={level === id}>{id === "ALL" ? "All" : id}</button>)}</div>
        <button type="button" className="button secondary" onClick={refresh}>New set ↻</button>
      </div>

      {mode === "flashcards" && card && (
        <section className="flash-area">
          <div
            className="flashcard-large card"
            onClick={() => setRevealed((v) => !v)}
            onKeyDown={(event) => {
              if (event.key !== "Enter" && event.key !== " ") return;
              event.preventDefault();
              setRevealed((v) => !v);
            }}
            role="button"
            tabIndex={0}
            aria-pressed={revealed}
          >
            <span className={`mini-level level-${card.level.toLowerCase()}`}>{card.level}</span>
            <small>{card.unit}</small>
            <strong>{revealed ? card.en : card.de}</strong>
            <p>{revealed ? "English meaning" : "Tap the card to reveal the meaning"}</p>
            <SpeakButton text={card.de} />
          </div>
          <div className="flash-actions"><button type="button" className="button secondary" onClick={() => { setCardIndex((i) => Math.max(0, i - 1)); setRevealed(false); }} disabled={!hasCards}>← Previous</button><span>{cardIndex + 1} / {cards.length}</span><button type="button" className="button primary" onClick={() => { setCardIndex((i) => (i + 1) % cards.length); setRevealed(false); progress.touchStudyDay(); }} disabled={!hasCards}>Next →</button></div>
        </section>
      )}
      {mode === "flashcards" && !hasCards && <section className="card empty-state"><p>No flashcards available for this level filter yet.</p></section>}

      {mode === "quiz" && (
        <section className="card mixed-quiz">
          <div className="section-heading"><div><span className="eyebrow">REVIEW MODE</span><h2>12-question mixed checkpoint</h2></div>{submitted && <span className="score-pill">{score}/{quiz.length}</span>}</div>
          {quiz.map((question, index) => (
            <fieldset className="quiz-question" key={`${question.unitId}-${index}`}>
              <legend><span>{index + 1}</span>{question.q}<small>{question.level} · {question.unit}</small></legend>
              <div className="answer-grid">
                {question.options.map((option) => {
                  const selected = answers[index] === option;
                  const state = submitted ? option === question.answer ? "correct" : selected ? "wrong" : "" : selected ? "selected" : "";
                  return <button type="button" disabled={submitted} className={`answer-option ${state}`} key={option} onClick={() => setAnswers((prev) => ({ ...prev, [index]: option }))} aria-pressed={selected}>{option}</button>;
                })}
              </div>
            </fieldset>
          ))}
          {!hasQuiz && <p className="result-count">No quiz questions available for this level filter yet.</p>}
          <div className="quiz-actions">{!submitted ? <button type="button" className="button primary" disabled={!hasQuiz || Object.keys(answers).length !== quiz.length} onClick={() => { setSubmitted(true); progress.touchStudyDay(); }}>Check set</button> : <button type="button" className="button secondary" onClick={refresh}>Start a new set</button>}</div>
        </section>
      )}
    </div>
  );
}
