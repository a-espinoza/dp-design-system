import { cn } from "./utils";

export type SpinnerSize = "xs" | "sm" | "md" | "lg";

const sizes: Record<SpinnerSize, string> = {
  xs: "size-3",
  sm: "size-3.5",
  md: "size-4",
  lg: "size-5",
};

// Per docs/DESIGN.md § Motion: "a 12px rotating glyph spinning
// linear-360°-1s-infinite". SVG circle with stroke-dasharray gap +
// animate-spin (Tailwind built-in via tw-animate-css). Color inherits
// from currentColor so callers control via parent text color.
//
// No pulse, no glow, no dot. The fixed-stroke circle (20% opacity) with
// a quarter-arc rotating in front is the only spinner shape in v2.
//
// Default size is `md` (16px / size-4) — the table cell / button glyph
// size. Use `xs` (12px) inline in dense data rows, `lg` (20px) for
// page-level loading shells.
export function Spinner({
  size = "md",
  className,
  ariaLabel = "Loading",
}: {
  size?: SpinnerSize;
  className?: string;
  ariaLabel?: string;
}) {
  return (
    <svg
      className={cn("animate-spin text-current", sizes[size], className)}
      viewBox="0 0 24 24"
      fill="none"
      role="status"
      aria-label={ariaLabel}
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeOpacity="0.2"
        strokeWidth="3"
      />
      <path
        d="M22 12a10 10 0 0 1-10 10"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}
