"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { foundationCompletion, foundationHref, foundationLessons, germanAlphabet, normalizeFoundationAnswer, validateFoundationProduction } from "@/lib/foundations";
import type { FoundationLesson, FoundationQuestion } from "@/lib/foundations";
import { useProgress } from "./progress-provider";
import { FoundationAudio } from "./foundation-audio";
import styles from "./foundation-course.module.css";

type Draft = { step: number; practice: Record<number, string>; checkpoint: Record<number, string>; production: string; productionChecked: boolean };
const emptyDraft: Draft = { step: 0, practice: {}, checkpoint: {}, production: "", productionChecked: false };

function Question({ question, saved, checkpoint, onChecked }: { question: FoundationQuestion; saved?: string; checkpoint: boolean; onChecked: (answer: string) => void }) {
  const [selected, setSelected] = useState(saved ?? "");
  const [tiles, setTiles] = useState<number[]>([]);
  const [checked, setChecked] = useState(Boolean(saved));
  const [showCue, setShowCue] = useState(false);
  const answer = question.type === "order" ? tiles.map((index) => question.options[index]).join(" ") : selected;
  const correct = normalizeFoundationAnswer(checked && saved ? saved : answer) === normalizeFoundationAnswer(question.answer);

  function check() {
    if (!answer) return;
    setChecked(true);
    if (checkpoint || normalizeFoundationAnswer(answer) === normalizeFoundationAnswer(question.answer)) onChecked(answer);
  }

  return <>
    <h2 id="activity-heading" tabIndex={-1}>{question.prompt}</h2>
    {question.audio && <>
      <FoundationAudio text={question.audio} label="Play the question audio" />
      <button type="button" className={styles.subtle} onClick={() => setShowCue((value) => !value)} aria-expanded={showCue}>{showCue ? "Hide written cue" : "Use a written cue instead"}</button>
      {showCue && <p className={styles.intro}>{question.writtenCue}</p>}
    </>}
    {question.type === "choice" ? <div className={styles.choices} role="group" aria-label="Answer choices">
      {question.options.map((option) => <button type="button" key={option} aria-pressed={selected === option} disabled={checked && (correct || checkpoint)} onClick={() => { setSelected(option); setChecked(false); }}>{option}</button>)}
    </div> : <>
      <p>Tap the tiles in order.</p>
      <div className={styles.answer} aria-live="polite">{saved || answer || "Your answer appears here"}</div>
      <div className={styles.tiles}>{question.options.map((option, index) => <button type="button" key={`${index}-${option}`} disabled={Boolean(saved) || tiles.includes(index)} onClick={() => { setTiles([...tiles, index]); setChecked(false); }}>{option}</button>)}</div>
      {!saved && <button type="button" className={styles.subtle} onClick={() => { setTiles([]); setChecked(false); }}>Clear tiles</button>}
    </>}
    {!saved && <button type="button" className={styles.action} disabled={!answer || checked && (correct || checkpoint)} onClick={check}>Check answer</button>}
    {checked && <div className={`${styles.feedback} ${!correct ? styles.retry : ""}`} role="status">
      <strong>{correct ? "That's right." : checkpoint ? "Something to revisit." : "Try once more."}</strong>
      <p>{question.explanation}</p>
      {!correct && <p>Answer: <strong>{question.answer}</strong>{!checkpoint && " — use the explanation, then try again."}</p>}
    </div>}
  </>;
}

export function FoundationWorkspace({ lesson }: { lesson: FoundationLesson }) {
  const progress = useProgress();
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [loaded, setLoaded] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [productionError, setProductionError] = useState(false);
  const textarea = useRef<HTMLTextAreaElement>(null);
  const panel = useRef<HTMLElement>(null);
  const storageKey = `deutschmate-foundation-draft-v1:${lesson.id}`;
  const lessonIndex = foundationLessons.findIndex((item) => item.id === lesson.id);
  const practiceStart = lesson.cards.length;
  const productionStep = practiceStart + lesson.practice.length;
  const checkStart = productionStep + 1;
  const finishStep = checkStart + lesson.checkpoint.length;
  const phase = draft.step < practiceStart ? 0 : draft.step < productionStep ? 1 : draft.step === productionStep ? 2 : draft.step < finishStep ? 3 : 4;
  const evidence = { practice: lesson.practice.map((_, index) => draft.practice[index] ?? ""), production: draft.production, checkpoint: lesson.checkpoint.map((_, index) => draft.checkpoint[index] ?? "") };
  const result = foundationCompletion(lesson, evidence);
  const complete = progress.completedFoundations.includes(lesson.id);
  const next = foundationLessons[lessonIndex + 1];

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (raw) {
        const value = JSON.parse(raw) as Partial<Draft>;
        const practice = Object.fromEntries(lesson.practice.flatMap((question, index) => typeof value.practice?.[index] === "string" && normalizeFoundationAnswer(value.practice[index]) === normalizeFoundationAnswer(question.answer) ? [[index, value.practice[index]]] : []));
        const checkpoint = Object.fromEntries(lesson.checkpoint.flatMap((question, index) => typeof value.checkpoint?.[index] === "string" && question.options.includes(value.checkpoint[index]) ? [[index, value.checkpoint[index]]] : []));
        const production = typeof value.production === "string" ? value.production.slice(0, 200) : "";
        setDraft({ step: Number.isInteger(value.step) ? Math.min(finishStep, Math.max(0, value.step!)) : 0, practice, checkpoint, production, productionChecked: value.productionChecked === true && validateFoundationProduction(lesson, production) });
      }
    } catch { setSaveError(true); }
    setLoaded(true);
  }, [lesson, storageKey, finishStep]);

  useEffect(() => {
    if (!loaded) return;
    try { window.localStorage.setItem(storageKey, JSON.stringify(draft)); }
    catch { setSaveError(true); }
  }, [draft, loaded, storageKey]);

  useEffect(() => {
    if (!progress.ready) return;
    progress.setLastLesson(lesson.id);
    progress.touchStudyDay();
  }, [progress.ready, progress.setLastLesson, progress.touchStudyDay, lesson.id]);

  useEffect(() => {
    if (!loaded) return;
    panel.current?.querySelector<HTMLElement>("h2")?.focus({ preventScroll: true });
  }, [draft.step, loaded]);

  function go(step: number) {
    setDraft((previous) => ({ ...previous, step }));
    setProductionError(false);
    panel.current?.scrollIntoView({ block: "start", behavior: "instant" });
  }

  function insertCharacter(character: string) {
    const field = textarea.current;
    const start = field?.selectionStart ?? draft.production.length;
    const end = field?.selectionEnd ?? start;
    const value = draft.production.slice(0, start) + character + draft.production.slice(end);
    if (value.length > 200) return;
    setDraft((previous) => ({ ...previous, production: value, productionChecked: false }));
    setProductionError(false);
    requestAnimationFrame(() => { field?.focus(); field?.setSelectionRange(start + 1, start + 1); });
  }

  const canContinue = phase === 0 || phase === 1 && Boolean(draft.practice[draft.step - practiceStart]) || phase === 2 && draft.productionChecked || phase === 3 && Boolean(draft.checkpoint[draft.step - checkStart]);
  const activeCard = lesson.cards[draft.step];
  const questionIndex = phase === 1 ? draft.step - practiceStart : draft.step - checkStart;

  return <main className={styles.page}>
    <div className={styles.topbar}><Link href="/learn#foundations">← Foundation course</Link><span>Lesson {lessonIndex + 1} of {foundationLessons.length} · {lesson.minutes} min</span></div>
    <span className={styles.eyebrow}>Start from zero · {lesson.group}</span>
    <h1 className={styles.heading}>{lesson.title}</h1>
    <p className={styles.goal}>{lesson.goal}</p>
    <div className={styles.track} role="progressbar" aria-label="Lesson steps" aria-valuemin={0} aria-valuemax={finishStep + 1} aria-valuenow={draft.step + 1}><span style={{ width: `${(draft.step + 1) / (finishStep + 1) * 100}%` }} /></div>
    <div className={styles.phases}>{["Learn", "Practise", "Try it", "Check", "Finish"].map((label, index) => index === phase ? <strong key={label} aria-current="step">{index + 1}. {label}</strong> : <span key={label}>{index + 1}. {label}</span>)}</div>
    {!loaded ? <p role="status">Loading your lesson…</p> : <section className={styles.panel} ref={panel} aria-label="Current activity">
      {phase === 0 && activeCard && <>
        {draft.step === 0 && <p className={styles.intro}>{lesson.introduction}</p>}
        <span className={styles.eyebrow}>Learn · Card {draft.step + 1} of {lesson.cards.length}</span>
        <div className={styles.card}>
          <h2 className={styles.german} tabIndex={-1} lang="de">{activeCard.de}</h2>
          <p className={styles.meaning}>{activeCard.en}</p>
          {!activeCard.example && <FoundationAudio key={activeCard.de} text={activeCard.audio ?? activeCard.de} label="Listen and repeat" />}
          <p className={styles.note}>{activeCard.note}</p>
          {activeCard.example && <div className={styles.example}><strong lang="de">{activeCard.example.de}</strong><span>{activeCard.example.en}</span><FoundationAudio key={activeCard.example.de} text={activeCard.example.de} label="Listen to the example" /></div>}
        </div>
        <p className={styles.audioHelp}>Audio uses your device&apos;s German voice. English sound hints are approximate. Listen, try saying it, and take your time.</p>
      </>}
      {(phase === 1 || phase === 3) && <>
        <span className={styles.eyebrow}>{phase === 1 ? "Guided practice" : "Checkpoint"} · {questionIndex + 1} of 3</span>
        <Question key={draft.step} question={phase === 1 ? lesson.practice[questionIndex] : lesson.checkpoint[questionIndex]} saved={phase === 1 ? draft.practice[questionIndex] : draft.checkpoint[questionIndex]} checkpoint={phase === 3} onChecked={(answer) => setDraft((previous) => ({ ...previous, [phase === 1 ? "practice" : "checkpoint"]: { ...(phase === 1 ? previous.practice : previous.checkpoint), [questionIndex]: answer } }))} />
      </>}
      {phase === 2 && <div className={styles.production}>
        <span className={styles.eyebrow}>Your turn</span>
        <h2 tabIndex={-1}>{lesson.production.prompt}</h2>
        <p>{lesson.production.hint}</p>
        <label htmlFor="foundation-answer">Your answer</label>
        <textarea id="foundation-answer" ref={textarea} value={draft.production} maxLength={200} spellCheck={false} autoComplete="off" onChange={(event) => { setDraft((previous) => ({ ...previous, production: event.target.value, productionChecked: false })); setProductionError(false); }} />
        <div className={styles.characters} role="group" aria-label="German characters">{["ä", "ö", "ü", "ß", "Ä", "Ö", "Ü"].map((character) => <button type="button" key={character} onClick={() => insertCharacter(character)} aria-label={`Insert ${character}`}>{character}</button>)}</div>
        <button type="button" className={styles.action} disabled={!draft.production.trim() || draft.productionChecked} onClick={() => { const valid = validateFoundationProduction(lesson, draft.production); setDraft((previous) => ({ ...previous, productionChecked: valid })); setProductionError(!valid); }}>Check my writing</button>
        {(productionError || draft.productionChecked) && <div className={`${styles.feedback} ${productionError ? styles.retry : ""}`} role="status"><strong>{productionError ? "Check the frame and try again." : "Your writing fits the task."}</strong><p>{productionError ? lesson.production.hint : "Read it aloud if you can. Speaking is self-practice here; your pronunciation is not automatically assessed."}</p></div>}
        {draft.production.trim() && <details className={styles.model}><summary>Compare with an example</summary><p lang="de">{lesson.production.model}</p><FoundationAudio text={lesson.production.model} label="Listen to the model" /></details>}
      </div>}
      {phase === 4 && <div className={styles.completion}>
        <span className={styles.seal} aria-hidden="true">{result.complete || complete ? "✓" : "↻"}</span>
        <h2 tabIndex={-1}>{complete ? "Lesson saved. Well done!" : result.complete ? "You've taken another step." : "A little more practice."}</h2>
        <p>{lesson.recap}</p>
        <p>Checkpoint: <strong>{result.score} / {result.total}</strong>. Complete all three practice tasks, your writing and at least two checkpoint questions correctly to finish.</p>
        {!result.complete && !complete && <>
          {!lesson.practice.every((_, index) => draft.practice[index]) && <button type="button" className={styles.back} onClick={() => go(practiceStart)}>Return to practice</button>}
          {!draft.productionChecked && <button type="button" className={styles.back} onClick={() => go(productionStep)}>Return to your writing</button>}
          <button type="button" className={styles.action} onClick={() => setDraft((previous) => ({ ...previous, checkpoint: {}, step: checkStart }))}>Try the checkpoint again</button>
        </>}
        {result.complete && !complete && <button type="button" className={styles.action} onClick={() => progress.completeFoundation(lesson.id, evidence)}>Save completed lesson <span aria-hidden="true">✓</span></button>}
        {complete && <Link className={styles.action} href={next ? foundationHref(next) : "/learn/a1/introductions/input"}>{next ? `Next: ${next.title}` : "Continue to A1: Introducing yourself"} <span aria-hidden="true">→</span></Link>}
        <p className={styles.saveNote}>Foundation practice prepares you for A1. It does not award CEFR competency evidence.</p>
      </div>}
      <div className={styles.nav}>
        <button type="button" className={styles.back} disabled={draft.step === 0} onClick={() => go(draft.step - 1)}>← Back</button>
        {phase < 4 && <button type="button" className={styles.action} disabled={!canContinue} onClick={() => go(draft.step + 1)}>{draft.step === practiceStart - 1 ? "Start practice" : draft.step === productionStep - 1 ? "Try it yourself" : draft.step === productionStep ? "Start checkpoint" : draft.step === finishStep - 1 ? "See how you did" : "Continue"} →</button>}
      </div>
    </section>}
    <p className={styles.saveNote} role="status">{saveError ? "Your browser could not save this draft. Keep this tab open to continue." : loaded ? "Your place and answers are saved on this device." : ""}</p>
    <details className={styles.reference}>
      <summary>Revisit this lesson&apos;s cards</summary>
      <div className={styles.referenceGrid}>{lesson.cards.map((item) => <div className={styles.referenceItem} key={item.de}><strong lang="de">{item.de}</strong><span>{item.en}</span><span>{item.note}</span><FoundationAudio text={item.audio ?? item.example?.de ?? item.de} label={`Listen: ${item.example?.de ?? item.de}`} /></div>)}</div>
    </details>
    {lessonIndex >= 4 && <details className={styles.reference}><summary>Alphabet reference: A–Z</summary><div className={styles.referenceGrid}>{germanAlphabet.map(([upper, hint, lower]) => <div className={styles.referenceItem} key={upper}><strong>{upper} {lower}</strong><span>{hint}</span><FoundationAudio text={upper} label={`Listen to ${upper}`} /></div>)}</div></details>}
  </main>;
}
