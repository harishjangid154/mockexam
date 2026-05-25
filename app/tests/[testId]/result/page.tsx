"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { ResultScreen } from "@/components/result-screen";
import { fetchTest } from "@/lib/tests";
import { useTestStore } from "@/store/test-store";

export default function ResultPage() {
  const params = useParams<{ testId: string }>();
  const generatedTest = useTestStore((state) => state.tests.find((test) => test.id === params.testId || test.testData.meta.id === params.testId));
  const { data: test, isLoading, error } = useQuery({
    queryKey: ["test", params.testId],
    queryFn: () => fetchTest(params.testId),
    enabled: !generatedTest,
  });

  if (generatedTest) {
    return <ResultScreen test={generatedTest.testData} />;
  }

  if (isLoading) {
    return <div className="flex min-h-screen items-center justify-center text-[hsl(var(--muted-foreground))]">Loading result...</div>;
  }

  if (error || !test) {
    return <div className="flex min-h-screen items-center justify-center text-[hsl(var(--destructive))]">Unable to load result.</div>;
  }

  return <ResultScreen test={test} />;
}
