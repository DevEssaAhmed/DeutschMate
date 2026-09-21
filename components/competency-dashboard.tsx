"use client";

import { cefrDescriptors, skillOrder } from "@/lib/cefr";
import { levelOrder } from "@/lib/curriculum";
import type { CoreSkill } from "@/lib/types";
import { useProgress } from "./progress-provider";

const labels: Record<CoreSkill, string> = {
  reading: "Reading",
  listening: "Listening",
  speaking: "Speaking",
  writing: "Writing",
  grammar: "Grammar",
  vocabulary: "Vocabulary",
};

export function CompetencyDashboard() {
  const progress = useProgress();

  return (
    <div className="competency-dashboard">
      <div className="stats-grid">
        <article className="stat-card card"><span>Course evidence</span><strong>{progress.percent}%</strong><small>{progress.completedLessons.length} completed lessons</small></article>
        <article className="stat-card card"><span>Study streak</span><strong>{progress.streak}</strong><small>days</small></article>
        <article className="stat-card card"><span>Review queue</span><strong>{progress.dueReviews}</strong><small>terms currently due</small></article>
        <article className="stat-card card"><span>Assessments</span><strong>{Object.keys(progress.assessments).length}/5</strong><small>CEFR checkpoints attempted</small></article>
      </div>

      {levelOrder.map((level) => {
        const assessment = progress.assessments[level];
        return (
          <section className="competency-level card" key={level}>
            <header>
              <span className={"level-badge level-" + level.toLowerCase()}>{level}</span>
              <div><span className="eyebrow">CAN-DO PROFILE</span><h2>{level} competency evidence</h2></div>
              {assessment && <span className="score-pill">assessment {assessment.score}/{assessment.total}</span>}
            </header>

            <div className="skill-profile-grid">
              {skillOrder.map((skill) => {
                const descriptors = cefrDescriptors.filter((item) => item.level === level && item.skill === skill);
                const mastery = descriptors.reduce((sum, item) => sum + Math.min(2, progress.competencyEvidence[item.id] ?? 0), 0);
                const max = descriptors.length * 2;
                const pct = max ? Math.round((mastery / max) * 100) : 0;
                return (
                  <article className="skill-profile" key={skill}>
                    <div className="skill-profile-head"><strong>{labels[skill]}</strong><span>{pct}%</span></div>
                    <div className="bar"><i style={{ width: pct + "%" }} /></div>
                    <ul>
                      {descriptors.map((item) => {
                        const evidence = progress.competencyEvidence[item.id] ?? 0;
                        return <li key={item.id} className={evidence >= 2 ? "mastered" : evidence === 1 ? "developing" : ""}><span>{evidence >= 2 ? "✓" : evidence === 1 ? "◐" : "○"}</span>{item.text}</li>;
                      })}
                    </ul>
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
