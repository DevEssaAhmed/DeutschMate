"use client";

import { FormEvent, useMemo, useState } from "react";
import { courseModules, levelOrder } from "@/lib/curriculum";
import type { LevelId } from "@/lib/types";

export function SpeakingStudio() {
  const [level, setLevel] = useState<LevelId>("A1");
  const [moduleIndex, setModuleIndex] = useState(0);
  const [transcript, setTranscript] = useState("");
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");
  const [listening, setListening] = useState(false);
  const [loading, setLoading] = useState(false);

  const modules = useMemo(() => courseModules.filter((module) => module.level === level), [level]);
  const module = modules[moduleIndex % Math.max(1, modules.length)];

  function startRecognition() {
    if (typeof window === "undefined") return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError("Live speech recognition is not available in this browser. Record yourself separately or type a transcript below.");
      return;
    }

    setError("");
    const recognition = new SpeechRecognition();
    recognition.lang = "de-DE";
    recognition.interimResults = true;
    recognition.continuous = true;
    let finalText = transcript;

    recognition.onresult = (event: any) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const text = event.results[i][0]?.transcript ?? "";
        if (event.results[i].isFinal) finalText += (finalText ? " " : "") + text;
        else interim += text;
      }
      setTranscript((finalText + (interim ? " " + interim : "")).trim());
    };
    recognition.onerror = () => { setListening(false); setError("Speech recognition stopped with an error. You can keep editing the transcript manually."); };
    recognition.onend = () => setListening(false);
    recognition.start();
    setListening(true);
  }

  async function requestFeedback(event: FormEvent) {
    event.preventDefault();
    if (!module || transcript.trim().length < 10) return;
    setLoading(true);
    setError("");
    setFeedback("");

    try {
      const response = await fetch("/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "speaking_feedback",
          level,
          text: transcript,
          context: module.speakingTask,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Speaking feedback failed.");
      setFeedback(data.reply);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Speaking feedback failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="speaking-studio">
      <div className="lab-toolbar card">
        <div><span className="eyebrow">SPEAKING CURRICULUM</span><strong>Plan briefly, then speak without reading a script.</strong></div>
        <div className="segmented">{levelOrder.map((item) => <button type="button" key={item} className={level === item ? "active" : ""} onClick={() => { setLevel(item); setModuleIndex(0); setTranscript(""); setFeedback(""); }}>{item}</button>)}</div>
      </div>

      {module && <div className="speaking-layout">
        <aside className="speaking-prompts card">
          <span className={"level-badge level-" + level.toLowerCase()}>{level}</span>
          <span className="eyebrow">MODULE {module.index}</span>
          <h2>{module.title}</h2>
          <p>{module.speakingTask}</p>
          <div className="module-can-do">{module.canDos.map((item) => <span key={item}>✓ {item}</span>)}</div>
          <strong>Useful language</strong>
          <div className="chunk-row">{module.chunks.map((chunk) => <span key={chunk}>{chunk}</span>)}</div>
          <label>Choose another task
            <select value={moduleIndex} onChange={(e) => { setModuleIndex(Number(e.target.value)); setTranscript(""); setFeedback(""); }}>
              {modules.map((item, index) => <option key={item.slug} value={index}>{index + 1}. {item.title}</option>)}
            </select>
          </label>
        </aside>

        <form className="speaking-work card" onSubmit={requestFeedback}>
          <span className="eyebrow">YOUR ATTEMPT</span>
          <h2>Speak first. Analyse second.</h2>
          <div className="speaking-actions">
            <button type="button" className="button primary" onClick={startRecognition} disabled={listening}>{listening ? "Listening…" : "Start German speech recognition"}</button>
            <button type="button" className="button secondary" onClick={() => setTranscript("")}>Clear transcript</button>
          </div>
          <textarea value={transcript} onChange={(e) => setTranscript(e.target.value)} rows={12} placeholder="Your recognised speech appears here. You can also type a transcript from a recording." />
          <button className="button primary" type="submit" disabled={loading || transcript.trim().length < 10}>{loading ? "Analysing…" : "Get speaking feedback"}</button>
          {error && <p className="ai-error">{error}</p>}
          {feedback && <pre className="speaking-feedback">{feedback}</pre>}
        </form>
      </div>}
    </div>
  );
}
