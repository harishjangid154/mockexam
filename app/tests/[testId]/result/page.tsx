"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { ResultScreen } from "@/components/result-screen";
import { fetchTest } from "@/lib/tests";

export default function ResultPage() {
  const params = useParams<{ testId: string }>();
  const { data: test, isLoading, error } = useQuery({
    queryKey: ["test", params.testId],
    queryFn: () => fetchTest(params.testId),
  });

  if (isLoading) {
    return <div className="flex min-h-screen items-center justify-center text-[hsl(var(--muted-foreground))]">Loading result...</div>;
  }

  if (error || !test) {
    return <div className="flex min-h-screen items-center justify-center text-[hsl(var(--destructive))]">Unable to load result.</div>;
  }

  return <ResultScreen test={test} />;
}
