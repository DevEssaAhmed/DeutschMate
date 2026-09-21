import { SpeakingStudio } from "@/components/speaking-studio";

export const metadata = { title: "Speaking Studio" };

export default function SpeakingPage() {
  return <main className="shell page-shell"><div className="page-hero"><span className="eyebrow">SPEAKING A1 → C1</span><h1>Produce German under real communicative pressure.</h1><p>Tasks progress from short guided descriptions to negotiation, presentations and nuanced discussion. Use live speech recognition where supported, then receive CEFR-aware feedback on the transcript.</p></div><SpeakingStudio /></main>;
}
