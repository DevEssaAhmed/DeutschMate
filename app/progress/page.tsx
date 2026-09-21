import { CompetencyDashboard } from "@/components/competency-dashboard";

export const metadata = { title: "Competency profile" };

export default function ProgressPage() {
  return (
    <main className="shell page-shell">
      <div className="page-hero">
        <span className="eyebrow">CEFR CAN-DO EVIDENCE</span>
        <h1>Progress means what you can do in German.</h1>
        <p>Lesson evidence and level assessments build a profile across reading, listening, speaking, writing, grammar and vocabulary. A lesson count alone is not treated as proficiency.</p>
      </div>
      <CompetencyDashboard />
    </main>
  );
}
