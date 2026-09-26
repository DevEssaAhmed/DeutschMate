"use client";

import { useState } from "react";
import { speakGerman } from "@/lib/speech";

export function SpeakButton({ text, compact = false }: { text: string; compact?: boolean }) {
  const [playing, setPlaying] = useState(false);

  function speak() {
    speakGerman(text, {
      rate: 0.86,
      onStart: () => setPlaying(true),
      onEnd: () => setPlaying(false),
      onError: () => setPlaying(false),
    });
  }

  return (
    <button
      className={`speak-button ${compact ? "compact" : ""} ${playing ? "playing" : ""}`.trim()}
      onClick={speak}
      type="button"
      aria-label={`Pronounce ${text}`}
      aria-pressed={playing}
    >
      <span aria-hidden>{playing ? "🔊" : "🔈"}</span>
      {compact ? "" : playing ? " Playing…" : " Listen"}
    </button>
  );
}
