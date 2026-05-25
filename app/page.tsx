"use client";

import { useQuery } from "@tanstack/react-query";
import { BookOpenCheck, Search, ShieldCheck } from "lucide-react";
import { AnalyticsPanel } from "@/components/dashboard/analytics-panel";
import { GeneratedTestCard } from "@/components/dashboard/generated-test-card";
import { RecentAttempts } from "@/components/dashboard/recent-attempts";
import { TestCard } from "@/components/test-card";
import { JsonImportButton } from "@/components/upload/json-import";
import { PdfUploadFlow } from "@/components/upload/pdf-upload-flow";
import { fetchTestIndex } from "@/lib/tests";
import { useGeneratedTests } from "@/hooks/use-generated-tests";
import { useTestStore } from "@/store/test-store";

export default function DashboardPage() {
  useGeneratedTests();
  const generatedTests = useTestStore((state) => state.tests);
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
            AI-powered SSC examination suite
          </div>
          <div>
            <h1 className="text-3xl font-semibold tracking-normal sm:text-4xl">SSC AI Mock Test Studio</h1>
            <p className="mt-2 max-w-2xl text-sm text-[hsl(var(--muted-foreground))] sm:text-base">
              Upload SSC PDFs, generate bilingual mock tests with AI, store them offline, and practice instantly with analytics.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <JsonImportButton />
          <div className="flex h-11 min-w-64 items-center gap-3 rounded-md border bg-[hsl(var(--card))] px-3 text-[hsl(var(--muted-foreground))]">
            <Search className="h-4 w-4" />
            <span className="text-sm">Search tests</span>
          </div>
        </div>
      </header>

      <section className="grid gap-5 lg:grid-cols-[1fr_22rem]">
        <PdfUploadFlow />
        <RecentAttempts />
      </section>

      <AnalyticsPanel />

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold">Generated Tests</h2>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">Stored locally in IndexedDB for offline practice.</p>
          </div>
          <div className="hidden items-center gap-2 text-sm text-[hsl(var(--muted-foreground))] sm:flex">
            <ShieldCheck className="h-4 w-4 text-[hsl(var(--primary))]" />
            Browser-only storage
          </div>
        </div>
        {generatedTests.length ? (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {generatedTests.map((test) => (
              <GeneratedTestCard key={test.id} test={test} />
            ))}
          </div>
        ) : (
          <div className="rounded-lg border bg-[hsl(var(--card))] p-6 text-sm text-[hsl(var(--muted-foreground))]">
            Upload a PDF or import parser JSON to create your first AI-generated test.
          </div>
        )}
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold">Sample Test Library</h2>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">Static JSON tests remain available for baseline practice.</p>
        </div>
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
      </section>
    </main>
  );
}
