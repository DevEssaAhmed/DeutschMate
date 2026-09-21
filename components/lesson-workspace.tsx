"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { CourseLesson } from "@/lib/types";
import { ListeningPlayer } from "./listening-player";
import { SpeakButton } from "./speak-button";
import { useProgress } from "./progress-provider";

type Adjacent = Pick<CourseLesson, "level" | "moduleSlug" | "slug" | "title"> | undefined;

export function LessonWorkspace({ lesson, previous, next }: { lesson: CourseLesson; previous?: Adjacent; next?: Adjacent }) {
  const progress = useProgress();
  const [taskAttempts, setTaskAttempts] = useState<Record<string, string>>({});
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [productionText, setProductionText] = useState("");
  const [speakingAttempted, setSpeakingAttempted] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    progress.setLastLesson(lesson.id);
    progress.touchStudyDay();
  }, [lesson.id, progress]);

  const score = useMemo(
    () => lesson.checkpoint.reduce((sum, question, index) => sum + (answers[index] === question.answer ? 1 : 0), 0),
    [answers, lesson.checkpoint],
  );
  const taskCount = Object.values(taskAttempts).filter((value) => value.trim().length >= 3).length;
  const productionDone = productionText.trim().length >= 20 || speakingAttempted;
  const quizReady = Object.keys(answers).length === lesson.checkpoint.length;
  const passed = lesson.checkpoint.length === 0 || score / lesson.checkpoint.length >= .66;
  const alreadyComplete = progress.completedLessons.includes(lesson.id);

  function finish() {
    setSubmitted(true);
    if (!quizReady || taskCount < 3 || !productionDone || !passed) {
      progress.recordLessonScore(lesson.id, score, lesson.checkpoint.length);
      return;
    }
    progress.completeLesson(lesson.id, score, lesson.checkpoint.length, lesson.competencyIds);
  }

  return (
    <div className="lesson-v2-layout">
      <aside className="lesson-v2-sidebar card">
        <span className={"level-badge level-" + lesson.level.toLowerCase()}>{lesson.level}</span>
        <span className="eyebrow">MODULE {lesson.moduleIndex} · LESSON {lesson.lessonIndex}/6</span>
        <h1>{lesson.title}</h1>
        <p>{lesson.scenario}</p>
        <div className="lesson-meta">
          <span>{lesson.durationMinutes} min</span>
          <span>{lesson.stage}</span>
          <span>{lesson.vocabulary.length} focus terms</span>
        </div>
        <div className="lesson-outline">
          {["Teach","Demonstrate","Controlled practice","Guided production","Free production","Review"].map((item, index) => (
            <span key={item} className={index <= lesson.lessonIndex - 1 ? "active" : ""}>{index + 1}. {item}</span>
          ))}
        </div>
        <Link href="/tutor" className="button secondary">Ask the tutor</Link>
      </aside>

      <main className="lesson-v2-content">
        <section className="lesson-block card">
          <span className="eyebrow">CONTEXT & OUTCOMES</span>
          <h2>{lesson.moduleTitle}</h2>
          <p className="lead">You are practising German for {lesson.scenario}.</p>
          <ul className="check-list">{lesson.objectives.map((objective) => <li key={objective}>{objective}</li>)}</ul>
        </section>

        <section className="lesson-block">
          <div className="section-heading"><div><span className="eyebrow">VOCABULARY IN CONTEXT</span><h2>Words and chunks you need</h2></div></div>
          <div className="rich-vocab-grid">
            {lesson.vocabulary.map((item) => (
              <article className="rich-vocab-card card" key={item.de}>
                <div className="rich-vocab-head"><div><strong>{item.de}</strong><span>{item.en}</span></div><SpeakButton text={item.de} compact /></div>
                <small>{item.partOfSpeech}{item.article ? " · " + item.article : ""}</small>
                {item.chunks.length > 0 && <div className="chunk-row">{item.chunks.map((chunk) => <span key={chunk}>{chunk}</span>)}</div>}
              </article>
            ))}
          </div>
          <div className="module-chunks card">
            <strong>Useful chunks</strong>
            <div>{lesson.chunks.map((chunk) => <span key={chunk}>{chunk}</span>)}</div>
          </div>
        </section>

        <section className="lesson-block">
          <span className="eyebrow">EXPLICIT GRAMMAR</span>
          <h2>Understand the structure</h2>
          <div className="grammar-stack">
            {lesson.grammar.map((topic) => (
              <article className="grammar-card card" key={topic.name}>
                <h3>{topic.name}</h3><p>{topic.explanation}</p>
                <div className="example-list">
                  {topic.examples.map((example) => <div className="example-row" key={example}><code>{example}</code><SpeakButton text={example} compact /></div>)}
                </div>
              </article>
            ))}
          </div>
        </section>

        {(lesson.stage === "input" || lesson.stage === "reception" || lesson.stage === "review") && (
          <>
            <section className="lesson-block reading-work card">
              <span className="eyebrow">READING · {lesson.reading.genre}</span>
              <h2>{lesson.reading.title}</h2>
              <div className="pre-reading">{lesson.reading.preReading.map((item) => <span key={item}>{item}</span>)}</div>
              <p className="reading-text">{lesson.reading.text}</p>
              <div className="reception-questions">
                <strong>Work through the text</strong>
                <p><b>Gist:</b> {lesson.reading.gistQuestion}</p>
                {lesson.reading.detailQuestions.map((question) => <p key={question}>• {question}</p>)}
                <p><b>After reading:</b> {lesson.reading.afterReading}</p>
              </div>
            </section>
            <ListeningPlayer task={lesson.listening} />
          </>
        )}

        <section className="lesson-block">
          <span className="eyebrow">CONTROLLED PRACTICE</span>
          <h2>Manipulate the language yourself</h2>
          <div className="controlled-stack">
            {lesson.controlled.map((task, index) => (
              <label className="controlled-task card" key={task.id}>
                <span>{index + 1}</span>
                <div><strong>{task.prompt}</strong>{task.hint && <small>{task.hint}</small>}</div>
                <textarea
                  value={taskAttempts[task.id] ?? ""}
                  onChange={(e) => setTaskAttempts((prev) => ({ ...prev, [task.id]: e.target.value }))}
                  rows={2}
                  placeholder="Write your answer before moving on…"
                />
              </label>
            ))}
          </div>
        </section>

        <section className="lesson-block production-work card">
          <span className="eyebrow">GUIDED → FREE PRODUCTION</span>
          <div className="production-grid">
            <div>
              <h3>Writing</h3>
              <p>{lesson.production.writing}</p>
              <textarea value={productionText} onChange={(e) => setProductionText(e.target.value)} rows={8} placeholder="Produce your own German here…" />
              <Link href="/writing" className="text-link">Open the full Writing Studio →</Link>
            </div>
            <div>
              <h3>Speaking</h3>
              <p>{lesson.production.speaking}</p>
              <button type="button" className={"button " + (speakingAttempted ? "secondary" : "primary")} onClick={() => setSpeakingAttempted(true)}>
                {speakingAttempted ? "✓ Speaking attempt logged" : "I completed the speaking task"}
              </button>
              <Link href="/speaking" className="text-link">Open Speaking Studio →</Link>
              <ul className="production-checklist">{lesson.production.checklist.map((item) => <li key={item}>{item}</li>)}</ul>
            </div>
          </div>
        </section>

        <section className="lesson-block checkpoint card">
          <div className="section-heading"><div><span className="eyebrow">REVIEW</span><h2>Checkpoint</h2></div><span className="score-pill">{submitted ? score + "/" + lesson.checkpoint.length : "not scored"}</span></div>
          {lesson.checkpoint.map((question, index) => (
            <fieldset className="quiz-question" key={lesson.id + "-" + index}>
              <legend><span>{index + 1}</span>{question.q}</legend>
              <div className="answer-grid">
                {question.options.map((option) => {
                  const selected = answers[index] === option;
                  const state = submitted ? option === question.answer ? "correct" : selected ? "wrong" : "" : selected ? "selected" : "";
                  return <button type="button" className={"answer-option " + state} key={option} onClick={() => setAnswers((prev) => ({ ...prev, [index]: option }))}>{option}</button>;
                })}
              </div>
            </fieldset>
          ))}
          <div className="lesson-finish">
            <div>
              <strong>{alreadyComplete ? "Lesson completed" : submitted && (!passed || taskCount < 3 || !productionDone) ? "Not complete yet" : "Ready when the work is done"}</strong>
              <small>Requirements: 3 controlled tasks attempted · one production task · at least 2/3 checkpoint answers correct.</small>
            </div>
            <button type="button" className="button primary" disabled={!quizReady || taskCount < 3 || !productionDone} onClick={finish}>
              {alreadyComplete ? "Re-submit evidence" : "Finish lesson"}
            </button>
          </div>
        </section>

        <nav className="lesson-nav" aria-label="Lesson navigation">
          {previous ? <Link className="lesson-nav-link" href={"/learn/" + previous.level.toLowerCase() + "/" + previous.moduleSlug + "/" + previous.slug}><small>← Previous</small><strong>{previous.title}</strong></Link> : <span />}
          {next ? <Link className="lesson-nav-link next" href={"/learn/" + next.level.toLowerCase() + "/" + next.moduleSlug + "/" + next.slug}><small>Next →</small><strong>{next.title}</strong></Link> : <Link className="lesson-nav-link next" href="/assessments"><small>Course path complete</small><strong>Take an assessment</strong></Link>}
        </nav>
      </main>
    </div>
  );
}
