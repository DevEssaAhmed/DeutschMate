"use client";

import Link from "next/link";
import { allRichVocabulary, courseLessons, courseModules, curriculumStats } from "@/lib/curriculum";
import { useProgress } from "./progress-provider";

export function TodayDashboard() {
  const progress = useProgress();
  const completed = new Set(progress.completedLessons);
  const last = courseLessons.find((lesson) => lesson.id === progress.lastLessonId);
  const nextLesson = last ?? courseLessons.find((lesson) => !completed.has(lesson.id)) ?? courseLessons[0];
  const module = courseModules.find((item) => item.slug === nextLesson.moduleSlug && item.level === nextLesson.level);
  const levelLessons = courseLessons.filter((lesson) => lesson.level === nextLesson.level);
  const levelDone = levelLessons.filter((lesson) => completed.has(lesson.id)).length;
  const vocabReviewed = Object.keys(progress.review).length;

  return (
    <main className="today-page">
      <section className="today-hero">
        <div className="shell today-grid">
          <div>
            <span className="eyebrow">TODAY IN DEUTSCHMATE</span>
            <h1>Build German you can actually use.</h1>
            <p>Continue the course, review what is becoming weak, and produce German in writing or speech. No XP loop—your evidence is what you can understand and do.</p>
            <div className="hero-actions">
              <Link className="button primary large" href={"/learn/" + nextLesson.level.toLowerCase() + "/" + nextLesson.moduleSlug + "/" + nextLesson.slug}>Continue lesson</Link>
              <Link className="button secondary large" href="/practice">Review vocabulary</Link>
            </div>
          </div>

          <aside className="today-focus card">
            <span className={"level-badge level-" + nextLesson.level.toLowerCase()}>{nextLesson.level}</span>
            <span className="eyebrow">CURRENT FOCUS</span>
            <h2>{module?.title}</h2>
            <p>{nextLesson.title}</p>
            <div className="today-meta"><span>{nextLesson.durationMinutes} min</span><span>{nextLesson.stage}</span></div>
            <div className="bar"><i style={{ width: Math.round((levelDone / levelLessons.length) * 100) + "%" }} /></div>
            <small>{levelDone}/{levelLessons.length} lessons evidenced at {nextLesson.level}</small>
          </aside>
        </div>
      </section>

      <section className="shell today-stats">
        <article className="stat-card card"><span>Course evidence</span><strong>{progress.percent}%</strong><small>{progress.completedLessons.length}/{curriculumStats.lessons} lessons</small></article>
        <article className="stat-card card"><span>Study streak</span><strong>{progress.streak}</strong><small>consecutive study days</small></article>
        <article className="stat-card card"><span>Due review</span><strong>{progress.dueReviews}</strong><small>{vocabReviewed} terms in your review history</small></article>
        <article className="stat-card card"><span>Course scale</span><strong>{curriculumStats.modules}</strong><small>modules · {allRichVocabulary.length} vocabulary entries</small></article>
      </section>

      <section className="shell today-plan">
        <div className="section-intro"><span className="eyebrow">A SERIOUS DAILY LOOP</span><h2>Input, analysis, production, review.</h2><p>Use these as a balanced study block. You do not have to finish all four every day.</p></div>
        <div className="today-plan-grid">
          <Link className="study-card card" href={"/learn/" + nextLesson.level.toLowerCase() + "/" + nextLesson.moduleSlug + "/" + nextLesson.slug}><span>01</span><h3>Course lesson</h3><p>Continue the structured module sequence.</p></Link>
          <Link className="study-card card" href="/reading"><span>02</span><h3>Read or listen</h3><p>Work with connected German and delay the transcript.</p></Link>
          <Link className="study-card card" href="/writing"><span>03</span><h3>Produce German</h3><p>Write from a real task, then use teacher feedback.</p></Link>
          <Link className="study-card card" href="/practice"><span>04</span><h3>Review weak language</h3><p>Rate recall and schedule the next review automatically.</p></Link>
        </div>
      </section>
    </main>
  );
}
