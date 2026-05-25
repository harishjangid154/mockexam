"use client";

import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type { AnalyticsSnapshot, StoredAttempt, StoredTest } from "@/types/generated-test";

type SscAiEngineDb = DBSchema & {
  tests: {
    key: string;
    value: StoredTest;
    indexes: { "by-created": string };
  };
  attempts: {
    key: string;
    value: StoredAttempt;
    indexes: { "by-test": string; "by-started": number };
  };
  analytics: {
    key: string;
    value: AnalyticsSnapshot;
  };
};

let dbPromise: Promise<IDBPDatabase<SscAiEngineDb>> | undefined;
const LOCAL_TESTS_KEY = "ssc-ai-engine-tests";

export function getSscDb() {
  if (!dbPromise) {
    dbPromise = openDB<SscAiEngineDb>("ssc-ai-engine", 1, {
      upgrade(db) {
        const tests = db.createObjectStore("tests", { keyPath: "id" });
        tests.createIndex("by-created", "createdAt");

        const attempts = db.createObjectStore("attempts", { keyPath: "id" });
        attempts.createIndex("by-test", "testId");
        attempts.createIndex("by-started", "startedAt");

        db.createObjectStore("analytics", { keyPath: "id" });
      },
    });
  }
  return dbPromise;
}

export async function saveStoredTest(test: StoredTest) {
  saveLocalTest(test);
  try {
    const db = await getSscDb();
    await db.put("tests", test);
  } catch {
    // localStorage fallback keeps generated tests playable if IndexedDB is unavailable.
  }
  return test;
}

export async function listStoredTests() {
  let tests = listLocalTests();
  try {
    const db = await getSscDb();
    const idbTests = await db.getAllFromIndex("tests", "by-created");
    tests = mergeTests(tests, idbTests);
  } catch {
    return tests.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
  return tests.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getStoredTest(id: string) {
  const local = getLocalTest(id);
  if (local) return local;
  try {
    const db = await getSscDb();
    return db.get("tests", id);
  } catch {
    return undefined;
  }
}

export async function deleteStoredTest(id: string) {
  deleteLocalTest(id);
  try {
    const db = await getSscDb();
    await db.delete("tests", id);
  } catch {
    // localStorage fallback has already been updated.
  }
}

export async function saveAttempt(attempt: StoredAttempt) {
  const db = await getSscDb();
  await db.put("attempts", attempt);
  return attempt;
}

export async function listAttempts() {
  const db = await getSscDb();
  const attempts = await db.getAllFromIndex("attempts", "by-started");
  return attempts.sort((a, b) => b.startedAt - a.startedAt);
}

export async function saveAnalytics(snapshot: AnalyticsSnapshot) {
  const db = await getSscDb();
  await db.put("analytics", snapshot);
  return snapshot;
}

export async function getAnalytics(id = "global") {
  const db = await getSscDb();
  return db.get("analytics", id);
}

function listLocalTests() {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(window.localStorage.getItem(LOCAL_TESTS_KEY) ?? "[]") as StoredTest[];
  } catch {
    return [];
  }
}

function saveLocalTest(test: StoredTest) {
  if (typeof window === "undefined") return;
  const tests = mergeTests(listLocalTests(), [test]);
  window.localStorage.setItem(LOCAL_TESTS_KEY, JSON.stringify(tests));
}

function getLocalTest(id: string) {
  return listLocalTests().find((test) => test.id === id || test.testData.meta.id === id);
}

function deleteLocalTest(id: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    LOCAL_TESTS_KEY,
    JSON.stringify(listLocalTests().filter((test) => test.id !== id && test.testData.meta.id !== id)),
  );
}

function mergeTests(primary: StoredTest[], secondary: StoredTest[]) {
  const byId = new Map<string, StoredTest>();
  [...primary, ...secondary].forEach((test) => byId.set(test.id, test));
  return Array.from(byId.values());
}
