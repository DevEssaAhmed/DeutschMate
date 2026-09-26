"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { beginnerOnramp } from "@/lib/beginner-onramp";
import type { ControlledTask } from "@/lib/types";
import type { CourseLesson } from "@/lib/types";
import { AiAnswerBox } from "./ai-answer-box";
import { ListeningPlayer } from "./listening-player";
import { SpeakButton } from "./speak-button";
import { useProgress } from "./progress-provider";
import styles from "./lesson-workspace.module.css";

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

const lessonPhases = [
  { id: "explore", label: "Explore", description: "Meet the German" },
  { id: "practice", label: "Practice", description: "Make it yours" },
  { id: "create", label: "Create", description: "Say something real" },
  { id: "check", label: "Check", description: "Show what sticks" },
] as const;

function phaseForScreen(id: string) {
  if (id === "production") return "create";
  if (id.startsWith("quiz-") || id === "finish") return "check";
  if (id === "grammar" || id === "vocab" || id.startsWith("task-")) return "practice";
  return "explore";
}

function lessonHref(item: Adjacent) {
  return item ? "/learn/" + item.level.toLowerCase() + "/" + item.moduleSlug + "/" + item.slug : "/learn";
}

function BeginnerPractice({ task, onAttempt }: { task: ControlledTask; onAttempt: () => void }) {
  const [selected, setSelected] = useState("");
  const [tileOrder, setTileOrder] = useState<number[]>([]);
  const [result, setResult] = useState<"correct" | "retry" | null>(null);
  const tiles = task.options ?? [];
  const answer = task.type === "order" ? tileOrder.map((index) => tiles[index]).join(" ") : selected;

  function check() {
    if (!answer.trim()) return;
    const normalise = (text: string) => text.trim().toLocaleLowerCase("de").replace(/[.!?]+$/, "");
    setResult(normalise(answer) === normalise(task.answer ?? "") ? "correct" : "retry");
    onAttempt();
  }

  return (
    <div className={styles.beginnerPractice}>
      {task.type === "choice" && (
        <div className={styles.practiceChoices} role="group" aria-label={task.prompt}>
          {tiles.map((option) => <button key={option} type="button" className={selected === option ? styles.choiceSelected : ""} aria-pressed={selected === option} onClick={() => { setSelected(option); setResult(null); }}>{option}</button>)}
        </div>
      )}
      {task.type === "order" && (
        <>
          <p className={styles.practiceHelp}>Tap the words in the right order.</p>
          <div className={styles.tileAnswer} aria-live="polite">{answer || "Your sentence appears here"}</div>
          <div className={styles.practiceChoices} role="group" aria-label="Words to arrange">
            {tiles.map((tile, index) => <button key={`${tile}-${index}`} type="button" disabled={tileOrder.includes(index)} onClick={() => { setTileOrder((current) => [...current, index]); setResult(null); }}>{tile}</button>)}
          </div>
          <button type="button" className={styles.resetTiles} disabled={!tileOrder.length} onClick={() => { setTileOrder([]); setResult(null); }}>Start again</button>
        </>
      )}
      {task.type === "fill" && <label className={styles.practiceInput}>Missing German word<input value={selected} onChange={(event) => { setSelected(event.target.value); setResult(null); }} placeholder="Type one word" autoComplete="off" /></label>}
      <button type="button" className="button primary" disabled={!answer.trim()} onClick={check}>Check my answer</button>
      {result && <div className={`${styles.practiceFeedback} ${result === "correct" ? styles.practiceCorrect : styles.practiceRetry}`} role="status"><strong>{result === "correct" ? "Yes, you got it!" : "Good try. Have another go."}</strong>{result === "retry" && <span>The answer is <b lang="de">{task.answer}</b>. You can arrange or type it again.</span>}</div>}
    </div>
  );
}

export function LessonWorkspace({ lesson, previous, next }: { lesson: CourseLesson; previous?: Adjacent; next?: Adjacent }) {
  const isFirstLesson = lesson.level === "A1" && lesson.moduleSlug === "introductions" && lesson.stage === "input";
  const isA1Input = lesson.level === "A1" && lesson.stage === "input";
  const progress = useProgress();
  const router = useRouter();
  const [screen, setScreen] = useState(0);
  const [furthestScreen, setFurthestScreen] = useState(0);
  const [passed, setPassed] = useState<Record<string, boolean>>({});
  const [verifiedScores, setVerifiedScores] = useState<Record<string, number>>({});
  const [quizAnswers, setQuizAnswers] = useState<Record<number, string>>({});
  const [quizChecked, setQuizChecked] = useState<Record<number, boolean>>({});
  const [gistChoice, setGistChoice] = useState("");
  const [gistChecked, setGistChecked] = useState(false);
  const [beginnerDraft, setBeginnerDraft] = useState("");
  const [beginnerDraftChecked, setBeginnerDraftChecked] = useState(false);

  useEffect(() => {
    progress.setLastLesson(lesson.id);
    progress.touchStudyDay();
    setScreen(0);
    setFurthestScreen(0);
    setPassed({});
    setVerifiedScores({});
    setQuizAnswers({});
    setQuizChecked({});
    setGistChoice("");
    setGistChecked(false);
    setBeginnerDraft("");
    setBeginnerDraftChecked(false);
  }, [lesson.id]);

  const screens = useMemo<Screen[]>(() => {
    const result: Screen[] = [{ id: "start", label: isFirstLesson ? "Hello" : "Scene", kind: "learn" }];
    if (isFirstLesson) beginnerOnramp.phraseCards.slice(1).forEach((_, index) => result.push({ id: `phrase-${index + 1}`, label: `Phrase ${index + 2}`, kind: "learn", index: index + 1 }));
    if (["input", "reception"].includes(lesson.stage)) {
      result.push({ id: "reading", label: "Read", kind: "learn" });
      result.push({ id: "gist", label: "Understand", kind: "answer" });
      result.push({ id: "listening", label: "Listen", kind: "listen" });
      if (lesson.stage === "reception") result.push({ id: "detail", label: "Explain", kind: "answer" });
    }
    if (["grammar", "production", "review"].includes(lesson.stage)) result.push({ id: "grammar", label: "Grammar", kind: "learn" });
    if (["input", "lexis", "production", "review"].includes(lesson.stage)) result.push({ id: "vocab", label: "Language", kind: "learn" });
    lesson.controlled.slice(0, 3).forEach((_, index) => result.push({ id: "task-" + index, label: "Practice " + (index + 1), kind: "answer", index }));
    result.push({ id: "production", label: "Produce", kind: "answer" });
    lesson.checkpoint.forEach((_, index) => result.push({ id: "quiz-" + index, label: "Check " + (index + 1), kind: "quiz", index }));
    result.push({ id: "finish", label: "Complete", kind: "finish" });
    return result;
  }, [lesson, isFirstLesson]);

  const current = screens[screen];
  const progressPct = Math.round(((screen + 1) / screens.length) * 100);
  const phases = lessonPhases.map((phase) => ({
    ...phase,
    steps: screens.map((item, index) => phaseForScreen(item.id) === phase.id ? index : -1).filter((index) => index >= 0),
  }));
  const currentPhaseIndex = phases.findIndex((phase) => phase.steps.includes(screen));
  const currentPhase = phases[currentPhaseIndex];
  const canContinue = current.kind === "learn" || current.kind === "listen" || current.kind === "finish" ||
    (current.kind === "quiz" ? current.index !== undefined && quizChecked[current.index] === true : passed[current.id] === true);
  const alreadyComplete = progress.completedLessons.includes(lesson.id);
  const quizTotal = lesson.checkpoint.length;
  const quizScore = lesson.checkpoint.reduce((sum, question, index) => sum + (quizChecked[index] && quizAnswers[index] === question.answer ? 1 : 0), 0);
  const checkpointPassed = quizTotal > 0 && quizScore >= Math.ceil((quizTotal * 2) / 3);
  const practiceComplete = lesson.controlled.length >= 3 && lesson.controlled.slice(0, 3).every((_, index) => passed["task-" + index]);
  const checkpointAnswered = lesson.checkpoint.every((_, index) => quizChecked[index]);
  const canComplete = practiceComplete && passed.production && checkpointAnswered && checkpointPassed;

  /* Keyboard navigation */
  const advance = useCallback(() => {
    if (canContinue && screen < screens.length - 1) {
      setScreen(screen + 1);
      setFurthestScreen((value) => Math.max(value, screen + 1));
    }
  }, [canContinue, screen, screens.length]);

  const goBack = useCallback(() => {
    if (screen > 0) setScreen((v) => Math.max(0, v - 1));
  }, [screen]);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      const tag = target?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (e.key === "Enter" && target?.closest("button, a, [role='button']")) return;
      if (e.key === "ArrowRight" || e.key === "Enter") { e.preventDefault(); advance(); }
      if (e.key === "ArrowLeft") { e.preventDefault(); goBack(); }
      if (e.key === "Escape") { e.preventDefault(); router.push("/learn"); }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [advance, goBack, router]);

  function markAssessment(id: string, score: number, source: "ai" | "self") {
    const attempted = id.startsWith("task-") || id === "production";
    setPassed((prev) => ({ ...prev, [id]: prev[id] || attempted || score >= 60 }));
    if (source === "ai") setVerifiedScores((prev) => ({ ...prev, [id]: Math.max(prev[id] ?? 0, score) }));
  }

  function checkQuiz(index: number) {
    if (!quizAnswers[index]) return;
    const correct = quizAnswers[index] === lesson.checkpoint[index].answer;
    setQuizChecked((prev) => ({ ...prev, [index]: true }));
    if (correct) setPassed((prev) => ({ ...prev, ["quiz-" + index]: true }));
  }

  function checkBeginnerGist() {
    if (!gistChoice) return;
    setGistChecked(true);
    if (gistChoice === beginnerOnramp.gist.answer) setPassed((previous) => ({ ...previous, gist: true }));
  }

  function checkBeginnerDraft() {
    const draft = beginnerDraft.trim();
    if (!draft) return;
    setBeginnerDraftChecked(true);
    const isOwnIntroduction = /^(?:hallo[!,]?\s*)?(?:ich (?:heiße|bin)|mein name ist)\s+[\p{L}][\p{L}' -]{1,}[.!]?$/iu.test(draft);
    if (isOwnIntroduction) setPassed((previous) => ({ ...previous, production: true }));
  }

  function complete() {
    if (!canComplete || alreadyComplete) return;
    const correctFor = (skill: "grammar" | "vocabulary") => lesson.checkpoint.some((question, index) =>
      question.skill === skill && quizChecked[index] && quizAnswers[index] === question.answer);
    const assessedFor = (skill: "grammar" | "vocabulary") => lesson.controlled.slice(0, 3).some((task, index) =>
      task.id.startsWith(skill === "grammar" ? "grammar-" : "vocab-") && (verifiedScores["task-" + index] ?? 0) >= 60);
    const demonstrated = {
      reading: (verifiedScores.gist ?? 0) >= 60 && (lesson.stage !== "reception" || (verifiedScores.detail ?? 0) >= 60),
      writing: (verifiedScores.production ?? 0) >= 60,
      grammar: correctFor("grammar") || assessedFor("grammar"),
      vocabulary: correctFor("vocabulary") || assessedFor("vocabulary"),
    };
    const evidenceIds = lesson.competencyIds.filter((id) =>
      Object.entries(demonstrated).some(([skill, demonstratedSkill]) => demonstratedSkill && id.includes(`-${skill}-`)));
    progress.completeLesson(lesson.id, quizScore, quizTotal, evidenceIds);
  }

  function retryCheckpoint() {
    setQuizAnswers({});
    setQuizChecked({});
    setPassed((previous) => Object.fromEntries(Object.entries(previous).filter(([id]) => !id.startsWith("quiz-"))));
    const firstQuestion = screens.findIndex((item) => item.kind === "quiz");
    if (firstQuestion >= 0) {
      setScreen(firstQuestion);
      setFurthestScreen(firstQuestion);
    }
  }

  const vocab = lesson.vocabulary.slice(0, 6);
  const starterText = lesson.reading.text.split(/(?<=[.!?])\s+/).slice(0, 2).join(" ");
  const currentPhrase = isFirstLesson && (current.id === "start" || current.id.startsWith("phrase-"))
    ? beginnerOnramp.phraseCards[current.id === "start" ? 0 : current.index ?? 0]
    : undefined;
  const currentSoundNote = currentPhrase ? beginnerOnramp.soundNotes[current.id === "start" ? 0 : current.index ?? 0] : undefined;
  const task = current.index !== undefined ? lesson.controlled[current.index] : undefined;
  const question = current.index !== undefined ? lesson.checkpoint[current.index] : undefined;

  return (
    <div className="lesson-workspace">
      <aside className={`lesson-rail ${styles.rail}`}>
        <Link href="/learn" className="lesson-back">← Back to course</Link>
        <div className="lesson-rail-title">
          <div><span className={"level-dot level-" + lesson.level.toLowerCase()}>{lesson.level}</span><span>Module {lesson.moduleIndex}</span></div>
          <h2>{lesson.moduleTitle}</h2>
          <p>{lesson.title}</p>
        </div>

        <div className="lesson-rail-progress">
          <div><span>Lesson progress</span><strong>{progressPct}%</strong></div>
          <div className="bar" role="progressbar" aria-label="Lesson progress" aria-valuenow={progressPct} aria-valuemin={0} aria-valuemax={100}><i style={{ width: progressPct + "%" }} /></div>
        </div>

        <nav className={styles.phaseNav} aria-label="Lesson phases">
          {phases.map((phase, index) => {
            const active = index === currentPhaseIndex;
            const done = index < currentPhaseIndex;
            const available = phase.steps[0] <= furthestScreen;
            return (
              <button
                key={phase.id}
                type="button"
                className={`${styles.phase} ${active ? styles.phaseActive : ""} ${done ? styles.phaseDone : ""}`}
                disabled={!available}
                aria-current={active ? "step" : undefined}
                onClick={() => setScreen(phase.steps[0])}
              >
                <span className={styles.phaseNumber}>{done ? "✓" : index + 1}</span>
                <span className={styles.phaseCopy}><strong>{phase.label}</strong><small>{active ? `${phase.steps.indexOf(screen) + 1} of ${phase.steps.length} activities` : phase.description}</small></span>
              </button>
            );
          })}
        </nav>

        <label className={styles.activityJump}>
          <span>Jump to an activity</span>
          <select value={screen} onChange={(event) => setScreen(Number(event.target.value))}>
            {screens.map((item, index) => <option key={item.id} value={index} disabled={index > furthestScreen}>{index + 1}. {item.label}</option>)}
          </select>
        </label>

        <div className="lesson-ai-note">
          <span>✦</span>
          <p>Open answers are checked against this lesson, not a fixed answer string.</p>
        </div>
      </aside>

      <section className={`lesson-canvas ${styles.canvas}`}>
        <div className={styles.mobileGuide}>
          <div className={styles.mobileGuideTop}><strong>{currentPhase?.label}</strong><span>Activity {screen + 1} of {screens.length}</span></div>
          <div className={styles.mobileGuideTrack} role="progressbar" aria-label="Lesson progress" aria-valuenow={progressPct} aria-valuemin={0} aria-valuemax={100}><span style={{ width: `${progressPct}%` }} /></div>
          <label className={styles.mobileJump}>
            <span>Go to an activity</span>
            <select value={screen} onChange={(event) => setScreen(Number(event.target.value))}>
              {screens.map((item, index) => <option key={item.id} value={index} disabled={index > furthestScreen}>{index + 1}. {item.label}</option>)}
            </select>
          </label>
        </div>
        {/* Breadcrumb trail */}
        <nav className="lesson-breadcrumb" aria-label="Breadcrumb">
          <Link href="/learn">{lesson.level}</Link>
          <span className="breadcrumb-sep">/</span>
          <Link href={"/learn/" + lesson.level.toLowerCase() + "/" + lesson.moduleSlug + "/input"}>{lesson.moduleTitle}</Link>
          <span className="breadcrumb-sep">/</span>
          <span className="breadcrumb-current">{lesson.title}</span>
        </nav>

        <header className={`lesson-canvas-header ${styles.heading}`}>
          <div>
            <span className="page-kicker">{stageTitle[lesson.stage]} · {currentPhase?.label}</span>
            <h1>{current.id === "start" ? lesson.moduleTitle : current.label}</h1>
            <p>{lesson.scenario}</p>
          </div>
          <div className="lesson-canvas-meta"><span>{lesson.durationMinutes} min lesson</span><span>{screen + 1} / {screens.length}</span></div>
        </header>

        <article className="activity-surface card">
          <div className="screen-transition" key={current.id}>
            {currentPhrase && (
              <div className={`activity-panel ${styles.onrampPanel}`}>
                <span className="activity-type">Your first German · phrase {(current.id === "start" ? 0 : current.index ?? 0) + 1} of {beginnerOnramp.phraseCards.length}</span>
                <h2>{current.id === "start" ? "Start with hello." : "Say it your way."}</h2>
                <p className="activity-lead">Listen, say the phrase aloud, then look at the English meaning. One phrase is enough for now.</p>
                <article className={styles.phraseHero}>
                  <span className={styles.phraseEyebrow}>In German</span>
                  <div className={styles.phraseLine}><strong lang="de">{currentPhrase.de}</strong><SpeakButton text={currentPhrase.de} compact /></div>
                  <span className={styles.phraseEnglish}>{currentPhrase.en}</span>
                  <p>{currentPhrase.note}</p>
                </article>
                {currentSoundNote && <div className={styles.soundNote}><strong>Sound tip: {currentSoundNote.pattern}</strong><span lang="de">{currentSoundNote.example}</span><small>{currentSoundNote.en}</small></div>}
              </div>
            )}

            {current.id === "start" && !isFirstLesson && (
              <div className={`activity-panel ${styles.starter}`}>
                <span className="activity-type">Start with real German</span>
                <h2>{isA1Input ? "A few words to get started." : "Step into the scene."}</h2>
                <p className="activity-lead">{lesson.level === "A1" ? "Listen to these useful words, then notice them in the short text." : lesson.reading.preReading[0] || `Imagine ${lesson.scenario}.`}</p>
                {isA1Input && <div className={styles.supportGrid} aria-label="Starter German words">
                  {vocab.slice(0, 3).map((item) => <article key={item.de} className={styles.supportWord}><div><strong lang="de">{item.de}</strong><SpeakButton text={item.de} compact /></div><span>{item.en}</span></article>)}
                </div>}
                <div className={styles.storyCard}>
                  <div className={styles.storyHeading}><span>{isA1Input ? "Now spot them in context" : "Read and listen"}</span><SpeakButton text={starterText} compact /></div>
                  <p lang="de">{starterText}</p>
                </div>
                {!isA1Input && <div className={styles.starterChips} aria-label="Useful German phrases">
                  {lesson.chunks.slice(0, 3).map((chunk) => <span key={chunk} lang="de">{chunk}</span>)}
                </div>}
                <details className={styles.goalsDetails}>
                  <summary>What you will be able to do</summary>
                  <ul className="goal-list">{lesson.objectives.map((objective) => <li key={objective}><span>✓</span>{objective}</li>)}</ul>
                </details>
              </div>
            )}

            {current.id === "reading" && isFirstLesson && (
              <div className={`activity-panel ${styles.onrampPanel}`}>
                <span className="activity-type">A tiny conversation</span>
                <h2>Two people meet.</h2>
                <p className="activity-lead">Read or listen to each line. The English meaning is here when you need it.</p>
                <div className={styles.dialogueList}>
                  {beginnerOnramp.microDialogue.map((line, index) => <article key={`${line.speaker}-${index}`} className={styles.dialogueLine}>
                    <span>{line.speaker}</span>
                    <div><strong lang="de">{line.de}</strong><small>{line.en}</small></div>
                    <SpeakButton text={line.de} compact />
                  </article>)}
                </div>
              </div>
            )}

            {current.id === "reading" && !isFirstLesson && (
              <div className="activity-panel">
                <span className="activity-type">📖 Read for meaning</span>
                <h2>{lesson.reading.title}</h2>
                <p className="activity-note">{lesson.reading.preReading[0]}</p>
                <article className="immersive-text" lang="de">{lesson.reading.text}</article>
                <p className="activity-note">First understand the situation. Do not translate every word.</p>
              </div>
            )}

            {current.id === "gist" && isFirstLesson && (
              <div className={`activity-panel ${styles.onrampPanel}`}>
                <span className="activity-type">Check the meaning</span>
                <h2>{beginnerOnramp.gist.question}</h2>
                <p className="activity-note">Choose in English. Understanding comes before speaking perfectly.</p>
                <div className={styles.practiceChoices} role="group" aria-label={beginnerOnramp.gist.question}>
                  {beginnerOnramp.gist.choices.map((choice) => <button key={choice} type="button" className={gistChoice === choice ? styles.choiceSelected : ""} aria-pressed={gistChoice === choice} onClick={() => { setGistChoice(choice); setGistChecked(false); }}>{choice}</button>)}
                </div>
                <button type="button" className="button primary" disabled={!gistChoice} onClick={checkBeginnerGist}>Check meaning</button>
                {gistChecked && <div className={`${styles.practiceFeedback} ${passed.gist ? styles.practiceCorrect : styles.practiceRetry}`} role="status"><strong>{passed.gist ? "That’s right!" : "Try another meaning."}</strong><span>{beginnerOnramp.gist.explanation}</span></div>}
              </div>
            )}

            {current.id === "gist" && !isFirstLesson && (
              <div className="activity-panel">
                <span className="activity-type ai">✦ AI assessed · comprehension</span>
                <h2>{lesson.reading.gistQuestion}</h2>
                <p className="activity-note">Answer in simple German if you can. Meaning matters more than perfect grammar here.</p>
                <AiAnswerBox level={lesson.level} prompt={lesson.reading.gistQuestion} context={"Source text:\n" + lesson.reading.text} placeholder="In dem Text geht es um…" onAssessed={(result) => markAssessment(current.id, result.score, result.source)} />
              </div>
            )}

            {current.id === "listening" && (
              <div className="activity-panel">
                <span className="activity-type">🎧 Listening</span>
                <h2>Listen before you read.</h2>
                <p className="activity-note">First catch the situation. On the second listen, focus on concrete details.</p>
                <ListeningPlayer task={lesson.listening} />
              </div>
            )}

            {current.id === "detail" && (
              <div className="activity-panel">
                <span className="activity-type ai">✦ AI assessed · detail</span>
                <h2>{lesson.reading.detailQuestions[0]}</h2>
                <AiAnswerBox level={lesson.level} prompt={lesson.reading.detailQuestions[0]} context={"Reading text:\n" + lesson.reading.text + "\n\nListening transcript:\n" + lesson.listening.script} placeholder="Antworte mit einem vollständigen Satz…" onAssessed={(result) => markAssessment(current.id, result.score, result.source)} />
              </div>
            )}

            {current.id === "grammar" && (
              <div className="activity-panel">
                <span className="activity-type">📖 Grammar workshop</span>
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
                <span className="activity-type">📖 Useful language</span>
                <h2>Learn chunks you can actually use.</h2>
                <div className="lesson-word-list">
                  {vocab.map((item) => <article key={item.de}><div><strong lang="de">{item.de}</strong><span>{item.en}</span></div><SpeakButton text={item.de} compact /><p lang="de">{item.contextExample}</p></article>)}
                </div>
              </div>
            )}

            {task && current.id.startsWith("task-") && (
              <div className="activity-panel">
                <span className={isFirstLesson ? "activity-type" : "activity-type ai"}>{isFirstLesson ? "Try it yourself" : "✦ AI assessed · your German"}</span>
                <h2>{task.prompt}</h2>
                {task.hint && <p className="activity-note">{task.hint}</p>}
                {isFirstLesson ? <BeginnerPractice task={task} onAttempt={() => setPassed((previous) => ({ ...previous, [current.id]: true }))} /> : <AiAnswerBox
                  level={lesson.level}
                  prompt={task.prompt}
                  context={"Lesson situation: " + lesson.scenario + "\nGrammar focus: " + lesson.grammar.map((item) => item.name).join(", ") + "\nUseful chunks: " + lesson.chunks.join(" | ")}
                  expected={task.answer}
                  multiline={task.type !== "fill"}
                  placeholder="Write your own German answer…"
                  onAssessed={(result) => markAssessment(current.id, result.score, result.source)}
                />}
              </div>
            )}

            {current.id === "production" && isFirstLesson && (
              <div className={`activity-panel ${styles.onrampPanel}`}>
                <span className="activity-type">Your first German sentence</span>
                <h2>Introduce yourself.</h2>
                <p className="activity-lead">Write one short line with your own name. It can be simple.</p>
                <label className={styles.practiceInput}>Your sentence in German
                  <input value={beginnerDraft} onChange={(event) => { setBeginnerDraft(event.target.value); setBeginnerDraftChecked(false); }} placeholder="Ich heiße …" autoComplete="off" />
                </label>
                <button type="button" className="button primary" disabled={beginnerDraft.trim().length < 8} onClick={checkBeginnerDraft}>Check my sentence</button>
                {beginnerDraftChecked && <div className={`${styles.practiceFeedback} ${passed.production ? styles.practiceCorrect : styles.practiceRetry}`} role="status"><strong>{passed.production ? "You introduced yourself!" : "Try adding your name after the phrase."}</strong><span>Example: <b lang="de">Ich heiße Lara.</b> means “My name is Lara.”</span></div>}
              </div>
            )}

            {current.id === "production" && !isFirstLesson && (
              <div className="activity-panel">
                <span className="activity-type ai">✦ AI assessed · free production</span>
                <h2>{lesson.production.writing}</h2>
                <div className="support-chips">{lesson.chunks.slice(0, 4).map((chunk) => <span key={chunk}>{chunk}</span>)}</div>
                <AiAnswerBox
                  level={lesson.level}
                  prompt={lesson.production.writing}
                  context={"Module: " + lesson.moduleTitle + "\nScenario: " + lesson.scenario + "\nTarget grammar: " + lesson.grammar.map((item) => item.name).join(", ") + "\nChecklist: " + lesson.production.checklist.join(" | ")}
                  minLength={20}
                  placeholder="Write your response. DeutschMate will assess this exact answer…"
                  onAssessed={(result) => markAssessment(current.id, result.score, result.source)}
                />
                <Link href="/speaking" className="production-link">Prefer to answer aloud? Open Speaking Studio →</Link>
              </div>
            )}

            {question && current.id.startsWith("quiz-") && (
              <div className="activity-panel">
                <span className="activity-type">◉ Quick check</span>
                <h2>{question.q}</h2>
                <div className="focus-options">
                  {question.options.map((option) => {
                    const selected = quizAnswers[current.index!] === option;
                    const checked = quizChecked[current.index!];
                    const correct = option === question.answer;
                    const cls = checked ? (selected ? (correct ? "correct" : "wrong") : "") : selected ? "selected" : "";
                    return <button key={option} type="button" className={cls} onClick={() => { if (!checked) setQuizAnswers((prev) => ({ ...prev, [current.index!]: option })); }}>{option}</button>;
                  })}
                </div>
                {!quizChecked[current.index!] ? (
                  <button className="button primary" type="button" disabled={!quizAnswers[current.index!]} onClick={() => checkQuiz(current.index!)}>Check answer</button>
                ) : passed[current.id] ? (
                  <div className="instant-feedback correct"><strong>✓ Correct</strong><span>Retrieved accurately.</span></div>
                ) : (
                  <div className="instant-feedback wrong"><strong>Not yet</strong><span>Review the lesson material before another checkpoint attempt.</span></div>
                )}
              </div>
            )}

            {current.id === "finish" && (
              <div className="activity-panel finish-panel">
                <div className="finish-mark">{alreadyComplete || canComplete ? "✓" : "↻"}</div>
                <span className="activity-type">{alreadyComplete ? "Lesson complete" : canComplete ? "Ready to complete" : "Checkpoint review"}</span>
                <h2>{alreadyComplete || canComplete ? "You produced evidence, not just clicks." : "Keep practising before you finish."}</h2>
                <p>{alreadyComplete || canComplete ? "Your lesson contributes to the relevant CEFR can-do skills." : `You answered ${quizTotal} checkpoint questions and got ${quizScore} correct. You need ${Math.ceil((quizTotal * 2) / 3)} correct to complete this lesson.`}</p>
                {!alreadyComplete && canComplete && <button type="button" className="button primary large" onClick={complete}>Save lesson progress</button>}
                {!alreadyComplete && !checkpointPassed && checkpointAnswered && <button type="button" className="button primary large" onClick={retryCheckpoint}>Try checkpoint again</button>}
                {alreadyComplete && <div className="instant-feedback correct"><strong>Saved</strong><span>This lesson is already in your profile.</span></div>}
                <div className="finish-actions">
                  <Link className="button secondary" href={lessonHref(previous)}>← Previous lesson</Link>
                  {alreadyComplete && <Link className="button primary" href={next ? lessonHref(next) : "/assessments"}>{next ? "Next lesson →" : "Level assessments →"}</Link>}
                </div>
              </div>
            )}
          </div>
        </article>

        {current.kind !== "finish" && (
          <footer className="lesson-controls">
            <button type="button" className="button secondary" disabled={screen === 0} onClick={goBack}>← Back</button>
            <div>
              {!canContinue && <span>Complete this task to continue</span>}
              <button type="button" className="button primary large" disabled={!canContinue} onClick={advance}>Continue →</button>
            </div>
          </footer>
        )}
      </section>
    </div>
  );
}
