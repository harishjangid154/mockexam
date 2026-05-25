"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, CheckCircle2, Clock3, Eraser, Flag, Home, Languages, Send } from "lucide-react";
import { useCallback, useEffect, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MathText } from "@/components/math-text";
import { formatSeconds } from "@/lib/utils";
import type { ExamTest } from "@/lib/types";
import { getQuestionStatus, useExamStore } from "@/stores/exam-store";

const statusClass = {
  "not-visited": "bg-[hsl(var(--secondary))] text-[hsl(var(--muted-foreground))]",
  "not-answered": "bg-[hsl(var(--destructive))] text-white",
  answered: "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]",
  review: "bg-violet-500 text-white",
  "answered-review": "bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))]",
};

export function ExamShell({ test }: { test: ExamTest }) {
  const router = useRouter();
  const language = useExamStore((state) => state.language);
  const setLanguage = useExamStore((state) => state.setLanguage);
  const progress = useExamStore((state) => state.progressByTest[test.meta.id]);
  const startOrResume = useExamStore((state) => state.startOrResume);
  const visitQuestion = useExamStore((state) => state.visitQuestion);
  const answerQuestion = useExamStore((state) => state.answerQuestion);
  const clearAnswer = useExamStore((state) => state.clearAnswer);
  const markReview = useExamStore((state) => state.markReview);
  const unmarkReview = useExamStore((state) => state.unmarkReview);
  const setRemainingSeconds = useExamStore((state) => state.setRemainingSeconds);
  const submitTest = useExamStore((state) => state.submitTest);

  useEffect(() => {
    startOrResume(test);
  }, [startOrResume, test]);

  const goTo = useCallback(
    (index: number) => {
      const nextIndex = Math.min(Math.max(index, 0), test.questions.length - 1);
      const nextQuestion = test.questions[nextIndex];
      if (nextQuestion) visitQuestion(test.meta.id, nextQuestion.id, nextIndex);
    },
    [test.meta.id, test.questions, visitQuestion],
  );

  useEffect(() => {
    if (!progress || progress.submittedAt) return;
    if (progress.remainingSeconds <= 0) {
      submitTest(test.meta.id);
      router.push(`/tests/${test.meta.id}/result`);
      return;
    }
    const interval = window.setInterval(() => {
      const latest = useExamStore.getState().progressByTest[test.meta.id];
      if (!latest || latest.submittedAt) return;
      setRemainingSeconds(test.meta.id, latest.remainingSeconds - 1);
    }, 1000);
    return () => window.clearInterval(interval);
  }, [progress, router, setRemainingSeconds, submitTest, test.meta.id]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const latest = useExamStore.getState().progressByTest[test.meta.id];
      if (!latest || latest.submittedAt) return;
      const current = test.questions[latest.currentIndex];
      if (!current) return;

      if (/^[1-4]$/.test(event.key)) {
        answerQuestion(test.meta.id, current.id, current.options[Number(event.key) - 1]?.id ?? "");
      }
      if (event.key === "ArrowRight") goTo(latest.currentIndex + 1);
      if (event.key === "ArrowLeft") goTo(latest.currentIndex - 1);
      if (event.key.toLowerCase() === "m") markReview(test.meta.id, current.id);
      if (event.key.toLowerCase() === "c") clearAnswer(test.meta.id, current.id);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [answerQuestion, clearAnswer, goTo, markReview, test.meta.id, test.questions]);

  const currentIndex = progress?.currentIndex ?? 0;
  const question = test.questions[currentIndex];
  const selectedOption = progress?.answers[question?.id ?? ""];

  const counts = useMemo(() => {
    return test.questions.reduce(
      (acc, item) => {
        const status = getQuestionStatus(progress, item.id);
        acc[status] += 1;
        return acc;
      },
      {
        "not-visited": 0,
        "not-answered": 0,
        answered: 0,
        review: 0,
        "answered-review": 0,
      },
    );
  }, [progress, test.questions]);

  function saveAndNext() {
    if (!question) return;
    unmarkReview(test.meta.id, question.id);
    goTo(currentIndex + 1);
  }

  function submit() {
    submitTest(test.meta.id);
    router.push(`/tests/${test.meta.id}/result`);
  }

  if (!progress || !question) {
    return <div className="flex min-h-screen items-center justify-center text-[hsl(var(--muted-foreground))]">Loading test...</div>;
  }

  return (
    <main className="min-h-screen">
      <header className="sticky top-0 z-30 border-b bg-[hsl(var(--background))]/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <Button asChild variant="ghost" size="icon" aria-label="Back to dashboard">
              <Link href="/">
                <Home className="h-4 w-4" />
              </Link>
            </Button>
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold sm:text-base">{test.meta.title}</div>
              <div className="text-xs text-[hsl(var(--muted-foreground))]">
                Question {currentIndex + 1} of {test.questions.length}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLanguage(language === "en" ? "hi" : "en")}
              aria-label="Toggle question language"
            >
              <Languages className="h-4 w-4" />
              {language === "en" ? "English" : "Hindi"}
            </Button>
            <div className="flex h-10 items-center gap-2 rounded-md border bg-[hsl(var(--card))] px-3 font-mono text-sm">
              <Clock3 className="h-4 w-4 text-[hsl(var(--accent))]" />
              {formatSeconds(progress.remainingSeconds)}
            </div>
            <Button variant="destructive" size="sm" onClick={submit}>
              <Send className="h-4 w-4" />
              Submit
            </Button>
          </div>
        </div>
      </header>

      <section className="exam-grid mx-auto max-w-7xl gap-5 px-4 py-5 sm:px-6 lg:px-8">
        <aside className="order-2 space-y-4 lg:order-1">
          <div className="rounded-lg border bg-[hsl(var(--card))] p-4">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold">Question Palette</h2>
              <Badge>{question.subject}</Badge>
            </div>
            <div className="grid grid-cols-6 gap-2 sm:grid-cols-8 lg:grid-cols-5">
              {test.questions.map((item, index) => {
                const status = getQuestionStatus(progress, item.id);
                return (
                  <button
                    key={item.id}
                    className={`h-10 rounded-md text-sm font-semibold transition hover:scale-105 ${statusClass[status]} ${
                      index === currentIndex ? "ring-2 ring-white/80" : ""
                    }`}
                    onClick={() => goTo(index)}
                    aria-label={`Go to question ${index + 1}`}
                  >
                    {index + 1}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 rounded-lg border bg-[hsl(var(--card))] p-4 text-xs">
            <Legend color="bg-[hsl(var(--secondary))]" label={`Not Visited ${counts["not-visited"]}`} />
            <Legend color="bg-[hsl(var(--destructive))]" label={`Not Answered ${counts["not-answered"]}`} />
            <Legend color="bg-[hsl(var(--primary))]" label={`Answered ${counts.answered}`} />
            <Legend color="bg-violet-500" label={`Review ${counts.review}`} />
            <Legend color="bg-[hsl(var(--accent))]" label={`Ans + Review ${counts["answered-review"]}`} />
          </div>
        </aside>

        <motion.section
          key={question.id}
          className="order-1 rounded-lg border bg-[hsl(var(--card))] lg:order-2"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          <div className="flex flex-wrap items-center justify-between gap-3 border-b p-5">
            <div>
              <Badge>{question.topic}</Badge>
              <h1 className="mt-3 text-xl font-semibold">Question {currentIndex + 1}</h1>
            </div>
            <Badge className="text-[hsl(var(--accent))]">{question.difficulty}</Badge>
          </div>

          <div className="space-y-6 p-5">
            <p className="text-base leading-8 sm:text-lg">
              <MathText text={question.question[language]} />
            </p>
            <div className="grid gap-3">
              {question.options.map((option, index) => (
                <button
                  key={option.id}
                  className={`flex min-h-14 items-center gap-3 rounded-md border p-4 text-left transition hover:border-[hsl(var(--primary))] hover:bg-[hsl(var(--secondary))]/70 ${
                    selectedOption === option.id ? "border-[hsl(var(--primary))] bg-[hsl(var(--primary))]/12" : ""
                  }`}
                  onClick={() => answerQuestion(test.meta.id, question.id, option.id)}
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border font-semibold">
                    {index + 1}
                  </span>
                  <MathText text={option.text[language]} />
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 border-t p-5">
            <Button variant="outline" onClick={() => goTo(currentIndex - 1)} disabled={currentIndex === 0}>
              <ArrowLeft className="h-4 w-4" />
              Previous
            </Button>
            <Button variant="secondary" onClick={() => clearAnswer(test.meta.id, question.id)}>
              <Eraser className="h-4 w-4" />
              Clear
            </Button>
            <Button variant="outline" onClick={() => markReview(test.meta.id, question.id)}>
              <Flag className="h-4 w-4" />
              Mark Review
            </Button>
            <Button className="ml-auto" onClick={saveAndNext}>
              <CheckCircle2 className="h-4 w-4" />
              Save & Next
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </motion.section>
      </section>
    </main>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2 text-[hsl(var(--muted-foreground))]">
      <span className={`h-3 w-3 rounded-sm ${color}`} />
      <span>{label}</span>
    </div>
  );
}
