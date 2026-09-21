import { CourseMap } from "@/components/course-map";

export const metadata = { title: "Course path" };

export default function LearnPage() {
  return <main className="shell page-shell"><div className="page-hero"><span className="eyebrow">A1 → C1 COURSE MAP</span><h1>Your German learning path</h1><p>Work sequentially when learning new grammar. Use the practice hub in parallel for retrieval and spaced review.</p></div><CourseMap /></main>;
}
