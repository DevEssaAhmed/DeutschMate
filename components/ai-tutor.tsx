"use client";

import { FormEvent, useState } from "react";

const levels = ["A1", "A2", "B1", "B2", "C1"] as const;
type Level = (typeof levels)[number];
type Mode = "tutor" | "grammar_explain";

export function AiTutor() {
  const [level, setLevel] = useState<Level>("A1");
  const [mode, setMode] = useState<Mode>("tutor");
  const [question, setQuestion] = useState("");
  const [context, setContext] = useState("");
  const [reply, setReply] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!question.trim() || loading) return;

    setLoading(true);
    setError("");
    setReply("");

    try {
      const response = await fetch("/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode,
          level,
          text: question,
          context,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Tutor request failed.");
      setReply(data.reply);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Tutor request failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="ai-workspace">
      <form className="ai-form card" onSubmit={submit}>
        <div className="ai-form-row">
          <label>
            <span>CEFR level</span>
            <select value={level} onChange={(e) => setLevel(e.target.value as Level)}>
              {levels.map((item) => <option key={item}>{item}</option>)}
            </select>
          </label>
          <label>
            <span>Teaching mode</span>
            <select value={mode} onChange={(e) => setMode(e.target.value as Mode)}>
              <option value="tutor">Ask the tutor</option>
              <option value="grammar_explain">Grammar deep dive</option>
            </select>
          </label>
        </div>

        <label>
          <span>Your question</span>
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            maxLength={12000}
            rows={7}
            placeholder="For example: Why is it 'mit dem Zug' instead of 'mit den Zug'?"
            required
          />
        </label>

        <label>
          <span>Optional lesson context</span>
          <textarea
            value={context}
            onChange={(e) => setContext(e.target.value)}
            maxLength={5000}
            rows={3}
            placeholder="Paste the sentence, paragraph, or lesson context you are working on."
          />
        </label>

        <div className="ai-form-actions">
          <button className="button primary" type="submit" disabled={loading || !question.trim()}>
            {loading ? "Thinking…" : mode === "grammar_explain" ? "Explain properly" : "Ask DeutschMate"}
          </button>
          <small>Responses are generated for learning, not stored by DeutschMate.</small>
        </div>
      </form>

      {(reply || error) && (
        <section className="ai-response card" aria-live="polite">
          <span className="eyebrow">{error ? "ERROR" : "DEUTSCHMATE TUTOR"}</span>
          {error ? <p className="ai-error">{error}</p> : <pre>{reply}</pre>}
        </section>
      )}
    </div>
  );
}
