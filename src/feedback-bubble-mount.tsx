"use client";

// Mount-and-gate wrapper for the FeedbackBubble. Lives in the root layout
// next to BuildTag. Hides on public paths (login, auth callbacks) and
// double-checks auth via a GET /api/platform-feedback ping (401 = not
// signed in, render nothing).
//
// The same component is re-used across the Hub + every mini-app — only the
// `appSlug` prop changes.

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { FeedbackBubble } from "./feedback-bubble";

const PUBLIC_PREFIXES = ["/login", "/auth"];

function isPublicPath(path: string): boolean {
  return PUBLIC_PREFIXES.some((p) => path === p || path.startsWith(p + "/"));
}

export interface FeedbackBubbleMountProps {
  /** Slug used to tag rows in `platform_feedback`. Matches apps.config.ts. */
  appSlug: string;
  /** Where the POST/GET endpoint lives. Defaults to "/" (same-origin — the
   *  Hub talks to itself). Mini-apps pass the Hub URL. */
  apiOrigin?: string;
}

export function FeedbackBubbleMount({
  appSlug,
  apiOrigin = "",
}: FeedbackBubbleMountProps) {
  const pathname = usePathname() || "/";
  // Tri-state: null = not yet probed, true = authed, false = unauthed.
  const [authed, setAuthed] = useState<boolean | null>(null);

  const hiddenByPath = isPublicPath(pathname);

  // Probe the API once per path change, but ONLY when not hidden. State is
  // only mutated inside fetch callbacks per React 19's set-state-in-effect
  // rule — the hidden case is handled below by the conditional render.
  useEffect(() => {
    if (hiddenByPath) return;
    let cancelled = false;
    const url = `${apiOrigin}/api/platform-feedback`;
    fetch(url, {
      cache: "no-store",
      credentials: "include",
    })
      .then((r) => {
        if (cancelled) return;
        setAuthed(r.ok);
      })
      .catch(() => {
        if (!cancelled) setAuthed(false);
      });
    return () => {
      cancelled = true;
    };
  }, [hiddenByPath, pathname, apiOrigin]);

  if (hiddenByPath) return null;
  if (!authed) return null;

  return <FeedbackBubble appSlug={appSlug} apiOrigin={apiOrigin} />;
}
