import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { AuthClient } from "@icp-sdk/auth/client";
import { safeGetCanisterEnv } from "@icp-sdk/core/agent/canister-env";
import { createActor } from "./bindings/backend/backend";

type BackendActor = ReturnType<typeof createActor>;

type AuthState = {
  isAuthenticated: boolean;
  isLoading: boolean;
  principal: string | null;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  backend: BackendActor | null;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authClient, setAuthClient] = useState<AuthClient | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [principal, setPrincipal] = useState<string | null>(null);
  const [authenticatedBackend, setAuthenticatedBackend] = useState<BackendActor | null>(null);

  const canisterEnv = safeGetCanisterEnv<{
    readonly ["PUBLIC_CANISTER_ID:backend"]: string;
    readonly ["PUBLIC_CANISTER_ID:internet_identity"]?: string;
  }>();

  const createAuthenticatedActor = useCallback(
    (client: AuthClient) => {
      if (!canisterEnv) return null;
      const identity = client.getIdentity();
      return createActor(canisterEnv["PUBLIC_CANISTER_ID:backend"], {
        agentOptions: {
          host: window.location.hostname.endsWith(".icp0.io")
            ? "https://icp-api.io"
            : window.location.origin,
          identity,
          rootKey: canisterEnv.IC_ROOT_KEY,
        },
      });
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
        setAuthenticatedBackend(createAuthenticatedActor(client));
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
      onSuccess: () => {
        setIsAuthenticated(true);
        const id = authClient.getIdentity();
        setPrincipal(id.getPrincipal().toText());
        setAuthenticatedBackend(createAuthenticatedActor(authClient));
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
