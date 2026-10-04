"use client";

import Sidebar from "@/components/sidebar";
import { useAuth } from "@/hooks/use-auth";
import { NotificationsProvider } from "@/contexts/notifications-context";

/**
 * AppShell — envuelve todas las rutas autenticadas.
 * La sesión la resuelve AuthProvider (app/(app)/layout.tsx): si la API dice que no hay
 * sesión, redirige a /login.
 * Renderiza el sidebar + el área de contenido principal.
 */
export default function AppShell({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();

  /* ── Verificando auth ─────────────────────────────────────────────────── */
  if (loading) {
    return (
      <div className="flex h-full items-center justify-center bg-surface-950">
        <div className="w-5 h-5 rounded-full border-2 border-brand-500/20 border-t-brand-500 animate-spin" />
      </div>
    );
  }

  /* Redirigiendo a /login — AuthProvider ya llamó router.replace */
  if (!user) return null;

  /* ── App shell ────────────────────────────────────────────────────────── */
  return (
    <NotificationsProvider>
      <div className="flex h-full">
        <Sidebar user={user} onLogout={logout} />
        <main className="flex-1 min-w-0 h-full overflow-y-auto">
          {children}
        </main>
      </div>
    </NotificationsProvider>
  );
}
