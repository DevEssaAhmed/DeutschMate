"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { CourseUnit } from "@/lib/types";
import { SpeakButton } from "./speak-button";
import { useProgress } from "./progress-provider";

type Adjacent = Pick<CourseUnit, "level" | "slug" | "title"> | undefined;

export function LessonClient({ unit, previous, next }: { unit: CourseUnit; previous?: Adjacent; next?: Adjacent }) {
  const progress = useProgress();
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [activeTab, setActiveTab] = useState<"learn" | "practice">("learn");
  const complete = progress.completed.includes(unit.id);

  useEffect(() => {
    progress.setLastUnit(unit.id);
    progress.touchStudyDay();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unit.id]);

  const score = useMemo(() => unit.quiz.reduce((sum, q, index) => sum + (answers[index] === q.answer ? 1 : 0), 0), [answers, unit.quiz]);

  function submitQuiz() {
    setSubmitted(true);
    progress.recordQuiz(unit.id, score, unit.quiz.length);
  }

  function resetQuiz() {
    setAnswers({});
    setSubmitted(false);
  }

  return (
    <div className="lesson-layout">
      <aside className="lesson-sidebar card">
        <div className={`level-badge level-${unit.level.toLowerCase()}`}>{unit.level}</div>
        <span className="eyebrow">UNIT {unit.id}</span>
        <h1>{unit.title}</h1>
        <div className="lesson-meta"><span>{unit.vocab.length} words</span><span>{unit.grammar.length} grammar</span><span>{unit.quiz.length} quiz</span></div>
        <div className="lesson-tabs">
          <button className={activeTab === "learn" ? "active" : ""} onClick={() => setActiveTab("learn")}>Learn</button>
          <button className={activeTab === "practice" ? "active" : ""} onClick={() => setActiveTab("practice")}>Practice</button>
        </div>
        <button className={`button ${complete ? "secondary" : "primary"}`} onClick={() => progress.markComplete(unit.id, !complete)}>
          {complete ? "✓ Unit completed" : "Mark unit complete"}
        </button>
      </aside>

      <main className="lesson-content">
        {activeTab === "learn" ? (
          <>
            <section className="lesson-section card">
              <span className="eyebrow">OUTCOMES</span><h2>What you will learn</h2>
              <ul className="check-list">{unit.goals.map((goal) => <li key={goal}>{goal}</li>)}</ul>
            </section>

            <section className="lesson-section">
              <div className="section-heading"><div><span className="eyebrow">VOCABULARY</span><h2>Core words & expressions</h2></div><span className="pill">{unit.vocab.length} items</span></div>
              <div className="vocab-grid">
                {unit.vocab.map((item) => (
                  <article className="vocab-card card" key={`${unit.id}-${item.de}`}>
                    <div><strong>{item.de}</strong><span>{item.en}</span></div><SpeakButton text={item.de} compact />
                  </article>
                ))}
              </div>
            </section>

            <section className="lesson-section">
              <div className="section-heading"><div><span className="eyebrow">GRAMMAR</span><h2>Build the structure</h2></div></div>
              <div className="grammar-stack">
                {unit.grammar.map((topic) => (
                  <article className="grammar-card card" key={topic.name}>
                    <h3>{topic.name}</h3><p>{topic.explanation}</p>
                    <div className="example-list">
                      {topic.examples.map((example) => <div className="example-row" key={example}><code>{example}</code><SpeakButton text={example} compact /></div>)}
                    </div>
                  </article>
                ))}
              </div>
            </section>
          </>
        ) : (
          <>
            <section className="lesson-section">
              <span className="eyebrow">ACTIVE PRACTICE</span><h2>Turn input into output</h2>
              <div className="practice-grid">
                {unit.practice.map((task) => <article className="practice-card card" key={task.label}><span>{task.label}</span><p>{task.text}</p></article>)}
              </div>
            </section>

            <section className="lesson-section card quiz-card">
              <div className="section-heading"><div><span className="eyebrow">CHECKPOINT</span><h2>{unit.level} unit quiz</h2></div>{submitted && <span className="score-pill">{score}/{unit.quiz.length}</span>}</div>
              <div className="quiz-list">
                {unit.quiz.map((question, index) => (
                  <fieldset className="quiz-question" key={`${unit.id}-quiz-${index}`}>
                    <legend><span>{index + 1}</span>{question.q}</legend>
                    <div className="answer-grid">
                      {question.options.map((option) => {
                        const selected = answers[index] === option;
                        const state = submitted ? option === question.answer ? "correct" : selected ? "wrong" : "" : selected ? "selected" : "";
                        return <button disabled={submitted} className={`answer-option ${state}`} key={option} onClick={() => setAnswers((prev) => ({ ...prev, [index]: option }))}>{option}</button>;
                      })}
                    </div>
                  </fieldset>
                ))}
              </div>
              <div className="quiz-actions">
                {!submitted ? <button className="button primary" disabled={Object.keys(answers).length !== unit.quiz.length} onClick={submitQuiz}>Check answers</button> : <button className="button secondary" onClick={resetQuiz}>Try again</button>}
                {submitted && <p>{score === unit.quiz.length ? "Perfect. Mark this unit complete and continue." : score >= Math.ceil(unit.quiz.length * .7) ? "Good result. Review missed items once before moving on." : "Review the vocabulary and grammar, then retry."}</p>}
              </div>
            </section>
          </>
        )}

        <nav className="lesson-nav" aria-label="Lesson navigation">
          {previous ? <Link className="lesson-nav-link" href={`/learn/${previous.level.toLowerCase()}/${previous.slug}`}><small>← Previous</small><strong>{previous.title}</strong></Link> : <span />}
          {next ? <Link className="lesson-nav-link next" href={`/learn/${next.level.toLowerCase()}/${next.slug}`}><small>Next →</small><strong>{next.title}</strong></Link> : <Link className="lesson-nav-link next" href="/progress"><small>Course complete</small><strong>View progress</strong></Link>}
        </nav>
      </main>
    </div>
  );
}
