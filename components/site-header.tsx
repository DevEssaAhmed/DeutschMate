import Link from "next/link";
import { ThemeToggle } from "./theme-toggle";

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="shell nav-shell">
        <Link href="/" className="brand" aria-label="DeutschMate home">
          <span className="brand-mark">DM</span>
          <span><strong>DeutschMate</strong><small>Zero → C1</small></span>
        </Link>
        <nav className="main-nav" aria-label="Main navigation">
          <Link href="/learn">Learn</Link>
          <Link href="/practice">Practice</Link>
          <Link href="/vocabulary">Vocabulary</Link>
          <Link href="/grammar">Grammar</Link>
          <Link href="/progress">Progress</Link>
        </nav>
        <ThemeToggle />
      </div>
    </header>
  );
}
