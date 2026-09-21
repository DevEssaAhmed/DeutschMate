"use client";

import Link from "next/link";
import { useState } from "react";
import { levelAssessments, levelOrder } from "@/lib/curriculum";
import type { LevelId } from "@/lib/types";
import { ListeningPlayer } from "./listening-player";
import { useProgress } from "./progress-provider";

const minimumWords: Record<LevelId, number> = { A1: 40, A2: 70, B1: 110, B2: 170, C1: 220 };
type Step = "reading" | "listening" | "language" | "writing" | "speaking" | "result";
const steps: { id: Step; label: string }[] = [
  { id: "reading", label: "Reading" },
  { id: "listening", label: "Listening" },
  { id: "language", label: "Language" },
  { id: "writing", label: "Writing" },
  { id: "speaking", label: "Speaking" },
  { id: "result", label: "Result" },
];

export function AssessmentHub() {
  const progress = useProgress();
  const [level, setLevel] = useState<LevelId>("A1");
  const [step, setStep] = useState<Step>("reading");
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [writing, setWriting] = useState("");
  const [speakingDone, setSpeakingDone] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const assessment = levelAssessments.find((item) => item.level === level)!;
  const score = assessment.questions.reduce((sum, q, index) => sum + (answers[index] === q.answer ? 1 : 0), 0);
  const words = writing.trim() ? writing.trim().split(/\s+/).length : 0;
  const productionReady = words >= minimumWords[level] && speakingDone;
  const quizReady = Object.keys(answers).length === assessment.questions.length;
  const passed = assessment.questions.length > 0 && score / assessment.questions.length >= .7;

  function changeLevel(next: LevelId) {
    setLevel(next); setStep("reading"); setAnswers({}); setWriting(""); setSpeakingDone(false); setSubmitted(false);
  }

  function submit() {
    setSubmitted(true);
    if (quizReady && productionReady) progress.recordAssessment(level, score, assessment.questions.length, assessment.competencyIds);
    setStep("result");
  }

  return (
    <div className="assessment-workspace">
      <aside className="assessment-rail card">
        <span className="page-kicker">LEVEL CHECKPOINT</span>
        <div className="assessment-levels">{levelOrder.map((item) => <button type="button" key={item} className={level === item ? "active" : ""} onClick={() => changeLevel(item)}>{item}</button>)}</div>
        <h2>{assessment.title}</h2>
        <p>{assessment.description}</p>
        <nav>
          {steps.map((item, index) => <button type="button" key={item.id} className={step === item.id ? "active" : ""} onClick={() => setStep(item.id)}><span>{String(index + 1).padStart(2, "0")}</span>{item.label}</button>)}
        </nav>
        <div className="assessment-readiness">
          <div><span>Language control</span><strong>{Object.keys(answers).length}/{assessment.questions.length}</strong></div>
          <div><span>Writing</span><strong>{words}/{minimumWords[level]}</strong></div>
          <div><span>Speaking</span><strong>{speakingDone ? "done" : "pending"}</strong></div>
        </div>
      </aside>

      <section className="assessment-canvas">
        {step === "reading" && <article className="assessment-card card"><span className="activity-type">Reading</span><h2>{assessment.reading.title}</h2><div className="reading-text">{assessment.reading.text}</div><div className="assessment-prompts"><p><b>Gist:</b> {assessment.reading.gistQuestion}</p>{assessment.reading.detailQuestions.map((q) => <p key={q}>{q}</p>)}</div><button className="button primary" onClick={() => setStep("listening")}>Continue to listening →</button></article>}

        {step === "listening" && <div className="assessment-card-wrap"><ListeningPlayer task={assessment.listening} /><button className="button primary" onClick={() => setStep("language")}>Continue to language control →</button></div>}

        {step === "language" && <article className="assessment-card card"><span className="activity-type">Language control</span><h2>Vocabulary & grammar checkpoint</h2><div className="assessment-question-list">{assessment.questions.map((question, index) => <fieldset className="quiz-question" key={index}><legend><span>{index + 1}</span>{question.q}</legend><div className="answer-grid">{question.options.map((option) => <button type="button" key={option} className={"answer-option " + (answers[index] === option ? "selected" : "")} onClick={() => setAnswers((prev) => ({ ...prev, [index]: option }))}>{option}</button>)}</div></fieldset>)}</div><button className="button primary" disabled={!quizReady} onClick={() => setStep("writing")}>Continue to writing →</button></article>}

        {step === "writing" && <article className="assessment-card card"><span className="activity-type">Writing</span><h2>{assessment.writingTask}</h2><p>Write at least {minimumWords[level]} words under assessment conditions.</p><textarea className="assessment-writing" rows={14} value={writing} onChange={(e) => setWriting(e.target.value)} placeholder="Write your response…" /><div className="assessment-writing-meta"><span className={words >= minimumWords[level] ? "ready" : ""}>{words}/{minimumWords[level]} words</span><Link href="/writing">Open Writing Studio after the assessment →</Link></div><button className="button primary" disabled={words < minimumWords[level]} onClick={() => setStep("speaking")}>Continue to speaking →</button></article>}

        {step === "speaking" && <article className="assessment-card card"><span className="activity-type">Speaking</span><h2>{assessment.speakingTask}</h2><p>Prepare briefly and speak without reading a full script. Use Speaking Studio for audio analysis after the attempt.</p><div className="assessment-speaking-actions"><button type="button" className={"button " + (speakingDone ? "secondary" : "primary")} onClick={() => setSpeakingDone(true)}>{speakingDone ? "✓ Attempt completed" : "Mark speaking attempt complete"}</button><Link className="button secondary" href="/speaking">Open Speaking Studio</Link></div><button className="button primary" disabled={!speakingDone} onClick={() => setStep("result")}>Review result →</button></article>}

        {step === "result" && <article className="assessment-result card"><span className="activity-type">Result</span><div className="result-score"><strong>{submitted ? score : "—"}</strong><span>/ {assessment.questions.length}</span></div><h2>{submitted ? passed && productionReady ? "Checkpoint evidence recorded." : "More study recommended." : "Ready to submit?"}</h2><p>{submitted ? passed && productionReady ? "Your completed checkpoint has updated the relevant competency evidence." : "Review your weak areas before repeating this level checkpoint." : "Submitting records the checkpoint only when language control, writing and speaking requirements are complete."}</p><button type="button" className="button primary large" onClick={submit} disabled={!quizReady || !productionReady || submitted}>{submitted ? "Assessment recorded" : "Submit integrated assessment"}</button></article>}
      </section>
    </div>
  );
}
