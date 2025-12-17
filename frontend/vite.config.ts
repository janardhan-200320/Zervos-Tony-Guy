import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
import { createHtmlPlugin } from "vite-plugin-html";
import mkcert from "vite-plugin-mkcert";

export default defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    mkcert(),
    createHtmlPlugin({
      minify: true,
      inject: {
        data: {
          cspMeta: `<meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://checkout.razorpay.com https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' data: https://fonts.gstatic.com; img-src 'self' data: https: blob:; connect-src 'self' https://api.razorpay.com https://*.supabase.co wss://*.supabase.co; frame-src 'self' https://checkout.razorpay.com; object-src 'none'; base-uri 'self'; form-action 'self';">`,
        },
      },
    }),
    ...(process.env.NODE_ENV !== "production" &&
    process.env.REPL_ID !== undefined
      ? [
          await import("@replit/vite-plugin-cartographer").then((m) =>
            m.cartographer(),
          ),
          await import("@replit/vite-plugin-dev-banner").then((m) =>
            m.devBanner(),
          ),
        ]
      : []),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "..", "backend", "shared"),
      "@assets": path.resolve(import.meta.dirname, "..", "attached_assets"),
    },
  },
  root: path.resolve(import.meta.dirname, "client"),
  envDir: path.resolve(import.meta.dirname),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
  server: {
    https: true,
    port: 5176, // Change this to any port you want (e.g., 3000, 8080, 5175, etc.)
    hmr: {
      overlay: false,
    },
    proxy: {
      "/api": {
        // Match the dev server PORT used in package.json dev:server (currently 5001)
        target: "http://localhost:5001",
        changeOrigin: true,
      },
    },
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
});
