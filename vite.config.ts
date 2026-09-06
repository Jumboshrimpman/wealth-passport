import { copyFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";

/** Copy index.html → 404.html so GitHub Pages serves the SPA on deep links. */
function githubPagesSpaFallback(): Plugin {
  return {
    name: "github-pages-spa-fallback",
    closeBundle() {
      const index = resolve("dist/index.html");
      copyFileSync(index, resolve("dist/404.html"));
      writeFileSync(resolve("dist/.nojekyll"), "");
    },
  };
}

export default defineConfig({
  // Project Pages URL: https://jumboshrimpman.github.io/wealth-passport/
  base: "/wealth-passport/",
  plugins: [react(), githubPagesSpaFallback()],
  server: {
    host: true,
    port: 5173,
  },
});
