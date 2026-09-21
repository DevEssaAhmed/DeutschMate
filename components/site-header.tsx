"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "./theme-toggle";

const primary = [
  { href: "/", label: "Today", icon: "⌂" },
  { href: "/learn", label: "Course", icon: "▤" },
  { href: "/practice", label: "Review", icon: "↻" },
];

const skills = [
  { href: "/reading", label: "Reading", icon: "R" },
  { href: "/listening", label: "Listening", icon: "L" },
  { href: "/speaking", label: "Speaking", icon: "S" },
  { href: "/writing", label: "Writing", icon: "W" },
];

const tools = [
  { href: "/progress", label: "Progress", icon: "◎" },
  { href: "/assessments", label: "Assessments", icon: "✓" },
  { href: "/vocabulary", label: "Vocabulary", icon: "V" },
  { href: "/grammar", label: "Grammar", icon: "G" },
  { href: "/tutor", label: "AI tutor", icon: "✦" },
];

function NavLink({ href, label, icon, active }: { href: string; label: string; icon: string; active: boolean }) {
  return (
    <Link href={href} className={"sidebar-link " + (active ? "active" : "")}>
      <span className="sidebar-icon" aria-hidden>{icon}</span>
      <span>{label}</span>
    </Link>
  );
}

export function SiteHeader() {
  const pathname = usePathname();
  const isActive = (href: string) => href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <>
      <aside className="app-sidebar" aria-label="DeutschMate navigation">
        <Link href="/" className="sidebar-brand" aria-label="DeutschMate home">
          <span className="sidebar-logo">D</span>
          <span><strong>DeutschMate</strong><small>Real German, systematically.</small></span>
        </Link>

        <nav className="sidebar-nav">
          <div className="sidebar-group">
            <span className="sidebar-label">Learn</span>
            {primary.map((item) => <NavLink key={item.href} {...item} active={isActive(item.href)} />)}
          </div>

          <div className="sidebar-group">
            <span className="sidebar-label">Skills</span>
            {skills.map((item) => <NavLink key={item.href} {...item} active={isActive(item.href)} />)}
          </div>

          <div className="sidebar-group">
            <span className="sidebar-label">Tools</span>
            {tools.map((item) => <NavLink key={item.href} {...item} active={isActive(item.href)} />)}
          </div>
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <span className="user-avatar">EA</span>
            <div><strong>Essa</strong><small>German learner</small></div>
          </div>
          <ThemeToggle />
        </div>
      </aside>

      <header className="mobile-topbar">
        <Link href="/" className="mobile-brand"><span>D</span><strong>DeutschMate</strong></Link>
        <ThemeToggle />
      </header>

      <nav className="mobile-bottom-nav" aria-label="Mobile navigation">
        {[
          { href: "/", label: "Today", icon: "⌂" },
          { href: "/learn", label: "Course", icon: "▤" },
          { href: "/practice", label: "Review", icon: "↻" },
          { href: "/speaking", label: "Speak", icon: "●" },
          { href: "/progress", label: "Progress", icon: "◎" },
        ].map((item) => (
          <Link key={item.href} href={item.href} className={isActive(item.href) ? "active" : ""}>
            <span>{item.icon}</span><small>{item.label}</small>
          </Link>
        ))}
      </nav>
    </>
  );
}
