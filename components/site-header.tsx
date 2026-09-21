import Link from "next/link";
import { ThemeToggle } from "./theme-toggle";

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="shell nav-shell">
        <Link href="/" className="brand" aria-label="DeutschMate home">
          <span className="brand-mark">DM</span>
          <span><strong>DeutschMate</strong><small>Serious German · A1 → C1</small></span>
        </Link>
        <nav className="main-nav" aria-label="Main navigation">
          <Link href="/learn">Course</Link>
          <Link href="/reading">Reading</Link>
          <Link href="/listening">Listening</Link>
          <Link href="/speaking">Speaking</Link>
          <Link href="/writing">Writing</Link>
          <Link href="/grammar">Grammar</Link>
          <Link href="/vocabulary">Vocabulary</Link>
          <Link href="/practice">Review</Link>
          <Link href="/assessments">Assessments</Link>
          <Link href="/progress">Progress</Link>
          <Link href="/tutor">Tutor</Link>
        </nav>
        <ThemeToggle />
      </div>
    </header>
  );
}
