import Image from "next/image";
import Link from "next/link";
import { Grid3x3 } from "lucide-react";

type TopBarProps = {
  // Optional overrides — defaults work for any DreamPak mini-app.
  logoSrc?: string;
  logoAlt?: string;
  appsHref?: string;
  homeHref?: string;
};

// Universal DreamPak top bar.
//
// Intentionally minimal: logo on the left, link back to the apps launcher on
// the right. The earlier version shipped a stub search input and a no-op
// Help button — both landed in every bootstrapped app and made the chrome
// look broken. Add them back when your app has a real global search target
// and a real help URL.
//
// The "Apps" link points to the V2 launcher at apps.dreampak.com. The old
// dreampak.com/apps WordPress page was retired and now 404s.
export function TopBar({
  logoSrc = "/brand/dreampak-logo-white.png",
  logoAlt = "DreamPak",
  appsHref = "https://apps.dreampak.com/",
  homeHref = "/",
}: TopBarProps = {}) {
  return (
    <header className="flex h-12 shrink-0 items-center justify-between gap-2 bg-dp-ink px-2 text-white">
      {/* Logo — universal across all DreamPak apps */}
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

      {/* Back to the DreamPak apps launcher (V2). */}
      <Link
        href={appsHref}
        className="inline-flex h-8 items-center gap-1.5 rounded-sm px-2.5 text-sm text-white/80 transition-colors duration-[120ms] ease-out hover:bg-dp-ink-soft hover:text-white"
        title="Back to DreamPak Apps"
        aria-label="Back to DreamPak Apps"
      >
        <Grid3x3 className="size-4" aria-hidden />
        <span>Apps</span>
      </Link>
    </header>
  );
}
