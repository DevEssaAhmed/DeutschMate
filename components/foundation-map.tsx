"use client";

import Link from "next/link";
import { foundationLessons, foundationHref, nextFoundation } from "@/lib/foundations";
import { useProgress } from "./progress-provider";
import styles from "./foundation-course.module.css";

export function FoundationMap() {
  const { completedFoundations } = useProgress();
  const next = nextFoundation(completedFoundations);
  return <section className={styles.map} aria-labelledby="foundation-title" id="foundations">
    <div className={styles.mapHeader}>
      <div>
        <span className={styles.eyebrow}>Start from zero · Before A1</span>
        <h2 id="foundation-title">First, the alphabet. Then, your first words.</h2>
        <p>Meet German letters and sounds in small steps. Build up to greetings, numbers and a tiny conversation, with English explanations all the way.</p>
      </div>
      <div className={styles.letterArt} aria-hidden="true">Aa</div>
    </div>
    <div className={styles.mapActions}>
      <Link className={styles.action} href={next ? foundationHref(next) : "/learn/a1/introductions/input"}>
        {next ? completedFoundations.length ? "Continue foundations" : "Begin with A–F" : "Continue to A1"} <span aria-hidden="true">→</span>
      </Link>
      <small>{completedFoundations.length} / {foundationLessons.length} complete · 5–8 minutes per lesson</small>
    </div>
    <div className={styles.track} role="progressbar" aria-label="Foundation course progress" aria-valuemin={0} aria-valuemax={foundationLessons.length} aria-valuenow={completedFoundations.length}><span style={{ width: `${completedFoundations.length / foundationLessons.length * 100}%` }} /></div>
    <details open>
      <summary>Explore the 18 foundation lessons</summary>
      <ol className={styles.lessonList}>
        {foundationLessons.map((lesson, index) => <li key={lesson.id}>
          <Link href={foundationHref(lesson)} aria-current={lesson.id === next?.id ? "step" : undefined}>
            <span className={styles.lessonNumber}>{completedFoundations.includes(lesson.id) ? "✓" : index + 1}</span>
            <span><strong>{lesson.title}</strong><small>{lesson.group} · {lesson.minutes} min{completedFoundations.includes(lesson.id) ? " · Completed" : ""}</small></span>
            <b aria-hidden="true">→</b>
          </Link>
        </li>)}
      </ol>
    </details>
  </section>;
}
