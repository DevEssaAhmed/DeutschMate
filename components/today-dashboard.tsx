"use client";

import Link from "next/link";
import { courseLessons, courseModules, levelOrder } from "@/lib/curriculum";
import { useProgress } from "./progress-provider";

export function TodayDashboard() {
  const progress = useProgress();
  const completed = new Set(progress.completedLessons);
  const last = courseLessons.find((lesson) => lesson.id === progress.lastLessonId);
  const nextLesson = last && !completed.has(last.id)
    ? last
    : courseLessons.find((lesson) => !completed.has(lesson.id)) ?? courseLessons[0];
  const module = courseModules.find((item) => item.slug === nextLesson.moduleSlug && item.level === nextLesson.level);
  const moduleDone = module?.lessons.filter((lesson) => completed.has(lesson.id)).length ?? 0;
  const levelIndex = Math.max(0, levelOrder.indexOf(nextLesson.level));

  return (
    <main className="dm-home">
      <section className="shell dm-home-shell">
        <div className="dm-hero-scene">
          <div className="dm-hero-copy">
            <span className="dm-greeting">Guten Tag, Essa!</span>
            <h1>Pick up where you left off.</h1>
            <p>Small steps. Real progress. A more confident you.</p>
          </div>
          <div className="dm-landscape" aria-hidden="true">
            <span className="hill hill-one" />
            <span className="hill hill-two" />
            <span className="tower tower-one" />
            <span className="tower tower-two" />
          </div>
        </div>

        <Link
          className="dm-current-lesson card"
          href={"/learn/" + nextLesson.level.toLowerCase() + "/" + nextLesson.moduleSlug + "/" + nextLesson.slug}
        >
          <div className="dm-current-copy">
            <div className="dm-current-meta">
              <span className={"mini-level level-" + nextLesson.level.toLowerCase()}>{nextLesson.level}</span>
              <span>Module {nextLesson.moduleIndex} · {module?.title ?? "German course"}</span>
            </div>
            <h2>{nextLesson.title}</h2>
            <p>{nextLesson.scenario}</p>
            <span className="button primary">Continue lesson →</span>
            <div className="dm-lesson-progress">
              <div className="bar"><i style={{ width: Math.round((moduleDone / 6) * 100) + "%" }} /></div>
              <small>{moduleDone} / 6 activities</small>
            </div>
          </div>
          <div className="dm-current-art" aria-hidden="true">
            <div className="dm-cafe-window" />
            <div className="dm-cafe-board">Gute<br />Gespräche<br />bessere<br />Tage.</div>
            <div className="dm-cup" />
          </div>
        </Link>

        <div className="dm-section-heading">
          <h2>Build your skills</h2>
          <Link href="/practice">All practice →</Link>
        </div>

        <div className="dm-skill-grid">
          <Link href="/reading" className="dm-skill-card card">
            <span className="dm-skill-icon reading">▤</span>
            <strong>Reading</strong>
            <small>Build vocabulary and comprehension</small>
          </Link>
          <Link href="/listening" className="dm-skill-card card">
            <span className="dm-skill-icon listening">◖</span>
            <strong>Listening</strong>
            <small>Train your ear for real German</small>
          </Link>
          <Link href="/speaking" className="dm-skill-card card">
            <span className="dm-skill-icon speaking">●</span>
            <strong>Speaking</strong>
            <small>Gain confidence in conversation</small>
          </Link>
          <Link href="/writing" className="dm-skill-card card">
            <span className="dm-skill-icon writing">✎</span>
            <strong>Writing</strong>
            <small>Express your ideas more clearly</small>
          </Link>
        </div>

        <section className="dm-journey card">
          <div className="dm-journey-copy">
            <span className="eyebrow">YOUR GERMAN JOURNEY</span>
            <div className="dm-level-track">
              {levelOrder.map((level, index) => (
                <div key={level} className={index < levelIndex ? "done" : index === levelIndex ? "current" : ""}>
                  <i />
                  <span>{level}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="dm-momentum">
            <strong>You&apos;re on track!</strong>
            <p>Keep going. You&apos;re building real momentum.</p>
            <div className="dm-momentum-stats">
              <span><b>{progress.streak}</b> day streak</span>
              <span><b>{progress.percent}%</b> course evidence</span>
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}
