// Auth context — provides isAuthenticated state, login(), and logout() helpers.
// Token + username persisted in localStorage. On logout, all fit.* user data
// is cleared locally (it stays safe in the backend, re-synced on next login).

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import {
  AUTH_TOKEN_KEY as TOKEN_KEY,
  AUTH_USERNAME_KEY as USERNAME_KEY,
  USER_DATA_PREFIXES,
} from "@/constants/storage-keys";
import {
  getToken as getSecureToken,
  removeToken as removeSecureToken,
  setToken as setSecureToken,
} from "@/utils/token-storage";

type AuthContextValue = {
  isAuthenticated: boolean;
  isLoading: boolean;
  username: string | null;
  login: (token: string, username: string) => Promise<void>;
  logout: () => Promise<void>;
  getToken: () => Promise<string | null>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

async function persistToken(token: string, username: string) {
  await setSecureToken(TOKEN_KEY, token);
  localStorage.setItem(USERNAME_KEY, username);
}

async function clearPersistedToken() {
  await removeSecureToken(TOKEN_KEY);
  localStorage.removeItem(USERNAME_KEY);
}

function clearUserData() {
  try {
    const userKeys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && USER_DATA_PREFIXES.some((prefix) => k.startsWith(prefix))) {
        userKeys.push(k);
      }
    }
    for (const k of userKeys) localStorage.removeItem(k);
  } catch (e) {
    console.warn("[auth] clearUserData failed", e);
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [username, setUsername] = useState<string | null>(null);

  // On mount: check for a stored token
  useEffect(() => {
    (async () => {
      try {
        const token = await getSecureToken(TOKEN_KEY);
        const storedUsername = localStorage.getItem(USERNAME_KEY);
        if (token && storedUsername) {
          setIsAuthenticated(true);
          setUsername(storedUsername);
        }
      } catch (e) {
        console.warn("[auth] token restore failed", e);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const getToken = useCallback(async (): Promise<string | null> => {
    return getSecureToken(TOKEN_KEY);
  }, []);

  const login = useCallback(async (token: string, user: string) => {
    await persistToken(token, user);
    setUsername(user);
    setIsAuthenticated(true);
  }, []);

  const logout = useCallback(async () => {
    await clearPersistedToken();
    clearUserData();
    setUsername(null);
    setIsAuthenticated(false);
  }, []);

  return (
    <AuthContext.Provider
      value={{ isAuthenticated, isLoading, username, login, logout, getToken }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
