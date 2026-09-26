"use client";

import { FormEvent, useMemo, useRef, useState } from "react";
import { courseModules, levelOrder } from "@/lib/curriculum";
import type { LevelId } from "@/lib/types";
import { UmlautBar } from "./umlaut-bar";

function blobToBase64(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read the recording."));
    reader.onload = () => {
      const result = String(reader.result || "");
      resolve(result.includes(",") ? result.split(",")[1] : result);
    };
    reader.readAsDataURL(blob);
  });
}

function formatDuration(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function preferredMimeType() {
  if (typeof MediaRecorder === "undefined") return "";
  const candidates = ["audio/webm;codecs=opus", "audio/webm", "audio/ogg;codecs=opus", "audio/mp4"];
  return candidates.find((type) => MediaRecorder.isTypeSupported(type)) || "";
}

export function SpeakingStudio() {
  const [level, setLevel] = useState<LevelId>("A1");
  const [moduleIndex, setModuleIndex] = useState(0);
  const [transcript, setTranscript] = useState("");
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");
  const [listening, setListening] = useState(false);
  const [loading, setLoading] = useState<"transcript" | "audio" | "">("");
  const [recording, setRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [audioData, setAudioData] = useState("");
  const [audioMime, setAudioMime] = useState("");
  const [audioUrl, setAudioUrl] = useState("");
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const stopTimerRef = useRef<number | null>(null);
  const timerIntervalRef = useRef<number | null>(null);
  const transcriptRef = useRef<HTMLTextAreaElement | null>(null);

  const modules = useMemo(() => courseModules.filter((module) => module.level === level), [level]);
  const module = modules[moduleIndex % Math.max(1, modules.length)];

  function resetAttempt() {
    setTranscript("");
    setFeedback("");
    setError("");
    setAudioData("");
    setAudioMime("");
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl("");
    setRecordingSeconds(0);
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    timerIntervalRef.current = null;
  }

  function startRecognition() {
    if (typeof window === "undefined") return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError("Live speech recognition is not available in this browser. Use recording instead or type a transcript.");
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
    recognition.onerror = () => {
      setListening(false);
      setError("Speech recognition stopped with an error. Recording still works independently.");
    };
    recognition.onend = () => setListening(false);
    recognition.start();
    setListening(true);
  }

  async function startRecording() {
    if (typeof window === "undefined" || !navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setError("Audio recording is not available in this browser.");
      return;
    }

    try {
      setError("");
      setFeedback("");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      chunksRef.current = [];
      const mime = preferredMimeType();
      const recorder = new MediaRecorder(stream, { ...(mime ? { mimeType: mime } : {}), audioBitsPerSecond: 32000 });
      recorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size) chunksRef.current.push(event.data);
      };

      recorder.onstop = async () => {
        const type = recorder.mimeType || mime || "audio/webm";
        const blob = new Blob(chunksRef.current, { type });
        stream.getTracks().forEach((track) => track.stop());
        setRecording(false);
        if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
        if (stopTimerRef.current) window.clearTimeout(stopTimerRef.current);
        stopTimerRef.current = null;

        if (blob.size > 1_000_000) {
          setError("That recording is too large. Keep the next attempt under 90 seconds.");
          return;
        }

        try {
          const base64 = await blobToBase64(blob);
          setAudioData(base64);
          setAudioMime(type);
          if (audioUrl) URL.revokeObjectURL(audioUrl);
          setAudioUrl(URL.createObjectURL(blob));
        } catch (err) {
          setError(err instanceof Error ? err.message : "Could not prepare the recording.");
        }
      };

      recorder.start(500);
      setRecording(true);
      setRecordingSeconds(0);
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = window.setInterval(() => {
        setRecordingSeconds((s) => s + 1);
      }, 1000);
      stopTimerRef.current = window.setTimeout(() => {
        if (recorderRef.current?.state === "recording") recorderRef.current.stop();
      }, 90_000);
    } catch {
      setError("Microphone access was not available. Check browser permissions and try again.");
    }
  }

  function stopRecording() {
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
  }

  function insertTranscriptChar(char: string) {
    const el = transcriptRef.current;
    if (!el) {
      setTranscript((prev) => prev + char);
      return;
    }
    const start = el.selectionStart ?? transcript.length;
    const end = el.selectionEnd ?? transcript.length;
    const next = transcript.slice(0, start) + char + transcript.slice(end);
    setTranscript(next);
    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + char.length, start + char.length);
    }, 0);
  }

  async function requestFeedback(mode: "speaking_feedback" | "speaking_audio_feedback") {
    if (!module) return;
    if (mode === "speaking_feedback" && transcript.trim().length < 10) return;
    if (mode === "speaking_audio_feedback" && !audioData) return;

    setLoading(mode === "speaking_audio_feedback" ? "audio" : "transcript");
    setError("");
    setFeedback("");

    try {
      const context = [
        module.speakingTask,
        transcript.trim() ? "Optional transcript: " + transcript.trim() : "",
      ].filter(Boolean).join("\n\n");

      const response = await fetch("/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          mode === "speaking_audio_feedback"
            ? { mode, level, context, audio: audioData, mimeType: audioMime }
            : { mode, level, text: transcript, context: module.speakingTask },
        ),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Speaking feedback failed.");
      setFeedback(data.reply);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Speaking feedback failed.");
    } finally {
      setLoading("");
    }
  }

  function submitTranscript(event: FormEvent) {
    event.preventDefault();
    void requestFeedback("speaking_feedback");
  }

  return (
    <div className="dm-speaking-studio">
      <div className="dm-speaking-topbar">
        <div>
          <span className="dm-speaking-chip">Speaking Practice</span>
          <h1>{module?.title ?? "Speaking Practice"}</h1>
          <p>{module?.scenario ?? "Practise speaking naturally in German with active audio feedback."}</p>
        </div>
        <div className="segmented">
          {levelOrder.map((item) => (
            <button
              type="button"
              key={item}
              className={level === item ? "active" : ""}
              onClick={() => { setLevel(item); setModuleIndex(0); resetAttempt(); }}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      {module && (
        <form className="dm-speaking-card card" onSubmit={submitTranscript}>
          <div className="dm-speaking-prompt">
            <span>▣</span>
            <div>
              <small>Your prompt · Module {module.index} of 10</small>
              <strong>{module.speakingTask}</strong>
              <p>Use detail, connectors and the useful language below. Speak naturally instead of reading a script.</p>
            </div>
          </div>

          <div className="dm-record-panel">
            {!recording ? (
              <button type="button" className="dm-record-button" onClick={startRecording} aria-label="Start recording">●</button>
            ) : (
              <button type="button" className="dm-record-button recording" onClick={stopRecording} aria-label="Stop recording">■</button>
            )}
            <div className="dm-waveform" aria-hidden="true">
              {Array.from({ length: 17 }).map((_, index) => <i key={index} />)}
            </div>
            <div className="dm-record-meta">
              {recording && <span className="recording-badge pulse">REC {formatDuration(recordingSeconds)} / 01:30</span>}
              {audioUrl ? (
                <audio controls src={audioUrl} />
              ) : (
                <span className="dm-record-status">
                  {recording ? (recordingSeconds > 75 ? "Approaching 90s limit…" : "Recording in progress…") : "Ready when you are"}
                </span>
              )}
            </div>
          </div>

          {audioData && (
            <button
              type="button"
              className="button primary dm-analyse-button"
              onClick={() => void requestFeedback("speaking_audio_feedback")}
              disabled={loading !== ""}
            >
              {loading === "audio" ? "Listening closely…" : "Get AI feedback on this recording"}
            </button>
          )}

          {error && <p className="ai-error">{error}</p>}

          {feedback && (
            <section className="dm-speaking-feedback" aria-live="polite">
              <div className="dm-feedback-title">
                <span>✓</span>
                <div><small>AI Feedback</small><strong>Your response analysed</strong></div>
                <em>{level} practice</em>
              </div>
              <pre>{feedback}</pre>
            </section>
          )}

          <div className="dm-speaking-support">
            <article><small>Grammar focus</small><strong>{module.grammarFocus.slice(0, 2).join(" · ")}</strong></article>
            <article><small>Useful phrases</small><strong>{module.chunks.slice(0, 2).join(" · ")}</strong></article>
            <article><small>Go further</small><strong>{module.writingTask}</strong></article>
          </div>

          <details className="dm-transcript-details">
            <summary>Transcript fallback</summary>
            <p>Use this if your browser can transcribe German, or type what you said manually.</p>
            <div className="speaking-actions">
              <button type="button" className="button secondary" onClick={startRecognition} disabled={listening}>
                {listening ? "Listening…" : "Start German speech recognition"}
              </button>
              <button type="button" className="button secondary" onClick={resetAttempt}>Clear attempt</button>
            </div>
            <textarea
              ref={transcriptRef}
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              rows={7}
              placeholder="Optional transcript…"
            />
            <UmlautBar onInsert={insertTranscriptChar} />
            <button className="button secondary" type="submit" disabled={loading !== "" || transcript.trim().length < 10}>
              {loading === "transcript" ? "Analysing…" : "Analyse transcript only"}
            </button>
          </details>

          <label className="dm-task-picker">
            <span>Choose another task</span>
            <select value={moduleIndex} onChange={(e) => { setModuleIndex(Number(e.target.value)); resetAttempt(); }}>
              {modules.map((item, index) => <option key={item.slug} value={index}>{index + 1}. {item.title}</option>)}
            </select>
          </label>
        </form>
      )}

    </div>
  );
}
