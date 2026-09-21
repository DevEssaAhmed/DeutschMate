import { allVocabulary } from "@/lib/course";
import { VocabularyExplorer } from "@/components/vocabulary-explorer";

export const metadata = { title: "Vocabulary" };

export default function VocabularyPage() {
  return <main className="shell page-shell"><div className="page-hero"><span className="eyebrow">800 COURSE ITEMS</span><h1>Vocabulary library</h1><p>Search the complete course vocabulary, filter by CEFR level and hear any item pronounced.</p></div><VocabularyExplorer items={allVocabulary} /></main>;
}
