import { AssessmentHub } from "@/components/assessment-hub";

export const metadata = { title: "Assessments" };

export default function AssessmentsPage() {
  return <main className="shell page-shell"><div className="page-hero"><span className="eyebrow">A1 · A2 · B1 · B2 · C1</span><h1>Integrated level checkpoints.</h1><p>These are internal DeutschMate assessments—not official Goethe exams. They combine reading, listening, language control, writing and speaking evidence to update your competency profile.</p></div><AssessmentHub /></main>;
}
