import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  base: "./",
  publicDir: "public",
  build: {
    outDir: "dist",
    sourcemap: true,
  },
  plugins: [
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["IMX-logo.png"],
      manifest: {
        name: "IMX English Hub",
        short_name: "IMX Hub",
        description:
          "Personal English study journal for vocabulary, topics, and exam practice.",
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
        globPatterns: ["**/*.{js,css,html,png,svg,ico,woff2}"],
        navigateFallback: "index.html",
        cleanupOutdatedCaches: true,
      },
    }),
  ],
});
