import type { Offer } from "../../shared/types.ts";

export { formatUsd } from "../../shared/format.ts";
export type {
  Institution,
  InstitutionKind,
  InstitutionTargeting,
  Offer,
  PlacementKind,
} from "../../shared/types.ts";

export const PRODUCT_NAME = "WealthPass";

export const TAGLINE =
  "Standardized and comprehensive investment potential across firms.";

export type AppMode = "client" | "institution" | "admin";

export function offerHeadline(offer: Offer): string {
  return `${offer.strategy} for ${offer.bps} bps (discounted ${offer.feeDiscountPct}% max fee)`;
}

export const MODE_HOMES: Record<AppMode, string> = {
  client: "/assistant",
  institution: "/institution",
  admin: "/admin",
};

export const MODE_NAV: Record<AppMode, { to: string; label: string }[]> = {
  client: [
    { to: "/assistant", label: "Assistant" },
    { to: "/offers", label: "Pitches" },
    { to: "/strategies", label: "Strategies" },
    { to: "/financials", label: "Financials" },
    { to: "/settings", label: "Settings" },
  ],
  institution: [
    { to: "/institution", label: "Home" },
    { to: "/institution/clients", label: "Clients" },
    { to: "/institution/strategies", label: "Strategies" },
    { to: "/institution/pitches", label: "Pitches" },
    { to: "/institution/settings", label: "Settings" },
  ],
  admin: [{ to: "/admin", label: "Overview" }],
};

export function modeFromPath(pathname: string): AppMode | null {
  if (pathname === "/admin") return "admin";
  if (pathname === "/institution" || pathname.startsWith("/institution/")) return "institution";
  if (
    pathname === "/assistant" ||
    pathname === "/chat" ||
    pathname === "/offers" ||
    pathname === "/strategies" ||
    pathname === "/financials" ||
    pathname === "/settings" ||
    pathname === "/passport" ||
    pathname === "/verification" ||
    pathname === "/ops"
  ) {
    return "client";
  }
  return null;
}

export function modesAllowedForPath(pathname: string): AppMode[] {
  const mode = modeFromPath(pathname);
  if (mode === "institution") return ["institution", "admin"];
  if (mode === "admin") return ["admin"];
  if (mode === "client") return ["client", "admin"];
  if (pathname === "/enroll") return ["client", "admin"];
  return ["client", "institution", "admin"];
}
