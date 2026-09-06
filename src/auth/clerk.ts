export function getClerkPublishableKey(): string {
  const key = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
  if (!key) {
    throw new Error(
      "CLERK BOOT FAILURE: VITE_CLERK_PUBLISHABLE_KEY is missing. The GitHub Actions secret must be passed into the Pages build. There is no password-gate fallback.",
    );
  }
  return key;
}

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
