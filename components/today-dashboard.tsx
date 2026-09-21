"use client";

import Link from "next/link";
import { courseLessons, courseModules, levelOrder } from "@/lib/curriculum";
import { useProgress } from "./progress-provider";

const stageNames: Record<string, string> = {
  input: "Context",
  grammar: "Grammar",
  lexis: "Vocabulary",
  reception: "Reading & listening",
  production: "Production",
  review: "Review",
};

export function TodayDashboard() {
  const progress = useProgress();
  const completed = new Set(progress.completedLessons);
  const last = courseLessons.find((lesson) => lesson.id === progress.lastLessonId);
  const nextLesson = last && !completed.has(last.id)
    ? last
    : courseLessons.find((lesson) => !completed.has(lesson.id)) ?? courseLessons[0];
  const module = courseModules.find((item) => item.slug === nextLesson.moduleSlug && item.level === nextLesson.level)!;
  const moduleDone = module.lessons.filter((lesson) => completed.has(lesson.id)).length;
  const levelLessons = courseLessons.filter((lesson) => lesson.level === nextLesson.level);
  const levelDone = levelLessons.filter((lesson) => completed.has(lesson.id)).length;
  const levelPct = Math.round((levelDone / levelLessons.length) * 100);
  const levelIndex = levelOrder.indexOf(nextLesson.level);
  const nextLevel = levelOrder[Math.min(levelOrder.length - 1, levelIndex + 1)];

  return (
    <main className="dashboard-page">
      <div className="dashboard-header">
        <div>
          <span className="page-kicker">TODAY</span>
          <h1>Keep your German moving.</h1>
          <p>One focused lesson, one useful review, one act of production.</p>
        </div>
        <Link href="/tutor" className="quiet-action">Ask AI tutor <span>✦</span></Link>
      </div>

      <div className="dashboard-grid">
        <section className="dashboard-main">
          <article className="resume-card">
            <div className="resume-topline">
              <div>
                <span className={"level-dot level-" + nextLesson.level.toLowerCase()}>{nextLesson.level}</span>
                <span>Module {nextLesson.moduleIndex} of 10</span>
                <span>{stageNames[nextLesson.stage]}</span>
              </div>
              <span>{nextLesson.durationMinutes} min</span>
            </div>

            <div className="resume-content">
              <span className="page-kicker">CONTINUE COURSE</span>
              <h2>{module.title}</h2>
              <p className="resume-lesson">{nextLesson.title}</p>
              <p>{nextLesson.scenario}</p>
              <Link className="button primary large" href={"/learn/" + nextLesson.level.toLowerCase() + "/" + nextLesson.moduleSlug + "/" + nextLesson.slug}>
                Continue lesson <span>→</span>
              </Link>
            </div>

            <div className="resume-progress">
              <div><span>Module progress</span><strong>{moduleDone}/6</strong></div>
              <div className="bar"><i style={{ width: Math.round((moduleDone / 6) * 100) + "%" }} /></div>
            </div>
          </article>

          <section className="today-plan">
            <div className="section-title-row">
              <div><span className="page-kicker">TODAY'S PLAN</span><h2>Three useful moves</h2></div>
              <span className="plan-total">≈ {Math.max(25, nextLesson.durationMinutes + 15)} min</span>
            </div>

            <div className="plan-grid">
              <Link href="/practice" className="plan-card">
                <span className="plan-icon review">↻</span>
                <div><small>Spaced review</small><strong>{progress.dueReviews ? progress.dueReviews + " words due" : "Keep vocabulary fresh"}</strong><p>Recall first. Reveal second.</p></div>
                <b>10 min</b>
              </Link>
              <Link href="/speaking" className="plan-card">
                <span className="plan-icon speak">●</span>
                <div><small>Production</small><strong>Speak without a script</strong><p>Record and get direct AI feedback.</p></div>
                <b>10 min</b>
              </Link>
              <Link href="/reading" className="plan-card">
                <span className="plan-icon read">R</span>
                <div><small>Input</small><strong>Read one connected text</strong><p>Train gist, detail and inference.</p></div>
                <b>10 min</b>
              </Link>
            </div>
          </section>

          <section className="skill-launcher">
            <div className="section-title-row">
              <div><span className="page-kicker">SKILL LABS</span><h2>Practise by skill</h2></div>
            </div>
            <div className="skill-launcher-grid">
              {[
                { href: "/reading", label: "Reading", detail: "Connected texts", icon: "R" },
                { href: "/listening", label: "Listening", detail: "Audio + dictation", icon: "L" },
                { href: "/speaking", label: "Speaking", detail: "Record + feedback", icon: "S" },
                { href: "/writing", label: "Writing", detail: "Draft + correction", icon: "W" },
              ].map((item) => (
                <Link href={item.href} className="skill-launch" key={item.href}>
                  <span>{item.icon}</span><div><strong>{item.label}</strong><small>{item.detail}</small></div><b>→</b>
                </Link>
              ))}
            </div>
          </section>
        </section>

        <aside className="dashboard-aside">
          <section className="status-card card">
            <span className="page-kicker">CURRENT LEVEL</span>
            <div className="level-summary">
              <strong>{nextLesson.level}</strong>
              <div><b>{levelPct}%</b><span>course evidence</span></div>
            </div>
            <div className="bar large"><i style={{ width: levelPct + "%" }} /></div>
            <p>{nextLevel === nextLesson.level ? "Advanced course stage" : "Building toward " + nextLevel}</p>
            <Link href="/progress">Open competency profile →</Link>
          </section>

          <section className="metric-stack">
            <article className="metric-card card"><span>Streak</span><strong>{progress.streak}</strong><small>days studied</small></article>
            <article className="metric-card card"><span>Completed</span><strong>{progress.completedLessons.length}</strong><small>lessons</small></article>
            <article className="metric-card card"><span>Assessments</span><strong>{Object.keys(progress.assessments).length}</strong><small>of 5 attempted</small></article>
          </section>

          <section className="quick-links card">
            <span className="page-kicker">QUICK ACCESS</span>
            <Link href="/grammar"><span>G</span><div><strong>Grammar reference</strong><small>Rules, examples, production</small></div><b>→</b></Link>
            <Link href="/vocabulary"><span>V</span><div><strong>Vocabulary library</strong><small>Chunks, forms, deep dives</small></div><b>→</b></Link>
            <Link href="/assessments"><span>✓</span><div><strong>Level assessment</strong><small>Integrated checkpoint</small></div><b>→</b></Link>
          </section>
        </aside>
      </div>
    </main>
  );
}
