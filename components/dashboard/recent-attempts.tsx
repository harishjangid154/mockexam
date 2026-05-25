"use client";

import Link from "next/link";
import { Clock, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatSeconds } from "@/lib/utils";
import { useAttemptStore } from "@/store/attempt-store";

export function RecentAttempts() {
  const allAttempts = useAttemptStore((state) => state.attempts);
  const attempts = allAttempts.slice(0, 5);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Attempts</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {attempts.length ? (
          attempts.map((attempt) => (
            <div key={attempt.id} className="flex items-center justify-between gap-3 rounded-md border bg-[hsl(var(--secondary))]/35 p-3">
              <div className="min-w-0">
                <div className="truncate font-medium">{attempt.testTitle}</div>
                <div className="mt-1 flex items-center gap-2 text-xs text-[hsl(var(--muted-foreground))]">
                  <Clock className="h-3 w-3" />
                  {formatSeconds(Math.max(0, Date.now() / 1000 - attempt.startedAt / 1000))}
                </div>
              </div>
              <Button asChild variant="outline" size="sm">
                <Link href={`/tests/${attempt.testId}${attempt.submittedAt ? "/result" : ""}`}>
                  <RotateCcw className="h-4 w-4" />
                  {attempt.submittedAt ? "Review" : "Resume"}
                </Link>
              </Button>
            </div>
          ))
        ) : (
          <p className="text-sm text-[hsl(var(--muted-foreground))]">Attempts will appear here after you start generated tests.</p>
        )}
      </CardContent>
    </Card>
  );
}
