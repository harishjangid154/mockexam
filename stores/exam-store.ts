"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ExamTest, Language, QuestionStatus, TestProgress } from "@/lib/types";

type ExamState = {
  language: Language;
  progressByTest: Record<string, TestProgress>;
  setLanguage: (language: Language) => void;
  startOrResume: (test: ExamTest) => void;
  visitQuestion: (testId: string, questionId: string, index: number) => void;
  answerQuestion: (testId: string, questionId: string, optionId: string) => void;
  clearAnswer: (testId: string, questionId: string) => void;
  markReview: (testId: string, questionId: string) => void;
  unmarkReview: (testId: string, questionId: string) => void;
  setRemainingSeconds: (testId: string, seconds: number) => void;
  submitTest: (testId: string) => void;
  resetTest: (testId: string) => void;
};

const emptyProgress = (test: ExamTest): TestProgress => ({
  testId: test.meta.id,
  answers: {},
  review: {},
  visited: {},
  currentIndex: 0,
  remainingSeconds: test.meta.durationMinutes * 60,
  startedAt: Date.now(),
});

export const useExamStore = create<ExamState>()(
  persist(
    (set) => ({
      language: "en",
      progressByTest: {},
      setLanguage: (language) => set({ language }),
      startOrResume: (test) =>
        set((state) => {
          if (state.progressByTest[test.meta.id]) return state;
          return {
            progressByTest: {
              ...state.progressByTest,
              [test.meta.id]: {
                ...emptyProgress(test),
                visited: test.questions[0] ? { [test.questions[0].id]: true } : {},
              },
            },
          };
        }),
      visitQuestion: (testId, questionId, index) =>
        set((state) => {
          const progress = state.progressByTest[testId];
          if (!progress || progress.submittedAt) return state;
          if (progress.currentIndex === index && progress.visited[questionId]) return state;
          return {
            progressByTest: {
              ...state.progressByTest,
              [testId]: {
                ...progress,
                currentIndex: index,
                visited: { ...progress.visited, [questionId]: true },
              },
            },
          };
        }),
      answerQuestion: (testId, questionId, optionId) =>
        set((state) => {
          const progress = state.progressByTest[testId];
          if (!progress || progress.submittedAt) return state;
          if (progress.answers[questionId] === optionId && progress.visited[questionId]) return state;
          return {
            progressByTest: {
              ...state.progressByTest,
              [testId]: {
                ...progress,
                answers: { ...progress.answers, [questionId]: optionId },
                visited: { ...progress.visited, [questionId]: true },
              },
            },
          };
        }),
      clearAnswer: (testId, questionId) =>
        set((state) => {
          const progress = state.progressByTest[testId];
          if (!progress || progress.submittedAt) return state;
          if (!progress.answers[questionId]) return state;
          const answers = { ...progress.answers };
          delete answers[questionId];
          return {
            progressByTest: {
              ...state.progressByTest,
              [testId]: { ...progress, answers },
            },
          };
        }),
      markReview: (testId, questionId) =>
        set((state) => {
          const progress = state.progressByTest[testId];
          if (!progress || progress.submittedAt) return state;
          if (progress.review[questionId] && progress.visited[questionId]) return state;
          return {
            progressByTest: {
              ...state.progressByTest,
              [testId]: {
                ...progress,
                review: { ...progress.review, [questionId]: true },
                visited: { ...progress.visited, [questionId]: true },
              },
            },
          };
        }),
      unmarkReview: (testId, questionId) =>
        set((state) => {
          const progress = state.progressByTest[testId];
          if (!progress || progress.submittedAt) return state;
          if (!progress.review[questionId]) return state;
          const review = { ...progress.review };
          delete review[questionId];
          return {
            progressByTest: {
              ...state.progressByTest,
              [testId]: { ...progress, review },
            },
          };
        }),
      setRemainingSeconds: (testId, seconds) =>
        set((state) => {
          const progress = state.progressByTest[testId];
          if (!progress || progress.submittedAt) return state;
          if (progress.remainingSeconds === seconds) return state;
          return {
            progressByTest: {
              ...state.progressByTest,
              [testId]: { ...progress, remainingSeconds: seconds },
            },
          };
        }),
      submitTest: (testId) =>
        set((state) => {
          const progress = state.progressByTest[testId];
          if (!progress || progress.submittedAt) return state;
          return {
            progressByTest: {
              ...state.progressByTest,
              [testId]: { ...progress, submittedAt: Date.now() },
            },
          };
        }),
      resetTest: (testId) =>
        set((state) => {
          const progressByTest = { ...state.progressByTest };
          delete progressByTest[testId];
          return { progressByTest };
        }),
    }),
    { name: "ssc-exam-progress" },
  ),
);

export function getQuestionStatus(progress: TestProgress | undefined, questionId: string): QuestionStatus {
  if (!progress?.visited[questionId]) return "not-visited";
  const answered = Boolean(progress.answers[questionId]);
  const review = Boolean(progress.review[questionId]);
  if (answered && review) return "answered-review";
  if (review) return "review";
  if (answered) return "answered";
  return "not-answered";
}
