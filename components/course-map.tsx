"use client";

import Link from "next/link";
import { courseModules, levelOrder } from "@/lib/curriculum";
import { useProgress } from "./progress-provider";

export function CourseMap() {
  const progress = useProgress();
  const completed = new Set(progress.completedLessons);

  return (
    <div className="course-v2-map">
      {levelOrder.map((level) => {
        const modules = courseModules.filter((module) => module.level === level);
        const levelLessons = modules.flatMap((module) => module.lessons);
        const done = levelLessons.filter((lesson) => completed.has(lesson.id)).length;

        return (
          <section className="course-level" key={level}>
            <header className="course-level-header">
              <span className={"level-badge level-" + level.toLowerCase()}>{level}</span>
              <div><span className="eyebrow">{modules.length} modules · {levelLessons.length} lessons</span><h2>{level}</h2></div>
              <div className="level-progress"><strong>{done}/{levelLessons.length}</strong><span>{Math.round((done / levelLessons.length) * 100)}% complete</span></div>
            </header>

            <div className="module-list">
              {modules.map((module) => {
                const moduleDone = module.lessons.filter((lesson) => completed.has(lesson.id)).length;
                const nextLesson = module.lessons.find((lesson) => !completed.has(lesson.id)) ?? module.lessons[module.lessons.length - 1];
                return (
                  <article className="module-card card" key={module.slug}>
                    <div className="module-card-top">
                      <div><span className="eyebrow">MODULE {module.index}</span><h3>{module.title}</h3><p>{module.scenario}</p></div>
                      <span className="module-count">{moduleDone}/6</span>
                    </div>
                    <div className="module-can-do">{module.canDos.map((item) => <span key={item}>✓ {item}</span>)}</div>
                    <div className="lesson-stage-row">
                      {module.lessons.map((lesson) => (
                        <Link
                          key={lesson.id}
                          href={"/learn/" + level.toLowerCase() + "/" + module.slug + "/" + lesson.slug}
                          className={completed.has(lesson.id) ? "done" : ""}
                          title={lesson.title}
                        >
                          <b>{lesson.lessonIndex}</b><small>{lesson.stage}</small>
                        </Link>
                      ))}
                    </div>
                    <Link className="button secondary" href={"/learn/" + level.toLowerCase() + "/" + module.slug + "/" + nextLesson.slug}>
                      {moduleDone === 6 ? "Review module" : moduleDone ? "Continue module" : "Start module"} →
                    </Link>
                  </article>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
