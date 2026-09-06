/** Live GitHub Pages origin and app base. Delivery is Pages-only. */
export const CLERK_PAGES_ORIGIN = "https://jumboshrimpman.github.io";
export const CLERK_PAGES_HOME = "https://jumboshrimpman.github.io/wealth-passport/";
export const CLERK_PAGES_BASE = "https://jumboshrimpman.github.io/wealth-passport";
export const CLERK_PAGES_PASSPORT = "https://jumboshrimpman.github.io/wealth-passport/passport";

/** After sign-in / sign-up / sign-out — absolute Pages URLs, not localhost. */
export const CLERK_AFTER_AUTH_URL = CLERK_PAGES_HOME;
export const CLERK_AFTER_SIGN_OUT_URL = CLERK_PAGES_HOME;

/** Clerk Dashboard → Allowed origins (Pages origin, no path). */
export const CLERK_ALLOWED_ORIGINS = [CLERK_PAGES_ORIGIN] as const;

/** Clerk Dashboard → Redirect URLs for /wealth-passport on Pages. */
export const CLERK_REDIRECT_URLS = [
  CLERK_PAGES_BASE,
  CLERK_PAGES_HOME,
  CLERK_PAGES_PASSPORT,
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
