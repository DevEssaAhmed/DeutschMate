"use client";

import { useRef, useState } from "react";
import { cefrDescriptors, skillOrder } from "@/lib/cefr";
import { levelOrder } from "@/lib/curriculum";
import Link from "next/link";
import { foundationLessons } from "@/lib/foundations";
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
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(progress.userName || "Essa");
  const [importStatus, setImportStatus] = useState<{ message: string; isError: boolean } | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  function saveName() {
    progress.setUserName(nameInput);
    setEditingName(false);
  }

  function handleExport() {
    const json = progress.exportProgress();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const date = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `deutschmate-progress-${date}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result;
      if (typeof content === "string") {
        const res = progress.importProgress(content);
        if (res.success) {
          setImportStatus({ message: "Progress successfully restored from backup!", isError: false });
        } else {
          setImportStatus({ message: res.error || "Failed to import backup.", isError: true });
        }
      }
    };
    reader.readAsText(file);
    event.target.value = "";
  }

  return (
    <div className="competency-dashboard">
      <div className="profile-hero card">
        <div className="profile-hero-content">
          <div className="profile-avatar-large">
            {(progress.userName || "Essa").slice(0, 2).toUpperCase()}
          </div>
          <div className="profile-details">
            <span className="page-kicker">LEARNER PROFILE</span>
            {editingName ? (
              <div className="profile-name-edit">
                <input
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  maxLength={40}
                  aria-label="Learner name"
                />
                <button type="button" className="button primary" onClick={saveName}>Save</button>
                <button type="button" className="button secondary" onClick={() => setEditingName(false)}>Cancel</button>
              </div>
            ) : (
              <div className="profile-name-row">
                <h2>{progress.userName || "Essa"}</h2>
                <button type="button" className="text-button" onClick={() => { setNameInput(progress.userName || "Essa"); setEditingName(true); }}>
                  ✎ Edit name
                </button>
              </div>
            )}
            <p>Local-first German competency tracker. Real CEFR evidence across all core skills.</p>
          </div>
        </div>
      </div>

      <div className="stats-grid">
        <article className="stat-card card"><span>Course evidence</span><strong>{progress.percent}%</strong><small>{progress.completedLessons.length} completed lessons</small></article>
        <article className="stat-card card"><span>Study streak</span><strong>{progress.streak}</strong><small>days</small></article>
        <article className="stat-card card"><span>Review queue</span><strong>{progress.dueReviews}</strong><small>terms currently due</small></article>
        <article className="stat-card card"><span>Assessments</span><strong>{Object.keys(progress.assessments).length}/5</strong><small>CEFR checkpoints attempted</small></article>
      </div>

      <section className="card" style={{ padding: 24, marginBottom: 24 }} aria-labelledby="foundation-progress-title">
        <span className="eyebrow">START FROM ZERO</span>
        <h2 id="foundation-progress-title">Foundation progress</h2>
        <p>{progress.completedFoundations.length} of {foundationLessons.length} lessons complete. Letters, sounds, words and your first conversation.</p>
        <p>These preparatory lessons are tracked separately from CEFR competency evidence.</p>
        <Link className="button secondary" href="/learn#foundations">Explore foundations →</Link>
      </section>

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

      <section className="backup-section card">
        <header>
          <span className="eyebrow">DATA PORTABILITY</span>
          <h2>Backup & Portability</h2>
          <p>DeutschMate progress lives safely in your browser storage. You can export a backup file or transfer your German progress to another computer.</p>
        </header>

        <div className="backup-actions">
          <button type="button" className="button primary" onClick={handleExport}>
            ↓ Export progress backup (.json)
          </button>
          <button type="button" className="button secondary" onClick={() => fileInputRef.current?.click()}>
            ↑ Restore from backup file
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            style={{ display: "none" }}
            onChange={handleFileChange}
          />
        </div>

        {importStatus && (
          <div className={`import-alert ${importStatus.isError ? "error" : "success"}`}>
            {importStatus.message}
          </div>
        )}
      </section>
    </div>
  );
}
