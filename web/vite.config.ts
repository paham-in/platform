import { tanstackRouter } from "@tanstack/router-plugin/vite";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tanstackRouter({ target: "react" }),
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: "auto",
      strategies: "injectManifest",
      srcDir: "src",
      filename: "sw.ts",
      injectManifest: {
        globPatterns: ["**/*.{js,css,html,svg,png,ico,woff2,woff,ttf}"],
        // Bundle utama > 2 MiB (default limit Workbox), naikkan supaya app shell ter-precache.
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
      },
      manifest: {
        name: "Pahamin",
        short_name: "Pahamin",
        description: "Platform bimbel online, materi terstruktur, forum tanya-jawab, dan les privat.",
        lang: "id",
        display: "standalone",
        orientation: "portrait",
        start_url: "/login",
        scope: "/",
        theme_color: "#ffffff",
        background_color: "#ffffff",
        // W3C spec (appmanifest): color_scheme_dark di level root manifest.
        color_scheme_dark: {
          theme_color: "#0c0c09",
          background_color: "#0c0c09",
        },
        // Chrome WebAPK: dark color dibungkus di user_preferences.
        // Keduanya di-cast lewat `as any` karena belum ada di tipe ManifestOptions vite-plugin-pwa.
        user_preferences: {
          color_scheme_dark: {
            theme_color: "#0c0c09",
            background_color: "#0c0c09",
          },
        },
        icons: [
          {
            src: "/favicon.ico",
            sizes: "64x64 32x32 24x24 16x16",
            type: "image/x-icon",
          },
          {
            src: "/logo192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "/logo512.png",
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: "/logo512-maskable.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
          {
            src: "/apple-touch-icon.png",
            sizes: "180x180",
            type: "image/png",
          },
        ],
      } as any,
      workbox: {
        // SPA fallback saat offline (navigasi → index.html yang sudah di-precache).
        navigateFallback: "/index.html",
        navigateFallbackDenylist: [/^\/api\//],
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
