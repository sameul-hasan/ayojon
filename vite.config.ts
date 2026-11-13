import { defineConfig, loadEnv } from "vite";
import path from "path";
import { aayojonApiPlugin } from "./src/server/api-middleware";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  const firebaseApiKey = env.VITE_FIREBASE_API_KEY || "AIzaSyCMkAcVKZoH9_tp7L0Gv83Vh7MM_aLsWXA";
  const firebaseAuthDomain = env.VITE_FIREBASE_AUTH_DOMAIN || "ayojon-d3350.firebaseapp.com";
  const firebaseProjectId = env.VITE_FIREBASE_PROJECT_ID || "ayojon-d3350";
  const firebaseStorageBucket = env.VITE_FIREBASE_STORAGE_BUCKET || "ayojon-d3350.firebasestorage.app";
  const firebaseMessagingSenderId = env.VITE_FIREBASE_MESSAGING_SENDER_ID || "369049072152";
  const firebaseAppId = env.VITE_FIREBASE_APP_ID || "1:369049072152:web:647eb9367406df443d896d";
  const firebaseMeasurementId = env.VITE_FIREBASE_MEASUREMENT_ID || "G-CQS0CX9KZ9";

  return {
    esbuild: {
      jsx: "automatic",
    },
    define: {
      "process.env.VITE_FIREBASE_API_KEY": JSON.stringify(firebaseApiKey),
      "process.env.VITE_FIREBASE_AUTH_DOMAIN": JSON.stringify(firebaseAuthDomain),
      "process.env.VITE_FIREBASE_PROJECT_ID": JSON.stringify(firebaseProjectId),
      "process.env.VITE_FIREBASE_STORAGE_BUCKET": JSON.stringify(firebaseStorageBucket),
      "process.env.VITE_FIREBASE_MESSAGING_SENDER_ID": JSON.stringify(firebaseMessagingSenderId),
      "process.env.VITE_FIREBASE_APP_ID": JSON.stringify(firebaseAppId),
      "process.env.VITE_FIREBASE_MEASUREMENT_ID": JSON.stringify(firebaseMeasurementId),
    },
    plugins: [aayojonApiPlugin()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes("node_modules/firebase")) return "vendor-firebase";
            if (id.includes("node_modules/lucide-react")) return "vendor-icons";
            if (
              id.includes("node_modules/react/") ||
              id.includes("node_modules/react-dom/") ||
              id.includes("node_modules/react-router")
            ) {
              return "vendor-react";
            }
          },
        },
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
  };
});
