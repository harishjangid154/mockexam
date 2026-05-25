"use client";

import { Upload } from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import { Button } from "@/components/ui/button";
import { useToastStore } from "@/components/ui/toast";
import { aiExamToAppTest, validateAiExamJson, validateAppTest } from "@/lib/schema/testSchema";
import { useTestStore } from "@/store/test-store";

export function JsonImportButton() {
  const addTest = useTestStore((state) => state.addTest);
  const toast = useToastStore((state) => state.push);

  async function onFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const raw = JSON.parse(await file.text());
      const parsed = validateAiExamJson(raw);
      if (!parsed.success) throw new Error(parsed.error.issues.map((issue) => issue.message).join("\n"));
      const test = aiExamToAppTest(parsed.data, `ai-${uuidv4()}`);
      const validation = validateAppTest(test);
      if (!validation.success) throw new Error(validation.errors.join("\n"));
      await addTest({
        id: test.meta.id,
        title: test.meta.title,
        createdAt: new Date().toISOString(),
        sourceFileName: file.name,
        testData: test,
        completed: false,
        parserConfidence: 0.99,
      });
      toast({ title: "JSON imported", description: test.meta.title, variant: "success" });
    } catch (error) {
      toast({ title: "Import failed", description: error instanceof Error ? error.message : "Invalid JSON", variant: "error" });
    } finally {
      event.target.value = "";
    }
  }

  return (
    <Button asChild variant="outline">
      <label>
        <Upload className="h-4 w-4" />
        Import JSON
        <input className="hidden" type="file" accept="application/json,.json" onChange={onFileChange} />
      </label>
    </Button>
  );
}
