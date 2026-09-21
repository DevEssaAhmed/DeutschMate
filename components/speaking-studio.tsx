"use client";

import { FormEvent, useMemo, useRef, useState } from "react";
import { courseModules, levelOrder } from "@/lib/curriculum";
import type { LevelId } from "@/lib/types";

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
  const [audioData, setAudioData] = useState("");
  const [audioMime, setAudioMime] = useState("");
  const [audioUrl, setAudioUrl] = useState("");
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const stopTimerRef = useRef<number | null>(null);

  const modules = useMemo(() => courseModules.filter((module) => module.level === level), [level]);
  const module = modules[moduleIndex % Math.max(1, modules.length)];

  function resetAttempt() {
    setTranscript(""); setFeedback(""); setError(""); setAudioData(""); setAudioMime("");
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl("");
  }

  function startRecognition() {
    if (typeof window === "undefined") return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError("Live speech recognition is not available in this browser. Use the recording option instead or type a transcript below.");
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
    recognition.onerror = () => { setListening(false); setError("Speech recognition stopped with an error. The recording option still works independently."); };
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
      setError(""); setFeedback("");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      chunksRef.current = [];
      const mime = preferredMimeType();
      const recorder = new MediaRecorder(stream, { ...(mime ? { mimeType: mime } : {}), audioBitsPerSecond: 32000 });
      recorderRef.current = recorder;
      recorder.ondataavailable = (event) => { if (event.data.size) chunksRef.current.push(event.data); };
      recorder.onstop = async () => {
        const type = recorder.mimeType || mime || "audio/webm";
        const blob = new Blob(chunksRef.current, { type });
        stream.getTracks().forEach((track) => track.stop());
        setRecording(false);
        if (stopTimerRef.current) window.clearTimeout(stopTimerRef.current);
        stopTimerRef.current = null;
        if (blob.size > 1_000_000) {
          setError("That recording is too large for inline analysis. Keep the next attempt under 90 seconds.");
          return;
        }
        try {
          const base64 = await blobToBase64(blob);
          setAudioData(base64); setAudioMime(type);
          if (audioUrl) URL.revokeObjectURL(audioUrl);
          setAudioUrl(URL.createObjectURL(blob));
        } catch (err) {
          setError(err instanceof Error ? err.message : "Could not prepare the recording.");
        }
      };
      recorder.start(500);
      setRecording(true);
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

  async function requestFeedback(mode: "speaking_feedback" | "speaking_audio_feedback") {
    if (!module) return;
    if (mode === "speaking_feedback" && transcript.trim().length < 10) return;
    if (mode === "speaking_audio_feedback" && !audioData) return;
    setLoading(mode === "speaking_audio_feedback" ? "audio" : "transcript");
    setError(""); setFeedback("");
    try {
      const context = [module.speakingTask, transcript.trim() ? "Optional transcript: " + transcript.trim() : ""].filter(Boolean).join("\n\n");
      const response = await fetch("/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(mode === "speaking_audio_feedback"
          ? { mode, level, context, audio: audioData, mimeType: audioMime }
          : { mode, level, text: transcript, context: module.speakingTask }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Speaking feedback failed.");
      setFeedback(data.reply);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Speaking feedback failed.");
    } finally { setLoading(""); }
  }

  function submitTranscript(event: FormEvent) {
    event.preventDefault();
    void requestFeedback("speaking_feedback");
  }

  return (
    <div className="speaking-studio">
      <div className="lab-toolbar card">
        <div><span className="eyebrow">SPEAKING CURRICULUM</span><strong>Plan briefly, then speak without reading a script.</strong></div>
        <div className="segmented">{levelOrder.map((item) => <button type="button" key={item} className={level === item ? "active" : ""} onClick={() => { setLevel(item); setModuleIndex(0); resetAttempt(); }}>{item}</button>)}</div>
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
            <select value={moduleIndex} onChange={(e) => { setModuleIndex(Number(e.target.value)); resetAttempt(); }}>
              {modules.map((item, index) => <option key={item.slug} value={index}>{index + 1}. {item.title}</option>)}
            </select>
          </label>
        </aside>

        <form className="speaking-work card" onSubmit={submitTranscript}>
          <span className="eyebrow">YOUR ATTEMPT</span>
          <h2>Speak first. Analyse second.</h2>
          <div className="audio-practice card">
            <div><strong>Record the real attempt</strong><small>Up to 90 seconds. Audio analysis can evaluate intelligibility, rhythm and pronunciation.</small></div>
            <div className="speaking-actions">
              {!recording
                ? <button type="button" className="button primary" onClick={startRecording}>● Start recording</button>
                : <button type="button" className="button secondary" onClick={stopRecording}>■ Stop recording</button>}
              {audioUrl && <audio controls src={audioUrl} />}
            </div>
            {audioData && <button type="button" className="button primary" onClick={() => void requestFeedback("speaking_audio_feedback")} disabled={loading !== ""}>{loading === "audio" ? "Listening closely…" : "Analyse this recording"}</button>}
          </div>

          <div className="speaking-transcript-option"><strong>Transcript fallback / second view</strong><p>Transcript feedback covers language and organisation. Use audio analysis when you want pronunciation and rhythm feedback.</p></div>
          <div className="speaking-actions">
            <button type="button" className="button secondary" onClick={startRecognition} disabled={listening}>{listening ? "Listening…" : "Start German speech recognition"}</button>
            <button type="button" className="button secondary" onClick={resetAttempt}>Clear attempt</button>
          </div>
          <textarea value={transcript} onChange={(e) => setTranscript(e.target.value)} rows={10} placeholder="Optional transcript appears here. You can also type one manually." />
          <button className="button secondary" type="submit" disabled={loading !== "" || transcript.trim().length < 10}>{loading === "transcript" ? "Analysing transcript…" : "Analyse transcript only"}</button>
          {error && <p className="ai-error">{error}</p>}
          {feedback && <pre className="speaking-feedback">{feedback}</pre>}
        </form>
      </div>}
    </div>
  );
}
