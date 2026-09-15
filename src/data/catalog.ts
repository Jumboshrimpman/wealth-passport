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
  client: "/chat",
  institution: "/institution",
  admin: "/admin",
};

export const MODE_NAV: Record<AppMode, { to: string; label: string }[]> = {
  client: [
    { to: "/chat", label: "Chat" },
    { to: "/passport", label: "Passport" },
    { to: "/verification", label: "Verification" },
    { to: "/offers", label: "Offers" },
    { to: "/ops", label: "Ops" },
  ],
  institution: [{ to: "/institution", label: "Offer console" }],
  admin: [{ to: "/admin", label: "Overview" }],
};

export function modesAllowedForPath(pathname: string): AppMode[] {
  if (pathname === "/institution") return ["institution", "admin"];
  if (pathname === "/admin") return ["admin"];
  if (
    pathname === "/chat" ||
    pathname === "/passport" ||
    pathname === "/verification" ||
    pathname === "/offers" ||
    pathname === "/ops"
  ) {
    return ["client", "admin"];
  }
  return ["client", "institution", "admin"];
}
