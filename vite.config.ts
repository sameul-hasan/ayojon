import { defineConfig } from "vite";
import path from "path";
import { aayojonApiPlugin } from "./src/server/api-middleware";

export default defineConfig({
  esbuild: {
    jsx: "automatic",
  },
  plugins: [aayojonApiPlugin()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5173,
    host: true,
  },
  preview: {
    port: 5173,
    host: true,
  },
});
