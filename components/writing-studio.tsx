"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { courseModules, levelOrder } from "@/lib/curriculum";
import type { LevelId } from "@/lib/types";

export function WritingStudio() {
  const [level, setLevel] = useState<LevelId>("A1");
  const [moduleIndex, setModuleIndex] = useState(0);
  const [text, setText] = useState("");
  const [plan, setPlan] = useState("");
  const [feedback, setFeedback] = useState("");
  const [model, setModel] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState<"feedback" | "model" | "">("");

  const modules = useMemo(() => courseModules.filter((module) => module.level === level), [level]);
  const module = modules[moduleIndex % Math.max(1, modules.length)];
  const draftKey = module ? "deutschmate-writing:" + level + ":" + module.slug : "";

  useEffect(() => {
    if (!draftKey) return;
    try {
      const saved = window.localStorage.getItem(draftKey);
      setText(saved ?? "");
    } catch {}
  }, [draftKey]);

  useEffect(() => {
    if (!draftKey) return;
    try { window.localStorage.setItem(draftKey, text); } catch {}
  }, [draftKey, text]);

  async function callAi(mode: "writing_feedback" | "writing_model") {
    if (!module || text.trim().length < 20) return;
    setLoading(mode === "writing_feedback" ? "feedback" : "model");
    setError("");
    if (mode === "writing_feedback") setFeedback(""); else setModel("");

    try {
      const response = await fetch("/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode, level, text, context: module.writingTask }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Writing request failed.");
      if (mode === "writing_feedback") setFeedback(data.reply); else setModel(data.reply);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Writing request failed.");
    } finally {
      setLoading("");
    }
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    void callAi("writing_feedback");
  }

  const words = text.trim() ? text.trim().split(/\s+/).length : 0;

  return (
    <div className="writing-studio-v2">
      <aside className="writing-brief card">
        <div className="writing-toolbar">
          <label><span>Target level</span><select value={level} onChange={(e) => { setLevel(e.target.value as LevelId); setModuleIndex(0); setFeedback(""); setModel(""); }}>{levelOrder.map((item) => <option key={item}>{item}</option>)}</select></label>
          <span className="writing-count">{words} words</span>
        </div>
        {module && <>
          <label><span>Course task</span><select value={moduleIndex} onChange={(e) => { setModuleIndex(Number(e.target.value)); setFeedback(""); setModel(""); }}>{modules.map((item, index) => <option key={item.slug} value={index}>{index + 1}. {item.title}</option>)}</select></label>
          <span className={"mini-level level-" + level.toLowerCase()}>{level}</span>
          <h2>{module.writingTask}</h2>
          <div className="writing-support">
            <strong>Plan before writing</strong>
            <ul><li>What is your purpose and reader?</li><li>What are the 2–4 points you must cover?</li><li>Which example or evidence will support each point?</li><li>Which register is appropriate?</li></ul>
            <textarea value={plan} onChange={(e) => setPlan(e.target.value)} rows={5} placeholder="Outline only—do not write the whole answer here." />
          </div>
          <div className="writing-support"><strong>Useful chunks</strong><div className="chunk-row">{module.chunks.map((chunk) => <span key={chunk}>{chunk}</span>)}</div></div>
          <div className="writing-support"><strong>Grammar to deliberately use</strong><p>{module.grammarFocus.join(" · ")}</p></div>
        </>}
      </aside>

      <form className="writing-editor card" onSubmit={submit}>
        <span className="eyebrow">YOUR DRAFT</span>
        <textarea className="writing-textarea" value={text} onChange={(e) => setText(e.target.value)} rows={20} placeholder="Write your own German before asking for feedback…" required />
        <div className="writing-checklist">
          <label><input type="checkbox" /> I answered the whole task.</label>
          <label><input type="checkbox" /> I checked verb position and endings.</label>
          <label><input type="checkbox" /> I used connectors appropriate to the level.</label>
          <label><input type="checkbox" /> I reread for register and clarity.</label>
        </div>
        <div className="ai-form-actions">
          <button className="button primary" type="submit" disabled={loading !== "" || text.trim().length < 20}>{loading === "feedback" ? "Reviewing…" : "Get teacher feedback"}</button>
          <button className="button secondary" type="button" disabled={loading !== "" || !feedback} onClick={() => void callAi("writing_model")}>{loading === "model" ? "Building comparison…" : "Show comparison model after feedback"}</button>
          <small>Drafts are saved only in this browser.</small>
        </div>
        {error && <p className="ai-error">{error}</p>}
      </form>

      <section className="writing-feedback card" aria-live="polite">
        <span className="eyebrow">TEACHER FEEDBACK</span>
        {!feedback && <div className="feedback-placeholder"><h2>Write first. Feedback second.</h2><p>The tutor diagnoses grammar, naturalness, cohesion, register and the highest-value next targets without replacing your work.</p></div>}
        {feedback && <pre>{feedback}</pre>}
        {model && <div className="model-comparison"><span className="eyebrow">COMPARISON MODEL</span><pre>{model}</pre></div>}
      </section>
    </div>
  );
}
