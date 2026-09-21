import Link from "next/link";
import { ThemeToggle } from "./theme-toggle";

export function SiteHeader() {
  return (
    <header className="site-header dm-header">
      <div className="shell nav-shell dm-nav-shell">
        <Link href="/" className="brand dm-brand" aria-label="DeutschMate home">
          <span className="brand-mark dm-brand-mark">D</span>
          <span><strong>DeutschMate</strong><small>Real German. A brighter you.</small></span>
        </Link>
        <nav className="main-nav dm-main-nav" aria-label="Main navigation">
          <Link href="/">Home</Link>
          <Link href="/learn">Learn</Link>
          <Link href="/practice">Practice</Link>
          <Link href="/progress">Progress</Link>
          <Link href="/vocabulary">Library</Link>
        </nav>
        <div className="dm-header-tools">
          <Link href="/tutor" className="dm-search-button" aria-label="Open AI tutor">⌕</Link>
          <Link href="/progress" className="dm-avatar" aria-label="Open progress">EA</Link>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
