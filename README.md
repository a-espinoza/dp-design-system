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
| `@dreampak/design-system/app-shell` | `AppShell` (TopBar + LeftNav + workspace) |
| `@dreampak/design-system/top-bar` | `TopBar` (dp-ink bar, configurable logo + apps link) |
| `@dreampak/design-system/left-nav` | `LeftNav` (paper-soft sidebar, takes generic `navItems` prop) |

## Versioning

Releases are git tags. Consumers pin to a tag for stability:

```json
"@dreampak/design-system": "github:a-espinoza/dp-design-system#v0.1.0"
```

Or track `main` for latest:

```json
"@dreampak/design-system": "github:a-espinoza/dp-design-system#main"
```

## License

UNLICENSED — DreamPak family internal use only.
