"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { courseLessons } from "@/lib/curriculum";
import { ThemeToggle } from "./theme-toggle";
import { useProgress } from "./progress-provider";
import { foundationHref, foundationLessons, recommendedFoundation } from "@/lib/foundations";

const primary = [
  { href: "/", label: "Today", icon: "☀" },
  { href: "/learn", label: "Course", icon: "◫" },
  { href: "/practice", label: "Review", icon: "↻" },
];

const skills = [
  { href: "/reading", label: "Reading", icon: "▤" },
  { href: "/listening", label: "Listening", icon: "♫" },
  { href: "/speaking", label: "Speaking", icon: "◉" },
  { href: "/writing", label: "Writing", icon: "✎" },
];

const resources = [
  { href: "/vocabulary", label: "Vocabulary", icon: "Aa" },
  { href: "/grammar", label: "Grammar", icon: "≡" },
  { href: "/assessments", label: "Assessments", icon: "✓" },
  { href: "/progress", label: "Progress", icon: "◎" },
];

const levelNames = {
  A1: "Foundations",
  A2: "Everyday German",
  B1: "Independent use",
  B2: "Confident expression",
  C1: "Advanced command",
};

function NavLink({
  href,
  label,
  icon,
  active,
  current,
  badge,
}: {
  href: string;
  label: string;
  icon: string;
  active: boolean;
  current?: boolean;
  badge?: number;
}) {
  return (
    <Link href={href} className={"sidebar-link " + (active ? "active" : "")} aria-current={current ? "page" : undefined}>
      <span className="sidebar-icon" aria-hidden>{icon}</span>
      <span>{label}</span>
      {badge !== undefined && badge > 0 && <span className="sidebar-badge">{badge}</span>}
    </Link>
  );
}

export function SiteHeader() {
  const pathname = usePathname();
  const progress = useProgress();
  const isActive = (href: string) => href === "/" ? pathname === "/" : pathname.startsWith(href);
  const name = progress.userName || "Essa";
  const initials = name.slice(0, 2).toUpperCase();
  const completed = new Set(progress.completedLessons);
  const courseComplete = completed.size === courseLessons.length;
  const lastLesson = courseLessons.find((lesson) => lesson.id === progress.lastLessonId);
  const nextLesson = lastLesson && !completed.has(lastLesson.id)
    ? lastLesson
    : courseLessons.find((lesson) => !completed.has(lesson.id)) ?? courseLessons[courseLessons.length - 1];
  const foundation = recommendedFoundation(progress.completedFoundations, progress.completedLessons, progress.lastLessonId);
  const lessonHref = foundation ? foundationHref(foundation) : courseComplete ? "/assessments" : "/learn/" + nextLesson.level.toLowerCase() + "/" + nextLesson.moduleSlug + "/" + nextLesson.slug;
  const completedCount = foundation ? progress.completedFoundations.length : progress.completedLessons.length;
  const totalCount = foundation ? foundationLessons.length : courseLessons.length;
  const pathLabel = foundation ? "Start from zero" : levelNames[nextLesson.level];
  const pathCode = foundation ? "Aa" : nextLesson.level;
  const mobileGroups = [
    { label: "Learn", items: primary },
    { label: "Skills", items: skills },
    { label: "More", items: [{ href: "/tutor", label: "AI tutor", icon: "✦" }, ...resources] },
  ];

  return (
    <>
      <aside className="app-sidebar" aria-label="DeutschMate navigation">
        <Link href="/" className="sidebar-brand" aria-label="DeutschMate home">
          <span className="sidebar-logo">D</span>
          <span><strong>DeutschMate</strong><small>German, one step at a time</small></span>
        </Link>

        <nav className="sidebar-nav" aria-label="Course navigation">
          <div className="sidebar-group">
            <span className="sidebar-label">Your learning</span>
            {primary.map((item) => <NavLink key={item.href} {...item} active={isActive(item.href)} current={pathname === item.href} badge={item.href === "/practice" ? progress.dueReviews : undefined} />)}
          </div>

          <div className="sidebar-group">
            <span className="sidebar-label">Build your skills</span>
            {skills.map((item) => <NavLink key={item.href} {...item} active={isActive(item.href)} current={pathname === item.href} />)}
          </div>

          <NavLink href="/tutor" label="AI tutor" icon="✦" active={isActive("/tutor")} current={pathname === "/tutor"} />

          <details key={pathname} className="sidebar-more" open={resources.some((item) => isActive(item.href)) || undefined}>
            <summary><span className="sidebar-icon" aria-hidden>⋯</span><span>More to explore</span><span className="sidebar-more-arrow" aria-hidden>⌄</span></summary>
            <div className="sidebar-more-links">
              {resources.map((item) => <NavLink key={item.href} {...item} active={isActive(item.href)} current={pathname === item.href} />)}
            </div>
          </details>
        </nav>

        <div className="sidebar-path">
          <span className="sidebar-label">Your course path</span>
          <div className="sidebar-path-current">
            <span className="sidebar-path-level">{pathCode}</span>
            <div><strong>{pathLabel}</strong><small>{completedCount} of {totalCount} lessons complete</small></div>
          </div>
          <Link href={lessonHref} className="sidebar-path-link">{courseComplete ? "Open assessments" : "Continue lesson"} <span aria-hidden>→</span></Link>
        </div>

        <div className="sidebar-footer">
          <Link href="/progress" className="sidebar-user" title="Open profile & competency settings">
            <span className="user-avatar">{initials}</span>
            <div><strong>{name}</strong><small>German learner</small></div>
          </Link>
          <ThemeToggle />
        </div>
      </aside>


      <header className="mobile-topbar">
        <Link href="/" className="mobile-brand"><span>D</span><strong>DeutschMate</strong></Link>
        <div className="mobile-topbar-actions">
          <details key={pathname} className="mobile-explore" onKeyDown={(event) => {
            if (event.key === "Escape") {
              event.currentTarget.open = false;
              event.currentTarget.querySelector("summary")?.focus();
            }
          }}>
            <summary className="mobile-explore-trigger">Explore</summary>
            <nav className="mobile-explore-panel" aria-label="All destinations" onClick={(event) => {
              if (event.target instanceof Element && event.target.closest("a")) {
                const menu = event.currentTarget.closest("details");
                if (menu) menu.open = false;
              }
            }}>
              <div className="mobile-explore-course">
                <span className="level-seal">{pathCode}</span>
                <div><strong>{pathLabel}</strong><small>{completedCount}/{totalCount} lessons complete</small></div>
                <Link href={lessonHref} aria-label={courseComplete ? "Open assessments" : "Continue current lesson"}>{courseComplete ? "Assessments →" : "Continue →"}</Link>
              </div>
              {mobileGroups.map((group) => (
                <div className="mobile-explore-group" key={group.label}>
                  <span className="sidebar-label">{group.label}</span>
                  <div className="mobile-explore-links">
                    {group.items.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={isActive(item.href) ? "active" : ""}
                        aria-current={pathname === item.href ? "page" : undefined}
                      >
                        <span className="sidebar-icon" aria-hidden>{item.icon}</span>
                        <span>{item.label}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </nav>
          </details>
          <ThemeToggle />
        </div>
      </header>

      <nav className="mobile-bottom-nav" aria-label="Mobile navigation">
        {[
          { href: "/", label: "Today", icon: "☀" },
          { href: "/learn", label: "Course", icon: "◫" },
          { href: "/practice", label: "Review", icon: "↻" },
          { href: "/speaking", label: "Speak", icon: "●" },
          { href: "/progress", label: "Progress", icon: "◎" },
        ].map((item) => (
          <Link key={item.href} href={item.href} className={isActive(item.href) ? "active" : ""} aria-current={pathname === item.href ? "page" : undefined}>
            <span aria-hidden>{item.icon}</span><small>{item.label}</small>
          </Link>
        ))}
      </nav>
    </>
  );
}
