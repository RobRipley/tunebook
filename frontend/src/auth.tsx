import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { AuthClient } from "@icp-sdk/auth/client";
import { HttpAgent, Actor } from "@dfinity/agent";
import { safeGetCanisterEnv } from "@icp-sdk/core/agent/canister-env";
import { idlFactory } from "./bindings/backend/declarations/backend.did";
import { Backend } from "./bindings/backend/backend";

type AuthState = {
  isAuthenticated: boolean;
  isLoading: boolean;
  principal: string | null;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  backend: Backend | null;
};

const AuthContext = createContext<AuthState | null>(null);

const isMainnet = typeof window !== "undefined" && window.location.hostname.endsWith(".icp0.io");
const agentHost = isMainnet ? "https://icp-api.io" : typeof window !== "undefined" ? window.location.origin : "http://localhost:8000";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authClient, setAuthClient] = useState<AuthClient | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [principal, setPrincipal] = useState<string | null>(null);
  const [authenticatedBackend, setAuthenticatedBackend] = useState<Backend | null>(null);

  const canisterEnv = safeGetCanisterEnv<{
    readonly ["PUBLIC_CANISTER_ID:backend"]: string;
    readonly ["PUBLIC_CANISTER_ID:internet_identity"]?: string;
  }>();

  const createAuthenticatedActor = useCallback(
    async (client: AuthClient) => {
      if (!canisterEnv) return null;
      const identity = client.getIdentity();
      const agent = await HttpAgent.create({
        host: agentHost,
        identity: identity as any,
      });
      if (!isMainnet) {
        await agent.fetchRootKey();
      }
      const canisterId = canisterEnv["PUBLIC_CANISTER_ID:backend"];
      // Use @dfinity/agent's Actor directly — bypasses @icp-sdk/core which has 400 issues
      const rawActor = Actor.createActor(idlFactory as any, { agent, canisterId });
      // Wrap in the bindgen's Backend class for type safety
      return new Backend(rawActor as any);
    },
    [canisterEnv]
  );

  useEffect(() => {
    AuthClient.create().then(async (client) => {
      setAuthClient(client);
      const authenticated = await client.isAuthenticated();
      setIsAuthenticated(authenticated);
      if (authenticated) {
        const id = client.getIdentity();
        setPrincipal(id.getPrincipal().toText());
        const actor = await createAuthenticatedActor(client);
        setAuthenticatedBackend(actor);
      }
      setIsLoading(false);
    });
  }, [createAuthenticatedActor]);

  const login = useCallback(async () => {
    if (!authClient) return;
    await authClient.login({
      identityProvider:
        canisterEnv?.["PUBLIC_CANISTER_ID:internet_identity"]
          ? `http://${canisterEnv["PUBLIC_CANISTER_ID:internet_identity"]}.localhost:8000`
          : "https://id.ai",
      onSuccess: async () => {
        setIsAuthenticated(true);
        const id = authClient.getIdentity();
        setPrincipal(id.getPrincipal().toText());
        const actor = await createAuthenticatedActor(authClient);
        setAuthenticatedBackend(actor);
      },
    });
  }, [authClient, canisterEnv, createAuthenticatedActor]);

  const logout = useCallback(async () => {
    if (!authClient) return;
    await authClient.logout();
    setIsAuthenticated(false);
    setPrincipal(null);
    setAuthenticatedBackend(null);
  }, [authClient]);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isLoading,
        principal,
        login,
        logout,
        backend: authenticatedBackend,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
