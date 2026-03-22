import { useCallback, useState } from "react";

export type ToastType = "success" | "error" | "info";

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback(
    (message: string, type: ToastType = "info", duration = 2500) => {
      const id = Math.random().toString(36).slice(2, 11);
      setToasts((prev) => [...prev, { id, message, type }]);

      setTimeout(() => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
      }, duration);

      return id;
    },
    [],
  );

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  return { toasts, addToast, removeToast };
}

interface ToastContainerProps {
  toasts: Toast[];
  removeToast: (id: string) => void;
}

export function ToastContainer({
  toasts,
  removeToast,
}: ToastContainerProps) {
  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-sm space-y-3">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={[
            "flex items-start gap-3 rounded-sm border p-4",
            toast.type === "success"
              ? "border-gold/30 bg-surface text-soft"
              : toast.type === "error"
                ? "border-red-500/30 bg-surface text-red-400"
                : "border-gold/20 bg-surface text-muted",
          ].join(" ")}
        >
          <span
            className={
              toast.type === "success"
                ? "text-gold"
                : toast.type === "error"
                  ? "text-red-400"
                  : "text-gold"
            }
          >
            {toast.type === "success"
              ? "✓"
              : toast.type === "error"
                ? "✕"
                : "ℹ"}
          </span>
          <span className="flex-1 text-sm">{toast.message}</span>
          <button
            onClick={() => removeToast(toast.id)}
            className="text-sm text-muted transition-colors hover:text-text"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
