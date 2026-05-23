# @dreampak/design-system

Spec-sheet Editorial design system for the DreamPak app family — shared tokens, chrome, and ui primitives that every mini-app imports.

This package is the source of truth for the v2 design language. The full rationale lives in [`dp-app-template/docs/DESIGN.md`](https://github.com/a-espinoza/dp-app-template).

## Install

In each consumer app:

```bash
npm install github:a-espinoza/dp-design-system
```

## Consume

### 1. Stylesheet + fonts in `src/app/layout.tsx`

```tsx
import "@dreampak/design-system/styles.css";
import "./globals.css";
import { fontVariables } from "@dreampak/design-system/fonts";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${fontVariables()} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
```

### 2. Chrome in `src/app/(app)/layout.tsx`

```tsx
import { AppShell } from "@dreampak/design-system/app-shell";
import { Home, List, Settings } from "lucide-react";

const navItems = [
  { href: "/",         label: "Home",     Icon: Home,     isActive: (p: string) => p === "/" },
  { href: "/items",    label: "Items",    Icon: List,     isActive: (p: string) => p.startsWith("/items") },
  { href: "/settings", label: "Settings", Icon: Settings, isActive: (p: string) => p.startsWith("/settings") },
];

export default function AppRouteLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell navItems={navItems}>
      <div className="animate-page-enter">{children}</div>
    </AppShell>
  );
}
```

### 3. Primitives anywhere

```tsx
import { Button } from "@dreampak/design-system/button";
import { Card, CardBody } from "@dreampak/design-system/card";
import { Pill } from "@dreampak/design-system/pill";
import { Field, Input } from "@dreampak/design-system/field";
import { DataTable } from "@dreampak/design-system/data-table";
import { SectionRule } from "@dreampak/design-system/section-rule";
```

### 4. Next.js config

Add `transpilePackages` so Next.js can compile the TSX directly:

```ts
// next.config.ts
const nextConfig: NextConfig = {
  transpilePackages: ["@dreampak/design-system"],
};
```

### 5. Tailwind v4 source scanning

In `src/app/globals.css`, add a `@source` directive so Tailwind generates utility classes used inside the package:

```css
@import "@dreampak/design-system/styles.css";
@source "../../node_modules/@dreampak/design-system/src";

/* App-specific overrides below */
```

## Exports

| Path | What it is |
|---|---|
| `@dreampak/design-system/styles.css` | Full v2 design tokens, status palette, easings, `prefers-reduced-motion`, `animate-page-enter` |
| `@dreampak/design-system/fonts` | `fraunces`, `geistSans`, `geistMono` next/font/google loaders + `fontVariables()` helper |
| `@dreampak/design-system/utils` | `cn(...)` class-name helper (clsx + tailwind-merge) |
| `@dreampak/design-system/button` | `Button` (CVA variants: default, primary, secondary, tertiary, ghost, destructive, link) |
| `@dreampak/design-system/card` | `Card`, `CardBody` |
| `@dreampak/design-system/pill` | `Pill` (5 statuses: issued, pending, approved, archived, blocked) |
| `@dreampak/design-system/field` | `Field` (label + helper wrapper), `Input` (baseline input) |
| `@dreampak/design-system/data-table` | `DataTable<T>` generic table |
| `@dreampak/design-system/section-rule` | `SectionRule` (the blueprint rule, optional label) |
| `@dreampak/design-system/app-shell` | `AppShell` (TopBar + LeftNav + workspace, forwards TopBar slots) |
| `@dreampak/design-system/top-bar` | `TopBar` (dp-ink bar; configurable logo + apps link; `topRightSlot` / `centerSlot` / `leftAccessory` render slots) |
| `@dreampak/design-system/left-nav` | `LeftNav` (paper-soft sidebar; generic `navItems` with optional per-item `badge` render slot) |
| `@dreampak/design-system/feedback-bubble` | `FeedbackBubble` — the floating FAB that powers the family-wide beta feedback channel |
| `@dreampak/design-system/feedback-bubble-mount` | `FeedbackBubbleMount` — mount-and-gate wrapper for `FeedbackBubble`; the root layout invokes this one |
| `@dreampak/design-system/build-tag` | `BuildTag` — the bottom-left version pill so users know which revision they're looking at |
| `@dreampak/design-system/screenshot-editor` | `ScreenshotEditor` — overlay that crops + annotates a `html2canvas` capture before attach |
| `@dreampak/design-system/toast` | `ToastProvider`, `useToast()`, 5 variants (success/error/warn/info/loading) — motion per docs/DESIGN.md |
| `@dreampak/design-system/spinner` | `Spinner` (xs/sm/md/lg) — the 12px rotating glyph per docs/DESIGN.md spinner spec |
| `@dreampak/design-system/eslint-config` | Shared flat-config ESLint config (Next core-web-vitals + Next TS + `.vercel/**` ignore) |

## ESLint

The package ships a shared ESLint flat config that bundles `eslint-config-next`'s core-web-vitals + typescript rulesets and the `.vercel/**` build-artifact ignore (the one Phase 5 surfaced as drift across 5 of 8 consumers).

Use it in the consumer's `eslint.config.mjs`:

```js
import dpConfig from "@dreampak/design-system/eslint-config";
export default dpConfig;
```

Or extend it:

```js
import { defineConfig } from "eslint/config";
import dpConfig from "@dreampak/design-system/eslint-config";

export default defineConfig([
  ...dpConfig,
  // App-specific overrides go here.
]);
```

Peer dependencies (optional — only needed when you adopt the shared config): `eslint ^9`, `eslint-config-next ^16`. They're declared optional, so v0.2.x consumers that haven't migrated their lint config will continue to work without edits.

## Chrome slot props (v0.2.0)

The default chrome covers the lowest-common-denominator mini-app — logo + Apps link in the bar, label + icon in the nav. Consumers that need more (badges, account menus, search forms, environment chips) inject those into render slots rather than forking the components.

```tsx
import { AppShell } from "@dreampak/design-system/app-shell";
import type { NavItem } from "@dreampak/design-system/left-nav";
import { Home, List } from "lucide-react";

const navItems: NavItem[] = [
  { href: "/", label: "Home", Icon: Home, isActive: (p) => p === "/" },
  {
    href: "/items",
    label: "Items",
    Icon: List,
    isActive: (p) => p.startsWith("/items"),
    // Inline badge — caller fully controls the visual.
    badge: pendingCount > 0 ? (
      <span className="inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-dp-cyan px-1.5 text-[10px] font-semibold leading-none text-white">
        {pendingCount}
      </span>
    ) : undefined,
  },
];

<AppShell
  navItems={navItems}
  topBarLeftAccessory={<EnvChip env="staging" />}
  topBarCenterSlot={<GlobalSearchForm />}
  topBarRightSlot={<AccountMenu userEmail={email} />}
>
  {children}
</AppShell>
```

All slots are optional; when undefined the v0.1.x layout renders unchanged.

## Feedback bubble + BuildTag (v0.5.0)

Every authed surface in the DreamPak family carries two small components in
its root `layout.tsx`:

- `<FeedbackBubbleMount>` — the floating FAB ("beta feedback"). Lets any
  authenticated user drop a categorized note + optional screenshot. Posts
  to a single centralized endpoint at `apps.dreampak.com/api/platform-feedback`
  via the shared `.dreampak.com` session cookie.
- `<BuildTag>` — a tiny pill, bottom-left, that prints the build version,
  short commit SHA, and build time. Driven by `NEXT_PUBLIC_BUILD_VERSION`
  / `NEXT_PUBLIC_BUILD_SHA` / `NEXT_PUBLIC_BUILD_TIME` env vars injected
  at `next build`.

Both components self-gate: they hide on `/login` and `/auth/*`, and the
bubble additionally probes `/api/platform-feedback` (GET) to verify the
session before rendering.

### Hub (same-origin)

```tsx
import { FeedbackBubbleMount } from "@dreampak/design-system/feedback-bubble-mount";
import { BuildTag } from "@dreampak/design-system/build-tag";

<FeedbackBubbleMount appSlug="dp-hub" />
<BuildTag appLabel="Hub" />
```

### Mini-app (cross-origin to the Hub)

```tsx
<FeedbackBubbleMount
  appSlug="dp-upc"
  apiOrigin="https://apps.dreampak.com"
/>
<BuildTag appLabel="UPC" />
```

### Endpoint contract

The components expect the Hub-side endpoint to support:

- `GET  /api/platform-feedback`   → 200 with `ThreadSnapshot` JSON on auth, 401 on no session
- `GET  /api/platform-feedback?markSeen=1` → same shape, also marks admin replies seen
- `POST /api/platform-feedback`   → 200 with `{ count, levelUp }` JSON on success

The endpoint lives in `dp-hub` and reads/writes the `platform_feedback`
table on `dp-platform`. The package does NOT ship the route — each
consumer relies on the Hub to host it.

### html2canvas dependency

`FeedbackBubble` lazy-loads `html2canvas` via dynamic `import()` only when
the user taps "Add screenshot." `html2canvas` is NOT declared as a
dependency on this package because:

1. Dynamic imports don't fail at module-resolution time — they fail only
   when the user attempts the screenshot path.
2. Consumers that previously shipped the bubble locally already have
   `html2canvas` installed; the migration to v0.5.0 doesn't disturb that.

A consumer that wants the screenshot path to work MUST keep
`html2canvas` in its own `package.json`. If absent, the screenshot
button surfaces a polite "couldn't capture" error and the text-only
feedback path still works.

## Toast + Spinner (v0.6.0)

Two new primitives consolidate per-app rolled-by-hand UX: the standard
toast notification system and the standard spinner glyph. Previously
every consumer rolled its own (mostly `Loader2` from lucide for spinners,
varied/missing toast UX).

### Spinner

```tsx
import { Spinner } from "@dreampak/design-system/spinner";

<Spinner size="md" />                  // default — 16px
<Spinner size="xs" />                  // inline in dense data rows
<Spinner size="lg" />                  // page-level loading shells

// Inside a button — picks up the button's text color via currentColor.
<Button variant="primary" disabled>
  <Spinner size="sm" />
  Saving…
</Button>
```

Per [`docs/DESIGN.md`](https://github.com/a-espinoza/dp-app-template/blob/main/docs/DESIGN.md)
§ Motion: "a 12px rotating glyph spinning linear-360°-1s-infinite. Never
animate-pulse. Never a glowing dot." Color inherits from `currentColor`
so callers control via parent text color.

### Toast

```tsx
// src/app/layout.tsx — mount the provider near the app root.
import { ToastProvider } from "@dreampak/design-system/toast";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body>
        <ToastProvider position="bottom-right">{children}</ToastProvider>
      </body>
    </html>
  );
}
```

```tsx
// Anywhere inside the provider tree.
"use client";
import { useToast } from "@dreampak/design-system/toast";

function SaveButton() {
  const { toast, dismiss } = useToast();
  return (
    <Button
      onClick={async () => {
        const id = toast({ variant: "loading", title: "Saving…" });
        try {
          const created = await save();
          dismiss(id);
          toast({
            variant: "success",
            title: "Saved",
            description: `${created.id} created`,
          });
        } catch (err) {
          dismiss(id);
          toast({
            variant: "error",
            title: "Couldn't save",
            description: err instanceof Error ? err.message : "Unknown error",
          });
        }
      }}
    >
      Save
    </Button>
  );
}
```

#### Variants

| Variant   | Token base                                    | Glyph         | Auto-dismiss |
|-----------|-----------------------------------------------|---------------|--------------|
| `success` | outline status-approved-border + -fg          | Check         | 5 s          |
| `error`   | solid status-error-bg + -fg                   | AlertCircle   | 8 s          |
| `warn`    | outline status-pending-border + -fg           | AlertTriangle | 5 s          |
| `info`    | outline status-issued-border + -fg            | Info          | 5 s          |
| `loading` | paper-deep + ink-soft + inline `<Spinner />`  | Spinner       | indefinite   |

The variant→token mapping mirrors the Pill primitive so the visual
family stays cohesive.

#### Motion

Per [`docs/DESIGN.md`](https://github.com/a-espinoza/dp-app-template/blob/main/docs/DESIGN.md)
§ Motion table:

- Enter: translate from edge + opacity, **240 ms ease-out** (`var(--ease-out)`)
- Exit:  half-distance translate + opacity, **180 ms ease-in** (`var(--ease-in)`)

The exit is deliberately subtler than the enter — Jakub's
subtler-exit rule. `prefers-reduced-motion` collapses both transitions
to ~0 via the global `@media` rule in `styles.css`.

#### Position

`ToastProvider position` accepts `bottom-right` (default), `bottom-left`,
`top-right`, `top-left`, or `bottom-center`. Translate origin auto-adjusts.

#### Manual dismiss

- Click anywhere on the toast → dismisses that toast
- Press **Escape** → dismisses the most-recent toast

#### Stack cap

Max **4** toasts visible. New toasts push older ones up; if the stack
overflows, the oldest is dropped so the newest is always visible.

## Versioning

Releases are git tags. Consumers pin to a tag for stability:

```json
"@dreampak/design-system": "github:a-espinoza/dp-design-system#v0.1.0"
```

Or track `main` for latest:

```json
"@dreampak/design-system": "github:a-espinoza/dp-design-system#main"
```

## Visual regression

`v0.4.0` adds a Playwright-based screenshot harness for every primitive shipped by the package. The harness boots `dp-app-template`'s `/showcase` route — the single page that exercises every variant — and screenshot-diffs against committed baselines.

**Why a separate harness for the package:** the package has no app to render in. The showcase route is the canonical reference surface, and the harness catches accidental visual drift before publish so consumers don't have to.

### Running locally

The harness expects `dp-app-template` to be a sibling directory:

```
SAAS Factory/
  dp-design-system/
  dp-app-template/
```

From the package root:

```bash
# One-time browser install
npm run test:visual:install

# Run the harness (diffs against committed baselines)
npm run test:visual

# Intentional design change — regenerate baselines, then commit them
npm run test:visual:update
```

### What runs

Four Playwright projects render `/showcase`:

- `desktop` — 1280×800 Chromium
- `tablet` — iPad Pro 11
- `mobile` — iPhone 13
- `reduced-motion` — desktop viewport with `prefers-reduced-motion: reduce` emulated

Each project produces one full-page screenshot plus eleven per-section screenshots (Typography, Buttons, Pills, Fields, DataTable, Cards, SectionRule, Motion, Color tokens, Spinners, Toasts). Baselines live under `tests/__screenshots__/<project>/`.

### CI

**`v0.4.1` removed the GitHub Actions workflow.** The original `.github/workflows/visual-regression.yml` cloned `a-espinoza/dp-app-template` as a sibling — but that repo doesn't exist on GitHub (the template is local-only inside the SAAS Factory workspace). The workflow could never run green. Until the showcase is migrated into this package as a self-contained Next.js demo, the harness is **local-only**: run it manually before publishing a release that touches any primitive or token.

### Pre-release checklist (manual)

Before tagging a new version, the maintainer runs:

```bash
cd path/to/dp-design-system
npm run test:visual:install   # one-time browser install
npm run test:visual           # diffs against committed baselines

# If the diff is intentional:
npm run test:visual:update    # regenerate baselines
git add tests/__screenshots__/
git commit -m "chore(visual): rebaseline for vX.Y.Z"
```

If `test:visual` fails on a non-intentional diff, do NOT publish — investigate and fix.

### Maintainer responsibilities

- Treat baseline diffs as code review. Intentional visual changes regenerate baselines; unintentional ones get rolled back.
- Don't commit screenshots outside `tests/__screenshots__/` — the gitignore covers `playwright-report/`, `test-results/`, and `blob-report/`.
- The package version that ships visual changes bumps minor; baseline-only churn within an unchanged primitive still gets a release note.

### Follow-up

A future minor version may move the `/showcase` route INTO this package as a self-contained Next.js demo (under `examples/showcase-app/`) so the harness can boot without depending on an external repo. That migration would re-enable a CI workflow. Tracked as follow-up under the design-system project.

## Changelog

### v0.6.0 (2026-05-23)
- New exports: `@dreampak/design-system/toast` (`ToastProvider`, `useToast()`, 5 variants) and `@dreampak/design-system/spinner` (`Spinner` xs/sm/md/lg)
- Spinner is the 12px rotating glyph per `docs/DESIGN.md` § Motion — fixed-stroke circle + quarter-arc front; no pulse, no glow, no dot. Inherits `currentColor`.
- Toast motion is 240 ms ease-out enter / 180 ms ease-in exit (the subtler-exit rule) per `docs/DESIGN.md` Motion table. Variants map to v2 status tokens so the visual family stays cohesive with Pill.
- Auto-dismiss per variant (success/info/warn 5 s, error 8 s, loading indefinite). Manual dismiss on click or Escape. Max 4 toasts stacked.
- Showcase route in `dp-app-template` gains "Spinners" and "Toasts" sections with a live-fire trigger button at the footer
- New baselines for the two new showcase sections only — the other 9 sections are unchanged
- No breaking changes; v0.5.x consumers continue to work without edits. No new npm deps — pure React context + Portal + the package's existing `tw-animate-css` utilities.

### v0.5.0 (2026-05-23)
- New exports: `@dreampak/design-system/feedback-bubble`, `/feedback-bubble-mount`, `/build-tag`, `/screenshot-editor` — the family-wide beta feedback FAB + version pill, previously duplicated as local copies in all 9 consumer repos (dp-hub + 8 apps including the template)
- Extracted from `dp-hub/src/components/feedback/*` (the canonical source); files identical across consumers per the 2026-05-23 audit
- `html2canvas` stays dynamically imported by `FeedbackBubble`; consumers that want the screenshot path keep it in their own `package.json`
- Per-consumer migration (delete `src/components/feedback/`, swap imports) is the Phase 10 sweep on the consumer side; this release is purely additive
- No baseline changes — none of the new components render on the showcase route

### v0.4.1 (2026-05-23)
- Remove `.github/workflows/visual-regression.yml` — the workflow tried to clone `a-espinoza/dp-app-template` which doesn't exist on GitHub (template is local-only). Harness is now local-only with a documented pre-release checklist.
- No runtime, API, or baseline changes from v0.4.0.

### v0.4.0 (2026-05-23)
- New tooling: Playwright visual regression harness — screenshots every primitive variant on `dp-app-template`'s `/showcase` route at 3 viewports plus reduced-motion
- ~~CI: `.github/workflows/visual-regression.yml`~~ — removed in v0.4.1 (workflow could never run; see v0.4.1 entry)
- Baselines: `tests/__screenshots__/` is the source of truth for the v2 visual contract
- Adds `@playwright/test` + `playwright` as devDependencies; consumers are unaffected (devDependencies are not installed when the package is consumed via `github:` URL)
- No runtime or API changes; this is a tooling-only release

### v0.3.0 (2026-05-23)
- New export: `@dreampak/design-system/eslint-config` — shared flat-config ESLint config (Next core-web-vitals + Next TS + `.vercel/**` ignore)
- Adds optional `eslint` + `eslint-config-next` peer dependencies (only required when the consumer opts into the shared config)
- Eliminates the `.vercel/output/` lint pollution drift Phase 5 surfaced across 5 of 8 consumers
- No breaking changes; v0.2.x consumers continue to work without edits

### v0.2.0
- TopBar gains `topRightSlot`, `centerSlot`, `leftAccessory` render-prop slots
- LeftNav `NavItem` gains optional `badge` field
- AppShell forwards the new TopBar slots via `topBarRightSlot` / `topBarCenterSlot` / `topBarLeftAccessory`
- No breaking changes; v0.1.x consumers continue to work without edits

### v0.1.1 (2026-05-22)
- fix: TopBar accepts logo/href overrides so AppShell typechecks

### v0.1.0 (2026-05-22)
- Initial extraction from dp-app-template

## License

UNLICENSED — DreamPak family internal use only.
