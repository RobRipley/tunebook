import { safeGetCanisterEnv } from "@icp-sdk/core/agent/canister-env";
import { createActor } from "./bindings/backend/backend";

const canisterEnv = safeGetCanisterEnv<{
  readonly ["PUBLIC_CANISTER_ID:backend"]: string;
}>();

const isMainnet = window.location.hostname.endsWith(".icp0.io");
const agentOptions = {
  host: isMainnet ? "https://icp-api.io" : window.location.origin,
  // Only pass rootKey for local development
  ...(isMainnet ? {} : { rootKey: canisterEnv?.IC_ROOT_KEY }),
};

export const backend = canisterEnv
  ? createActor(canisterEnv["PUBLIC_CANISTER_ID:backend"], { agentOptions })
  : undefined;

export { canisterEnv };
