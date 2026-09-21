"use client";

import Link from "next/link";
import { courseData, getUnitsByLevel, levelOrder } from "@/lib/course";
import type { LevelId } from "@/lib/types";
import { useProgress } from "./progress-provider";

const levelNames: Record<LevelId, string> = {
  A1: "Foundation",
  A2: "Everyday independence",
  B1: "Independent German",
  B2: "Upper-intermediate control",
  C1: "Advanced mastery",
};

export function CourseMap() {
  const { completed, ready } = useProgress();
  const done = new Set(completed);

  return (
    <div className="course-map">
      {levelOrder.map((level) => {
        const units = getUnitsByLevel(level);
        const finished = units.filter((unit) => done.has(unit.id)).length;
        const pct = ready ? Math.round((finished / units.length) * 100) : 0;
        return (
          <section className="level-section" key={level} id={level.toLowerCase()}>
            <div className="level-heading">
              <div className={`level-badge level-${level.toLowerCase()}`}>{level}</div>
              <div>
                <span className="eyebrow">{courseData.levels[level].goal}</span>
                <h2>{levelNames[level]}</h2>
              </div>
              <div className="level-progress"><strong>{finished}/{units.length}</strong><span>{pct}% complete</span></div>
            </div>
            <div className="unit-grid">
              {units.map((unit, index) => (
                <Link className={`unit-card ${done.has(unit.id) ? "complete" : ""}`} href={`/learn/${level.toLowerCase()}/${unit.slug}`} key={unit.id}>
                  <div className="unit-number">{String(index + 1).padStart(2, "0")}</div>
                  <div className="unit-main">
                    <span className="unit-status">{done.has(unit.id) ? "✓ Completed" : `${unit.vocab.length} words · ${unit.grammar.length} grammar topics`}</span>
                    <h3>{unit.title}</h3>
                    <p>{unit.goals.slice(0, 3).join(" · ")}</p>
                  </div>
                  <span className="unit-arrow">→</span>
                </Link>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
