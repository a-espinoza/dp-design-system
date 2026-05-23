import { cn } from "./utils";

type SectionRuleProps = {
  // Optional uppercase label that "punches through" the rule. Omit for a
  // bare full-width line.
  label?: string;
  className?: string;
};

// The blueprint rule — signature divider of the family. 1px `rule-strong`
// line with an optional `text-2xs` uppercase label. See docs/DESIGN.md
// (Borders & rules → The blueprint rule).
//
// Use for the top of major page sections; do NOT use for sub-sections
// (overuse kills the signature).
export function SectionRule({ label, className }: SectionRuleProps) {
  if (!label) {
    return (
      <div
        role="separator"
        aria-hidden
        className={cn("h-px w-full bg-rule-strong", className)}
      />
    );
  }
  return (
    <div role="separator" className={cn("flex items-center gap-3", className)}>
      <span className="h-px w-8 shrink-0 bg-rule-strong" aria-hidden />
      <span className="shrink-0 text-2xs font-medium uppercase tracking-[0.08em] text-foreground">
        {label}
      </span>
      <span className="h-px flex-1 bg-rule-strong" aria-hidden />
    </div>
  );
}
