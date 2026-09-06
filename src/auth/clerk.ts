export const CLERK_PAGES_ORIGIN = "https://jumboshrimpman.github.io";
export const CLERK_PAGES_BASE = "https://jumboshrimpman.github.io/wealth-passport";
export const CLERK_LOCAL_ORIGIN = "http://localhost:5173";
export const CLERK_LOCAL_BASE = "http://localhost:5173/wealth-passport";

/** Clerk Dashboard → Configure → Domains / Allowed origins */
export const CLERK_ALLOWED_ORIGINS = [CLERK_PAGES_ORIGIN, CLERK_LOCAL_ORIGIN] as const;

/**
 * Clerk Dashboard → Configure → Paths / Allowed redirect URLs
 * (after sign-in, after sign-up, and sign-out).
 */
export const CLERK_REDIRECT_URLS = [
  CLERK_PAGES_BASE,
  `${CLERK_PAGES_BASE}/`,
  `${CLERK_PAGES_BASE}/passport`,
  CLERK_LOCAL_BASE,
  `${CLERK_LOCAL_BASE}/`,
  `${CLERK_LOCAL_BASE}/passport`,
] as const;

export const clerkAppearance = {
  variables: {
    colorPrimary: "#6b7f5a",
    colorBackground: "#fffdf8",
    colorText: "#221c14",
    colorTextSecondary: "#4a4033",
    colorInputBackground: "#fffdf8",
    colorInputText: "#221c14",
    borderRadius: "14px",
    fontFamily: '"Source Sans 3", "Segoe UI", sans-serif',
  },
} as const;
