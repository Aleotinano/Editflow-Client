"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { projects, ApiError, type ProjectSummary, type ProjectStatus } from "@/lib/api";
import { patterns, projectStatusStyles, projectTierStyles } from "@/lib/tokens";
import { cn, formatRelative } from "@/lib/utils";

// ─── Config filtros ───────────────────────────────────────────────────────────

const FILTERS: { value: ProjectStatus | "ALL"; label: string }[] = [
  { value: "ALL",               label: "Todos"       },
  { value: "DRAFT",             label: "Borrador"    },
  { value: "IN_REVIEW",         label: "En revisión" },
  { value: "CHANGES_REQUESTED", label: "Cambios"     },
  { value: "APPROVED",          label: "Aprobado"    },
  { value: "DELIVERED",         label: "Entregado"   },
];

// ─── Icons ────────────────────────────────────────────────────────────────────

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  );
}

function FilmIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 0 1-1.125-1.125M3.375 19.5h7.5c.621 0 1.125-.504 1.125-1.125m-9.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-7.5A1.125 1.125 0 0 1 12 18.375m9.75-12.75c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125m19.5 0v1.5c0 .621-.504 1.125-1.125 1.125M2.25 5.625v1.5c0 .621.504 1.125 1.125 1.125m0 0h17.25m-17.25 0h7.5c.621 0 1.125.504 1.125 1.125M3.375 8.25c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375Z" />
    </svg>
  );
}

// ─── Project card ─────────────────────────────────────────────────────────────

function ProjectCard({ project }: { project: ProjectSummary }) {
  const statusStyle = projectStatusStyles[project.status];
  const tierStyle   = project.tier ? projectTierStyles[project.tier] : null;

  return (
    <Link
      href={`/admin/projects/${project.id}`}
      className={cn(patterns.card, "p-4 flex flex-col gap-3")}
    >
      {/* Badges */}
      <div className="flex items-center justify-between gap-2">
        <span className={cn(patterns.badge, statusStyle.className, "text-[10px]")}>
          {statusStyle.label}
        </span>
        {tierStyle && (
          <span className={cn(patterns.badge, tierStyle.className, "text-[10px]")}>
            {tierStyle.label}
          </span>
        )}
      </div>

      {/* Nombre */}
      <div className="flex-1">
        <p className="text-sm font-semibold text-ink-950 leading-snug line-clamp-2">
          {project.name}
        </p>
        <p className="text-xs text-ink-500 mt-1 truncate">
          {project.client.user.name}
        </p>
      </div>

      {/* Editores */}
      {project.editors.length > 0 ? (
        <p className="text-xs text-ink-500 truncate">
          {project.editors.map((e) => e.user.name).join(", ")}
        </p>
      ) : (
        <p className="text-xs text-ink-300 italic">Sin editor asignado</p>
      )}

      {/* Footer meta */}
      <div className={cn(
        patterns.metaInline,
        "pt-2.5 border-t border-white/[0.05] mt-auto"
      )}>
        <FilmIcon className="w-3 h-3" />
        <span>{project._count.assets} {project._count.assets === 1 ? "archivo" : "archivos"}</span>
        <span>·</span>
        <span>{formatRelative(project.updatedAt)}</span>
      </div>
    </Link>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function GridSkeleton() {
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-3 animate-pulse">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="bg-surface-800 border border-white/[0.06] rounded-xl p-4 space-y-3">
          <div className="h-4 bg-white/[0.06] rounded w-20" />
          <div className="h-4 bg-white/[0.07] rounded w-3/4" />
          <div className="h-3 bg-white/[0.05] rounded w-1/2" />
          <div className="h-px bg-white/[0.05] mt-2" />
          <div className="h-2.5 bg-white/[0.04] rounded w-2/3" />
        </div>
      ))}
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="py-14 text-center">
      <p className="text-sm text-error-400">{message}</p>
      <p className="text-xs text-ink-500 mt-1">Verificá que el servidor esté corriendo.</p>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminProjectsPage() {
  const [data,    setData]    = useState<ProjectSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);
  const [filter,  setFilter]  = useState<ProjectStatus | "ALL">("ALL");

  useEffect(() => {
    projects
      .list()
      .then((data) => setData(data))
      .catch((err) => {
        setError(
          err instanceof ApiError
            ? err.message
            : "No se pudo conectar con el servidor"
        );
      })
      .finally(() => setLoading(false));
  }, []);

  const filtered =
    filter === "ALL" ? data : data.filter((p) => p.status === filter);

  function countByStatus(s: ProjectStatus | "ALL") {
    return s === "ALL" ? data.length : data.filter((p) => p.status === s).length;
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">

      {/* ── Encabezado ─────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <p className={patterns.sectionLabel}>Administración</p>
          <h1 className="text-2xl font-semibold text-ink-950 mt-1 leading-tight">
            Proyectos
          </h1>
        </div>
        <Link href="/admin/projects/new" className={patterns.btnPrimary}>
          <PlusIcon className="w-4 h-4" />
          Nuevo proyecto
        </Link>
      </div>

      {/* ── Filtros ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-1 mb-6 flex-wrap">
        {FILTERS.map((f) => {
          const c      = countByStatus(f.value);
          const active = filter === f.value;
          return (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium",
                "transition-colors duration-150",
                active
                  ? "bg-brand-500/10 text-brand-400 border border-brand-500/20"
                  : "text-ink-500 border border-transparent hover:text-ink-700 hover:bg-white/[0.03]"
              )}
            >
              {f.label}
              {c > 0 && (
                <span className={cn(
                  "text-[10px] tabular-nums rounded px-1 leading-4",
                  active
                    ? "bg-brand-500/20 text-brand-400"
                    : "bg-white/[0.06] text-ink-500"
                )}>
                  {c}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Contenido ───────────────────────────────────────────────────────── */}
      {loading ? (
        <GridSkeleton />
      ) : error ? (
        <ErrorState message={error} />
      ) : data.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-sm text-ink-500">No hay proyectos aún.</p>
          <p className="text-xs text-ink-300 mt-1">Creá el primero con el botón de arriba.</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-14 text-center">
          <p className="text-sm text-ink-500">No hay proyectos con ese estado.</p>
        </div>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-3">
          {filtered.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}

    </div>
  );
}
