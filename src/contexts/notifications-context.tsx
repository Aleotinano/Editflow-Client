"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { notifications as notifApi, type Notification } from "@/lib/api";

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface NotificationsContextValue {
  items:          Notification[];
  unreadCount:    number;
  loading:        boolean;
  refresh:        () => Promise<void>;
  markAsRead:     (id: string) => Promise<void>;
  markAllAsRead:  () => Promise<void>;
}

// ─── Contexto ─────────────────────────────────────────────────────────────────

const NotificationsContext = createContext<NotificationsContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const [items,   setItems]   = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const intervalRef           = useRef<ReturnType<typeof setInterval> | null>(null);

  const refresh = useCallback(async () => {
    try {
      const data = await notifApi.list();
      setItems(data);
    } catch {
      // silently fail (ej. token expirado)
    } finally {
      setLoading(false);
    }
  }, []);

  // Carga inicial + polling cada 30 s
  useEffect(() => {
    refresh();
    intervalRef.current = setInterval(refresh, 30_000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [refresh]);

  const markAsRead = useCallback(async (id: string) => {
    await notifApi.markAsRead(id);
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }, []);

  const markAllAsRead = useCallback(async () => {
    await notifApi.markAllAsRead();
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const unreadCount = items.filter((n) => !n.read).length;

  return (
    <NotificationsContext.Provider
      value={{ items, unreadCount, loading, refresh, markAsRead, markAllAsRead }}
    >
      {children}
    </NotificationsContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error("useNotifications debe usarse dentro de <NotificationsProvider>");
  return ctx;
}
