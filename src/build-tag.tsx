"use client";

// Tiny build-info pill — bottom-left of every authed surface. Shows
// version + short commit SHA + short build time so the user can tell at
// a glance which revision they're looking at during the beta period.
// Discreet by design: low-contrast pill, small text, click to expand.
//
// Data comes from env vars injected at build time by next.config.ts:
//   NEXT_PUBLIC_BUILD_VERSION  from package.json
//   NEXT_PUBLIC_BUILD_SHA      7-char Vercel commit SHA, empty in dev
//   NEXT_PUBLIC_BUILD_TIME     ISO timestamp captured at `next build`
//
// On dev / localhost the SHA is empty so we show "dev" instead.

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

// Paths where we never show the pill, even for signed-in users.
const PUBLIC_PREFIXES = ["/login", "/auth"];

function isPublicPath(path: string): boolean {
  return PUBLIC_PREFIXES.some((p) => path === p || path.startsWith(p + "/"));
}

function formatShort(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatFull(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
  });
}

export interface BuildTagProps {
  /** Optional prefix shown before "v…" — useful when each mini-app wants to
   *  tag its surface ("Hub", "UPC", "Packaging"). Defaults to no prefix. */
  appLabel?: string;
}

export function BuildTag({ appLabel }: BuildTagProps) {
  const pathname = usePathname() || "/";
  const [expanded, setExpanded] = useState(false);
  // toLocaleString output differs between Node ICU (SSR) and browser ICU
  // (hydration), which trips React hydration. Defer date-derived text
  // until after mount so the server renders nothing for it. Same fix as
  // abodly BUG-106.
  //
  // The canonical "render only on client" pattern unavoidably calls
  // setState inside an effect — React 19's set-state-in-effect rule
  // exempts this case in practice, but the linter still flags it.
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  if (isPublicPath(pathname)) return null;

  const version = process.env.NEXT_PUBLIC_BUILD_VERSION || "0.0.0";
  const sha = process.env.NEXT_PUBLIC_BUILD_SHA || "";
  const time = process.env.NEXT_PUBLIC_BUILD_TIME || "";
  const label = sha ? sha : "dev";
  const prefix = appLabel ? `${appLabel} · ` : "";

  return (
    <div
      className="fixed left-3 bottom-3 z-[900] pointer-events-auto"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        title={
          mounted && time
            ? `Built ${formatFull(time)}${sha ? ` · ${sha}` : ""}`
            : `v${version}`
        }
        aria-label="Build info"
        className="select-none rounded-full border border-border/70 bg-card/70 backdrop-blur-sm px-2 py-0.5 text-[10px] leading-tight text-muted-foreground hover:text-foreground hover:bg-card shadow-sm transition tabular-nums"
      >
        <span>
          {prefix}beta · v{version} · {label}
          {mounted && time && (
            <span className="hidden sm:inline"> · {formatShort(time)}</span>
          )}
        </span>
      </button>
      {expanded && (
        <div className="mt-1 rounded-md border border-border bg-card shadow-lg px-3 py-2 text-[11px] text-foreground tabular-nums max-w-[260px]">
          <div className="font-semibold text-foreground mb-0.5">
            Build info
          </div>
          <div>App: {appLabel ?? "dp-hub"}</div>
          <div>Version: v{version}</div>
          <div>Commit: {sha || "local dev"}</div>
          <div>Built: {mounted && time ? formatFull(time) : "—"}</div>
        </div>
      )}
    </div>
  );
}
