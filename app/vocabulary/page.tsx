import { allRichVocabulary } from "@/lib/curriculum";
import { VocabularyExplorer } from "@/components/vocabulary-explorer";

export const metadata = { title: "Vocabulary" };

export default function VocabularyPage() {
  return <main className="shell page-shell"><div className="page-hero"><span className="eyebrow">COURSE LEXICON</span><h1>Learn vocabulary as usable language.</h1><p>Search the A1–C1 lexicon with article information where available, lemma, part of speech, module chunks, pronunciation and your local review strength.</p></div><VocabularyExplorer items={allRichVocabulary} /></main>;
}
