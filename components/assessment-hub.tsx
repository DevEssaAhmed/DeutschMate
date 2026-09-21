"use client";

import Link from "next/link";
import { useState } from "react";
import { levelAssessments, levelOrder } from "@/lib/curriculum";
import type { LevelId } from "@/lib/types";
import { ListeningPlayer } from "./listening-player";
import { useProgress } from "./progress-provider";

const minimumWords: Record<LevelId, number> = { A1: 40, A2: 70, B1: 110, B2: 170, C1: 220 };

export function AssessmentHub() {
  const progress = useProgress();
  const [level, setLevel] = useState<LevelId>("A1");
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

  function submit() {
    setSubmitted(true);
    if (quizReady && productionReady) progress.recordAssessment(level, score, assessment.questions.length, assessment.competencyIds);
  }

  return (
    <div className="assessment-hub">
      <div className="lab-toolbar card">
        <div><span className="eyebrow">INTEGRATED CHECKPOINT</span><strong>Use this after completing a CEFR level.</strong></div>
        <div className="segmented">{levelOrder.map((item) => <button type="button" key={item} className={level === item ? "active" : ""} onClick={() => { setLevel(item); setAnswers({}); setWriting(""); setSpeakingDone(false); setSubmitted(false); }}>{item}</button>)}</div>
      </div>

      <section className="assessment-section card">
        <span className="eyebrow">READING</span><h2>{assessment.reading.title}</h2>
        <p className="reading-text">{assessment.reading.text}</p>
        <div className="reception-questions"><p><b>Gist:</b> {assessment.reading.gistQuestion}</p>{assessment.reading.detailQuestions.map((q) => <p key={q}>• {q}</p>)}</div>
      </section>

      <ListeningPlayer task={assessment.listening} />

      <section className="assessment-section card">
        <span className="eyebrow">LANGUAGE CONTROL</span><h2>Vocabulary & grammar checkpoint</h2>
        {assessment.questions.map((question, index) => <fieldset className="quiz-question" key={index}><legend><span>{index + 1}</span>{question.q}</legend><div className="answer-grid">{question.options.map((option) => { const selected=answers[index]===option; const state=submitted ? option===question.answer ? "correct" : selected ? "wrong" : "" : selected ? "selected" : ""; return <button type="button" key={option} className={"answer-option " + state} onClick={() => setAnswers((prev) => ({...prev,[index]:option}))}>{option}</button>; })}</div></fieldset>)}
      </section>

      <section className="assessment-section card">
        <span className="eyebrow">WRITING</span><h2>{assessment.writingTask}</h2>
        <p>Minimum for this internal checkpoint: {minimumWords[level]} words. Focus on task achievement and language appropriate to {level}.</p>
        <textarea className="assessment-writing" rows={12} value={writing} onChange={(e) => setWriting(e.target.value)} placeholder="Write under timed conditions before requesting AI feedback…" />
        <div className="assessment-writing-meta"><span>{words}/{minimumWords[level]} minimum words</span><Link href="/writing">Open Writing Studio after finishing →</Link></div>
      </section>

      <section className="assessment-section card">
        <span className="eyebrow">SPEAKING</span><h2>{assessment.speakingTask}</h2>
        <p>Prepare briefly, speak without reading a full script, and then use the Speaking Studio for transcript-based feedback.</p>
        <div className="assessment-speaking-actions"><button type="button" className={"button " + (speakingDone ? "secondary" : "primary")} onClick={() => setSpeakingDone(true)}>{speakingDone ? "✓ Speaking attempt completed" : "I completed the speaking task"}</button><Link className="button secondary" href="/speaking">Open Speaking Studio</Link></div>
      </section>

      <section className="assessment-submit card">
        <div><span className="eyebrow">RESULT</span><h2>{submitted ? score + "/" + assessment.questions.length : "Complete all sections"}</h2><p>{submitted && passed && productionReady ? "Checkpoint evidence recorded in your CEFR profile." : submitted ? "Review weak areas and repeat the assessment after more study." : "The checkpoint is recorded only after the language-control questions, writing minimum and speaking attempt are complete."}</p></div>
        <button type="button" className="button primary" onClick={submit} disabled={!quizReady || !productionReady}>Submit integrated assessment</button>
      </section>
    </div>
  );
}
