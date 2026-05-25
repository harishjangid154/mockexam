import { z } from "zod";
import type { ExamTest, TestMeta } from "@/lib/types";

export const aiQuestionSchema = z.object({
  id: z.union([z.string(), z.number()]),
  type: z.literal("mcq").default("mcq"),
  subject: z.string().min(1, "Subject is required"),
  topic: z.string().min(1, "Topic is required"),
  difficulty: z.enum(["Easy", "Moderate", "Hard"]).catch("Moderate"),
  questionEnglish: z.string().min(1, "English question is required"),
  questionHindi: z.string().optional().default(""),
  options: z.object({
    A: z.string().min(1),
    B: z.string().min(1),
    C: z.string().min(1),
    D: z.string().min(1),
  }),
  correctAnswer: z.enum(["A", "B", "C", "D"]).catch("A"),
  explanation: z.string().optional().default(""),
  marks: z.number().positive().catch(2),
  negativeMarks: z.number().min(0).catch(0.5),
});

export const aiExamSchema = z
  .object({
    meta: z.object({
      title: z.string().min(1),
      exam: z.string().min(1).default("SSC CGL"),
      language: z.string().default("bilingual"),
      totalQuestions: z.number().int().positive(),
      durationInMinutes: z.number().int().positive().default(60),
    }),
    questions: z.array(aiQuestionSchema).min(1),
  })
  .superRefine((value, ctx) => {
    const ids = new Set<string>();
    value.questions.forEach((question, index) => {
      const id = String(question.id);
      if (ids.has(id)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["questions", index, "id"],
          message: `Duplicate question id: ${id}`,
        });
      }
      ids.add(id);
    });

    if (value.meta.totalQuestions !== value.questions.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["meta", "totalQuestions"],
        message: `Question count mismatch. Meta says ${value.meta.totalQuestions}, found ${value.questions.length}.`,
      });
    }
  });

export type AiExamJson = z.infer<typeof aiExamSchema>;

export function validateAiExamJson(input: unknown) {
  return aiExamSchema.safeParse(input);
}

export function aiExamToAppTest(input: AiExamJson, id: string): ExamTest {
  const subjectCounts = input.questions.reduce<Record<string, number>>((acc, question) => {
    acc[question.subject] = (acc[question.subject] ?? 0) + 1;
    return acc;
  }, {});

  const firstQuestion = input.questions[0];
  const meta: TestMeta = {
    id,
    title: input.meta.title,
    exam: input.meta.exam,
    durationMinutes: input.meta.durationInMinutes,
    difficulty: "Moderate",
    totalQuestions: input.questions.length,
    marksPerQuestion: firstQuestion?.marks ?? 2,
    negativeMarks: firstQuestion?.negativeMarks ?? 0.5,
    subjects: Object.entries(subjectCounts).map(([name, questions]) => ({ name, questions })),
  };

  return {
    meta,
    questions: input.questions.map((question, index) => ({
      id: `${id}-q${index + 1}`,
      subject: question.subject,
      topic: question.topic,
      difficulty: question.difficulty,
      question: {
        en: question.questionEnglish,
        hi: question.questionHindi || question.questionEnglish,
      },
      options: (["A", "B", "C", "D"] as const).map((optionId) => ({
        id: optionId,
        text: {
          en: question.options[optionId],
          hi: question.options[optionId],
        },
      })),
      correctOptionId: question.correctAnswer,
      explanation: {
        en: question.explanation || "Explanation not available in source.",
        hi: question.explanation || "व्याख्या स्रोत में उपलब्ध नहीं है।",
      },
    })),
  };
}

export function validateAppTest(test: ExamTest) {
  const ids = new Set<string>();
  const errors: string[] = [];

  if (test.meta.totalQuestions !== test.questions.length) {
    errors.push("Meta question count does not match questions array.");
  }

  test.questions.forEach((question, index) => {
    if (ids.has(question.id)) errors.push(`Duplicate app question id at ${index + 1}.`);
    ids.add(question.id);
    if (question.options.length !== 4) errors.push(`Question ${index + 1} must have four options.`);
    if (!question.options.some((option) => option.id === question.correctOptionId)) {
      errors.push(`Question ${index + 1} has an invalid correct option.`);
    }
  });

  return { success: errors.length === 0, errors };
}
