import { ListeningLab } from "@/components/listening-lab";

export const metadata = { title: "Listening Lab" };

export default function ListeningPage() {
  return <main className="shell page-shell"><div className="page-hero"><span className="eyebrow">LISTENING A1 → C1</span><h1>Train comprehension before reading the transcript.</h1><p>Listen for gist, listen again for detail, complete dictation, reveal the transcript only afterwards, then shadow a target line.</p></div><ListeningLab /></main>;
}
