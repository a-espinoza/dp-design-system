import { cn } from "./utils";

// Bordered surface — `border` outline, paper bg, flat edges (no radii).
// Compose with `<SectionRule label="…" />` at the top instead of a header bar.
// Padding is intentionally NOT baked in — callers control rhythm per surface
// (data blocks tight, narrative blocks generous).
export function Card({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("border border-border bg-card", className)}
      {...props}
    />
  );
}

export function CardBody({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-6", className)} {...props} />;
}
