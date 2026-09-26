"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { courseModules, levelOrder } from "@/lib/curriculum";
import type { LevelId } from "@/lib/types";
import { UmlautBar } from "./umlaut-bar";

export function WritingStudio() {
  const [level, setLevel] = useState<LevelId>("A1");
  const [moduleIndex, setModuleIndex] = useState(0);
  const [text, setText] = useState("");
  const [plan, setPlan] = useState("");
  const [feedback, setFeedback] = useState("");
  const [model, setModel] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState<"feedback" | "model" | "">("");
  const textRef = useRef<HTMLTextAreaElement | null>(null);

  const modules = useMemo(() => courseModules.filter((module) => module.level === level), [level]);
  const module = modules[moduleIndex % Math.max(1, modules.length)];
  const draftKey = module ? "deutschmate-writing:" + level + ":" + module.slug : "";

  function insertChar(char: string) {
    const el = textRef.current;
    if (!el) {
      setText((prev) => prev + char);
      return;
    }
    const start = el.selectionStart ?? text.length;
    const end = el.selectionEnd ?? text.length;
    const next = text.slice(0, start) + char + text.slice(end);
    setText(next);
    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + char.length, start + char.length);
    }, 0);
  }

  useEffect(() => {
    if (!draftKey) return;
    try { setText(window.localStorage.getItem(draftKey) ?? ""); } catch {}
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
    } finally { setLoading(""); }
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    void callAi("writing_feedback");
  }

  const words = text.trim() ? text.trim().split(/\s+/).length : 0;

  return (
    <div className="studio-workspace">
      <aside className="studio-brief card">
        <div className="studio-controls">
          <label><span>Level</span><select value={level} onChange={(e) => { setLevel(e.target.value as LevelId); setModuleIndex(0); setFeedback(""); setModel(""); }}>{levelOrder.map((item) => <option key={item}>{item}</option>)}</select></label>
          <label><span>Task</span><select value={moduleIndex} onChange={(e) => { setModuleIndex(Number(e.target.value)); setFeedback(""); setModel(""); }}>{modules.map((item, index) => <option key={item.slug} value={index}>{index + 1}. {item.title}</option>)}</select></label>
        </div>

        {module && <>
          <span className={"level-dot level-" + level.toLowerCase()}>{level}</span>
          <h2>{module.writingTask}</h2>
          <div className="studio-support">
            <span className="page-kicker">PLAN</span>
            <textarea value={plan} onChange={(e) => setPlan(e.target.value)} rows={6} placeholder="Purpose, reader, key points, examples…" />
          </div>
          <div className="studio-support"><span className="page-kicker">USEFUL CHUNKS</span><div className="chunk-row">{module.chunks.slice(0, 5).map((chunk) => <span key={chunk}>{chunk}</span>)}</div></div>
          <div className="studio-support"><span className="page-kicker">GRAMMAR TO USE</span><p>{module.grammarFocus.join(" · ")}</p></div>
        </>}
      </aside>

      <section className="studio-main">
        <form className="writing-canvas card" onSubmit={submit}>
          <header><div><span className="page-kicker">YOUR DRAFT</span><h2>Write first. Improve second.</h2></div><span className="word-count">{words} words</span></header>
          <textarea
            ref={textRef}
            className="writing-textarea"
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={18}
            placeholder="Write your own German before asking for feedback…"
            required
          />
          <UmlautBar onInsert={insertChar} />
          <div className="writing-checklist">
            <label><input type="checkbox" /> I answered the whole task.</label>
            <label><input type="checkbox" /> I checked verb position and endings.</label>
            <label><input type="checkbox" /> I used connectors appropriate to the level.</label>
          </div>
          <div className="studio-actions">
            <button className="button primary" type="submit" disabled={loading !== "" || text.trim().length < 20}>{loading === "feedback" ? "Reviewing…" : "Get teacher feedback"}</button>
            <span>Draft saved locally in this browser.</span>
          </div>
          {error && <p className="ai-error">{error}</p>}
        </form>

        <section className={"feedback-drawer card " + (feedback ? "has-feedback" : "")} aria-live="polite">
          <header><span className="page-kicker">AI TEACHER</span>{feedback && <button className="text-button" type="button" disabled={loading !== ""} onClick={() => void callAi("writing_model")}>{loading === "model" ? "Building…" : "Compare with a model →"}</button>}</header>
          {!feedback ? <div className="feedback-empty"><span>✦</span><div><h3>Your feedback will appear here.</h3><p>DeutschMate checks grammar, vocabulary, cohesion, register and task achievement while preserving your ideas.</p></div></div> : <pre>{feedback}</pre>}
          {model && <div className="model-comparison"><span className="page-kicker">COMPARISON MODEL</span><pre>{model}</pre></div>}
        </section>
      </section>
    </div>
  );
}
