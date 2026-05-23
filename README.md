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

Each project produces one full-page screenshot plus nine per-section screenshots (Typography, Buttons, Pills, Fields, DataTable, Cards, SectionRule, Motion, Color tokens). Baselines live under `tests/__screenshots__/<project>/`.

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
