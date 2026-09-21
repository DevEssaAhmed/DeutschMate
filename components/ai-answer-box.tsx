"use client";

import { useState } from "react";
import type { LevelId } from "@/lib/types";

type Assessment = {
  verdict: "correct" | "almost" | "needs_work";
  score: number;
  feedback: string;
  correction: string;
  microTip: string;
};

export function AiAnswerBox({
  level,
  prompt,
  context,
  expected,
  placeholder = "Write your answer in German…",
  minLength = 3,
  multiline = true,
  onAssessed,
}: {
  level: LevelId;
  prompt: string;
  context: string;
  expected?: string;
  placeholder?: string;
  minLength?: number;
  multiline?: boolean;
  onAssessed?: (assessment: Assessment) => void;
}) {
  const [answer, setAnswer] = useState("");
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function check() {
    if (answer.trim().length < minLength || loading) return;
    setLoading(true);
    setError("");
    setAssessment(null);
    try {
      const assessmentContext = [
        "Exercise prompt: " + prompt,
        context,
        expected ? "Reference/expected content: " + expected : "",
      ].filter(Boolean).join("\n\n");
      const response = await fetch("/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "answer_assess",
          level,
          text: answer,
          context: assessmentContext,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not assess this answer.");
      setAssessment(data.assessment);
      onAssessed?.(data.assessment);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not assess this answer.");
    } finally {
      setLoading(false);
    }
  }

  function retry() {
    setAssessment(null);
    setError("");
  }

  const good = assessment && assessment.score >= 60;

  return (
    <div className="answer-composer">
      {multiline ? (
        <textarea
          value={answer}
          onChange={(event) => { setAnswer(event.target.value); if (assessment) setAssessment(null); }}
          rows={5}
          placeholder={placeholder}
          aria-label={prompt}
        />
      ) : (
        <input
          value={answer}
          onChange={(event) => { setAnswer(event.target.value); if (assessment) setAssessment(null); }}
          placeholder={placeholder}
          aria-label={prompt}
        />
      )}
      <div className="answer-composer-actions">
        <span>{answer.trim().length ? answer.trim().split(/\s+/).length + " words" : "Your answer is private to this request"}</span>
        <button className="button primary" type="button" disabled={loading || answer.trim().length < minLength} onClick={check}>
          {loading ? "Checking…" : "Check my answer"}
        </button>
      </div>

      {error && <div className="answer-feedback needs-work"><strong>Couldn’t assess</strong><p>{error}</p></div>}
      {assessment && (
        <div className={"answer-feedback " + assessment.verdict} aria-live="polite">
          <div className="answer-feedback-head">
            <span className="feedback-icon">{assessment.verdict === "correct" ? "✓" : assessment.verdict === "almost" ? "≈" : "↻"}</span>
            <div>
              <strong>{assessment.verdict === "correct" ? "Good answer" : assessment.verdict === "almost" ? "Nearly there" : "Try this again"}</strong>
              <span>{assessment.score}/100 for this response</span>
            </div>
          </div>
          <p>{assessment.feedback}</p>
          {assessment.correction && <div className="answer-correction"><small>Stronger / corrected version</small><b lang="de">{assessment.correction}</b></div>}
          <div className="micro-tip"><small>Remember</small><span>{assessment.microTip}</span></div>
          {!good && <button type="button" className="button secondary" onClick={retry}>Revise my answer</button>}
        </div>
      )}
    </div>
  );
}
