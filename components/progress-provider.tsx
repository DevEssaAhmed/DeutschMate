"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { courseLessons, courseModules } from "@/lib/curriculum";
import { foundationCompletion, foundationLessons } from "@/lib/foundations";
import type { FoundationEvidence } from "@/lib/foundations";
import type { LevelId } from "@/lib/types";

type LessonResult = { score: number; total: number; best: number; attempts: number };
type ReviewState = { strength: number; intervalDays: number; due: string; reviews: number };
type AssessmentResult = { score: number; total: number; completedAt: string };

type ProgressState = {
  userName?: string;
  completedLessons: string[];
  completedFoundations: string[];
  lessonResults: Record<string, LessonResult>;
  competencyEvidence: Record<string, number>;
  review: Record<string, ReviewState>;
  studyDates: string[];
  lastLessonId?: string;
  dailyGoal: number;
  assessments: Partial<Record<LevelId, AssessmentResult>>;
};

type ProgressContextValue = ProgressState & {
  ready: boolean;
  percent: number;
  streak: number;
  dueReviews: number;
  completeLesson: (lessonId: string, score: number, total: number, competencyIds: string[]) => void;
  completeFoundation: (lessonId: string, evidence: FoundationEvidence) => void;
  recordLessonScore: (lessonId: string, score: number, total: number) => void;
  rateVocabulary: (key: string, rating: "again" | "hard" | "good" | "easy") => void;
  recordAssessment: (level: LevelId, score: number, total: number, competencyIds: string[]) => void;
  touchStudyDay: () => void;
  setLastLesson: (id: string) => void;
  setDailyGoal: (minutes: number) => void;
  setUserName: (name: string) => void;
  exportProgress: () => string;
  importProgress: (jsonString: string) => { success: boolean; error?: string };
  resetProgress: () => void;
};

const KEY = "deutschmate-progress-v2";
const LEGACY_KEY = "deutschmate-progress-v1";
const initial: ProgressState = {
  userName: "Essa",
  completedLessons: [],
  completedFoundations: [],
  lessonResults: {},
  competencyEvidence: {},
  review: {},
  studyDates: [],
  dailyGoal: 25,
  assessments: {},
};


const ProgressContext = createContext<ProgressContextValue | null>(null);
const VALID_GOALS = [15, 25, 40, 60] as const;

function dayKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

function addDays(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return dayKey(date);
}

function calculateStreak(dates: string[]) {
  const set = new Set(dates);
  let streak = 0;
  const cursor = new Date();
  if (!set.has(dayKey(cursor))) cursor.setDate(cursor.getDate() - 1);
  while (set.has(dayKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

function migrateLegacy(raw: any): ProgressState {
  if (!raw || typeof raw !== "object") return initial;
  const completedIds = Array.isArray(raw.completed) ? raw.completed.filter(Number.isInteger) as number[] : [];
  const completedLessons = new Set<string>();
  const levels = ["A1","A2","B1","B2","C1"] as const;

  for (const unitId of completedIds) {
    const levelIndex = Math.max(0, Math.min(4, Math.floor((unitId - 1) / 8)));
    const localIndex = Math.max(0, (unitId - 1) % 8);
    const levelModules = courseModules.filter((module) => module.level === levels[levelIndex]);
    const moduleIndex = Math.min(levelModules.length - 1, Math.round((localIndex / 7) * (levelModules.length - 1)));
    levelModules[moduleIndex]?.lessons.slice(0, 2).forEach((lesson) => completedLessons.add(lesson.id));
  }

  return {
    ...initial,
    completedLessons: [...completedLessons],
    studyDates: Array.isArray(raw.studyDates) ? raw.studyDates.filter((item: unknown) => typeof item === "string") : [],
    dailyGoal: (VALID_GOALS as readonly number[]).includes(raw.dailyGoal) ? raw.dailyGoal : 25,
  };
}

function sanitize(raw: unknown): ProgressState {
  if (!raw || typeof raw !== "object") return initial;
  const value = raw as Partial<ProgressState>;
  return {
    userName: typeof value.userName === "string" && value.userName.trim() ? value.userName.trim().slice(0, 40) : "Essa",
    completedLessons: Array.isArray(value.completedLessons)
      ? [...new Set(value.completedLessons.filter((id): id is string => typeof id === "string" && courseLessons.some((lesson) => lesson.id === id)))]
      : [],
    completedFoundations: Array.isArray(value.completedFoundations)
      ? [...new Set(value.completedFoundations.filter((id): id is string => typeof id === "string" && foundationLessons.some((lesson) => lesson.id === id)))]
      : [],
    lessonResults: value.lessonResults && typeof value.lessonResults === "object" ? value.lessonResults : {},
    competencyEvidence: value.competencyEvidence && typeof value.competencyEvidence === "object" ? value.competencyEvidence : {},
    review: value.review && typeof value.review === "object" ? value.review : {},
    studyDates: Array.isArray(value.studyDates)
      ? [...new Set(value.studyDates.filter((date): date is string => /^\d{4}-\d{2}-\d{2}$/.test(date)))].slice(-365)
      : [],
    lastLessonId: typeof value.lastLessonId === "string" ? value.lastLessonId : undefined,
    dailyGoal: (VALID_GOALS as readonly number[]).includes(value.dailyGoal ?? 25) ? value.dailyGoal ?? 25 : 25,
    assessments: value.assessments && typeof value.assessments === "object" ? value.assessments : {},
  };
}


export function vocabularyKey(level: LevelId, de: string) {
  return level + ":" + de.toLowerCase();
}

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ProgressState>(initial);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(KEY);
      if (saved) setState(sanitize(JSON.parse(saved)));
      else {
        const legacy = window.localStorage.getItem(LEGACY_KEY);
        if (legacy) setState(migrateLegacy(JSON.parse(legacy)));
      }
    } catch {}
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    window.localStorage.setItem(KEY, JSON.stringify(state));
  }, [ready, state]);

  const touchStudyDay = useCallback(() => {
    const today = dayKey();
    setState((prev) => ({
      ...prev,
      studyDates: prev.studyDates.includes(today) ? prev.studyDates : [...prev.studyDates, today].slice(-365),
    }));
  }, []);

  const recordLessonScore = useCallback((lessonId: string, score: number, total: number) => {
    setState((prev) => {
      const prior = prev.lessonResults[lessonId];
      return {
        ...prev,
        lessonResults: {
          ...prev.lessonResults,
          [lessonId]: { score, total, best: Math.max(score, prior?.best ?? 0), attempts: (prior?.attempts ?? 0) + 1 },
        },
        lastLessonId: lessonId,
      };
    });
    touchStudyDay();
  }, [touchStudyDay]);

  const completeLesson = useCallback((lessonId: string, score: number, total: number, competencyIds: string[]) => {
    const lesson = courseLessons.find((item) => item.id === lessonId);
    if (!lesson || total !== lesson.checkpoint.length || total < 1 || !Number.isInteger(score) || score < Math.ceil((total * 2) / 3) || score > total) return;
    setState((prev) => {
      if (prev.completedLessons.includes(lessonId)) return prev;
      const prior = prev.lessonResults[lessonId];
      const completed = new Set(prev.completedLessons);
      completed.add(lessonId);
      const evidence = { ...prev.competencyEvidence };
      competencyIds.forEach((id) => { evidence[id] = (evidence[id] ?? 0) + 1; });
      return {
        ...prev,
        completedLessons: [...completed],
        lessonResults: {
          ...prev.lessonResults,
          [lessonId]: { score, total, best: Math.max(score, prior?.best ?? 0), attempts: (prior?.attempts ?? 0) + 1 },
        },
        competencyEvidence: evidence,
        lastLessonId: lessonId,
      };
    });
    touchStudyDay();
  }, [touchStudyDay]);

  const completeFoundation = useCallback((lessonId: string, evidence: FoundationEvidence) => {
    const lesson = foundationLessons.find((item) => item.id === lessonId);
    if (!lesson || !foundationCompletion(lesson, evidence).complete) return;
    setState((previous) => previous.completedFoundations.includes(lessonId) ? previous : {
      ...previous,
      completedFoundations: [...previous.completedFoundations, lessonId],
      lastLessonId: lessonId,
    });
    touchStudyDay();
  }, [touchStudyDay]);

  const rateVocabulary = useCallback((key: string, rating: "again" | "hard" | "good" | "easy") => {
    setState((prev) => {
      const prior = prev.review[key] ?? { strength: 0, intervalDays: 0, due: dayKey(), reviews: 0 };
      const delta = rating === "again" ? -2 : rating === "hard" ? 0 : rating === "good" ? 1 : 2;
      const strength = Math.max(0, Math.min(8, prior.strength + delta));
      const intervalDays =
        rating === "again" ? 0 :
        rating === "hard" ? Math.max(1, Math.round(Math.max(prior.intervalDays, 1) * 1.3)) :
        rating === "good" ? Math.max(2, Math.round(Math.max(prior.intervalDays, 1) * 2.1)) :
        Math.max(4, Math.round(Math.max(prior.intervalDays, 2) * 3.2));
      return {
        ...prev,
        review: {
          ...prev.review,
          [key]: { strength, intervalDays, due: addDays(intervalDays), reviews: prior.reviews + 1 },
        },
      };
    });
    touchStudyDay();
  }, [touchStudyDay]);

  const recordAssessment = useCallback((level: LevelId, score: number, total: number, competencyIds: string[]) => {
    setState((prev) => {
      const evidence = { ...prev.competencyEvidence };
      const passed = total > 0 && score / total >= 0.7;
      if (passed) competencyIds.forEach((id) => { evidence[id] = Math.max(2, evidence[id] ?? 0); });
      return {
        ...prev,
        assessments: { ...prev.assessments, [level]: { score, total, completedAt: new Date().toISOString() } },
        competencyEvidence: evidence,
      };
    });
    touchStudyDay();
  }, [touchStudyDay]);

  const setLastLesson = useCallback((lastLessonId: string) => setState((prev) => ({ ...prev, lastLessonId })), []);

  const setDailyGoal = useCallback((dailyGoal: number) => {
    if (!(VALID_GOALS as readonly number[]).includes(dailyGoal)) return;
    setState((prev) => ({ ...prev, dailyGoal }));
  }, []);

  const setUserName = useCallback((userName: string) => {
    setState((prev) => ({ ...prev, userName: userName.trim().slice(0, 40) || "Essa" }));
  }, []);

  const exportProgress = useCallback(() => {
    return JSON.stringify(state, null, 2);
  }, [state]);

  const importProgress = useCallback((jsonString: string) => {
    try {
      const parsed = JSON.parse(jsonString);
      const sanitized = sanitize(parsed);
      setState(sanitized);
      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "Invalid progress backup format.",
      };
    }
  }, []);

  const resetProgress = useCallback(() => setState(initial), []);

  const dueReviews = Object.values(state.review).filter((item) => item.due <= dayKey()).length;

  const value = useMemo<ProgressContextValue>(() => ({
    ...state,
    ready,
    percent: Math.round((state.completedLessons.length / courseLessons.length) * 100),
    streak: calculateStreak(state.studyDates),
    dueReviews,
    completeLesson,
    completeFoundation,
    recordLessonScore,
    rateVocabulary,
    recordAssessment,
    touchStudyDay,
    setLastLesson,
    setDailyGoal,
    setUserName,
    exportProgress,
    importProgress,
    resetProgress,
  }), [state, ready, dueReviews, completeLesson, completeFoundation, recordLessonScore, rateVocabulary, recordAssessment, touchStudyDay, setLastLesson, setDailyGoal, setUserName, exportProgress, importProgress, resetProgress]);

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;

}

export function useProgress() {
  const context = useContext(ProgressContext);
  if (!context) throw new Error("useProgress must be used inside ProgressProvider");
  return context;
}
