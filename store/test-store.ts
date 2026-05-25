"use client";

import { create } from "zustand";
import { deleteStoredTest, getStoredTest, listStoredTests, saveStoredTest } from "@/lib/db/indexedDb";
import type { StoredTest } from "@/types/generated-test";

type TestStore = {
  tests: StoredTest[];
  selectedTest?: StoredTest;
  isLoading: boolean;
  error?: string;
  hydrate: () => Promise<void>;
  getById: (id: string) => Promise<StoredTest | undefined>;
  addTest: (test: StoredTest) => Promise<void>;
  removeTest: (id: string) => Promise<void>;
};

export const useTestStore = create<TestStore>((set, get) => ({
  tests: [],
  isLoading: false,
  hydrate: async () => {
    set({ isLoading: true, error: undefined });
    try {
      set({ tests: await listStoredTests(), isLoading: false });
    } catch (error) {
      set({ error: getErrorMessage(error), isLoading: false });
    }
  },
  getById: async (id) => {
    const cached = get().tests.find((test) => test.id === id);
    if (cached) {
      set({ selectedTest: cached });
      return cached;
    }
    const stored = await getStoredTest(id);
    set({ selectedTest: stored });
    return stored;
  },
  addTest: async (test) => {
    await saveStoredTest(test);
    set((state) => ({
      tests: [test, ...state.tests.filter((item) => item.id !== test.id)],
      selectedTest: test,
    }));
  },
  removeTest: async (id) => {
    await deleteStoredTest(id);
    set((state) => ({
      tests: state.tests.filter((test) => test.id !== id),
      selectedTest: state.selectedTest?.id === id ? undefined : state.selectedTest,
    }));
  },
}));

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unable to load generated tests.";
}
