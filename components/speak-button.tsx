"use client";

export function SpeakButton({ text, compact = false }: { text: string; compact?: boolean }) {
  function speak() {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "de-DE";
    utterance.rate = 0.86;
    window.speechSynthesis.speak(utterance);
  }

  return (
    <button className={compact ? "speak-button compact" : "speak-button"} onClick={speak} type="button" aria-label={`Pronounce ${text}`}>
      <span aria-hidden>🔊</span>{compact ? "" : " Listen"}
    </button>
  );
}
