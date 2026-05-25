"use client";

import { create } from "zustand";
import { listAttempts, saveAttempt } from "@/lib/db/indexedDb";
import type { StoredAttempt } from "@/types/generated-test";

type AttemptStore = {
  attempts: StoredAttempt[];
  hydrate: () => Promise<void>;
  addAttempt: (attempt: StoredAttempt) => Promise<void>;
};

export const useAttemptStore = create<AttemptStore>((set) => ({
  attempts: [],
  hydrate: async () => {
    set({ attempts: await listAttempts() });
  },
  addAttempt: async (attempt) => {
    await saveAttempt(attempt);
    set((state) => ({
      attempts: [attempt, ...state.attempts.filter((item) => item.id !== attempt.id)],
    }));
  },
}));
