"use client";

import Link from "next/link";
import { courseData, getUnitsByLevel, levelOrder } from "@/lib/course";
import { useProgress } from "./progress-provider";

export function ProgressDashboard() {
  const progress = useProgress();
  const done = new Set(progress.completed);
  const latest = courseData.units.find((unit) => unit.id === progress.lastUnitId) ?? courseData.units[0];
  const attempts = Object.values(progress.quizResults).reduce((sum, result) => sum + result.attempts, 0);
  const totalBest = Object.values(progress.quizResults).reduce((sum, result) => sum + result.best, 0);
  const totalQuestions = Object.values(progress.quizResults).reduce((sum, result) => sum + result.total, 0);
  const accuracy = totalQuestions ? Math.round((totalBest / totalQuestions) * 100) : 0;

  return (
    <div className="progress-page">
      <div className="stats-grid">
        <article className="stat-card card"><span>Course completion</span><strong>{progress.ready ? `${progress.percent}%` : "—"}</strong><small>{progress.completed.length} / {courseData.units.length} units</small></article>
        <article className="stat-card card"><span>Study streak</span><strong>{progress.streak}</strong><small>consecutive days</small></article>
        <article className="stat-card card"><span>Quiz attempts</span><strong>{attempts}</strong><small>across all units</small></article>
        <article className="stat-card card"><span>Best-answer rate</span><strong>{accuracy}%</strong><small>from completed quiz attempts</small></article>
      </div>

      <section className="card progress-continue">
        <div><span className="eyebrow">PICK UP WHERE YOU LEFT OFF</span><h2>{latest.level} · {latest.title}</h2><p>{latest.goals.slice(0, 3).join(" · ")}</p></div>
        <Link className="button primary" href={`/learn/${latest.level.toLowerCase()}/${latest.slug}`}>Continue learning →</Link>
      </section>

      <section className="level-progress-list">
        {levelOrder.map((level) => {
          const units = getUnitsByLevel(level);
          const count = units.filter((unit) => done.has(unit.id)).length;
          const pct = Math.round((count / units.length) * 100);
          return <article className="card level-progress-row" key={level}><div className={`level-badge level-${level.toLowerCase()}`}>{level}</div><div className="level-progress-copy"><div><strong>{courseData.levels[level].goal}</strong><span>{count}/{units.length} complete</span></div><div className="bar"><i style={{ width: `${pct}%` }} /></div></div><strong>{pct}%</strong></article>;
        })}
      </section>

      <section className="card settings-card">
        <div><span className="eyebrow">STUDY SETTINGS</span><h2>Daily target</h2><p>Set a realistic daily focus target. Your progress remains stored in this browser.</p></div>
        <div className="goal-buttons">{[15,25,40,60].map((minutes) => <button className={progress.dailyGoal === minutes ? "active" : ""} key={minutes} onClick={() => progress.setDailyGoal(minutes)}>{minutes} min</button>)}</div>
        <button className="text-danger" onClick={() => { if (confirm("Reset all DeutschMate progress on this browser?")) progress.resetProgress(); }}>Reset local progress</button>
      </section>
    </div>
  );
}
