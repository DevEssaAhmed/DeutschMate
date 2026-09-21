import { SpeakingStudio } from "@/components/speaking-studio";

export const metadata = { title: "Speaking Studio" };

export default function SpeakingPage() {
  return <main className="shell page-shell"><div className="page-hero"><span className="eyebrow">SPEAKING A1 → C1</span><h1>Produce German under real communicative pressure.</h1><p>Tasks progress from short guided descriptions to negotiation, presentations and nuanced discussion. Record your response for CEFR-aware feedback on pronunciation, intelligibility, rhythm, grammar and vocabulary; transcript feedback remains available as a fallback.</p></div><SpeakingStudio /></main>;
}
