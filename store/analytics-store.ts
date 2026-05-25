"use client";

import { create } from "zustand";
import { getAnalytics, saveAnalytics } from "@/lib/db/indexedDb";
import type { AnalyticsSnapshot, StoredAttempt, StoredTest } from "@/types/generated-test";

type AnalyticsStore = {
  snapshot?: AnalyticsSnapshot;
  hydrate: () => Promise<void>;
  recompute: (tests: StoredTest[], attempts: StoredAttempt[]) => Promise<void>;
};

export const useAnalyticsStore = create<AnalyticsStore>((set) => ({
  hydrate: async () => {
    set({ snapshot: await getAnalytics() });
  },
  recompute: async (tests, attempts) => {
    const completed = attempts.filter((attempt) => attempt.submittedAt);
    const topicAccuracy: AnalyticsSnapshot["topicAccuracy"] = {};
    const difficultyAccuracy: AnalyticsSnapshot["difficultyAccuracy"] = {};

    completed.forEach((attempt) => {
      const test = tests.find((item) => item.id === attempt.testId)?.testData;
      if (!test) return;
      test.questions.forEach((question) => {
        const answer = attempt.progress.answers[question.id];
        if (!answer) return;
        const correct = answer === question.correctOptionId ? 1 : 0;
        topicAccuracy[question.topic] = topicAccuracy[question.topic] ?? { correct: 0, attempted: 0 };
        topicAccuracy[question.topic].correct += correct;
        topicAccuracy[question.topic].attempted += 1;

        difficultyAccuracy[question.difficulty] = difficultyAccuracy[question.difficulty] ?? { correct: 0, attempted: 0 };
        difficultyAccuracy[question.difficulty].correct += correct;
        difficultyAccuracy[question.difficulty].attempted += 1;
      });
    });

    const snapshot: AnalyticsSnapshot = {
      id: "global",
      updatedAt: new Date().toISOString(),
      totalAttempts: completed.length,
      averageAccuracy: average(completed.map((attempt) => attempt.accuracy ?? 0)),
      topicAccuracy,
      difficultyAccuracy,
      trend: completed.slice(0, 14).reverse().map((attempt) => ({
        date: new Date(attempt.submittedAt ?? attempt.startedAt).toLocaleDateString(),
        accuracy: attempt.accuracy ?? 0,
        score: attempt.score ?? 0,
      })),
    };
    await saveAnalytics(snapshot);
    set({ snapshot });
  },
}));

function average(values: number[]) {
  if (!values.length) return 0;
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}
