export type Language = "en" | "hi";

export type LocalizedText = {
  en: string;
  hi: string;
};

export type TestMeta = {
  id: string;
  title: string;
  exam: string;
  durationMinutes: number;
  difficulty: "Easy" | "Moderate" | "Hard";
  totalQuestions: number;
  marksPerQuestion: number;
  negativeMarks: number;
  subjects: Array<{
    name: string;
    questions: number;
  }>;
};

export type Question = {
  id: string;
  subject: string;
  topic: string;
  difficulty: TestMeta["difficulty"];
  question: LocalizedText;
  options: Array<{
    id: string;
    text: LocalizedText;
  }>;
  correctOptionId: string;
  explanation: LocalizedText;
};

export type ExamTest = {
  meta: TestMeta;
  questions: Question[];
};

export type QuestionStatus = "not-visited" | "not-answered" | "answered" | "review" | "answered-review";

export type TestProgress = {
  testId: string;
  answers: Record<string, string | undefined>;
  review: Record<string, boolean>;
  visited: Record<string, boolean>;
  currentIndex: number;
  remainingSeconds: number;
  startedAt: number;
  submittedAt?: number;
};
