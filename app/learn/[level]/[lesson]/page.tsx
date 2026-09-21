import { courseData, getAdjacentUnits, getUnit } from "@/lib/course";
import { LessonClient } from "@/components/lesson-client";

export const dynamicParams = false;

export function generateStaticParams() {
  return courseData.units.map((unit) => ({ level: unit.level.toLowerCase(), lesson: unit.slug }));
}

export default async function LessonPage({ params }: { params: Promise<{ level: string; lesson: string }> }) {
  const { level, lesson } = await params;
  const unit = getUnit(level, lesson);
  if (!unit) return <main className="shell page-shell"><h1>Lesson not found</h1></main>;
  const { previous, next } = getAdjacentUnits(unit);
  return <main className="shell lesson-page"><LessonClient unit={unit} previous={previous} next={next} /></main>;
}
