"use client";

import { useEffect, useState } from "react";
import { speakGerman, stopSpeaking } from "@/lib/speech";
import styles from "./foundation-course.module.css";

export function FoundationAudio({ text, label = "Listen" }: { text: string; label?: string }) {
  const [playing, setPlaying] = useState(false);
  const [error, setError] = useState(false);
  useEffect(() => () => stopSpeaking(), [text]);

  function play(rate: number) {
    setError(false);
    const utterance = speakGerman(text, {
      rate,
      onStart: () => setPlaying(true),
      onEnd: () => setPlaying(false),
      onError: () => { setPlaying(false); setError(true); },
    });
    if (!utterance) setError(true);
  }

  return <div className={styles.audio}>
    <div className={styles.audioButtons}>
      <button type="button" onClick={() => play(0.85)} aria-label={label}><span aria-hidden="true">♫</span> {playing ? "Play again" : label}</button>
      <button type="button" onClick={() => play(0.65)} aria-label={`${label} slowly`}>Slow</button>
    </div>
    {error && <small role="status">Audio is unavailable on this device. Use the written sound hints; you can still finish the lesson.</small>}
  </div>;
}
