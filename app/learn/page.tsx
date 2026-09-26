import Link from "next/link";
import { CourseMap } from "@/components/course-map";
import { FoundationMap } from "@/components/foundation-map";
import { curriculumStats } from "@/lib/curriculum";
import styles from "./learn-page.module.css";

export const metadata = { title: "Course" };

export default function LearnPage() {
  return (
    <main className="shell page-shell">
      <header className={styles.hero}>
        <div>
          <span className={styles.kicker}>FROM ZERO → C1 · 18 FOUNDATION + {curriculumStats.lessons} CEFR LESSONS</span>
          <h1>German, one clear step at a time.</h1>
          <p>Begin with the German alphabet. Learn sounds, words and your first sentences before growing into conversations, connected texts and advanced expression.</p>
        </div>
        <Link className={styles.startCard} href="/learn/foundations/alphabet-a-f">
          <span className={styles.startTop}><b>Aa</b><small>NEW TO GERMAN?</small></span>
          <strong>Begin with the alphabet</strong>
          <span className={styles.startBottom}>Just six letters to start: A–F <b aria-hidden="true">↗</b></span>
        </Link>
      </header>
      <FoundationMap />
      <CourseMap />
    </main>
  );
}
