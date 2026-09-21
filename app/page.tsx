import Link from "next/link";
import { courseData, levelOrder } from "@/lib/course";
import { ProgressSummary } from "@/components/progress-summary";

export default function HomePage() {
  return (
    <main>
      <section className="hero-section">
        <div className="shell hero-grid">
          <div className="hero-copy">
            <span className="eyebrow">GERMAN FROM ABSOLUTE BEGINNER TO C1</span>
            <h1>Build real German,<br/><em>one system at a time.</em></h1>
            <p>DeutschMate combines a structured CEFR path with vocabulary, grammar, pronunciation, quizzes, flashcards and active speaking/writing practice.</p>
            <div className="hero-actions"><Link className="button primary large" href="/learn">Start the course</Link><Link className="button secondary large" href="/practice">Practice now</Link></div>
            <div className="hero-proof"><span><strong>40</strong> structured units</span><span><strong>800</strong> vocabulary items</span><span><strong>80</strong> grammar topics</span><span><strong>200</strong> quiz questions</span></div>
          </div>
          <div className="hero-panel card">
            <span className="eyebrow">THE PATH</span>
            <div className="path-stack">
              {levelOrder.map((level, index) => <div className="path-row" key={level}><span className={`level-badge level-${level.toLowerCase()}`}>{level}</span><div><strong>{courseData.levels[level].goal}</strong><small>{courseData.units.filter((u) => u.level === level).length} units</small></div><span>{index < levelOrder.length - 1 ? "↓" : "✓"}</span></div>)}
            </div>
          </div>
        </div>
      </section>

      <section className="shell home-progress"><ProgressSummary /></section>

      <section className="shell feature-section">
        <div className="section-intro"><span className="eyebrow">HOW DEUTSCHMATE WORKS</span><h2>Learn, retrieve, produce, repeat.</h2><p>The platform is designed around active recall and deliberate output—not passive scrolling.</p></div>
        <div className="feature-grid">
          <article className="feature-card card"><span>01</span><h3>Structured lessons</h3><p>Every unit has explicit outcomes, grammar explanations, vocabulary and examples tied to a CEFR stage.</p></article>
          <article className="feature-card card"><span>02</span><h3>Pronunciation on demand</h3><p>Hear German words and example sentences using your device&apos;s German speech engine.</p></article>
          <article className="feature-card card"><span>03</span><h3>Active recall</h3><p>Flashcards and mixed quizzes draw from the full course instead of keeping knowledge trapped inside one lesson.</p></article>
          <article className="feature-card card"><span>04</span><h3>Output practice</h3><p>Speaking, writing, transformation and grammar tasks force you to create German—not just recognize it.</p></article>
          <article className="feature-card card"><span>05</span><h3>Progress that persists</h3><p>Unit completion, quiz attempts, daily goal and study streak are stored automatically in your browser.</p></article>
          <article className="feature-card card"><span>06</span><h3>Reference libraries</h3><p>Search all 800 vocabulary items and all 80 grammar topics across A1, A2, B1, B2 and C1.</p></article>
        </div>
      </section>
    </main>
  );
}
