import { notFound } from "next/navigation";
import { foundationLessons } from "@/lib/foundations";
import { FoundationWorkspace } from "@/components/foundation-workspace";

export const dynamicParams = false;

export function generateStaticParams() {
  return foundationLessons.map((lesson) => ({ lesson: lesson.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ lesson: string }> }) {
  const { lesson } = await params;
  return { title: foundationLessons.find((item) => item.slug === lesson)?.title ?? "Foundations" };
}

export default async function FoundationPage({ params }: { params: Promise<{ lesson: string }> }) {
  const { lesson } = await params;
  const item = foundationLessons.find((entry) => entry.slug === lesson);
  if (!item) notFound();
  return <FoundationWorkspace key={item.id} lesson={item} />;
}
