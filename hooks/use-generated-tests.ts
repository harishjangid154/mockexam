"use client";

import { useEffect } from "react";
import { useAnalyticsStore } from "@/store/analytics-store";
import { useAttemptStore } from "@/store/attempt-store";
import { useTestStore } from "@/store/test-store";

export function useGeneratedTests() {
  const tests = useTestStore((state) => state.tests);
  const attempts = useAttemptStore((state) => state.attempts);
  const hydrateTests = useTestStore((state) => state.hydrate);
  const hydrateAttempts = useAttemptStore((state) => state.hydrate);
  const recompute = useAnalyticsStore((state) => state.recompute);

  useEffect(() => {
    void hydrateTests();
    void hydrateAttempts();
  }, [hydrateAttempts, hydrateTests]);

  useEffect(() => {
    void recompute(tests, attempts);
  }, [attempts, recompute, tests]);
}
