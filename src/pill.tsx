import { cn } from "./utils";

export type PillStatus =
  | "issued"
  | "pending"
  | "approved"
  | "archived"
  | "blocked";

type PillProps = {
  status: PillStatus;
  className?: string;
  children: React.ReactNode;
};

const variants: Record<PillStatus, string> = {
  issued: "border border-status-issued-border text-status-issued-fg",
  pending: "border border-status-pending-border text-status-pending-fg",
  approved: "border border-status-approved-border text-status-approved-fg",
  archived: "border border-status-archived-border text-status-archived-fg",
  blocked: "bg-status-error-bg text-status-error-fg",
};

// Outline-by-default per the v2 status palette. Solid fill reserved for
// `blocked` (error). 2px radius reads as printed. See docs/DESIGN.md
// → Status palette.
export function Pill({ status, className, children }: PillProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-pill px-2 py-0.5 text-2xs font-medium uppercase tracking-[0.06em]",
        variants[status],
        className
      )}
    >
      {children}
    </span>
  );
}
