import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

const APP_VERSION = "1.1.0";

export default defineConfig({
  base: "./",
  publicDir: "public",
  define: {
    __APP_VERSION__: JSON.stringify(APP_VERSION),
  },
  build: {
    outDir: "dist",
    sourcemap: true,
  },
  plugins: [
    react(),
    VitePWA({
      // Prompt + in-app banner is more reliable on installed phone PWAs
      // than silent autoUpdate (iOS often keeps the old shell until kill).
      registerType: "prompt",
      includeAssets: ["IMX-logo.png"],
      manifest: {
        name: "IMX English Hub",
        short_name: "IMX Hub",
        description:
          "Personal English study journal for vocabulary, topics, idioms, and exam practice.",
        start_url: "./",
        scope: "./",
        display: "standalone",
        background_color: "#12100e",
        theme_color: "#12100e",
        orientation: "any",
        icons: [
          {
            src: "IMX-logo.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "IMX-logo.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,png,svg,ico,woff2,webmanifest}"],
        navigateFallback: "index.html",
        cleanupOutdatedCaches: true,
        // New SW takes over immediately once the user accepts the update.
        skipWaiting: true,
        clientsClaim: true,
        // Unique cache namespace so old phone caches are dropped on deploy.
        cacheId: `imx-hub-${APP_VERSION}`,
      },
    }),
  ],
});
