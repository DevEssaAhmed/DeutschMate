"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { competencyById, levelAssessments, levelOrder } from "@/lib/curriculum";
import type { LevelId } from "@/lib/types";
import { ListeningPlayer } from "./listening-player";
import { useProgress } from "./progress-provider";

const minimumWords: Record<LevelId, number> = { A1: 40, A2: 70, B1: 110, B2: 170, C1: 220 };
type Step = "reading" | "listening" | "language" | "writing" | "speaking" | "result";
type PromptAnswers = { gist: string; details: string };
type Draft = {
  step: Step;
  reading: PromptAnswers;
  listening: PromptAnswers;
  answers: Record<number, string>;
  writing: string;
  speakingDone: boolean;
  submitted: boolean;
};

const steps: { id: Step; label: string }[] = [
  { id: "reading", label: "Reading" }, { id: "listening", label: "Listening" },
  { id: "language", label: "Language" }, { id: "writing", label: "Writing" },
  { id: "speaking", label: "Speaking" }, { id: "result", label: "Result" },
];
const emptyPrompts = (): PromptAnswers => ({ gist: "", details: "" });
const draftKey = (level: LevelId) => `deutschmate-assessment-${level}`;

function loadDraft(level: LevelId): Draft | null {
  try {
    const raw = window.localStorage.getItem(draftKey(level));
    if (!raw) return null;
    const value = JSON.parse(raw) as Partial<Draft>;
    return {
      step: steps.some((item) => item.id === value.step) ? value.step! : "reading",
      reading: {
        gist: typeof value.reading?.gist === "string" ? value.reading.gist : "",
        details: typeof value.reading?.details === "string" ? value.reading.details : "",
      },
      listening: {
        gist: typeof value.listening?.gist === "string" ? value.listening.gist : "",
        details: typeof value.listening?.details === "string" ? value.listening.details : "",
      },
      answers: value.answers && typeof value.answers === "object" ? value.answers : {},
      writing: typeof value.writing === "string" ? value.writing : "",
      speakingDone: value.speakingDone === true,
      submitted: value.submitted === true,
    };
  } catch {
    return null;
  }
}

export function AssessmentHub() {
  const progress = useProgress();
  const [level, setLevel] = useState<LevelId>("A1");
  const [step, setStep] = useState<Step>("reading");
  const [reading, setReading] = useState<PromptAnswers>(emptyPrompts);
  const [listening, setListening] = useState<PromptAnswers>(emptyPrompts);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [writing, setWriting] = useState("");
  const [speakingDone, setSpeakingDone] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [loadedLevel, setLoadedLevel] = useState<LevelId | null>(null);

  const assessment = levelAssessments.find((item) => item.level === level)!;
  const score = assessment.questions.reduce((sum, question, index) => sum + (answers[index] === question.answer ? 1 : 0), 0);
  const words = writing.trim() ? writing.trim().split(/\s+/).length : 0;
  const readingReady = Boolean(reading.gist.trim() && reading.details.trim());
  const listeningReady = Boolean(listening.gist.trim() && listening.details.trim());
  const quizReady = assessment.questions.every((_, index) => Boolean(answers[index]));
  const productionReady = words >= minimumWords[level] && speakingDone;
  const readyToSubmit = readingReady && listeningReady && quizReady && productionReady;
  const passed = assessment.questions.length > 0 && score / assessment.questions.length >= 0.7;
  const missedQuestions = assessment.questions.map((question, index) => ({ question, index })).filter(({ question, index }) => answers[index] !== question.answer);

  useEffect(() => {
    const draft = loadDraft(level);
    setStep(draft?.step ?? "reading");
    setReading(draft?.reading ?? emptyPrompts());
    setListening(draft?.listening ?? emptyPrompts());
    setAnswers(draft?.answers ?? {});
    setWriting(draft?.writing ?? "");
    setSpeakingDone(draft?.speakingDone ?? false);
    setSubmitted(draft?.submitted ?? false);
    setLoadedLevel(level);
  }, [level]);

  useEffect(() => {
    if (loadedLevel !== level) return;
    try {
      window.localStorage.setItem(draftKey(level), JSON.stringify({ step, reading, listening, answers, writing, speakingDone, submitted } satisfies Draft));
    } catch {
      // The assessment still works when browser storage is unavailable.
    }
  }, [level, loadedLevel, step, reading, listening, answers, writing, speakingDone, submitted]);

  function updatePrompts(section: "reading" | "listening", field: keyof PromptAnswers, value: string) {
    if (section === "reading") setReading((previous) => ({ ...previous, [field]: value }));
    else setListening((previous) => ({ ...previous, [field]: value }));
    setSubmitted(false);
  }

  function changeLevel(next: LevelId) {
    if (next === level) return;
    setLoadedLevel(null);
    setStep("reading");
    setReading(emptyPrompts());
    setListening(emptyPrompts());
    setAnswers({});
    setWriting("");
    setSpeakingDone(false);
    setSubmitted(false);
    setLevel(next);
  }

  function submit() {
    if (!readyToSubmit || submitted) return;
    // Only vocabulary and grammar have answer keys; the other sections are attempts.
    const scoredCompetencies = assessment.competencyIds.filter((id) => {
      const skill = competencyById(id)?.skill;
      return skill === "grammar" || skill === "vocabulary";
    });
    progress.recordAssessment(level, score, assessment.questions.length, scoredCompetencies);
    setSubmitted(true);
    setStep("result");
  }

  function startNewAttempt() {
    setStep("reading");
    setReading(emptyPrompts());
    setListening(emptyPrompts());
    setAnswers({});
    setWriting("");
    setSpeakingDone(false);
    setSubmitted(false);
  }

  return (
    <div className="assessment-workspace">
      <aside className="assessment-rail card">
        <span className="page-kicker">LEVEL CHECKPOINT</span>
        <div className="assessment-levels">{levelOrder.map((item) => <button type="button" key={item} className={level === item ? "active" : ""} aria-pressed={level === item} onClick={() => changeLevel(item)}>{item}</button>)}</div>
        <h2>{assessment.title}</h2>
        <p>{assessment.description}</p>
        <nav aria-label="Assessment sections">{steps.map((item, index) => <button type="button" key={item.id} className={step === item.id ? "active" : ""} aria-current={step === item.id ? "step" : undefined} onClick={() => setStep(item.id)}><span>{String(index + 1).padStart(2, "0")}</span>{item.label}</button>)}</nav>
        <div className="assessment-readiness">
          <div><span>Reading response</span><strong>{readingReady ? "complete" : "pending"}</strong></div>
          <div><span>Listening response</span><strong>{listeningReady ? "complete" : "pending"}</strong></div>
          <div><span>Language control</span><strong>{Object.keys(answers).length}/{assessment.questions.length}</strong></div>
          <div><span>Writing</span><strong>{words}/{minimumWords[level]}</strong></div>
          <div><span>Speaking</span><strong>{speakingDone ? "attempted" : "pending"}</strong></div>
        </div>
      </aside>

      <section className="assessment-canvas">
        {step === "reading" && <article className="assessment-card card">
          <span className="activity-type">Reading</span><h2>{assessment.reading.title}</h2>
          <div className="reading-text" lang="de">{assessment.reading.text}</div>
          <div className="assessment-response">
            <label><span>First pass · {assessment.reading.gistQuestion}</span><textarea rows={3} value={reading.gist} onChange={(event) => updatePrompts("reading", "gist", event.target.value)} placeholder="Write the main idea in your own words." /></label>
            <label><span>Look closer · {assessment.reading.detailQuestions.join(" ")}</span><textarea rows={4} value={reading.details} onChange={(event) => updatePrompts("reading", "details", event.target.value)} placeholder="Answer the detail questions using evidence from the text." /></label>
          </div>
          <button type="button" className="button primary" disabled={!readingReady} onClick={() => setStep("listening")}>Continue to listening →</button>
        </article>}

        {step === "listening" && <div className="assessment-card-wrap">
          <ListeningPlayer task={assessment.listening} />
          <article className="assessment-card card"><h2>What did you hear?</h2>
            <div className="assessment-response">
              <label><span>First listen · {assessment.listening.gistQuestion}</span><textarea rows={3} value={listening.gist} onChange={(event) => updatePrompts("listening", "gist", event.target.value)} placeholder="Write the main idea before revealing the transcript." /></label>
              <label><span>Second listen · {assessment.listening.detailQuestions.join(" ")}</span><textarea rows={4} value={listening.details} onChange={(event) => updatePrompts("listening", "details", event.target.value)} placeholder="Record the details you heard." /></label>
            </div>
            <button type="button" className="button primary" disabled={!listeningReady} onClick={() => setStep("language")}>Continue to language control →</button>
          </article>
        </div>}

        {step === "language" && <article className="assessment-card card"><span className="activity-type">Language control</span><h2>Vocabulary & grammar checkpoint</h2><p>This section is automatically scored. Your reading, listening and production responses are saved as attempts.</p><div className="assessment-question-list">{assessment.questions.map((question, index) => <fieldset className="quiz-question" key={index}><legend><span>{index + 1}</span>{question.q}</legend><div className="answer-grid">{question.options.map((option) => <button type="button" key={option} aria-pressed={answers[index] === option} className={"answer-option " + (answers[index] === option ? "selected" : "")} onClick={() => { setAnswers((previous) => ({ ...previous, [index]: option })); setSubmitted(false); }}>{option}</button>)}</div></fieldset>)}</div><button type="button" className="button primary" disabled={!quizReady} onClick={() => setStep("writing")}>Continue to writing →</button></article>}

        {step === "writing" && <article className="assessment-card card"><span className="activity-type">Writing</span><h2>{assessment.writingTask}</h2><p>Write at least {minimumWords[level]} words under assessment conditions. Your draft is saved in this browser.</p><textarea className="assessment-writing" rows={14} value={writing} onChange={(event) => { setWriting(event.target.value); setSubmitted(false); }} placeholder="Write your response…" aria-label="Assessment writing response" /><div className="assessment-writing-meta"><span className={words >= minimumWords[level] ? "ready" : ""}>{words}/{minimumWords[level]} words</span><Link href="/writing">Open Writing Studio after the assessment →</Link></div><button type="button" className="button primary" disabled={words < minimumWords[level]} onClick={() => setStep("speaking")}>Continue to speaking →</button></article>}

        {step === "speaking" && <article className="assessment-card card"><span className="activity-type">Speaking</span><h2>{assessment.speakingTask}</h2><p>Prepare briefly and speak without reading a full script. Mark the attempt only after speaking. This self-reported step does not assess pronunciation.</p><div className="assessment-speaking-actions"><button type="button" className={"button " + (speakingDone ? "secondary" : "primary")} onClick={() => { setSpeakingDone(true); setSubmitted(false); }}>{speakingDone ? "✓ Attempt completed" : "Mark speaking attempt complete"}</button><Link className="button secondary" href="/speaking">Open Speaking Studio</Link></div><button type="button" className="button primary" disabled={!speakingDone} onClick={() => setStep("result")}>Review result →</button></article>}

        {step === "result" && <article className="assessment-result card"><span className="activity-type">Result</span><div className="result-score"><strong>{submitted ? score : "—"}</strong><span>/ {assessment.questions.length}</span></div><h2>{submitted ? passed ? "Language checkpoint passed." : "Assessment recorded. Keep practicing." : "Ready to submit?"}</h2><p>{submitted ? "Your language control score is recorded. Reading, listening, writing and speaking were completed as practice attempts and were not automatically graded." : "Complete every section to submit. Only vocabulary and grammar answers affect the numeric score and competency evidence."}</p>{submitted && missedQuestions.length > 0 && <div className="assessment-feedback"><h3>Review these questions</h3>{missedQuestions.map(({ question, index }) => <p key={index}><strong>{question.q}</strong><br />Your answer: {answers[index] || "—"}<br />Correct answer: {question.answer}</p>)}</div>}<button type="button" className="button primary large" onClick={submit} disabled={!readyToSubmit || submitted}>{submitted ? "Assessment recorded" : "Submit integrated assessment"}</button>{submitted && <button type="button" className="button secondary" onClick={startNewAttempt}>Start a new attempt</button>}</article>}
      </section>
    </div>
  );
}
