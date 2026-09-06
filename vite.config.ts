import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  // Project Pages URL: https://jumboshrimpman.github.io/wealth-passport/
  base: "/wealth-passport/",
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
  },
});
