"use client";

import { Activity, Brain, Flame, Target } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { percent } from "@/lib/utils";
import { useAnalyticsStore } from "@/store/analytics-store";
import { useAttemptStore } from "@/store/attempt-store";
import { useTestStore } from "@/store/test-store";

export function AnalyticsPanel() {
  const snapshot = useAnalyticsStore((state) => state.snapshot);
  const tests = useTestStore((state) => state.tests);
  const attempts = useAttemptStore((state) => state.attempts);
  const topicRows = Object.entries(snapshot?.topicAccuracy ?? {}).slice(0, 5);
  const difficultyRows = Object.entries(snapshot?.difficultyAccuracy ?? {});

  return (
    <section className="grid gap-5 xl:grid-cols-[1fr_24rem]">
      <Card>
        <CardHeader>
          <CardTitle>Performance Analytics</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Stat icon={Brain} label="Generated Tests" value={tests.length.toString()} />
          <Stat icon={Activity} label="Attempts" value={attempts.length.toString()} />
          <Stat icon={Target} label="Avg Accuracy" value={`${snapshot?.averageAccuracy ?? 0}%`} />
          <Stat icon={Flame} label="Active Streak" value={attempts.length ? "1 day" : "0 day"} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Difficulty Accuracy</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {difficultyRows.length ? (
            difficultyRows.map(([difficulty, stats]) => (
              <Bar key={difficulty} label={difficulty} value={percent(stats.correct, stats.attempted)} />
            ))
          ) : (
            <p className="text-sm text-[hsl(var(--muted-foreground))]">Complete an AI-generated test to unlock trends.</p>
          )}
        </CardContent>
      </Card>

      <Card className="xl:col-span-2">
        <CardHeader>
          <CardTitle>Topic Analytics</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          {topicRows.length ? (
            topicRows.map(([topic, stats]) => <Bar key={topic} label={topic} value={percent(stats.correct, stats.attempted)} />)
          ) : (
            <p className="text-sm text-[hsl(var(--muted-foreground))]">No topic analytics yet.</p>
          )}
        </CardContent>
      </Card>
    </section>
  );
}

function Stat({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <div className="rounded-md border bg-[hsl(var(--secondary))]/35 p-4">
      <Icon className="mb-3 h-5 w-5 text-[hsl(var(--primary))]" />
      <div className="text-2xl font-semibold">{value}</div>
      <div className="text-sm text-[hsl(var(--muted-foreground))]">{label}</div>
    </div>
  );
}

function Bar({ label, value }: { label: string; value: number }) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between gap-3 text-sm">
        <span className="truncate font-medium">{label}</span>
        <span className="text-[hsl(var(--muted-foreground))]">{value}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-[hsl(var(--secondary))]">
        <div className="h-full rounded-full bg-[hsl(var(--primary))]" style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}
