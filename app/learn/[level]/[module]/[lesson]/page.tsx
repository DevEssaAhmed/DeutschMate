import { courseLessons, getAdjacentLessons, getLesson } from "@/lib/curriculum";
import { LessonWorkspace } from "@/components/lesson-workspace";

export const dynamicParams = false;

export function generateStaticParams() {
  return courseLessons.map((lesson) => ({
    level: lesson.level.toLowerCase(),
    module: lesson.moduleSlug,
    lesson: lesson.slug,
  }));
}

export default async function LessonPage({ params }: { params: Promise<{ level: string; module: string; lesson: string }> }) {
  const { level, module, lesson } = await params;
  const item = getLesson(level, module, lesson);
  if (!item) return <main className="page-shell"><h1>Lesson not found</h1></main>;
  const { previous, next } = getAdjacentLessons(item);
  return <main className="lesson-page"><LessonWorkspace lesson={item} previous={previous} next={next} /></main>;
}
