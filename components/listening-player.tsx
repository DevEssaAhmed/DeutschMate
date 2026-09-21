"use client";

import { useMemo, useState } from "react";
import type { ListeningTask } from "@/lib/types";

function normalise(value: string) {
  return value.toLocaleLowerCase("de-DE").replace(/[^a-zäöüß0-9\s]/g, "").replace(/\s+/g, " ").trim();
}

export function ListeningPlayer({ task }: { task: ListeningTask }) {
  const [revealed, setRevealed] = useState(false);
  const [dictation, setDictation] = useState("");
  const [played, setPlayed] = useState(0);
  const [rate, setRate] = useState(.92);

  const dictationCorrect = useMemo(
    () => normalise(dictation) === normalise(task.dictationLine),
    [dictation, task.dictationLine],
  );

  function play(text = task.script) {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text.replace(/^[A-ZÄÖÜ]:\s*/gm, ""));
    utterance.lang = "de-DE";
    utterance.rate = rate;
    window.speechSynthesis.speak(utterance);
    setPlayed((n) => n + 1);
  }

  return (
    <div className="listening-player card">
      <div className="section-heading">
        <div><span className="eyebrow">LISTENING</span><h3>{task.title}</h3></div>
        <span className="pill">{task.genre}</span>
      </div>

      <div className="listening-controls">
        <button type="button" className="button primary" onClick={() => play()}>
          ▶ {played ? "Listen again (" + played + ")" : "Listen without transcript"}
        </button>
        <label className="rate-control">Speed
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
          <input value={dictation} onChange={(e) => setDictation(e.target.value)} placeholder="Type one line exactly as you hear it" />
          {dictation && <small className={dictationCorrect ? "text-good" : "muted"}>{dictationCorrect ? "✓ Exact match" : "Compare after revealing the transcript."}</small>}
        </li>
        <li><strong>Shadowing:</strong> <button type="button" className="text-button" onClick={() => play(task.shadowingLine)}>Play target line</button></li>
      </ol>

      <button type="button" className="button secondary" onClick={() => setRevealed((value) => !value)}>
        {revealed ? "Hide transcript" : "Reveal transcript after listening"}
      </button>
      {revealed && <pre className="listening-transcript">{task.script}</pre>}
    </div>
  );
}
