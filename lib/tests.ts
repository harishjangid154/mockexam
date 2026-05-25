import type { ExamTest } from "./types";

export async function fetchTestIndex(): Promise<ExamTest["meta"][]> {
  const response = await fetch("/tests/index.json");
  if (!response.ok) throw new Error("Unable to load tests");
  return response.json();
}

export async function fetchTest(testId: string): Promise<ExamTest> {
  const response = await fetch(`/tests/${testId}.json`);
  if (!response.ok) throw new Error("Unable to load test");
  return response.json();
}
