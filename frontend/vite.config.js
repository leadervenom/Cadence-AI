import { defineConfig, loadEnv } from "vite";
import vue from "@vitejs/plugin-vue";

// The backend (Express/Node API) runs as its own separate process/port.
// This frontend is a fully independent Vite project: its own node_modules,
// its own dev server, its own port. Configure the backend's URL via
// frontend/.env (see .env.example) — no values are hardcoded here.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const devPort = Number(env.VITE_DEV_SERVER_PORT) || 5173;

  return {
    plugins: [vue()],
    server: {
      port: devPort,
      strictPort: false,
      // Set VITE_API_BASE_URL in .env to point at the backend (e.g. http://localhost:3000).
      // No proxy is required since the backend already enables CORS (see src/server.js),
      // but a proxy is provided here too in case you'd rather avoid CORS entirely.
      proxy: env.VITE_USE_PROXY === "true"
        ? {
            "/api": {
              target: env.VITE_API_BASE_URL || "http://localhost:3000",
              changeOrigin: true,
            },
          }
        : undefined,
    },
    build: {
      outDir: "dist",
      emptyOutDir: true,
    },
  };
});
