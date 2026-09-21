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

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ProgressState>(initial);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(KEY);
      if (saved) setState({ ...initial, ...JSON.parse(saved) });
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
  const setDailyGoal = useCallback((dailyGoal: number) => setState((prev) => ({ ...prev, dailyGoal })), []);
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
