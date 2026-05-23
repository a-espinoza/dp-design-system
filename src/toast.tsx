"use client";

// Toast — v2 family-wide toast primitive.
//
// Per docs/DESIGN.md § Motion table:
//   Enter: translate from edge + opacity, 240ms ease-out (var(--ease-out)).
//   Exit:  half-distance translate + opacity, 180ms ease-in (var(--ease-in)).
//         The exit is deliberately subtler than the enter — Jakub's
//         subtler-exit rule. The user already saw the toast arrive;
//         the exit shouldn't fight for the same attention budget.
//
// Variants map to v2 status tokens. The outline+deep-text pattern
// matches the Pill primitive so the visual family stays cohesive:
//   - success: status-approved-border + status-approved-fg
//   - error:   status-error-bg + status-error-fg (the solid variant)
//   - warn:    status-pending-border + status-pending-fg
//   - info:    status-issued-border + status-issued-fg
//   - loading: paper-deep bg + ink-soft fg, includes inline <Spinner />
//
// Auto-dismiss timings (per variant):
//   - success/info/warn: 5s
//   - error:             8s
//   - loading:           indefinite (caller dismisses when work completes)
//
// Manual dismiss: click anywhere on the toast OR press Escape (which
// dismisses the most-recent toast). prefers-reduced-motion collapses
// the translate to opacity-only via the global @media rule already in
// styles.css.
//
// No new npm deps — pure React context + Portal + the package's
// existing tw-animate-css animation utilities.

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { Check, X, AlertTriangle, Info, AlertCircle } from "lucide-react";

import { cn } from "./utils";
import { Spinner } from "./spinner";

export type ToastVariant = "success" | "error" | "warn" | "info" | "loading";

export type ToastPosition =
  | "bottom-right"
  | "bottom-left"
  | "top-right"
  | "top-left"
  | "bottom-center";

export interface ToastOptions {
  variant?: ToastVariant;
  title: string;
  description?: string;
  /**
   * Override the per-variant default auto-dismiss timing.
   * Pass `0` or `Infinity` for indefinite (caller-dismissed) toasts.
   */
  durationMs?: number;
}

export interface ToastRecord extends Required<Omit<ToastOptions, "description" | "durationMs">> {
  id: string;
  description?: string;
  durationMs: number;
  createdAt: number;
}

interface ToastContextValue {
  toast: (opts: ToastOptions) => string;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const MAX_STACK = 4;

const DEFAULT_DURATION: Record<ToastVariant, number> = {
  success: 5000,
  info: 5000,
  warn: 5000,
  error: 8000,
  loading: Infinity,
};

const positionClasses: Record<ToastPosition, string> = {
  "bottom-right": "bottom-4 right-4 items-end",
  "bottom-left": "bottom-4 left-4 items-start",
  "top-right": "top-4 right-4 items-end",
  "top-left": "top-4 left-4 items-start",
  "bottom-center": "bottom-4 left-1/2 -translate-x-1/2 items-center",
};

// Per-variant chrome. Outline+deep-text mirrors the Pill primitive;
// error is the only solid fill (matches the Pill `blocked` variant);
// loading uses paper-deep + ink-soft to stay quiet during async work.
const variantChrome: Record<ToastVariant, string> = {
  success:
    "bg-paper border border-status-approved-border text-status-approved-fg",
  error: "bg-status-error-bg border border-status-error-bg text-status-error-fg",
  warn: "bg-paper border border-status-pending-border text-status-pending-fg",
  info: "bg-paper border border-status-issued-border text-status-issued-fg",
  loading: "bg-paper-deep border border-border-soft text-ink-soft",
};

// Glyph component per variant. Loading uses the new Spinner primitive
// at sm so the rotating arc sits at the same baseline as the title.
function VariantGlyph({ variant }: { variant: ToastVariant }) {
  switch (variant) {
    case "success":
      return <Check className="size-4 shrink-0" aria-hidden />;
    case "error":
      return <AlertCircle className="size-4 shrink-0" aria-hidden />;
    case "warn":
      return <AlertTriangle className="size-4 shrink-0" aria-hidden />;
    case "info":
      return <Info className="size-4 shrink-0" aria-hidden />;
    case "loading":
      return <Spinner size="sm" />;
  }
}

// Per-position transform origin for the enter/exit translate. The
// half-distance exit rule comes straight from docs/DESIGN.md.
function translateClasses(position: ToastPosition): {
  initial: string;
  enter: string;
  exit: string;
} {
  switch (position) {
    case "bottom-right":
    case "top-right":
      return {
        initial: "opacity-0 translate-x-4",
        enter: "opacity-100 translate-x-0",
        exit: "opacity-0 translate-x-2",
      };
    case "bottom-left":
    case "top-left":
      return {
        initial: "opacity-0 -translate-x-4",
        enter: "opacity-100 translate-x-0",
        exit: "opacity-0 -translate-x-2",
      };
    case "bottom-center":
      return {
        initial: "opacity-0 translate-y-4",
        enter: "opacity-100 translate-y-0",
        exit: "opacity-0 translate-y-2",
      };
  }
}

function genId() {
  return `t_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

interface ToastItemProps {
  record: ToastRecord;
  position: ToastPosition;
  onDismiss: (id: string) => void;
}

function ToastItem({ record, position, onDismiss }: ToastItemProps) {
  const { initial, enter, exit } = useMemo(
    () => translateClasses(position),
    [position],
  );
  const [phase, setPhase] = useState<"initial" | "enter" | "exit">("initial");
  const dismissedRef = useRef(false);

  // Mount → enter on the next animation frame so the initial styles apply
  // before the transition kicks in. Two RAFs to guarantee paint between
  // them (React commits in the first; layout/paint happens after).
  useEffect(() => {
    const raf1 = requestAnimationFrame(() => {
      const raf2 = requestAnimationFrame(() => {
        setPhase("enter");
      });
      return () => cancelAnimationFrame(raf2);
    });
    return () => cancelAnimationFrame(raf1);
  }, []);

  // Auto-dismiss timer based on the record's durationMs.
  useEffect(() => {
    if (!Number.isFinite(record.durationMs) || record.durationMs <= 0) {
      return;
    }
    const handle = window.setTimeout(() => {
      beginExit();
    }, record.durationMs);
    return () => window.clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [record.id, record.durationMs]);

  const beginExit = useCallback(() => {
    if (dismissedRef.current) return;
    dismissedRef.current = true;
    setPhase("exit");
    // Match the 180ms ease-in exit duration before unmount.
    window.setTimeout(() => {
      onDismiss(record.id);
    }, 180);
  }, [onDismiss, record.id]);

  const phaseClass =
    phase === "initial" ? initial : phase === "enter" ? enter : exit;

  // Enter is 240ms ease-out per the Motion table. Exit is 180ms ease-in.
  // Pick the right transition class based on phase so the timing matches.
  const transitionClass =
    phase === "exit"
      ? "transition-[transform,opacity] duration-[180ms] ease-[var(--ease-in)]"
      : "transition-[transform,opacity] duration-[240ms] ease-[var(--ease-out)]";

  return (
    <div
      role={record.variant === "error" ? "alert" : "status"}
      aria-live={record.variant === "error" ? "assertive" : "polite"}
      onClick={beginExit}
      data-toast-variant={record.variant}
      className={cn(
        "pointer-events-auto w-80 max-w-[calc(100vw-2rem)] cursor-pointer rounded-sm px-4 py-3 shadow-sm",
        variantChrome[record.variant],
        transitionClass,
        phaseClass,
      )}
    >
      <div className="flex items-start gap-2.5">
        <span className="mt-0.5">
          <VariantGlyph variant={record.variant} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium leading-tight">{record.title}</p>
          {record.description ? (
            <p
              className={cn(
                "mt-1 text-xs leading-snug",
                record.variant === "error" ? "opacity-90" : "opacity-80",
              )}
            >
              {record.description}
            </p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            beginExit();
          }}
          aria-label="Dismiss"
          className="-mr-1 -mt-1 rounded-sm p-1 opacity-60 transition-opacity hover:opacity-100"
        >
          <X className="size-3.5" aria-hidden />
        </button>
      </div>
    </div>
  );
}

interface ToastProviderProps {
  children: ReactNode;
  position?: ToastPosition;
}

export function ToastProvider({
  children,
  position = "bottom-right",
}: ToastProviderProps) {
  const [toasts, setToasts] = useState<ToastRecord[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback((opts: ToastOptions): string => {
    const id = genId();
    const variant = opts.variant ?? "info";
    const durationMs =
      opts.durationMs !== undefined ? opts.durationMs : DEFAULT_DURATION[variant];
    const record: ToastRecord = {
      id,
      variant,
      title: opts.title,
      description: opts.description,
      durationMs,
      createdAt: Date.now(),
    };
    setToasts((prev) => {
      // Stack cap: drop the oldest when MAX_STACK is exceeded so the
      // newest toast is always visible.
      const next = [...prev, record];
      if (next.length > MAX_STACK) {
        return next.slice(next.length - MAX_STACK);
      }
      return next;
    });
    return id;
  }, []);

  // Escape dismisses the most-recent toast.
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key !== "Escape") return;
      setToasts((prev) => {
        if (prev.length === 0) return prev;
        return prev.slice(0, -1);
      });
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const ctx = useMemo<ToastContextValue>(
    () => ({ toast, dismiss }),
    [toast, dismiss],
  );

  // Newest first visually — bottom-anchored positions stack upward, so
  // we render the array as-is (last item closest to the edge); for
  // top-anchored we still render the same order — the flex column lays
  // them out top-down so the newest sits below older ones, which keeps
  // focus near the most-recent activity.
  const positionClass = positionClasses[position];

  return (
    <ToastContext.Provider value={ctx}>
      {children}
      {mounted
        ? createPortal(
            <div
              aria-live="polite"
              aria-relevant="additions text"
              className={cn(
                "pointer-events-none fixed z-[1600] flex flex-col gap-2",
                positionClass,
              )}
            >
              {toasts.map((t) => (
                <ToastItem
                  key={t.id}
                  record={t}
                  position={position}
                  onDismiss={dismiss}
                />
              ))}
            </div>,
            document.body,
          )
        : null}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error(
      "useToast() must be called from inside a <ToastProvider>. Add ToastProvider near the root of your app (typically in src/app/layout.tsx).",
    );
  }
  return ctx;
}

// Re-exported so consumers building static visual previews (e.g. the
// showcase route) can render the same shape outside the portal.
export { ToastItem as ToastPreview };
