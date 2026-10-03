"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { admin, ApiError, type DashboardData, type DashboardProject, type ProjectStatus } from "@/lib/api";
import { patterns, projectStatusStyles } from "@/lib/tokens";
import { cn, formatRelative } from "@/lib/utils";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Buenos días";
  if (h < 20) return "Buenas tardes";
  return "Buenas noches";
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function FolderIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z" />
    </svg>
  );
}

function UsersIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
    </svg>
  );
}

function UserIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
    </svg>
  );
}

// ─── Stat card ────────────────────────────────────────────────────────────────

type StatDef = {
  label:    string;
  value:    number;
  accent:   string;   // text-* class for the number
  icon:     React.ComponentType<{ className?: string }>;
  href?:    string;
};

function StatCard({ stat }: { stat: StatDef }) {
  const inner = (
    <div className={cn(
      "bg-surface-800 border border-white/[0.06] rounded-xl p-4",
      stat.href && "hover:border-white/[0.12] hover:bg-surface-700 transition-all duration-200 cursor-pointer"
    )}>
      <div className="flex items-start justify-between mb-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-ink-500">
          {stat.label}
        </p>
        <stat.icon className="w-3.5 h-3.5 text-ink-300/60" />
      </div>
      <p className={cn("text-3xl font-semibold tabular-nums leading-none", stat.accent)}>
        {stat.value}
      </p>
    </div>
  );
  return stat.href ? <Link href={stat.href}>{inner}</Link> : inner;
}

// ─── Dashboard project card ───────────────────────────────────────────────────

function DashboardCard({ project }: { project: DashboardProject }) {
  const style = projectStatusStyles[project.status as ProjectStatus];
  return (
    <Link
      href={`/admin/projects/${project.id}`}
      className={cn(patterns.card, "p-4 flex flex-col gap-2.5")}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-ink-950 leading-snug min-w-0 truncate">
          {project.name}
        </p>
        <span className={cn(patterns.badge, style.className, "shrink-0 text-[10px]")}>
          {style.label}
        </span>
      </div>
      <p className={patterns.metaInline}>
        <span>{project.clientName}</span>
        <span>·</span>
        <span>{formatRelative(project.updatedAt)}</span>
      </p>
    </Link>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function DashboardSkeleton() {
  return (
    <div className="p-8 max-w-5xl mx-auto animate-pulse space-y-10">
      <div className="space-y-1.5">
        <div className="h-2.5 bg-white/[0.05] rounded w-36" />
        <div className="h-7 bg-white/[0.07] rounded w-44" />
      </div>

      {/* stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-surface-800 border border-white/[0.06] rounded-xl p-4 space-y-3">
            <div className="h-2 bg-white/[0.05] rounded w-16" />
            <div className="h-7 bg-white/[0.07] rounded w-8" />
          </div>
        ))}
      </div>

      {/* card placeholders */}
      <div className="space-y-2">
        <div className="h-2.5 bg-white/[0.05] rounded w-32 mb-4" />
        <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-surface-800 border border-white/[0.06] rounded-xl p-4 space-y-2.5">
              <div className="h-3.5 bg-white/[0.07] rounded w-3/4" />
              <div className="h-2.5 bg-white/[0.05] rounded w-1/2" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const [data,    setData]    = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  useEffect(() => {
    admin
      .dashboard()
      .then(setData)
      .catch((err) =>
        setError(err instanceof ApiError ? err.message : "No se pudo cargar el dashboard")
      )
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <DashboardSkeleton />;

  if (error || !data) {
    return (
      <div className="p-8 max-w-5xl mx-auto">
        <div className="py-14 text-center">
          <p className="text-sm text-error-400">{error ?? "Error desconocido"}</p>
          <p className="text-xs text-ink-500 mt-1">Verificá que el servidor esté corriendo.</p>
        </div>
      </div>
    );
  }

  const { stats, needsAction, recentProjects } = data;

  const statDefs: StatDef[] = [
    { label: "Proyectos",   value: stats.total,            accent: "text-ink-950",     icon: FolderIcon, href: "/admin/projects" },
    { label: "En revisión", value: stats.inReview,         accent: "text-info-400",    icon: FolderIcon },
    { label: "Con cambios", value: stats.changesRequested, accent: "text-warning-400", icon: FolderIcon },
    { label: "Aprobados",   value: stats.approved,         accent: "text-success-400", icon: FolderIcon },
    { label: "Clientes",    value: stats.clients,          accent: "text-ink-950",     icon: UsersIcon,  href: "/admin/clients" },
    { label: "Editores",    value: stats.editors,          accent: "text-ink-950",     icon: UserIcon,   href: "/admin/editors" },
  ];

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-10">

      {/* Encabezado */}
      <div>
        <p className={patterns.sectionLabel}>Panel de administración</p>
        <h1 className="text-2xl font-semibold text-ink-950 mt-1 leading-tight">
          {greeting()}
        </h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {statDefs.map((s) => (
          <StatCard key={s.label} stat={s} />
        ))}
      </div>

      {/* ── Requieren atención ─────────────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <p className={patterns.sectionLabel}>Requieren atención</p>
          {needsAction.length > 0 && (
            <span className="text-[11px] text-ink-500">
              {needsAction.length} {needsAction.length === 1 ? "proyecto" : "proyectos"}
            </span>
          )}
        </div>

        {needsAction.length === 0 ? (
          <div className="flex items-center gap-2 py-3 px-1">
            <span className="w-1.5 h-1.5 rounded-full bg-success-400 shrink-0" />
            <p className="text-sm text-ink-500">Todo en orden. Sin proyectos pendientes.</p>
          </div>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-3">
            {needsAction.map((p) => <DashboardCard key={p.id} project={p} />)}
          </div>
        )}
      </div>

      {/* ── Actividad reciente ──────────────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <p className={patterns.sectionLabel}>Actividad reciente</p>
          <Link
            href="/admin/projects"
            className="text-[11px] text-ink-500 hover:text-brand-400 transition-colors"
          >
            Ver todos →
          </Link>
        </div>

        {recentProjects.length === 0 ? (
          <div className="py-10 text-center">
            <p className="text-sm text-ink-500">No hay proyectos aún.</p>
            <p className="text-xs text-ink-300 mt-1">
              Creá el primero desde{" "}
              <Link href="/admin/projects/new" className="text-brand-400 hover:underline">
                Proyectos
              </Link>.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-3">
            {recentProjects.map((p) => <DashboardCard key={p.id} project={p} />)}
          </div>
        )}
      </div>

    </div>
  );
}
