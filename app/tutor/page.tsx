import type { Metadata } from "next";
import { AiTutor } from "@/components/ai-tutor";

export const metadata: Metadata = {
  title: "AI Tutor",
  description: "Ask focused German questions and get CEFR-aware explanations.",
};

export default function TutorPage() {
  return (
    <main className="page-shell">
      <div className="shell">
        <header className="page-hero">
          <span className="eyebrow">GEMINI TUTOR · A1 → C1</span>
          <h1>Practise German with a tutor at your level.</h1>
          <p>
            Ask about grammar, practise a conversation one turn at a time, or bring a sentence you want to improve.
            The tutor adapts its guidance as you grow from beginner to advanced German.
          </p>
        </header>
        <AiTutor />
      </div>
    </main>
  );
}
