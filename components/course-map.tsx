"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { courseLessons, courseModules, levelOrder } from "@/lib/curriculum";
import type { LevelId } from "@/lib/types";
import { useProgress } from "./progress-provider";
import { nextFoundation, foundationHref } from "@/lib/foundations";
import styles from "./course-map.module.css";

const levelCopy: Record<LevelId, { name: string; title: string; description: string; promise: string }> = {
  A1: {
    name: "First steps",
    title: "Start speaking German",
    description: "Meet people, ask simple questions and handle the little moments of everyday life.",
    promise: "From your first introduction to useful everyday conversations.",
  },
  A2: {
    name: "Everyday life",
    title: "Make yourself understood",
    description: "Talk about experiences, make plans and find your way through familiar situations.",
    promise: "Build the range to manage life beyond the basics.",
  },
  B1: {
    name: "Your own voice",
    title: "Speak with more independence",
    description: "Tell stories, explain opinions and keep a conversation moving.",
    promise: "Connect your ideas across real conversations and texts.",
  },
  B2: {
    name: "Deeper ideas",
    title: "Handle complex topics",
    description: "Discuss nuanced ideas, work with longer texts and make a stronger case.",
    promise: "Use German with more precision at work and beyond.",
  },
  C1: {
    name: "Advanced fluency",
    title: "Express yourself with control",
    description: "Synthesize, negotiate and write with the flexibility demanding contexts need.",
    promise: "Bring your ideas together with range and confidence.",
  },
};

const stageName: Record<string, string> = {
  input: "Get oriented",
  grammar: "Make sense of grammar",
  lexis: "Build useful language",
  reception: "Read & listen",
  production: "Use it yourself",
  review: "Bring it together",
};

function lessonHref(level: LevelId, moduleSlug: string, lessonSlug: string) {
  return `/learn/${level.toLowerCase()}/${moduleSlug}/${lessonSlug}`;
}

export function CourseMap() {
  const progress = useProgress();
  const completed = useMemo(() => new Set(progress.completedLessons), [progress.completedLessons]);
  const currentLesson = courseLessons.find((lesson) => lesson.id === progress.lastLessonId);
  const [selectedLevel, setSelectedLevel] = useState<LevelId | null>(null);
  const [expandedByLevel, setExpandedByLevel] = useState<Partial<Record<LevelId, string>>>({});
  const level = selectedLevel ?? currentLesson?.level ?? "A1";
  const modules = courseModules.filter((module) => module.level === level);
  const levelLessons = modules.flatMap((module) => module.lessons);
  const done = levelLessons.filter((lesson) => completed.has(lesson.id)).length;
  const pct = Math.round((done / levelLessons.length) * 100);
  const nextModule = modules.find((module) => module.lessons.some((lesson) => !completed.has(lesson.id)));
  const nextLesson = nextModule?.lessons.find((lesson) => !completed.has(lesson.id));
  const foundation = nextFoundation(progress.completedFoundations);
  const startWithFoundations = level === "A1" && done === 0 && foundation;
  const defaultExpanded = nextModule?.slug ?? modules[modules.length - 1]?.slug;
  const expandedModule = expandedByLevel[level] ?? defaultExpanded;

  const levelStats = levelOrder.map((item) => {
    const lessons = courseLessons.filter((lesson) => lesson.level === item);
    return { level: item, done: lessons.filter((lesson) => completed.has(lesson.id)).length, total: lessons.length };
  });

  function toggleModule(slug: string) {
    setExpandedByLevel((previous) => ({
      ...previous,
      [level]: expandedModule === slug ? "" : slug,
    }));
  }

  return (
    <div className={styles.courseMap}>
      <section className={styles.journey} aria-labelledby="course-journey-title">
        <div className={styles.sectionHeading}>
          <div>
            <span className={styles.kicker}>THE LEARNING JOURNEY</span>
            <h2 id="course-journey-title">After foundations, grow through five levels.</h2>
          </div>
          <p>Choose where you want to learn. Every level has ten chapters and sixty lessons.</p>
        </div>
        <div className={styles.levelGrid} role="group" aria-label="Choose a course level">
          {levelStats.map(({ level: item, done: levelDone, total }, index) => {
            const active = item === level;
            return (
              <button
                key={item}
                type="button"
                className={`${styles.levelCard} ${active ? styles.levelCardActive : ""}`}
                data-level={item}
                aria-pressed={active}
                onClick={() => setSelectedLevel(item)}
              >
                <span className={styles.levelCardTop}>
                  <span className={styles.levelOrder}>{String(index + 1).padStart(2, "0")}</span>
                  {levelDone === total ? <span className={styles.levelStatus}>Completed</span> : active ? <span className={styles.levelStatus}>Viewing</span> : null}
                </span>
                <strong className={styles.levelCode}>{item}</strong>
                <span className={styles.levelName}>{levelCopy[item].name}</span>
                <span className={styles.levelProgress}>
                  <span>{levelDone} of {total} lessons</span>
                  <span className={styles.levelBar}><span style={{ width: `${Math.round((levelDone / total) * 100)}%` }} /></span>
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <section className={styles.levelOverview} data-level={level} aria-labelledby="selected-level-title">
        <div className={styles.levelOverviewMain}>
          <span className={styles.overviewEyebrow}>YOU&apos;RE EXPLORING <b>{level}</b></span>
          <h2 id="selected-level-title">{levelCopy[level].title}</h2>
          <p>{levelCopy[level].description}</p>
          {nextLesson ? (
            <Link className={styles.mainAction} href={startWithFoundations ? foundationHref(foundation) : lessonHref(level, nextLesson.moduleSlug, nextLesson.slug)}>
              <span className={styles.actionLabel}>
                {startWithFoundations ? "Start with the foundations" : done === 0 ? `Start ${level}` : "Continue learning"}
                <small>{startWithFoundations ? foundation.title : `${nextModule?.title} · ${stageName[nextLesson.stage]}`}</small>
              </span>
              <span aria-hidden="true">↗</span>
            </Link>
          ) : (
            <Link className={styles.mainAction} href="/assessments">
              Explore your {level} assessment <span aria-hidden="true">↗</span>
            </Link>
          )}
        </div>
        <div className={styles.levelOverviewSide}>
          <div className={styles.levelBadge} aria-hidden="true">{level}</div>
          <span className={styles.sideLabel}>{done === 0 ? "YOUR STARTING POINT" : "YOUR PROGRESS"}</span>
          <strong>{done} / {levelLessons.length}</strong>
          <span className={styles.sideCaption}>lessons completed</span>
          <span className={styles.overviewBar}><span style={{ width: `${pct}%` }} /></span>
          <p>{levelCopy[level].promise}</p>
        </div>
      </section>

      <section className={styles.chapters} aria-labelledby="course-chapters-title">
        <div className={styles.sectionHeading}>
          <div>
            <span className={styles.kicker}>THE {level} COURSE</span>
            <h2 id="course-chapters-title">Your ten chapters</h2>
          </div>
          <p>Each chapter moves from a real situation to practice, reading, listening and your own speaking or writing.</p>
        </div>
        <div className={styles.moduleGrid}>
          {modules.map((module, index) => {
            const moduleDone = module.lessons.filter((lesson) => completed.has(lesson.id)).length;
            const moduleComplete = moduleDone === module.lessons.length;
            const moduleNext = module.lessons.find((lesson) => !completed.has(lesson.id)) ?? module.lessons[0];
            const isExpanded = expandedModule === module.slug;
            const isNext = nextModule?.slug === module.slug;
            const duration = module.lessons.reduce((sum, lesson) => sum + lesson.durationMinutes, 0);
            const panelId = `lessons-${level.toLowerCase()}-${module.slug}`;

            return (
              <article className={`${styles.moduleCard} ${isNext ? styles.moduleCardNext : ""}`} key={module.slug}>
                <div className={styles.moduleTop}>
                  <span className={styles.moduleNumber}>{String(index + 1).padStart(2, "0")}</span>
                  <span className={styles.moduleTag}>{moduleComplete ? "Chapter complete" : isNext ? "Up next" : `${moduleDone} of 6 done`}</span>
                </div>
                <h3>{module.title}</h3>
                <p className={styles.scenario}>German for {module.scenario}.</p>
                <div className={styles.moduleOutcome}>
                  <span>By the end, you can</span>
                  <ul>
                    {module.canDos.slice(0, 2).map((canDo) => <li key={canDo}>{canDo}</li>)}
                  </ul>
                </div>
                <div className={styles.languageFocus}>
                  <span>Language focus</span>
                  <p>{module.grammarFocus.slice(0, 2).join(" · ")}</p>
                </div>
                <div className={styles.moduleMeta}>
                  <span>6 lessons</span><span aria-hidden="true">·</span><span>about {Math.round(duration / 60)} hours</span>
                </div>
                <div className={styles.moduleActions}>
                  <Link className={styles.chapterAction} href={lessonHref(level, module.slug, moduleNext.slug)}>
                    {moduleComplete ? "Review chapter" : moduleDone ? "Continue chapter" : "Start chapter"} <span aria-hidden="true">↗</span>
                  </Link>
                  <button
                    type="button"
                    className={styles.expandButton}
                    aria-expanded={isExpanded}
                    aria-controls={isExpanded ? panelId : undefined}
                    onClick={() => toggleModule(module.slug)}
                  >
                    {isExpanded ? "Hide lessons" : "See lessons"} <span aria-hidden="true">{isExpanded ? "−" : "+"}</span>
                  </button>
                </div>
                {isExpanded && (
                  <div className={styles.lessonPanel} id={panelId}>
                    <span className={styles.lessonPanelTitle}>The six lessons</span>
                    <ol>
                      {module.lessons.map((lesson) => (
                        <li key={lesson.id}>
                          <Link href={lessonHref(level, module.slug, lesson.slug)} className={styles.lessonLink}>
                            <span className={styles.lessonIndex}>{completed.has(lesson.id) ? "✓" : lesson.lessonIndex}</span>
                            <span className={styles.lessonText}><small>{stageName[lesson.stage]}</small><strong>{lesson.title}</strong></span>
                            <span className={styles.lessonDuration}>{lesson.durationMinutes} min</span>
                          </Link>
                        </li>
                      ))}
                    </ol>
                  </div>
                )}
              </article>
            );
          })}
        </div>
        {done === levelLessons.length && (
          <div className={styles.assessmentNote}>
            <div><strong>You&apos;ve finished the {level} lessons.</strong><p>Use the integrated checkpoint to review your skills and decide what to practice next.</p></div>
            <Link href="/assessments">Go to assessments ↗</Link>
          </div>
        )}
      </section>
    </div>
  );
}
