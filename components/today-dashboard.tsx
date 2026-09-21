"use client";

import Link from "next/link";
import { courseLessons, courseModules } from "@/lib/curriculum";
import { useProgress } from "./progress-provider";

export function TodayDashboard() {
  const progress = useProgress();
  const completed = new Set(progress.completedLessons);
  const last = courseLessons.find((lesson) => lesson.id === progress.lastLessonId);
  const nextLesson = last && !completed.has(last.id) ? last : courseLessons.find((lesson) => !completed.has(lesson.id)) ?? courseLessons[0];
  const module = courseModules.find((item) => item.slug === nextLesson.moduleSlug && item.level === nextLesson.level);
  const moduleDone = module?.lessons.filter((lesson) => completed.has(lesson.id)).length ?? 0;

  return (
    <main className="app-home">
      <section className="shell home-learning">
        <div className="home-greeting">
          <span className="eyebrow">YOUR GERMAN COURSE</span>
          <h1>Pick up where you left off.</h1>
          <p>One focused lesson. Immediate feedback. Real reading, listening, writing and speaking.</p>
        </div>

        <Link className="continue-course card" href={"/learn/" + nextLesson.level.toLowerCase() + "/" + nextLesson.moduleSlug + "/" + nextLesson.slug}>
          <div className="continue-top">
            <span className={"level-badge level-" + nextLesson.level.toLowerCase()}>{nextLesson.level}</span>
            <span>Module {nextLesson.moduleIndex} · {moduleDone}/6 lessons</span>
          </div>
          <div className="continue-body">
            <div>
              <small>Continue learning</small>
              <h2>{module?.title}</h2>
              <p>{nextLesson.title}</p>
            </div>
            <span className="continue-arrow">→</span>
          </div>
          <div className="module-progress"><i style={{ width: Math.round((moduleDone / 6) * 100) + "%" }} /></div>
        </Link>

        <div className="home-row">
          <section className="home-practice card">
            <div><span className="eyebrow">PRACTICE</span><h2>What should you work on?</h2></div>
            <div className="practice-shortcuts">
              <Link href="/practice"><span>↻</span><div><strong>{progress.dueReviews || "Review"}</strong><small>Vocabulary due</small></div></Link>
              <Link href="/speaking"><span>◉</span><div><strong>Speak</strong><small>Record + AI feedback</small></div></Link>
              <Link href="/writing"><span>✎</span><div><strong>Write</strong><small>Get direct corrections</small></div></Link>
              <Link href="/listening"><span>▶</span><div><strong>Listen</strong><small>Natural German audio</small></div></Link>
            </div>
          </section>

          <aside className="home-progress card">
            <span className="eyebrow">YOUR MOMENTUM</span>
            <div className="momentum-number">{progress.streak}<small>day streak</small></div>
            <div className="momentum-grid">
              <div><strong>{progress.percent}%</strong><span>course evidence</span></div>
              <div><strong>{progress.completedLessons.length}</strong><span>lessons completed</span></div>
            </div>
            <Link href="/progress" className="text-link">See CEFR competency profile →</Link>
          </aside>
        </div>
      </section>
    </main>
  );
}
