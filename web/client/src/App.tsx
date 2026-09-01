// Root router — mirrors the mobile app's layout:
//   /login              → auth screen
//   / (tabs)            → Logger (default), /progress, /calendar
// A navigation guard redirects based on auth state, and the app performs an
// initial backend sync once authenticated (like the mobile splash gate).

import { useEffect, useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import TabLayout from "@/components/TabLayout";
import { useAuth } from "@/context/auth-context";
import CalendarPage from "@/pages/CalendarPage";
import LoggerPage from "@/pages/LoggerPage";
import LoginPage from "@/pages/LoginPage";
import ProgressPage from "@/pages/ProgressPage";
import { storage } from "@/utils/storage";

export default function App() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [syncLoaded, setSyncLoaded] = useState(false);

  // Sync with backend once auth state is confirmed.
  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      setSyncLoaded(true);
      return;
    }
    setSyncLoaded(false);
    storage
      .syncWithBackend()
      .catch((err) => console.warn("Initial sync failed", err))
      .finally(() => setSyncLoaded(true));
  }, [isAuthenticated, authLoading]);

  // Splash-equivalent: blank dark screen until auth + sync resolve.
  if (authLoading || !syncLoaded) {
    return <div className="app-shell" />;
  }

  return (
    <div className="app-shell">
      <Routes>
        <Route
          path="/login"
          element={isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />}
        />
        <Route
          element={
            isAuthenticated ? <TabLayout /> : <Navigate to="/login" replace />
          }
        >
          <Route path="/" element={<LoggerPage />} />
          <Route path="/progress" element={<ProgressPage />} />
          <Route path="/calendar" element={<CalendarPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}
