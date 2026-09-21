"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { courseData } from "@/lib/course";

type QuizResult = { score: number; total: number; best: number; attempts: number };
type ProgressState = {
  completed: number[];
  quizResults: Record<string, QuizResult>;
  studyDates: string[];
  lastUnitId?: number;
  dailyGoal: number;
};

type ProgressContextValue = ProgressState & {
  ready: boolean;
  percent: number;
  streak: number;
  markComplete: (id: number, completed?: boolean) => void;
  recordQuiz: (unitId: number, score: number, total: number) => void;
  touchStudyDay: () => void;
  setLastUnit: (id: number) => void;
  setDailyGoal: (minutes: number) => void;
  resetProgress: () => void;
};

const KEY = "deutschmate-progress-v1";
const initial: ProgressState = { completed: [], quizResults: {}, studyDates: [], dailyGoal: 25 };
const ProgressContext = createContext<ProgressContextValue | null>(null);
const VALID_GOALS = [15, 25, 40, 60] as const;

function todayKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

function calculateStreak(dates: string[]) {
  const set = new Set(dates);
  let streak = 0;
  const cursor = new Date();
  while (set.has(todayKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

function sanitizeProgress(raw: unknown): ProgressState {
  if (!raw || typeof raw !== "object") return initial;
  const parsed = raw as Partial<ProgressState>;

  const completed = Array.isArray(parsed.completed)
    ? [...new Set(parsed.completed.filter((id): id is number => Number.isInteger(id) && id > 0))].sort((a, b) => a - b)
    : [];
  const studyDates = Array.isArray(parsed.studyDates)
    ? [...new Set(parsed.studyDates.filter((date): date is string => /^\d{4}-\d{2}-\d{2}$/.test(date)))].slice(-120)
    : [];
  const quizResults = parsed.quizResults && typeof parsed.quizResults === "object"
    ? Object.fromEntries(
        Object.entries(parsed.quizResults).flatMap(([unitId, result]) => {
          if (!result || typeof result !== "object") return [];
          const candidate = result as Partial<QuizResult>;
          if (![candidate.score, candidate.total, candidate.best, candidate.attempts].every((value) => typeof value === "number" && Number.isFinite(value))) return [];
          const total = Math.max(0, Math.trunc(candidate.total ?? 0));
          const score = Math.max(0, Math.min(total, Math.trunc(candidate.score ?? 0)));
          const best = Math.max(score, Math.min(total, Math.trunc(candidate.best ?? 0)));
          const attempts = Math.max(1, Math.trunc(candidate.attempts ?? 1));
          return [[unitId, { score, total, best, attempts }]];
        }),
      )
    : {};
  const lastUnitId = Number.isInteger(parsed.lastUnitId) && (parsed.lastUnitId as number) > 0 ? parsed.lastUnitId : undefined;
  const dailyGoalCandidate = typeof parsed.dailyGoal === "number" ? Math.trunc(parsed.dailyGoal) : initial.dailyGoal;
  const dailyGoal = (VALID_GOALS as readonly number[]).includes(dailyGoalCandidate) ? dailyGoalCandidate : initial.dailyGoal;

  return { completed, quizResults, studyDates, lastUnitId, dailyGoal };
}

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ProgressState>(initial);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(KEY);
      if (saved) setState(sanitizeProgress(JSON.parse(saved)));
    } catch {}
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    window.localStorage.setItem(KEY, JSON.stringify(state));
  }, [ready, state]);

  const touchStudyDay = useCallback(() => {
    const today = todayKey();
    setState((prev) => ({
      ...prev,
      studyDates: prev.studyDates.includes(today) ? prev.studyDates : [...prev.studyDates, today].slice(-120),
    }));
  }, []);

  const markComplete = useCallback((id: number, completed = true) => {
    setState((prev) => {
      const set = new Set(prev.completed);
      if (completed) set.add(id); else set.delete(id);
      return { ...prev, completed: [...set].sort((a, b) => a - b), lastUnitId: id };
    });
    touchStudyDay();
  }, [touchStudyDay]);

  const recordQuiz = useCallback((unitId: number, score: number, total: number) => {
    setState((prev) => {
      const key = String(unitId);
      const prior = prev.quizResults[key];
      const best = Math.max(score, prior?.best ?? 0);
      return {
        ...prev,
        quizResults: {
          ...prev.quizResults,
          [key]: { score, total, best, attempts: (prior?.attempts ?? 0) + 1 },
        },
        lastUnitId: unitId,
      };
    });
    touchStudyDay();
  }, [touchStudyDay]);

  const setLastUnit = useCallback((id: number) => setState((prev) => ({ ...prev, lastUnitId: id })), []);
  const setDailyGoal = useCallback((dailyGoal: number) => {
    if (!(VALID_GOALS as readonly number[]).includes(dailyGoal)) return;
    setState((prev) => ({ ...prev, dailyGoal }));
  }, []);
  const resetProgress = useCallback(() => setState(initial), []);

  const value = useMemo<ProgressContextValue>(() => ({
    ...state,
    ready,
    percent: Math.round((state.completed.length / courseData.units.length) * 100),
    streak: calculateStreak(state.studyDates),
    markComplete,
    recordQuiz,
    touchStudyDay,
    setLastUnit,
    setDailyGoal,
    resetProgress,
  }), [state, ready, markComplete, recordQuiz, touchStudyDay, setLastUnit, setDailyGoal, resetProgress]);

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}

export function useProgress() {
  const context = useContext(ProgressContext);
  if (!context) throw new Error("useProgress must be used inside ProgressProvider");
  return context;
}
