import { percent } from "./utils";
import type { ExamTest, TestProgress } from "./types";

export function calculateResult(test: ExamTest, progress: TestProgress) {
  const attempted = test.questions.filter((question) => progress.answers[question.id]);
  const correct = attempted.filter((question) => progress.answers[question.id] === question.correctOptionId);
  const wrong = attempted.length - correct.length;
  const score = correct.length * test.meta.marksPerQuestion - wrong * test.meta.negativeMarks;
  const maxScore = test.questions.length * test.meta.marksPerQuestion;
  const timeTakenSeconds = test.meta.durationMinutes * 60 - progress.remainingSeconds;

  const topicStats = test.questions.reduce<Record<string, { total: number; attempted: number; correct: number }>>(
    (stats, question) => {
      const current = stats[question.topic] ?? { total: 0, attempted: 0, correct: 0 };
      const didAttempt = Boolean(progress.answers[question.id]);
      const didCorrect = progress.answers[question.id] === question.correctOptionId;
      stats[question.topic] = {
        total: current.total + 1,
        attempted: current.attempted + (didAttempt ? 1 : 0),
        correct: current.correct + (didCorrect ? 1 : 0),
      };
      return stats;
    },
    {},
  );

  const topicWise = Object.entries(topicStats).map(([topic, stats]) => ({
    topic,
    ...stats,
    accuracy: percent(stats.correct, stats.attempted),
  }));

  const weakTopics = topicWise
    .filter((topic) => topic.attempted === 0 || topic.accuracy < 60)
    .sort((a, b) => a.accuracy - b.accuracy)
    .slice(0, 4);

  const scorePercent = percent(score, maxScore);
  const estimatedRank = Math.max(1, Math.round(22000 - scorePercent * 180));

  return {
    score,
    maxScore,
    attempted: attempted.length,
    correct: correct.length,
    wrong,
    accuracy: percent(correct.length, attempted.length),
    timeTakenSeconds,
    topicWise,
    weakTopics,
    estimatedRank,
  };
}
