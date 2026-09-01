// Auth context — provides isAuthenticated state, login(), and logout() helpers.
// Token is persisted in SecureStore (native) or AsyncStorage (web).

import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

import { API_URL } from "@/src/utils/storage/storage-base";
import {
  getToken as getSecureToken,
  removeToken as removeSecureToken,
  setToken as setSecureToken,
} from "@/src/utils/token-storage";

// ─── Types ────────────────────────────────────────────────────────────────────

type AuthContextValue = {
  isAuthenticated: boolean;
  isLoading: boolean;
  username: string | null;
  login: (token: string, username: string) => Promise<void>;
  logout: () => Promise<void>;
  getToken: () => Promise<string | null>;
};

// ─── Keys ─────────────────────────────────────────────────────────────────────

const TOKEN_KEY = "auth.jwt.v1";
const USERNAME_KEY = "auth.username.v1";
const USER_DATA_PREFIXES = ["fit."];

// ─── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null);

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function persistToken(token: string, username: string) {
  await setSecureToken(TOKEN_KEY, token);
  await AsyncStorage.setItem(USERNAME_KEY, username);
}

async function clearPersistedToken() {
  await removeSecureToken(TOKEN_KEY);
  await AsyncStorage.removeItem(USERNAME_KEY);
}

async function clearUserData() {
  try {
    const allKeys = await AsyncStorage.getAllKeys();
    const userKeys = allKeys.filter((k) =>
      USER_DATA_PREFIXES.some((prefix) => k.startsWith(prefix))
    );
    if (userKeys.length > 0) {
      await AsyncStorage.multiRemove(userKeys);
    }
  } catch (e) {
    console.warn("[auth] clearUserData failed", e);
  }
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [username, setUsername] = useState<string | null>(null);

  // On mount: check for a stored token
  useEffect(() => {
    (async () => {
      try {
        const token = await getSecureToken(TOKEN_KEY);
        const storedUsername = await AsyncStorage.getItem(USERNAME_KEY);
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

  const login = useCallback(
    async (token: string, user: string) => {
      await persistToken(token, user);
      setUsername(user);
      setIsAuthenticated(true);
    },
    []
  );

  const logout = useCallback(async () => {
    await clearPersistedToken();
    await clearUserData();
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

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}

// ─── API helpers (callable without context, e.g. from storage-base) ──────────

export async function getStoredToken(): Promise<string | null> {
  return getSecureToken(TOKEN_KEY);
}

export { API_URL };
