"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { admin, ApiError, type EditorSummary } from "@/lib/api";
import { patterns } from "@/lib/tokens";
import { cn, formatRelative } from "@/lib/utils";

// ─── Fila individual ──────────────────────────────────────────────────────────

function EditorRow({
  editor,
  onDeleted,
}: {
  editor:    EditorSummary;
  onDeleted: (id: string) => void;
}) {
  const [confirming, setConfirming] = useState(false);
  const [deleting,   setDeleting]   = useState(false);
  const [error,      setError]      = useState("");

  async function handleDelete() {
    setDeleting(true);
    setError("");
    try {
      await admin.editors.delete(editor.id);
      onDeleted(editor.id);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Error al eliminar");
      setDeleting(false);
      setConfirming(false);
    }
  }

  return (
    <div className={cn(
      "flex items-center px-4 py-3.5 gap-4",
      "border-b border-white/[0.05] hover:bg-white/[0.02] transition-colors duration-150",
      deleting && "opacity-40 pointer-events-none"
    )}>

      {/* Nombre + email */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-ink-950 truncate">{editor.name}</p>
        <p className="text-xs text-ink-500 mt-0.5 truncate">{editor.email}</p>
      </div>

      {/* Clientes asignados */}
      <div className="w-56 hidden md:flex flex-wrap gap-1.5 items-center">
        {editor.clients.length === 0 ? (
          <span className="text-xs text-ink-300 italic">Sin asignar</span>
        ) : (
          editor.clients.map((c) => (
            <span
              key={c.id}
              className="text-[11px] bg-white/[0.05] text-ink-500 px-2 py-0.5 rounded truncate max-w-[90px]"
              title={c.name}
            >
              {c.name}
            </span>
          ))
        )}
      </div>

      {/* Fecha */}
      <span className="text-xs text-ink-500 w-20 text-right hidden lg:block whitespace-nowrap shrink-0">
        {formatRelative(editor.createdAt)}
      </span>

      {/* Acciones delete */}
      <div className="shrink-0 flex items-center gap-2 min-w-[80px] justify-end">
        {error && (
          <span className="text-[11px] text-error-400 truncate max-w-[120px]">{error}</span>
        )}

        {confirming ? (
          <>
            <span className="text-xs text-ink-500">¿Eliminar?</span>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="text-xs font-medium text-error-400 hover:text-error-300 transition-colors disabled:opacity-50"
            >
              {deleting ? "…" : "Sí"}
            </button>
            <button
              onClick={() => setConfirming(false)}
              className="text-xs text-ink-500 hover:text-ink-700 transition-colors"
            >
              No
            </button>
          </>
        ) : (
          <button
            onClick={() => setConfirming(true)}
            className="text-xs text-ink-500 hover:text-error-400 transition-colors duration-150"
          >
            Eliminar
          </button>
        )}
      </div>

    </div>
  );
}

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
          <div className="w-56 hidden md:flex gap-1.5">
            <div className="h-4 w-20 bg-white/[0.05] rounded" />
            <div className="h-4 w-16 bg-white/[0.04] rounded" />
          </div>
          <div className="w-16 h-2.5 bg-white/[0.04] rounded hidden lg:block ml-auto" />
          <div className="w-12 h-3 bg-white/[0.04] rounded shrink-0" />
        </div>
      ))}
    </div>
  );
}

// ─── Error state ──────────────────────────────────────────────────────────────

function ErrorState({ message }: { message: string }) {
  return (
    <div className="py-14 text-center">
      <p className="text-sm text-error-400">{message}</p>
      <p className="text-xs text-ink-500 mt-1">Verificá que el servidor esté corriendo.</p>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminEditorsPage() {
  const [data,    setData]    = useState<EditorSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  useEffect(() => {
    admin.editors
      .list()
      .then(setData)
      .catch((err) =>
        setError(err instanceof ApiError ? err.message : "No se pudo conectar con el servidor")
      )
      .finally(() => setLoading(false));
  }, []);

  function handleDeleted(id: string) {
    setData((prev) => prev.filter((e) => e.id !== id));
  }

  // Totales para stats rápidas
  const totalAssigned = data.filter((e) => e.clients.length > 0).length;

  return (
    <div className="p-8 max-w-4xl mx-auto">

      {/* Encabezado */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <p className={patterns.sectionLabel}>Administración</p>
          <h1 className="text-2xl font-semibold text-ink-950 mt-1 leading-tight">
            Editores
          </h1>
        </div>
        <Link href="/admin/editors/new" className={patterns.btnPrimary}>
          <PlusIcon className="w-4 h-4" />
          Nuevo editor
        </Link>
      </div>

      {/* Stats */}
      {!loading && !error && data.length > 0 && (
        <div className="flex items-center gap-6 mb-8">
          <div className="border-l-2 border-brand-500/25 pl-3">
            <p className="text-xl font-semibold text-ink-950 tabular-nums">{data.length}</p>
            <p className="text-xs text-ink-500 mt-0.5">Total</p>
          </div>
          <div className="border-l-2 border-success-500/30 pl-3">
            <p className="text-xl font-semibold text-ink-950 tabular-nums">{totalAssigned}</p>
            <p className="text-xs text-ink-500 mt-0.5">Con clientes</p>
          </div>
          <div className="border-l-2 border-ink-500/20 pl-3">
            <p className="text-xl font-semibold text-ink-950 tabular-nums">
              {data.length - totalAssigned}
            </p>
            <p className="text-xs text-ink-500 mt-0.5">Sin asignar</p>
          </div>
        </div>
      )}

      {/* Contenido */}
      {loading ? (
        <ListSkeleton />
      ) : error ? (
        <ErrorState message={error} />
      ) : data.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-sm text-ink-500">No hay editores aún.</p>
          <p className="text-xs text-ink-300 mt-1">
            Creá el primero con el botón de arriba.
          </p>
        </div>
      ) : (
        <div>
          {/* Cabecera de columnas */}
          <div className="flex items-center px-4 pb-2 gap-4
            text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-500">
            <span className="flex-1">Editor</span>
            <span className="w-56 hidden md:block">Clientes asignados</span>
            <span className="w-20 text-right hidden lg:block">Creado</span>
            <span className="w-20 text-right shrink-0" />
          </div>
          <div className="border-t border-white/[0.05]" />

          {data.map((editor) => (
            <EditorRow
              key={editor.id}
              editor={editor}
              onDeleted={handleDeleted}
            />
          ))}
        </div>
      )}

    </div>
  );
}

// ─── Icono ────────────────────────────────────────────────────────────────────

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  );
}
