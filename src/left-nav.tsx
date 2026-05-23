"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentType, SVGProps } from "react";

export type NavItem = {
  href: string;
  label: string;
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
  // Per-route active check. Receives the current pathname.
  isActive: (path: string) => boolean;
};

type LeftNavProps = {
  items: NavItem[];
  ariaLabel?: string;
};

// v2 left nav — paper-soft surface, sharp edges, Geist Sans 500 labels.
// Active item: dp-navy-soft background + dp-navy text + 1px dp-navy left rule.
// Items come from the consumer; each consumer wires its own route list.
export function LeftNav({ items, ariaLabel = "Primary" }: LeftNavProps) {
  const path = usePathname();
  return (
    <nav
      aria-label={ariaLabel}
      className="flex w-56 shrink-0 flex-col border-r border-sidebar-border bg-sidebar py-2"
    >
      {items.map(({ href, label, Icon, isActive }) => {
        const active = isActive(path);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={
              "flex items-center gap-3 border-l border-transparent px-4 py-2 text-sm font-medium transition-colors duration-[120ms] ease-out " +
              (active
                ? "border-dp-navy bg-dp-navy-soft text-dp-navy"
                : "text-sidebar-foreground hover:bg-paper-deep")
            }
          >
            <Icon
              className={"size-4 " + (active ? "text-dp-navy" : "text-muted-foreground")}
            />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
