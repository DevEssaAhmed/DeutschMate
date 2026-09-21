"use client";

import Link from "next/link";
import { useState } from "react";
import { courseModules, levelOrder } from "@/lib/curriculum";
import type { LevelId } from "@/lib/types";

export function ReadingLab() {
  const [level, setLevel] = useState<LevelId>("A1");
  const modules = courseModules.filter((module) => module.level === level);

  return (
    <div className="lab-shell">
      <div className="lab-toolbar card">
        <div><span className="eyebrow">READING PATH</span><strong>{modules.length} connected texts at {level}</strong></div>
        <div className="segmented">{levelOrder.map((item) => <button type="button" key={item} className={level === item ? "active" : ""} onClick={() => setLevel(item)}>{item}</button>)}</div>
      </div>

      <div className="reading-lab-grid">
        {modules.map((module) => {
          const lesson = module.lessons.find((item) => item.stage === "reception") ?? module.lessons[3];
          return (
            <article className="reading-lab-card card" key={module.slug}>
              <div className="reading-lab-meta"><span className={"mini-level level-" + level.toLowerCase()}>{level}</span><span>{module.readingGenre}</span><span>Module {module.index}</span></div>
              <h2>{module.title}</h2>
              <div className="pre-reading">{lesson.reading.preReading.map((item) => <span key={item}>{item}</span>)}</div>
              <p className="reading-text">{lesson.reading.text}</p>
              <div className="reception-questions">
                <strong>Reading sequence</strong>
                <p><b>First pass:</b> {lesson.reading.gistQuestion}</p>
                {lesson.reading.detailQuestions.map((question) => <p key={question}>• {question}</p>)}
                <p><b>Language analysis:</b> {lesson.reading.languageFocus.slice(0, 4).join(" · ")}</p>
                <p><b>After reading:</b> {lesson.reading.afterReading}</p>
              </div>
              <Link className="button secondary" href={"/learn/" + level.toLowerCase() + "/" + module.slug + "/reception"}>Study this text in the course →</Link>
            </article>
          );
        })}
      </div>
    </div>
  );
}
