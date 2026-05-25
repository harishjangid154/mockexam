"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { ExamShell } from "@/components/exam-shell";
import { fetchTest } from "@/lib/tests";

export default function TestPage() {
  const params = useParams<{ testId: string }>();
  const { data: test, isLoading, error } = useQuery({
    queryKey: ["test", params.testId],
    queryFn: () => fetchTest(params.testId),
  });

  if (isLoading) {
    return <div className="flex min-h-screen items-center justify-center text-[hsl(var(--muted-foreground))]">Loading test...</div>;
  }

  if (error || !test) {
    return <div className="flex min-h-screen items-center justify-center text-[hsl(var(--destructive))]">Unable to load test.</div>;
  }

  return <ExamShell test={test} />;
}
