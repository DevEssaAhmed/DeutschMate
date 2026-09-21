import { allGrammar } from "@/lib/course";
import { GrammarExplorer } from "@/components/grammar-explorer";

export const metadata = { title: "Grammar" };

export default function GrammarPage() {
  return <main className="shell page-shell"><div className="page-hero"><span className="eyebrow">80 EXPLANATIONS</span><h1>Grammar reference</h1><p>Search the grammar system from A1 word order to C1 register, modality, cohesion and compressed structures.</p></div><GrammarExplorer items={allGrammar} /></main>;
}
