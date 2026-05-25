import type { ExamTest, TestProgress } from "@/lib/types";

export type ParserStepId = "upload" | "extract" | "ai" | "validate" | "store" | "ready";

export type ParserStepStatus = "idle" | "active" | "complete" | "error";

export type StoredTest = {
  id: string;
  title: string;
  createdAt: string;
  sourceFileName: string;
  testData: ExamTest;
  lastAttempt?: TestProgress;
  completed: boolean;
  parserConfidence: number;
};

export type StoredAttempt = {
  id: string;
  testId: string;
  testTitle: string;
  startedAt: number;
  submittedAt?: number;
  progress: TestProgress;
  score?: number;
  accuracy?: number;
};

export type AnalyticsSnapshot = {
  id: string;
  updatedAt: string;
  totalAttempts: number;
  averageAccuracy: number;
  topicAccuracy: Record<string, { correct: number; attempted: number }>;
  difficultyAccuracy: Record<string, { correct: number; attempted: number }>;
  trend: Array<{ date: string; accuracy: number; score: number }>;
};

export type UploadPipelineState = {
  fileName?: string;
  progress: number;
  currentStep: ParserStepId;
  steps: Record<ParserStepId, ParserStepStatus>;
  extractedText?: string;
  generatedTestId?: string;
  error?: string;
};
