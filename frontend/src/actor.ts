import { safeGetCanisterEnv } from "@icp-sdk/core/agent/canister-env";
import { createActor } from "./bindings/backend/backend";

const canisterEnv = safeGetCanisterEnv<{
  readonly ["PUBLIC_CANISTER_ID:backend"]: string;
}>();

const agentOptions = {
  host: window.location.hostname.endsWith(".icp0.io")
    ? "https://icp-api.io"
    : window.location.origin,
  rootKey: canisterEnv?.IC_ROOT_KEY,
};

export const backend = canisterEnv
  ? createActor(canisterEnv["PUBLIC_CANISTER_ID:backend"], { agentOptions })
  : undefined;

export { canisterEnv };
