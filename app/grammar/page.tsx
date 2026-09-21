import { allCurriculumGrammar } from "@/lib/curriculum";
import { GrammarExplorer } from "@/components/grammar-explorer";

export const metadata = { title: "Grammar" };

export default function GrammarPage() {
  return <main className="shell page-shell"><div className="page-hero"><span className="eyebrow">SYSTEMATIC GRAMMAR A1 → C1</span><h1>Grammar stays explicit.</h1><p>Use the reference to understand rules and examples, then transform the examples and produce your own sentence. Grammar is integrated into the course rather than hidden behind guessing.</p></div><GrammarExplorer items={allCurriculumGrammar} /></main>;
}
