import { allVocabulary, courseData } from "@/lib/course";
import { PracticeHub } from "@/components/practice-hub";

export const metadata = { title: "Practice" };

export default function PracticePage() {
  const questions = courseData.units.flatMap((unit) => unit.quiz.map((q) => ({ ...q, level: unit.level, unitId: unit.id, unit: unit.title })));
  return <main className="shell page-shell"><div className="page-hero"><span className="eyebrow">ACTIVE RECALL</span><h1>Practice hub</h1><p>Review vocabulary with flashcards or generate mixed checkpoints from all five CEFR levels.</p></div><PracticeHub vocabulary={allVocabulary} questions={questions} /></main>;
}
