import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const clerkKey = loadEnv(mode, ".", "VITE_").VITE_CLERK_PUBLISHABLE_KEY;
  if (!clerkKey) {
    throw new Error(
      "BUILD FAILURE: VITE_CLERK_PUBLISHABLE_KEY is missing. Pass the GitHub Actions secret into the build step (or set it in .env.local for local work). There is no password-gate fallback.",
    );
  }

  return {
    // Project Pages URL: https://jumboshrimpman.github.io/wealth-passport/
    base: "/wealth-passport/",
    plugins: [react()],
    server: {
      host: true,
      port: 5173,
    },
  };
});
