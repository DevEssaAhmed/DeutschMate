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

    if (["grammar", "production", "review"].includes(lesson.stage)) {
      result.push({ id: "grammar", label: "Grammar", kind: "learn" });
    }

    if (["input", "lexis", "production", "review"].includes(lesson.stage)) {
      result.push({ id: "vocab", label: "Language", kind: "learn" });
    }

    if (["grammar", "lexis", "production", "review"].includes(lesson.stage)) {
      lesson.controlled.slice(0, 3).forEach((_, index) => result.push({ id: "task-" + index, label: "Practice", kind: "answer", index }));
    }

    if (["production", "review"].includes(lesson.stage)) {
      result.push({ id: "production", label: "Produce", kind: "answer" });
    }

    if (["grammar", "lexis", "reception", "review"].includes(lesson.stage)) {
      lesson.checkpoint.forEach((_, index) => result.push({ id: "quiz-" + index, label: "Check", kind: "quiz", index }));
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

  function continueLesson() {
    if (!canContinue) return;
    if (screen < screens.length - 1) setScreen((value) => value + 1);
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
    <div className="focus-lesson">
      <header className="focus-lesson-top">
        <Link href="/learn" className="focus-back">← Course</Link>
        <div className="focus-progress" aria-label={"Lesson progress " + progressPct + "%"}>
          <i style={{ width: progressPct + "%" }} />
        </div>
        <span>{screen + 1}/{screens.length}</span>
      </header>

      <div className="focus-context">
        <div>
          <span className={"mini-level level-" + lesson.level.toLowerCase()}>{lesson.level}</span>
          <span>Module {lesson.moduleIndex}</span>
          <span>{lesson.durationMinutes} min</span>
        </div>
        <h1>{stageTitle[lesson.stage]}</h1>
        <p>{lesson.moduleTitle} · {lesson.scenario}</p>
      </div>

      <main className="focus-stage card">
        {current.id === "start" && (
          <div className="focus-panel intro-panel">
            <span className="activity-kicker">TODAY'S TARGET</span>
            <h2>{lesson.title}</h2>
            <p className="activity-lead">By the end of this lesson, you should be able to:</p>
            <ul className="goal-list">{lesson.objectives.map((objective) => <li key={objective}><span>✓</span>{objective}</li>)}</ul>
            <div className="scenario-strip"><small>Situation</small><strong>{lesson.scenario}</strong></div>
          </div>
        )}

        {current.id === "reading" && (
          <div className="focus-panel reading-panel">
            <span className="activity-kicker">READ FOR MEANING</span>
            <h2>{lesson.reading.title}</h2>
            <div className="pre-reading compact">{lesson.reading.preReading.slice(0, 1).map((item) => <span key={item}>{item}</span>)}</div>
            <article className="immersive-text" lang="de">{lesson.reading.text}</article>
            <p className="activity-note">Do not translate every word. Work out the situation and the writer's main purpose first.</p>
          </div>
        )}

        {current.id === "gist" && (
          <div className="focus-panel">
            <span className="activity-kicker">AI CHECK · COMPREHENSION</span>
            <h2>{lesson.reading.gistQuestion}</h2>
            <p className="activity-note">Answer in simple German if you can. Meaning matters more than perfect grammar here.</p>
            <AiAnswerBox
              level={lesson.level}
              prompt={lesson.reading.gistQuestion}
              context={"Source text:\n" + lesson.reading.text}
              placeholder="Zum Beispiel: In dem Text geht es um…"
              onAssessed={(result) => markAssessment(current.id, result.score)}
            />
          </div>
        )}

        {current.id === "listening" && (
          <div className="focus-panel">
            <span className="activity-kicker">LISTENING</span>
            <h2>Listen before you read.</h2>
            <p className="activity-note">First catch the situation. On the second listen, focus on concrete details.</p>
            <ListeningPlayer task={lesson.listening} />
          </div>
        )}

        {current.id === "detail" && (
          <div className="focus-panel">
            <span className="activity-kicker">AI CHECK · DETAIL</span>
            <h2>{lesson.reading.detailQuestions[0]}</h2>
            <AiAnswerBox
              level={lesson.level}
              prompt={lesson.reading.detailQuestions[0]}
              context={"Reading text:\n" + lesson.reading.text + "\n\nListening transcript:\n" + lesson.listening.script}
              placeholder="Antworte mit einem vollständigen Satz…"
              onAssessed={(result) => markAssessment(current.id, result.score)}
            />
          </div>
        )}

        {current.id === "grammar" && (
          <div className="focus-panel grammar-focus">
            <span className="activity-kicker">HOW GERMAN WORKS</span>
            <h2>{lesson.grammar[0]?.name ?? "Grammar focus"}</h2>
            <p className="activity-lead">{lesson.grammar[0]?.explanation}</p>
            <div className="pattern-examples">
              {lesson.grammar[0]?.examples.slice(0, 4).map((example) => (
                <div key={example}><span lang="de">{example}</span><SpeakButton text={example} compact /></div>
              ))}
            </div>
            <Link href="/tutor" className="text-link">I need a deeper explanation →</Link>
          </div>
        )}

        {current.id === "vocab" && (
          <div className="focus-panel">
            <span className="activity-kicker">USEFUL LANGUAGE</span>
            <h2>Learn these as chunks, not isolated translations.</h2>
            <div className="lesson-word-list">
              {vocab.map((item) => (
                <article key={item.de}>
                  <div><strong lang="de">{item.de}</strong><span>{item.en}</span></div>
                  <SpeakButton text={item.de} compact />
                  <p lang="de">{item.contextExample}</p>
                </article>
              ))}
            </div>
          </div>
        )}

        {task && current.id.startsWith("task-") && (
          <div className="focus-panel">
            <span className="activity-kicker">AI CHECK · YOUR GERMAN</span>
            <h2>{task.prompt}</h2>
            {task.hint && <p className="activity-note">{task.hint}</p>}
            <AiAnswerBox
              level={lesson.level}
              prompt={task.prompt}
              context={
                "Lesson situation: " + lesson.scenario +
                "\nGrammar focus: " + lesson.grammar.map((item) => item.name).join(", ") +
                "\nUseful chunks: " + lesson.chunks.join(" | ")
              }
              expected={task.answer}
              multiline={task.type !== "fill"}
              placeholder="Write your own German answer…"
              onAssessed={(result) => markAssessment(current.id, result.score)}
            />
          </div>
        )}

        {current.id === "production" && (
          <div className="focus-panel production-focus">
            <span className="activity-kicker">AI CHECK · FREE PRODUCTION</span>
            <h2>{lesson.production.writing}</h2>
            <div className="support-chips">{lesson.chunks.slice(0, 4).map((chunk) => <span key={chunk}>{chunk}</span>)}</div>
            <AiAnswerBox
              level={lesson.level}
              prompt={lesson.production.writing}
              context={
                "Module: " + lesson.moduleTitle +
                "\nScenario: " + lesson.scenario +
                "\nTarget grammar: " + lesson.grammar.map((item) => item.name).join(", ") +
                "\nChecklist: " + lesson.production.checklist.join(" | ")
              }
              minLength={20}
              placeholder="Write your response. DeutschMate will assess this exact answer…"
              onAssessed={(result) => markAssessment(current.id, result.score)}
            />
            <Link href="/speaking" className="speaking-cta">Prefer to answer aloud? Open the Speaking Studio →</Link>
          </div>
        )}

        {question && current.id.startsWith("quiz-") && (
          <div className="focus-panel">
            <span className="activity-kicker">QUICK CHECK</span>
            <h2>{question.q}</h2>
            <div className="focus-options">
              {question.options.map((option) => {
                const selected = quizAnswers[current.index!] === option;
                const checked = quizChecked[current.index!];
                const correct = option === question.answer;
                const cls = checked ? (correct ? "correct" : selected ? "wrong" : "") : selected ? "selected" : "";
                return <button key={option} type="button" className={cls} onClick={() => {
                  if (checked) return;
                  setQuizAnswers((prev) => ({ ...prev, [current.index!]: option }));
                }}>{option}</button>;
              })}
            </div>
            {!quizChecked[current.index!] ? (
              <button className="button primary check-option" type="button" disabled={!quizAnswers[current.index!]} onClick={() => checkQuiz(current.index!)}>Check answer</button>
            ) : passed[current.id] ? (
              <div className="instant-feedback correct"><strong>✓ Correct</strong><span>You retrieved it without AI because this answer is deterministic.</span></div>
            ) : (
              <div className="instant-feedback wrong"><strong>Not yet</strong><span>The correct answer is <b>{question.answer}</b>.</span><button type="button" className="text-button" onClick={() => {
                setQuizChecked((prev) => ({ ...prev, [current.index!]: false }));
                setQuizAnswers((prev) => ({ ...prev, [current.index!]: "" }));
              }}>Try again</button></div>
            )}
          </div>
        )}

        {current.id === "finish" && (
          <div className="focus-panel finish-panel">
            <div className="finish-mark">✓</div>
            <span className="activity-kicker">LESSON COMPLETE</span>
            <h2>You produced evidence, not just clicks.</h2>
            <p>Your completed lesson contributes to the relevant CEFR can-do skills. Revisit it any time if the language still feels weak.</p>
            {!alreadyComplete && <button type="button" className="button primary large" onClick={complete}>Save lesson progress</button>}
            {alreadyComplete && <div className="instant-feedback correct"><strong>Saved</strong><span>This lesson is already in your competency history.</span></div>}
            <div className="finish-actions">
              <Link className="button secondary" href={lessonHref(previous)}>← Previous lesson</Link>
              <Link className="button primary" href={next ? lessonHref(next) : "/assessments"}>{next ? "Next lesson →" : "Level assessments →"}</Link>
            </div>
          </div>
        )}
      </main>

      {current.kind !== "finish" && (
        <footer className="focus-actions">
          <button type="button" className="button secondary" disabled={screen === 0} onClick={() => setScreen((value) => Math.max(0, value - 1))}>Back</button>
          <div>
            {!canContinue && <span>Complete this activity to continue</span>}
            <button type="button" className="button primary large" disabled={!canContinue} onClick={continueLesson}>Continue →</button>
          </div>
        </footer>
      )}
    </div>
  );
}
