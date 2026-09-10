import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const clerkKey = loadEnv(mode, ".", "VITE_").VITE_CLERK_PUBLISHABLE_KEY;
  if (!clerkKey) {
    throw new Error(
      "BUILD FAILURE: VITE_CLERK_PUBLISHABLE_KEY is missing. Create a Clerk Hobby app, put the publishable key in GitHub Actions secrets (and .env.local). Never add CLERK_SECRET_KEY to this static Pages client. There is no password-gate fallback.",
    );
  }

  return {
    // Project Pages URL: https://jumboshrimpman.github.io/wealth-passport/
    base: "/wealth-passport/",
    plugins: [react()],
    server: {
      host: true,
      port: 5173,
      proxy: {
        "/api": {
          target: "http://127.0.0.1:8787",
          changeOrigin: true,
        },
      },
    },
  };
});
