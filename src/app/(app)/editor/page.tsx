"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { projects, ApiError, type ProjectSummary } from "@/lib/api";
import { patterns, projectStatusStyles } from "@/lib/tokens";
import { cn, formatRelative } from "@/lib/utils";

// ─── Icons ────────────────────────────────────────────────────────────────────

function FilmIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 0 1-1.125-1.125M3.375 19.5h7.5c.621 0 1.125-.504 1.125-1.125m-9.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-7.5A1.125 1.125 0 0 1 12 18.375m9.75-12.75c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125m19.5 0v1.5c0 .621-.504 1.125-1.125 1.125M2.25 5.625v1.5c0 .621.504 1.125 1.125 1.125m0 0h17.25m-17.25 0h7.5c.621 0 1.125.504 1.125 1.125M3.375 8.25c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375Z" />
    </svg>
  );
}

// ─── Stat card (mini) ─────────────────────────────────────────────────────────

function MiniStat({ label, value, accent }: { label: string; value: number; accent: string }) {
  return (
    <div className="bg-surface-800 border border-white/[0.06] rounded-xl px-4 py-3">
      <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-ink-500 mb-1.5">
        {label}
      </p>
      <p className={cn("text-2xl font-semibold tabular-nums leading-none", accent)}>
        {value}
      </p>
    </div>
  );
}

// ─── Project card ─────────────────────────────────────────────────────────────

function ProjectCard({ project }: { project: ProjectSummary }) {
  const statusStyle = projectStatusStyles[project.status];
  return (
    <Link
      href={`/editor/projects/${project.id}`}
      className={cn(patterns.card, "p-4 flex flex-col gap-3")}
    >
      {/* Status badge */}
      <div>
        <span className={cn(patterns.badge, statusStyle.className, "text-[10px]")}>
          {statusStyle.label}
        </span>
      </div>

      {/* Nombre + cliente */}
      <div className="flex-1">
        <p className="text-sm font-semibold text-ink-950 leading-snug line-clamp-2">
          {project.name}
        </p>
        <p className="text-xs text-ink-500 mt-1 truncate">
          {project.client.user.name}
        </p>
      </div>

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

function GridSkeleton({ rows }: { rows: number }) {
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-3 animate-pulse">
      {Array.from({ length: rows }).map((_, i) => (
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
    <div className="py-12 text-center">
      <p className="text-sm text-error-400">{message}</p>
      <p className="text-xs text-ink-500 mt-1">Verificá que el servidor esté corriendo.</p>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function EditorProjectsPage() {
  const [data,    setData]    = useState<ProjectSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

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

  const inReview    = data.filter((p) => p.status === "IN_REVIEW").length;
  const withChanges = data.filter((p) => p.status === "CHANGES_REQUESTED").length;

  return (
    <div className="p-8 max-w-5xl mx-auto">

      {/* Encabezado */}
      <div className="mb-8">
        <p className={patterns.sectionLabel}>Editor</p>
        <h1 className="text-2xl font-semibold text-ink-950 mt-1 leading-tight">
          Mis proyectos
        </h1>
      </div>

      {/* Stats — solo con datos */}
      {!loading && !error && data.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-3 gap-3 mb-8 max-w-xs">
          <MiniStat label="Total"        value={data.length}  accent="text-ink-950"     />
          <MiniStat label="En revisión"  value={inReview}     accent="text-info-400"    />
          <MiniStat label="Con cambios"  value={withChanges}  accent="text-warning-400" />
        </div>
      )}

      {/* Grid */}
      {loading ? (
        <GridSkeleton rows={4} />
      ) : error ? (
        <ErrorState message={error} />
      ) : data.length === 0 ? (
        <div className="py-14 text-center">
          <p className="text-sm text-ink-500">No tenés proyectos asignados aún.</p>
          <p className="text-xs text-ink-300 mt-1">
            El administrador te asignará proyectos cuando estén disponibles.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-3">
          {data.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}

    </div>
  );
}
