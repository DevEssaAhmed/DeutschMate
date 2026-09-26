"use client";

import { useMemo, useRef, useState } from "react";
import type { ListeningTask } from "@/lib/types";
import { speakGerman } from "@/lib/speech";
import { UmlautBar } from "./umlaut-bar";

function normalise(value: string) {
  return value.toLocaleLowerCase("de-DE").replace(/[^a-zäöüß0-9\s]/g, "").replace(/\s+/g, " ").trim();
}

function base64ToBlobUrl(data: string, mimeType: string) {
  const bytes = Uint8Array.from(atob(data), (char) => char.charCodeAt(0));
  return URL.createObjectURL(new Blob([bytes], { type: mimeType }));
}

export function ListeningPlayer({ task }: { task: ListeningTask }) {
  const [revealed, setRevealed] = useState(false);
  const [dictation, setDictation] = useState("");
  const [played, setPlayed] = useState(0);
  const [rate, setRate] = useState(.92);
  const [naturalUrl, setNaturalUrl] = useState("");
  const [naturalLoading, setNaturalLoading] = useState(false);
  const [audioError, setAudioError] = useState("");
  const [browserPlaying, setBrowserPlaying] = useState(false);
  const dictationRef = useRef<HTMLInputElement | null>(null);

  const dictationCorrect = useMemo(
    () => normalise(dictation) === normalise(task.dictationLine),
    [dictation, task.dictationLine],
  );

  function playBrowserVoice(text = task.script) {
    speakGerman(text, {
      rate,
      onStart: () => setBrowserPlaying(true),
      onEnd: () => setBrowserPlaying(false),
      onError: () => setBrowserPlaying(false),
    });
    setPlayed((n) => n + 1);
  }

  function insertDictationChar(char: string) {
    const el = dictationRef.current;
    if (!el) {
      setDictation((prev) => prev + char);
      return;
    }
    const start = el.selectionStart ?? dictation.length;
    const end = el.selectionEnd ?? dictation.length;
    const next = dictation.slice(0, start) + char + dictation.slice(end);
    setDictation(next);
    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + char.length, start + char.length);
    }, 0);
  }


  async function generateNaturalAudio() {
    if (naturalLoading) return;
    setNaturalLoading(true);
    setAudioError("");
    try {
      const response = await fetch("/api/speech", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: task.script }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Natural audio generation failed.");
      if (naturalUrl) URL.revokeObjectURL(naturalUrl);
      setNaturalUrl(base64ToBlobUrl(data.data, data.mimeType || "audio/wav"));
      setPlayed((n) => n + 1);
    } catch (err) {
      setAudioError(err instanceof Error ? err.message : "Natural audio generation failed.");
    } finally {
      setNaturalLoading(false);
    }
  }

  return (
    <div className="listening-player card">
      <div className="section-heading">
        <div><span className="eyebrow">LISTENING</span><h3>{task.title}</h3></div>
        <span className="pill">{task.genre}</span>
      </div>

      <div className="natural-listening card">
        <div><strong>Natural German audio</strong><small>Generated server-side for this exact course transcript. Listen before revealing the text.</small></div>
        {!naturalUrl ? (
          <button type="button" className="button primary" onClick={generateNaturalAudio} disabled={naturalLoading}>
            {naturalLoading ? "Generating natural audio…" : "▶ Generate & listen"}
          </button>
        ) : (
          <audio controls autoPlay src={naturalUrl} />
        )}
        {audioError && <p className="ai-error">{audioError} Use the browser voice below as a fallback.</p>}
      </div>

      <div className="listening-controls">
        <button type="button" className={`button secondary ${browserPlaying ? "playing" : ""}`.trim()} onClick={() => playBrowserVoice()}>
          {browserPlaying ? "🔊 Playing…" : `▶ ${played ? "Browser voice fallback (" + played + ")" : "Browser voice fallback"}`}
        </button>
        <label className="rate-control">Fallback speed
          <select value={rate} onChange={(e) => setRate(Number(e.target.value))}>
            <option value={.78}>0.8×</option>
            <option value={.92}>0.9×</option>
            <option value={1}>1.0×</option>
            <option value={1.08}>1.1×</option>
          </select>
        </label>
      </div>

      <ol className="listening-sequence">
        <li><strong>First listen:</strong> {task.gistQuestion}</li>
        <li><strong>Second listen:</strong> {task.detailQuestions.join(" · ")}</li>
        <li>
          <strong>Dictation:</strong>
          <input
            ref={dictationRef}
            value={dictation}
            onChange={(e) => setDictation(e.target.value)}
            placeholder="Type one line exactly as you hear it"
          />
          <UmlautBar onInsert={insertDictationChar} />
          {dictation && <small className={dictationCorrect ? "text-good" : "muted"}>{dictationCorrect ? "✓ Exact match" : "Compare after revealing the transcript."}</small>}
        </li>
        <li><strong>Shadowing:</strong> <button type="button" className="text-button" onClick={() => playBrowserVoice(task.shadowingLine)}>Play target line</button></li>
      </ol>

      <button type="button" className="button secondary" onClick={() => setRevealed((value) => !value)}>
        {revealed ? "Hide transcript" : "Reveal transcript after listening"}
      </button>
      {revealed && <pre className="listening-transcript">{task.script}</pre>}
    </div>

  );
}
