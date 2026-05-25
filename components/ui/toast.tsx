"use client";

import { create } from "zustand";
import { cn } from "@/lib/utils";

type Toast = {
  id: string;
  title: string;
  description?: string;
  variant?: "default" | "error" | "success";
};

type ToastStore = {
  toasts: Toast[];
  push: (toast: Omit<Toast, "id">) => void;
  dismiss: (id: string) => void;
};

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  push: (toast) => {
    const id = crypto.randomUUID();
    set((state) => ({ toasts: [...state.toasts, { ...toast, id }] }));
    window.setTimeout(() => set((state) => ({ toasts: state.toasts.filter((item) => item.id !== id) })), 4500);
  },
  dismiss: (id) => set((state) => ({ toasts: state.toasts.filter((toast) => toast.id !== id) })),
}));

export function ToastViewport() {
  const toasts = useToastStore((state) => state.toasts);
  const dismiss = useToastStore((state) => state.dismiss);

  return (
    <div className="fixed bottom-4 right-4 z-50 flex w-[calc(100vw-2rem)] max-w-sm flex-col gap-2">
      {toasts.map((toast) => (
        <button
          key={toast.id}
          className={cn(
            "rounded-lg border bg-[hsl(var(--card))] p-4 text-left shadow-xl",
            toast.variant === "error" && "border-[hsl(var(--destructive))]/60",
            toast.variant === "success" && "border-[hsl(var(--primary))]/60",
          )}
          onClick={() => dismiss(toast.id)}
        >
          <div className="font-semibold">{toast.title}</div>
          {toast.description ? <div className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">{toast.description}</div> : null}
        </button>
      ))}
    </div>
  );
}
