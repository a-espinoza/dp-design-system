import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { Grid3x3 } from "lucide-react";

type TopBarProps = {
  // Optional overrides — defaults work for any DreamPak mini-app.
  logoSrc?: string;
  logoAlt?: string;
  appsHref?: string;
  homeHref?: string;
  // v0.2.0 — optional render slots so consumers can hang their own chrome
  // (account menu, search form, environment chip, breadcrumbs, …) without
  // forking the TopBar. Slots are pure pass-through; when undefined the
  // original v0.1.x layout renders unchanged.
  topRightSlot?: ReactNode;
  centerSlot?: ReactNode;
  leftAccessory?: ReactNode;
};

// Universal DreamPak top bar.
//
// Intentionally minimal by default: logo on the left, link back to the apps
// launcher on the right. Consumers that need richer chrome (search,
// account menus, environment chips) inject it via the v0.2.0 slot props
// rather than forking the bar.
//
// The "Apps" link points to the V2 launcher at apps.dreampak.com. The old
// dreampak.com/apps WordPress page was retired and now 404s.
export function TopBar({
  logoSrc = "/brand/dreampak-logo-white.png",
  logoAlt = "DreamPak",
  appsHref = "https://apps.dreampak.com/",
  homeHref = "/",
  topRightSlot,
  centerSlot,
  leftAccessory,
}: TopBarProps = {}) {
  return (
    <header className="flex h-12 shrink-0 items-center justify-between gap-2 bg-dp-ink px-2 text-white">
      {/* Logo + optional left accessory (e.g., environment chip) */}
      <div className="flex items-center gap-2">
        <Link
          href={homeHref}
          className="flex h-9 items-center rounded-sm px-2 transition-colors duration-[120ms] ease-out hover:bg-dp-ink-soft"
          aria-label="Go to home"
        >
          <Image
            src={logoSrc}
            alt={logoAlt}
            width={420}
            height={88}
            priority
            className="h-6 w-auto"
          />
        </Link>
        {leftAccessory}
      </div>

      {/* Optional center slot — search bars, breadcrumbs, etc. */}
      {centerSlot ? <div className="flex flex-1 justify-center">{centerSlot}</div> : null}

      {/* Right cluster: caller slot first, then the universal Apps link. */}
      <div className="flex items-center gap-0.5">
        {topRightSlot}
        <Link
          href={appsHref}
          className="inline-flex h-8 items-center gap-1.5 rounded-sm px-2.5 text-sm text-white/80 transition-colors duration-[120ms] ease-out hover:bg-dp-ink-soft hover:text-white"
          title="Back to DreamPak Apps"
          aria-label="Back to DreamPak Apps"
        >
          <Grid3x3 className="size-4" aria-hidden />
          <span>Apps</span>
        </Link>
      </div>
    </header>
  );
}
