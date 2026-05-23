"use client";

// Global feedback bubble — a floating FAB that any authenticated user can
// tap to leave a note. Ported from abodly's battle-tested pattern, with
// emoji category indicators swapped for Lucide icons per the no-emojis
// rule, and design tokens translated to DreamPak's v2 (Fraunces,
// dp-navy, paper, warm-charcoal borders).
//
// Features (AES-237 / AES-239):
//  - Single tap to open, escape / backdrop to close
//  - Category pills (bug | idea | love | confused | question | other)
//  - Path, viewport, user_agent auto-captured
//  - Optional screenshot via lazy-loaded html2canvas + ScreenshotEditor
//  - Contribution count + beta level surfaced as light gamification
//  - Admin replies render inline; green dot on the FAB while unread
//  - Cmd/Ctrl + / shortcut to open from anywhere
//  - Cross-domain submit: mini-apps POST to the Hub's centralized endpoint
//
// Mount once via <FeedbackBubbleMount appSlug=... /> in the root layout.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import {
  Bug,
  Lightbulb,
  Heart,
  HelpCircle,
  MessageCircleQuestion,
  MessageSquare,
  Send,
  Camera,
  X,
  Check,
  Loader2,
  Pencil,
} from "lucide-react";
import { ScreenshotEditor } from "./screenshot-editor";

type Category = "bug" | "idea" | "love" | "confused" | "question";

type ThreadRow = {
  id: string;
  message: string;
  category: string;
  status: string;
  admin_reply: string | null;
  admin_reply_at: string | null;
  user_saw_reply_at: string | null;
  created_at: string;
};

type Level = "first" | "early" | "power" | "mvp" | "founding";

type ThreadSnapshot = {
  count: number;
  unreadReplies: number;
  latest: ThreadRow | null;
  recent: ThreadRow[];
  level: Level;
};

const CATEGORY_OPTIONS: {
  key: Category;
  label: string;
  icon: typeof Bug;
  tint: string;
}[] = [
  {
    key: "bug",
    label: "Bug",
    icon: Bug,
    tint: "ring-red-300 bg-red-50 text-red-700",
  },
  {
    key: "idea",
    label: "Idea",
    icon: Lightbulb,
    tint: "ring-amber-300 bg-amber-50 text-amber-700",
  },
  {
    key: "love",
    label: "Love",
    icon: Heart,
    tint: "ring-pink-300 bg-pink-50 text-pink-700",
  },
  {
    key: "confused",
    label: "Confusing",
    icon: HelpCircle,
    tint: "ring-muted-foreground/30 bg-muted text-foreground",
  },
  {
    key: "question",
    label: "Question",
    icon: MessageCircleQuestion,
    tint: "ring-dp-navy/30 bg-dp-navy/10 text-dp-navy",
  },
];

const LEVEL_COPY: Record<Level, { label: string; pitch: string }> = {
  first: {
    label: "New voice",
    pitch: "Your first note shapes the product. Thank you.",
  },
  early: {
    label: "Early whisperer",
    pitch: "A couple of notes in. You're helping steer the beta.",
  },
  power: {
    label: "Power contributor",
    pitch: "Your notes hit my desk every morning — keep them coming.",
  },
  mvp: {
    label: "Beta MVP",
    pitch: "You're making this product better. Drop a note anytime.",
  },
  founding: {
    label: "Founding voice",
    pitch: "You've shaped this product. Seriously, thank you.",
  },
};

export interface FeedbackBubbleProps {
  appSlug: string;
  apiOrigin?: string;
}

export function FeedbackBubble({ appSlug, apiOrigin = "" }: FeedbackBubbleProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [thread, setThread] = useState<ThreadSnapshot | null>(null);
  const [loadingThread, setLoadingThread] = useState(true);

  // Attention pulse — a one-time nudge for first-mount, not a permanent
  // animation. Blink for 5s then settle so the bubble doesn't compete
  // with the rest of the UI.
  const [pulseActive, setPulseActive] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setPulseActive(false), 5000);
    return () => clearTimeout(t);
  }, []);

  const [category, setCategory] = useState<Category | null>(null);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successFlash, setSuccessFlash] = useState<{
    count: number;
    levelUp: boolean;
  } | null>(null);

  // Screenshot attach state machine:
  //   "idle"      — no capture in progress; thumbnail shown if `screenshot` set
  //   "capturing" — sheet hidden while html2canvas runs
  //   "editing"   — ScreenshotEditor overlay shown
  const [captureMode, setCaptureMode] = useState<
    "idle" | "capturing" | "editing"
  >("idle");
  const [captureSource, setCaptureSource] = useState<string | null>(null);
  const [screenshot, setScreenshot] = useState<string | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  // Stable DOM root for html2canvas's ignoreElements so the bubble + sheet
  // never appear in the captured screenshot.
  const bubbleRootRef = useRef<HTMLDivElement>(null);

  const apiUrl = `${apiOrigin}/api/platform-feedback`;

  const loadThread = useCallback(
    async (markSeen: boolean) => {
      try {
        setLoadingThread(true);
        const r = await fetch(`${apiUrl}${markSeen ? "?markSeen=1" : ""}`, {
          cache: "no-store",
          credentials: "include",
        });
        if (!r.ok) {
          setThread(null);
          return;
        }
        const j = (await r.json()) as ThreadSnapshot;
        setThread(j);
      } catch {
        setThread(null);
      } finally {
        setLoadingThread(false);
      }
    },
    [apiUrl],
  );

  useEffect(() => {
    // loadThread is async: it sets thread/loadingThread only from inside
    // promise callbacks. The lint sees the sync function entry though, so
    // we disable here.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadThread(false);
  }, [loadThread]);

  // Cmd/Ctrl + / opens or closes the bubble. Escape closes only when open
  // and uses capture-phase + stopImmediatePropagation so it never cascades
  // to other modal handlers underneath.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (
        e.key === "/" &&
        (e.metaKey || e.ctrlKey) &&
        !e.altKey &&
        !e.shiftKey
      ) {
        e.preventDefault();
        setOpen((o) => !o);
        return;
      }
      if (e.key === "Escape" && open) {
        e.stopImmediatePropagation();
        e.preventDefault();
        setOpen(false);
      }
    }
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [open]);

  // Focus the textarea on open; refresh thread + mark replies seen.
  useEffect(() => {
    if (open) {
      // Same reason as the other loadThread call — async fn, lint can't see.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      loadThread(true);
      const t = setTimeout(() => textareaRef.current?.focus(), 80);
      return () => clearTimeout(t);
    }
    if (!open && successFlash) {
      const t = setTimeout(() => setSuccessFlash(null), 400);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [open, loadThread, successFlash]);

  // Body scroll lock on mobile when the sheet is open.
  useEffect(() => {
    if (!open) return;
    if (typeof window === "undefined") return;
    const prev = document.body.style.overflow;
    if (window.matchMedia("(max-width: 639px)").matches) {
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  async function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    setError(null);
    if (message.trim().length < 3) {
      setError("A couple of words, minimum.");
      textareaRef.current?.focus();
      return;
    }

    setSubmitting(true);
    try {
      const viewport =
        typeof window !== "undefined"
          ? `${window.innerWidth}x${window.innerHeight}`
          : undefined;
      const r = await fetch(apiUrl, {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          app_slug: appSlug,
          category: category || "other",
          message: message.trim(),
          path: pathname,
          viewport,
          screenshot: screenshot || undefined,
        }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) {
        setError(j?.error?.message || j?.error || "Could not send. Try again?");
        setSubmitting(false);
        return;
      }
      setSuccessFlash({ count: j.count ?? 1, levelUp: !!j.levelUp });
      setMessage("");
      setCategory(null);
      setScreenshot(null);
      await loadThread(true);
    } catch {
      setError("Network hiccup — please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  // Capture the current viewport with html2canvas + hand off to ScreenshotEditor.
  // html2canvas is lazy-loaded (~200KB) so the initial bundle stays light.
  async function handleStartCapture() {
    setError(null);
    setCaptureMode("capturing");
    try {
      // Two paint frames so the sheet's opacity transition commits before
      // html2canvas samples the DOM. Without this you can see a ghost of
      // the sheet on first invocation.
      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
      });
      const html2canvasMod = await import("html2canvas");
      const html2canvas = html2canvasMod.default;
      const canvas = await html2canvas(document.documentElement, {
        logging: false,
        useCORS: true,
        backgroundColor: null,
        ignoreElements: (el: Element) => {
          const root = bubbleRootRef.current;
          if (!root) return false;
          return el === root || root.contains(el);
        },
      });
      const dataUrl = canvas.toDataURL("image/png");
      setCaptureSource(dataUrl);
      setCaptureMode("editing");
    } catch (err) {
      setCaptureMode("idle");
      setError(
        err instanceof Error && err.message
          ? `Couldn't capture (${err.message.slice(0, 80)}). Text-only note still works.`
          : "Couldn't capture. Text-only note still works.",
      );
    }
  }

  function handleCaptureCancel() {
    setCaptureSource(null);
    setCaptureMode("idle");
  }

  function handleCaptureDone(finalDataUrl: string) {
    setScreenshot(finalDataUrl);
    setCaptureSource(null);
    setCaptureMode("idle");
  }

  const unread = thread?.unreadReplies ?? 0;
  const count = thread?.count ?? 0;
  const level: Level = thread?.level ?? "first";

  return (
    <div ref={bubbleRootRef} style={{ display: "contents" }}>
      {/* ─── Bubble FAB ─── */}
      <button
        type="button"
        aria-label={open ? "Close feedback" : "Leave feedback"}
        aria-expanded={open}
        onMouseDown={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
        onClick={() => setOpen((o) => !o)}
        className={
          "fixed right-4 bottom-4 z-[1450] group outline-none focus-visible:ring-4 focus-visible:ring-dp-navy/30 rounded-full transition-all duration-200 " +
          (captureMode === "capturing"
            ? "opacity-0 pointer-events-none "
            : "") +
          (open ? "scale-90 opacity-70" : "hover:scale-[1.04] active:scale-95")
        }
        style={{
          marginBottom: "env(safe-area-inset-bottom, 0px)",
        }}
      >
        {!open && count === 0 && pulseActive && (
          <span
            aria-hidden="true"
            className="absolute inset-0 rounded-full bg-dp-navy/60 opacity-60 animate-ping"
          />
        )}
        <span className="relative flex items-center justify-center w-12 h-12 rounded-full bg-dp-navy text-white shadow-lg border border-dp-navy/80">
          <MessageSquare className="size-5" aria-hidden="true" />
          {unread > 0 && (
            <span
              aria-label={`${unread} new repl${unread === 1 ? "y" : "ies"}`}
              className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-emerald-500 border-2 border-dp-navy flex items-center justify-center text-[10px] font-bold text-white"
            >
              {unread}
            </span>
          )}
        </span>
      </button>

      {/* ─── Panel (pass-through wrapper, interactive sheet inside) ─── */}
      {open && (
        <div
          className={
            "fixed inset-0 z-[1449] pointer-events-none transition-opacity duration-150 " +
            (captureMode === "capturing" ? "opacity-0" : "")
          }
        >
          <div
            ref={sheetRef}
            role="dialog"
            aria-label="Leave feedback"
            className={
              "fixed sm:right-4 left-0 sm:left-auto right-0 sm:bottom-20 bottom-0 " +
              "w-full sm:w-[380px] " +
              "pointer-events-auto " +
              "bg-card rounded-t-3xl sm:rounded-3xl shadow-2xl border border-border " +
              "max-h-[85vh] sm:max-h-[80vh] overflow-hidden flex flex-col"
            }
            style={{
              paddingBottom: "env(safe-area-inset-bottom, 0px)",
            }}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-5 pt-5 pb-4 flex items-start justify-between gap-3 border-b border-border">
              <div className="min-w-0">
                <p className="font-display font-semibold text-foreground text-lg tracking-tight leading-tight">
                  Help shape the beta.
                </p>
                {loadingThread && !thread ? (
                  <p className="mt-1 text-[12px] text-muted-foreground">
                    Loading…
                  </p>
                ) : (
                  <p className="mt-1 text-[12px] text-muted-foreground leading-snug">
                    <span className="inline-block px-1.5 py-0.5 rounded-md bg-muted text-foreground text-[10px] font-bold uppercase tracking-widest mr-1.5 align-middle">
                      {LEVEL_COPY[level].label}
                    </span>
                    {count > 0 ? (
                      <>
                        <span className="tabular-nums">
                          Your {ordinal(count)} note
                        </span>
                        <span className="text-muted-foreground/70">
                          {" "}
                          · {LEVEL_COPY[level].pitch}
                        </span>
                      </>
                    ) : (
                      LEVEL_COPY[level].pitch
                    )}
                  </p>
                )}
              </div>
              <button
                onClick={() => setOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition shrink-0"
                aria-label="Close"
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            </div>

            {/* Scrollable body */}
            <div className="overflow-y-auto px-5 py-4 flex-1">
              {successFlash ? (
                <SuccessState flash={successFlash} />
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Category pills */}
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">
                      What kind of note?
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {CATEGORY_OPTIONS.map((opt) => {
                        const selected = category === opt.key;
                        const Icon = opt.icon;
                        return (
                          <button
                            key={opt.key}
                            type="button"
                            onClick={() =>
                              setCategory(selected ? null : opt.key)
                            }
                            className={
                              "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[12px] font-medium transition border " +
                              (selected
                                ? `ring-2 ${opt.tint} border-transparent`
                                : "bg-card border-border text-foreground hover:border-dp-navy")
                            }
                            aria-pressed={selected}
                          >
                            <Icon className="size-3" aria-hidden="true" />
                            {opt.label}
                          </button>
                        );
                      })}
                    </div>
                    <p className="mt-1.5 text-[11px] text-muted-foreground">
                      Optional — skip if none fit.
                    </p>
                  </div>

                  {/* Message */}
                  <div>
                    <label className="block">
                      <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-2 block">
                        What&apos;s on your mind?
                      </span>
                      <textarea
                        ref={textareaRef}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyDown={(e) => {
                          if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                            handleSubmit();
                          }
                        }}
                        rows={4}
                        maxLength={4000}
                        placeholder="A bug, an idea, something confusing, something you love…"
                        className="w-full rounded-xl border border-border bg-muted/40 px-3 py-2.5 text-[14px] leading-relaxed focus:outline-none focus:ring-2 focus:ring-dp-navy focus:border-dp-navy transition resize-y min-h-[110px] text-foreground"
                      />
                    </label>
                    <p className="mt-1.5 text-[11px] text-muted-foreground">
                      We&apos;ll grab your current page &amp; device so you
                      don&apos;t have to describe it. Cmd+Enter to send.
                    </p>
                  </div>

                  {/* Screenshot attach */}
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">
                      Screenshot{" "}
                      <span className="font-normal normal-case tracking-normal text-muted-foreground/70">
                        (optional)
                      </span>
                    </p>
                    {screenshot ? (
                      <div className="flex items-start gap-3 rounded-xl border border-border bg-muted/30 p-2">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={screenshot}
                          alt="Screenshot attached to feedback"
                          className="w-24 h-16 object-cover rounded-lg border border-border bg-card shrink-0"
                        />
                        <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                          <p className="text-[12px] text-foreground leading-snug">
                            Screenshot attached.
                          </p>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={handleStartCapture}
                              disabled={captureMode !== "idle"}
                              className="text-[11px] font-medium text-foreground hover:text-dp-navy underline underline-offset-2 decoration-border disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                              Retake
                            </button>
                            <button
                              type="button"
                              onClick={() => setScreenshot(null)}
                              className="text-[11px] font-medium text-muted-foreground hover:text-red-600 transition"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={handleStartCapture}
                        disabled={captureMode !== "idle"}
                        className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card hover:bg-muted text-foreground hover:text-dp-navy text-[12px] font-medium px-3 py-1.5 transition disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {captureMode === "capturing" ? (
                          <>
                            <Loader2 className="size-3 animate-spin" />
                            Capturing…
                          </>
                        ) : (
                          <>
                            <Camera className="size-3" />
                            Add screenshot
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  {error && (
                    <div className="rounded-xl bg-red-50 border border-red-200 text-red-700 text-[12px] px-3 py-2">
                      {error}
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setMessage("");
                        setCategory(null);
                        setScreenshot(null);
                        setError(null);
                      }}
                      className="text-[12px] text-muted-foreground hover:text-foreground px-2 py-2 transition"
                    >
                      Clear
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="inline-flex items-center gap-1.5 bg-dp-navy text-white rounded-full px-4 py-2 text-[13px] font-medium hover:bg-dp-navy/90 transition disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
                    >
                      {submitting ? "Sending…" : "Send note"}
                      {!submitting && (
                        <Send className="size-3" aria-hidden="true" />
                      )}
                    </button>
                  </div>
                </form>
              )}

              {!successFlash && thread && thread.recent.length > 0 && (
                <Thread rows={thread.recent} />
              )}
            </div>
          </div>
        </div>
      )}

      {captureMode === "editing" && captureSource && (
        <ScreenshotEditor
          source={captureSource}
          onCancel={handleCaptureCancel}
          onDone={handleCaptureDone}
        />
      )}
    </div>
  );
}

function SuccessState({
  flash,
}: {
  flash: { count: number; levelUp: boolean };
}) {
  const level: Level = useMemo(() => {
    const n = flash.count;
    if (n <= 1) return "first";
    if (n <= 2) return "early";
    if (n <= 9) return "power";
    if (n <= 24) return "mvp";
    return "founding";
  }, [flash.count]);

  return (
    <div className="text-center py-4">
      <div className="relative mx-auto w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
        {flash.levelUp && (
          <>
            <span className="absolute inset-0 rounded-full bg-emerald-400/60 animate-ping" />
            <span
              className="absolute -inset-2 rounded-full bg-amber-300/40 blur-xl"
              aria-hidden="true"
            />
          </>
        )}
        <Check
          className="relative text-emerald-700 size-7"
          aria-hidden="true"
        />
      </div>
      <p className="font-display font-semibold text-xl tracking-tight text-foreground mt-4">
        {flash.levelUp ? "Level up." : "Got it."}
      </p>
      <p className="text-[13px] text-muted-foreground mt-2 leading-relaxed max-w-xs mx-auto">
        {flash.levelUp
          ? LEVEL_COPY[level].pitch
          : `Your ${ordinal(flash.count)} note landed — most get a reply within 48 hours.`}
      </p>
      <p className="mt-4 inline-block text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full bg-muted text-foreground">
        {LEVEL_COPY[level].label}
      </p>
    </div>
  );
}

function Thread({ rows }: { rows: ThreadRow[] }) {
  return (
    <div className="mt-6 pt-5 border-t border-border">
      <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-3">
        Your thread
      </p>
      <ul className="space-y-3">
        {rows.map((r) => (
          <li
            key={r.id}
            className="rounded-xl bg-muted/30 border border-border p-3"
          >
            <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
              <CategoryPill category={r.category} />
              <span className="tabular-nums">
                {formatRelative(r.created_at)}
              </span>
              <span className="ml-auto">
                <StatusTag status={r.status} />
              </span>
            </div>
            <p className="mt-1.5 text-[13px] text-foreground leading-relaxed whitespace-pre-wrap">
              {r.message}
            </p>
            {r.admin_reply && (
              <div className="mt-3 rounded-lg bg-card border border-dp-navy/30 p-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-dp-navy mb-1 flex items-center gap-1">
                  <Pencil className="size-3" aria-hidden="true" />
                  Team reply{" "}
                  {r.admin_reply_at && (
                    <span className="font-normal text-muted-foreground normal-case tracking-normal">
                      · {formatRelative(r.admin_reply_at)}
                    </span>
                  )}
                </p>
                <p className="text-[13px] text-foreground leading-relaxed whitespace-pre-wrap">
                  {r.admin_reply}
                </p>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function CategoryPill({ category }: { category: string }) {
  const map: Record<string, { label: string; tint: string; Icon: typeof Bug }> =
    {
      bug: {
        label: "Bug",
        tint: "bg-red-50 text-red-700",
        Icon: Bug,
      },
      idea: {
        label: "Idea",
        tint: "bg-amber-50 text-amber-700",
        Icon: Lightbulb,
      },
      love: {
        label: "Love",
        tint: "bg-pink-50 text-pink-700",
        Icon: Heart,
      },
      confused: {
        label: "Confusing",
        tint: "bg-muted text-foreground",
        Icon: HelpCircle,
      },
      question: {
        label: "Question",
        tint: "bg-dp-navy/10 text-dp-navy",
        Icon: MessageCircleQuestion,
      },
      other: {
        label: "Note",
        tint: "bg-muted text-foreground",
        Icon: MessageSquare,
      },
    };
  const spec = map[category] || map.other;
  const Icon = spec.Icon;
  return (
    <span
      className={
        "inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-semibold " +
        spec.tint
      }
    >
      <Icon className="size-2.5" aria-hidden="true" />
      {spec.label}
    </span>
  );
}

function StatusTag({ status }: { status: string }) {
  const map: Record<string, { label: string; tint: string }> = {
    new: { label: "Open", tint: "text-muted-foreground" },
    reviewed: { label: "Seen by team", tint: "text-amber-600" },
    replied: { label: "Team replied", tint: "text-emerald-600" },
    resolved: { label: "Resolved", tint: "text-emerald-600" },
    dismissed: { label: "Closed", tint: "text-muted-foreground/60" },
  };
  const spec = map[status] || map.new;
  return <span className={"text-[10px] font-medium " + spec.tint}>{spec.label}</span>;
}

function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

function formatRelative(iso: string): string {
  const now = Date.now();
  const then = new Date(iso).getTime();
  const diff = now - then;
  const min = 60 * 1000;
  const hr = 60 * min;
  const day = 24 * hr;
  if (diff < min) return "just now";
  if (diff < hr) return `${Math.floor(diff / min)}m ago`;
  if (diff < day) return `${Math.floor(diff / hr)}h ago`;
  if (diff < 7 * day) return `${Math.floor(diff / day)}d ago`;
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}
