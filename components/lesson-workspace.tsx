"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { CourseLesson } from "@/lib/types";
import { AiAnswerBox } from "./ai-answer-box";
import { ListeningPlayer } from "./listening-player";
import { SpeakButton } from "./speak-button";
import { useProgress } from "./progress-provider";

type Adjacent = Pick<CourseLesson, "level" | "moduleSlug" | "slug" | "title"> | undefined;
type Screen = { id: string; label: string; kind: "learn" | "answer" | "listen" | "quiz" | "finish"; index?: number };

const stageTitle: Record<CourseLesson["stage"], string> = {
  input: "Understand the situation",
  grammar: "Make the grammar work",
  lexis: "Build usable language",
  reception: "Understand connected German",
  production: "Produce your own German",
  review: "Retrieve and integrate",
};

const kindLabel: Record<Screen["kind"], string> = {
  learn: "Learn",
  answer: "AI assessed",
  listen: "Listening",
  quiz: "Quick check",
  finish: "Complete",
};

function lessonHref(item: Adjacent) {
  return item ? "/learn/" + item.level.toLowerCase() + "/" + item.moduleSlug + "/" + item.slug : "/learn";
}

export function LessonWorkspace({ lesson, previous, next }: { lesson: CourseLesson; previous?: Adjacent; next?: Adjacent }) {
  const progress = useProgress();
  const [screen, setScreen] = useState(0);
  const [passed, setPassed] = useState<Record<string, boolean>>({});
  const [quizAnswers, setQuizAnswers] = useState<Record<number, string>>({});
  const [quizChecked, setQuizChecked] = useState<Record<number, boolean>>({});

  useEffect(() => {
    progress.setLastLesson(lesson.id);
    progress.touchStudyDay();
    setScreen(0);
    setPassed({});
    setQuizAnswers({});
    setQuizChecked({});
  }, [lesson.id]);

  const screens = useMemo<Screen[]>(() => {
    const result: Screen[] = [{ id: "start", label: "Goal", kind: "learn" }];
    if (["input", "reception"].includes(lesson.stage)) {
      result.push({ id: "reading", label: "Read", kind: "learn" });
      result.push({ id: "gist", label: "Understand", kind: "answer" });
      result.push({ id: "listening", label: "Listen", kind: "listen" });
      if (lesson.stage === "reception") result.push({ id: "detail", label: "Explain", kind: "answer" });
    }
    if (["grammar", "production", "review"].includes(lesson.stage)) result.push({ id: "grammar", label: "Grammar", kind: "learn" });
    if (["input", "lexis", "production", "review"].includes(lesson.stage)) result.push({ id: "vocab", label: "Language", kind: "learn" });
    if (["grammar", "lexis", "production", "review"].includes(lesson.stage)) {
      lesson.controlled.slice(0, 3).forEach((_, index) => result.push({ id: "task-" + index, label: "Practice " + (index + 1), kind: "answer", index }));
    }
    if (["production", "review"].includes(lesson.stage)) result.push({ id: "production", label: "Produce", kind: "answer" });
    if (["grammar", "lexis", "reception", "review"].includes(lesson.stage)) {
      lesson.checkpoint.forEach((_, index) => result.push({ id: "quiz-" + index, label: "Check " + (index + 1), kind: "quiz", index }));
    }
    result.push({ id: "finish", label: "Complete", kind: "finish" });
    return result;
  }, [lesson]);

  const current = screens[screen];
  const progressPct = Math.round(((screen + 1) / screens.length) * 100);
  const canContinue = current.kind === "learn" || current.kind === "listen" || current.kind === "finish" || passed[current.id] === true;
  const alreadyComplete = progress.completedLessons.includes(lesson.id);

  function markAssessment(id: string, score: number) {
    setPassed((prev) => ({ ...prev, [id]: score >= 60 }));
  }

  function checkQuiz(index: number) {
    if (!quizAnswers[index]) return;
    const correct = quizAnswers[index] === lesson.checkpoint[index].answer;
    setQuizChecked((prev) => ({ ...prev, [index]: true }));
    if (correct) setPassed((prev) => ({ ...prev, ["quiz-" + index]: true }));
  }

  function complete() {
    const quizTotal = lesson.checkpoint.length;
    const quizScore = lesson.checkpoint.reduce((sum, question, index) => sum + (quizAnswers[index] === question.answer ? 1 : 0), 0);
    progress.completeLesson(lesson.id, quizScore, quizTotal, lesson.competencyIds);
  }

  const vocab = lesson.vocabulary.slice(0, 6);
  const task = current.index !== undefined ? lesson.controlled[current.index] : undefined;
  const question = current.index !== undefined ? lesson.checkpoint[current.index] : undefined;

  return (
    <div className="lesson-workspace">
      <aside className="lesson-rail">
        <Link href="/learn" className="lesson-back">← Back to course</Link>
        <div className="lesson-rail-title">
          <div><span className={"level-dot level-" + lesson.level.toLowerCase()}>{lesson.level}</span><span>Module {lesson.moduleIndex}</span></div>
          <h2>{lesson.moduleTitle}</h2>
          <p>{lesson.title}</p>
        </div>

        <div className="lesson-rail-progress">
          <div><span>Lesson progress</span><strong>{progressPct}%</strong></div>
          <div className="bar"><i style={{ width: progressPct + "%" }} /></div>
        </div>

        <nav className="lesson-outline" aria-label="Lesson activities">
          {screens.map((item, index) => {
            const done = index < screen || passed[item.id];
            return (
              <button
                type="button"
                key={item.id}
                className={(index === screen ? "active " : "") + (done ? "done" : "")}
                disabled={index > screen}
                onClick={() => index <= screen && setScreen(index)}
              >
                <span>{done ? "✓" : index + 1}</span>
                <div><strong>{item.label}</strong><small>{kindLabel[item.kind]}</small></div>
              </button>
            );
          })}
        </nav>

        <div className="lesson-ai-note">
          <span>✦</span>
          <p>Open answers are checked against this lesson, not a fixed answer string.</p>
        </div>
      </aside>

      <section className="lesson-canvas">
        <header className="lesson-canvas-header">
          <div>
            <span className="page-kicker">{stageTitle[lesson.stage]}</span>
            <h1>{current.label}</h1>
            <p>{lesson.scenario}</p>
          </div>
          <div className="lesson-canvas-meta"><span>{lesson.durationMinutes} min lesson</span><span>{screen + 1} / {screens.length}</span></div>
        </header>

        <article className="activity-surface card">
          {current.id === "start" && (
            <div className="activity-panel">
              <span className="activity-type">Lesson goal</span>
              <h2>{lesson.title}</h2>
              <p className="activity-lead">By the end of this lesson, you should be able to:</p>
              <ul className="goal-list">{lesson.objectives.map((objective) => <li key={objective}><span>✓</span>{objective}</li>)}</ul>
              <div className="context-callout"><small>Situation</small><strong>{lesson.scenario}</strong></div>
            </div>
          )}

          {current.id === "reading" && (
            <div className="activity-panel">
              <span className="activity-type">Read for meaning</span>
              <h2>{lesson.reading.title}</h2>
              <p className="activity-note">{lesson.reading.preReading[0]}</p>
              <article className="immersive-text" lang="de">{lesson.reading.text}</article>
              <p className="activity-note">First understand the situation. Do not translate every word.</p>
            </div>
          )}

          {current.id === "gist" && (
            <div className="activity-panel">
              <span className="activity-type ai">AI assessed · comprehension</span>
              <h2>{lesson.reading.gistQuestion}</h2>
              <p className="activity-note">Answer in simple German if you can. Meaning matters more than perfect grammar here.</p>
              <AiAnswerBox level={lesson.level} prompt={lesson.reading.gistQuestion} context={"Source text:\n" + lesson.reading.text} placeholder="In dem Text geht es um…" onAssessed={(result) => markAssessment(current.id, result.score)} />
            </div>
          )}

          {current.id === "listening" && (
            <div className="activity-panel">
              <span className="activity-type">Listening</span>
              <h2>Listen before you read.</h2>
              <p className="activity-note">First catch the situation. On the second listen, focus on concrete details.</p>
              <ListeningPlayer task={lesson.listening} />
            </div>
          )}

          {current.id === "detail" && (
            <div className="activity-panel">
              <span className="activity-type ai">AI assessed · detail</span>
              <h2>{lesson.reading.detailQuestions[0]}</h2>
              <AiAnswerBox level={lesson.level} prompt={lesson.reading.detailQuestions[0]} context={"Reading text:\n" + lesson.reading.text + "\n\nListening transcript:\n" + lesson.listening.script} placeholder="Antworte mit einem vollständigen Satz…" onAssessed={(result) => markAssessment(current.id, result.score)} />
            </div>
          )}

          {current.id === "grammar" && (
            <div className="activity-panel">
              <span className="activity-type">Grammar workshop</span>
              <h2>{lesson.grammar[0]?.name ?? "Grammar focus"}</h2>
              <p className="activity-lead">{lesson.grammar[0]?.explanation}</p>
              <div className="pattern-examples">
                {lesson.grammar[0]?.examples.slice(0, 4).map((example) => <div key={example}><span lang="de">{example}</span><SpeakButton text={example} compact /></div>)}
              </div>
              <Link href="/tutor" className="text-link">Ask the tutor to explain this differently →</Link>
            </div>
          )}

          {current.id === "vocab" && (
            <div className="activity-panel">
              <span className="activity-type">Useful language</span>
              <h2>Learn chunks you can actually use.</h2>
              <div className="lesson-word-list">
                {vocab.map((item) => <article key={item.de}><div><strong lang="de">{item.de}</strong><span>{item.en}</span></div><SpeakButton text={item.de} compact /><p lang="de">{item.contextExample}</p></article>)}
              </div>
            </div>
          )}

          {task && current.id.startsWith("task-") && (
            <div className="activity-panel">
              <span className="activity-type ai">AI assessed · your German</span>
              <h2>{task.prompt}</h2>
              {task.hint && <p className="activity-note">{task.hint}</p>}
              <AiAnswerBox
                level={lesson.level}
                prompt={task.prompt}
                context={"Lesson situation: " + lesson.scenario + "\nGrammar focus: " + lesson.grammar.map((item) => item.name).join(", ") + "\nUseful chunks: " + lesson.chunks.join(" | ")}
                expected={task.answer}
                multiline={task.type !== "fill"}
                placeholder="Write your own German answer…"
                onAssessed={(result) => markAssessment(current.id, result.score)}
              />
            </div>
          )}

          {current.id === "production" && (
            <div className="activity-panel">
              <span className="activity-type ai">AI assessed · free production</span>
              <h2>{lesson.production.writing}</h2>
              <div className="support-chips">{lesson.chunks.slice(0, 4).map((chunk) => <span key={chunk}>{chunk}</span>)}</div>
              <AiAnswerBox
                level={lesson.level}
                prompt={lesson.production.writing}
                context={"Module: " + lesson.moduleTitle + "\nScenario: " + lesson.scenario + "\nTarget grammar: " + lesson.grammar.map((item) => item.name).join(", ") + "\nChecklist: " + lesson.production.checklist.join(" | ")}
                minLength={20}
                placeholder="Write your response. DeutschMate will assess this exact answer…"
                onAssessed={(result) => markAssessment(current.id, result.score)}
              />
              <Link href="/speaking" className="production-link">Prefer to answer aloud? Open Speaking Studio →</Link>
            </div>
          )}

          {question && current.id.startsWith("quiz-") && (
            <div className="activity-panel">
              <span className="activity-type">Quick check</span>
              <h2>{question.q}</h2>
              <div className="focus-options">
                {question.options.map((option) => {
                  const selected = quizAnswers[current.index!] === option;
                  const checked = quizChecked[current.index!];
                  const correct = option === question.answer;
                  const cls = checked ? (correct ? "correct" : selected ? "wrong" : "") : selected ? "selected" : "";
                  return <button key={option} type="button" className={cls} onClick={() => { if (!checked) setQuizAnswers((prev) => ({ ...prev, [current.index!]: option })); }}>{option}</button>;
                })}
              </div>
              {!quizChecked[current.index!] ? (
                <button className="button primary" type="button" disabled={!quizAnswers[current.index!]} onClick={() => checkQuiz(current.index!)}>Check answer</button>
              ) : passed[current.id] ? (
                <div className="instant-feedback correct"><strong>✓ Correct</strong><span>Retrieved accurately.</span></div>
              ) : (
                <div className="instant-feedback wrong"><strong>Not yet</strong><span>The correct answer is <b>{question.answer}</b>.</span><button type="button" className="text-button" onClick={() => { setQuizChecked((prev) => ({ ...prev, [current.index!]: false })); setQuizAnswers((prev) => ({ ...prev, [current.index!]: "" })); }}>Try again</button></div>
              )}
            </div>
          )}

          {current.id === "finish" && (
            <div className="activity-panel finish-panel">
              <div className="finish-mark">✓</div>
              <span className="activity-type">Lesson complete</span>
              <h2>You produced evidence, not just clicks.</h2>
              <p>Your lesson contributes to the relevant CEFR can-do skills.</p>
              {!alreadyComplete && <button type="button" className="button primary large" onClick={complete}>Save lesson progress</button>}
              {alreadyComplete && <div className="instant-feedback correct"><strong>Saved</strong><span>This lesson is already in your profile.</span></div>}
              <div className="finish-actions">
                <Link className="button secondary" href={lessonHref(previous)}>← Previous lesson</Link>
                <Link className="button primary" href={next ? lessonHref(next) : "/assessments"}>{next ? "Next lesson →" : "Level assessments →"}</Link>
              </div>
            </div>
          )}
        </article>

        {current.kind !== "finish" && (
          <footer className="lesson-controls">
            <button type="button" className="button secondary" disabled={screen === 0} onClick={() => setScreen((value) => Math.max(0, value - 1))}>← Back</button>
            <div>
              {!canContinue && <span>Complete this task to continue</span>}
              <button type="button" className="button primary large" disabled={!canContinue} onClick={() => screen < screens.length - 1 && setScreen((value) => value + 1)}>Continue →</button>
            </div>
          </footer>
        )}
      </section>
    </div>
  );
}
