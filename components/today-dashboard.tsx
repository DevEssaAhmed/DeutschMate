"use client";

import Link from "next/link";
import { courseLessons, courseModules, levelOrder } from "@/lib/curriculum";
import type { LevelId } from "@/lib/types";
import { useProgress } from "./progress-provider";
import { foundationLessons, foundationHref, recommendedFoundation } from "@/lib/foundations";
import styles from "./today-dashboard.module.css";

const levelNames: Record<LevelId, string> = {
  A1: "First words",
  A2: "Everyday life",
  B1: "Finding your voice",
  B2: "Confident ideas",
  C1: "Expert expression",
};

const levelPhrases: Record<LevelId, [string, string]> = {
  A1: ["Hallo!", "Ich heiße …"],
  A2: ["Was hast du vor?", "Ich möchte …"],
  B1: ["Meiner Meinung nach …", "Der Grund dafür ist …"],
  B2: ["Es spricht vieles dafür …", "Andererseits …"],
  C1: ["Daraus lässt sich schließen …", "Entscheidend ist …"],
};

const dayNames = ["S", "M", "T", "W", "T", "F", "S"];

function lastSevenDays() {
  const today = new Date();
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (6 - index));
    return { key: date.toISOString().slice(0, 10), label: dayNames[date.getDay()] };
  });
}

function sentence(value: string) {
  const text = value.trim();
  if (!text) return text;
  const capitalized = text[0].toUpperCase() + text.slice(1);
  return /[.!?]$/.test(capitalized) ? capitalized : capitalized + ".";
}

export function TodayDashboard() {
  const progress = useProgress();
  const completed = new Set(progress.completedLessons);
  const foundation = recommendedFoundation(progress.completedFoundations, progress.completedLessons, progress.lastLessonId);
  const courseComplete = !foundation && courseLessons.every((lesson) => completed.has(lesson.id));
  const lastLesson = courseLessons.find((lesson) => lesson.id === progress.lastLessonId);
  const nextLesson = courseComplete
    ? courseLessons[courseLessons.length - 1]
    : lastLesson && !completed.has(lastLesson.id)
      ? lastLesson
      : courseLessons.find((lesson) => !completed.has(lesson.id)) ?? courseLessons[0];
  const currentModule = courseModules.find((item) => item.level === nextLesson.level && item.slug === nextLesson.moduleSlug)!;
  const nextHref = foundation ? foundationHref(foundation) : courseComplete ? "/assessments" : "/learn/" + nextLesson.level.toLowerCase() + "/" + nextLesson.moduleSlug + "/" + nextLesson.slug;
  const levelLessons = courseLessons.filter((lesson) => lesson.level === nextLesson.level);
  const levelDone = levelLessons.filter((lesson) => completed.has(lesson.id)).length;
  const moduleDone = currentModule.lessons.filter((lesson) => completed.has(lesson.id)).length;
  const levelProgress = Math.round((levelDone / levelLessons.length) * 100);
  const newLearner = completed.size === 0 && progress.completedFoundations.length === 0;
  const studiedDays = new Set(progress.studyDates);
  const phrase = foundation ? ["Aa Bb Cc", "One small step."] : levelPhrases[nextLesson.level];
  const lessonMinutes = foundation?.minutes ?? nextLesson.durationMinutes;
  const currentDone = foundation ? progress.completedFoundations.length : moduleDone;
  const currentTotal = foundation ? foundationLessons.length : currentModule.lessons.length;

  return (
    <main className={styles.page}>
      <header className={styles.welcome}>
        <div>
          <span className={styles.eyebrow}>YOUR GERMAN JOURNEY</span>
          <h1>Hallo{progress.userName ? ", " + progress.userName : ""}! <span aria-hidden="true">👋</span></h1>
          <p>{newLearner
            ? "Start with the alphabet. Every word and conversation grows from here."
            : courseComplete
              ? "You have reached C1. Keep your German active with fresh challenges."
              : "A little focused practice today builds the German you will use tomorrow."}</p>
        </div>
        <Link href="/tutor" className={styles.tutorLink}>Ask your AI tutor <span aria-hidden="true">✦</span></Link>
      </header>

      <section className={styles.hero} aria-labelledby="next-lesson-title">
        <div className={styles.heroContent}>
          <div className={styles.heroTopline}>
            <span className={styles.heroBadge}>{courseComplete ? "COURSE COMPLETE" : newLearner ? "START HERE" : "NEXT LESSON"}</span>
            <span>{foundation ? `Foundations · Lesson ${foundationLessons.indexOf(foundation) + 1}` : `${nextLesson.level} · Module ${nextLesson.moduleIndex}`} · {lessonMinutes} min</span>
          </div>
          <p className={styles.compactPhrase} lang="de"><strong>{phrase[0]}</strong><span>{phrase[1]}</span></p>
          <h2 id="next-lesson-title">{foundation ? foundation.title : courseComplete ? "You made it to C1." : currentModule.title}</h2>
          <p className={styles.heroLead}>{courseComplete
            ? "Put your skills to work in an integrated level assessment."
            : foundation
              ? foundation.goal
              : sentence(nextLesson.objectives[0])}</p>
          <p className={styles.heroScenario}>{courseComplete
            ? "Your next chapter is real conversations, books, ideas and people."
            : foundation
              ? "One teaching card at a time, with English explanations, German audio and guided practice."
              : sentence(nextLesson.scenario)}</p>
          <div className={styles.heroActions}>
            <Link href={nextHref} className={styles.primaryAction}>
              {courseComplete ? "Explore assessments" : newLearner ? "Begin your first lesson" : "Continue learning"}
              <span aria-hidden="true">→</span>
            </Link>
            <Link href="/learn" className={styles.secondaryAction}>Explore the course</Link>
          </div>
          <div className={styles.heroProgress}>
            <div><span>{foundation ? "Foundation progress" : courseComplete ? "All chapters complete" : "Chapter " + nextLesson.moduleIndex + " progress"}</span><strong>{currentDone} / {currentTotal} lessons</strong></div>
            <div className={styles.progressTrack} role="progressbar" aria-label="Current module progress" aria-valuemin={0} aria-valuemax={currentTotal} aria-valuenow={currentDone}>
              <span style={{ width: Math.round((currentDone / currentTotal) * 100) + "%" }} />
            </div>
          </div>
        </div>
        <div className={styles.heroArt} aria-hidden="true">
          <span className={styles.sun} />
          <span className={styles.orbitOne} />
          <span className={styles.orbitTwo} />
          <div className={styles.phraseCardOne}><small>REAL GERMAN, ONE STEP AT A TIME</small><strong lang="de">{phrase[0]}</strong></div>
          <div className={styles.phraseCardTwo}><strong lang="de">{phrase[1]}</strong><span>✦</span></div>
          <span className={styles.heroSparkle}>✳</span>
        </div>
      </section>

      <section className={styles.journey} aria-labelledby="journey-title">
        <div className={styles.sectionHeading}>
          <div><span className={styles.eyebrow}>THE BIG PICTURE</span><h2 id="journey-title">From the alphabet to fluent ideas</h2></div>
          <Link href="/learn">See the full path <span aria-hidden="true">→</span></Link>
        </div>
        <div className={styles.levelPath}>
          {levelOrder.map((level, index) => {
            const finished = courseLessons.filter((lesson) => lesson.level === level).every((lesson) => completed.has(lesson.id));
            const current = !foundation && level === nextLesson.level;
            return (
              <div key={level} className={[styles.levelStep, current ? styles.currentLevel : "", finished ? styles.finishedLevel : ""].join(" ")}>
                <span className={styles.levelNumber}>0{index + 1}</span>
                <span className={styles.levelCode}>{finished ? "✓" : level}</span>
                <span className={styles.levelLabel}><strong>{level}</strong><small>{levelNames[level]}</small></span>
                {current && <span className={styles.youAreHere}>YOU ARE HERE</span>}
              </div>
            );
          })}
        </div>
      </section>

      <section className={styles.plan} aria-labelledby="plan-title">
        <div className={styles.sectionHeading}>
          <div><span className={styles.eyebrow}>TODAY&apos;S PLAN</span><h2 id="plan-title">{newLearner ? "Your first three steps" : "Make today count"}</h2></div>
          <span className={styles.timeEstimate}>About {foundation ? lessonMinutes : lessonMinutes + 20} minutes</span>
        </div>
        <div className={styles.planGrid}>
          <Link href={nextHref} className={[styles.planCard, styles.planOne].join(" ")}>
            <span className={styles.planNumber}>01</span><span className={styles.planIcon} aria-hidden="true">✍</span>
            <small>LEARN</small><strong>{foundation ? "Meet one small idea" : "Continue " + currentModule.title}</strong>
            <p>{foundation ? "Start with a teaching card. Understand it in English and hear it in German." : "Build understanding, practise, then use the language yourself."}</p>
            <span className={styles.planBottom}>{foundation ? "Learn" : lessonMinutes + " min"} <b aria-hidden="true">↗</b></span>
          </Link>
          <Link href={foundation ? nextHref : "/practice"} className={[styles.planCard, styles.planTwo].join(" ")}>
            <span className={styles.planNumber}>02</span><span className={styles.planIcon} aria-hidden="true">♫</span>
            <small>{foundation ? "PRACTISE" : "RECALL"}</small>
            <strong>{foundation ? "Listen, recognise, repeat" : progress.dueReviews ? progress.dueReviews + " words ready to review" : "Keep useful words fresh"}</strong>
            <p>{foundation ? "Try three guided tasks. Get an explanation and another try when you need it." : "Remember words actively before revealing the answer."}</p>
            <span className={styles.planBottom}>{foundation ? "Practise" : "10 min"} <b aria-hidden="true">↗</b></span>
          </Link>
          <Link href={foundation ? nextHref : "/speaking"} className={[styles.planCard, styles.planThree].join(" ")}>
            <span className={styles.planNumber}>03</span><span className={styles.planIcon} aria-hidden="true">✦</span>
            <small>{foundation ? "TRY IT" : "USE IT"}</small>
            <strong>{foundation ? "See what you remember" : "Speak without a script"}</strong>
            <p>{foundation ? "Write a tiny answer, then review what you learned in a short checkpoint." : "Turn familiar language into your own answer."}</p>
            <span className={styles.planBottom}>{foundation ? "Review" : "10 min"} <b aria-hidden="true">↗</b></span>
          </Link>
        </div>
      </section>

      <div className={styles.lowerGrid}>
        <section className={styles.skillSection} aria-labelledby="skills-title">
          <div className={styles.sectionHeading}><div><span className={styles.eyebrow}>PRACTISE YOUR WAY</span><h2 id="skills-title">Build every skill</h2></div></div>
          <div className={styles.skillGrid}>
            {[
              { href: "/reading", icon: "▤", title: "Reading", detail: "Stories, articles and ideas", theme: styles.reading },
              { href: "/listening", icon: "♫", title: "Listening", detail: "Hear the real rhythm", theme: styles.listening },
              { href: "/speaking", icon: "◉", title: "Speaking", detail: "Find your own words", theme: styles.speaking },
              { href: "/writing", icon: "✎", title: "Writing", detail: "Express yourself clearly", theme: styles.writing },
            ].map((skill) => (
              <Link href={skill.href} className={[styles.skillCard, skill.theme].join(" ")} key={skill.href}>
                <span className={styles.skillIcon} aria-hidden="true">{skill.icon}</span>
                <span><strong>{skill.title}</strong><small>{skill.detail}</small></span>
                <b aria-hidden="true">→</b>
              </Link>
            ))}
          </div>
        </section>
        <aside className={styles.progressPanel} aria-label="Your progress">
          <span className={styles.eyebrow}>YOUR CURRENT CHAPTER</span>
          <div className={styles.progressTitle} data-level={nextLesson.level}><span>{foundation ? "Aa" : nextLesson.level}</span><div><strong>{foundation ? "Start from zero" : levelNames[nextLesson.level]}</strong><small>{foundation ? currentDone : levelDone} of {foundation ? currentTotal : levelLessons.length} lessons</small></div></div>
          <div className={styles.progressTrack} role="progressbar" aria-label={foundation ? "Foundation progress" : nextLesson.level + " lesson progress"} aria-valuemin={0} aria-valuemax={foundation ? currentTotal : levelLessons.length} aria-valuenow={foundation ? currentDone : levelDone}>
            <span style={{ width: (foundation ? currentDone / currentTotal * 100 : levelProgress) + "%" }} />
          </div>
          <Link href="/progress">See what you can do <span aria-hidden="true">→</span></Link>
          <div className={styles.habit}>
            <strong>Keep a gentle rhythm</strong>
            <div className={styles.days} aria-label={progress.streak + " day study streak"}>
              {lastSevenDays().map((day, index) => <span key={day.key + "-" + index} className={studiedDays.has(day.key) ? styles.studied : ""}><small>{day.label}</small><i /></span>)}
            </div>
            <small>{progress.streak > 0 ? progress.streak + " day streak. Every session adds up." : "Start today. Every session adds up."}</small>
          </div>
        </aside>
      </div>
    </main>
  );
}
