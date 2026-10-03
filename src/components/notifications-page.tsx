"use client";

import { toast } from "sonner";
import { useNotifications } from "@/contexts/notifications-context";
import { patterns } from "@/lib/tokens";
import { cn, formatRelative } from "@/lib/utils";
import type { Notification } from "@/lib/api";

// ─── Icono de campana ─────────────────────────────────────────────────────────

function BellIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
    </svg>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function NotificationsSkeleton() {
  return (
    <div className="p-8 max-w-2xl mx-auto animate-pulse">
      <div className="h-3 bg-white/[0.05] rounded w-28 mb-2" />
      <div className="h-7 bg-white/[0.07] rounded w-40 mb-8" />
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex gap-3 px-4 py-4 border-b border-white/[0.05]">
          <div className="w-2 h-2 rounded-full bg-white/[0.05] mt-1.5 shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-3.5 bg-white/[0.07] rounded w-40" />
            <div className="h-3 bg-white/[0.04] rounded w-64" />
          </div>
          <div className="w-14 h-2.5 bg-white/[0.04] rounded" />
        </div>
      ))}
    </div>
  );
}

// ─── Fila de notificación ─────────────────────────────────────────────────────

function NotificationRow({ notification, onRead }: {
  notification: Notification;
  onRead: (id: string) => void;
}) {
  const unread = !notification.read;

  return (
    <button
      onClick={() => { if (unread) onRead(notification.id); }}
      disabled={!unread}
      className={cn(
        "w-full text-left flex gap-3 px-4 py-4 border-b border-white/[0.05]",
        "transition-colors duration-150",
        unread
          ? "bg-brand-500/[0.04] hover:bg-brand-500/[0.07] cursor-pointer"
          : "cursor-default",
      )}
    >
      {/* Indicador no leída */}
      <span className={cn(
        "w-2 h-2 rounded-full mt-1.5 shrink-0",
        unread ? "bg-brand-500" : "bg-transparent"
      )} />

      <div className="flex-1 min-w-0">
        <p className={cn("text-sm leading-snug truncate", unread ? "text-ink-950 font-medium" : "text-ink-500")}>
          {notification.title}
        </p>
        {/* body puede tener HTML — nuestro propio servidor solo usa <b> */}
        <p
          className="text-xs text-ink-400 mt-0.5 leading-relaxed line-clamp-2"
          dangerouslySetInnerHTML={{ __html: notification.body }}
        />
      </div>

      <span className="text-[11px] text-ink-500 whitespace-nowrap shrink-0 mt-0.5">
        {formatRelative(notification.createdAt)}
      </span>
    </button>
  );
}

// ─── Estado vacío ─────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="py-20 flex flex-col items-center gap-3 text-center">
      <div className="w-12 h-12 rounded-full bg-surface-800 flex items-center justify-center">
        <BellIcon className="w-6 h-6 text-ink-500" />
      </div>
      <div>
        <p className="text-sm font-medium text-ink-500">Sin notificaciones</p>
        <p className="text-xs text-ink-300 mt-0.5">Acá aparecerán las actualizaciones de tus proyectos.</p>
      </div>
    </div>
  );
}

// ─── Página ───────────────────────────────────────────────────────────────────

export default function NotificationsPage() {
  const { items, unreadCount, loading, markAsRead, markAllAsRead } = useNotifications();

  async function handleMarkAll() {
    await markAllAsRead();
    toast.success("Todo al día", {
      description: "Todas las notificaciones marcadas como leídas.",
    });
  }

  if (loading) return <NotificationsSkeleton />;

  return (
    <div className="p-8 max-w-2xl mx-auto">

      {/* Encabezado */}
      <div className="flex items-start justify-between mb-8 gap-4">
        <div>
          <p className={patterns.sectionLabel}>Bandeja de entrada</p>
          <h1 className="text-2xl font-semibold text-ink-950 mt-1 leading-tight">
            Notificaciones
          </h1>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={handleMarkAll}
            className={cn(patterns.btnGhost, "text-xs shrink-0 mt-1")}
          >
            Marcar todas como leídas
          </button>
        )}
      </div>

      {/* Resumen */}
      {items.length > 0 && (
        <div className="flex items-center gap-4 mb-5">
          <span className="text-xs text-ink-500">
            {items.length} {items.length === 1 ? "notificación" : "notificaciones"}
          </span>
          {unreadCount > 0 && (
            <>
              <span className="w-1 h-1 rounded-full bg-ink-600" />
              <span className="text-xs text-brand-400 font-medium">
                {unreadCount} sin leer
              </span>
            </>
          )}
        </div>
      )}

      {/* Lista */}
      <div className="border-t border-white/[0.05]">
        {items.length === 0 ? (
          <EmptyState />
        ) : (
          items.map((n) => (
            <NotificationRow key={n.id} notification={n} onRead={markAsRead} />
          ))
        )}
      </div>

    </div>
  );
}
