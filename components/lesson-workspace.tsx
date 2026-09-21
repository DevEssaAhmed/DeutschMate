"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { CourseLesson } from "@/lib/types";
import { ListeningPlayer } from "./listening-player";
import { SpeakButton } from "./speak-button";
import { useProgress } from "./progress-provider";

type Adjacent = Pick<CourseLesson, "level" | "moduleSlug" | "slug" | "title"> | undefined;

const stageLabels: Record<CourseLesson["stage"], string> = {
  input: "Context & input",
  grammar: "Grammar workshop",
  lexis: "Vocabulary & chunks",
  reception: "Reading & listening lab",
  production: "Guided production",
  review: "Review & checkpoint",
};

export function LessonWorkspace({ lesson, previous, next }: { lesson: CourseLesson; previous?: Adjacent; next?: Adjacent }) {
  const progress = useProgress();
  const { setLastLesson, touchStudyDay, recordLessonScore, completeLesson } = progress;
  const [taskAttempts, setTaskAttempts] = useState<Record<string, string>>({});
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [productionText, setProductionText] = useState("");
  const [speakingAttempted, setSpeakingAttempted] = useState(false);
  const [receptionEvidence, setReceptionEvidence] = useState("");
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    setLastLesson(lesson.id);
    touchStudyDay();
  }, [lesson.id, setLastLesson, touchStudyDay]);

  const score = useMemo(
    () => lesson.checkpoint.reduce((sum, question, index) => sum + (answers[index] === question.answer ? 1 : 0), 0),
    [answers, lesson.checkpoint],
  );

  const taskCount = Object.values(taskAttempts).filter((value) => value.trim().length >= 3).length;
  const productionDone = productionText.trim().length >= 20 || speakingAttempted;
  const quizReady = lesson.checkpoint.length === 0 || Object.keys(answers).length === lesson.checkpoint.length;
  const passed = lesson.checkpoint.length === 0 || score / lesson.checkpoint.length >= .66;
  const alreadyComplete = progress.completedLessons.includes(lesson.id);

  const showVocabulary = ["input", "lexis", "reception", "production", "review"].includes(lesson.stage);
  const showGrammar = ["grammar", "production", "review"].includes(lesson.stage);
  const showReception = ["input", "reception"].includes(lesson.stage);
  const showControlled = ["grammar", "lexis", "production", "review"].includes(lesson.stage);
  const showProduction = ["production", "review"].includes(lesson.stage);
  const showCheckpoint = ["grammar", "lexis", "reception", "review"].includes(lesson.stage);

  const completion = (() => {
    switch (lesson.stage) {
      case "input":
        return {
          ready: receptionEvidence.trim().length >= 20,
          label: "Write a short noticing note after working through the input.",
        };
      case "grammar":
        return {
          ready: taskCount >= 3 && quizReady && passed,
          label: "Attempt 3 controlled tasks and pass the checkpoint.",
        };
      case "lexis":
        return {
          ready: taskCount >= 3 && quizReady && passed,
          label: "Attempt 3 lexical tasks and pass the checkpoint.",
        };
      case "reception":
        return {
          ready: receptionEvidence.trim().length >= 30 && quizReady && passed,
          label: "Record gist/detail evidence and pass the checkpoint.",
        };
      case "production":
        return {
          ready: taskCount >= 2 && productionDone,
          label: "Attempt 2 scaffolded tasks and complete writing or speaking production.",
        };
      case "review":
        return {
          ready: taskCount >= 3 && productionDone && quizReady && passed,
          label: "Retrieve the language, produce German, and pass the checkpoint.",
        };
    }
  })();

  function finish() {
    setSubmitted(true);
    if (!completion.ready) {
      recordLessonScore(lesson.id, score, lesson.checkpoint.length);
      return;
    }
    completeLesson(lesson.id, score, lesson.checkpoint.length, lesson.competencyIds);
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
          <span>{stageLabels[lesson.stage]}</span>
        </div>
        <div className="lesson-outline">
          {Object.entries(stageLabels).map(([stage, label], index) => (
            <span key={stage} className={stage === lesson.stage ? "active current" : index < lesson.lessonIndex - 1 ? "active" : ""}>
              {index + 1}. {label}
            </span>
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

        {showVocabulary && (
          <section className="lesson-block">
            <div className="section-heading">
              <div><span className="eyebrow">{lesson.stage === "lexis" ? "LEXICAL WORKSHOP" : "LANGUAGE YOU NEED"}</span><h2>Vocabulary in context</h2></div>
              <span className="pill">{lesson.vocabulary.length} focus items</span>
            </div>
            <div className="rich-vocab-grid">
              {lesson.vocabulary.map((item) => (
                <article className="rich-vocab-card card" key={item.de}>
                  <div className="rich-vocab-head">
                    <div><strong>{item.de}</strong><span>{item.en}</span></div>
                    <SpeakButton text={item.de} compact />
                  </div>
                  <small>{item.partOfSpeech}{item.article ? " · " + item.article : ""}</small>
                  <p className="vocab-context-example">{item.contextExample}</p>
                  {item.chunks.length > 0 && <div className="chunk-row">{item.chunks.map((chunk) => <span key={chunk}>{chunk}</span>)}</div>}
                </article>
              ))}
            </div>
            <div className="module-chunks card">
              <strong>Module chunks</strong>
              <div>{lesson.chunks.map((chunk) => <span key={chunk}>{chunk}</span>)}</div>
            </div>
          </section>
        )}

        {showGrammar && (
          <section className="lesson-block">
            <span className="eyebrow">EXPLICIT GRAMMAR</span>
            <h2>Understand and manipulate the structure</h2>
            <div className="grammar-stack">
              {lesson.grammar.map((topic) => (
                <article className="grammar-card card" key={topic.name}>
                  <h3>{topic.name}</h3>
                  <p>{topic.explanation}</p>
                  <div className="example-list">
                    {topic.examples.map((example) => (
                      <div className="example-row" key={example}>
                        <code>{example}</code>
                        <SpeakButton text={example} compact />
                      </div>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {showReception && (
          <>
            <section className="lesson-block reading-work card">
              <span className="eyebrow">READING · {lesson.reading.genre}</span>
              <h2>{lesson.reading.title}</h2>
              <div className="pre-reading">{lesson.reading.preReading.map((item) => <span key={item}>{item}</span>)}</div>
              <p className="reading-text">{lesson.reading.text}</p>
              <div className="reception-questions">
                <strong>{lesson.stage === "input" ? "Notice before analysing" : "Work through the text"}</strong>
                <p><b>Gist:</b> {lesson.reading.gistQuestion}</p>
                {lesson.reading.detailQuestions.map((question) => <p key={question}>• {question}</p>)}
                <p><b>Language focus:</b> {lesson.reading.languageFocus.slice(0, 5).join(" · ")}</p>
              </div>
            </section>

            <ListeningPlayer task={lesson.listening} />

            <section className="lesson-block card reception-evidence">
              <span className="eyebrow">YOUR EVIDENCE</span>
              <h2>{lesson.stage === "input" ? "What did you notice?" : "Record gist and one important detail"}</h2>
              <p>
                {lesson.stage === "input"
                  ? "Write a short note about what you understood or a pattern you noticed. This is not graded for perfect German."
                  : "Summarise the gist and one concrete detail from the text or listening. Use German where you reasonably can."}
              </p>
              <textarea
                rows={5}
                value={receptionEvidence}
                onChange={(event) => setReceptionEvidence(event.target.value)}
                placeholder={lesson.stage === "input" ? "I noticed…" : "Hauptaussage / wichtiges Detail…"}
              />
            </section>
          </>
        )}

        {showControlled && (
          <section className="lesson-block">
            <span className="eyebrow">CONTROLLED PRACTICE</span>
            <h2>{lesson.stage === "lexis" ? "Retrieve and use the language" : "Manipulate the language yourself"}</h2>
            <div className="controlled-stack">
              {lesson.controlled.map((task, index) => (
                <label className="controlled-task card" key={task.id}>
                  <span>{index + 1}</span>
                  <div><strong>{task.prompt}</strong>{task.hint && <small>{task.hint}</small>}</div>
                  <textarea
                    value={taskAttempts[task.id] ?? ""}
                    onChange={(event) => setTaskAttempts((prev) => ({ ...prev, [task.id]: event.target.value }))}
                    rows={2}
                    placeholder="Write your answer before moving on…"
                  />
                </label>
              ))}
            </div>
          </section>
        )}

        {showProduction && (
          <section className="lesson-block production-work card">
            <span className="eyebrow">{lesson.stage === "review" ? "CUMULATIVE PRODUCTION" : "GUIDED → FREE PRODUCTION"}</span>
            <div className="production-grid">
              <div>
                <h3>Writing</h3>
                <p>{lesson.production.writing}</p>
                <textarea
                  value={productionText}
                  onChange={(event) => setProductionText(event.target.value)}
                  rows={8}
                  placeholder="Produce your own German here…"
                />
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
        )}

        {showCheckpoint && (
          <section className="lesson-block checkpoint card">
            <div className="section-heading">
              <div><span className="eyebrow">CHECKPOINT</span><h2>Retrieve before moving on</h2></div>
              <span className="score-pill">{submitted ? score + "/" + lesson.checkpoint.length : "not scored"}</span>
            </div>
            {lesson.checkpoint.map((question, index) => (
              <fieldset className="quiz-question" key={lesson.id + "-" + index}>
                <legend><span>{index + 1}</span>{question.q}</legend>
                <div className="answer-grid">
                  {question.options.map((option) => {
                    const selected = answers[index] === option;
                    const state = submitted
                      ? option === question.answer
                        ? "correct"
                        : selected
                          ? "wrong"
                          : ""
                      : selected
                        ? "selected"
                        : "";
                    return (
                      <button
                        type="button"
                        className={"answer-option " + state}
                        key={option}
                        onClick={() => setAnswers((prev) => ({ ...prev, [index]: option }))}
                      >
                        {option}
                      </button>
                    );
                  })}
                </div>
              </fieldset>
            ))}
          </section>
        )}

        <section className="lesson-completion card">
          <div>
            <span className="eyebrow">LESSON EVIDENCE</span>
            <h2>{alreadyComplete ? "Completed with evidence" : submitted && !completion.ready ? "More work is needed" : "Finish when you have done the work"}</h2>
            <p>{completion.label}</p>
          </div>
          <button type="button" className="button primary" onClick={finish} disabled={!completion.ready}>
            {alreadyComplete ? "Save another attempt" : "Complete lesson"}
          </button>
        </section>

        <nav className="lesson-nav" aria-label="Lesson navigation">
          {previous ? (
            <Link className="lesson-nav-link" href={"/learn/" + previous.level.toLowerCase() + "/" + previous.moduleSlug + "/" + previous.slug}>
              <small>← Previous</small><strong>{previous.title}</strong>
            </Link>
          ) : <span />}
          {next ? (
            <Link className="lesson-nav-link next" href={"/learn/" + next.level.toLowerCase() + "/" + next.moduleSlug + "/" + next.slug}>
              <small>Next →</small><strong>{next.title}</strong>
            </Link>
          ) : (
            <Link className="lesson-nav-link next" href="/assessments">
              <small>Course path complete</small><strong>Take an assessment</strong>
            </Link>
          )}
        </nav>
      </main>
    </div>
  );
}
