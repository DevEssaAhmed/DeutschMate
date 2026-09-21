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
          <span className="eyebrow">GUIDED EXPLANATION</span>
          <h1>Your German tutor, when the textbook is not enough.</h1>
          <p>
            Ask about grammar, sentence structure, vocabulary, register or a confusing example.
            DeutschMate explains the underlying German instead of simply giving you an answer.
          </p>
        </header>
        <AiTutor />
      </div>
    </main>
  );
}
