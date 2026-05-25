"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { CheckCircle2, FileUp, Loader2, Sparkles, UploadCloud, XCircle } from "lucide-react";
import { useDropzone } from "react-dropzone";
import { useCallback, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToastStore } from "@/components/ui/toast";
import { parseExamWithAi } from "@/lib/ai/parseExam";
import { extractTextFromPdf } from "@/lib/pdf/extractText";
import { useTestStore } from "@/store/test-store";
import { useUploadStore } from "@/store/upload-store";
import type { ParserStepId } from "@/types/generated-test";

const stepLabels: Record<ParserStepId, string> = {
  upload: "Upload PDF",
  extract: "Extracting PDF text",
  ai: "Sending to AI",
  validate: "Validating structure",
  store: "Saving locally",
  ready: "Test ready",
};

export function PdfUploadFlow() {
  const fileName = useUploadStore((state) => state.fileName);
  const progress = useUploadStore((state) => state.progress);
  const steps = useUploadStore((state) => state.steps);
  const error = useUploadStore((state) => state.error);
  const generatedTestId = useUploadStore((state) => state.generatedTestId);
  const startUpload = useUploadStore((state) => state.start);
  const setStep = useUploadStore((state) => state.setStep);
  const setExtractedText = useUploadStore((state) => state.setExtractedText);
  const setReady = useUploadStore((state) => state.setReady);
  const setError = useUploadStore((state) => state.setError);
  const addTest = useTestStore((state) => state.addTest);
  const toast = useToastStore((state) => state.push);
  const [isRunning, setIsRunning] = useState(false);

  const runPipeline = useCallback(
    async (file: File) => {
      setIsRunning(true);
      startUpload(file.name);
      try {
        setStep("extract", "active", 18);
        const extractedText = await extractTextFromPdf(file);
        setExtractedText(extractedText);
        setStep("extract", "complete", 34);

        setStep("ai", "active", 52);
        const parsed = await parseExamWithAi(extractedText);
        setStep("ai", "complete", 72);

        setStep("validate", "complete", 84);
        setStep("store", "active", 92);
        await addTest({
          id: parsed.test.meta.id,
          title: parsed.test.meta.title,
          createdAt: new Date().toISOString(),
          sourceFileName: file.name,
          testData: parsed.test,
          completed: false,
          parserConfidence: parsed.confidence,
        });
        setStep("store", "complete", 98);
        setReady(parsed.test.meta.id);
        toast({
          title: "Test generated",
          description: "Your AI-generated mock test is ready to play.",
          variant: "success",
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unable to generate test.";
        setError(message);
        toast({ title: "Parsing failed", description: message, variant: "error" });
      } finally {
        setIsRunning(false);
      }
    },
    [addTest, setError, setExtractedText, setReady, setStep, startUpload, toast],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { "application/pdf": [".pdf"] },
    multiple: false,
    disabled: isRunning,
    onDrop: (acceptedFiles) => {
      const [file] = acceptedFiles;
      if (file) void runPipeline(file);
    },
  });

  return (
    <Card className="overflow-hidden border-[hsl(var(--primary))]/30">
      <CardHeader className="border-b">
        <div className="flex items-center justify-between gap-3">
          <div>
            <Badge className="mb-3 text-[hsl(var(--primary))]">AI Generator</Badge>
            <CardTitle>Create mock test from SSC PDF</CardTitle>
          </div>
          <Sparkles className="h-5 w-5 text-[hsl(var(--accent))]" />
        </div>
      </CardHeader>
      <CardContent className="space-y-5 p-5">
        <div
          {...getRootProps()}
          className={`flex min-h-48 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed p-6 text-center transition ${
            isDragActive ? "border-[hsl(var(--primary))] bg-[hsl(var(--primary))]/10" : "bg-[hsl(var(--secondary))]/35"
          }`}
        >
          <input {...getInputProps()} />
          <UploadCloud className="mb-4 h-10 w-10 text-[hsl(var(--primary))]" />
          <div className="text-lg font-semibold">{isDragActive ? "Drop the PDF here" : "Drag SSC PDF here"}</div>
          <p className="mt-2 max-w-sm text-sm text-[hsl(var(--muted-foreground))]">
            AI parsing runs in the browser flow. Add `NEXT_PUBLIC_OPENAI_API_KEY` for live AI, or use offline fallback for demos.
          </p>
          <Button className="mt-4" disabled={isRunning}>
            <FileUp className="h-4 w-4" />
            Select PDF
          </Button>
        </div>

        <div className="space-y-3">
          <div className="h-2 overflow-hidden rounded-full bg-[hsl(var(--secondary))]">
            <motion.div
              className="h-full bg-[hsl(var(--primary))]"
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.35 }}
            />
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {(Object.keys(stepLabels) as ParserStepId[]).map((step) => (
              <div key={step} className="flex items-center gap-2 rounded-md border bg-[hsl(var(--secondary))]/30 p-2 text-sm">
                {steps[step] === "complete" ? (
                  <CheckCircle2 className="h-4 w-4 text-[hsl(var(--primary))]" />
                ) : steps[step] === "error" ? (
                  <XCircle className="h-4 w-4 text-[hsl(var(--destructive))]" />
                ) : steps[step] === "active" ? (
                  <Loader2 className="h-4 w-4 animate-spin text-[hsl(var(--accent))]" />
                ) : (
                  <span className="h-4 w-4 rounded-full border" />
                )}
                {stepLabels[step]}
              </div>
            ))}
          </div>
        </div>

        {fileName ? <div className="text-xs text-[hsl(var(--muted-foreground))]">Current file: {fileName}</div> : null}

        {error ? (
          <div className="rounded-md border border-[hsl(var(--destructive))]/50 bg-[hsl(var(--destructive))]/10 p-3 text-sm">
            {error}
          </div>
        ) : null}

        {generatedTestId ? (
          <Button asChild className="w-full">
            <Link href={`/tests/${generatedTestId}`}>Start generated test</Link>
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}
