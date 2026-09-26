"use client";

let cachedVoices: SpeechSynthesisVoice[] = [];

function getGermanVoices(): SpeechSynthesisVoice[] {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return [];
  if (cachedVoices.length > 0) return cachedVoices;

  const voices = window.speechSynthesis.getVoices();
  const german = voices.filter((v) => {
    const lang = v.lang.toLowerCase().replace("_", "-");
    return lang.startsWith("de");
  });

  if (german.length > 0) {
    cachedVoices = german;
  }
  return german;
}

if (typeof window !== "undefined" && "speechSynthesis" in window) {
  window.speechSynthesis.onvoiceschanged = () => {
    cachedVoices = [];
    getGermanVoices();
  };
}

/**
 * Select the best available German voice.
 * Prioritizes natural/online German voices (e.g. Google, Microsoft, Apple) over generic fallbacks.
 */
export function getBestGermanVoice(): SpeechSynthesisVoice | null {
  const voices = getGermanVoices();
  if (!voices.length) return null;

  // Prioritize premium/natural voices if available
  const preferred = voices.find(
    (v) =>
      /natural|premium|online|google|microsoft|katja|stefan|marlene|anna|yannick/i.test(v.name) &&
      v.lang.toLowerCase().startsWith("de")
  );
  if (preferred) return preferred;

  // Fallback to exact de-DE match
  const deDE = voices.find((v) => v.lang.toLowerCase().replace("_", "-") === "de-de");
  if (deDE) return deDE;

  return voices[0];
}

/**
 * Speak German text with speech synthesis, picking the best German voice.
 */
export function speakGerman(
  text: string,
  options?: {
    rate?: number;
    pitch?: number;
    onStart?: () => void;
    onEnd?: () => void;
    onError?: () => void;
  }
): SpeechSynthesisUtterance | null {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return null;

  window.speechSynthesis.cancel();
  const clean = text.replace(/^[A-ZÄÖÜ]:\s*/gm, "").trim();
  if (!clean) return null;

  const utterance = new SpeechSynthesisUtterance(clean);
  utterance.lang = "de-DE";
  utterance.rate = options?.rate ?? 0.88;
  if (options?.pitch) utterance.pitch = options.pitch;

  const voice = getBestGermanVoice();
  if (voice) {
    utterance.voice = voice;
  }

  if (options?.onStart) utterance.onstart = options.onStart;
  if (options?.onEnd) utterance.onend = options.onEnd;
  if (options?.onError) utterance.onerror = options.onError;

  window.speechSynthesis.speak(utterance);
  return utterance;
}

export function stopSpeaking() {
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
}
