"use client";

import { FormEvent, useState } from "react";

const levels = ["A1", "A2", "B1", "B2", "C1"] as const;
type Level = (typeof levels)[number];

export function WritingStudio() {
  const [level, setLevel] = useState<Level>("A1");
  const [task, setTask] = useState("");
  const [text, setText] = useState("");
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!text.trim() || loading) return;

    setLoading(true);
    setFeedback("");
    setError("");

    try {
      const response = await fetch("/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "writing_feedback",
          level,
          text,
          context: task,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Feedback request failed.");
      setFeedback(data.reply);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Feedback request failed.");
    } finally {
      setLoading(false);
    }
  }

  const words = text.trim() ? text.trim().split(/\s+/).length : 0;

  return (
    <div className="writing-layout">
      <form className="writing-editor card" onSubmit={submit}>
        <div className="writing-toolbar">
          <label>
            <span>Target level</span>
            <select value={level} onChange={(e) => setLevel(e.target.value as Level)}>
              {levels.map((item) => <option key={item}>{item}</option>)}
            </select>
          </label>
          <span className="writing-count">{words} words</span>
        </div>

        <label>
          <span>Writing task</span>
          <textarea
            value={task}
            onChange={(e) => setTask(e.target.value)}
            maxLength={5000}
            rows={4}
            placeholder="Example: Write an email to your landlord explaining a problem with the heating."
          />
        </label>

        <label>
          <span>Your German</span>
          <textarea
            className="writing-textarea"
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={12000}
            rows={18}
            placeholder="Write your own answer here before asking for feedback…"
            required
          />
        </label>

        <div className="ai-form-actions">
          <button className="button primary" type="submit" disabled={loading || !text.trim()}>
            {loading ? "Reviewing…" : "Get teacher feedback"}
          </button>
          <small>The tutor corrects and explains; it does not replace your answer with a model essay.</small>
        </div>
      </form>

      <aside className="writing-feedback card" aria-live="polite">
        <span className="eyebrow">TEACHER FEEDBACK</span>
        {!feedback && !error && (
          <div className="feedback-placeholder">
            <h2>Write first. Feedback second.</h2>
            <p>
              DeutschMate will focus on errors, natural phrasing, cohesion, register and the
              highest-value skills to practise next.
            </p>
          </div>
        )}
        {error && <p className="ai-error">{error}</p>}
        {feedback && <pre>{feedback}</pre>}
      </aside>
    </div>
  );
}
