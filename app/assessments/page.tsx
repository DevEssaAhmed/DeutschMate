import { AssessmentHub } from "@/components/assessment-hub";

export const metadata = { title: "Assessments" };

export default function AssessmentsPage() {
  return <main className="shell page-shell"><div className="page-hero"><span className="eyebrow">A1 · A2 · B1 · B2 · C1</span><h1>Integrated level checkpoints.</h1><p>Work through reading, listening, language control, writing and speaking. Vocabulary and grammar questions receive an automatic score; your other responses remain saved as practice attempts. These are internal DeutschMate checkpoints, not official Goethe exams.</p></div><AssessmentHub /></main>;
}
