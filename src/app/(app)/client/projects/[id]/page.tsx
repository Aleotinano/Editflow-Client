"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import {
  projects,
  ApiError,
  type ProjectDetail,
  type ProjectStatus,
} from "@/lib/api";
import { patterns, projectStatusStyles } from "@/lib/tokens";
import { cn, formatRelative } from "@/lib/utils";
import { ProjectLoadingSkeleton } from "@/components/project-assets";
import FileGrid from "@/components/file-grid";

// ─── Icons ────────────────────────────────────────────────────────────────────

function ArrowLeftIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
    </svg>
  );
}

function ChatBubbleLeftIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 0 1-.825-.242m9.345-8.334a2.126 2.126 0 0 0-.476-.095 48.64 48.64 0 0 0-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0 0 11.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
    </svg>
  );
}

// ─── Micro ────────────────────────────────────────────────────────────────────

function Spinner({ className }: { className?: string }) {
  return (
    <span
      className={cn("w-3.5 h-3.5 rounded-full border-2 animate-spin shrink-0", className)}
      aria-hidden
    />
  );
}

// ─── Panel de revisión ────────────────────────────────────────────────────────

function ReviewPanel({
  status,
  projectId,
  onUpdated,
}: {
  status:    ProjectStatus;
  projectId: string;
  onUpdated: (s: ProjectStatus) => void;
}) {
  const [loading, setLoading] = useState<ProjectStatus | null>(null);

  async function apply(to: ProjectStatus) {
    setLoading(to);
    try {
      await projects.updateStatus(projectId, to);
      onUpdated(to);
      if (to === "APPROVED") {
        toast.success("¡Proyecto aprobado!", {
          description: "La agencia recibirá una notificación para proceder con la entrega.",
        });
      } else if (to === "CHANGES_REQUESTED") {
        toast("Cambios solicitados", {
          description: "La agencia revisará tus comentarios.",
          icon: "✏️",
        });
      }
    } catch {
      toast.error("No se pudo actualizar el estado");
    } finally {
      setLoading(null);
    }
  }

  if (status === "IN_REVIEW") {
    return (
      <div className="rounded-lg border border-info-500/20 bg-info-500/[0.06] px-5 py-4 mb-6">
        <p className="text-sm font-medium text-ink-950 mb-0.5">
          Este proyecto está listo para tu revisión
        </p>
        <p className="text-xs text-ink-500 mb-4">
          Revisá los archivos y decidí si aprobás o si necesitás ajustes.
        </p>

        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => apply("APPROVED")}
            disabled={loading !== null}
            className={cn(
              "inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium",
              "bg-success-500/15 hover:bg-success-500/25 text-success-400",
              "border border-success-500/25 transition-colors duration-150",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            {loading === "APPROVED" ? (
              <Spinner className="border-success-400/30 border-t-success-400" />
            ) : (
              <CheckIcon className="w-4 h-4" />
            )}
            Aprobar proyecto
          </button>

          <button
            onClick={() => apply("CHANGES_REQUESTED")}
            disabled={loading !== null}
            className={cn(
              "inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium",
              "bg-warning-500/10 hover:bg-warning-500/20 text-warning-400",
              "border border-warning-500/20 transition-colors duration-150",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            {loading === "CHANGES_REQUESTED" ? (
              <Spinner className="border-warning-400/30 border-t-warning-400" />
            ) : (
              <ChatBubbleLeftIcon className="w-4 h-4" />
            )}
            Solicitar cambios
          </button>
        </div>
      </div>
    );
  }

  if (status === "CHANGES_REQUESTED") {
    return (
      <div className="flex items-start gap-3 px-4 py-3.5 rounded-lg border border-warning-500/20 bg-warning-500/[0.06] mb-6">
        <span className="w-1.5 h-1.5 rounded-full bg-warning-400 shrink-0 mt-1.5 animate-pulse" />
        <div>
          <p className="text-sm font-medium text-ink-950">Cambios solicitados</p>
          <p className="text-xs text-ink-500 mt-0.5">
            Tu agencia de edición está trabajando en los ajustes. Te notificaremos cuando esté listo.
          </p>
        </div>
      </div>
    );
  }

  if (status === "APPROVED") {
    return (
      <div className="flex items-center gap-3 px-4 py-3 rounded-lg border border-success-500/20 bg-success-500/[0.06] mb-6">
        <CheckIcon className="w-4 h-4 text-success-400 shrink-0" />
        <p className="text-sm text-success-300">Aprobaste este proyecto.</p>
      </div>
    );
  }

  if (status === "DELIVERED") {
    return (
      <div className="flex items-center gap-3 px-4 py-3 rounded-lg border border-brand-500/20 bg-brand-500/[0.06] mb-6">
        <span className="w-1.5 h-1.5 rounded-full bg-brand-400 shrink-0" />
        <p className="text-sm text-brand-300">Proyecto entregado. ¡Listo!</p>
      </div>
    );
  }

  return null;
}

// ─── Error state ──────────────────────────────────────────────────────────────

function ErrorState({ message }: { message: string }) {
  return (
    <div className="p-8 max-w-6xl mx-auto">
      <Link
        href="/client"
        className="inline-flex items-center gap-1.5 text-xs text-ink-500 hover:text-ink-700 mb-8"
      >
        <ArrowLeftIcon className="w-3.5 h-3.5" /> Mis proyectos
      </Link>
      <div className="py-14 text-center">
        <p className="text-sm text-error-400">{message}</p>
        <p className="text-xs text-ink-500 mt-1">Verificá que el servidor esté corriendo.</p>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ClientProjectDetailPage() {
  const { id } = useParams<{ id: string }>();

  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    projects
      .getById(id)
      .then(setProject)
      .catch((err) =>
        setError(err instanceof ApiError ? err.message : "No se pudo cargar el proyecto")
      )
      .finally(() => setLoading(false));
  }, [id]);

  function handleFolderRenamed(folderId: string, newName: string) {
    setProject((prev) =>
      prev
        ? { ...prev, folders: prev.folders.map((f) => f.id === folderId ? { ...f, name: newName } : f) }
        : null
    );
  }

  if (loading)           return <ProjectLoadingSkeleton />;
  if (error || !project) return <ErrorState message={error ?? "Proyecto no encontrado"} />;

  const totalAssets =
    project.assets.length +
    project.folders.reduce((sum, f) => sum + f.assets.length, 0);

  return (
    <div className="p-8 max-w-6xl mx-auto">

      {/* Breadcrumb */}
      <Link
        href="/client"
        className="inline-flex items-center gap-1.5 text-xs text-ink-500 hover:text-ink-700 transition-colors duration-150 mb-6"
      >
        <ArrowLeftIcon className="w-3.5 h-3.5" />
        Mis proyectos
      </Link>

      {/* Encabezado */}
      <div className="mb-4">
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-2xl font-semibold text-ink-950 leading-tight">
            {project.name}
          </h1>
          <span className={cn(
            patterns.badge,
            projectStatusStyles[project.status].className,
            "text-xs px-2 py-0.5"
          )}>
            {projectStatusStyles[project.status].label}
          </span>
        </div>

        <p className={cn(patterns.metaInline, "mt-1.5")}>
          <span>Actualizado {formatRelative(project.updatedAt)}</span>
          {totalAssets > 0 && (
            <>
              <span>·</span>
              <span>{totalAssets} {totalAssets === 1 ? "archivo" : "archivos"}</span>
            </>
          )}
        </p>
      </div>

      {/* Panel de acción según estado */}
      <ReviewPanel
        status={project.status}
        projectId={project.id}
        onUpdated={(s) => setProject((p) => p ? { ...p, status: s } : null)}
      />

      {/* Grid de archivos */}
      <div className={patterns.sectionGap}>
        <FileGrid
          projectId={project.id}
          folders={project.folders}
          rootAssets={project.assets}
          onFolderRenamed={handleFolderRenamed}
        />
      </div>

    </div>
  );
}
