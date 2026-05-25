"use client";

import Link from "next/link";
import type React from "react";
import { motion } from "framer-motion";
import { ArrowLeft, BarChart3, CheckCircle2, Gauge, RotateCcw, Target, Timer, Trophy, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { calculateResult } from "@/lib/results";
import type { ExamTest } from "@/lib/types";
import { formatSeconds } from "@/lib/utils";
import { useExamStore } from "@/stores/exam-store";

export function ResultScreen({ test }: { test: ExamTest }) {
  const progress = useExamStore((state) => state.progressByTest[test.meta.id]);
  const resetTest = useExamStore((state) => state.resetTest);

  if (!progress) {
    return (
      <main className="flex min-h-screen items-center justify-center p-4">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>No saved attempt</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-[hsl(var(--muted-foreground))]">Start the test before viewing results.</p>
            <Button asChild>
              <Link href={`/tests/${test.meta.id}`}>Start Test</Link>
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  const result = calculateResult(test, progress);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-4 border-b pb-5 md:flex-row md:items-end md:justify-between">
        <div>
          <Button asChild variant="ghost" className="-ml-3 mb-3">
            <Link href="/">
              <ArrowLeft className="h-4 w-4" />
              Dashboard
            </Link>
          </Button>
          <Badge>{test.meta.exam}</Badge>
          <h1 className="mt-3 text-3xl font-semibold tracking-normal">{test.meta.title} Result</h1>
          <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">
            Scorecard, topic analytics, weak areas, and rank estimate from this attempt.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => resetTest(test.meta.id)}
          asChild
        >
          <Link href={`/tests/${test.meta.id}`}>
            <RotateCcw className="h-4 w-4" />
            Retake
          </Link>
        </Button>
      </header>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Stat icon={Trophy} label="Score" value={`${result.score}/${result.maxScore}`} accent />
        <Stat icon={Target} label="Accuracy" value={`${result.accuracy}%`} />
        <Stat icon={Timer} label="Time Taken" value={formatSeconds(result.timeTakenSeconds)} />
        <Stat icon={Gauge} label="Estimated Rank" value={`#${result.estimatedRank.toLocaleString()}`} />
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <Stat icon={BarChart3} label="Attempted" value={`${result.attempted}/${test.questions.length}`} />
        <Stat icon={CheckCircle2} label="Correct" value={result.correct.toString()} />
        <Stat icon={XCircle} label="Wrong" value={result.wrong.toString()} />
      </section>

      <section className="grid gap-5 lg:grid-cols-[1fr_22rem]">
        <Card>
          <CardHeader>
            <CardTitle>Topic-Wise Analytics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {result.topicWise.map((topic) => (
              <motion.div key={topic.topic} className="space-y-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                  <span className="font-medium">{topic.topic}</span>
                  <span className="text-[hsl(var(--muted-foreground))]">
                    {topic.correct}/{topic.total} correct · {topic.accuracy}% accuracy
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-[hsl(var(--secondary))]">
                  <div className="h-full rounded-full bg-[hsl(var(--primary))]" style={{ width: `${topic.accuracy}%` }} />
                </div>
              </motion.div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Weak Topic Analysis</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {result.weakTopics.length ? (
              result.weakTopics.map((topic) => (
                <div key={topic.topic} className="rounded-md border bg-[hsl(var(--secondary))]/40 p-3">
                  <div className="font-medium">{topic.topic}</div>
                  <div className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
                    {topic.attempted === 0 ? "Not attempted" : `${topic.accuracy}% accuracy`} across {topic.total} questions
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-[hsl(var(--muted-foreground))]">No weak topics detected in this attempt.</p>
            )}
          </CardContent>
        </Card>
      </section>
    </main>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <Card className={accent ? "border-[hsl(var(--primary))]/60" : ""}>
      <CardContent className="flex items-center gap-4 p-5">
        <div className="flex h-12 w-12 items-center justify-center rounded-md bg-[hsl(var(--secondary))]">
          <Icon className="h-5 w-5 text-[hsl(var(--primary))]" />
        </div>
        <div>
          <div className="text-2xl font-semibold">{value}</div>
          <div className="text-sm text-[hsl(var(--muted-foreground))]">{label}</div>
        </div>
      </CardContent>
    </Card>
  );
}
