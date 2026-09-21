"use client";

import Link from "next/link";
import type { CSSProperties } from "react";
import { courseData } from "@/lib/course";
import { useProgress } from "./progress-provider";

export function ProgressSummary() {
  const progress = useProgress();
  const last = courseData.units.find((unit) => unit.id === progress.lastUnitId) ?? courseData.units[0];

  return (
    <div className="progress-summary card">
      <div className="progress-ring" style={{ "--progress": `${progress.ready ? progress.percent : 0}%` } as CSSProperties}>
        <div><strong>{progress.ready ? `${progress.percent}%` : "—"}</strong><span>course</span></div>
      </div>
      <div className="progress-copy">
        <span className="eyebrow">YOUR PATH</span>
        <h3>{progress.completed.length} of {courseData.units.length} units complete</h3>
        <p><strong>{progress.streak} day streak</strong> · Daily target {progress.dailyGoal} min</p>
        <Link className="button primary" href={`/learn/${last.level.toLowerCase()}/${last.slug}`}>Continue: {last.level} · {last.title}</Link>
      </div>
    </div>
  );
}
