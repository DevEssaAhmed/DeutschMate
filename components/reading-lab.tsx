"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { courseModules, levelOrder } from "@/lib/curriculum";
import type { LevelId } from "@/lib/types";

export function ReadingLab() {
  const [level, setLevel] = useState<LevelId>("A1");
  const [moduleIndex, setModuleIndex] = useState(0);
  const modules = useMemo(() => courseModules.filter((module) => module.level === level), [level]);
  const module = modules[moduleIndex % Math.max(modules.length, 1)];
  const lesson = module?.lessons.find((item) => item.stage === "reception") ?? module?.lessons[3];

  return (
    <div className="skill-workspace">
      <aside className="skill-library card">
        <div className="skill-library-head">
          <span className="page-kicker">READING LIBRARY</span>
          <div className="segmented compact">{levelOrder.map((item) => <button type="button" key={item} className={level === item ? "active" : ""} onClick={() => { setLevel(item); setModuleIndex(0); }}>{item}</button>)}</div>
        </div>
        <div className="skill-library-list">
          {modules.map((item, index) => (
            <button type="button" key={item.slug} className={moduleIndex === index ? "active" : ""} onClick={() => setModuleIndex(index)}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <div><strong>{item.title}</strong><small>{item.readingGenre}</small></div>
            </button>
          ))}
        </div>
      </aside>

      {module && lesson && (
        <section className="reader-canvas">
          <header className="reader-header">
            <div><span className={"level-dot level-" + level.toLowerCase()}>{level}</span><span>Module {module.index}</span><span>{module.readingGenre}</span></div>
            <h2>{lesson.reading.title}</h2>
            <p>{module.scenario}</p>
          </header>

          <article className="reader-text-card card">
            <div className="reading-prep">
              <span className="page-kicker">BEFORE READING</span>
              <p>{lesson.reading.preReading[0]}</p>
            </div>
            <div className="reading-text" lang="de">{lesson.reading.text}</div>
          </article>

          <div className="reader-task-grid">
            <article className="reader-task card"><span>01</span><div><small>First pass</small><strong>{lesson.reading.gistQuestion}</strong></div></article>
            <article className="reader-task card"><span>02</span><div><small>Details</small><strong>{lesson.reading.detailQuestions[0]}</strong></div></article>
            <article className="reader-task card"><span>03</span><div><small>Language</small><strong>{lesson.reading.languageFocus.slice(0, 3).join(" · ")}</strong></div></article>
          </div>

          <div className="reader-actions">
            <div><span className="page-kicker">AFTER READING</span><p>{lesson.reading.afterReading}</p></div>
            <Link className="button primary" href={"/learn/" + level.toLowerCase() + "/" + module.slug + "/reception"}>Study interactively →</Link>
          </div>
        </section>
      )}
    </div>
  );
}
