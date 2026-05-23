import type { ReactNode } from "react";
import { TopBar } from "./top-bar";
import { LeftNav, type NavItem } from "./left-nav";

type AppShellProps = {
  // Nav items for the left rail. Each consumer wires its own route list.
  navItems: NavItem[];
  // Optional TopBar overrides — defaults work for any DreamPak mini-app.
  topBarLogoSrc?: string;
  topBarLogoAlt?: string;
  topBarAppsHref?: string;
  topBarHomeHref?: string;
  // v0.2.0 — pass-through slots forwarded to TopBar so consumers can
  // hang their own chrome (account menu, search form, env chip, …)
  // without forking the shell.
  topBarRightSlot?: ReactNode;
  topBarCenterSlot?: ReactNode;
  topBarLeftAccessory?: ReactNode;
  children: ReactNode;
};

// Mini-app shell — workspace = paper, LeftNav = paper-soft, TopBar = dp-ink.
// Access is gated by each consumer's src/proxy.ts (platform-auth proxy).
export function AppShell({
  navItems,
  topBarLogoSrc,
  topBarLogoAlt,
  topBarAppsHref,
  topBarHomeHref,
  topBarRightSlot,
  topBarCenterSlot,
  topBarLeftAccessory,
  children,
}: AppShellProps) {
  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      <TopBar
        logoSrc={topBarLogoSrc}
        logoAlt={topBarLogoAlt}
        appsHref={topBarAppsHref}
        homeHref={topBarHomeHref}
        topRightSlot={topBarRightSlot}
        centerSlot={topBarCenterSlot}
        leftAccessory={topBarLeftAccessory}
      />
      <div className="flex flex-1 overflow-hidden">
        <LeftNav items={navItems} />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
