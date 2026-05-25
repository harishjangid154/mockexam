"use client";

import { create } from "zustand";
import type { ParserStepId, ParserStepStatus, UploadPipelineState } from "@/types/generated-test";

const stepIds: ParserStepId[] = ["upload", "extract", "ai", "validate", "store", "ready"];

const initialSteps = stepIds.reduce<Record<ParserStepId, ParserStepStatus>>((acc, step) => {
  acc[step] = "idle";
  return acc;
}, {} as Record<ParserStepId, ParserStepStatus>);

type UploadStore = UploadPipelineState & {
  reset: () => void;
  start: (fileName: string) => void;
  setStep: (step: ParserStepId, status: ParserStepStatus, progress: number) => void;
  setExtractedText: (text: string) => void;
  setReady: (testId: string) => void;
  setError: (message: string) => void;
};

const initialState: UploadPipelineState = {
  progress: 0,
  currentStep: "upload",
  steps: initialSteps,
};

export const useUploadStore = create<UploadStore>((set) => ({
  ...initialState,
  reset: () => set(initialState),
  start: (fileName) =>
    set({
      ...initialState,
      fileName,
      progress: 8,
      currentStep: "upload",
      steps: { ...initialSteps, upload: "complete", extract: "active" },
    }),
  setStep: (step, status, progress) =>
    set((state) => ({
      currentStep: step,
      progress,
      steps: { ...state.steps, [step]: status },
      error: undefined,
    })),
  setExtractedText: (extractedText) => set({ extractedText }),
  setReady: (generatedTestId) =>
    set((state) => ({
      generatedTestId,
      currentStep: "ready",
      progress: 100,
      steps: { ...state.steps, ready: "complete" },
    })),
  setError: (error) =>
    set((state) => ({
      error,
      steps: { ...state.steps, [state.currentStep]: "error" },
    })),
}));
