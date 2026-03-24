import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { icpBindgen } from "@icp-sdk/bindgen/plugins/vite";
import { execSync } from "child_process";
import path from "path";

const environment = process.env.ICP_ENVIRONMENT || "local";
const CANISTER_NAMES = ["backend"];

function getCanisterId(name: string) {
  return execSync(`icp canister status ${name} -e ${environment} -i`, {
    encoding: "utf-8",
    stdio: "pipe",
  }).trim();
}

function getDevServerConfig() {
  const networkStatus = JSON.parse(
    execSync(`icp network status -e ${environment} --json`, {
      encoding: "utf-8",
    })
  );
  const canisterParams = CANISTER_NAMES.map(
    (name) => `PUBLIC_CANISTER_ID:${name}=${getCanisterId(name)}`
  ).join("&");
  return {
    headers: {
      "Set-Cookie": `ic_env=${encodeURIComponent(
        `${canisterParams}&ic_root_key=${networkStatus.root_key}`
      )}; SameSite=Lax;`,
    },
    proxy: {
      "/api": { target: networkStatus.api_url, changeOrigin: true },
    },
  };
}

export default defineConfig(({ mode }) => {
  const devConfig = mode === "development" ? getDevServerConfig() : {};
  return {
    plugins: [
      react(),
      tailwindcss(),
      icpBindgen({
        didFile: path.resolve(__dirname, "../backend/backend.did"),
        outDir: "./src/bindings/backend",
      }),
    ],
    resolve: {
      alias: { "@": path.resolve(__dirname, "./src") },
    },
    server: {
      ...devConfig,
    },
  };
});
