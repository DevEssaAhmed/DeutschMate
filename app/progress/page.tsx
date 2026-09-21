import { ProgressDashboard } from "@/components/progress-dashboard";

export const metadata = { title: "Progress" };

export default function ProgressPage() {
  return <main className="shell page-shell"><div className="page-hero"><span className="eyebrow">YOUR LEARNING DATA</span><h1>Progress dashboard</h1><p>Your study data stays in this browser. Complete units, take quizzes and keep a consistent streak.</p></div><ProgressDashboard /></main>;
}
