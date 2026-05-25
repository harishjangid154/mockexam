"use client";

import Link from "next/link";
import type React from "react";
import { motion } from "framer-motion";
import { BarChart3, Clock, Gauge, ListChecks, Play } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { TestMeta } from "@/lib/types";
import { useExamStore } from "@/stores/exam-store";

export function TestCard({ test }: { test: TestMeta }) {
  const progress = useExamStore((state) => state.progressByTest[test.id]);
  const hasProgress = progress && !progress.submittedAt;

  return (
    <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
      <Card className="h-full overflow-hidden">
        <CardHeader className="border-b">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2">
              <Badge>{test.exam}</Badge>
              <CardTitle className="leading-tight">{test.title}</CardTitle>
            </div>
            <Badge className="border-[hsl(var(--accent))]/40 text-[hsl(var(--accent))]">{test.difficulty}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-5 pt-5">
          <div className="grid grid-cols-3 gap-3 text-sm">
            <Metric icon={ListChecks} label="Questions" value={test.totalQuestions.toString()} />
            <Metric icon={Clock} label="Duration" value={`${test.durationMinutes}m`} />
            <Metric icon={Gauge} label="Marks" value={`+${test.marksPerQuestion}/-${test.negativeMarks}`} />
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-[hsl(var(--muted-foreground))]">
              <BarChart3 className="h-4 w-4" />
              Subject breakdown
            </div>
            <div className="space-y-2">
              {test.subjects.map((subject) => (
                <div key={subject.name} className="space-y-1">
                  <div className="flex justify-between text-xs text-[hsl(var(--muted-foreground))]">
                    <span>{subject.name}</span>
                    <span>{subject.questions}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-[hsl(var(--secondary))]">
                    <div
                      className="h-full rounded-full bg-[hsl(var(--primary))]"
                      style={{ width: `${(subject.questions / test.totalQuestions) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Button asChild className="w-full">
            <Link href={`/tests/${test.id}`}>
              <Play className="h-4 w-4" />
              {hasProgress ? "Resume Test" : "Start Test"}
            </Link>
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-md border bg-[hsl(var(--secondary))]/45 p-3">
      <Icon className="mb-2 h-4 w-4 text-[hsl(var(--primary))]" />
      <div className="text-base font-semibold">{value}</div>
      <div className="text-xs text-[hsl(var(--muted-foreground))]">{label}</div>
    </div>
  );
}
