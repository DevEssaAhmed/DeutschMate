"use client";

import Link from "next/link";
import { useState } from "react";
import { courseModules, courseLessons, levelOrder } from "@/lib/curriculum";
import type { LevelId } from "@/lib/types";
import { useProgress } from "./progress-provider";

const levelCopy: Record<LevelId, { title: string; description: string }> = {
  A1: { title: "Build the foundation", description: "Handle introductions, everyday needs and the first essential structures." },
  A2: { title: "Become independent", description: "Talk about experiences, plans and familiar problems with more range." },
  B1: { title: "Operate in real life", description: "Narrate, explain, solve problems and sustain connected communication." },
  B2: { title: "Argue and work precisely", description: "Handle complex topics, professional contexts and extended argument." },
  C1: { title: "Use German flexibly", description: "Synthesize, negotiate, present and write with advanced control." },
};

const stageShort: Record<string, string> = {
  input: "Context",
  grammar: "Grammar",
  lexis: "Lexis",
  reception: "Input",
  production: "Produce",
  review: "Review",
};

export function CourseMap() {
  const progress = useProgress();
  const completed = new Set(progress.completedLessons);
  const currentLesson = courseLessons.find((lesson) => lesson.id === progress.lastLessonId);
  const [level, setLevel] = useState<LevelId>(currentLesson?.level ?? "A1");
  const modules = courseModules.filter((module) => module.level === level);
  const levelLessons = modules.flatMap((module) => module.lessons);
  const done = levelLessons.filter((lesson) => completed.has(lesson.id)).length;
  const pct = Math.round((done / levelLessons.length) * 100);

  return (
    <div className="course-workspace">
      <aside className="course-level-rail">
        <span className="page-kicker">CEFR PATH</span>
        <div className="level-picker">
          {levelOrder.map((item) => {
            const lessons = courseLessons.filter((lesson) => lesson.level === item);
            const complete = lessons.filter((lesson) => completed.has(lesson.id)).length;
            return (
              <button key={item} type="button" className={level === item ? "active" : ""} onClick={() => setLevel(item)}>
                <span className={"level-dot level-" + item.toLowerCase()}>{item}</span>
                <div><strong>{levelCopy[item].title}</strong><small>{complete}/{lessons.length} lessons</small></div>
                <b>→</b>
              </button>
            );
          })}
        </div>
      </aside>

      <section className="course-path">
        <header className="course-path-header">
          <div>
            <span className={"level-dot large level-" + level.toLowerCase()}>{level}</span>
            <div><span className="page-kicker">10 MODULES · 60 LESSONS</span><h2>{levelCopy[level].title}</h2><p>{levelCopy[level].description}</p></div>
          </div>
          <div className="course-level-progress"><strong>{pct}%</strong><span>{done}/{levelLessons.length} lessons</span><div className="bar"><i style={{ width: pct + "%" }} /></div></div>
        </header>

        <div className="module-path">
          {modules.map((module, index) => {
            const moduleDone = module.lessons.filter((lesson) => completed.has(lesson.id)).length;
            const nextLesson = module.lessons.find((lesson) => !completed.has(lesson.id)) ?? module.lessons[module.lessons.length - 1];
            const active = currentLesson?.moduleSlug === module.slug && currentLesson.level === level;
            return (
              <article className={"path-module " + (active ? "active" : "")} key={module.slug}>
                <div className="path-node"><span>{String(index + 1).padStart(2, "0")}</span></div>
                <div className="path-module-card card">
                  <div className="path-module-head">
                    <div><span className="page-kicker">MODULE {module.index}</span><h3>{module.title}</h3><p>{module.scenario}</p></div>
                    <span className="module-progress-badge">{moduleDone}/6</span>
                  </div>

                  <div className="can-do-line">
                    {module.canDos.slice(0, 2).map((item) => <span key={item}>✓ {item}</span>)}
                  </div>

                  <div className="lesson-strip">
                    {module.lessons.map((lesson) => (
                      <Link
                        key={lesson.id}
                        href={"/learn/" + level.toLowerCase() + "/" + module.slug + "/" + lesson.slug}
                        className={(completed.has(lesson.id) ? "done " : "") + (currentLesson?.id === lesson.id ? "current" : "")}
                      >
                        <i>{completed.has(lesson.id) ? "✓" : lesson.lessonIndex}</i>
                        <span>{stageShort[lesson.stage]}</span>
                      </Link>
                    ))}
                  </div>

                  <div className="path-module-foot">
                    <div className="bar"><i style={{ width: Math.round((moduleDone / 6) * 100) + "%" }} /></div>
                    <Link className="button secondary" href={"/learn/" + level.toLowerCase() + "/" + module.slug + "/" + nextLesson.slug}>
                      {moduleDone === 6 ? "Review module" : moduleDone ? "Continue" : "Start module"} →
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
