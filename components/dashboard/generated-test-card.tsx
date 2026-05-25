"use client";

import Link from "next/link";
import { Download, FileJson, Play, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToastStore } from "@/components/ui/toast";
import { useTestStore } from "@/store/test-store";
import type { StoredTest } from "@/types/generated-test";

export function GeneratedTestCard({ test }: { test: StoredTest }) {
  const removeTest = useTestStore((state) => state.removeTest);
  const toast = useToastStore((state) => state.push);

  function exportJson() {
    const blob = new Blob([JSON.stringify(test.testData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${test.id}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  async function remove() {
    await removeTest(test.id);
    toast({ title: "Test removed", description: test.title });
  }

  return (
    <Card>
      <CardHeader className="border-b">
        <div className="flex items-start justify-between gap-3">
          <div>
            <Badge className="mb-3 text-[hsl(var(--primary))]">AI Generated</Badge>
            <CardTitle className="leading-tight">{test.title}</CardTitle>
          </div>
          <Badge>{Math.round(test.parserConfidence * 100)}%</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-5">
        <div className="grid grid-cols-3 gap-2 text-xs">
          <Metric label="Questions" value={test.testData.meta.totalQuestions.toString()} />
          <Metric label="Duration" value={`${test.testData.meta.durationMinutes}m`} />
          <Metric label="Source" value={test.sourceFileName.replace(/\.pdf$/i, "")} />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild className="flex-1">
            <Link href={`/tests/${test.id}`}>
              <Play className="h-4 w-4" />
              Start
            </Link>
          </Button>
          <Button variant="outline" size="icon" onClick={exportJson} aria-label="Export test JSON">
            <Download className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={remove} aria-label="Delete generated test">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-md border bg-[hsl(var(--secondary))]/35 p-2">
      <div className="truncate font-semibold">{value}</div>
      <div className="mt-1 flex items-center gap-1 text-[hsl(var(--muted-foreground))]">
        <FileJson className="h-3 w-3" />
        {label}
      </div>
    </div>
  );
}
