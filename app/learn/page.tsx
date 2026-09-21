import { CourseMap } from "@/components/course-map";
import { curriculumStats } from "@/lib/curriculum";

export const metadata = { title: "Course" };

export default function LearnPage() {
  return (
    <main className="shell page-shell">
      <div className="page-hero">
        <span className="eyebrow">A1 → C1 · {curriculumStats.lessons} LESSONS</span>
        <h1>A real German course, not a list of exercises.</h1>
        <p>Each module moves through context, explicit teaching, controlled practice, connected reading/listening, guided production and review. Work sequentially when learning new material.</p>
      </div>
      <CourseMap />
    </main>
  );
}
