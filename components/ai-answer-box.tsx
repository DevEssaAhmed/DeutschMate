"use client";

import { useRef, useState } from "react";
import type { LevelId } from "@/lib/types";
import { UmlautBar } from "./umlaut-bar";

type Assessment = {
  verdict: "correct" | "almost" | "needs_work";
  score: number;
  feedback: string;
  correction: string;
  microTip: string;
  source: "ai" | "self";
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
  const [showSelfAssess, setShowSelfAssess] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement | HTMLInputElement | null>(null);

  function insertChar(char: string) {
    const el = inputRef.current;
    if (!el) {
      setAnswer((prev) => prev + char);
      return;
    }
    const start = el.selectionStart ?? answer.length;
    const end = el.selectionEnd ?? answer.length;
    const next = answer.slice(0, start) + char + answer.slice(end);
    setAnswer(next);
    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + char.length, start + char.length);
    }, 0);
  }

  async function check() {
    if (answer.trim().length < minLength || loading) return;
    setLoading(true);
    setError("");
    setAssessment(null);
    setShowSelfAssess(false);
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
      const result: Assessment = { ...data.assessment, source: "ai" };
      setAssessment(result);
      onAssessed?.(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not assess this answer.");
      setShowSelfAssess(true);
    } finally {
      setLoading(false);
    }
  }

  function handleSelfAssess(passed: boolean) {
    const selfAssessment: Assessment = {
      verdict: passed ? "correct" : "needs_work",
      score: passed ? 60 : 0,
      source: "self",
      feedback: passed
        ? "Self-assessed: You confirmed your answer communicates the required meaning and structure."
        : "Self-assessed: You decided this answer needs revision. Try adjusting grammar, vocabulary, or word order.",
      correction: expected ? expected : "",
      microTip: "Self-monitoring and comparing against model forms builds genuine autonomous accuracy.",
    };
    setAssessment(selfAssessment);
    setError("");
    setShowSelfAssess(false);
    onAssessed?.(selfAssessment);
  }

  function retry() {
    setAssessment(null);
    setError("");
    setShowSelfAssess(false);
  }

  const good = assessment && assessment.score >= 60;

  return (
    <div className="answer-composer">
      {multiline ? (
        <textarea
          ref={inputRef as any}
          value={answer}
          onChange={(event) => {
            setAnswer(event.target.value);
            if (assessment) setAssessment(null);
          }}
          rows={5}
          placeholder={placeholder}
          aria-label={prompt}
        />
      ) : (
        <input
          ref={inputRef as any}
          value={answer}
          onChange={(event) => {
            setAnswer(event.target.value);
            if (assessment) setAssessment(null);
          }}
          placeholder={placeholder}
          aria-label={prompt}
        />
      )}

      <UmlautBar onInsert={insertChar} />

      <div className="answer-composer-actions">
        <span>{answer.trim().length ? answer.trim().split(/\s+/).length + " words" : "Your answer is private to this request"}</span>
        <button className="button primary" type="button" disabled={loading || answer.trim().length < minLength} onClick={check}>
          {loading ? "Checking…" : "Check my answer"}
        </button>
      </div>

      {error && (
        <div className="answer-feedback needs-work">
          <strong>AI evaluation unavailable</strong>
          <p>{error}</p>
          <button
            type="button"
            className="button secondary"
            style={{ marginTop: 8 }}
            onClick={() => setShowSelfAssess(true)}
          >
            Compare with reference & self-assess →
          </button>
        </div>
      )}

      {showSelfAssess && (
        <div className="self-assess-card card" aria-live="polite">
          <div className="self-assess-head">
            <span className="feedback-icon">👁</span>
            <div>
              <strong>Self-Evaluation Mode</strong>
              <span>Compare your draft against the reference criteria below</span>
            </div>
          </div>
          {expected && (
            <div className="answer-correction">
              <small>Expected / Reference German</small>
              <b lang="de">{expected}</b>
            </div>
          )}
          <div className="micro-tip">
            <small>Checklist</small>
            <span>Did you convey the core meaning? Are verb position, noun gender, and endings reasonable for {level}?</span>
          </div>
          <div className="self-assess-actions">
            <button
              type="button"
              className="button primary"
              onClick={() => handleSelfAssess(true)}
            >
              ✓ My answer meets the criteria
            </button>
            <button
              type="button"
              className="button secondary"
              onClick={() => handleSelfAssess(false)}
            >
              Needs revision
            </button>
          </div>
        </div>
      )}

      {assessment && !showSelfAssess && (
        <div className={"answer-feedback " + assessment.verdict} aria-live="polite">
          <div className="answer-feedback-head">
            <span className="feedback-icon">{assessment.verdict === "correct" ? "✓" : assessment.verdict === "almost" ? "≈" : "↻"}</span>
            <div>
              <strong>{assessment.source === "self" ? "Self-check recorded" : assessment.verdict === "correct" ? "Good answer" : assessment.verdict === "almost" ? "Nearly there" : "Try this again"}</strong>
              <span>{assessment.source === "self" ? "Practice attempt · no verified skill evidence" : `${assessment.score}/100 for this response`}</span>
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
