"use client";

import { useQuery } from "@tanstack/react-query";
import { BookOpenCheck, Search } from "lucide-react";
import { TestCard } from "@/components/test-card";
import { fetchTestIndex } from "@/lib/tests";

export default function DashboardPage() {
  const { data: tests = [], isLoading, error } = useQuery({
    queryKey: ["tests"],
    queryFn: fetchTestIndex,
  });

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-8 px-4 py-6 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-5 border-b pb-6 md:flex-row md:items-end md:justify-between">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 rounded-md border bg-[hsl(var(--secondary))]/60 px-3 py-1 text-sm text-[hsl(var(--muted-foreground))]">
            <BookOpenCheck className="h-4 w-4 text-[hsl(var(--primary))]" />
            SSC online examination suite
          </div>
          <div>
            <h1 className="text-3xl font-semibold tracking-normal sm:text-4xl">Mock Test Dashboard</h1>
            <p className="mt-2 max-w-2xl text-sm text-[hsl(var(--muted-foreground))] sm:text-base">
              Practice timed bilingual SSC papers with saved progress, analytics, review workflow, and exam-style navigation.
            </p>
          </div>
        </div>
        <div className="flex h-11 min-w-64 items-center gap-3 rounded-md border bg-[hsl(var(--card))] px-3 text-[hsl(var(--muted-foreground))]">
          <Search className="h-4 w-4" />
          <span className="text-sm">Filter coming soon</span>
        </div>
      </header>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3].map((item) => (
            <div key={item} className="h-96 animate-pulse rounded-lg border bg-[hsl(var(--card))]" />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-lg border border-[hsl(var(--destructive))]/40 bg-[hsl(var(--destructive))]/10 p-5 text-sm">
          Could not load test data.
        </div>
      ) : (
        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {tests.map((test) => (
            <TestCard key={test.id} test={test} />
          ))}
        </section>
      )}
    </main>
  );
}
