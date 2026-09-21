import { ReviewHub } from "@/components/review-hub";

export const metadata = { title: "Review" };

export default function PracticePage() {
  return (
    <main className="shell page-shell">
      <div className="page-hero">
        <span className="eyebrow">SPACED REVIEW</span>
        <h1>Review what is becoming weak.</h1>
        <p>Recall the German before revealing it, then rate the difficulty. DeutschMate schedules the next review locally in your browser instead of serving random cards forever.</p>
      </div>
      <ReviewHub />
    </main>
  );
}
