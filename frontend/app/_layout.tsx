import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { LogBox } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { AuthProvider, useAuth } from "@/src/context/auth-context";
import { useIconFonts } from "@/src/hooks/use-icon-fonts";
import { storage } from "@/src/utils/storage";

// Disable logbox errors etc so that users can see the app
// and agent works as expected.
LogBox.ignoreAllLogs(true);

// Keep the native splash visible from cold start until icon fonts register.
SplashScreen.preventAutoHideAsync();

// ─── Inner layout that has access to AuthContext ───────────────────────────────

function NavigationGuard() {
  const { isAuthenticated, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === "login";
    const inTabsGroup = segments[0] === "(tabs)";

    if (!isAuthenticated && !inAuthGroup) {
      // Not logged in — send to login
      router.replace("/login");
    } else if (isAuthenticated && inAuthGroup) {
      // Already logged in — send to tabs
      router.replace("/(tabs)");
    }
  }, [isAuthenticated, isLoading, segments]);

  return null;
}

function RootLayoutInner() {
  const [loaded, error] = useIconFonts();
  const [syncLoaded, setSyncLoaded] = useState(false);
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  // Sync with backend once auth state is confirmed
  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      // Not authenticated — no sync needed, just mark done
      setSyncLoaded(true);
      return;
    }
    storage
      .syncWithBackend()
      .catch((err) => console.warn("Initial sync failed", err))
      .finally(() => setSyncLoaded(true));
  }, [isAuthenticated, authLoading]);

  useEffect(() => {
    if ((loaded || error) && syncLoaded && !authLoading) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error, syncLoaded, authLoading]);

  // If CDN is unreachable we fall through on error rather than wedging the app.
  if ((!loaded && !error) || !syncLoaded || authLoading) return null;

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <NavigationGuard />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="login" />
        <Stack.Screen name="(tabs)" />
      </Stack>
    </SafeAreaProvider>
  );
}

// ─── Root layout ─────────────────────────────────────────────────────────────

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutInner />
    </AuthProvider>
  );
}
