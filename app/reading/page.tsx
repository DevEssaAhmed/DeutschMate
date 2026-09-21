import { ReadingLab } from "@/components/reading-lab";

export const metadata = { title: "Reading Lab" };

export default function ReadingPage() {
  return <main className="shell page-shell"><div className="page-hero"><span className="eyebrow">READING A1 → C1</span><h1>Read connected German, not isolated sentences.</h1><p>Move from short everyday texts to demanding analytical prose. Each text includes prediction, gist, detail, language analysis and a production task.</p></div><ReadingLab /></main>;
}
