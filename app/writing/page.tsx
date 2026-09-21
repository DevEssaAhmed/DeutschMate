import type { Metadata } from "next";
import { WritingStudio } from "@/components/writing-studio";

export const metadata: Metadata = {
  title: "Writing Studio",
  description: "Write German and receive CEFR-aware teacher feedback.",
};

export default function WritingPage() {
  return (
    <main className="page-shell">
      <div className="shell">
        <header className="page-hero">
          <span className="eyebrow">PRODUCTION PRACTICE</span>
          <h1>Learn to write German, not just recognize it.</h1>
          <p>
            Work from a real task, write your own response, then receive targeted feedback that
            preserves your ideas and shows you what to improve next.
          </p>
        </header>
        <WritingStudio />
      </div>
    </main>
  );
}
