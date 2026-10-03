"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { admin, ApiError, type ClientSummary } from "@/lib/api";
import { patterns } from "@/lib/tokens";
import { cn, formatRelative } from "@/lib/utils";

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function ListSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-px bg-white/[0.05]" />
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center px-4 py-4 gap-4 border-b border-white/[0.04]">
          <div className="flex-1 space-y-1.5">
            <div className="h-3.5 bg-white/[0.06] rounded w-36" />
            <div className="h-2.5 bg-white/[0.04] rounded w-48" />
          </div>
          <div className="w-16 h-4 bg-white/[0.05] rounded hidden sm:block" />
          <div className="w-24 hidden md:flex gap-1.5">
            <div className="h-4 w-16 bg-white/[0.04] rounded" />
          </div>
          <div className="w-16 h-2.5 bg-white/[0.04] rounded hidden lg:block ml-auto" />
        </div>
      ))}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminClientsPage() {
  const [data,    setData]    = useState<ClientSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  useEffect(() => {
    admin.clients
      .list()
      .then(setData)
      .catch((err) =>
        setError(err instanceof ApiError ? err.message : "No se pudo conectar con el servidor")
      )
      .finally(() => setLoading(false));
  }, []);

  const companies = data.filter((c) => c.type === "COMPANY").length;
  const creators  = data.filter((c) => c.type === "CREATOR").length;

  return (
    <div className="p-8 max-w-4xl mx-auto">

      {/* Encabezado */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <p className={patterns.sectionLabel}>Administración</p>
          <h1 className="text-2xl font-semibold text-ink-950 mt-1 leading-tight">Clientes</h1>
        </div>
        <Link href="/admin/clients/new" className={patterns.btnPrimary}>
          <PlusIcon className="w-4 h-4" />
          Nuevo cliente
        </Link>
      </div>

      {/* Stats */}
      {!loading && !error && data.length > 0 && (
        <div className="flex items-center gap-6 mb-8">
          <div className="border-l-2 border-brand-500/25 pl-3">
            <p className="text-xl font-semibold text-ink-950 tabular-nums">{data.length}</p>
            <p className="text-xs text-ink-500 mt-0.5">Total</p>
          </div>
          <div className="border-l-2 border-info-500/30 pl-3">
            <p className="text-xl font-semibold text-ink-950 tabular-nums">{companies}</p>
            <p className="text-xs text-ink-500 mt-0.5">Empresas</p>
          </div>
          <div className="border-l-2 border-success-500/30 pl-3">
            <p className="text-xl font-semibold text-ink-950 tabular-nums">{creators}</p>
            <p className="text-xs text-ink-500 mt-0.5">Creadores</p>
          </div>
        </div>
      )}

      {/* Contenido */}
      {loading ? (
        <ListSkeleton />
      ) : error ? (
        <div className="py-14 text-center">
          <p className="text-sm text-error-400">{error}</p>
          <p className="text-xs text-ink-500 mt-1">Verificá que el servidor esté corriendo.</p>
        </div>
      ) : data.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-sm text-ink-500">No hay clientes aún.</p>
          <p className="text-xs text-ink-300 mt-1">Creá el primero con el botón de arriba.</p>
        </div>
      ) : (
        <div>
          {/* Cabecera */}
          <div className="flex items-center px-4 pb-2 gap-4
            text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-500">
            <span className="flex-1">Cliente</span>
            <span className="w-20 hidden sm:block">Tipo</span>
            <span className="w-28 hidden md:block">Editores</span>
            <span className="w-20 text-right hidden lg:block">Creado</span>
          </div>
          <div className="border-t border-white/[0.05]" />

          {data.map((client) => (
            <Link
              key={client.id}
              href={`/admin/clients/${client.id}`}
              className={cn(patterns.listRow, "gap-4")}
            >
              {/* Nombre + email */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-ink-950 truncate">{client.name}</p>
                <p className="text-xs text-ink-500 mt-0.5 truncate">{client.user.email}</p>
              </div>

              {/* Tipo */}
              <span className={cn(
                patterns.badge,
                "w-20 shrink-0 hidden sm:inline-flex",
                client.type === "COMPANY"
                  ? "bg-info-500/10 text-info-400"
                  : "bg-success-500/10 text-success-400"
              )}>
                {client.type === "COMPANY" ? "Empresa" : "Creador"}
              </span>

              {/* Editores */}
              <div className="w-28 hidden md:flex flex-wrap gap-1 items-center shrink-0">
                {client.editors.length === 0 ? (
                  <span className="text-xs text-ink-300 italic">Sin asignar</span>
                ) : (
                  <>
                    <span className="text-xs text-ink-500">
                      {client.editors.length} {client.editors.length === 1 ? "editor" : "editores"}
                    </span>
                  </>
                )}
              </div>

              {/* Fecha */}
              <span className="text-xs text-ink-500 w-20 text-right hidden lg:block whitespace-nowrap shrink-0">
                {formatRelative(client.createdAt)}
              </span>
            </Link>
          ))}
        </div>
      )}

    </div>
  );
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  );
}
