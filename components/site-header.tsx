import Link from "next/link";
import { ThemeToggle } from "./theme-toggle";

export function SiteHeader() {
  return (
    <header className="site-header app-header">
      <div className="shell nav-shell">
        <Link href="/" className="brand" aria-label="DeutschMate home">
          <span className="brand-mark">D</span>
          <span><strong>DeutschMate</strong><small>German that transfers to real life</small></span>
        </Link>
        <nav className="main-nav app-nav" aria-label="Main navigation">
          <Link href="/learn">Learn</Link>
          <Link href="/practice">Review</Link>
          <details>
            <summary>Skills</summary>
            <div className="nav-popover">
              <Link href="/reading">Reading</Link><Link href="/listening">Listening</Link>
              <Link href="/speaking">Speaking</Link><Link href="/writing">Writing</Link>
            </div>
          </details>
          <details>
            <summary>More</summary>
            <div className="nav-popover">
              <Link href="/grammar">Grammar</Link><Link href="/vocabulary">Vocabulary</Link>
              <Link href="/assessments">Assessments</Link><Link href="/progress">Progress</Link><Link href="/tutor">AI Tutor</Link>
            </div>
          </details>
        </nav>
        <ThemeToggle />
      </div>
    </header>
  );
}
